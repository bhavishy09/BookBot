import { Link } from 'react-router-dom'

export default function Services() {
  const servicesList = [
    {
      id: 1,
      name: 'Signature Haircut',
      duration: '30 min',
      price: '₹750',
      tag: 'Most Popular',
      description: 'Precision scissor and clipper cut tailored to your face shape, finished with a hot towel refresh, neck shave, and artisan styling.',
      includes: ['Consultation & Hair Analysis', 'Invigorating Scalp Cleanse', 'Precision Cut & Styling', 'Hot Towel Neck Refresh'],
    },
    {
      id: 2,
      name: 'Beard Sculpting & Trim',
      duration: '15 min',
      price: '₹450',
      tag: 'Classic',
      description: 'Meticulous beard shaping, razor line definition, and nourishing organic beard oil massage for a distinguished silhouette.',
      includes: ['Beard Trimming & Fade', 'Straight Razor Outline', 'Hot Towel Treatment', 'Organic Beard Oil Nourishment'],
    },
    {
      id: 3,
      name: 'Luxury Hair Coloring',
      duration: '60 min',
      price: '₹1,800',
      tag: 'Premium Care',
      description: 'Ammonia-free premium hair coloring, natural gray coverage, and deep conditioning treatment for radiant, long-lasting vitality.',
      includes: ['Color Matching Consultation', 'Gentle Ammonia-Free Formulation', 'Post-Color Intensive Mask', 'Blowout & Styling'],
    },
    {
      id: 4,
      name: 'Revitalizing Royal Facial',
      duration: '45 min',
      price: '₹1,200',
      tag: 'Wellness',
      description: 'Deep pore cleansing, gentle steam exfoliation, botanical face pack, and relaxing acupressure massage to restore skin glow.',
      includes: ['Hydrating Skin Cleanser', 'Dead Skin Cell Exfoliation', 'Herbal Steam & Pore Therapy', 'Acupressure Face Massage'],
    },
    {
      id: 5,
      name: 'Therapeutic Full Massage',
      duration: '60 min',
      price: '₹2,200',
      tag: 'Deep Relaxation',
      description: 'Full body tension release massage with warm organic essential oils designed for maximum physical and mental rejuvenation.',
      includes: ['Warm Essential Oil Blend', 'Deep Muscle Tension Release', 'Pressure Point Relief', 'Warm Herbal Compress'],
    },
  ]

  const packages = [
    {
      name: "The Gentleman's Royal Ritual",
      duration: '90 min',
      price: '₹2,999',
      items: 'Signature Haircut + Beard Sculpting + Revitalizing Royal Facial',
      description: 'The definitive complete grooming makeover for weddings, executive meetings, or weekend indulgence.',
    },
    {
      name: 'Classic Cut & Beard Combo',
      duration: '45 min',
      price: '₹1,099',
      items: 'Signature Haircut + Beard Sculpting & Razor Outline',
      description: 'Our staple monthly grooming ritual to keep your look sharp, fresh, and polished.',
    },
    {
      name: 'The Rejuvenation Retreat',
      duration: '105 min',
      price: '₹3,299',
      items: 'Royal Facial + Therapeutic Massage + Scalp Cleanse',
      description: 'A deeply relaxing wellness session designed to melt away workday stress.',
    },
  ]

  return (
    <div className="page-wrapper">
      {/* ── Banner ── */}
      <section className="hero-section" style={{ padding: '4rem 1.5rem 3.5rem' }}>
        <div className="container">
          <div className="hero-tagline-badge">
            <span>💈 CRAFTED EXCELLENCE</span>
          </div>
          <h1 className="hero-title">
            Our Services & <span className="gold-accent">Grooming Menu</span>
          </h1>
          <p className="hero-desc">
            Explore our artisanal grooming services. Every treatment is delivered with undivided attention and master precision.
          </p>
        </div>
      </section>

      {/* ── Individual Services ── */}
      <section className="services-section">
        <div className="container">
          <div className="section-header-center">
            <span className="section-label">INDIVIDUAL TREATMENTS</span>
            <h2 className="section-heading">Bespoke À La Carte Services</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Select a service below and book your slot in seconds with our AI receptionist.
            </p>
          </div>

          <div className="services-grid">
            {servicesList.map((svc) => (
              <div key={svc.id} className="service-card">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gold-bright)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700' }}>
                      {svc.tag}
                    </span>
                    <span className="service-duration-badge">⏱ {svc.duration}</span>
                  </div>

                  <h3 className="service-title" style={{ marginBottom: '0.5rem' }}>{svc.name}</h3>
                  <p className="service-description" style={{ marginBottom: '1.25rem' }}>{svc.description}</p>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-gold)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                      What's Included:
                    </span>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {svc.includes.map((inc, i) => (
                        <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span style={{ color: 'var(--gold-bright)' }}>•</span> {inc}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="service-footer">
                  <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--gold-bright)' }}>
                    {svc.price}
                  </span>
                  <Link
                    to={`/chat?service=${encodeURIComponent(svc.name)}`}
                    className="btn btn-primary"
                    style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                  >
                    Book with AI ⚡
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Signature Packages ── */}
      <section className="philosophy-section">
        <div className="container">
          <div className="section-header-center">
            <span className="section-label">CURATED PACKAGES</span>
            <h2 className="section-heading">Signature Grooming Rituals</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Complete experience packages curated for total style elevation and relaxation.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {packages.map((pkg, idx) => (
              <div key={idx} className="philosophy-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-bright)', fontSize: '1.25rem' }}>
                      {pkg.name}
                    </h3>
                    <span style={{ color: 'var(--text-gold)', fontWeight: '700', fontSize: '1.25rem' }}>
                      {pkg.price}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.75rem' }}>
                    ⏱ Duration: {pkg.duration}
                  </span>
                  <p style={{ color: 'var(--text-main)', fontSize: '0.92rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    ✨ Includes: {pkg.items}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                    {pkg.description}
                  </p>
                </div>

                <Link
                  to={`/chat?service=${encodeURIComponent(pkg.name)}`}
                  className="btn btn-secondary"
                  style={{ width: '100%', textAlign: 'center' }}
                >
                  Reserve Package with AI ➔
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
