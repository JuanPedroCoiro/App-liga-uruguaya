import { useState } from "react"
import { useAllStandingsLive } from "../hooks/useAllStandingsLive"
import { useFavorites } from "../hooks/useFavorites"
import FavoriteButton from "../components/FavoriteButton"

// ── Configuración de torneos ──────────────────────────────────────────────────

const TORNEOS = [
  {
    id:     "apertura",
    label:  "Apertura",
    vistas: [{ label: "Apertura", key: "apertura" }],
  },
  {
    id:     "intermedio",
    label:  "Intermedio",
    vistas: [
      { label: "Grupo A", key: "intermedio_a" },
      { label: "Grupo B", key: "intermedio_b" },
    ],
  },
  {
    id:     "clausura",
    label:  "Clausura",
    vistas: [{ label: "Clausura", key: "clausura" }],
  },
  {
    id:     "anual",
    label:  "Anual",
    vistas: [{ label: "Tabla Anual", key: "anual" }],
  },
]

// ── Tabla ─────────────────────────────────────────────────────────────────────

function StandingsTable({ rows, onTeamClick, onLoginRequired, showFavorites }) {
  const { isFavoriteTeam, toggleTeam } = useFavorites()

  if (!rows?.length) return (
    <div className="text-center text-gray-600 py-8 text-sm">Sin datos</div>
  )

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-white/5 text-gray-400 uppercase text-xs tracking-wider">
            <th className="px-4 py-3 text-left w-8">#</th>
            <th className="px-4 py-3 text-left">Equipo</th>
            <th className="px-4 py-3 text-center">PJ</th>
            <th className="px-4 py-3 text-center">PG</th>
            <th className="px-4 py-3 text-center">PE</th>
            <th className="px-4 py-3 text-center">PP</th>
            <th className="px-4 py-3 text-center">GF</th>
            <th className="px-4 py-3 text-center">GC</th>
            <th className="px-4 py-3 text-center">DG</th>
            <th className="px-4 py-3 text-center font-bold text-white">Pts</th>
            {showFavorites && <th className="px-4 py-3 text-center w-8"></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map(team => (
            <tr key={team.team_id} className="hover:bg-white/5 transition-colors text-gray-200">
              <td className="px-4 py-3 text-gray-500 font-mono">{team.position}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onTeamClick?.(team.team_id)}
                  className="text-white font-medium hover:text-yellow-400 transition-colors text-left"
                >
                  {team.team_name}
                </button>
              </td>
              <td className="px-4 py-3 text-center text-gray-400">{team.played}</td>
              <td className="px-4 py-3 text-center text-gray-400">{team.won}</td>
              <td className="px-4 py-3 text-center text-gray-400">{team.drawn}</td>
              <td className="px-4 py-3 text-center text-gray-400">{team.lost}</td>
              <td className="px-4 py-3 text-center text-gray-400">{team.goals_for}</td>
              <td className="px-4 py-3 text-center text-gray-400">{team.goals_against}</td>
              <td className={`px-4 py-3 text-center font-medium ${
                team.goal_difference > 0 ? "text-green-400" :
                team.goal_difference < 0 ? "text-red-400" : "text-gray-400"
              }`}>
                {team.goal_difference > 0 ? `+${team.goal_difference}` : team.goal_difference}
              </td>
              <td className="px-4 py-3 text-center font-bold text-white">{team.points}</td>
              {showFavorites && (
                <td className="px-4 py-3 text-center">
                  <FavoriteButton
                    isFav={isFavoriteTeam(team.team_id)}
                    onToggle={() => toggleTeam(team.team_id)}
                    onLoginRequired={onLoginRequired}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Vista de torneo con flechas ───────────────────────────────────────────────

function TorneoView({ torneo, allData, onTeamClick, onLoginRequired }) {
  const [vistaIdx, setVistaIdx]     = useState(0)
  const vista                        = torneo.vistas[vistaIdx]
  const tieneNavegacion              = torneo.vistas.length > 1
  const rows                         = allData?.[vista.key] ?? []

  return (
    <div>
      {tieneNavegacion && (
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setVistaIdx(i => i - 1)}
            disabled={vistaIdx === 0}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ‹
          </button>
          <span className="text-white font-medium text-sm">{vista.label}</span>
          <button
            onClick={() => setVistaIdx(i => i + 1)}
            disabled={vistaIdx === torneo.vistas.length - 1}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ›
          </button>
        </div>
      )}
      <StandingsTable
        rows={rows}
        onTeamClick={onTeamClick}
        onLoginRequired={onLoginRequired}
        showFavorites={torneo.id === "apertura" || torneo.id === "anual"}
      />
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function StandingsPage({ onLoginRequired, onTeamClick }) {
  const { data, connected, error } = useAllStandingsLive()
  const [torneoId, setTorneoId]    = useState("apertura")
  const torneoActual               = TORNEOS.find(t => t.id === torneoId)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Tabla de Posiciones</h1>
        <span className={`flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-full ${
          connected ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
        }`}>
          <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-gray-400"}`} />
          {connected ? "En vivo" : "Conectando..."}
        </span>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      {!data && !error && (
        <div className="text-center text-gray-500 py-16">Cargando tablas...</div>
      )}

      {data && (
        <>
          {/* Tabs de torneo */}
          <div className="flex gap-1 mb-6 bg-white/5 p-1 rounded-xl">
            {TORNEOS.map(t => (
              <button
                key={t.id}
                onClick={() => setTorneoId(t.id)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  torneoId === t.id
                    ? "bg-white/15 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tabla del torneo con flechas */}
          <TorneoView
            key={torneoId}
            torneo={torneoActual}
            allData={data}
            onTeamClick={onTeamClick}
            onLoginRequired={onLoginRequired}
          />
        </>
      )}
    </div>
  )
}
