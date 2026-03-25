import { createContext, useContext, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const saved = localStorage.getItem('usuario')
    return saved ? JSON.parse(saved) : null
  })

  async function login(usuario, password) {
    const { data } = await api.post('/auth/login', { usuario, password })
    localStorage.setItem('token', data.access_token)
    const { data: me } = await api.get('/auth/me')
    localStorage.setItem('usuario', JSON.stringify(me))
    setUsuario(me)
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
