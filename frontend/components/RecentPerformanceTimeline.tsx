import type { RecentMatch } from "@/lib/types";

interface RecentPerformanceTimelineProps {
  matches: RecentMatch[];
}

function getTooltip(match: RecentMatch): string {
  const map = match.map_name ?? "Unknown map";
  const score = `${match.team_score ?? "-"}:${match.enemy_score ?? "-"}`;
  const kd = match.kd ?? "-";
  return `${map}\n${score}\nK/D ${kd}`;
}

export default function RecentPerformanceTimeline({ matches }: RecentPerformanceTimelineProps) {
  if (matches.length === 0) {
    return null;
  }

  return (
    <section className="card timelineCard">
      <div className="sectionHeader">
        <h3>Recent Performance Timeline</h3>
        <p className="muted">Quick view of your latest match outcomes.</p>
      </div>

      <div className="timelineDots" aria-label="Recent match timeline">
        {matches.slice(0, 15).map((match) => (
          <span
            key={match.match_id}
            className={`timelineDot ${
              match.result === "WIN" ? "timelineDotWin" : match.result === "LOSS" ? "timelineDotLoss" : "timelineDotNeutral"
            }`}
            title={getTooltip(match)}
            aria-label={getTooltip(match)}
          />
        ))}
      </div>
    </section>
  );
}
