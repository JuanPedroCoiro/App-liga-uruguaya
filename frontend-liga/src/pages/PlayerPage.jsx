import { useFetch } from "../hooks/useFetch"
import { getPlayer } from "../api/players"
import { useFavorites } from "../hooks/useFavorites"
import FavoriteButton from "../components/FavoriteButton"

const POSITION_LABELS = {
  goalkeeper: "Portero",
  defender:   "Defensa",
  midfielder: "Mediocampista",
  forward:    "Delantero",
}

function calcAge(birthDate) {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-4 flex flex-col gap-1">
      <p className="text-gray-500 text-xs">{label}</p>
      <p className="text-white font-semibold text-lg">{value ?? "—"}</p>
    </div>
  )
}

export default function PlayerPage({ playerId, onBack, onLoginRequired }) {
  const { data: player, loading, error } = useFetch(
    () => getPlayer(playerId),
    [playerId]
  )
  const { isFavoritePlayer, togglePlayer } = useFavorites()

  const age = calcAge(player?.birth_date)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Botón volver */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors"
      >
        ← Volver
      </button>

      {loading && (
        <div className="text-center text-gray-500 py-16">Cargando...</div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {player && (
        <>
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              {/* Dorsal */}
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-bold text-white">
                {player.dorsal ?? "—"}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{player.name}</h1>
                <p className="text-gray-500 mt-1">
                  {POSITION_LABELS[player.position?.toLowerCase()] ?? player.position}
                </p>
              </div>
            </div>
            <FavoriteButton
              isFav={isFavoritePlayer(player.id)}
              onToggle={() => togglePlayer(player.id)}
              onLoginRequired={onLoginRequired}
            />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <StatCard
              label="Edad"
              value={age !== null ? `${age} años` : null}
            />
            <StatCard
              label="País"
              value={player.country}
            />
            <StatCard
              label="Estatura"
              value={player.height ? `${player.height} cm` : null}
            />
            <StatCard
              label="Pie preferido"
              value={player.preferred_foot}
            />
          </div>

          {/* Fecha de nacimiento */}
          {player.birth_date && (
            <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 flex items-center gap-4">
              <span className="text-2xl">🎂</span>
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Fecha de nacimiento</p>
                <p className="text-white font-semibold">
                  {new Date(player.birth_date).toLocaleDateString("es-UY", {
                    day: "numeric", month: "long", year: "numeric"
                  })}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
