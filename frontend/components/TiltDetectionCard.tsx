import LabelBadge from "@/components/LabelBadge";
import Stat from "@/components/Stat";
import type { TiltDetectionInfo } from "@/lib/types";
import { describeRisk, describeTiltDetection } from "@/lib/ux";

interface TiltDetectionCardProps {
  tilt: TiltDetectionInfo;
}

export default function TiltDetectionCard({ tilt }: TiltDetectionCardProps) {
  const tiltText = describeRisk(tilt.tilt_severity, "tilt");
  const detectionText = describeTiltDetection(tilt.tilt_detected, tilt.tilt_severity);

  return (
    <section className="card">
      <div className="sectionHeader">
        <h3>Tilt Detection</h3>
        <p className="muted">Signal-based assessment of whether recent results indicate tilt behavior.</p>
      </div>
      <div className="rowGap">
        <LabelBadge value={tilt.tilt_severity} kind="tilt" />
        <span className="muted">Detected: {tilt.tilt_detected ? "Yes" : "No"}</span>
      </div>
      <p className="sectionExplain">
        {tiltText}. {detectionText}.
      </p>
      <div className="statsGrid twoCols">
        <Stat label="Tilt score" value={tilt.tilt_score} />
        <Stat label="Loss streak" value={tilt.signals.loss_streak} />
        <Stat label="Winrate drop" value={`${tilt.signals.winrate_drop_vs_baseline}%`} />
        <Stat label="K/D drop" value={tilt.signals.kd_drop_vs_baseline} />
        <Stat label="Kills drop" value={tilt.signals.kills_drop_vs_baseline} />
        <Stat label="Window" value={`${tilt.recent_window}/${tilt.baseline_window}`} />
      </div>
    </section>
  );
}
