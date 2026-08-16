import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Footer() {
  const { isAdmin } = useAuth()

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          {/* Col 1: Brand & Philosophy */}
          <div>
            <div className="nav-brand" style={{ marginBottom: '1.25rem' }}>
              <div className="brand-emblem">
                <span>💈</span>
              </div>
              <div className="brand-text">
                <span className="brand-title">BOOKBOT</span>
                <span className="brand-subtitle">BARBERSHOP & SALON</span>
              </div>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.7', maxWidth: '340px' }}>
              Where master barbering craftsmanship meets artificial intelligence. Experience bespoke grooming rituals, zero wait times, and effortless 24/7 conversational booking.
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="footer-col-title">Navigation</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/services">Services & Pricing</Link></li>
              <li><Link to="/chat">Book with AI Concierge</Link></li>
              {isAdmin ? (
                <li><Link to="/admin">Admin Dashboard</Link></li>
              ) : (
                <li><Link to="/login">Sign In / Admin Login</Link></li>
              )}
            </ul>
          </div>

          {/* Col 3: Services */}
          <div>
            <h4 className="footer-col-title">Services</h4>
            <ul className="footer-links">
              <li><Link to="/chat">Signature Haircut (30m)</Link></li>
              <li><Link to="/chat">Beard Sculpting (15m)</Link></li>
              <li><Link to="/chat">Hair Coloring (60m)</Link></li>
              <li><Link to="/chat">Royal Facial (45m)</Link></li>
              <li><Link to="/chat">Therapeutic Massage (60m)</Link></li>
            </ul>
          </div>

          {/* Col 4: Hours & Location */}
          <div>
            <h4 className="footer-col-title">Hours & Concierge</h4>
            <p style={{ color: 'var(--text-gold)', fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.92rem' }}>
              🕒 Mon – Sun: 9:00 AM – 5:00 PM
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              📍 100 Grand Luxury Avenue, Suite 400
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              📞 Direct Desk: +1 (800) 555-BOOK
            </p>
            <Link to="/chat" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
              Instant AI Booking ⚡
            </Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} BookBot Barbershop & Salon. All rights reserved. Powered by BookBot Intelligent Concierge.</p>
        </div>
      </div>
    </footer>
  )
}
