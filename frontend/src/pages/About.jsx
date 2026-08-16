import { Link } from 'react-router-dom'
import { useState } from 'react'

export default function About() {
  const [openFaq, setOpenFaq] = useState(null)

  const faqs = [
    {
      q: 'How does the BookBot AI booking work?',
      a: 'BookBot is an AI-powered receptionist that understands natural human language. You can type requests like "I need a haircut tomorrow at 3 PM, my name is John Doe, phone 555-1234". The assistant finds open slots, verifies that no other appointment conflicts, and prepares a booking summary for you to confirm with a single "yes".',
    },
    {
      q: 'What are your business hours and location?',
      a: 'We are open 7 days a week (Monday through Sunday) from 9:00 AM to 5:00 PM. We are located in the Grand Luxury Salon District at 100 Grand Luxury Avenue, Suite 400.',
    },
    {
      q: 'Can I reschedule or cancel my appointment through chat?',
      a: 'Yes! You can simply tell BookBot: "Reschedule appointment #3 to tomorrow at 11 AM" or "Cancel my booking #5". The AI will immediately update or cancel the slot in real time.',
    },
    {
      q: 'How are double-booking conflicts prevented?',
      a: 'Our deterministic scheduling engine enforces strict database-wide availability validation across all services. Because we maintain single-provider undivided attention for every patron, an existing booking blocks that time slot from any other service.',
    },
    {
      q: 'What hygiene and safety standards do you follow?',
      a: 'We sterilize all razors, shears, and grooming instruments using medical-grade UV autoclaves between each client. We use disposable neck strips, fresh hot towels, and premium organic skincare products.',
    },
  ]

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx)
  }

  return (
    <div className="page-wrapper">
      {/* ── Header Banner ── */}
      <section className="hero-section" style={{ padding: '4rem 1.5rem 3.5rem' }}>
        <div className="container">
          <div className="hero-tagline-badge">
            <span>💈 CRAFTSMANSHIP & INNOVATION</span>
          </div>
          <h1 className="hero-title">
            About <span className="gold-accent">BookBot Barbershop</span>
          </h1>
          <p className="hero-desc">
            Bridging the timeless tradition of master grooming with modern conversational intelligence.
          </p>
        </div>
      </section>

      {/* ── Main Story & Standards ── */}
      <section className="philosophy-section">
        <div className="container">
          <div className="philosophy-grid">
            <div className="philosophy-card">
              <span className="section-label">OUR HERITAGE</span>
              <h2 className="section-heading">Master Barbering Meets AI</h2>
              <p className="philosophy-text">
                Established with a singular purpose: to elevate men's grooming into an unhurried, luxurious sanctuary. At BookBot Barbershop & Salon, we believe that self-care is a ritual of distinction.
              </p>
              <p className="philosophy-text">
                To respect our patrons' valuable time, we built **BookBot** — an intelligent conversational concierge that makes booking, rescheduling, and status inquiries completely seamless 24/7 without apps, logins, or tedious forms.
              </p>

              <div className="philosophy-features" style={{ marginTop: '1.5rem' }}>
                <div className="p-feature-item">
                  <span className="gold-check">✂️</span>
                  <span>Bespoke Styling tailored to hair texture and facial structure</span>
                </div>
                <div className="p-feature-item">
                  <span className="gold-check">🧖‍♂️</span>
                  <span>Authentic Hot Towel & Essential Oil Therapy with every service</span>
                </div>
                <div className="p-feature-item">
                  <span className="gold-check">🕒</span>
                  <span>Strict punctuality guarantee with 15-minute slot alignment</span>
                </div>
              </div>
            </div>

            <div className="philosophy-card" style={{ background: 'var(--bg-darkest)' }}>
              <span className="section-label">VISIT OUR SALON</span>
              <h2 className="section-heading">Location & Atmosphere</h2>
              <p className="philosophy-text">
                Step into our tranquil lounge with mahogany accents, vintage leather barber chairs, soothing ambient music, and complimentary artisan beverages.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--gold-border)', paddingTop: '1.25rem' }}>
                <div>
                  <h4 style={{ color: 'var(--gold-bright)', fontSize: '1rem', marginBottom: '0.25rem' }}>📍 Address</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                    100 Grand Luxury Avenue, Suite 400, Downtown Salon District
                  </p>
                </div>
                <div>
                  <h4 style={{ color: 'var(--gold-bright)', fontSize: '1rem', marginBottom: '0.25rem' }}>🕒 Operating Hours</h4>
                  <p style={{ color: 'var(--text-gold)', fontSize: '0.92rem', fontWeight: '600' }}>
                    Monday – Sunday: 9:00 AM – 5:00 PM (All days open)
                  </p>
                </div>
                <div>
                  <h4 style={{ color: 'var(--gold-bright)', fontSize: '1rem', marginBottom: '0.25rem' }}>📞 Phone Desk</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                    +1 (800) 555-BOOK
                  </p>
                </div>
              </div>

              <div style={{ marginTop: '2rem' }}>
                <Link to="/chat" className="btn btn-primary" style={{ width: '100%' }}>
                  Reserve a Slot with AI ⚡
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section className="services-section">
        <div className="container">
          <div className="section-header-center">
            <span className="section-label">FREQUENTLY ASKED QUESTIONS</span>
            <h2 className="section-heading">Everything You Need to Know</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Have questions about our services or AI booking process?
            </p>
          </div>

          <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx
              return (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-card)',
                    border: `1px solid ${isOpen ? 'var(--gold-primary)' : 'var(--gold-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    transition: 'var(--transition)',
                  }}
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    style={{
                      width: '100%',
                      padding: '1.25rem 1.5rem',
                      background: 'transparent',
                      border: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.05rem',
                      color: isOpen ? 'var(--gold-bright)' : 'var(--text-main)',
                    }}
                  >
                    <span>{faq.q}</span>
                    <span style={{ fontSize: '1.2rem', color: 'var(--gold-primary)' }}>
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>

                  {isOpen && (
                    <div style={{ padding: '0 1.5rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', borderTop: '1px solid rgba(212, 175, 55, 0.1)' }}>
                      <p style={{ paddingTop: '0.75rem' }}>{faq.a}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
