import json
from datetime import datetime

from fastapi import FastAPI, HTTPException, Query, Depends
from sqlalchemy.orm import Session

from app.db import check_db_connection, get_db
from app.faceit_client import get_player_by_nickname, FaceitAPIError
from app.init_db import init_db
from app.match_service import get_player_matches, get_match_stats
from app.models import Player, Match, PlayerSummary, PlayerIngestionState
from app.summary_service import build_player_summary
from app.dashboard_service import (
    get_recent_matches_data,
    get_maps_data,
    get_session_data,
    get_tilt_detection_data,
    build_dashboard
)

app = FastAPI(title="Tiltmeter API")


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
def root():
    return {"message": "Tiltmeter backend is running"}


@app.get("/health")
def health():
    db_ok = check_db_connection()
    return {
        "status": "ok" if db_ok else "degraded",
        "database": "connected" if db_ok else "disconnected"
    }


@app.get("/players/search")
async def search_player(
    nickname: str = Query(..., min_length=1, description="Faceit nickname"),
    db: Session = Depends(get_db)
):
    try:
        player = await get_player_by_nickname(nickname)

        cs2 = player.get("games", {}).get("cs2", {})

        existing_player = db.query(Player).filter(
            Player.faceit_player_id == player.get("player_id")
        ).first()

        if existing_player:
            existing_player.nickname = player.get("nickname")
            existing_player.country = player.get("country")
            existing_player.game = "cs2"
            existing_player.region = cs2.get("region")
            existing_player.skill_level = cs2.get("skill_level")
            existing_player.faceit_elo = cs2.get("faceit_elo")
            existing_player.game_player_id = cs2.get("game_player_id")
            existing_player.game_player_name = cs2.get("game_player_name")
            existing_player.faceit_url = player.get("faceit_url")
            existing_player.avatar = player.get("avatar")
        else:
            new_player = Player(
                faceit_player_id=player.get("player_id"),
                nickname=player.get("nickname"),
                country=player.get("country"),
                game="cs2",
                region=cs2.get("region"),
                skill_level=cs2.get("skill_level"),
                faceit_elo=cs2.get("faceit_elo"),
                game_player_id=cs2.get("game_player_id"),
                game_player_name=cs2.get("game_player_name"),
                faceit_url=player.get("faceit_url"),
                avatar=player.get("avatar"),
            )
            db.add(new_player)

        db.commit()

        return {
            "player_id": player.get("player_id"),
            "nickname": player.get("nickname"),
            "country": player.get("country"),
            "game": "cs2",
            "region": cs2.get("region"),
            "skill_level": cs2.get("skill_level"),
            "faceit_elo": cs2.get("faceit_elo"),
            "game_player_id": cs2.get("game_player_id"),
            "game_player_name": cs2.get("game_player_name"),
            "faceit_url": player.get("faceit_url"),
            "avatar": player.get("avatar")
        }
    except FaceitAPIError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


async def enrich_match_rows(player_id: str, matches: list[Match], db: Session) -> int:
    updated = 0

    for match in matches:
        stats_data = await get_match_stats(match.match_id)

        rounds = stats_data.get("rounds", [])
        if not rounds:
            continue

        round_data = rounds[0]
        match_stats = round_data.get("round_stats", {})
        teams = round_data.get("teams", [])

        if not match.map_name:
            match.map_name = match_stats.get("Map")

        found_player = None

        for team in teams:
            for player in team.get("players", []):
                if player.get("player_id") == player_id:
                    found_player = player
                    break
            if found_player:
                break

        if not found_player:
            continue

        player_stats = found_player.get("player_stats", {})

        kills = int(player_stats.get("Kills", 0))
        deaths = int(player_stats.get("Deaths", 0))
        assists = int(player_stats.get("Assists", 0))

        match.kills = kills
        match.deaths = deaths
        match.assists = assists
        match.kd = round(kills / deaths, 2) if deaths else float(kills)

        updated += 1

    db.commit()
    return updated


@app.get("/players/{player_id}/dashboard")
def get_player_dashboard(
    player_id: str,
    db: Session = Depends(get_db)
):
    dashboard = build_dashboard(db, player_id)

    if not dashboard:
        raise HTTPException(status_code=404, detail="Player not found")

    return dashboard


