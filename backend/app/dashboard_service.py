from app.models import Match, Player
from app.summary_service import build_player_summary


def get_recent_matches_data(db, player_id: str, limit: int = 10) -> list[dict]:
    matches = (
        db.query(Match)
        .filter(Match.player_id == player_id)
        .order_by(Match.finished_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "match_id": m.match_id,
            "map_name": m.map_name,
            "result": m.result,
            "team_score": m.team_score,
            "enemy_score": m.enemy_score,
            "kills": m.kills,
            "deaths": m.deaths,
            "assists": m.assists,
            "kd": m.kd,
            "finished_at": m.finished_at
        }
        for m in matches
    ]


def get_maps_data(db, player_id: str, limit: int = 50) -> list[dict]:
    matches = (
        db.query(Match)
        .filter(Match.player_id == player_id)
        .order_by(Match.finished_at.desc())
        .limit(limit)
        .all()
    )

    if not matches:
        return []

    map_stats = {}

    for m in matches:
        if not m.map_name:
            continue

        if m.map_name not in map_stats:
            map_stats[m.map_name] = {
                "matches": 0,
                "wins": 0,
                "kills": 0,
                "deaths": 0,
                "assists": 0
            }

        row = map_stats[m.map_name]
        row["matches"] += 1

        if m.result == "WIN":
            row["wins"] += 1

        row["kills"] += m.kills or 0
        row["deaths"] += m.deaths or 0
        row["assists"] += m.assists or 0

    result = []

    for map_name, stats in map_stats.items():
        matches_cnt = stats["matches"]
        wins = stats["wins"]
        kills = stats["kills"]
        deaths = stats["deaths"]
        assists = stats["assists"]

        avg_kills = round(kills / matches_cnt, 2) if matches_cnt else 0
        avg_deaths = round(deaths / matches_cnt, 2) if matches_cnt else 0
        avg_assists = round(assists / matches_cnt, 2) if matches_cnt else 0
        avg_kd = round(kills / deaths, 2) if deaths else float(kills)
        winrate = round((wins / matches_cnt) * 100, 2) if matches_cnt else 0

        result.append({
            "map_name": map_name,
            "matches": matches_cnt,
            "wins": wins,
            "winrate": winrate,
            "avg_kd": avg_kd,
            "avg_kills": avg_kills,
            "avg_deaths": avg_deaths,
            "avg_assists": avg_assists
        })

    result.sort(key=lambda x: (-x["winrate"], -x["matches"], -x["avg_kd"]))
    return result


def get_session_data(db, player_id: str, gap_minutes: int = 60) -> dict:
    matches = (
        db.query(Match)
        .filter(Match.player_id == player_id)
        .order_by(Match.finished_at.desc())
        .limit(50)
        .all()
    )

    if not matches:
        return {}

    session_matches = [matches[0]]

    for i in range(1, len(matches)):
        prev_match = matches[i - 1]
        current_match = matches[i]

        if prev_match.finished_at is None or current_match.finished_at is None:
            break

        gap_seconds = prev_match.finished_at - current_match.finished_at

        if gap_seconds <= gap_minutes * 60:
            session_matches.append(current_match)
        else:
            break

    session_matches.reverse()

    total = len(session_matches)
    wins = sum(1 for m in session_matches if m.result == "WIN")
    winrate = round((wins / total) * 100, 2) if total else 0

    kills = sum(m.kills or 0 for m in session_matches)
    deaths = sum(m.deaths or 0 for m in session_matches)
    avg_kd = round(kills / deaths, 2) if deaths else float(kills)

    loss_streak = 0
    for m in reversed(session_matches):
        if m.result == "LOSS":
            loss_streak += 1
        else:
            break

    session_duration = 0
    if total > 1 and session_matches[0].finished_at and session_matches[-1].finished_at:
        session_duration = (session_matches[-1].finished_at - session_matches[0].finished_at) / 60

    if loss_streak >= 3 or (winrate <= 25 and total >= 4):
        tilt_risk = "HIGH"
    elif loss_streak == 2 or winrate <= 40:
        tilt_risk = "MEDIUM"
    else:
        tilt_risk = "LOW"

    return {
        "session_matches": total,
        "session_winrate": winrate,
        "session_avg_kd": avg_kd,
        "session_loss_streak": loss_streak,
        "session_duration_minutes": round(session_duration, 1),
        "tilt_risk": tilt_risk
    }


