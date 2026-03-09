export type MatchResult = "WIN" | "LOSS" | null;

export interface SearchPlayerResponse {
  player_id: string;
  nickname: string;
  country: string | null;
  game: string;
  region: string | null;
  skill_level: number | null;
  faceit_elo: number | null;
  game_player_id: string | null;
  game_player_name: string | null;
  faceit_url: string | null;
  avatar: string | null;
}

export interface AnalyzeResponse {
  message: string;
  refresh: {
    matches_seen: number;
    inserted: number;
    updated: number;
    skipped: number;
    new_match_ids: string[];
    from_ts: number | null;
  };
  enrich: {
    matches_enriched: number;
  };
  summary: {
    summary_id: number;
    window_size: number;
    form_score: number;
    form_label: string;
    tilt_level: string;
    created_at: string;
  };
}

export interface PlayerInfo {
  player_id: string;
  nickname: string;
  country: string | null;
  region: string | null;
  skill_level: number | null;
  faceit_elo: number | null;
  faceit_url: string | null;
  avatar: string | null;
}

export interface SummaryInfo {
  player_id: string;
  window_size: number;
  matches_analyzed: number;
  winrate: number;
  avg_kd: number;
  avg_kills: number;
  avg_deaths: number;
  avg_assists: number;
  current_streak: number;
  last_results: string[];
  best_map: string | null;
  worst_map: string | null;
  form_score: number;
  form_label: string;
  tilt_level: string;
}

export interface SessionInfo {
  session_matches: number;
  session_winrate: number;
  session_avg_kd: number;
  session_loss_streak: number;
  session_duration_minutes: number;
  tilt_risk: string;
}

export interface TiltSignals {
  loss_streak: number;
  recent_winrate: number;
  baseline_winrate: number;
  recent_avg_kd: number;
  baseline_avg_kd: number;
  recent_avg_kills: number;
  baseline_avg_kills: number;
  recent_avg_deaths: number;
  baseline_avg_deaths: number;
  kd_drop_vs_baseline: number;
  kills_drop_vs_baseline: number;
  winrate_drop_vs_baseline: number;
}

export interface TiltDetectionInfo {
  tilt_detected: boolean;
  tilt_score: number;
  tilt_severity: string;
  recent_window: number;
  baseline_window: number;
  signals: TiltSignals;
}

export interface MapStats {
  map_name: string;
  matches: number;
  wins: number;
  winrate: number;
  avg_kd: number;
  avg_kills: number;
  avg_deaths: number;
  avg_assists: number;
}

export interface RecentMatch {
  match_id: string;
  map_name: string | null;
  result: MatchResult;
  team_score: number | null;
  enemy_score: number | null;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  kd: number | null;
  finished_at: number | null;
}

export interface DashboardResponse {
  player: PlayerInfo;
  summary: SummaryInfo;
  session: SessionInfo;
  tilt_detection: TiltDetectionInfo;
  maps: MapStats[];
  recent_matches: RecentMatch[];
}

export interface FormHistoryPoint {
  date: string;
  form_score: number | null;
  tilt_level: string | null;
}
