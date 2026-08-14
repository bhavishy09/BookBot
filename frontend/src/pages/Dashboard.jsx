/**
 * Admin dashboard — full CRUD for appointments.
 * Includes: filter bar, data table, create/edit modal, cancel confirmation.
 */
import { useState, useEffect, useCallback } from 'react'
import {
  listAppointments,
  listServices,
  createAppointment,
  updateAppointment,
  cancelAppointment,
} from '../api/client'

// ── Helpers ────────────────────────────────────────────────────────

/** Format an ISO datetime string as "Mon, Jan 15, 2025, 10:00 AM". */
function formatDateTime(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  }) + ', ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
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

// ── Toast Component ───────────────────────────────────────────────

/** Auto-dismissing notification banner. */
function Toast({ message, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className={`toast toast-${type}`}>
      <span>{message}</span>
      <button className="toast-close" onClick={onDone}>&times;</button>
    </div>
  )
}

// ── Appointment Modal ─────────────────────────────────────────────

/** Shared form for creating and editing appointments. */
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

  // Auto-calculate end_time when the service selection changes
  const handleServiceChange = (e) => {
    const sid = Number(e.target.value)
    const svc = services.find((s) => s.id === sid)
    const newEndTime = svc ? addMinutes(form.start_time, svc.duration_minutes) : ''
    setForm((f) => ({ ...f, service_id: sid, end_time: newEndTime }))
  }

  // Also recalculate end_time when start_time changes (if a service is selected)
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
          <h2>{mode === 'create' ? 'New Appointment' : 'Edit Appointment'}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="cust-name">Customer Name</label>
            <input id="cust-name" value={form.customer_name} onChange={handleChange('customer_name')} required />
          </div>

          <div className="form-group">
            <label htmlFor="cust-contact">Customer Contact</label>
            <input id="cust-contact" value={form.customer_contact} onChange={handleChange('customer_contact')} required />
          </div>

          <div className="form-group">
            <label htmlFor="svc">Service</label>
            <select id="svc" value={form.service_id} onChange={handleServiceChange} required>
              <option value="">Select a service…</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.duration_minutes} min)
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="appt-date">Date</label>
              <input id="appt-date" type="date" value={form.date} onChange={handleChange('date')} required />
            </div>
            <div className="form-group">
              <label htmlFor="appt-start">Start Time</label>
              <input id="appt-start" type="time" value={form.start_time} onChange={handleStartTimeChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="appt-end">End Time</label>
              <input id="appt-end" type="time" value={form.end_time} onChange={handleChange('end_time')} required />
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : mode === 'create' ? 'Create' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Cancel Confirmation Dialog ────────────────────────────────────

function CancelDialog({ onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
        <h2>Cancel Appointment</h2>
        <p>Are you sure you want to cancel this appointment? This cannot be undone.</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Keep It
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            Yes, Cancel Appointment
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────

export default function Dashboard() {
  // Data state
  const [appointments, setAppointments] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  // Filter state
  const [filterDate, setFilterDate] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Modal state
  const [modalMode, setModalMode] = useState(null)   // null | 'create' | 'edit'
  const [editTarget, setEditTarget] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)

  // Toast state
  const [toast, setToast] = useState(null)  // { message, type }

  // ── Fetch appointments ──────────────────────────────────────────

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

  // ── Fetch services ─────────────────────────────────────────────

  useEffect(() => {
    listServices()
      .then(setServices)
      .catch(() => showToast('Failed to load services', 'error'))
  }, [])

  // ── Re-fetch when filters change ───────────────────────────────

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  // ── Toast helper ───────────────────────────────────────────────

  const showToast = (message, type = 'success') =>
    setToast({ message, type, key: Date.now() })

  // ── CRUD handlers ──────────────────────────────────────────────

  const handleCreate = async (payload) => {
    try {
      await createAppointment(payload)
      setModalMode(null)
      fetchAppointments()
      showToast('Appointment created!')
    } catch (err) {
      throw err // let modal show it
    }
  }

  const handleUpdate = async (payload) => {
    try {
      await updateAppointment(editTarget.id, payload)
      setModalMode(null)
      setEditTarget(null)
      fetchAppointments()
      showToast('Appointment updated!')
    } catch (err) {
      throw err
    }
  }

  const handleCancel = async () => {
    try {
      await cancelAppointment(cancelTarget.id)
      setCancelTarget(null)
      fetchAppointments()
      showToast('Appointment cancelled.')
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

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="page">
      {/* Header row */}
      <div className="dashboard-header">
        <h1>Appointments</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          + New Appointment
        </button>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="form-group filter-field">
          <label htmlFor="filter-date">Date</label>
          <input
            id="filter-date"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
        <div className="form-group filter-field">
          <label htmlFor="filter-status">Status</label>
          <select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}

      {/* Table */}
      <div className="table-wrapper">
        {loading ? (
          <div className="table-loading">
            <span className="spinner" /> Loading appointments…
          </div>
        ) : appointments.length === 0 ? (
          <div className="table-empty">No appointments found</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Contact</th>
                <th>Service</th>
                <th>Date &amp; Time</th>
                <th>Status</th>
                <th>Source</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt) => (
                <tr key={apt.id}>
                  <td>{apt.id}</td>
                  <td>{apt.customer_name}</td>
                  <td>{apt.customer_contact}</td>
                  <td>{apt.service_name}</td>
                  <td>{formatDateTime(apt.start_time)}</td>
                  <td>
                    <span className={`badge badge-${apt.status}`}>{apt.status}</span>
                  </td>
                  <td>
                    <span className={`source-badge source-${apt.created_via}`}>{apt.created_via}</span>
                  </td>
                  <td className="table-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => openEdit(apt)}
                    >
                      Edit
                    </button>
                    {apt.status === 'confirmed' && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setCancelTarget(apt)}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalMode && (
        <AppointmentModal
          mode={modalMode}
          initial={editTarget}
          services={services}
          onSave={modalMode === 'create' ? handleCreate : handleUpdate}
          onClose={() => { setModalMode(null); setEditTarget(null) }}
        />
      )}

      {/* Cancel Confirmation Dialog */}
      {cancelTarget && (
        <CancelDialog
          onConfirm={handleCancel}
          onCancel={() => setCancelTarget(null)}
        />
      )}
    </div>
  )
}