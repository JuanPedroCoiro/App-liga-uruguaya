import { useState } from "react"
import { useFetch } from "../hooks/useFetch"
import {
  getStandingsApertura,
  getStandingsClausura,
  getStandingsIntermedioA,
  getStandingsIntermedioB,
  getStandingsAnual,
} from "../api/stats"

// ── Configuración de torneos ──────────────────────────────────────────────────

const TORNEOS = [
  {
    id:     "apertura",
    label:  "Apertura",
    vistas: [{ label: "Apertura", fetchFn: getStandingsApertura }],
  },
  {
    id:     "intermedio",
    label:  "Intermedio",
    vistas: [
      { label: "Grupo A", fetchFn: getStandingsIntermedioA },
      { label: "Grupo B", fetchFn: getStandingsIntermedioB },
    ],
  },
  {
    id:     "clausura",
    label:  "Clausura",
    vistas: [{ label: "Clausura", fetchFn: getStandingsClausura }],
  },
  {
    id:     "anual",
    label:  "Anual",
    vistas: [{ label: "Tabla Anual", fetchFn: getStandingsAnual }],
  },
]

// ── Tabla reutilizable ────────────────────────────────────────────────────────

function StandingsTable({ fetchFn }) {
  const { data, loading, error } = useFetch(fetchFn, [fetchFn])

  if (loading) return <div className="text-center text-gray-500 py-8">Cargando...</div>
  if (error)   return <div className="text-red-400 text-sm py-4">{error}</div>
  if (!data?.length) return <div className="text-center text-gray-600 py-8">Sin datos</div>

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-white/5 text-gray-400 uppercase text-xs tracking-wider">
            <th className="px-3 py-3 text-left w-8">#</th>
            <th className="px-3 py-3 text-left">Equipo</th>
            <th className="px-3 py-3 text-center">PJ</th>
            <th className="px-3 py-3 text-center">PG</th>
            <th className="px-3 py-3 text-center">PE</th>
            <th className="px-3 py-3 text-center">PP</th>
            <th className="px-3 py-3 text-center">GF</th>
            <th className="px-3 py-3 text-center">GC</th>
            <th className="px-3 py-3 text-center">DG</th>
            <th className="px-3 py-3 text-center font-bold text-white">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.map(team => (
            <tr key={team.team_id} className="hover:bg-white/5 transition-colors text-gray-200">
              <td className="px-3 py-3 text-gray-500 font-mono">{team.position}</td>
              <td className="px-3 py-3 font-medium text-white">{team.team_name}</td>
              <td className="px-3 py-3 text-center text-gray-400">{team.played}</td>
              <td className="px-3 py-3 text-center text-gray-400">{team.won}</td>
              <td className="px-3 py-3 text-center text-gray-400">{team.drawn}</td>
              <td className="px-3 py-3 text-center text-gray-400">{team.lost}</td>
              <td className="px-3 py-3 text-center text-gray-400">{team.goals_for}</td>
              <td className="px-3 py-3 text-center text-gray-400">{team.goals_against}</td>
              <td className={`px-3 py-3 text-center font-medium ${
                team.goal_difference > 0 ? "text-green-400" :
                team.goal_difference < 0 ? "text-red-400" : "text-gray-400"
              }`}>
                {team.goal_difference > 0 ? `+${team.goal_difference}` : team.goal_difference}
              </td>
              <td className="px-3 py-3 text-center font-bold text-white">{team.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Vista de torneo con flechas ───────────────────────────────────────────────

function TorneoView({ torneo }) {
  const [vistaIdx, setVistaIdx] = useState(0)

  const vista   = torneo.vistas[vistaIdx]
  const isFirst = vistaIdx === 0
  const isLast  = vistaIdx === torneo.vistas.length - 1
  const tieneNavegacion = torneo.vistas.length > 1

  return (
    <div>
      {/* Navegación entre vistas (solo si hay más de una) */}
      {tieneNavegacion && (
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setVistaIdx(i => i - 1)}
            disabled={isFirst}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ‹
          </button>
          <span className="text-white font-medium text-sm">{vista.label}</span>
          <button
            onClick={() => setVistaIdx(i => i + 1)}
            disabled={isLast}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ›
          </button>
        </div>
      )}

      <StandingsTable fetchFn={vista.fetchFn} />
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function StandingsModal({ onClose }) {
  const [torneoId, setTorneoId] = useState("apertura")

  const torneoActual = TORNEOS.find(t => t.id === torneoId)

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 shrink-0">
          <h2 className="text-white font-bold text-lg">Tablas del torneo</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Tabs de torneo */}
        <div className="px-6 pt-4 shrink-0">
          <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
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
        </div>

        {/* Contenido scrolleable */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          <TorneoView
            key={torneoId}
            torneo={torneoActual}
          />
        </div>
      </div>
    </div>
  )
}
