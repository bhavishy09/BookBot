import { useState, useEffect, useCallback } from 'react'
import {
  listAppointments,
  listServices,
  createAppointment,
  updateAppointment,
  cancelAppointment,
} from '../api/client'

/** Format an ISO datetime string as "Mon, Jan 15, 2025, 10:00 AM". */
function formatDateTime(iso) {
  const d = new Date(iso)
  return (
    d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) +
    ', ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  )
}

/** Add `duration` minutes to an HH:MM time string and return HH:MM. */
function addMinutes(timeStr, duration) {
  const [h, m] = timeStr.split(':').map(Number)
  const total = h * 60 + m + duration
  const nh = Math.floor(total / 60) % 24
  const nm = total % 60
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
}

/** Combine a date string and a time string into an ISO datetime. */
function toISO(dateStr, timeStr) {
  return `${dateStr}T${timeStr}:00`
}

/** Extract just the HH:MM portion from an ISO datetime. */
function extractTime(iso) {
  return iso.slice(11, 16)
}

/** Notification toast banner. */
function Toast({ message, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500)
    return () => clearTimeout(t)
  }, [onDone])

  const isError = type === 'error'
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        background: isError ? 'rgba(239, 68, 68, 0.95)' : 'var(--gold-gradient)',
        color: isError ? '#FFF' : '#070B18',
        fontWeight: '600',
        padding: '0.85rem 1.5rem',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}
    >
      <span>{message}</span>
      <button
        onClick={onDone}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          fontSize: '1.1rem',
          cursor: 'pointer',
          lineHeight: 1,
        }}
      >
        &times;
      </button>
    </div>
  )
}

