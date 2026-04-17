import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { login, register } from "../api/auth"

export default function AuthModal({ onClose }) {
  const { signIn } = useAuth()
  const [mode, setMode]       = useState("login")   // "login" | "register"
  const [email, setEmail]     = useState("")
  const [password, setPass]   = useState("")
  const [error, setError]     = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === "login") {
        const data = await login(email, password)
        // Guardamos el token — el email lo usamos como nombre de usuario
        signIn(data.access_token, { email })
        onClose()
      } else {
        await register(email, password)
        // Tras registrarse hacemos login automático
        const data = await login(email, password)
        signIn(data.access_token, { email })
        onClose()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    // Overlay
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Card */}
      <div
        className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white font-bold text-lg">
            {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/30"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPass(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/30"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-gray-900 font-semibold rounded-lg py-2 text-sm hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Cargando..." : mode === "login" ? "Entrar" : "Registrarse"}
          </button>
        </form>

        {/* Switch modo */}
        <p className="text-center text-xs text-gray-500 mt-4">
          {mode === "login" ? "¿No tenés cuenta?" : "¿Ya tenés cuenta?"}{" "}
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null) }}
            className="text-white hover:underline"
          >
            {mode === "login" ? "Registrate" : "Iniciá sesión"}
          </button>
        </p>
      </div>
    </div>
  )
}
