import os
import httpx


FACEIT_BASE_URL = "https://open.faceit.com/data/v4"
FACEIT_API_KEY = os.getenv("FACEIT_API_KEY")


class FaceitAPIError(Exception):
    pass


async def get_player_by_nickname(nickname: str) -> dict:
    if not FACEIT_API_KEY:
        raise FaceitAPIError("FACEIT_API_KEY is not set")

    url = f"{FACEIT_BASE_URL}/players"
    headers = {
        "Authorization": f"Bearer {FACEIT_API_KEY}"
    }
    params = {
        "nickname": nickname
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(url, headers=headers, params=params)

    if response.status_code == 404:
        raise FaceitAPIError("Player not found")

    if response.status_code == 401:
        raise FaceitAPIError("Unauthorized: invalid FACEIT API key")

    if response.status_code != 200:
        raise FaceitAPIError(
            f"Faceit API error: {response.status_code} - {response.text}"
        )

    return response.json()