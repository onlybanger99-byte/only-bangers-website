'use client'

import { useEffect, useMemo, useState } from 'react'
import { formatDate, formatTime, formatTimeRange } from '@/lib/date-time'
import styles from '@/app/barber/dashboard/dashboard.module.css'

type AvailabilitySlot = {
  id: string
  availableDate: string
  startTime: string
  endTime: string
}

function groupSlotsByDate(slots: AvailabilitySlot[]) {
  const byDate = new Map<string, AvailabilitySlot[]>()

  for (const slot of slots) {
    const items = byDate.get(slot.availableDate) ?? []
    items.push(slot)
    byDate.set(slot.availableDate, items)
  }

  return Array.from(byDate.entries()).sort(([left], [right]) => left.localeCompare(right))
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function isSelectableDate(date: string) {
  const today = new Date()
  const todayKey = toDateKey(today)
  return date >= todayKey
}

export function AvailabilitySlotManager() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const groupedSlots = useMemo(() => groupSlotsByDate(slots), [slots])
  const selectedDateSlots = useMemo(
    () => slots.filter((slot) => slot.availableDate === selectedDate),
    [selectedDate, slots]
  )

  async function loadSlots() {
    setLoading(true)
    const response = await fetch('/api/barber/availability')
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      setError(payload?.error?.message ?? 'Could not load availability.')
      setLoading(false)
      return
    }

    const nextSlots = Array.isArray(payload.data) ? payload.data : []
    setSlots(nextSlots)

    if (!selectedDate && nextSlots[0]?.availableDate) {
      setSelectedDate(nextSlots[0].availableDate)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadSlots()
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const resetForm = () => {
    setEditingSlotId(null)
    setStartTime('')
    setEndTime('')
  }

  const openModal = () => {
    if (!selectedDate) {
      setSelectedDate(toDateKey(new Date()))
    }

    setIsOpen(true)
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setError('')
    setMessage('')
    resetForm()
  }

  const addOrUpdateSlot = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    const endpoint = editingSlotId
      ? `/api/barber/availability/${editingSlotId}`
      : '/api/barber/availability'
    const method = editingSlotId ? 'PATCH' : 'POST'

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        available_date: selectedDate,
        start_time: startTime,
        end_time: endTime,
      }),
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      const details = Array.isArray(payload?.error?.details) ? payload.error.details.join(' ') : ''
      setError(payload?.error?.message ? `${payload.error.message} ${details}`.trim() : 'Could not save availability slot.')
      setSaving(false)
      return
    }

    setMessage(editingSlotId ? 'Availability slot updated.' : 'Availability slot added.')
    resetForm()
    setSaving(false)
    await loadSlots()
  }

  const removeSlot = async (slotId: string) => {
    setMessage('')
    setError('')

    const response = await fetch(`/api/barber/availability/${slotId}`, {
      method: 'DELETE',
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      setError(payload?.error?.message ?? 'Could not remove this availability slot.')
      return
    }

    setMessage('Availability slot removed.')

    if (editingSlotId === slotId) {
      resetForm()
    }

    await loadSlots()
  }

  const startEditing = (slot: AvailabilitySlot) => {
    setSelectedDate(slot.availableDate)
    setStartTime(slot.startTime)
    setEndTime(slot.endTime)
    setEditingSlotId(slot.id)
    setMessage('')
    setError('')
  }

  const generateCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []

    for (let index = 0; index < firstDay; index += 1) {
      days.push(<div key={`empty-${index}`} className="calendar-day empty"></div>)
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const disabled = !isSelectableDate(date)
      const selected = selectedDate === date
      const hasSlots = slots.some((slot) => slot.availableDate === date)

      days.push(
        <button
          key={date}
          type="button"
          className={`calendar-day ${disabled ? 'unavailable' : ''} ${selected ? 'selected' : ''}`}
          onClick={() => {
            if (!disabled) {
              handleDateSelect(date)
            }
          }}
          disabled={disabled}
        >
          <span className="day-number">{day}</span>
          {hasSlots ? <span className="day-status">Set</span> : null}
        </button>
      )
    }

    return days
  }

  return (
    <div className={styles.formStack}>
      <div className={styles.inlineActions}>
        <button type="button" className={styles.primaryButton} onClick={openModal}>
          Edit Availability
        </button>
      </div>

      {message ? <p className={styles.successText}>{message}</p> : null}
      {error ? <p className={styles.errorText}>{error}</p> : null}

      {loading ? (
        <p className={styles.cardSubmeta}>Loading availability...</p>
      ) : groupedSlots.length > 0 ? (
        <div className={styles.cardGrid}>
          {groupedSlots.map(([date, items]) => (
            <article key={date} className={styles.recordCard}>
              <p className={styles.referenceText}>{formatDate(date)}</p>
              <div className={styles.slotStack}>
                {items.map((slot) => (
                  <div key={slot.id} className={styles.slotRow}>
                    <span className={styles.metaValue}>{formatTimeRange(slot.startTime, slot.endTime)}</span>
                    <div className={styles.inlineActions}>
                      <button type="button" className={styles.secondaryButton} onClick={() => {
                        openModal()
                        startEditing(slot)
                      }}>
                        Edit
                      </button>
                      <button type="button" className={styles.secondaryButton} onClick={() => removeSlot(slot.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className={styles.cardSubmeta}>No availability slots set.</p>
      )}

      {isOpen ? (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className={`${styles.availabilityModal} modal-container`} onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Edit Availability</h2>
                <p className="modal-subtitle">Choose a date, then add or adjust time slots for that day.</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="modal-close-btn" aria-label="Close">
                <svg className="modal-close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="calendar-nav">
                <button
                  type="button"
                  className="calendar-nav-btn"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                >
                  Previous
                </button>
                <span className="calendar-month">
                  {new Intl.DateTimeFormat('en-ZA', { month: 'long', year: 'numeric' }).format(currentMonth)}
                </span>
                <button
                  type="button"
                  className="calendar-nav-btn"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                >
                  Next
                </button>
              </div>

              <div className="calendar-grid">
                <div className="calendar-header">Sun</div>
                <div className="calendar-header">Mon</div>
                <div className="calendar-header">Tue</div>
                <div className="calendar-header">Wed</div>
                <div className="calendar-header">Thu</div>
                <div className="calendar-header">Fri</div>
                <div className="calendar-header">Sat</div>
                {generateCalendar()}
              </div>

              <div className={styles.availabilitySummaryCard}>
                <p className={styles.eyebrow}>Selected Day</p>
                <h3 className={styles.cardTitle}>{selectedDate ? formatDate(selectedDate) : 'Choose a date'}</h3>
                <p className={styles.cardText}>
                  {selectedDate
                    ? 'Add one or more availability windows for this day. Customers will only see the times you publish.'
                    : 'Pick a date from the calendar to begin.'}
                </p>
              </div>

              {selectedDate ? (
                <form className={styles.formGrid} onSubmit={addOrUpdateSlot}>
                  <label className={styles.field}>
                    <span className={styles.metaLabel}>Start Time</span>
                    <input
                      type="time"
                      className={styles.input}
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      required
                    />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.metaLabel}>End Time</span>
                    <input
                      type="time"
                      className={styles.input}
                      value={endTime}
                      onChange={(event) => setEndTime(event.target.value)}
                      required
                    />
                  </label>
                  <div className={styles.field}>
                    <span className={styles.metaLabel}>Action</span>
                    <button type="submit" className={styles.primaryButton} disabled={saving || !selectedDate}>
                      {saving ? 'Saving...' : editingSlotId ? 'Update Slot' : 'Add Slot'}
                    </button>
                  </div>
                  {editingSlotId ? (
                    <div className={styles.field}>
                      <span className={styles.metaLabel}>Reset</span>
                      <button type="button" className={styles.secondaryButton} onClick={resetForm}>
                        Cancel Edit
                      </button>
                    </div>
                  ) : null}
                </form>
              ) : null}

              <div className={styles.formStack}>
                <div>
                  <p className={styles.eyebrow}>Published Slots</p>
                  <h3 className={styles.cardTitle}>Slots for this day</h3>
                </div>

                {selectedDate && selectedDateSlots.length > 0 ? (
                  <div className={styles.slotStack}>
                    {selectedDateSlots.map((slot) => (
                      <div key={slot.id} className={styles.slotRow}>
                        <div>
                          <strong className={styles.metaValue}>{formatTimeRange(slot.startTime, slot.endTime)}</strong>
                          <p className={styles.cardSubmeta}>
                            Starts at {formatTime(slot.startTime)} and ends at {formatTime(slot.endTime)}
                          </p>
                        </div>
                        <div className={styles.inlineActions}>
                          <button type="button" className={styles.secondaryButton} onClick={() => startEditing(slot)}>
                            Edit
                          </button>
                          <button type="button" className={styles.secondaryButton} onClick={() => removeSlot(slot.id)}>
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.cardSubmeta}>No availability set for this date.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
