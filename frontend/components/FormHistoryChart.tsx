import type { FormHistoryPoint } from "@/lib/types";

interface FormHistoryChartProps {
  points: FormHistoryPoint[];
}

const CHART_WIDTH = 860;
const CHART_HEIGHT = 240;
const PADDING_X = 24;
const PADDING_Y = 24;

function formatAxisDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function FormHistoryChart({ points }: FormHistoryChartProps) {
  const validPoints = points.filter((point) => typeof point.form_score === "number");

  if (validPoints.length < 2) {
    return null;
  }

  const scores = validPoints.map((point) => point.form_score as number);
  const rawMinScore = Math.min(...scores);
  const rawMaxScore = Math.max(...scores);
  const variance = rawMaxScore - rawMinScore;
  const isStableTrend = variance <= 0.3;

  // Add padding so near-flat trends stay visible.
  const minY = rawMinScore - 1;
  const maxY = rawMaxScore + 1;
  const scoreRange = Math.max(0.5, maxY - minY);

  const innerWidth = CHART_WIDTH - PADDING_X * 2;
  const innerHeight = CHART_HEIGHT - PADDING_Y * 2;

  const coordinates = validPoints.map((point, index) => {
    const x = PADDING_X + (index / Math.max(1, validPoints.length - 1)) * innerWidth;
    const normalized = ((point.form_score as number) - minY) / scoreRange;
    const y = CHART_HEIGHT - PADDING_Y - normalized * innerHeight;
    return { x, y, score: point.form_score as number, date: point.date };
  });

  const linePath = coordinates.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
  const areaPath = `${linePath} L${coordinates[coordinates.length - 1].x} ${CHART_HEIGHT - PADDING_Y} L${coordinates[0].x} ${CHART_HEIGHT - PADDING_Y} Z`;

  return (
    <section className="card">
      <div className="sectionHeader">
        <h3>Form Score Trend</h3>
        <p className="muted">How your form has changed across recent analysis snapshots.</p>
      </div>
      {isStableTrend ? <p className="chartStableLabel">Form is currently stable</p> : null}

      <div className="chartWrap">
        <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="chartSvg" role="img" aria-label="Form score trend chart">
          <defs>
            <linearGradient id="formAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(82, 181, 255, 0.38)" />
              <stop offset="100%" stopColor="rgba(82, 181, 255, 0)" />
            </linearGradient>
          </defs>

          <line x1={PADDING_X} y1={CHART_HEIGHT - PADDING_Y} x2={CHART_WIDTH - PADDING_X} y2={CHART_HEIGHT - PADDING_Y} className="chartAxis" />
          <line x1={PADDING_X} y1={PADDING_Y} x2={PADDING_X} y2={CHART_HEIGHT - PADDING_Y} className="chartAxis" />

          <path d={areaPath} className="chartArea" />
          <path d={linePath} className="chartLine" />

          {coordinates.map((point) => (
            <circle key={`${point.date}-${point.x}`} cx={point.x} cy={point.y} r="3.2" className="chartDot">
              <title>{`${new Date(point.date).toLocaleString()}: ${point.score.toFixed(1)}`}</title>
            </circle>
          ))}
        </svg>
      </div>

      <div className="chartFooter">
        <span>Start: {formatAxisDate(validPoints[0].date)}</span>
        <span>Latest: {formatAxisDate(validPoints[validPoints.length - 1].date)}</span>
        <span>Range: {rawMinScore.toFixed(1)} to {rawMaxScore.toFixed(1)}</span>
      </div>
    </section>
  );
}
