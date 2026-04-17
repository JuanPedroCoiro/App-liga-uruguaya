import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useFetch } from "../hooks/useFetch";
import { getFavoriteTeams } from "../api/auth";
import { getMatches } from "../api/matches";
import MatchDetailModal from "../components/MatchDetailModal";

// ── Tarjeta de partido ────────────────────────────────────────────────────────

function MatchCard({ match, onClick }) {
  const date = new Date(match.date);
  const finished = date < new Date();
  const dateStr = date.toLocaleDateString("es-UY", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timeStr = date.toLocaleTimeString("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white/5 border border-white/10 rounded-xl px-5 py-4 hover:bg-white/10 hover:border-white/20 transition-all"
    >
      <div className="flex justify-between text-xs text-gray-500 mb-2">
        <span>
          {dateStr} · {timeStr}
        </span>
        {match.jornada && <span>Jornada {match.jornada}</span>}
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-white font-semibold flex-1 text-right">
          {match.home_team_name}
        </span>
        <span
          className={`font-bold text-xl min-w-[80px] text-center ${finished ? "text-white" : "text-gray-500 text-sm"}`}
        >
          {finished ? `${match.home_score} - ${match.away_score}` : "vs"}
        </span>
        <span className="text-white font-semibold flex-1 text-left">
          {match.away_team_name}
        </span>
      </div>
    </button>
  );
}

// ── Sección de un equipo favorito ─────────────────────────────────────────────

function FavoriteTeamSection({ team, onMatchClick, onTeamClick }) {
  const { data: matches, loading } = useFetch(
    () =>
      getMatches().then((all) =>
        all.filter(
          (m) => m.home_team_id === team.id || m.away_team_id === team.id,
        ),
      ),
    [team.id],
  );

  return (
    <div className="mb-8">
      <div className="relative z-10">
        <button
          onClick={() => {
            console.log("click en equipo", team.id, typeof onTeamClick);
            onTeamClick(team.id);
          }}
          className="flex items-center gap-2 mb-3 group"
        >
          <h2 className="text-white font-bold text-lg group-hover:text-yellow-400 transition-colors">
            {team.name}
          </h2>
          <span className="text-gray-600 text-sm group-hover:text-yellow-400 transition-colors">
            →
          </span>
        </button>
      </div>

      {loading && <p className="text-gray-600 text-sm">Cargando partidos...</p>}

      {!loading && matches?.length === 0 && (
        <p className="text-gray-600 text-sm">Sin partidos registrados.</p>
      )}

      <div className="flex flex-col gap-2">
        {matches?.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            onClick={() => onMatchClick(match.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function FavoritesPage({ onLoginRequired, onTeamClick }) {
  const { token } = useAuth();
  const { data: favTeams, loading } = useFetch(
    () => (token ? getFavoriteTeams(token) : Promise.resolve([])),
    [token],
  );

  const [selectedMatchId, setSelectedMatchId] = useState(null);

  if (!token) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">⭐</p>
        <p className="text-white font-semibold text-lg mb-2">
          Iniciá sesión para ver tus favoritos
        </p>
        <p className="text-gray-500 text-sm mb-6">
          Seguí tus equipos favoritos y accedé a sus partidos fácilmente.
        </p>
        <button
          onClick={onLoginRequired}
          className="bg-white text-gray-900 font-semibold px-6 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors"
        >
          Iniciar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-8">Mis favoritos</h1>

      {loading && (
        <div className="text-center text-gray-500 py-16">Cargando...</div>
      )}

      {!loading && favTeams?.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">⭐</p>
          <p className="text-white font-semibold mb-2">
            No tenés equipos favoritos
          </p>
          <p className="text-gray-500 text-sm">
            Agregá equipos desde la tabla de posiciones.
          </p>
        </div>
      )}

      {favTeams?.map((team) => (
        <FavoriteTeamSection
          key={team.id}
          team={team}
          onMatchClick={setSelectedMatchId}
          onTeamClick={onTeamClick} // ← sube al App para manejar navegación
        />
      ))}

      {selectedMatchId && (
        <MatchDetailModal
          matchId={selectedMatchId}
          onClose={() => setSelectedMatchId(null)}
        />
      )}
    </div>
  );
}
