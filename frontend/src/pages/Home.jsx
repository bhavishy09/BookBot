import { Link } from 'react-router-dom'

export default function Home() {
  const categories = [
    { name: 'Facial Hair', icon: '✂️', label: 'Facial Hair' },
    { name: 'Facial', icon: '🧖‍♂️', label: 'Facial Care' },
    { name: 'Grooming', icon: '💈', label: 'Grooming' },
    { name: 'Massage', icon: '💆‍♂️', label: 'Massage' },
    { name: 'Hair Spa', icon: '✨', label: 'Hair Spa' },
    { name: 'Feet Care', icon: '👣', label: 'Feet Care' },
  ]

  const featuredServices = [
    {
      id: 1,
      name: 'Signature Haircut',
      duration: '30 min',
      price: '₹750',
      description: 'Precision scissor and clipper cut tailored to your face shape, finished with a hot towel refresh and styling.',
    },
    {
      id: 2,
      name: 'Beard Sculpting & Trim',
      duration: '15 min',
      price: '₹450',
      description: 'Meticulous beard shaping, razor line definition, and nourishing organic beard oil massage.',
    },
    {
      id: 3,
      name: 'Luxury Hair Coloring',
      duration: '60 min',
      price: '₹1,800',
      description: 'Ammonia-free premium hair coloring, gray coverage, and deep conditioning treatment.',
    },
    {
      id: 4,
      name: 'Revitalizing Royal Facial',
      duration: '45 min',
      price: '₹1,200',
      description: 'Deep cleansing, gentle steam exfoliation, botanical face pack, and relaxing acupressure massage.',
    },
    {
      id: 5,
      name: 'Therapeutic Full Massage',
      duration: '60 min',
      price: '₹2,200',
      description: 'Full body tension release massage with warm essential oils designed for deep rejuvenation.',
    },
  ]

  const testimonials = [
    {
      author: 'Rajat Mehra',
      role: 'Regular Patron',
      quote: '"The experience at BookBot Barbershop is unmatched. The attention to detail, the ambience, and the professional staff make it my go-to place for grooming every month!"',
    },
    {
      author: 'Arjun Kapoor',
      role: 'Verified Client',
      quote: '"Loved the classic shave and haircut! The AI booking was unbelievably fast — I just typed my preferred time and it reserved my slot instantly without waiting on call."',
    },
    {
      author: 'Vikram Singh',
      role: 'Executive Member',
      quote: '"A true gentleman\'s space! The interiors are elegant, the service is premium, and the barbers truly know their craft. Definitely a 5-star experience in men\'s grooming."',
    },
  ]

  return (
    <div className="page-wrapper">
      {/* ── 1. Hero Section ── */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-tagline-badge">
            <span>✨ INTELLIGENT GROOMING CONCIERGE</span>
          </div>

          <h1 className="hero-title">
            Redefine Your Style at <br />
            <span className="gold-accent">BookBot Barbershop & Salon</span>
          </h1>

          <p className="hero-desc">
            Step into a world where grooming becomes a ritual. Experience luxurious haircuts, beard sculpting, and wellness treatments paired with seamless 24/7 conversational AI scheduling.
          </p>

          <div className="hero-actions">
            <Link to="/chat" className="btn btn-primary">
              Book with AI Concierge ⚡
            </Link>
            <Link to="/about" className="btn btn-secondary">
              Explore Our Story 📖
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. Circular Category Badges (Matching Reference Screenshot 2) ── */}
      <section className="categories-section">
        <div className="container">
          <div className="categories-grid">
            {categories.map((cat, idx) => (
              <Link to="/chat" key={idx} className="category-item">
                <div className="category-icon-circle">
                  <span>{cat.icon}</span>
                </div>
                <span className="category-label">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Philosophy & Craftsmanship Section (Matching Reference Screenshot 2) ── */}
      <section className="philosophy-section">
        <div className="container">
          <div className="philosophy-grid">
            {/* Left Box: Philosophy Text */}
            <div className="philosophy-card">
              <span className="section-label">THE ART OF REFINEMENT</span>
              <h2 className="section-heading">Our Philosophy</h2>
              <p className="philosophy-text">
                At BookBot Barbershop, grooming is more than a routine — it is a ritual of self-respect and refinement. We blend the timeless art of classic barbering with modern techniques and intelligent scheduling.
              </p>
              <p className="philosophy-text">
                Every visit is a celebration of detail, master craftsmanship, and the enduring spirit of the modern gentleman. Unwind in luxury and leave looking and feeling your absolute best.
              </p>

              <div className="philosophy-features">
                <div className="p-feature-item">
                  <span className="gold-check">✔</span>
                  <span>Master Barbers with 10+ years bespoke experience</span>
                </div>
                <div className="p-feature-item">
                  <span className="gold-check">✔</span>
                  <span>100% Organic & Dermatologically Tested Products</span>
                </div>
                <div className="p-feature-item">
                  <span className="gold-check">✔</span>
                  <span>Single-client dedicated time slots with zero overlapping wait times</span>
                </div>
              </div>
            </div>

            {/* Right Box: AI Concierge Advantage */}
            <div className="philosophy-card" style={{ borderTop: '4px solid var(--gold-bright)' }}>
              <span className="section-label">EFFORTLESS SCHEDULING</span>
              <h2 className="section-heading">The AI Booking Experience</h2>
              <p className="philosophy-text">
                Say goodbye to waiting on hold or filling out tedious multi-step forms. Our AI receptionist understands natural conversational English:
              </p>

              <div style={{ background: 'rgba(7, 11, 24, 0.8)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--gold-border)', marginBottom: '1.5rem' }}>
                <p style={{ color: 'var(--text-gold)', fontStyle: 'italic', fontSize: '0.95rem' }}>
                  💬 "Book me a haircut for tomorrow at 2 PM and a beard trim."
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  ⚡ BookBot checks live availability, resolves conflicts, and confirms your reservation in seconds.
                </p>
              </div>

              <Link to="/chat" className="btn btn-primary" style={{ width: '100%' }}>
                Try AI Booking Now ✨
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Featured Services Menu (Matching Reference Screenshot 3) ── */}
      <section className="services-section">
        <div className="container">
          <div className="section-header-center">
            <span className="section-label">OUR CURATED MENU</span>
            <h2 className="section-heading">Bespoke Grooming Services</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
              Handcrafted treatments delivered with unmatched skill, care, and timeless style.
            </p>
          </div>

          <div className="services-grid">
            {featuredServices.map((svc) => (
              <div key={svc.id} className="service-card">
                <div>
                  <div className="service-header">
                    <h3 className="service-title">{svc.name}</h3>
                    <span className="service-duration-badge">⏱ {svc.duration}</span>
                  </div>
                  <p className="service-description">{svc.description}</p>
                </div>

                <div className="service-footer">
                  <span style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--gold-bright)' }}>
                    {svc.price}
                  </span>
                  <Link to={`/chat?service=${encodeURIComponent(svc.name)}`} className="btn btn-secondary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
                    Book with AI ✂️
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Testimonials Section (Matching Reference Screenshots 4 & 5) ── */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header-center">
            <span className="section-label">PATRON EXPERIENCES</span>
            <h2 className="section-heading">Our Customer Testimonials</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Hear what our distinguished patrons say about their BookBot experience.
            </p>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((t, i) => (
              <div key={i} className="testimonial-card">
                <div>
                  <div className="stars-row">★★★★★</div>
                  <p className="testimonial-quote">{t.quote}</p>
                </div>
                <div style={{ borderTop: '1px solid rgba(212, 175, 55, 0.15)', paddingTop: '1rem' }}>
                  <p className="testimonial-author">{t.author}</p>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. AI Feature Spotlight ("Why Choose BookBot") ── */}
      <section className="ai-spotlight-section">
        <div className="container">
          <div className="section-header-center">
            <span className="section-label">INNOVATION & INTELLIGENCE</span>
            <h2 className="section-heading">Why BookBot Stands Out</h2>
          </div>

          <div className="ai-features-grid">
            <div className="ai-feature-card">
              <div className="ai-feature-icon">🛡️</div>
              <h4 className="ai-feature-title">Zero Double-Booking</h4>
              <p className="ai-feature-desc">Single-provider calendar engine checks overlaps database-wide across all services.</p>
            </div>

            <div className="ai-feature-card">
              <div className="ai-feature-icon">🕒</div>
              <h4 className="ai-feature-title">24/7 Availability</h4>
              <p className="ai-feature-desc">Schedule, check status, or reschedule anytime day or night via natural conversational English.</p>
            </div>

            <div className="ai-feature-card">
              <div className="ai-feature-icon">🔄</div>
              <h4 className="ai-feature-title">Instant Rescheduling</h4>
              <p className="ai-feature-desc">Simply ask: "Move my appointment #3 to tomorrow at 11 AM" and let the AI resolve slots.</p>
            </div>

            <div className="ai-feature-card">
              <div className="ai-feature-icon">✨</div>
              <h4 className="ai-feature-title">Human-in-the-Loop</h4>
              <p className="ai-feature-desc">All bookings are staged and clearly summarized for your explicit confirmation before finalizing.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
