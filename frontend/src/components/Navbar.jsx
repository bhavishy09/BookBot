import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { isAuthenticated, isAdmin, isCustomer, userName, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="top-bar">
        <span>✂️ Book your luxury grooming session with BookBot AI Concierge</span>
        <span className="phone-badge">📞 Concierge: +1 (800) 555-BOOK</span>
        <span>📍 Grand Luxury Salon Lounge</span>
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

          {/* Only show Dashboard if logged in as Admin */}
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')}>
              Dashboard 📊
            </NavLink>
          )}

          {/* Authentication Section */}
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <span
                style={{
                  fontSize: '0.82rem',
                  color: isAdmin ? 'var(--gold-bright)' : 'var(--text-main)',
                  background: isAdmin ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                  padding: '0.25rem 0.65rem',
                  borderRadius: 'var(--radius-full)',
                  border: `1px solid ${isAdmin ? 'var(--gold-border-bright)' : 'rgba(255,255,255,0.15)'}`,
                  fontWeight: '600',
                }}
              >
                {isAdmin ? '🛡️ Admin' : `👤 ${userName || 'Patron'}`}
              </span>
              <button className="btn-logout" onClick={handleLogout} title="Sign Out">
                Logout ✕
              </button>
            </div>
          ) : (
            <NavLink to="/login" className={({ isActive }) => (isActive ? 'active' : '')}>
              Sign In
            </NavLink>
          )}
        </div>
      </nav>
    </>
  )
}
