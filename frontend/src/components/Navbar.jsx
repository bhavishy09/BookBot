import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth()

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="top-bar">
        <span>✂️ Book your luxury grooming session with BookBot AI Concierge</span>
        <span className="phone-badge">📞 Concierge: +91-7303880491</span>
        <span>📍 Noida, Sector 18</span>
      </div>

      {/* Main Luxury Navigation Bar */}
      <nav className="main-nav">
        <Link to="/" className="nav-brand">
          <div className="brand-emblem">
            <span>💈</span>
          </div>
          <div className="brand-text">
            <span className="brand-title">BOOKBOT</span>
            <span className="brand-subtitle">BARBERSHOP & SALON</span>
          </div>
        </Link>

        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Home
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => (isActive ? 'active' : '')}>
            About Us
          </NavLink>
          <NavLink to="/services" className={({ isActive }) => (isActive ? 'active' : '')}>
            Our Services
          </NavLink>
          <NavLink to="/chat" className={({ isActive }) => (isActive ? 'active nav-cta' : 'nav-cta')}>
            Book with AI ✨
          </NavLink>
          <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')}>
            Dashboard
          </NavLink>

          {isAuthenticated ? (
            <button className="btn-logout" onClick={logout}>
              Logout
            </button>
          ) : (
            <NavLink to="/login" className={({ isActive }) => (isActive ? 'active' : '')}>
              Admin Login
            </NavLink>
          )}
        </div>
      </nav>
    </>
  )
}
