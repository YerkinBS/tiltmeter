export function describeFormLabel(label: string | null | undefined): string {
  const normalized = (label ?? "").toUpperCase();

  if (normalized === "HOT") {
    return "Strong recent form";
  }

  if (normalized === "GOOD") {
    return "Good recent form";
  }

  if (normalized === "STABLE") {
    return "Stable performance";
  }

  if (normalized === "COLD") {
    return "Performance is dropping";
  }

  if (normalized === "TILT") {
    return "Heavy performance drop";
  }

  return "Form state not classified";
}

export function describeRisk(label: string | null | undefined, subject: "tilt" | "session"): string {
  const normalized = (label ?? "").toUpperCase();

  if (normalized === "HIGH") {
    return subject === "tilt" ? "High risk of tilt" : "Current session looks tilted";
  }

  if (normalized === "MEDIUM") {
    return subject === "tilt" ? "Some signs of tilt" : "Session is getting unstable";
  }

  if (normalized === "LOW") {
    return subject === "tilt" ? "Low tilt risk" : "Session looks under control";
  }

  return subject === "tilt" ? "Tilt risk unavailable" : "Session status unavailable";
}

export function describeTiltDetection(tiltDetected: boolean, severity: string): string {
  if (!tiltDetected) {
    return "No major tilt signals detected";
  }

  const normalized = severity.toUpperCase();
  if (normalized === "HIGH") {
    return "Strong tilt signals detected";
  }

  if (normalized === "MEDIUM") {
    return "Some tilt signals detected";
  }

  return "Minor tilt signals detected";
}

export type QueueRecommendationLevel = "queue" | "break" | "stop";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export function getQueueRecommendation(input: {
  tiltLevel: string | null | undefined;
  formScore: number;
  sessionRisk: string | null | undefined;
  sessionLossStreak: number;
  tiltDetected: boolean;
  tiltScore: number;
}): { level: QueueRecommendationLevel; title: string; reason: string; confidence: number } {
  const tiltLevel = (input.tiltLevel ?? "").toUpperCase();
  const sessionRisk = (input.sessionRisk ?? "").toUpperCase();
  const normalizedTiltScore = Math.max(0, Math.min(100, input.tiltScore));

  const sessionRiskFactor = sessionRisk === "HIGH" ? 20 : sessionRisk === "MEDIUM" ? 12 : 0;
  const tiltLevelFactor = tiltLevel === "HIGH" ? 16 : tiltLevel === "MEDIUM" ? 9 : 0;
  const streakFactor = Math.min(24, input.sessionLossStreak * 8);
  const formPenalty = Math.max(0, (55 - input.formScore) * 0.7);
  const detectionFactor = input.tiltDetected ? 8 : 0;

  const decisionScore = Math.max(
    0,
    Math.min(100, normalizedTiltScore * 0.5 + sessionRiskFactor + tiltLevelFactor + streakFactor + formPenalty + detectionFactor)
  );

  if (decisionScore >= 70) {
    const confidence = Math.min(95, Math.max(65, Math.round(60 + (decisionScore - 70) * 0.9)));
    return {
      level: "stop",
      title: "Stop queueing",
      reason: "High tilt pressure and session instability suggest your next match is likely to underperform.",
      confidence
    };
  }

  if (decisionScore >= 40) {
    const confidence = Math.min(90, Math.max(55, Math.round(52 + (decisionScore - 40) * 1.1)));
    return {
      level: "break",
      title: "Take a break",
      reason: "Signals are trending negative, and a short reset can reduce tilt risk before your next queue.",
      confidence
    };
  }

  const confidence = Math.min(88, Math.max(50, Math.round(58 + (40 - decisionScore) * 0.45)));
  return {
    level: "queue",
    title: "Queue",
    reason: "Current performance indicators look stable enough to continue playing.",
    confidence
  };
}

export function getTiltPrediction(input: {
  tiltScore: number;
  lossStreak: number;
  kdDropVsBaseline: number;
  winrateDropVsBaseline: number;
}): { riskPercent: number; level: RiskLevel; explanation: string } {
  const normalizedTiltScore = Math.max(0, Math.min(1, input.tiltScore / 100));
  const lossStreakFactor = Math.max(0, Math.min(1, input.lossStreak / 5));
  const kdDropFactor = Math.max(0, Math.min(1, input.kdDropVsBaseline / 0.6));
  const winrateDropFactor = Math.max(0, Math.min(1, input.winrateDropVsBaseline / 50));

  const riskRaw =
    0.4 * normalizedTiltScore +
    0.3 * lossStreakFactor +
    0.2 * kdDropFactor +
    0.1 * winrateDropFactor;

  const riskPercent = Math.round(Math.max(0, Math.min(100, riskRaw * 100)));

  if (riskPercent >= 60) {
    return {
      riskPercent,
      level: "HIGH",
      explanation: "Recent indicators suggest elevated tilt probability in the next match."
    };
  }

  if (riskPercent >= 30) {
    return {
      riskPercent,
      level: "MEDIUM",
      explanation: "Tilt pressure is building, so consider a short reset before queuing."
    };
  }

  return {
    riskPercent,
    level: "LOW",
    explanation: "Current metrics indicate low tilt pressure for the next match."
  };
}
