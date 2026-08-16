import { useState } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, loginCustomer, isAuthenticated, isAdmin } = useAuth()
  const navigate = useNavigate()

  // If already logged in as admin, go to dashboard; if customer, go to chat
  if (isAdmin) return <Navigate to="/admin" replace />
  if (isAuthenticated) return <Navigate to="/chat" replace />

  // Tab mode: 'admin' | 'customer'
  const [tab, setTab] = useState('admin')

  // Admin form state
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminError, setAdminError] = useState('')
  const [adminLoading, setAdminLoading] = useState(false)

  // Customer form state
  const [custName, setCustName] = useState('')
  const [custEmail, setCustEmail] = useState('')
  const [custPhone, setCustPhone] = useState('')

  // Handle Admin Login (Strict validation via API JWT)
  const handleAdminSubmit = async (e) => {
    e.preventDefault()
    setAdminError('')
    setAdminLoading(true)
    try {
      await login(adminEmail, adminPassword)
      navigate('/admin', { replace: true })
    } catch (err) {
      setAdminError(err.message || 'Invalid email or password.')
    } finally {
      setAdminLoading(false)
    }
  }

  // Handle Patron Sign In (stores local patron session)
  const handleCustomerSubmit = (e) => {
    e.preventDefault()
    if (!custName.trim() || !custEmail.trim()) return
    loginCustomer(custName.trim(), custEmail.trim(), custPhone.trim())
    navigate('/chat', { replace: true })
  }

  const fillDefaultAdminCredentials = () => {
    setAdminEmail('admin@bookbot.com')
    setAdminPassword('BookBot#Admin2026!Secure')
    setAdminError('')
  }

  return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem' }}>
      <div
        className="admin-card"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '2.5rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-gold-lg)',
        }}
      >
        <div className="brand-emblem" style={{ margin: '0 auto 1.25rem', width: '56px', height: '56px', fontSize: '1.5rem' }}>
          💈
        </div>

        <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-bright)', marginBottom: '0.35rem' }}>
          BookBot Sign In
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.75rem' }}>
          Choose your account type below to continue
        </p>

        {/* Tab Selection */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'var(--bg-darkest)',
            borderRadius: 'var(--radius-full)',
            padding: '0.3rem',
            border: '1px solid var(--gold-border)',
            marginBottom: '2rem',
          }}
        >
          <button
            type="button"
            onClick={() => setTab('admin')}
            style={{
              background: tab === 'admin' ? 'var(--gold-gradient)' : 'transparent',
              color: tab === 'admin' ? '#070B18' : 'var(--text-muted)',
              fontWeight: '700',
              fontSize: '0.85rem',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              padding: '0.55rem 0',
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
          >
            🛡️ Admin Login
          </button>
          <button
            type="button"
            onClick={() => setTab('customer')}
            style={{
              background: tab === 'customer' ? 'var(--gold-gradient)' : 'transparent',
              color: tab === 'customer' ? '#070B18' : 'var(--text-muted)',
              fontWeight: '700',
              fontSize: '0.85rem',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              padding: '0.55rem 0',
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
          >
            👤 Patron / User
          </button>
        </div>

        {/* ── TAB 1: Admin Login ── */}
        {tab === 'admin' && (
          <form onSubmit={handleAdminSubmit} style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', color: 'var(--text-gold)', fontSize: '0.82rem', fontWeight: '700', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Admin Email
              </label>
              <input
                type="email"
                className="form-control-luxury"
                style={{ width: '100%', padding: '0.8rem 1rem' }}
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@bookbot.com"
                required
                autoComplete="email"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: 'var(--text-gold)', fontSize: '0.82rem', fontWeight: '700', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Admin Password
              </label>
              <input
                type="password"
                className="form-control-luxury"
                style={{ width: '100%', padding: '0.8rem 1rem' }}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {adminError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#FCA5A5',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  marginBottom: '1.5rem',
                }}
              >
                ⚠️ {adminError}
              </div>
            )}

            <button
              className="btn btn-primary"
              type="submit"
              disabled={adminLoading}
              style={{ width: '100%', padding: '0.85rem', marginBottom: '1.25rem' }}
            >
              {adminLoading ? 'Authenticating...' : 'Sign In as Admin ➔'}
            </button>

            <div style={{ borderTop: '1px solid var(--gold-border)', paddingTop: '1.25rem', textAlign: 'center' }}>
              <button
                type="button"
                onClick={fillDefaultAdminCredentials}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--gold-bright)',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                🔑 Fill Default Admin Credentials
              </button>
            </div>
          </form>
        )}

        {/* ── TAB 2: Patron Sign In ── */}
        {tab === 'customer' && (
          <form onSubmit={handleCustomerSubmit} style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', color: 'var(--text-gold)', fontSize: '0.82rem', fontWeight: '700', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Your Full Name
              </label>
              <input
                type="text"
                className="form-control-luxury"
                style={{ width: '100%', padding: '0.8rem 1rem' }}
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                placeholder="e.g. Alexander Reed"
                required
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', color: 'var(--text-gold)', fontSize: '0.82rem', fontWeight: '700', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Email Address
              </label>
              <input
                type="email"
                className="form-control-luxury"
                style={{ width: '100%', padding: '0.8rem 1rem' }}
                value={custEmail}
                onChange={(e) => setCustEmail(e.target.value)}
                placeholder="alexander@example.com"
                required
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: 'var(--text-gold)', fontSize: '0.82rem', fontWeight: '700', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                className="form-control-luxury"
                style={{ width: '100%', padding: '0.8rem 1rem' }}
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
                placeholder="+1 (555) 019-2834"
              />
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              style={{ width: '100%', padding: '0.85rem', marginBottom: '1.25rem' }}
            >
              Continue as Patron ✨
            </button>
          </form>
        )}

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            ← Return to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
