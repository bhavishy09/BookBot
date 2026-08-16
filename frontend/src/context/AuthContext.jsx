/**
 * AuthContext — provides authentication and user profile state.
 * Supports both Admin authentication (JWT via backend API)
 * and Customer sign-in for seamless personalized bookings.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { login as apiLogin } from '../api/client'

const AuthContext = createContext(null)

/** Custom hook for consuming auth state. */
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    return {
      token: null,
      userRole: null,
      userEmail: null,
      userName: null,
      userPhone: null,
      isAuthenticated: false,
      isAdmin: false,
      isCustomer: false,
      login: async () => {},
      loginCustomer: () => {},
      logout: () => {},
    }
  }
  return ctx
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole')) // 'admin' | 'customer' | null
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('userEmail'))
  const [userName, setUserName] = useState(() => localStorage.getItem('userName'))
  const [userPhone, setUserPhone] = useState(() => localStorage.getItem('userPhone'))

  const isAuthenticated = !!token || userRole === 'customer'
  const isAdmin = userRole === 'admin' && !!token
  const isCustomer = userRole === 'customer'

  // Persist auth state to localStorage
  useEffect(() => {
    if (token && userRole === 'admin') {
      localStorage.setItem('token', token)
      localStorage.setItem('userRole', 'admin')
      localStorage.setItem('userEmail', userEmail || '')
      localStorage.setItem('userName', userName || 'Administrator')
    } else if (userRole === 'customer') {
      localStorage.setItem('userRole', 'customer')
      localStorage.setItem('userEmail', userEmail || '')
      localStorage.setItem('userName', userName || '')
      localStorage.setItem('userPhone', userPhone || '')
      localStorage.removeItem('token')
    } else {
      localStorage.removeItem('token')
      localStorage.removeItem('userRole')
      localStorage.removeItem('userEmail')
      localStorage.removeItem('userName')
      localStorage.removeItem('userPhone')
    }
  }, [token, userRole, userEmail, userName, userPhone])

  /**
   * Admin login — calls backend JWT endpoint.
   */
  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password)
    setToken(data.access_token)
    setUserRole('admin')
    setUserEmail(email)
    setUserName('Administrator')
    return data
  }, [])

  /**
   * Customer sign-in.
   */
  const loginCustomer = useCallback((name, email, phone) => {
    setUserRole('customer')
    setUserName(name)
    setUserEmail(email)
    setUserPhone(phone || '')
    setToken(null)
  }, [])

  /**
   * Logout helper.
   */
  const logout = useCallback(() => {
    setToken(null)
    setUserRole(null)
    setUserEmail(null)
    setUserName(null)
    setUserPhone(null)
  }, [])

  const value = {
    token,
    userRole,
    userEmail,
    userName,
    userPhone,
    isAuthenticated,
    isAdmin,
    isCustomer,
    login,
    loginCustomer,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
