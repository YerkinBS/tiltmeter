import os
import httpx

FACEIT_API_KEY = os.getenv("FACEIT_API_KEY")
FACEIT_BASE_URL = "https://open.faceit.com/data/v4"


async def get_player_matches(player_id: str, limit: int = 20, from_ts: int | None = None) -> dict:
    url = f"{FACEIT_BASE_URL}/players/{player_id}/history"

    headers = {
        "Authorization": f"Bearer {FACEIT_API_KEY}"
    }

    params = {
        "game": "cs2",
        "limit": limit
    }

    if from_ts is not None:
        params["from"] = from_ts

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url, headers=headers, params=params)
        response.raise_for_status()

    return response.json()


async def get_match_stats(match_id: str) -> dict:
    url = f"{FACEIT_BASE_URL}/matches/{match_id}/stats"

    headers = {
        "Authorization": f"Bearer {FACEIT_API_KEY}"
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()

    return response.json()