'use client'

import { useEffect, useMemo, useState } from 'react'
import { formatDate, formatTimeRange } from '@/lib/date-time'
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

export function AvailabilitySlotManager() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [availableDate, setAvailableDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const groupedSlots = useMemo(() => groupSlotsByDate(slots), [slots])

  async function loadSlots() {
    setLoading(true)
    const response = await fetch('/api/barber/availability')
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      setError(payload?.error?.message ?? 'Could not load availability.')
      setLoading(false)
      return
    }

    setSlots(Array.isArray(payload.data) ? payload.data : [])
    setLoading(false)
  }

  useEffect(() => {
    loadSlots()
  }, [])

  const addSlot = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    const response = await fetch('/api/barber/availability', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        available_date: availableDate,
        start_time: startTime,
        end_time: endTime,
      }),
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      const details = Array.isArray(payload?.error?.details) ? payload.error.details.join(' ') : ''
      setError(payload?.error?.message ? `${payload.error.message} ${details}`.trim() : 'Could not add availability slot.')
      setSaving(false)
      return
    }

    setAvailableDate('')
    setStartTime('')
    setEndTime('')
    setSaving(false)
    setMessage('Availability slot added.')
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
    await loadSlots()
  }

  return (
    <div className={styles.formStack}>
      <form className={styles.formGrid} onSubmit={addSlot}>
        <label className={styles.field}>
          <span className={styles.metaLabel}>Available Date</span>
          <input
            type="date"
            className={styles.input}
            value={availableDate}
            onChange={(event) => setAvailableDate(event.target.value)}
            required
          />
        </label>
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
          <button type="submit" className={styles.primaryButton} disabled={saving}>
            {saving ? 'Adding...' : 'Add Slot'}
          </button>
        </div>
      </form>

      {message ? <p className={styles.successText}>{message}</p> : null}
      {error ? <p className={styles.errorText}>{error}</p> : null}

      {loading ? (
        <p className={styles.cardSubmeta}>Loading availability...</p>
      ) : groupedSlots.length > 0 ? (
        groupedSlots.map(([date, items]) => (
          <article key={date} className={styles.recordCard}>
            <p className={styles.referenceText}>{formatDate(date)}</p>
            <div className={styles.inlineActions}>
              {items.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => removeSlot(slot.id)}
                >
                  {formatTimeRange(slot.startTime, slot.endTime)} Remove
                </button>
              ))}
            </div>
          </article>
        ))
      ) : (
        <p className={styles.cardSubmeta}>No availability slots set.</p>
      )}
    </div>
  )
}
