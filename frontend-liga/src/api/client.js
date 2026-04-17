const BASE_URL = "http://127.0.0.1:8000"

export async function apiFetch(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.detail || "Error en la API")
  }

  // 204 No Content no tiene body
  if (res.status === 204) return null
  return res.json()
}

export const WS_BASE_URL = "ws://127.0.0.1:8000"