import LabelBadge from "@/components/LabelBadge";
import Stat from "@/components/Stat";
import type { SummaryInfo } from "@/lib/types";
import { describeFormLabel, describeRisk } from "@/lib/ux";

interface FormSummaryCardProps {
  summary: SummaryInfo;
}

export default function FormSummaryCard({ summary }: FormSummaryCardProps) {
  const formText = describeFormLabel(summary.form_label);
  const tiltText = describeRisk(summary.tilt_level, "tilt");

  return (
    <section className="card">
      <div className="sectionHeader">
        <h3>Form Summary</h3>
        <p className="muted">Your medium-term performance trend based on recent match history.</p>
      </div>
      <div className="rowGap">
        <LabelBadge value={summary.form_label} kind="form" />
        <LabelBadge value={summary.tilt_level} kind="tilt" />
      </div>
      <p className="sectionExplain">
        {formText}. {tiltText}.
      </p>
      <div className="statsGrid threeCols">
        <Stat label="Form score" value={summary.form_score} />
        <Stat label="Winrate" value={`${summary.winrate}%`} />
        <Stat label="Avg K/D" value={summary.avg_kd} />
        <Stat label="Current streak" value={summary.current_streak} />
        <Stat label="Best map" value={summary.best_map ?? "N/A"} />
        <Stat label="Worst map" value={summary.worst_map ?? "N/A"} />
      </div>
    </section>
  );
}
