/**
 * Root component — sets up routing, auth, and navigation.
 * The AuthProvider wraps everything so any child can use useAuth().
 */
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Chat from './pages/Chat'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

/**
 * Protected route wrapper — redirects to /login if not authenticated.
 */
function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

/**
 * Navigation bar — shows Login or Logout depending on auth state.
 */
function Nav() {
  const { isAuthenticated, logout } = useAuth()

  return (
    <nav className="main-nav">
      <span className="nav-brand">Booking Assistant</span>
      <div className="nav-links">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
          Chat
        </NavLink>
        <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
          Dashboard
        </NavLink>
        {isAuthenticated ? (
          <button className="btn btn-secondary btn-logout" onClick={logout}>
            Logout
          </button>
        ) : (
          <NavLink to="/login" className={({ isActive }) => isActive ? 'active' : ''}>
            Login
          </NavLink>
        )}
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Nav />
        <Routes>
          <Route path="/" element={<Chat />} />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route path="/login" element={<Login />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
