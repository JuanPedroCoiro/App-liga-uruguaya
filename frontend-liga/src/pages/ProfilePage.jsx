import { useAuth } from "../context/AuthContext"
import { useFetch } from "../hooks/useFetch"
import {
  getFavoritePlayers,
  getFavoriteTeams,
  removeFavoritePlayer,
  removeFavoriteTeam,
} from "../api/auth"
import { useState } from "react"

function FavoritePlayerCard({ player, token, onRemove, onPlayerClick }) {
  const [loading, setLoading] = useState(false)

  async function handleRemove(e) {
    e.stopPropagation()
    setLoading(true)
    try {
      await removeFavoritePlayer(token, player.id)
      onRemove(player.id)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
      <button
        onClick={() => onPlayerClick(player.id)}
        className="flex-1 text-left group"
      >
        <p className="text-white font-medium group-hover:text-yellow-400 transition-colors">
          {player.name}
        </p>
        <p className="text-gray-500 text-xs mt-0.5">{player.position}</p>
      </button>
      <button
        onClick={handleRemove}
        disabled={loading}
        className="text-gray-500 hover:text-red-400 transition-colors text-lg leading-none disabled:opacity-50 ml-4"
      >
        ×
      </button>
    </div>
  )
}

function FavoriteTeamCard({ team, token, onRemove, onTeamClick }) {
  const [loading, setLoading] = useState(false)

  async function handleRemove(e) {
    e.stopPropagation()
    setLoading(true)
    try {
      await removeFavoriteTeam(token, team.id)
      onRemove(team.id)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
      <button
        onClick={() => onTeamClick(team.id)}
        className="flex-1 text-left group"
      >
        <p className="text-white font-medium group-hover:text-yellow-400 transition-colors">
          {team.name}
        </p>
        <p className="text-gray-500 text-xs mt-0.5">{team.city}</p>
      </button>
      <button
        onClick={handleRemove}
        disabled={loading}
        className="text-gray-500 hover:text-red-400 transition-colors text-lg leading-none disabled:opacity-50 ml-4"
      >
        ×
      </button>
    </div>
  )
}

export default function ProfilePage({ onPlayerClick, onTeamClick }) {
  const { user, token, signOut } = useAuth()

  const { data: players, setData: setPlayers, loading: loadingPlayers } =
    useFetch(() => getFavoritePlayers(token), [token])

  const { data: teams, setData: setTeams, loading: loadingTeams } =
    useFetch(() => getFavoriteTeams(token), [token])

  function removePlayer(id) {
    setPlayers(prev => prev.filter(p => p.id !== id))
  }

  function removeTeam(id) {
    setTeams(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Mi perfil</h1>
          <p className="text-gray-500 text-sm mt-1">{user?.email}</p>
        </div>
        <button
          onClick={signOut}
          className="text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/30 px-4 py-2 rounded-lg transition-colors"
        >
          Cerrar sesión
        </button>
      </div>

      {/* Jugadores favoritos */}
      <section className="mb-8">
        <h2 className="text-white font-semibold mb-3">⭐ Jugadores favoritos</h2>
        {loadingPlayers ? (
          <p className="text-gray-500 text-sm">Cargando...</p>
        ) : players?.length === 0 ? (
          <p className="text-gray-600 text-sm">No tenés jugadores favoritos todavía.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {players?.map(player => (
              <FavoritePlayerCard
                key={player.id}
                player={player}
                token={token}
                onRemove={removePlayer}
                onPlayerClick={onPlayerClick}
              />
            ))}
          </div>
        )}
      </section>

      {/* Equipos favoritos */}
      <section>
        <h2 className="text-white font-semibold mb-3">⭐ Equipos favoritos</h2>
        {loadingTeams ? (
          <p className="text-gray-500 text-sm">Cargando...</p>
        ) : teams?.length === 0 ? (
          <p className="text-gray-600 text-sm">No tenés equipos favoritos todavía.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {teams?.map(team => (
              <FavoriteTeamCard
                key={team.id}
                team={team}
                token={token}
                onRemove={removeTeam}
                onTeamClick={onTeamClick}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