def get_tilt_detection_data(
    db,
    player_id: str,
    recent_limit: int = 5,
    baseline_limit: int = 20
) -> dict:
    recent_matches = (
        db.query(Match)
        .filter(Match.player_id == player_id)
        .order_by(Match.finished_at.desc())
        .limit(recent_limit)
        .all()
    )

    baseline_matches = (
        db.query(Match)
        .filter(Match.player_id == player_id)
        .order_by(Match.finished_at.desc())
        .limit(baseline_limit)
        .all()
    )

    if len(recent_matches) < recent_limit or len(baseline_matches) < baseline_limit:
        return {}

    def calc_winrate(matches):
        total = len(matches)
        wins = sum(1 for m in matches if m.result == "WIN")
        return round((wins / total) * 100, 2) if total else 0

    def calc_avg_kills(matches):
        return round(sum(m.kills or 0 for m in matches) / len(matches), 2) if matches else 0

    def calc_avg_deaths(matches):
        return round(sum(m.deaths or 0 for m in matches) / len(matches), 2) if matches else 0

    def calc_avg_kd(matches):
        kills = sum(m.kills or 0 for m in matches)
        deaths = sum(m.deaths or 0 for m in matches)
        return round(kills / deaths, 2) if deaths else float(kills)

    def calc_loss_streak(matches):
        streak = 0
        for m in matches:
            if m.result == "LOSS":
                streak += 1
            else:
                break
        return streak

    recent_winrate = calc_winrate(recent_matches)
    baseline_winrate = calc_winrate(baseline_matches)

    recent_avg_kd = calc_avg_kd(recent_matches)
    baseline_avg_kd = calc_avg_kd(baseline_matches)

    recent_avg_kills = calc_avg_kills(recent_matches)
    baseline_avg_kills = calc_avg_kills(baseline_matches)

    recent_avg_deaths = calc_avg_deaths(recent_matches)
    baseline_avg_deaths = calc_avg_deaths(baseline_matches)

    loss_streak = calc_loss_streak(recent_matches)

    kd_drop = round(max(0, baseline_avg_kd - recent_avg_kd), 2)
    kills_drop = round(max(0, baseline_avg_kills - recent_avg_kills), 2)
    winrate_drop = round(max(0, baseline_winrate - recent_winrate), 2)

    tilt_score = 0

    tilt_score += min(loss_streak * 15, 45)

    if recent_winrate <= 20:
        tilt_score += 25
    elif recent_winrate <= 40:
        tilt_score += 15
    elif recent_winrate <= 50:
        tilt_score += 8

    if recent_avg_kd < 0.8:
        tilt_score += 20
    elif recent_avg_kd < 0.95:
        tilt_score += 10

    if kd_drop >= 0.3:
        tilt_score += 15
    elif kd_drop >= 0.15:
        tilt_score += 8

    if kills_drop >= 5:
        tilt_score += 10
    elif kills_drop >= 3:
        tilt_score += 5

    tilt_score = min(tilt_score, 100)

    if tilt_score >= 70:
        tilt_severity = "HIGH"
        tilt_detected = True
    elif tilt_score >= 40:
        tilt_severity = "MEDIUM"
        tilt_detected = True
    else:
        tilt_severity = "LOW"
        tilt_detected = False

    return {
        "tilt_detected": tilt_detected,
        "tilt_score": tilt_score,
        "tilt_severity": tilt_severity,
        "recent_window": recent_limit,
        "baseline_window": baseline_limit,
        "signals": {
            "loss_streak": loss_streak,
            "recent_winrate": recent_winrate,
            "baseline_winrate": baseline_winrate,
            "recent_avg_kd": recent_avg_kd,
            "baseline_avg_kd": baseline_avg_kd,
            "recent_avg_kills": recent_avg_kills,
            "baseline_avg_kills": baseline_avg_kills,
            "recent_avg_deaths": recent_avg_deaths,
            "baseline_avg_deaths": baseline_avg_deaths,
            "kd_drop_vs_baseline": kd_drop,
            "kills_drop_vs_baseline": kills_drop,
            "winrate_drop_vs_baseline": winrate_drop
        }
    }


def build_dashboard(db, player_id: str) -> dict:
    player = (
        db.query(Player)
        .filter(Player.faceit_player_id == player_id)
        .first()
    )

    if not player:
        return {}

    summary = build_player_summary(db, player_id, 20)
    session = get_session_data(db, player_id, gap_minutes=60)
    tilt = get_tilt_detection_data(db, player_id, recent_limit=5, baseline_limit=20)
    maps = get_maps_data(db, player_id, limit=50)
    recent_matches = get_recent_matches_data(db, player_id, limit=10)

    return {
        "player": {
            "player_id": player.faceit_player_id,
            "nickname": player.nickname,
            "country": player.country,
            "region": player.region,
            "skill_level": player.skill_level,
            "faceit_elo": player.faceit_elo,
            "faceit_url": player.faceit_url,
            "avatar": player.avatar
        },
        "summary": summary,
        "session": session,
        "tilt_detection": tilt,
        "maps": maps,
        "recent_matches": recent_matches
    }