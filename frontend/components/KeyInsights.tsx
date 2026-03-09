import { describeFormLabel, describeRisk, describeTiltDetection } from "@/lib/ux";
import type { DashboardResponse } from "@/lib/types";

interface KeyInsightsProps {
  dashboard: DashboardResponse;
}

export default function KeyInsights({ dashboard }: KeyInsightsProps) {
  const formInsight = `Form outlook: ${describeFormLabel(dashboard.summary.form_label)}.`;
  const sessionInsight = `${describeRisk(dashboard.session.tilt_risk, "session")}.`;
  const tiltInsight = `${describeTiltDetection(
    dashboard.tilt_detection.tilt_detected,
    dashboard.tilt_detection.tilt_severity
  )}.`;
  const mapInsight = dashboard.summary.best_map
    ? `Top recent map: ${dashboard.summary.best_map}.`
    : "Top recent map is not available yet.";

  const insights = [formInsight, sessionInsight, tiltInsight, mapInsight];
  const overallReading =
    dashboard.tilt_detection.tilt_score >= 60 || dashboard.session.tilt_risk.toUpperCase() === "HIGH"
      ? "Overall reading: caution advised before continuing queue."
      : "Overall reading: stable and safe to continue.";

  return (
    <section className="card insightsCard">
      <div className="sectionHeader">
        <h3>Key Insights</h3>
        <p className="muted">Executive summary of your recent performance profile.</p>
      </div>
      <ul className="insightsList">
        {insights.map((insight) => (
          <li key={insight}>{insight}</li>
        ))}
      </ul>
      <p className="insightsFooter">{overallReading}</p>
    </section>
  );
}
