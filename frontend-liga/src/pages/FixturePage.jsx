import { useState } from "react"
import { useFetch } from "../hooks/useFetch"
import { getMatches } from "../api/matches"
import MatchDetailModal from "../components/MatchDetailModal"

// ── Configuración de torneos ──────────────────────────────────────────────────

const TORNEOS = [
  {
    id:       "Apertura",
    label:    "Apertura",
    secciones: Array.from({ length: 15 }, (_, i) => ({
      jornada: i + 1,
      label:   `Fecha ${i + 1}`,
    })),
  },
  {
    id:       "Intermedio",
    label:    "Intermedio",
    secciones: [
      ...Array.from({ length: 7 }, (_, i) => ({
        jornada: i + 1,
        label:   `Fecha ${i + 1}`,
      })),
      { jornada: null, label: "Final Intermedio" },
    ],
  },
  {
    id:       "Clausura",
    label:    "Clausura",
    secciones: Array.from({ length: 15 }, (_, i) => ({
      jornada: i + 1,
      label:   `Fecha ${i + 1}`,
    })),
  },
  {
    id:       "Final",
    label:    "Final",
    secciones: [
      { jornada: 1, label: "Semifinal" },
      { jornada: 2, label: "Final" },
    ],
  },
]

// ── Tarjeta de partido ────────────────────────────────────────────────────────

function MatchCard({ match, onClick }) {
  const date     = new Date(match.date)
  const finished = date < new Date()
  const dateStr  = date.toLocaleDateString("es-UY", {
    weekday: "short", day: "numeric", month: "short",
  })
  const timeStr = date.toLocaleTimeString("es-UY", {
    hour: "2-digit", minute: "2-digit",
  })

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white/5 border border-white/10 rounded-xl px-6 py-4 hover:bg-white/10 hover:border-white/20 transition-all"
    >
      <div className="flex justify-between text-xs text-gray-500 mb-3">
        <span>{dateStr} · {timeStr}</span>
        <span>{match.stadium}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 text-right">
          <span className="text-white font-semibold text-lg">{match.home_team_name}</span>
        </div>
        <div className="flex items-center gap-2 min-w-[80px] justify-center">
          {finished ? (
            <span className="text-white font-bold text-2xl tracking-widest">
              {match.home_score} - {match.away_score}
            </span>
          ) : (
            <span className="text-gray-500 font-medium text-sm px-3 py-1 bg-white/5 rounded-lg">
              vs
            </span>
          )}
        </div>
        <div className="flex-1 text-left">
          <span className="text-white font-semibold text-lg">{match.away_team_name}</span>
        </div>
      </div>
      <div className="flex justify-between items-center mt-3 text-xs text-gray-600">
        <span>Árbitro: {match.referee}</span>
        {match.video_url && <span className="text-red-400">▶ Ver resumen</span>}
      </div>
    </button>
  )
}

// ── Vista de torneo ───────────────────────────────────────────────────────────

function TorneoView({ torneo, onMatchClick }) {
  const [seccionIdx, setSeccionIdx] = useState(0)

  const seccion    = torneo.secciones[seccionIdx]
  const isFirst    = seccionIdx === 0
  const isLast     = seccionIdx === torneo.secciones.length - 1

  const { data: matches, loading, error } = useFetch(
    () => getMatches({ fase: torneo.id, jornada: seccion.jornada }),
    [torneo.id, seccionIdx]
  )

  return (
    <div>
      {/* Navegación de jornada */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setSeccionIdx(i => i - 1)}
          disabled={isFirst}
          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ‹
        </button>

        <span className="text-white font-medium text-sm min-w-[160px] text-center">
          {seccion.label}
        </span>

        <button
          onClick={() => setSeccionIdx(i => i + 1)}
          disabled={isLast}
          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ›
        </button>
      </div>

      {/* Partidos */}
      {loading && (
        <div className="text-center text-gray-500 py-16">Cargando partidos...</div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && matches?.length === 0 && (
        <div className="text-center text-gray-500 py-16">
          No hay partidos en {seccion.label}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {matches?.map(match => (
          <MatchCard
            key={match.id}
            match={match}
            onClick={() => onMatchClick(match.id)}
          />
        ))}
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function FixturePage() {
  const [torneoId, setTorneoId]     = useState("Apertura")
  const [selectedId, setSelectedId] = useState(null)

  const torneoActual = TORNEOS.find(t => t.id === torneoId)

  function handleTorneoChange(id) {
    setTorneoId(id)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      <h1 className="text-2xl font-bold text-white mb-6">Fixture</h1>

      {/* Tabs de torneo */}
      <div className="flex gap-1 mb-8 bg-white/5 p-1 rounded-xl">
        {TORNEOS.map(t => (
          <button
            key={t.id}
            onClick={() => handleTorneoChange(t.id)}
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

      {/* Vista del torneo con navegación por jornada */}
      <TorneoView
        key={torneoId}   // key fuerza reset del índice al cambiar de torneo
        torneo={torneoActual}
        onMatchClick={setSelectedId}
      />

      {/* Modal de detalle */}
      {selectedId && (
        <MatchDetailModal
          matchId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}
