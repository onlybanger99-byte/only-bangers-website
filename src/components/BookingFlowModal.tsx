'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  clearBookingDraft,
  readBookingDraft,
  writeBookingDraft,
} from '@/lib/bookings/draft'
import { supabase } from '@/lib/supabase/client'

interface BookingFlowModalProps {
  service: {
    id: string
    name: string
    price: number
    image: string
  }
  isOpen: boolean
  onClose: () => void
}

interface BarberOption {
  id: string
  displayName: string
  specialty: string
  profileImageUrl: string
  bio?: string
  isActive?: boolean
}

type Step = 'barber' | 'date' | 'time' | 'confirm'

function isSelectableDate(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00.000Z`)
  const today = new Date()
  const todayUtc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  )

  return date >= todayUtc
}

export default function BookingFlowModal({
  service,
  isOpen,
  onClose,
}: BookingFlowModalProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('barber')
  const [selectedBarber, setSelectedBarber] = useState<BarberOption | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [barbers, setBarbers] = useState<BarberOption[]>([])
  const [loadingBarbers, setLoadingBarbers] = useState(false)
  const [loadingTimes, setLoadingTimes] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const formattedSelection = useMemo(() => {
    if (!selectedDate || !selectedTime) {
      return ''
    }

    return new Date(`${selectedDate}T${selectedTime}:00`).toLocaleString('en-ZA', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [selectedDate, selectedTime])

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

  useEffect(() => {
    if (!isOpen) {
      setStep('barber')
      setSelectedBarber(null)
      setSelectedDate('')
      setSelectedTime('')
      setCurrentMonth(new Date())
      setAvailableTimes([])
      setErrorMessage('')
      return
    }

    let isActive = true
    setLoadingBarbers(true)

    fetch('/api/barbers')
      .then((response) => response.json())
      .then((payload) => {
        if (!isActive) {
          return
        }

        const nextBarbers: BarberOption[] = Array.isArray(payload?.data)
          ? payload.data.map((barber: Record<string, unknown>) => ({
              id:
                typeof barber.id === 'string'
                  ? barber.id
                  : typeof barber.userId === 'string'
                    ? barber.userId
                    : '',
              displayName:
                typeof barber.display_name === 'string'
                  ? barber.display_name
                  : typeof barber.displayName === 'string'
                    ? barber.displayName
                    : 'Only Bangers Barber',
              specialty:
                typeof barber.specialty === 'string' && barber.specialty.trim().length > 0
                  ? barber.specialty
                  : 'Only Bangers Team',
              profileImageUrl:
                typeof barber.profile_image_url === 'string'
                  ? barber.profile_image_url
                  : typeof barber.profileImageUrl === 'string'
                    ? barber.profileImageUrl
                    : '/images/header-bg.png',
              bio: typeof barber.bio === 'string' ? barber.bio : '',
              isActive: typeof barber.is_active === 'boolean' ? barber.is_active : true,
            }))
          : []

        setBarbers(nextBarbers.filter((barber: BarberOption) => barber.id.length > 0))
      })
      .catch((error) => {
        console.error('[booking-flow] Failed to load barbers:', error)
        if (isActive) {
          setErrorMessage('We could not load barbers right now. Please try again.')
        }
      })
      .finally(() => {
        if (isActive) {
          setLoadingBarbers(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || barbers.length === 0) {
      return
    }

    const draft = readBookingDraft()

    if (!draft || draft.serviceId !== service.id) {
      return
    }

    const draftBarber = barbers.find((barber) => barber.id === draft.barberId)

    if (!draftBarber) {
      return
    }

    setSelectedBarber(draftBarber)
    setSelectedDate(draft.date)
    setSelectedTime(draft.time)
    setStep('confirm')
  }, [barbers, isOpen, service.id])

  useEffect(() => {
    if (!selectedBarber || !selectedDate) {
      setAvailableTimes([])
      return
    }

    let isActive = true
    setLoadingTimes(true)
    setErrorMessage('')

    const params = new URLSearchParams({
      availability: 'true',
      barberId: selectedBarber.id,
      date: selectedDate,
    })

    fetch(`/api/bookings?${params.toString()}`)
      .then(async (response) => {
        const payload = await response.json()

        if (!response.ok || !payload.ok) {
          throw new Error(payload?.error?.message ?? 'Failed to load availability.')
        }

        return payload.data.availableSlots as string[]
      })
      .then((slots) => {
        if (!isActive) {
          return
        }

        setAvailableTimes(slots)

        if (selectedTime && !slots.includes(selectedTime)) {
          setSelectedTime('')
        }
      })
      .catch((error) => {
        console.error('[booking-flow] Failed to load availability:', error)

        if (isActive) {
          setAvailableTimes([])
          setErrorMessage(
            error instanceof Error ? error.message : 'Failed to load availability.'
          )
        }
      })
      .finally(() => {
        if (isActive) {
          setLoadingTimes(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [selectedBarber, selectedDate, selectedTime])

  const persistDraft = () => {
    if (!selectedBarber || !selectedDate || !selectedTime) {
      return
    }

    writeBookingDraft({
      serviceId: service.id,
      serviceName: service.name,
      servicePrice: service.price,
      serviceImage: service.image,
      barberId: selectedBarber.id,
      barberName: selectedBarber.displayName,
      date: selectedDate,
      time: selectedTime,
    })
  }

  const routeToAuth = () => {
    persistDraft()
    router.push(`/login?next=${encodeURIComponent('/services?resumeBooking=1')}`)
  }

  const routeToProfile = () => {
    persistDraft()
    router.push(`/portal/profile/complete?next=${encodeURIComponent('/services?resumeBooking=1')}`)
  }

  const handleContinueToConfirm = async () => {
    if (!selectedBarber || !selectedDate || !selectedTime) {
      return
    }

    persistDraft()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      routeToAuth()
      return
    }

    const profileResponse = await fetch('/api/profile')
    const profilePayload = await profileResponse.json()

    if (profileResponse.status === 401) {
      routeToAuth()
      return
    }

    if (!profileResponse.ok || !profilePayload?.data?.requiredFieldsComplete) {
      routeToProfile()
      return
    }

    setErrorMessage('')
    setStep('confirm')
  }

  const handleConfirmBooking = async () => {
    if (!selectedBarber || !selectedDate || !selectedTime) {
      return
    }

    persistDraft()
    setSubmitting(true)
    setErrorMessage('')

    const startsAt = new Date(`${selectedDate}T${selectedTime}:00.000Z`).toISOString()
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        barberId: selectedBarber.id,
        serviceId: service.id,
        startsAt,
      }),
    })
    const payload = await response.json()

    if (!response.ok || !payload.ok) {
      const code = payload?.error?.code
      const message =
        payload?.error?.message ?? 'We could not create the WhatsApp checkout. Please try again.'

      if (code === 'UNAUTHORIZED') {
        setSubmitting(false)
        routeToAuth()
        return
      }

      if (code === 'INCOMPLETE_PROFILE') {
        setSubmitting(false)
        routeToProfile()
        return
      }

      if (code === 'SLOT_UNAVAILABLE') {
        setStep('time')
        setSelectedTime('')
      }

      setErrorMessage(message)
      setSubmitting(false)
      return
    }

    const whatsappUrl = payload?.data?.whatsapp_redirect_url

    if (!whatsappUrl) {
      setErrorMessage(
        'Your booking was created, but WhatsApp checkout is not configured yet. Please contact support.'
      )
      setSubmitting(false)
      router.refresh()
      return
    }

    setSubmitting(false)
    router.refresh()
    clearBookingDraft()
    window.location.href = whatsappUrl
  }

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr)
    setSelectedTime('')
    setStep('time')
    setErrorMessage('')
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
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const isDisabled = !isSelectableDate(dateStr)
      const isSelected = dateStr === selectedDate

      days.push(
        <div
          key={dateStr}
          className={`calendar-day ${isDisabled ? 'unavailable' : ''} ${isSelected ? 'selected' : ''}`}
          onClick={() => !isDisabled && handleDateSelect(dateStr)}
        >
          <span className="day-number">{day}</span>
          {isDisabled ? <span className="day-status">Full</span> : null}
        </div>
      )
    }

    return days
  }

  const changeMonth = (delta: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1))
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Book {service.name}</h3>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close">
            <svg className="modal-close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {errorMessage ? (
            <div className="no-times-message">
              <p>{errorMessage}</p>
            </div>
          ) : null}

          {step === 'barber' ? (
            <>
              <h2>Choose Your Barber</h2>
              <p className="modal-subtitle">Choose an available barber and time</p>
              {loadingBarbers ? (
                <div className="loading-times">Loading barbers...</div>
              ) : barbers.length === 0 ? (
                <div className="no-times-message">
                  <p>No barbers are available yet. Please contact Only Bangers.</p>
                </div>
              ) : (
                <div className="barber-list">
                  {barbers.map((barber) => (
                    <div
                      key={barber.id}
                      className="barber-card"
                      onClick={() => {
                        setSelectedBarber(barber)
                        setSelectedDate('')
                        setSelectedTime('')
                        setStep('date')
                      }}
                    >
                      <img
                        src={barber.profileImageUrl}
                        alt={barber.displayName}
                        onError={(event) => {
                          event.currentTarget.src = '/images/header-bg.png'
                        }}
                      />
                      <div className="barber-info">
                        <h4>{barber.displayName}</h4>
                        <p>{barber.specialty}</p>
                        {barber.bio ? <p>{barber.bio}</p> : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="modal-actions">
                <button className="modal-btn secondary" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </>
          ) : null}

          {step === 'date' ? (
            <>
              <h2>Select Date</h2>
              <p className="modal-subtitle">Booking with {selectedBarber?.displayName}</p>
              <div className="calendar-nav">
                <button className="calendar-nav-btn" onClick={() => changeMonth(-1)}>
                  Previous
                </button>
                <span className="calendar-month">
                  {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <button className="calendar-nav-btn" onClick={() => changeMonth(1)}>
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
              <div className="modal-actions">
                <button className="modal-btn secondary" onClick={() => setStep('barber')}>
                  Back
                </button>
              </div>
            </>
          ) : null}

          {step === 'time' ? (
            <>
              <h2>Choose Time</h2>
              <p className="modal-subtitle">
                {selectedDate
                  ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-ZA', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })
                  : ''}
                {' '}with {selectedBarber?.displayName}
              </p>
              {loadingTimes ? (
                <div className="loading-times">Loading available times...</div>
              ) : availableTimes.length === 0 ? (
                <div className="no-times-message">
                  <p>No availability set for this date.</p>
                  <button className="modal-btn primary" onClick={() => setStep('date')}>
                    Back to Calendar
                  </button>
                </div>
              ) : (
                <div className="time-slots">
                  {availableTimes.map((time) => (
                    <button
                      key={time}
                      className={`time-slot ${selectedTime === time ? 'selected' : ''}`}
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
              <div className="modal-actions">
                <button className="modal-btn secondary" onClick={() => setStep('date')}>
                  Back
                </button>
                <button
                  className="modal-btn primary"
                  onClick={handleContinueToConfirm}
                  disabled={!selectedTime || loadingTimes}
                >
                  Continue
                </button>
              </div>
            </>
          ) : null}

          {step === 'confirm' ? (
            <>
              <h2>Confirm Booking</h2>
              <p className="modal-subtitle">
                Review your appointment before we reserve the slot and continue to WhatsApp checkout.
              </p>
              <div className="barber-card">
                <img
                  src={selectedBarber?.profileImageUrl || '/images/header-bg.png'}
                  alt={selectedBarber?.displayName || 'Selected barber'}
                />
                <div className="barber-info">
                  <h4>{service.name}</h4>
                  <p>{selectedBarber?.displayName}</p>
                  <p>{formattedSelection}</p>
                </div>
              </div>
              <div className="modal-actions">
                <button className="modal-btn secondary" onClick={() => setStep('time')}>
                  Back
                </button>
                <button
                  className="modal-btn primary"
                  onClick={handleConfirmBooking}
                  disabled={submitting}
                >
                  {submitting ? 'Creating Checkout...' : 'Checkout on WhatsApp'}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
