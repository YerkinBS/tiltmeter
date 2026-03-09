from fastapi import FastAPI, HTTPException, Query, Depends
from sqlalchemy.orm import Session

from app.db import check_db_connection, get_db
from app.faceit_client import get_player_by_nickname, FaceitAPIError
from app.init_db import init_db
from app.models import Player

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