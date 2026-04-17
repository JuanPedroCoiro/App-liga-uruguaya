import { useEffect, useRef, useState } from "react"
import { WS_BASE_URL } from "../api/client"

/**
 * Conecta al WebSocket y recibe todas las tablas en tiempo real.
 * Devuelve { data, connected, error }
 *
 * data: {
 *   apertura:     [],
 *   intermedio_a: [],
 *   intermedio_b: [],
 *   clausura:     [],
 *   anual:        [],
 * }
 */
export function useAllStandingsLive() {
  const [data, setData]         = useState(null)
  const [connected, setConnected] = useState(false)
  const [error, setError]         = useState(null)
  const wsRef = useRef(null)

  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE_URL}/stats/standings/live`)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      setError(null)
    }

    ws.onmessage = (event) => {
      try {
        setData(JSON.parse(event.data))
      } catch {
        console.error("Error parseando standings:", event.data)
      }
    }

    ws.onerror = () => setError("No se pudo conectar al servidor en tiempo real")
    ws.onclose = () => setConnected(false)

    return () => ws.close()
  }, [])

  return { data, connected, error }
}