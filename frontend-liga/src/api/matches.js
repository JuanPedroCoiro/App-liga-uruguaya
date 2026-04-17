import { apiFetch } from "./client"

// ── Matches ───────────────────────────────────────────────────────────────────

export function getMatches({ jornada, fase } = {}) {
  const params = new URLSearchParams()
  if (jornada !== undefined && jornada !== null) params.append("jornada", jornada)
  if (fase)    params.append("fase", fase)
  const query = params.toString() ? `?${params.toString()}` : ""
  return apiFetch(`/matches${query}`)
}

export function getMatch(matchId) {
  return apiFetch(`/matches/${matchId}`)
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export function getStandings() {
  return apiFetch("/stats/standings")
}