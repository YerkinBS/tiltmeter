import LabelBadge from "@/components/LabelBadge";
import Stat from "@/components/Stat";
import type { SessionInfo } from "@/lib/types";
import { describeRisk } from "@/lib/ux";

interface SessionCardProps {
  session: SessionInfo;
}

export default function SessionCard({ session }: SessionCardProps) {
  const sessionText = describeRisk(session.tilt_risk, "session");
  const roundedDuration = Math.round(session.session_duration_minutes);

  return (
    <section className="card">
      <div className="sectionHeader">
        <h3>Current Session</h3>
        <p className="muted">Live read on how your current session momentum is evolving.</p>
      </div>
      <div className="rowGap">
        <LabelBadge value={session.tilt_risk} kind="risk" />
      </div>
      <p className="sectionExplain">{sessionText}.</p>
      <div className="statsGrid threeCols">
        <Stat label="Matches" value={session.session_matches} />
        <Stat label="Winrate" value={`${session.session_winrate}%`} />
        <Stat label="Avg K/D" value={session.session_avg_kd} />
        <Stat label="Loss streak" value={session.session_loss_streak} />
        <Stat label="Session duration" value={`${roundedDuration} min`} />
      </div>
    </section>
  );
}
