import { apiFetch } from "./client"

export function getPlayer(playerId) {
  return apiFetch(`/players/${playerId}`)
}

export function getPlayers() {
  return apiFetch("/players")
}