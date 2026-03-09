"use client";

import { useState } from "react";
import FormSummaryCard from "@/components/FormSummaryCard";
import FormHistoryChart from "@/components/FormHistoryChart";
import KeyInsights from "@/components/KeyInsights";
import MapsTable from "@/components/MapsTable";
import PlayerHeaderCard from "@/components/PlayerHeaderCard";
import QueueRecommendationCard from "@/components/QueueRecommendationCard";
import RecentPerformanceTimeline from "@/components/RecentPerformanceTimeline";
import RecentMatchesTable from "@/components/RecentMatchesTable";
import SearchBar from "@/components/SearchBar";
import SessionCard from "@/components/SessionCard";
import SessionMomentumCard from "@/components/SessionMomentumCard";
import TiltDetectionCard from "@/components/TiltDetectionCard";
import TiltPredictionCard from "@/components/TiltPredictionCard";
import { analyzePlayer, getDashboard, getFormHistory, getRecentMatches, searchPlayer } from "@/lib/api";
import type { DashboardResponse, FormHistoryPoint, RecentMatch } from "@/lib/types";

type LoadStep = "idle" | "searching" | "analyzing" | "loading-dashboard";

function getLoadingText(step: LoadStep): string {
  if (step === "searching") return "Searching player...";
  if (step === "analyzing") return "Analyzing matches...";
  if (step === "loading-dashboard") return "Loading dashboard...";
  return "";
}

export default function HomePage() {
  const [nickname, setNickname] = useState("");
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [formHistory, setFormHistory] = useState<FormHistoryPoint[]>([]);
  const [recentTimelineMatches, setRecentTimelineMatches] = useState<RecentMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<LoadStep>("idle");

  const isLoading = loadingStep !== "idle";
  const statusText = getLoadingText(loadingStep);

  const handleAnalyze = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      return;
    }

    setError(null);
    setDashboard(null);
    setFormHistory([]);
    setRecentTimelineMatches([]);
    setLoadingStep("searching");

    try {
      const player = await searchPlayer(trimmed);
      setLoadingStep("analyzing");
      await analyzePlayer(player.player_id, 50, 20);
      setLoadingStep("loading-dashboard");
      const [result, history, recentMatches] = await Promise.all([
        getDashboard(player.player_id),
        getFormHistory(player.player_id, 20, 30).catch(() => []),
        getRecentMatches(player.player_id, 15).catch(() => [])
      ]);
      setDashboard(result);
      setFormHistory(history);
      setRecentTimelineMatches(recentMatches);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setLoadingStep("idle");
    }
  };

  return (
    <main className="page">
      <div className="pageGlow" aria-hidden="true" />
      <div className="container">
        <header className="card heroCard">
          <p className="eyebrow">Tiltmeter</p>
          <h1>Competitive Performance Intelligence</h1>
          <p className="heroSubtitle">
            Analyze momentum, identify tilt risk early, and make smarter queue decisions with match-backed insights.
          </p>
          <SearchBar nickname={nickname} isLoading={isLoading} onNicknameChange={setNickname} onSubmit={handleAnalyze} />
          <p className="heroHint">Search any Faceit nickname to generate a full performance and tilt report.</p>
        </header>

        {isLoading ? <div className="statusLine">{statusText}</div> : null}
        {error ? <div className="errorBox">{error}</div> : null}

        {!dashboard && !isLoading && !error ? (
          <section className="card emptyState">
            <h3>No data loaded</h3>
            <p className="muted">Run an analysis to generate this player dashboard.</p>
          </section>
        ) : null}

        {dashboard ? (
          <section className="dashboardLayout">
            <PlayerHeaderCard player={dashboard.player} />

            <section className="topAnalyticsSection">
              <div className="topAnalyticsRow topAnalyticsRowPrimary">
                <QueueRecommendationCard dashboard={dashboard} />
                <KeyInsights dashboard={dashboard} />
              </div>

              <div className="topAnalyticsRow topAnalyticsRowSecondary">
                <TiltPredictionCard tiltDetection={dashboard.tilt_detection} />
                <SessionMomentumCard
                  matches={recentTimelineMatches.length > 0 ? recentTimelineMatches : dashboard.recent_matches}
                />
              </div>
            </section>

            <div className="threeColumnLayout">
              <FormSummaryCard summary={dashboard.summary} />
              <SessionCard session={dashboard.session} />
              <TiltDetectionCard tilt={dashboard.tilt_detection} />
            </div>

            <FormHistoryChart points={formHistory} />
            <MapsTable maps={dashboard.maps} />
            <RecentPerformanceTimeline matches={recentTimelineMatches.length > 0 ? recentTimelineMatches : dashboard.recent_matches} />
            <RecentMatchesTable matches={dashboard.recent_matches} />
          </section>
        ) : null}
      </div>
    </main>
  );
}