@app.get("/players/{player_id}/matches/recent")
def get_recent_matches(
    player_id: str,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    return get_recent_matches_data(db, player_id, limit=limit)


@app.post("/players/{player_id}/matches/refresh")
async def refresh_matches(
    player_id: str,
    limit: int = Query(50, ge=1, le=100),
    mode: str = Query("incremental", pattern="^(incremental|full)$"),
    db: Session = Depends(get_db)
):
    state = db.query(PlayerIngestionState).filter(
        PlayerIngestionState.player_id == player_id
    ).first()

    from_ts = None
    if mode == "incremental" and state:
        from_ts = state.last_history_from_ts

    data = await get_player_matches(player_id, limit=limit, from_ts=from_ts)
    items = data.get("items", [])

    loaded = 0
    inserted = 0
    updated = 0
    skipped = 0
    new_match_ids = []

    max_finished_at = None

    for m in items:
        match_id = m.get("match_id")
        teams = m.get("teams", {})
        winner = m.get("results", {}).get("winner")
        score = m.get("results", {}).get("score", {})

        finished = m.get("finished_at")
        if finished:
            if max_finished_at is None or finished > max_finished_at:
                max_finished_at = finished

        player_faction = None

        for faction_name, faction_data in teams.items():
            players = faction_data.get("players", [])
            if any(p.get("player_id") == player_id for p in players):
                player_faction = faction_name
                break

        if not player_faction:
            skipped += 1
            continue

        team_score = score.get(player_faction)

        enemy_faction = None
        for faction_name in teams.keys():
            if faction_name != player_faction:
                enemy_faction = faction_name
                break

        enemy_score = score.get(enemy_faction) if enemy_faction else None
        result = "WIN" if winner == player_faction else "LOSS"

        existing = db.query(Match).filter(Match.match_id == match_id).first()

        if existing:
            if mode == "full":
                existing.game_id = m.get("game_id")
                existing.region = m.get("region")
                existing.competition_name = m.get("competition_name")
                existing.game_mode = m.get("game_mode")
                existing.status = m.get("status")
                existing.started_at = m.get("started_at")
                existing.finished_at = m.get("finished_at")
                existing.team_faction = player_faction
                existing.result = result
                existing.team_score = team_score
                existing.enemy_score = enemy_score
                updated += 1
            else:
                skipped += 1
        else:
            match = Match(
                match_id=match_id,
                player_id=player_id,
                game_id=m.get("game_id"),
                region=m.get("region"),
                competition_name=m.get("competition_name"),
                game_mode=m.get("game_mode"),
                status=m.get("status"),
                started_at=m.get("started_at"),
                finished_at=m.get("finished_at"),
                team_faction=player_faction,
                result=result,
                team_score=team_score,
                enemy_score=enemy_score,
            )
            db.add(match)
            inserted += 1
            new_match_ids.append(match_id)

        loaded += 1

    db.commit()

    if max_finished_at is not None:
        if not state:
            state = PlayerIngestionState(
                player_id=player_id,
                last_history_from_ts=max_finished_at,
                last_refresh_at=datetime.utcnow()
            )
            db.add(state)
        else:
            state.last_history_from_ts = max_finished_at
            state.last_refresh_at = datetime.utcnow()

        db.commit()

    return {
        "matches_loaded": loaded,
        "inserted": inserted,
        "updated": updated,
        "skipped": skipped,
        "mode": mode,
        "from_ts": from_ts,
        "new_match_ids": new_match_ids
    }


@app.post("/players/{player_id}/matches/enrich")
async def enrich_matches(
    player_id: str,
    only_missing: bool = Query(True),
    db: Session = Depends(get_db)
):
    query = db.query(Match).filter(Match.player_id == player_id)

    if only_missing:
        query = query.filter(Match.kills.is_(None))

    matches = query.all()

    updated = await enrich_match_rows(player_id, matches, db)

    return {
        "matches_selected": len(matches),
        "matches_enriched": updated,
        "only_missing": only_missing
    }


@app.get("/players/{player_id}/summary")
def get_player_summary(
    player_id: str,
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    summary = build_player_summary(db, player_id, limit)

    if not summary:
        raise HTTPException(status_code=404, detail="No matches found")

    return summary


@app.post("/players/{player_id}/summary/materialize")
def materialize_player_summary(
    player_id: str,
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    summary = build_player_summary(db, player_id, limit)

    if not summary:
        raise HTTPException(status_code=404, detail="No matches found")

    row = PlayerSummary(
        player_id=summary["player_id"],
        window_size=summary["window_size"],
        matches_analyzed=summary["matches_analyzed"],
        winrate=summary["winrate"],
        avg_kd=summary["avg_kd"],
        avg_kills=summary["avg_kills"],
        avg_deaths=summary["avg_deaths"],
        avg_assists=summary["avg_assists"],
        current_streak=summary["current_streak"],
        best_map=summary["best_map"],
        worst_map=summary["worst_map"],
        form_score=summary["form_score"],
        form_label=summary["form_label"],
        tilt_level=summary["tilt_level"],
        last_results=json.dumps(summary["last_results"])
    )

    db.add(row)
    db.commit()
    db.refresh(row)

    return {
        "message": "summary materialized",
        "summary_id": row.id,
        "player_id": row.player_id,
        "window_size": row.window_size,
        "created_at": row.created_at
    }


@app.get("/players/{player_id}/summary/latest")
def get_latest_materialized_summary(
    player_id: str,
    window_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    summary = (
        db.query(PlayerSummary)
        .filter(
            PlayerSummary.player_id == player_id,
            PlayerSummary.window_size == window_size
        )
        .order_by(PlayerSummary.created_at.desc())
        .first()
    )

    if not summary:
        raise HTTPException(status_code=404, detail="No materialized summary found")

    return {
        "id": summary.id,
        "player_id": summary.player_id,
        "window_size": summary.window_size,
        "matches_analyzed": summary.matches_analyzed,
        "winrate": summary.winrate,
        "avg_kd": summary.avg_kd,
        "avg_kills": summary.avg_kills,
        "avg_deaths": summary.avg_deaths,
        "avg_assists": summary.avg_assists,
        "current_streak": summary.current_streak,
        "last_results": json.loads(summary.last_results) if summary.last_results else [],
        "best_map": summary.best_map,
        "worst_map": summary.worst_map,
        "form_score": summary.form_score,
        "form_label": summary.form_label,
        "tilt_level": summary.tilt_level,
        "created_at": summary.created_at
    }


@app.get("/players/{player_id}/form-history")
def get_form_history(
    player_id: str,
    window_size: int = Query(10, ge=1, le=100),
    limit: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    summaries = (
        db.query(PlayerSummary)
        .filter(
            PlayerSummary.player_id == player_id,
            PlayerSummary.window_size == window_size
        )
        .order_by(PlayerSummary.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "date": s.created_at,
            "form_score": s.form_score,
            "tilt_level": s.tilt_level
        }
        for s in reversed(summaries)
    ]


@app.get("/players/{player_id}/maps")
def get_player_maps(
    player_id: str,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    maps = get_maps_data(db, player_id, limit=limit)

    if not maps:
        raise HTTPException(status_code=404, detail="No matches found")

    return maps


@app.get("/players/{player_id}/tilt-detection")
def detect_tilt(
    player_id: str,
    recent_limit: int = Query(5, ge=3, le=20),
    baseline_limit: int = Query(20, ge=5, le=100),
    db: Session = Depends(get_db)
):
    tilt = get_tilt_detection_data(
        db,
        player_id,
        recent_limit=recent_limit,
        baseline_limit=baseline_limit
    )

    if not tilt:
        raise HTTPException(status_code=404, detail="Not enough matches for tilt detection")

    return {
        "player_id": player_id,
        **tilt
    }


@app.get("/players/{player_id}/session")
def detect_current_session(
    player_id: str,
    gap_minutes: int = Query(60, ge=15, le=180),
    db: Session = Depends(get_db)
):
    session = get_session_data(db, player_id, gap_minutes=gap_minutes)

    if not session:
        raise HTTPException(status_code=404, detail="No matches found")

    return {
        "player_id": player_id,
        **session
    }


@app.post("/players/{player_id}/analyze")
async def analyze_player(
    player_id: str,
    match_limit: int = Query(50, ge=1, le=100),
    summary_limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    state = db.query(PlayerIngestionState).filter(
        PlayerIngestionState.player_id == player_id
    ).first()

    from_ts = state.last_history_from_ts if state else None

    data = await get_player_matches(player_id, limit=match_limit, from_ts=from_ts)
    items = data.get("items", [])

    inserted = 0
    updated = 0
    skipped = 0
    new_match_ids = []
    max_finished_at = None

    for m in items:
        match_id = m.get("match_id")
        teams = m.get("teams", {})
        winner = m.get("results", {}).get("winner")
        score = m.get("results", {}).get("score", {})

        finished = m.get("finished_at")
        if finished:
            if max_finished_at is None or finished > max_finished_at:
                max_finished_at = finished

        player_faction = None

        for faction_name, faction_data in teams.items():
            players = faction_data.get("players", [])
            if any(p.get("player_id") == player_id for p in players):
                player_faction = faction_name
                break

        if not player_faction:
            skipped += 1
            continue

        team_score = score.get(player_faction)

        enemy_faction = None
        for faction_name in teams.keys():
            if faction_name != player_faction:
                enemy_faction = faction_name
                break

        enemy_score = score.get(enemy_faction) if enemy_faction else None
        result = "WIN" if winner == player_faction else "LOSS"

        existing = db.query(Match).filter(Match.match_id == match_id).first()

        if existing:
            skipped += 1
        else:
            match = Match(
                match_id=match_id,
                player_id=player_id,
                game_id=m.get("game_id"),
                region=m.get("region"),
                competition_name=m.get("competition_name"),
                game_mode=m.get("game_mode"),
                status=m.get("status"),
                started_at=m.get("started_at"),
                finished_at=m.get("finished_at"),
                team_faction=player_faction,
                result=result,
                team_score=team_score,
                enemy_score=enemy_score,
            )
            db.add(match)
            inserted += 1
            new_match_ids.append(match_id)

    db.commit()

    if max_finished_at is not None:
        if not state:
            state = PlayerIngestionState(
                player_id=player_id,
                last_history_from_ts=max_finished_at,
                last_refresh_at=datetime.utcnow()
            )
            db.add(state)
        else:
            state.last_history_from_ts = max_finished_at
            state.last_refresh_at = datetime.utcnow()

        db.commit()

    new_matches = []
    if new_match_ids:
        new_matches = (
            db.query(Match)
            .filter(Match.player_id == player_id, Match.match_id.in_(new_match_ids))
            .all()
        )

    enriched = await enrich_match_rows(player_id, new_matches, db) if new_matches else 0

    summary = build_player_summary(db, player_id, summary_limit)

    if not summary:
        raise HTTPException(status_code=404, detail="No matches found for summary")

    row = PlayerSummary(
        player_id=summary["player_id"],
        window_size=summary["window_size"],
        matches_analyzed=summary["matches_analyzed"],
        winrate=summary["winrate"],
        avg_kd=summary["avg_kd"],
        avg_kills=summary["avg_kills"],
        avg_deaths=summary["avg_deaths"],
        avg_assists=summary["avg_assists"],
        current_streak=summary["current_streak"],
        best_map=summary["best_map"],
        worst_map=summary["worst_map"],
        form_score=summary["form_score"],
        form_label=summary["form_label"],
        tilt_level=summary["tilt_level"],
        last_results=json.dumps(summary["last_results"])
    )

    db.add(row)
    db.commit()
    db.refresh(row)

    return {
        "message": "analyze pipeline completed",
        "refresh": {
            "matches_seen": len(items),
            "inserted": inserted,
            "updated": updated,
            "skipped": skipped,
            "new_match_ids": new_match_ids,
            "from_ts": from_ts
        },
        "enrich": {
            "matches_enriched": enriched
        },
        "summary": {
            "summary_id": row.id,
            "window_size": row.window_size,
            "form_score": row.form_score,
            "form_label": row.form_label,
            "tilt_level": row.tilt_level,
            "created_at": row.created_at
        }
    }