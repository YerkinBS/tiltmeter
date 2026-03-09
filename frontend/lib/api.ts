import type { AnalyzeResponse, DashboardResponse, FormHistoryPoint, RecentMatch, SearchPlayerResponse } from "./types";

const API_BASE_URL = "/api";

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const payload = await response.json();
      if (payload?.detail) {
        message = typeof payload.detail === "string" ? payload.detail : message;
      }
    } catch {
      // Keep fallback message when response body is not JSON.
    }

    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

export async function searchPlayer(nickname: string): Promise<SearchPlayerResponse> {
  const query = new URLSearchParams({ nickname });
  return request<SearchPlayerResponse>(`/players/search?${query.toString()}`);
}

export async function analyzePlayer(
  playerId: string,
  matchLimit = 50,
  summaryLimit = 20
): Promise<AnalyzeResponse> {
  const query = new URLSearchParams({
    match_limit: String(matchLimit),
    summary_limit: String(summaryLimit)
  });

  return request<AnalyzeResponse>(`/players/${playerId}/analyze?${query.toString()}`, {
    method: "POST"
  });
}

export async function getDashboard(playerId: string): Promise<DashboardResponse> {
  return request<DashboardResponse>(`/players/${playerId}/dashboard`);
}

export async function getFormHistory(
  playerId: string,
  windowSize = 20,
  limit = 30
): Promise<FormHistoryPoint[]> {
  const query = new URLSearchParams({
    window_size: String(windowSize),
    limit: String(limit)
  });
  return request<FormHistoryPoint[]>(`/players/${playerId}/form-history?${query.toString()}`);
}

export async function getRecentMatches(playerId: string, limit = 15): Promise<RecentMatch[]> {
  const query = new URLSearchParams({ limit: String(limit) });
  return request<RecentMatch[]>(`/players/${playerId}/matches/recent?${query.toString()}`);
}

export { ApiError };
