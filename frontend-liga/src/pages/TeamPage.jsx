import { useState } from "react"
import { useFetch } from "../hooks/useFetch"
import { getTeam } from "../api/teams"
import { useFavorites } from "../hooks/useFavorites"
import FavoriteButton from "../components/FavoriteButton"
import PlayerPage from "./PlayerPage"

const POSITION_LABELS = {
  goalkeeper: "Portero",
  defender:   "Defensa",
  midfielder: "Mediocampista",
  forward:    "Delantero",
}

const POSITION_ORDER = ["goalkeeper", "defender", "midfielder", "forward"]

function PlayerRow({ player, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors rounded-lg px-2 -mx-2"
    >
      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-gray-400 font-mono shrink-0">
        {player.dorsal ?? "—"}
      </div>
      <div className="flex-1 text-left">
        <p className="text-white font-medium">{player.name}</p>
      </div>
      <span className="text-xs text-gray-500">
        {POSITION_LABELS[player.position?.toLowerCase()] ?? player.position}
      </span>
      <span className="text-gray-600 text-xs">→</span>
    </button>
  )
}

export default function TeamPage({ teamId, onBack, onLoginRequired, onPlayerClick }) {
  const { data: team, loading, error } = useFetch(() => getTeam(teamId), [teamId])
  const { isFavoriteTeam, toggleTeam } = useFavorites()

  // Si no se pasa onPlayerClick desde afuera, manejamos navegación interna
  const [internalPlayerId, setInternalPlayerId] = useState(null)

  const handlePlayerClick = onPlayerClick
    ? onPlayerClick
    : (id) => setInternalPlayerId(id)

  if (internalPlayerId) {
    return (
      <PlayerPage
        playerId={internalPlayerId}
        onBack={() => setInternalPlayerId(null)}
        onLoginRequired={onLoginRequired}
      />
    )
  }

  const playersByPosition = POSITION_ORDER.reduce((acc, pos) => {
    const group = team?.players?.filter(p => p.position?.toLowerCase() === pos) ?? []
    if (group.length) acc[pos] = group
    return acc
  }, {})

  const otherPlayers = team?.players?.filter(
    p => !POSITION_ORDER.includes(p.position?.toLowerCase())
  ) ?? []

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors"
      >
        ← Volver
      </button>

      {loading && <div className="text-center text-gray-500 py-16">Cargando...</div>}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {team && (
        <>
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">{team.name}</h1>
              <p className="text-gray-500 mt-1">{team.city}</p>
            </div>
            <FavoriteButton
              isFav={isFavoriteTeam(team.id)}
              onToggle={() => toggleTeam(team.id)}
              onLoginRequired={onLoginRequired}
            />
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 mb-8 flex items-center gap-4">
            <span className="text-2xl">🏟️</span>
            <div>
              <p className="text-gray-500 text-xs mb-0.5">Estadio local</p>
              <p className="text-white font-semibold">{team.stadium}</p>
            </div>
          </div>

          <h2 className="text-white font-semibold mb-4">Plantel</h2>

          {team.players?.length === 0 ? (
            <p className="text-gray-600 text-sm">Sin jugadores registrados.</p>
          ) : (
            <div className="flex flex-col gap-6">
              {Object.entries(playersByPosition).map(([pos, players]) => (
                <div key={pos}>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">
                    {POSITION_LABELS[pos]}s
                  </p>
                  <div className="bg-white/5 border border-white/10 rounded-xl px-4">
                    {players.map(player => (
                      <PlayerRow
                        key={player.id}
                        player={player}
                        onClick={() => handlePlayerClick(player.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {otherPlayers.length > 0 && (
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Otros</p>
                  <div className="bg-white/5 border border-white/10 rounded-xl px-4">
                    {otherPlayers.map(player => (
                      <PlayerRow
                        key={player.id}
                        player={player}
                        onClick={() => handlePlayerClick(player.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
