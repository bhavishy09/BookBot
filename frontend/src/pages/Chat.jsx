import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { sendChat, listServices } from '../api/client'
import { useAuth } from '../context/AuthContext'

/** Generate a random UUID-like session identifier. */
function generateSessionId() {
  return 'sess_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

/** Format time as HH:MM AM/PM. */
function timeNow() {
  return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [waiting, setWaiting] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [services, setServices] = useState([])
  const [searchParams] = useSearchParams()
  const { isCustomer, userName, userPhone } = useAuth()

  const sessionIdRef = useRef(generateSessionId())
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const quickPrompts = [
    'Book a Haircut for tomorrow at 11 AM',
    'Check available slots for Facial',
    'What services do you offer?',
    'Reschedule my appointment #1 to 3 PM',
    'Check status of appointment #1',
  ]

  // Load services
  useEffect(() => {
    listServices()
      .then(setServices)
      .catch(() => {})
  }, [])

  // Auto-fill prompt if service passed via URL query or customer logged in
  useEffect(() => {
    const serviceParam = searchParams.get('service')
    if (serviceParam && messages.length === 0) {
      if (isCustomer && userName) {
        setInput(`I want to book a ${serviceParam} for tomorrow. My name is ${userName}${userPhone ? `, phone ${userPhone}` : ''}`)
      } else {
        setInput(`I want to book a ${serviceParam} for tomorrow. My name is `)
      }
    }
  }, [searchParams, messages.length, isCustomer, userName, userPhone])

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, waiting])

  // Send message
  const handleSend = useCallback(
    async (textToSend) => {
      const text = (textToSend || input).trim()
      if (!text || waiting) return

      const userMsg = { role: 'user', text, time: timeNow() }
      setMessages((prev) => [...prev, userMsg])
      setInput('')
      setWaiting(true)

      try {
        const data = await sendChat(sessionIdRef.current, text)
        const botMsg = { role: 'assistant', text: data.reply, time: timeNow() }
        setMessages((prev) => [...prev, botMsg])
        setPendingAction(data.pending_action || null)
      } catch (err) {
        const errMsg = {
          role: 'assistant',
          text: `I'm sorry, I encountered an issue connecting to the scheduling engine: ${err.message}`,
          time: timeNow(),
        }
        setMessages((prev) => [...prev, errMsg])
      } finally {
        setWaiting(false)
        inputRef.current?.focus()
      }
    },
    [input, waiting]
  )

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const selectServicePrompt = (svcName) => {
    if (isCustomer && userName) {
      setInput(`I would like to book a ${svcName} tomorrow at 2 PM. My name is ${userName}${userPhone ? `, phone ${userPhone}` : ''}.`)
    } else {
      setInput(`I would like to book a ${svcName}. What slots are open tomorrow?`)
    }
    inputRef.current?.focus()
  }

  return (
    <div className="page-wrapper" style={{ padding: '2rem 0' }}>
      <div className="container" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <span className="section-label">24/7 AI RECEPTIONIST</span>
        <h1 className="section-heading" style={{ fontSize: '2.4rem' }}>
          Book Your Grooming Session
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '620px', margin: '0 auto' }}>
          Chat with BookBot in natural English to book appointments, check open slots, or reschedule anytime.
        </p>

        {isCustomer && userName && (
          <div style={{ marginTop: '0.75rem' }}>
            <span
              style={{
                fontSize: '0.82rem',
                color: 'var(--gold-bright)',
                background: 'rgba(212, 175, 55, 0.12)',
                padding: '0.3rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--gold-border)',
              }}
            >
              ✨ Signed in as: <strong>{userName}</strong> ({userPhone || 'No phone set'})
            </span>
          </div>
        )}
      </div>

      <div className="chat-page-container">
        {/* ── Left Sidebar: Services Menu ── */}
        <aside className="chat-sidebar">
          <h3 className="sidebar-title">💈 Available Services</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Click any service to quickly generate a booking request:
          </p>

          <div className="services-list-compact">
            {services.map((s) => (
              <div
                key={s.id}
                className="service-compact-item"
                onClick={() => selectServicePrompt(s.name)}
                title="Click to draft a booking message"
              >
                <div>
                  <strong style={{ color: 'var(--text-main)', fontSize: '0.92rem' }}>{s.name}</strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-gold)' }}>⏱ {s.duration_minutes} min</div>
                </div>
                <span style={{ color: 'var(--gold-bright)', fontSize: '0.85rem' }}>Book ➔</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(7, 11, 24, 0.6)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gold-border)' }}>
            <h4 style={{ color: 'var(--gold-bright)', fontSize: '0.9rem', marginBottom: '0.35rem' }}>🕒 Business Hours</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Mon – Sun: 9:00 AM – 5:00 PM<br />
              Slots align to 15-minute intervals.
            </p>
          </div>
        </aside>

        {/* ── Right: Chat Interface ── */}
        <main className="chat-main-card">
          {/* Chat Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="brand-emblem" style={{ width: '34px', height: '34px', fontSize: '1rem' }}>
                💈
              </div>
              <div>
                <h4 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-bright)', fontSize: '1.05rem', margin: 0 }}>
                  BookBot AI Concierge
                </h4>
                <span style={{ fontSize: '0.75rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span className="chat-status-dot" /> Online • Ready to assist
                </span>
              </div>
            </div>
            <Link to="/about" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              How it works ❓
            </Link>
          </div>

          {/* Pending Action Banner */}
          {pendingAction && (
            <div
              style={{
                background: 'rgba(212, 175, 55, 0.15)',
                borderBottom: '1px solid var(--gold-primary)',
                padding: '0.75rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                color: 'var(--gold-bright)',
                fontSize: '0.9rem',
                fontWeight: '600',
              }}
            >
              <span>📋 Action Pending: Please reply <strong>"yes"</strong> to confirm or <strong>"no"</strong> to cancel.</span>
            </div>
          )}

          {/* Messages Area */}
          <div className="chat-messages-area">
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', margin: 'auto', maxWidth: '480px', padding: '2rem 1rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💈</div>
                <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-bright)', marginBottom: '0.5rem' }}>
                  Welcome to BookBot Barbershop
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '1.5rem' }}>
                  I can check open slots, reserve appointments, answer service queries, or reschedule existing bookings.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-gold)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Quick Start Prompts:
                  </span>
                  {quickPrompts.slice(0, 3).map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(prompt)}
                      className="suggestion-chip"
                      style={{ textAlign: 'left', padding: '0.5rem 1rem' }}
                    >
                      💬 "{prompt}"
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`chat-bubble bubble-${msg.role}`}>
                <div>{msg.text}</div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    marginTop: '0.4rem',
                    textAlign: 'right',
                    opacity: 0.7,
                  }}
                >
                  {msg.time}
                </div>
              </div>
            ))}

            {waiting && (
              <div className="chat-bubble bubble-assistant" style={{ fontStyle: 'italic', color: 'var(--gold-light)' }}>
                <span>BookBot is checking calendar & preparing response... ✨</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Suggestion Chips Bar */}
          <div className="chat-suggestions-bar">
            {quickPrompts.map((p, idx) => (
              <button key={idx} className="suggestion-chip" onClick={() => handleSend(p)}>
                {p}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="chat-input-container">
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              placeholder="e.g. Book a haircut for tomorrow at 2 PM, my name is John..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={waiting}
            />
            <button
              className="btn btn-primary"
              onClick={() => handleSend()}
              disabled={waiting || !input.trim()}
              style={{ padding: '0 1.5rem' }}
            >
              {waiting ? 'Sending...' : 'Send ➔'}
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
