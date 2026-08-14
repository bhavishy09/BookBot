/**
 * AuthContext — provides authentication state to the whole app.
 * Stores the JWT token in localStorage and exposes login/logout helpers.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { login as apiLogin } from '../api/client'

const AuthContext = createContext(null)

/** Custom hook for consuming auth state. */
export const useAuth = () => useContext(AuthContext)

/**
 * Provider component — wrap the App with this.
 * On mount it checks localStorage for an existing token.
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('userEmail'))

  // Derived boolean — true when a token exists
  const isAuthenticated = !!token

  // Persist token & email to localStorage whenever they change
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
      localStorage.setItem('userEmail', userEmail || '')
    } else {
      localStorage.removeItem('token')
      localStorage.removeItem('userEmail')
    }
  }, [token, userEmail])

  /**
   * Call the login API and store the returned token.
   * Throws on failure so the caller can catch and show errors.
   */
  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password)
    setToken(data.access_token)
    setUserEmail(email)
    return data
  }, [])

  /** Clear token and redirect (caller handles navigation). */
  const logout = useCallback(() => {
    setToken(null)
    setUserEmail(null)
  }, [])

  const value = { token, userEmail, isAuthenticated, login, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
