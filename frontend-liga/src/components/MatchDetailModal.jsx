import { useFetch } from "../hooks/useFetch"
import { getMatch } from "../api/matches"

// ── Helpers ───────────────────────────────────────────────────────────────────

const EVENT_ICONS = {
  goal:             "⚽",
  assist:           "🎯",
  yellow_card:      "🟨",
  red_card:         "🟥",
  substitution_in:  "⬆️",
  substitution_out: "⬇️",
}

const EVENT_LABELS = {
  goal:             "Gol",
  assist:           "Asistencia",
  yellow_card:      "Tarjeta amarilla",
  red_card:         "Tarjeta roja",
  substitution_in:  "Entra",
  substitution_out: "Sale",
}

function EventRow({ event }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
      <span className="text-gray-500 font-mono text-xs w-8 text-right shrink-0">
        {event.minute}'
      </span>
      <span className="text-base">{EVENT_ICONS[event.event_type] ?? "•"}</span>
      <div className="flex-1 min-w-0">
        <span className="text-white text-sm font-medium">
          {event.player_name || `Jugador #${event.player_id}`}
        </span>
        <span className="text-gray-500 text-xs ml-2">
          {EVENT_LABELS[event.event_type]}
        </span>
        {event.related_player_name && (
          <span className="text-gray-600 text-xs ml-1">
            → {event.related_player_name}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function MatchDetailModal({ matchId, onClose }) {
  const { data: match, loading, error } = useFetch(
    () => getMatch(matchId),
    [matchId]
  )

  const date     = match ? new Date(match.date) : null
  const finished = date ? date < new Date() : false

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header fijo */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 shrink-0">
          <h2 className="text-white font-bold text-lg">Detalle del partido</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="overflow-y-auto flex-1 px-6 py-4">

          {loading && (
            <div className="text-center text-gray-500 py-12">Cargando...</div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {match && (
            <>
              {/* Marcador principal */}
              <div className="text-center mb-6">
                <p className="text-gray-500 text-xs mb-3">
                  {date?.toLocaleDateString("es-UY", {
                    weekday: "long", day: "numeric", month: "long",
                  })} · {date?.toLocaleTimeString("es-UY", {
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>

                <div className="flex items-center justify-center gap-6">
                  <span className="text-white font-bold text-xl flex-1 text-right">
                    {match.home_team_name}
                  </span>

                  {finished ? (
                    <span className="text-white font-bold text-4xl tracking-widest min-w-[100px] text-center">
                      {match.home_score} - {match.away_score}
                    </span>
                  ) : (
                    <span className="text-gray-500 text-lg min-w-[60px] text-center">vs</span>
                  )}

                  <span className="text-white font-bold text-xl flex-1 text-left">
                    {match.away_team_name}
                  </span>
                </div>

                {match.fase && (
                  <p className="text-gray-500 text-xs mt-2">
                    {match.fase}{match.jornada ? ` · Jornada ${match.jornada}` : ""}
                  </p>
                )}
              </div>

              {/* Info del partido */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/5 rounded-xl px-4 py-3">
                  <p className="text-gray-500 text-xs mb-1">Estadio</p>
                  <p className="text-white text-sm font-medium">{match.stadium}</p>
                </div>
                <div className="bg-white/5 rounded-xl px-4 py-3">
                  <p className="text-gray-500 text-xs mb-1">Árbitro</p>
                  <p className="text-white text-sm font-medium">{match.referee}</p>
                </div>
              </div>

              {/* Eventos */}
              <div>
                <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-3">
                  Cronología
                </h3>

                {match.events?.length === 0 ? (
                  <p className="text-gray-600 text-sm text-center py-6">
                    Sin eventos registrados
                  </p>
                ) : (
                  <div>
                    {match.events.map(event => (
                      <EventRow key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </div>

              {/* Video */}
              {match.video_url && (
                <a
                  href={match.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 mt-6 w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl py-3 text-sm font-medium transition-colors"
                >
                  ▶ Ver resumen en YouTube
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