/** Shared modal for creating and editing appointments. */
function AppointmentModal({ mode, initial, services, onSave, onClose }) {
  const [form, setForm] = useState({
    customer_name: initial?.customer_name || '',
    customer_contact: initial?.customer_contact || '',
    service_id: initial?.service_id || '',
    date: initial ? initial.start_time.slice(0, 10) : '',
    start_time: initial ? extractTime(initial.start_time) : '',
    end_time: initial ? extractTime(initial.end_time) : '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleServiceChange = (e) => {
    const sid = Number(e.target.value)
    const svc = services.find((s) => s.id === sid)
    const newEndTime = svc && form.start_time ? addMinutes(form.start_time, svc.duration_minutes) : ''
    setForm((f) => ({ ...f, service_id: sid, end_time: newEndTime }))
  }

  const handleStartTimeChange = (e) => {
    const st = e.target.value
    const svc = services.find((s) => s.id === form.service_id)
    const newEndTime = svc ? addMinutes(st, svc.duration_minutes) : ''
    setForm((f) => ({ ...f, start_time: st, end_time: newEndTime }))
  }

  const handleChange = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = {
        customer_name: form.customer_name,
        customer_contact: form.customer_contact,
        service_id: Number(form.service_id),
        start_time: toISO(form.date, form.start_time),
        end_time: toISO(form.date, form.end_time),
        created_via: 'admin',
      }
      await onSave(payload)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-bright)', margin: 0 }}>
            {mode === 'create' ? 'Create New Appointment' : 'Edit Appointment'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.5rem',
              cursor: 'pointer',
            }}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', color: 'var(--text-gold)', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                Customer Name
              </label>
              <input
                className="form-control-luxury"
                style={{ width: '100%' }}
                value={form.customer_name}
                onChange={handleChange('customer_name')}
                placeholder="e.g. Rahul Sharma"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', color: 'var(--text-gold)', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                Customer Contact (Phone / Email)
              </label>
              <input
                className="form-control-luxury"
                style={{ width: '100%' }}
                value={form.customer_contact}
                onChange={handleChange('customer_contact')}
                placeholder="e.g. +91 98765 43210"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', color: 'var(--text-gold)', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                Service
              </label>
              <select
                className="form-control-luxury"
                style={{ width: '100%' }}
                value={form.service_id}
                onChange={handleServiceChange}
                required
              >
                <option value="">Select a service…</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.duration_minutes} min)
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-gold)', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Date
                </label>
                <input
                  type="date"
                  className="form-control-luxury"
                  style={{ width: '100%' }}
                  value={form.date}
                  onChange={handleChange('date')}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', color: 'var(--text-gold)', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Start
                </label>
                <input
                  type="time"
                  className="form-control-luxury"
                  style={{ width: '100%' }}
                  value={form.start_time}
                  onChange={handleStartTimeChange}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', color: 'var(--text-gold)', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  End
                </label>
                <input
                  type="time"
                  className="form-control-luxury"
                  style={{ width: '100%' }}
                  value={form.end_time}
                  onChange={handleChange('end_time')}
                  required
                />
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#FCA5A5', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                ⚠️ {error}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
              {saving ? 'Saving...' : mode === 'create' ? 'Create Appointment' : 'Update Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/** Cancel confirmation dialog. */
function CancelDialog({ onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" style={{ maxWidth: '420px', padding: '2rem', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
        <h3 style={{ fontFamily: 'var(--font-serif)', color: '#FCA5A5', marginBottom: '0.5rem' }}>
          Cancel Appointment
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '1.75rem' }}>
          Are you sure you want to cancel this booking? This status change will be recorded in the system.
        </p>
        <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={onCancel} style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
            Keep Booking
          </button>
          <button
            className="btn"
            onClick={onConfirm}
            style={{ background: 'var(--status-cancelled)', color: '#FFF', padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
          >
            Yes, Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [appointments, setAppointments] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  const [filterDate, setFilterDate] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const [modalMode, setModalMode] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [toast, setToast] = useState(null)

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterDate) params.set('date', filterDate)
      if (filterStatus) params.set('status', filterStatus)
      const data = await listAppointments(params.toString())
      setAppointments(data)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [filterDate, filterStatus])

  useEffect(() => {
    listServices()
      .then(setServices)
      .catch(() => showToast('Failed to load services', 'error'))
  }, [])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const showToast = (message, type = 'success') =>
    setToast({ message, type, key: Date.now() })

  const handleCreate = async (payload) => {
    await createAppointment(payload)
    setModalMode(null)
    fetchAppointments()
    showToast('Appointment created successfully!')
  }

  const handleUpdate = async (payload) => {
    await updateAppointment(editTarget.id, payload)
    setModalMode(null)
    setEditTarget(null)
    fetchAppointments()
    showToast('Appointment updated successfully!')
  }

  const handleCancel = async () => {
    try {
      await cancelAppointment(cancelTarget.id)
      setCancelTarget(null)
      fetchAppointments()
      showToast('Appointment cancelled successfully.')
    } catch (err) {
      setCancelTarget(null)
      showToast(err.message, 'error')
    }
  }

  const openCreate = () => {
    setEditTarget(null)
    setModalMode('create')
  }

  const openEdit = (apt) => {
    setEditTarget(apt)
    setModalMode('edit')
  }

  return (
    <div className="page-wrapper" style={{ padding: '2.5rem 0 4rem' }}>
      <div className="container">
        <div className="admin-card">
          <div className="dashboard-header">
            <div>
              <span className="section-label">SALON MANAGEMENT</span>
              <h1 className="section-heading" style={{ fontSize: '2rem', margin: 0 }}>
                Appointments Dashboard
              </h1>
            </div>
            <button className="btn btn-primary" onClick={openCreate} style={{ padding: '0.65rem 1.4rem' }}>
              + New Appointment
            </button>
          </div>

          {/* Filter Bar */}
          <div className="filter-bar">
            <div>
              <label style={{ display: 'block', color: 'var(--text-gold)', fontSize: '0.78rem', fontWeight: '700', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                Filter by Date
              </label>
              <input
                type="date"
                className="form-control-luxury"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: 'var(--text-gold)', fontSize: '0.78rem', fontWeight: '700', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                Filter by Status
              </label>
              <select
                className="form-control-luxury"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {(filterDate || filterStatus) && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setFilterDate('')
                  setFilterStatus('')
                }}
                style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', alignSelf: 'flex-end' }}
              >
                Reset Filters ✕
              </button>
            )}
          </div>

          {/* Table */}
          <div className="data-table-container">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                Loading appointment records...
              </div>
            ) : appointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No appointments match your filters.</p>
                <p style={{ fontSize: '0.85rem' }}>Click "+ New Appointment" above to create one manually.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer Name</th>
                    <th>Contact</th>
                    <th>Service</th>
                    <th>Scheduled Time</th>
                    <th>Status</th>
                    <th>Created Via</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((apt) => (
                    <tr key={apt.id}>
                      <td style={{ fontWeight: '700', color: 'var(--gold-bright)' }}>#{apt.id}</td>
                      <td style={{ fontWeight: '600' }}>{apt.customer_name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{apt.customer_contact}</td>
                      <td>{apt.service_name}</td>
                      <td>{formatDateTime(apt.start_time)}</td>
                      <td>
                        <span className={`status-badge status-${apt.status}`}>
                          {apt.status}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          {apt.created_via}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-secondary"
                            onClick={() => openEdit(apt)}
                            style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
                          >
                            Edit
                          </button>
                          {apt.status === 'confirmed' && (
                            <button
                              className="btn"
                              onClick={() => setCancelTarget(apt)}
                              style={{
                                background: 'transparent',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                color: '#FCA5A5',
                                padding: '0.3rem 0.75rem',
                                fontSize: '0.78rem',
                              }}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}

      {modalMode && (
        <AppointmentModal
          mode={modalMode}
          initial={editTarget}
          services={services}
          onSave={modalMode === 'create' ? handleCreate : handleUpdate}
          onClose={() => {
            setModalMode(null)
            setEditTarget(null)
          }}
        />
      )}

      {cancelTarget && (
        <CancelDialog
          onConfirm={handleCancel}
          onCancel={() => setCancelTarget(null)}
        />
      )}
    </div>
  )
}