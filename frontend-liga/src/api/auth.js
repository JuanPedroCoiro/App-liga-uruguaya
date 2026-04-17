import { apiFetch } from "./client"

// ── Auth ──────────────────────────────────────────────────────────────────────

export function register(email, password) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export function login(email, password) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

// ── Favoritos ─────────────────────────────────────────────────────────────────

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` }
}

export function getFavoritePlayers(token) {
  return apiFetch("/users/me/players", { headers: authHeaders(token) })
}

export function addFavoritePlayer(token, playerId) {
  return apiFetch(`/users/me/players/${playerId}`, {
    method: "POST",
    headers: authHeaders(token),
  })
}

export function removeFavoritePlayer(token, playerId) {
  return apiFetch(`/users/me/players/${playerId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  })
}

export function getFavoriteTeams(token) {
  return apiFetch("/users/me/teams", { headers: authHeaders(token) })
}

export function addFavoriteTeam(token, teamId) {
  return apiFetch(`/users/me/teams/${teamId}`, {
    method: "POST",
    headers: authHeaders(token),
  })
}

export function removeFavoriteTeam(token, teamId) {
  return apiFetch(`/users/me/teams/${teamId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  })
}