from app.models import Match


def build_player_summary(db, player_id: str, limit: int) -> dict:
    matches = (
        db.query(Match)
        .filter(Match.player_id == player_id)
        .order_by(Match.finished_at.desc())
        .limit(limit)
        .all()
    )

    if not matches:
        return {}

    total = len(matches)

    wins = sum(1 for m in matches if m.result == "WIN")
    winrate = round((wins / total) * 100, 2)

    total_kills = sum(m.kills or 0 for m in matches)
    total_deaths = sum(m.deaths or 0 for m in matches)
    total_assists = sum(m.assists or 0 for m in matches)

    avg_kills = round(total_kills / total, 2)
    avg_deaths = round(total_deaths / total, 2)
    avg_assists = round(total_assists / total, 2)
    avg_kd = round(total_kills / total_deaths, 2) if total_deaths else float(total_kills)

    last_results = ["W" if m.result == "WIN" else "L" for m in matches]

    streak = 0
    first_result = matches[0].result

    for m in matches:
        if m.result == first_result:
            streak += 1
        else:
            break

    if first_result == "LOSS":
        streak = -streak

    map_stats = {}

    for m in matches:
        if not m.map_name:
            continue

        if m.map_name not in map_stats:
            map_stats[m.map_name] = {"matches": 0, "wins": 0}

        map_stats[m.map_name]["matches"] += 1

        if m.result == "WIN":
            map_stats[m.map_name]["wins"] += 1

    best_map = None
    worst_map = None

    if map_stats:
        map_results = []

        for map_name, stats in map_stats.items():
            map_winrate = (stats["wins"] / stats["matches"]) * 100
            map_results.append({
                "map_name": map_name,
                "matches": stats["matches"],
                "winrate": round(map_winrate, 2)
            })

        best_map = max(map_results, key=lambda x: x["winrate"])["map_name"]
        worst_map = min(map_results, key=lambda x: x["winrate"])["map_name"]

    def normalize_kd(kd: float):
        if kd <= 0.7:
            return 0
        if kd >= 1.3:
            return 100
        return (kd - 0.7) / (1.3 - 0.7) * 100

    def normalize_streak(s: int):
        if s <= -5:
            return 0
        if s >= 5:
            return 100
        return (s + 5) / 10 * 100

    winrate_score = winrate
    kd_score = normalize_kd(avg_kd)
    streak_score = normalize_streak(streak)
    activity_score = min(total / limit * 100, 100)

    form_score = round(
        0.45 * winrate_score +
        0.30 * kd_score +
        0.15 * streak_score +
        0.10 * activity_score,
        2
    )

    if form_score >= 80:
        form_label = "HOT"
        tilt_level = "LOW"
    elif form_score >= 60:
        form_label = "GOOD"
        tilt_level = "LOW"
    elif form_score >= 40:
        form_label = "STABLE"
        tilt_level = "MEDIUM"
    elif form_score >= 20:
        form_label = "COLD"
        tilt_level = "MEDIUM"
    else:
        form_label = "TILT"
        tilt_level = "HIGH"

    return {
        "player_id": player_id,
        "window_size": limit,
        "matches_analyzed": total,
        "winrate": winrate,
        "avg_kd": avg_kd,
        "avg_kills": avg_kills,
        "avg_deaths": avg_deaths,
        "avg_assists": avg_assists,
        "current_streak": streak,
        "last_results": last_results,
        "best_map": best_map,
        "worst_map": worst_map,
        "form_score": form_score,
        "form_label": form_label,
        "tilt_level": tilt_level
    }