import type { ReactNode } from "react";

interface LabelBadgeProps {
  value: string | null | undefined;
  kind?: "result" | "form" | "tilt" | "risk";
}

function getBadgeClass(value: string, kind: NonNullable<LabelBadgeProps["kind"]>) {
  const normalized = value.toUpperCase();

  if (kind === "result") {
    if (normalized === "WIN") return "badge badgeSuccess";
    if (normalized === "LOSS") return "badge badgeDanger";
    return "badge";
  }

  if (kind === "tilt" || kind === "risk") {
    if (normalized === "HIGH") return "badge badgeDanger";
    if (normalized === "MEDIUM") return "badge badgeNeutral";
    if (normalized === "LOW") return "badge badgeSuccess";
    return "badge";
  }

  if (kind === "form") {
    if (normalized.includes("GOOD") || normalized.includes("HOT")) return "badge badgeSuccess";
    if (normalized.includes("NEUTRAL") || normalized.includes("STABLE")) return "badge badgeNeutral";
    if (normalized.includes("BAD") || normalized.includes("COLD") || normalized.includes("TILT")) return "badge badgeDanger";
  }

  return "badge";
}

export default function LabelBadge({ value, kind = "form" }: LabelBadgeProps): ReactNode {
  const label = value && value.trim().length > 0 ? value : "N/A";
  const className = getBadgeClass(label, kind);
  return <span className={className}>{label}</span>;
}
