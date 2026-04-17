import { useEffect, useState } from "react"

/**
 * Hook genérico para llamadas a la API.
 * 
 * Uso:
 *   const { data, loading, error, refetch } = useFetch(() => getMatches({ jornada: 1 }))
 *
 * - fn debe ser una función que devuelve una Promise
 * - deps es un array de dependencias que cuando cambian vuelven a hacer el fetch
 */
export function useFetch(fn, deps = []) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetch = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fn()
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, deps)

  return { data, loading, error, refetch: fetch }
}