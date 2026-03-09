import LabelBadge from "@/components/LabelBadge";
import { getTiltPrediction } from "@/lib/ux";
import type { TiltDetectionInfo } from "@/lib/types";

interface TiltPredictionCardProps {
  tiltDetection: TiltDetectionInfo;
}

export default function TiltPredictionCard({ tiltDetection }: TiltPredictionCardProps) {
  const prediction = getTiltPrediction({
    tiltScore: tiltDetection.tilt_score,
    lossStreak: tiltDetection.signals.loss_streak,
    kdDropVsBaseline: tiltDetection.signals.kd_drop_vs_baseline,
    winrateDropVsBaseline: tiltDetection.signals.winrate_drop_vs_baseline
  });

  return (
    <section className="card tiltPredictionCard">
      <div className="sectionHeader">
        <h3>Tilt Prediction</h3>
        <p className="muted">Heuristic estimate for the next match.</p>
      </div>
      <div className="rowGap">
        <LabelBadge value={prediction.level} kind="tilt" />
      </div>
      <p className="predictionValue">Tilt risk next match: {prediction.riskPercent}%</p>
      <p className="sectionExplain">{prediction.explanation}</p>
    </section>
  );
}
