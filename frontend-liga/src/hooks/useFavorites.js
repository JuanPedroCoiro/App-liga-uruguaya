import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import {
  getFavoritePlayers,
  getFavoriteTeams,
  addFavoritePlayer,
  removeFavoritePlayer,
  addFavoriteTeam,
  removeFavoriteTeam,
} from "../api/auth"

/**
 * Hook global de favoritos.
 * Carga los favoritos del usuario al montar y expone:
 *   - isFavoritePlayer(id) / togglePlayer(id)
 *   - isFavoriteTeam(id)   / toggleTeam(id)
 */
export function useFavorites() {
  const { token } = useAuth()

  const [favPlayerIds, setFavPlayerIds] = useState(new Set())
  const [favTeamIds,   setFavTeamIds]   = useState(new Set())
  const [loading, setLoading]           = useState(false)

  // Cargar favoritos cuando hay token
  useEffect(() => {
    if (!token) {
      setFavPlayerIds(new Set())
      setFavTeamIds(new Set())
      return
    }
    setLoading(true)
    Promise.all([
      getFavoritePlayers(token),
      getFavoriteTeams(token),
    ]).then(([players, teams]) => {
      setFavPlayerIds(new Set(players.map(p => p.id)))
      setFavTeamIds(new Set(teams.map(t => t.id)))
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [token])

  async function togglePlayer(playerId) {
    if (!token) return
    const isFav = favPlayerIds.has(playerId)
    // Optimistic update
    setFavPlayerIds(prev => {
      const next = new Set(prev)
      isFav ? next.delete(playerId) : next.add(playerId)
      return next
    })
    try {
      isFav
        ? await removeFavoritePlayer(token, playerId)
        : await addFavoritePlayer(token, playerId)
    } catch {
      // Revertir si falla
      setFavPlayerIds(prev => {
        const next = new Set(prev)
        isFav ? next.add(playerId) : next.delete(playerId)
        return next
      })
    }
  }

  async function toggleTeam(teamId) {
    if (!token) return
    const isFav = favTeamIds.has(teamId)
    setFavTeamIds(prev => {
      const next = new Set(prev)
      isFav ? next.delete(teamId) : next.add(teamId)
      return next
    })
    try {
      isFav
        ? await removeFavoriteTeam(token, teamId)
        : await addFavoriteTeam(token, teamId)
    } catch {
      setFavTeamIds(prev => {
        const next = new Set(prev)
        isFav ? next.add(teamId) : next.delete(teamId)
        return next
      })
    }
  }

  return {
    isFavoritePlayer: (id) => favPlayerIds.has(id),
    isFavoriteTeam:   (id) => favTeamIds.has(id),
    togglePlayer,
    toggleTeam,
    loading,
  }
}