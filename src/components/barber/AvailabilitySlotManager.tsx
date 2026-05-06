'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { formatDate, formatTimeRange } from '@/lib/date-time'
import { BarberDashboardModal } from './BarberDashboardModal'
import styles from '@/app/barber/dashboard/dashboard.module.css'

type AvailabilitySlot = {
  id: string
  availableDate: string
  startTime: string
  endTime: string
}

const HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'))
const MINUTES = ['00', '15', '30', '45']

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function addDays(base: Date, amount: number) {
  const next = new Date(base)
  next.setDate(next.getDate() + amount)
  return next
}

function toTimeValue(hour: string, minute: string) {
  return `${hour}:${minute}`
}

function toTimeMinutes(value: string) {
  const [hour, minute] = value.split(':').map((item) => Number.parseInt(item, 10))
  return hour * 60 + minute
}

function groupSlotsByDate(slots: AvailabilitySlot[]) {
  const grouped = new Map<string, AvailabilitySlot[]>()

  for (const slot of slots) {
    const items = grouped.get(slot.availableDate) ?? []
    items.push(slot)
    grouped.set(slot.availableDate, items.sort((left, right) => left.startTime.localeCompare(right.startTime)))
  }

  return grouped
}

function RollingValue({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string
  onChange: (value: string) => void
}) {
  const currentIndex = Math.max(0, options.indexOf(value))

  return (
    <div className={styles.rollerColumn}>
      <span className={styles.metaLabel}>{label}</span>
      <button
        type="button"
        className={styles.rollerButton}
        onClick={() => onChange(options[(currentIndex - 1 + options.length) % options.length])}
      >
        ↑
      </button>
      <div className={styles.rollerValue}>{value}</div>
      <button
        type="button"
        className={styles.rollerButton}
        onClick={() => onChange(options[(currentIndex + 1) % options.length])}
      >
        ↓
      </button>
    </div>
  )
}

