import { apiFetch } from "./client"

export function getTeam(teamId) {
  return apiFetch(`/teams/${teamId}`)
}

export function getTeams() {
  return apiFetch("/teams")
}