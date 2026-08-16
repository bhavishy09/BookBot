import { useState } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // If already logged in, redirect to admin dashboard
  if (isAuthenticated) return <Navigate to="/admin" replace />

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fillDefaultCredentials = () => {
    setEmail('admin@bookbot.com')
    setPassword('BookBot#Admin2026!Secure')
  }

  return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem' }}>
      <div
        className="admin-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '2.5rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-gold-lg)',
        }}
      >
        <div className="brand-emblem" style={{ margin: '0 auto 1.25rem', width: '56px', height: '56px', fontSize: '1.5rem' }}>
          💈
        </div>

        <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-bright)', marginBottom: '0.35rem' }}>
          Admin Portal
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Secure authentication for BookBot salon management
        </p>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', color: 'var(--text-gold)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Admin Email
            </label>
            <input
              type="email"
              className="form-control-luxury"
              style={{ width: '100%', padding: '0.8rem 1rem' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@bookbot.com"
              required
              autoComplete="email"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', color: 'var(--text-gold)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Password
            </label>
            <input
              type="password"
              className="form-control-luxury"
              style={{ width: '100%', padding: '0.8rem 1rem' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#FCA5A5',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.88rem',
                marginBottom: '1.5rem',
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '0.85rem', marginBottom: '1.25rem' }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Dashboard ➔'}
          </button>
        </form>

        <div style={{ borderTop: '1px solid var(--gold-border)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={fillDefaultCredentials}
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
          <div style={{ marginTop: '0.75rem' }}>
            <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              ← Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
