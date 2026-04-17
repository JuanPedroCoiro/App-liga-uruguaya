import { useAuth } from "../context/AuthContext"

/**
 * Botón de estrella para marcar/desmarcar favoritos.
 * Si el usuario no está logueado, llama a onLoginRequired.
 *
 * Props:
 *   - isFav:            boolean
 *   - onToggle:         () => void
 *   - onLoginRequired:  () => void  (abre el modal de login)
 */
export default function FavoriteButton({ isFav, onToggle, onLoginRequired }) {
  const { token } = useAuth()

  function handleClick(e) {
    e.stopPropagation() // evita que dispare el onClick del padre (ej: abrir modal)
    if (!token) {
      onLoginRequired?.()
      return
    }
    onToggle()
  }

  return (
    <button
      onClick={handleClick}
      title={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
      className={`text-lg leading-none transition-all hover:scale-110 ${
        isFav ? "text-yellow-400" : "text-gray-600 hover:text-yellow-400"
      }`}
    >
      {isFav ? "★" : "☆"}
    </button>
  )
}