export function AvailabilitySlotManager() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [startHour, setStartHour] = useState('08')
  const [startMinute, setStartMinute] = useState('00')
  const [endHour, setEndHour] = useState('10')
  const [endMinute, setEndMinute] = useState('30')
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const groupedSlots = useMemo(() => groupSlotsByDate(slots), [slots])
  const selectedStartTime = toTimeValue(startHour, startMinute)
  const selectedEndTime = toTimeValue(endHour, endMinute)

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
    void loadSlots()
  }, [])

  function closeModal() {
    setIsOpen(false)
    setEditingSlotId(null)
  }

  function toggleDate(date: string) {
    setSelectedDates((current) =>
      current.includes(date) ? current.filter((item) => item !== date) : [...current, date].sort()
    )
  }

  function replaceSelectedDates(dates: string[]) {
    setSelectedDates(Array.from(new Set(dates)).sort())
  }

  function selectNextDays(totalDays: number) {
    const today = new Date()
    replaceSelectedDates(Array.from({ length: totalDays }, (_, index) => toDateKey(addDays(today, index))))
  }

  function selectWeekdays() {
    const today = new Date()
    const nextDates: string[] = []

    for (let index = 0; index < 21; index += 1) {
      const date = addDays(today, index)
      const day = date.getDay()

      if (day !== 0 && day !== 6) {
        nextDates.push(toDateKey(date))
      }
    }

    replaceSelectedDates(nextDates)
  }

  function startEditing(slot: AvailabilitySlot) {
    const [slotStartHour, slotStartMinute] = slot.startTime.split(':')
    const [slotEndHour, slotEndMinute] = slot.endTime.split(':')
    setSelectedDates([slot.availableDate])
    setStartHour(slotStartHour)
    setStartMinute(slotStartMinute)
    setEndHour(slotEndHour)
    setEndMinute(slotEndMinute)
    setEditingSlotId(slot.id)
    setMessage('')
    setError('')
    setIsOpen(true)
  }

  async function applySelection() {
    const startTime = selectedStartTime
    const endTime = selectedEndTime

    if (selectedDates.length === 0) {
      setError('Select at least one date before applying availability.')
      return
    }

    if (toTimeMinutes(startTime) >= toTimeMinutes(endTime)) {
      setError('End time must be after start time.')
      return
    }

    setSaving(true)
    setMessage('')
    setError('')

    const endpoint = editingSlotId ? `/api/barber/availability/${editingSlotId}` : '/api/barber/availability/bulk'
    const response = await fetch(endpoint, {
      method: editingSlotId ? 'PATCH' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        editingSlotId
          ? {
              available_date: selectedDates[0],
              start_time: startTime,
              end_time: endTime,
            }
          : {
              dates: selectedDates,
              start_time: startTime,
              end_time: endTime,
            }
      ),
    })
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      const details = Array.isArray(payload?.error?.details) ? payload.error.details.join(' ') : ''
      setError(
        payload?.error?.message
          ? `${payload.error.message}${details ? ` ${details}` : ''}`
          : 'Could not save availability.'
      )
      setSaving(false)
      return
    }

    setMessage(
      editingSlotId
        ? 'Availability slot updated.'
        : `Availability applied to ${selectedDates.length} date${selectedDates.length === 1 ? '' : 's'}.`
    )
    setSaving(false)
    setEditingSlotId(null)
    setIsOpen(false)
    await loadSlots()
  }

  async function removeSlot(slotId: string) {
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

  function renderCalendarMonth(mode: 'display' | 'select') {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstWeekday = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const todayKey = toDateKey(new Date())
    const cells: ReactNode[] = []

    for (let index = 0; index < firstWeekday; index += 1) {
      cells.push(<div key={`empty-${index}`} className={styles.calendarSpacer} />)
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dateSlots = groupedSlots.get(date) ?? []
      const isDisabled = date < todayKey
      const isSelected = selectedDates.includes(date)

      cells.push(
        <article
          key={date}
          className={styles.availabilityDayCard}
          data-selected={isSelected}
          data-empty={dateSlots.length === 0}
        >
          {mode === 'select' ? (
            <button
              type="button"
              className={styles.calendarDayButton}
              data-selected={isSelected}
              data-has-slots={dateSlots.length > 0}
              disabled={isDisabled}
              onClick={() => {
                if (!isDisabled) {
                  toggleDate(date)
                }
              }}
            >
              <span className={styles.calendarDayNumber}>{day}</span>
              <span className={styles.calendarDayMeta}>
                {isSelected ? 'Selected' : dateSlots.length > 0 ? 'Set' : ''}
              </span>
            </button>
          ) : (
            <div className={styles.availabilityDayHeader}>
              <span className={styles.calendarDayNumber}>{day}</span>
              <span className={styles.calendarDayMeta}>
                {dateSlots.length > 0 ? `${dateSlots.length} slot${dateSlots.length === 1 ? '' : 's'}` : ''}
              </span>
            </div>
          )}

          <div className={styles.availabilitySlotList}>
            {dateSlots.length > 0
              ? dateSlots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    className={styles.availabilitySlotPill}
                    onClick={mode === 'display' ? () => startEditing(slot) : undefined}
                  >
                    {formatTimeRange(slot.startTime, slot.endTime)}
                  </button>
                ))
              : null}
          </div>
        </article>
      )
    }

    return cells
  }

  return (
    <div className={styles.formStack}>
      <div className={styles.inlineActions}>
        <button type="button" className={styles.primaryButton} onClick={() => setIsOpen(true)}>
          Edit Availability
        </button>
      </div>

      {message ? <p className={styles.successText}>{message}</p> : null}
      {error ? <p className={styles.errorText}>{error}</p> : null}

      {loading ? (
        <p className={styles.cardSubmeta}>Loading availability...</p>
      ) : slots.length === 0 ? (
        <article className={styles.compactEmptyCard}>
          <p className={styles.cardSubmeta}>No availability set yet.</p>
          <button type="button" className={styles.primaryButton} onClick={() => setIsOpen(true)}>
            Edit Availability
          </button>
        </article>
      ) : (
        <div className={styles.calendarShell}>
          <div className={styles.calendarNav}>
            <button
              type="button"
              className={styles.calendarNavButton}
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            >
              ← Previous
            </button>
            <strong className={styles.calendarNavTitle}>
              {new Intl.DateTimeFormat('en-ZA', { month: 'long', year: 'numeric' }).format(currentMonth)}
            </strong>
            <button
              type="button"
              className={styles.calendarNavButton}
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
            >
              Next →
            </button>
          </div>

          <div className={styles.availabilityCalendarGrid}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
              <div key={label} className={styles.calendarHeaderCell}>
                {label}
              </div>
            ))}
            {renderCalendarMonth('display')}
          </div>
        </div>
      )}

      <BarberDashboardModal
        open={isOpen}
        onClose={closeModal}
        eyebrow="Availability"
        title="Edit Availability"
        subtitle="Select multiple dates, choose a time range, and apply that slot across your schedule."
        size="wide"
        footer={
          <div className={styles.modalFooterActions}>
            <button type="button" className={styles.secondaryButton} onClick={closeModal}>
              Close
            </button>
            {editingSlotId ? (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => {
                  setEditingSlotId(null)
                  replaceSelectedDates([])
                }}
              >
                Cancel Edit
              </button>
            ) : null}
            <button type="button" className={styles.primaryButton} disabled={saving} onClick={applySelection}>
              {saving ? 'Saving...' : editingSlotId ? 'Save Slot' : 'Apply to selected dates'}
            </button>
          </div>
        }
      >
        <div className={styles.inlineActions}>
          <button type="button" className={styles.secondaryButton} onClick={() => selectNextDays(7)}>
            Select next 7 days
          </button>
          <button type="button" className={styles.secondaryButton} onClick={() => selectNextDays(14)}>
            Select next 14 days
          </button>
          <button type="button" className={styles.secondaryButton} onClick={selectWeekdays}>
            Select weekdays
          </button>
          <button type="button" className={styles.secondaryButton} onClick={() => replaceSelectedDates([])}>
            Clear selected
          </button>
        </div>

        <div className={styles.calendarShell}>
          <div className={styles.calendarNav}>
            <button
              type="button"
              className={styles.calendarNavButton}
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            >
              ← Previous
            </button>
            <strong className={styles.calendarNavTitle}>
              {new Intl.DateTimeFormat('en-ZA', { month: 'long', year: 'numeric' }).format(currentMonth)}
            </strong>
            <button
              type="button"
              className={styles.calendarNavButton}
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
            >
              Next →
            </button>
          </div>

          <div className={styles.availabilityCalendarGrid}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
              <div key={label} className={styles.calendarHeaderCell}>
                {label}
              </div>
            ))}
            {renderCalendarMonth('select')}
          </div>
        </div>

        <div className={styles.summaryCard}>
          <p className={styles.eyebrow}>Selected Dates</p>
          <h3 className={styles.cardTitle}>
            {selectedDates.length > 0
              ? `${selectedDates.length} date${selectedDates.length === 1 ? '' : 's'} selected`
              : 'Choose one or more dates'}
          </h3>
          <p className={styles.cardText}>
            {selectedDates.length > 0
              ? selectedDates.slice(0, 6).map((date) => formatDate(date)).join(' · ')
              : 'Pick dates from the calendar before applying a time range.'}
          </p>
        </div>

        <div className={styles.timePickerPanel}>
          <div className={styles.timePickerGroup}>
            <p className={styles.metaLabel}>Start Time</p>
            <div className={styles.rollerRow}>
              <RollingValue label="Hour" options={HOURS} value={startHour} onChange={setStartHour} />
              <RollingValue label="Minute" options={MINUTES} value={startMinute} onChange={setStartMinute} />
            </div>
          </div>

          <div className={styles.timePickerGroup}>
            <p className={styles.metaLabel}>End Time</p>
            <div className={styles.rollerRow}>
              <RollingValue label="Hour" options={HOURS} value={endHour} onChange={setEndHour} />
              <RollingValue label="Minute" options={MINUTES} value={endMinute} onChange={setEndMinute} />
            </div>
          </div>
        </div>

        <div className={styles.slotEditorList}>
          {Array.from(groupedSlots.entries())
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([date, items]) => (
              <article key={date} className={styles.slotEditorCard}>
                <div className={styles.recordTop}>
                  <div>
                    <p className={styles.referenceText}>{formatDate(date)}</p>
                    <p className={styles.cardSubmeta}>
                      {items.length} slot{items.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>

                <div className={styles.slotStack}>
                  {items.map((slot) => (
                    <div key={slot.id} className={styles.slotRow}>
                      <span className={styles.metaValue}>{formatTimeRange(slot.startTime, slot.endTime)}</span>
                      <div className={styles.inlineActions}>
                        <button type="button" className={styles.secondaryButton} onClick={() => startEditing(slot)}>
                          Edit
                        </button>
                        <button type="button" className={styles.secondaryButton} onClick={() => void removeSlot(slot.id)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
        </div>
      </BarberDashboardModal>
    </div>
  )
}
