import { createContext, useContext, useState } from "react"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // El token se persiste en localStorage para sobrevivir recargas
  const [token, setToken] = useState(() => localStorage.getItem("token"))
  const [user,  setUser]  = useState(() => {
    const saved = localStorage.getItem("user")
    return saved ? JSON.parse(saved) : null
  })

  function signIn(token, user) {
    localStorage.setItem("token", token)
    localStorage.setItem("user",  JSON.stringify(user))
    setToken(token)
    setUser(user)
  }

  function signOut() {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
