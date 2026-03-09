import type { RecentMatch } from "@/lib/types";

interface SessionMomentumCardProps {
  matches: RecentMatch[];
}

function getWindowWinrate(matches: RecentMatch[]): number {
  const decided = matches.filter((match) => match.result === "WIN" || match.result === "LOSS");
  if (decided.length === 0) {
    return 0;
  }

  const wins = decided.filter((match) => match.result === "WIN").length;
  return Math.round((wins / decided.length) * 100);
}

function getMomentumLabel(winrate: number): string {
  if (winrate >= 60) {
    return "Momentum: positive";
  }

  if (winrate >= 40) {
    return "Momentum: mixed";
  }

  return "Momentum: negative";
}

function getStreakText(matches: RecentMatch[]): string {
  if (matches.length === 0) {
    return "No streak yet";
  }

  const latest = matches[0].result;
  if (latest !== "WIN" && latest !== "LOSS") {
    return "No streak yet";
  }

  let count = 0;
  for (const match of matches) {
    if (match.result === latest) {
      count += 1;
    } else {
      break;
    }
  }

  return latest === "WIN" ? `Current streak: ${count} win${count > 1 ? "s" : ""}` : `Current streak: ${count} loss${count > 1 ? "es" : ""}`;
}

export default function SessionMomentumCard({ matches }: SessionMomentumCardProps) {
  const recent = matches.slice(0, 8);
  const streakText = getStreakText(recent);
  const windowWinrate = getWindowWinrate(recent);
  const momentumLabel = getMomentumLabel(windowWinrate);

  return (
    <section className="card sessionMomentumCard">
      <div className="sectionHeader">
        <h3>Session Momentum</h3>
        <p className="muted">Last {recent.length || 8} matches</p>
      </div>

      <div className="momentumDots" aria-label="Session momentum">
        {recent.length === 0 ? (
          <span className="muted">No recent matches</span>
        ) : (
          recent.map((match) => (
            <span
              key={match.match_id}
              className={`momentumDot ${
                match.result === "WIN" ? "momentumDotWin" : match.result === "LOSS" ? "momentumDotLoss" : "momentumDotNeutral"
              }`}
              title={`${match.map_name ?? "Unknown map"} | ${match.team_score ?? "-"}:${match.enemy_score ?? "-"}`}
            />
          ))
        )}
      </div>

      <p className="momentumMeta">Recent winrate: {windowWinrate}%</p>
      <p className="momentumMeta">{momentumLabel}</p>
      <p className="momentumStreak">{streakText}</p>
    </section>
  );
}
