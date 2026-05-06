'use client'

import { useEffect, useMemo, useState } from 'react'
import { formatDate, formatTime } from '@/lib/date-time'

type ServiceOption = {
  id: string
  label: string
}

type AvailableTimeOption = {
  startTime: string
  endTime: string
  startsAt: string
  endsAt: string
}

function isSelectableDate(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00.000Z`)
  const today = new Date()
  const todayUtc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  )

  return date >= todayUtc
}

function getMonthDays(currentMonth: Date) {
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  })
}

export function PublicBarberAvailabilityCalendar({
  barberUserId,
  services,
}: {
  barberUserId: string
  services: ServiceOption[]
}) {
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id ?? '')
  const [selectedDate, setSelectedDate] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [calendarSlots, setCalendarSlots] = useState<Record<string, number>>({})
  const [availableTimes, setAvailableTimes] = useState<AvailableTimeOption[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) ?? services[0] ?? null,
    [selectedServiceId, services]
  )

  useEffect(() => {
    if (!selectedService) {
      return
    }

    let active = true
    setLoading(true)

    Promise.all(
      getMonthDays(currentMonth)
        .filter(isSelectableDate)
        .map(async (date) => {
          const params = new URLSearchParams({
            barberId: barberUserId,
            servicePriceId: selectedService.id,
            date,
          })
          const response = await fetch(`/api/bookings/availability?${params.toString()}`)
          const payload = await response.json().catch(() => null)
          const count = Array.isArray(payload?.data?.availableTimes) ? payload.data.availableTimes.length : 0
          return [date, count] as const
        })
    )
      .then((entries) => {
        if (!active) {
          return
        }

        setCalendarSlots(Object.fromEntries(entries))
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [barberUserId, currentMonth, selectedService])

  useEffect(() => {
    if (!selectedService || !selectedDate) {
      setAvailableTimes([])
      setMessage('')
      return
    }

    let active = true
    const params = new URLSearchParams({
      barberId: barberUserId,
      servicePriceId: selectedService.id,
      date: selectedDate,
    })

    fetch(`/api/bookings/availability?${params.toString()}`)
      .then((response) => response.json())
      .then((payload) => {
        if (!active) {
          return
        }

        setAvailableTimes(Array.isArray(payload?.data?.availableTimes) ? payload.data.availableTimes : [])
        setMessage(typeof payload?.data?.message === 'string' ? payload.data.message : '')
      })

    return () => {
      active = false
    }
  }, [barberUserId, selectedDate, selectedService])

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const calendarDays = []

  for (let index = 0; index < firstDay; index += 1) {
    calendarDays.push(<div key={`empty-${index}`} className="calendar-day empty"></div>)
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const availableCount = calendarSlots[dateStr] ?? 0
    const disabled = !isSelectableDate(dateStr)

    calendarDays.push(
      <button
        key={dateStr}
        type="button"
        className={`calendar-day ${selectedDate === dateStr ? 'selected' : ''} ${availableCount > 0 ? 'available' : ''} ${disabled ? 'unavailable' : ''}`}
        disabled={disabled}
        onClick={() => setSelectedDate(dateStr)}
      >
        <span className="day-number">{day}</span>
        {!disabled && availableCount > 0 ? <span className="day-status">{availableCount}</span> : null}
      </button>
    )
  }

  if (!selectedService) {
    return null
  }

  return (
    <div className="service-card">
      <div className="card-content">
        <div className="card-actions">
          {services.map((service) => (
            <button
              key={service.id}
              type="button"
              className={`card-button ${service.id === selectedService.id ? '' : 'secondary'}`}
              onClick={() => {
                setSelectedServiceId(service.id)
                setSelectedDate('')
                setAvailableTimes([])
              }}
            >
              {service.label}
            </button>
          ))}
        </div>

        <div className="calendar-nav">
          <button type="button" className="calendar-nav-btn" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}>
            Previous
          </button>
          <span className="calendar-month">
            {new Intl.DateTimeFormat('en-ZA', { month: 'long', year: 'numeric' }).format(currentMonth)}
          </span>
          <button type="button" className="calendar-nav-btn" onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}>
            Next
          </button>
        </div>

        {loading ? <p className="card-description">Loading calendar...</p> : null}

        <div className="calendar-grid">
          <div className="calendar-header">Sun</div>
          <div className="calendar-header">Mon</div>
          <div className="calendar-header">Tue</div>
          <div className="calendar-header">Wed</div>
          <div className="calendar-header">Thu</div>
          <div className="calendar-header">Fri</div>
          <div className="calendar-header">Sat</div>
          {calendarDays}
        </div>

        {selectedDate ? (
          <>
            <h3 className="card-title">{formatDate(selectedDate)}</h3>
            {availableTimes.length > 0 ? (
              <div className="time-slots">
                {availableTimes.map((slot) => (
                  <span key={slot.startsAt} className="time-slot selected">
                    {formatTime(slot.startTime)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="card-description">{message || 'No availability set for this date.'}</p>
            )}
          </>
        ) : (
          <p className="card-description">Choose a highlighted date to see live available time slots.</p>
        )}
      </div>
    </div>
  )
}
