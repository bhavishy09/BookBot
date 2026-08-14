/**
 * User-facing chat interface.
 * Generates a random session ID, fetches available services,
 * and provides a real-time-feeling chat with the AI assistant.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { sendChat, listServices } from '../api/client'

/** Generate a random UUID v4-like session identifier. */
function generateSessionId() {
  return 'sess_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

/** Format an ISO string to a short HH:MM time. */
function timeNow() {
  return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

// ── Services sidebar ──────────────────────────────────────────────

function ServicesSidebar({ services }) {
  if (!services.length) return null
  return (
    <aside className="chat-services">
      <h3>Available Services</h3>
      <ul>
        {services.map((s) => (
          <li key={s.id}>
            <strong>{s.name}</strong>
            <span>{s.duration_minutes} min</span>
          </li>
        ))}
      </ul>
    </aside>
  )
}

// ── Pending action banner ─────────────────────────────────────────

function PendingBanner({ action }) {
  if (!action) return null
  const desc = action.description || action.type || 'An action is ready.'
  return (
    <div className="pending-banner">
      <span>📋 {desc}</span>
    </div>
  )
}

// ── Main Chat Page ────────────────────────────────────────────────

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [waiting, setWaiting] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [services, setServices] = useState([])

  const sessionIdRef = useRef(generateSessionId())
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // ── Load available services on mount ──────────────────────────

  useEffect(() => {
    listServices().then(setServices).catch(() => {})
  }, [])

  // ── Auto-scroll to latest message ─────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, waiting])

  // ── Send message handler ──────────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || waiting) return

    // Append the user's message immediately
    const userMsg = { role: 'user', text, time: timeNow() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setWaiting(true)

    try {
      const data = await sendChat(sessionIdRef.current, text)
      const botMsg = { role: 'assistant', text: data.reply, time: timeNow() }
      setMessages((prev) => [...prev, botMsg])
      if (data.pending_action) {
        setPendingAction(data.pending_action)
      }
    } catch (err) {
      // Show the error as an assistant message so the user sees something
      const errMsg = { role: 'assistant', text: `Sorry, something went wrong: ${err.message}`, time: timeNow() }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setWaiting(false)
      inputRef.current?.focus()
    }
  }, [input, waiting])

  // Enter key submits
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="page chat-page">
      <h1 className="chat-title">Book an Appointment</h1>

      <div className="chat-layout">
        {/* Sidebar with services info */}
        <ServicesSidebar services={services} />

        {/* Main chat area */}
        <div className="chat-container">
          {/* Pending action banner */}
          <PendingBanner action={pendingAction} />

          {/* Messages area */}
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-empty">
                <p>Welcome! 👋 I can help you book, check, or cancel appointments.</p>
                <p>Try saying: &quot;I'd like to book a haircut for tomorrow at 2pm&quot;</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`chat-bubble chat-bubble-${msg.role}`}>
                <div className="chat-bubble-text">{msg.text}</div>
                <div className="chat-bubble-time">{msg.time}</div>
              </div>
            ))}
            {/* Typing indicator */}
            {waiting && (
              <div className="chat-bubble chat-bubble-assistant">
                <div className="typing-indicator">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="chat-input-bar">
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              placeholder="Type a message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={waiting}
            />
            <button
              className="btn btn-primary chat-send-btn"
              onClick={handleSend}
              disabled={waiting || !input.trim()}
            >
              {waiting ? <span className="spinner" /> : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
