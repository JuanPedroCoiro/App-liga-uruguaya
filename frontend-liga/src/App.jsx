import { useState } from "react"
import { useAuth } from "./context/AuthContext"
import AuthModal     from "./components/AuthModal"
import StandingsPage from "./pages/StandingsPage"
import FixturePage   from "./pages/FixturePage"
import StatsPage     from "./pages/StatsPage"
import ProfilePage   from "./pages/ProfilePage"
import FavoritesPage from "./pages/FavoritesPage"
import TeamPage      from "./pages/TeamPage"
import PlayerPage    from "./pages/PlayerPage"

const TABS = [
  { id: "standings",  label: "Tabla" },
  { id: "fixture",    label: "Fixture" },
  { id: "stats",      label: "Estadísticas" },
  { id: "favorites",  label: "⭐ Favoritos" },
]

export default function App() {
  const { user, token } = useAuth()
  const [tab, setTab]             = useState("standings")
  const [showModal, setShowModal] = useState(false)
  const [teamPageId,   setTeamPageId]   = useState(null)
  const [playerPageId, setPlayerPageId] = useState(null)

  function openLogin() { setShowModal(true) }

  function handleProfileClick() {
    token ? setTab("profile") : setShowModal(true)
  }

  function navigateToTeam(teamId) {
    setPlayerPageId(null)
    setTeamPageId(teamId)
  }

  function navigateToPlayer(playerId) {
    setTeamPageId(null)
    setPlayerPageId(playerId)
  }

  function handleTeamBack() {
    setTeamPageId(null)
  }

  function handlePlayerBack() {
    setPlayerPageId(null)
  }

  function handleTabChange(newTab) {
    setTeamPageId(null)
    setPlayerPageId(null)
    setTab(newTab)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-white/10 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 flex items-center gap-1 h-14">
          <span className="font-bold text-white mr-6 text-lg">⚽ Liga Uruguaya</span>

          <div className="flex items-center gap-1 flex-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.id && !teamPageId && !playerPageId
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleProfileClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "profile" && !teamPageId && !playerPageId
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {token ? (
              <>
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
                  {user?.email?.[0]?.toUpperCase()}
                </span>
                <span className="hidden sm:block">{user?.email?.split("@")[0]}</span>
              </>
            ) : (
              "Iniciar sesión"
            )}
          </button>
        </div>
      </nav>

      {/* Contenido */}
      <main>
        {teamPageId ? (
          <TeamPage
            teamId={teamPageId}
            onBack={handleTeamBack}
            onLoginRequired={openLogin}
            onPlayerClick={navigateToPlayer}
          />
        ) : playerPageId ? (
          <PlayerPage
            playerId={playerPageId}
            onBack={handlePlayerBack}
            onLoginRequired={openLogin}
          />
        ) : (
          <>
            {tab === "standings" && (
              <StandingsPage
                onLoginRequired={openLogin}
                onTeamClick={navigateToTeam}
              />
            )}
            {tab === "fixture"   && <FixturePage />}
            {tab === "stats"     && (
              <StatsPage
                onLoginRequired={openLogin}
                onPlayerClick={navigateToPlayer}
              />
            )}
            {tab === "favorites" && (
              <FavoritesPage
                onLoginRequired={openLogin}
                onTeamClick={navigateToTeam}
              />
            )}
            {tab === "profile" && (
              <ProfilePage
                onPlayerClick={navigateToPlayer}
                onTeamClick={navigateToTeam}
              />
            )}
          </>
        )}
      </main>

      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
