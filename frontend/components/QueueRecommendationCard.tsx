import { getQueueRecommendation } from "@/lib/ux";
import type { DashboardResponse } from "@/lib/types";

interface QueueRecommendationCardProps {
  dashboard: DashboardResponse;
}

export default function QueueRecommendationCard({ dashboard }: QueueRecommendationCardProps) {
  const recommendation = getQueueRecommendation({
    tiltLevel: dashboard.summary.tilt_level,
    formScore: dashboard.summary.form_score,
    sessionRisk: dashboard.session.tilt_risk,
    sessionLossStreak: dashboard.session.session_loss_streak,
    tiltDetected: dashboard.tilt_detection.tilt_detected,
    tiltScore: dashboard.tilt_detection.tilt_score
  });

  return (
    <section className={`card recommendationCard recommendation${recommendation.level}`}>
      <div className="recommendationTop">
        <p className="eyebrow">Smart Queue Advisor</p>
      </div>
      <div className="recommendationBody">
        <h3>{recommendation.title}</h3>
        <p className="recommendationReason">{recommendation.reason}</p>
      </div>
      <div className="recommendationBottom">
        <p className="recommendationMeta">Confidence: {recommendation.confidence}%</p>
      </div>
    </section>
  );
}
