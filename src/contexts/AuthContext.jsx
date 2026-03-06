import { createContext, useContext, useState, useEffect } from 'react'
import * as api from '../utils/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const userData = await api.getCurrentUser()
          setUser(userData)
        } catch {
          localStorage.removeItem('token')
          setToken(null)
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [token])

  const login = async (credentials) => {
    try {
      const response = await api.login(credentials)
      localStorage.setItem('token', response.access_token)
      setToken(response.access_token)
      const userData = await api.getCurrentUser()
      setUser(userData)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const register = async (userData) => {
    try {
      await api.register(userData)
      // US-000: Nach Registrierung automatisch einloggen
      const response = await api.login({ email: userData.email, password: userData.password })
      localStorage.setItem('token', response.access_token)
      setToken(response.access_token)
      const currentUser = await api.getCurrentUser()
      setUser(currentUser)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const logout = async () => {
    try {
      await api.logout()
    } catch {
      // Token serverseitig bereits ungültig - ignorieren
    }
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
