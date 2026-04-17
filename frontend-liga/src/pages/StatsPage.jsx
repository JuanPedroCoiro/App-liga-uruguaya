import { useState } from "react"
import { useFetch } from "../hooks/useFetch"
import { useFavorites } from "../hooks/useFavorites"
import FavoriteButton from "../components/FavoriteButton"
import { getScorers, getAssists, getExpulsions, getMinutes } from "../api/stats"

// ── Helpers ───────────────────────────────────────────────────────────────────

function positionBadge(position) {
  const styles = {
    goalkeeper: "bg-yellow-500/20 text-yellow-400",
    defender:   "bg-blue-500/20 text-blue-400",
    midfielder: "bg-green-500/20 text-green-400",
    forward:    "bg-red-500/20 text-red-400",
  }
  const labels = {
    goalkeeper: "POR",
    defender:   "DEF",
    midfielder: "MED",
    forward:    "DEL",
  }
  const key = position?.toLowerCase()
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[key] ?? "bg-gray-500/20 text-gray-400"}`}>
      {labels[key] ?? position}
    </span>
  )
}

function StatTable({ columns, rows, loading, error, onLoginRequired, onPlayerClick }) {
  const { isFavoritePlayer, togglePlayer } = useFavorites()

  if (loading) return <div className="text-center text-gray-500 py-16">Cargando...</div>
  if (error)   return (
    <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
      {error}
    </div>
  )
  if (!rows?.length) return <div className="text-center text-gray-500 py-16">Sin datos</div>

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-white/5 text-gray-400 uppercase text-xs tracking-wider">
            <th className="px-4 py-3 text-left w-8">#</th>
            <th className="px-4 py-3 text-left">Jugador</th>
            <th className="px-4 py-3 text-left">Equipo</th>
            <th className="px-4 py-3 text-center">Pos</th>
            <th className="px-4 py-3 text-center">PJ</th>
            {columns.map(col => (
              <th key={col.key} className="px-4 py-3 text-center font-bold text-white">
                {col.label}
              </th>
            ))}
            <th className="px-4 py-3 text-center w-8"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((row, i) => (
            <tr key={row.player_id} className="hover:bg-white/5 transition-colors text-gray-200">
              <td className="px-4 py-3 text-gray-500 font-mono">{i + 1}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onPlayerClick(row.player_id)}
                  className="text-white font-medium hover:text-yellow-400 transition-colors text-left"
                >
                  {row.player_name}
                </button>
              </td>
              <td className="px-4 py-3 text-gray-400">{row.team_name}</td>
              <td className="px-4 py-3 text-center">{positionBadge(row.position)}</td>
              <td className="px-4 py-3 text-center text-gray-400">{row.matches_played}</td>
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3 text-center font-bold text-white">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
              <td className="px-4 py-3 text-center">
                <FavoriteButton
                  isFav={isFavoritePlayer(row.player_id)}
                  onToggle={() => togglePlayer(row.player_id)}
                  onLoginRequired={onLoginRequired}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "scorers",    label: "⚽ Goleadores" },
  { id: "assists",    label: "🎯 Asistencias" },
  { id: "expulsions", label: "🟨 Disciplina" },
  { id: "minutes",    label: "⏱ Minutos" },
]

function ScorersTab({ onLoginRequired, onPlayerClick }) {
  const { data, loading, error } = useFetch(getScorers, [])
  return <StatTable loading={loading} error={error} rows={data}
    onLoginRequired={onLoginRequired} onPlayerClick={onPlayerClick}
    columns={[{ key: "goals", label: "Goles" }]} />
}

function AssistsTab({ onLoginRequired, onPlayerClick }) {
  const { data, loading, error } = useFetch(getAssists, [])
  return <StatTable loading={loading} error={error} rows={data}
    onLoginRequired={onLoginRequired} onPlayerClick={onPlayerClick}
    columns={[{ key: "assists", label: "Asist." }]} />
}

function ExpulsionsTab({ onLoginRequired, onPlayerClick }) {
  const { data, loading, error } = useFetch(getExpulsions, [])
  return <StatTable loading={loading} error={error} rows={data}
    onLoginRequired={onLoginRequired} onPlayerClick={onPlayerClick}
    columns={[
      { key: "yellow_cards", label: "🟨" },
      { key: "red_cards",    label: "🟥" },
    ]} />
}

function MinutesTab({ onLoginRequired, onPlayerClick }) {
  const { data, loading, error } = useFetch(getMinutes, [])
  return <StatTable loading={loading} error={error} rows={data}
    onLoginRequired={onLoginRequired} onPlayerClick={onPlayerClick}
    columns={[{ key: "minutes_played", label: "Minutos" }]} />
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function StatsPage({ onLoginRequired, onPlayerClick }) {
  const [tab, setTab] = useState("scorers")

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Estadísticas</h1>

      <div className="flex gap-1 mb-6 bg-white/5 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-white/15 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "scorers"    && <ScorersTab    onLoginRequired={onLoginRequired} onPlayerClick={onPlayerClick} />}
      {tab === "assists"    && <AssistsTab    onLoginRequired={onLoginRequired} onPlayerClick={onPlayerClick} />}
      {tab === "expulsions" && <ExpulsionsTab onLoginRequired={onLoginRequired} onPlayerClick={onPlayerClick} />}
      {tab === "minutes"    && <MinutesTab    onLoginRequired={onLoginRequired} onPlayerClick={onPlayerClick} />}
    </div>
  )
}
