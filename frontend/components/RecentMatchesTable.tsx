import LabelBadge from "@/components/LabelBadge";
import type { RecentMatch } from "@/lib/types";

interface RecentMatchesTableProps {
  matches: RecentMatch[];
}

function formatFinishedAt(unixTs: number | null): string {
  if (!unixTs) {
    return "-";
  }

  return new Date(unixTs * 1000).toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatScore(teamScore: number | null, enemyScore: number | null): string {
  if (teamScore === null && enemyScore === null) {
    return "-";
  }

  return `${teamScore ?? "-"} : ${enemyScore ?? "-"}`;
}

export default function RecentMatchesTable({ matches }: RecentMatchesTableProps) {
  return (
    <section className="card">
      <div className="sectionHeader">
        <h3>Recent Matches</h3>
        <p className="muted">Chronological match log with scoreline and individual impact metrics.</p>
      </div>
      {matches.length === 0 ? (
        <p className="emptyLine">No recent matches yet.</p>
      ) : (
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Result</th>
                <th>Map</th>
                <th>Score</th>
                <th>K</th>
                <th>D</th>
                <th>A</th>
                <th>K/D</th>
                <th>Finished</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <tr key={match.match_id} className="matchRow">
                  <td>
                    <LabelBadge value={match.result} kind="result" />
                  </td>
                  <td className="mapCell" title={match.map_name ?? "Unknown"}>
                    {match.map_name ?? "Unknown"}
                  </td>
                  <td className="scoreCell">{formatScore(match.team_score, match.enemy_score)}</td>
                  <td>{match.kills ?? "-"}</td>
                  <td>{match.deaths ?? "-"}</td>
                  <td>{match.assists ?? "-"}</td>
                  <td>{match.kd ?? "-"}</td>
                  <td>{formatFinishedAt(match.finished_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
