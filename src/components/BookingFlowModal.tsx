'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  clearBookingDraft,
  readBookingDraft,
  writeBookingDraft,
} from '@/lib/bookings/draft'
import {
  clearBookingSelectionCart,
  readBookingSelectionCart,
  writeBookingSelectionCart,
  type BookingSelectionCartItem,
} from '@/lib/bookings/selection-cart'
import { formatDate, formatDateTime, formatTime } from '@/lib/date-time'
import { getSafeImage } from '@/lib/safe-image'
import { supabase } from '@/lib/supabase/client'
import { buildBookingWhatsAppUrl } from '@/lib/whatsapp/booking-message'

interface BookingFlowModalProps {
  service: {
    id: string
    name: string
    price: number
    image: string
    description?: string
    duration?: string
  }
  isOpen: boolean
  onClose: () => void
  preferredBarberUserId?: string | null
}

interface BarberOffer {
  id: string
  barberProfileId: string
  barberUserId: string
  barberName: string
  location: string | null
  cuttingLocation: string | null
  bio: string
  profileImageUrl: string | null
  price: number
  durationMinutes: number | null
  serviceId: string | null
  serviceName: string
  availabilityStatus: string
  nextAvailableSlot: string | null
}

interface AvailableTimeOption {
  startTime: string
  endTime: string
  startsAt: string
  endsAt: string
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

function getCartKey(item: {
  barberServicePriceId: string
  startsAt: string
}) {
  return `${item.barberServicePriceId}:${item.startsAt}`
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

function buildCombinedWhatsAppMessage(input: {
  customerName: string
  phoneNumber: string
  items: Array<{
    barberName: string
    serviceName: string
    date: string
    time: string
    reference: string
    amount: number
  }>
}) {
  const lines = [
    'Hi Only Bangers, I would like to confirm payment for the following bookings.',
    `Customer: ${input.customerName}`,
    `Phone: ${input.phoneNumber}`,
    '',
  ]

  input.items.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.serviceName}`,
      `Barber: ${item.barberName}`,
      `Date: ${item.date}`,
      `Time: ${item.time}`,
      `Booking Reference: ${item.reference}`,
      `Amount Due: R${item.amount}`,
      ''
    )
  })

  lines.push('Please send payment proof here so the team can verify and confirm the bookings.')
  return lines.join('\n')
}

export default function BookingFlowModal({
  service,
  isOpen,
  onClose,
  preferredBarberUserId = null,
}: BookingFlowModalProps) {
  const router = useRouter()
  const [bookingCart, setBookingCart] = useState<BookingSelectionCartItem[]>([])
  const [step, setStep] = useState<Step>('barber')
  const [selectedOffer, setSelectedOffer] = useState<BarberOffer | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<AvailableTimeOption | null>(null)
  const [availableTimes, setAvailableTimes] = useState<AvailableTimeOption[]>([])
  const [monthAvailability, setMonthAvailability] = useState<Record<string, number>>({})
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [offers, setOffers] = useState<BarberOffer[]>([])
  const [loadingOffers, setLoadingOffers] = useState(false)
  const [loadingTimes, setLoadingTimes] = useState(false)
  const [loadingCalendar, setLoadingCalendar] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [availabilityMessage, setAvailabilityMessage] = useState('')

  const selectedLocation = useMemo(() => {
    return selectedOffer?.cuttingLocation || selectedOffer?.location || 'Location not set'
  }, [selectedOffer])

  const cartForCurrentOffer = useMemo(() => {
    if (!selectedOffer) {
      return bookingCart
    }

    return bookingCart.filter((item) => item.barberServicePriceId === selectedOffer.id)
  }, [bookingCart, selectedOffer])

  const syncCart = (items: BookingSelectionCartItem[]) => {
    writeBookingSelectionCart(items)
  }

  const loadAvailability = async (
    offer: BarberOffer,
    date: string,
    currentSelectedTime = selectedSlot?.startTime ?? ''
  ) => {
    setLoadingTimes(true)
    setErrorMessage('')
    setAvailabilityMessage('')

    try {
      const params = new URLSearchParams({
        barberId: offer.barberUserId,
        servicePriceId: offer.id,
        date,
      })

      const response = await fetch(`/api/bookings/availability?${params.toString()}`)
      const payload = await response.json()

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error?.message ?? 'Failed to load availability.')
      }

      const slots = Array.isArray(payload?.data?.availableTimes)
        ? (payload.data.availableTimes as AvailableTimeOption[])
        : []

      setAvailableTimes(slots)
      setAvailabilityMessage(typeof payload?.data?.message === 'string' ? payload.data.message : '')
      setMonthAvailability((current) => ({
        ...current,
        [date]: slots.length,
      }))
      setSelectedSlot(slots.find((slot) => slot.startTime === currentSelectedTime) ?? null)
    } catch (error) {
      console.error('[booking-flow] Failed to load availability:', error)
      setAvailableTimes([])
      setSelectedSlot(null)
      setAvailabilityMessage('')
      setErrorMessage(error instanceof Error ? error.message : 'Could not load availability.')
    } finally {
      setLoadingTimes(false)
    }
  }

  const loadMonthAvailability = async (offer: BarberOffer, month: Date) => {
    setLoadingCalendar(true)

    try {
      const days = getMonthDays(month).filter(isSelectableDate)
      const entries = await Promise.all(
        days.map(async (date) => {
          const params = new URLSearchParams({
            barberId: offer.barberUserId,
            servicePriceId: offer.id,
            date,
          })
          const response = await fetch(`/api/bookings/availability?${params.toString()}`)
          const payload = await response.json().catch(() => null)
          const count = Array.isArray(payload?.data?.availableTimes) ? payload.data.availableTimes.length : 0
          return [date, count] as const
        })
      )

      setMonthAvailability(Object.fromEntries(entries))
    } catch (error) {
      console.error('[booking-flow] Failed to load month availability', error)
      setMonthAvailability({})
    } finally {
      setLoadingCalendar(false)
    }
  }

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
      setSelectedOffer(null)
      setSelectedDate('')
      setSelectedSlot(null)
      setAvailableTimes([])
      setMonthAvailability({})
      setCurrentMonth(new Date())
      setErrorMessage('')
      setSuccessMessage('')
      setAvailabilityMessage('')
      return
    }

    let isActive = true
    setBookingCart(readBookingSelectionCart())
    setLoadingOffers(true)
    setErrorMessage('')
    setSuccessMessage('')
    setAvailabilityMessage('')

    const params = new URLSearchParams({
      serviceId: service.id,
    })

    fetch(`/api/barbers/service-prices?${params.toString()}`)
      .then(async (response) => {
        const payload = await response.json()

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error?.message ?? 'Could not load available barbers.')
        }

        return Array.isArray(payload.data) ? (payload.data as BarberOffer[]) : []
      })
      .then((data) => {
        if (!isActive) {
          return
        }

        setOffers(data)

        if (preferredBarberUserId) {
          const preferred = data.find((offer) => offer.barberUserId === preferredBarberUserId)

          if (preferred) {
            setSelectedOffer(preferred)
            setStep('date')
          }
        }
      })
      .catch((error) => {
        console.error('[booking-flow] Failed to load barber offers:', error)

        if (isActive) {
          setOffers([])
          setErrorMessage('We could not load barber pricing for this service right now. Please try again.')
        }
      })
      .finally(() => {
        if (isActive) {
          setLoadingOffers(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [isOpen, preferredBarberUserId, service.id])

  useEffect(() => {
    if (!isOpen || offers.length === 0) {
      return
    }

    const draft = readBookingDraft()

    if (!draft || draft.serviceId !== service.id) {
      return
    }

    const draftOffer = offers.find(
      (offer) =>
        offer.id === draft.barberServicePriceId ||
        (offer.barberUserId === draft.barberId && offer.serviceName === draft.serviceName)
    )

    if (!draftOffer) {
      return
    }

    setSelectedOffer(draftOffer)
    setSelectedDate(draft.date)
    setStep(draft.date ? 'time' : 'date')
  }, [isOpen, offers, service.id])

  useEffect(() => {
    if (!selectedOffer || !isOpen) {
      return
    }

    loadMonthAvailability(selectedOffer, currentMonth).catch(() => undefined)
  }, [currentMonth, isOpen, selectedOffer])

  useEffect(() => {
    if (!selectedOffer || !selectedDate) {
      setAvailableTimes([])
      setSelectedSlot(null)
      setAvailabilityMessage('')
      return
    }

    loadAvailability(selectedOffer, selectedDate, selectedSlot?.startTime ?? '').catch(() => undefined)
  }, [selectedDate, selectedOffer])

  const persistDraft = () => {
    if (!selectedOffer || !selectedDate || !selectedSlot) {
      return
    }

    writeBookingDraft({
      serviceId: service.id,
      serviceName: selectedOffer.serviceName,
      servicePrice: selectedOffer.price,
      barberServicePriceId: selectedOffer.id,
      serviceImage: service.image,
      barberId: selectedOffer.barberUserId,
      barberName: selectedOffer.barberName,
      date: selectedDate,
      time: selectedSlot.startTime,
    })
  }

  const routeToAuth = () => {
    persistDraft()
    router.push('/login')
  }

  const routeToProfile = () => {
    persistDraft()
    router.push(`/portal/profile/complete?next=${encodeURIComponent('/services?resumeBooking=1')}`)
  }

  const addCurrentSlotToCart = () => {
    if (!selectedOffer || !selectedDate || !selectedSlot) {
      setErrorMessage('Please select a barber, date, and time before adding to cart.')
      return
    }

    const nextItem: BookingSelectionCartItem = {
      key: getCartKey({
        barberServicePriceId: selectedOffer.id,
        startsAt: selectedSlot.startsAt,
      }),
      serviceId: selectedOffer.serviceId ?? service.id,
      serviceName: selectedOffer.serviceName,
      serviceImage: service.image,
      barberId: selectedOffer.barberUserId,
      barberName: selectedOffer.barberName,
      barberServicePriceId: selectedOffer.id,
      price: selectedOffer.price,
      date: selectedDate,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      startsAt: selectedSlot.startsAt,
      endsAt: selectedSlot.endsAt,
    }

    const existing = readBookingSelectionCart()
    const withoutDuplicate = existing.filter((item) => item.key !== nextItem.key)
    syncCart([...withoutDuplicate, nextItem])
    setErrorMessage('')
    setSuccessMessage('✓ Slot added to your booking cart.')
    setSelectedSlot(null)
    
    // Auto-clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage('')
    }, 3000)
  }

  const removeCartItem = (itemKey: string) => {
    const nextCart = readBookingSelectionCart().filter((item) => item.key !== itemKey)
    syncCart(nextCart)
    setBookingCart(nextCart)
  }

  const handleReviewCart = () => {
    if (selectedSlot) {
      addCurrentSlotToCart()
    }

    const nextCart = readBookingSelectionCart()

    if (nextCart.length > 0) {
      setBookingCart(nextCart)
      setStep('confirm')
    }
  }

  const handleCheckout = async () => {
    const items = readBookingSelectionCart()

    if (items.length === 0) {
      setErrorMessage('Add at least one slot to your booking cart before checkout.')
      return
    }

    persistDraft()
    setSubmitting(true)
    setErrorMessage('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setSubmitting(false)
      routeToAuth()
      return
    }

    const profileResponse = await fetch('/api/profile')
    const profilePayload = await profileResponse.json().catch(() => null)

    if (profileResponse.status === 401) {
      setSubmitting(false)
      routeToAuth()
      return
    }

    if (!profileResponse.ok || !profilePayload?.data?.requiredFieldsComplete) {
      setSubmitting(false)
      routeToProfile()
      return
    }

    const created: Array<{
      reference: string
      amount: number
      barberName: string
      serviceName: string
      date: string
      time: string
      whatsappUrl: string | null
      itemKey: string
    }> = []
    const failedKeys = new Set<string>()
    let lastSlotError = ''

    for (const item of items) {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          barberId: item.barberId,
          barberServicePriceId: item.barberServicePriceId,
          serviceId: item.serviceId,
          serviceName: item.serviceName,
          startsAt: item.startsAt,
          endsAt: item.endsAt,
        }),
      })
      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.ok) {
        const code = payload?.error?.code
        const message = payload?.error?.message ?? 'We could not create the WhatsApp checkout.'

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
          failedKeys.add(item.key)
          lastSlotError = message

          if (selectedOffer?.id === item.barberServicePriceId && selectedDate === item.date) {
            await loadAvailability(selectedOffer, item.date, '')
          }

          continue
        }

        setSubmitting(false)
        setErrorMessage(message)
        return
      }

      created.push({
        reference:
          payload.data?.payment_reference || `OB-${String(payload.data?.id || '').slice(0, 8).toUpperCase()}`,
        amount: typeof payload.data?.amount_due === 'number' ? payload.data.amount_due : item.price,
        barberName: item.barberName,
        serviceName: item.serviceName,
        date: formatDate(item.date),
        time: `${formatTime(item.startTime)} - ${formatTime(item.endTime)}`,
        whatsappUrl: payload.data?.whatsapp_redirect_url ?? null,
        itemKey: item.key,
      })
    }

    const remainingItems = items.filter((item) => failedKeys.has(item.key))
    syncCart(remainingItems)

    if (created.length === 0) {
      setSubmitting(false)
      setErrorMessage(lastSlotError || 'We could not create your bookings. Please try again.')
      return
    }

    const profile = profilePayload?.data?.profile
    const customerName =
      profile?.fullName ||
      [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ||
      user.email ||
      'Only Bangers Customer'
    const phoneNumber = profile?.phoneNumber || 'Not provided'
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_BOOKING_NUMBER ?? ''
    const combinedMessage = buildCombinedWhatsAppMessage({
      customerName,
      phoneNumber,
      items: created.map((item) => ({
        barberName: item.barberName,
        serviceName: item.serviceName,
        date: item.date,
        time: item.time,
        reference: item.reference,
        amount: item.amount,
      })),
    })

    let redirectUrl = created[0]?.whatsappUrl ?? null

    try {
      redirectUrl = buildBookingWhatsAppUrl(whatsappNumber, combinedMessage)
    } catch {
      redirectUrl = created[0]?.whatsappUrl ?? null
    }

    setSubmitting(false)
    router.refresh()
    clearBookingDraft()

    if (failedKeys.size === 0) {
      clearBookingSelectionCart()
    }

    if (lastSlotError && failedKeys.size > 0) {
      setErrorMessage(lastSlotError)
    }

    if (!redirectUrl) {
      setErrorMessage(
        'Your booking was created, but WhatsApp checkout is not configured yet. Please contact support.'
      )
      return
    }

    window.location.href = redirectUrl
  }

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr)
    setSelectedSlot(null)
    setStep('time')
    setErrorMessage('')
    setSuccessMessage('')
    setAvailabilityMessage('')
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
      const availableCount = monthAvailability[dateStr] ?? 0

      days.push(
        <button
          key={dateStr}
          type="button"
          className={`calendar-day ${isDisabled ? 'unavailable' : ''} ${isSelected ? 'selected' : ''} ${availableCount > 0 ? 'available' : ''}`}
          onClick={() => !isDisabled && handleDateSelect(dateStr)}
          disabled={isDisabled}
        >
          <span className="day-number">{day}</span>
          {!isDisabled && availableCount > 0 ? <span className="day-status">{availableCount}</span> : null}
        </button>
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

          {successMessage ? (
            <div className="no-times-message">
              <p>{successMessage}</p>
            </div>
          ) : null}

          {step === 'barber' ? (
            <>
              <h2>Choose Barber</h2>
              <p className="modal-subtitle">Pick from approved barbers currently offering this cut.</p>
              {loadingOffers ? (
                <div className="loading-times">Loading barber prices...</div>
              ) : offers.length === 0 ? (
                <div className="no-times-message">
                  <p>No live barbers currently offer this service.</p>
                </div>
              ) : (
                <div className="barber-list">
                  {offers.map((offer) => (
                    <button
                      key={offer.id}
                      type="button"
                      className="barber-card"
                      onClick={() => {
                        setSelectedOffer(offer)
                        setSelectedDate('')
                        setSelectedSlot(null)
                        setAvailabilityMessage('')
                        setSuccessMessage('')
                        setStep('date')
                      }}
                    >
                      <img
                        src={getSafeImage(offer.profileImageUrl)}
                        alt={offer.barberName}
                        onError={(event) => {
                          event.currentTarget.src = getSafeImage(null)
                        }}
                      />
                      <div className="barber-info">
                        <h4>{offer.barberName}</h4>
                        <p>{offer.cuttingLocation || offer.location || 'Location not set'}</p>
                        <p>R{offer.price}</p>
                        <p>{offer.durationMinutes ? `${offer.durationMinutes} minutes` : 'Duration not set'}</p>
                        <p>{offer.availabilityStatus}</p>
                        {offer.nextAvailableSlot ? <p>{formatDateTime(offer.nextAvailableSlot)}</p> : null}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : null}

          {step === 'date' ? (
            <>
              <h2>Choose Date</h2>
              <p className="modal-subtitle">
                {selectedOffer?.barberName} at {selectedLocation}
              </p>
              <div className="calendar-nav">
                <button className="calendar-nav-btn" onClick={() => changeMonth(-1)}>
                  Previous
                </button>
                <span className="calendar-month">
                  {new Intl.DateTimeFormat('en-ZA', { month: 'long', year: 'numeric' }).format(currentMonth)}
                </span>
                <button className="calendar-nav-btn" onClick={() => changeMonth(1)}>
                  Next
                </button>
              </div>
              {loadingCalendar ? <div className="loading-times">Loading calendar...</div> : null}
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
              <div className="calendar-legend">
                <span><span className="legend-box today"></span>Available dates show slot counts</span>
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
                {selectedDate ? formatDate(selectedDate) : 'Date not set'} with {selectedOffer?.barberName}
              </p>
              {loadingTimes ? (
                <div className="loading-times">Loading available times...</div>
              ) : availableTimes.length === 0 ? (
                <div className="no-times-message">
                  <p>{availabilityMessage || 'No availability set for this date.'}</p>
                  <button className="modal-btn primary" onClick={() => setStep('date')}>
                    Back to Calendar
                  </button>
                </div>
              ) : (
                <div className="time-slots">
                  {availableTimes.map((slot) => (
                    <button
                      key={slot.startsAt}
                      className={`time-slot ${selectedSlot?.startsAt === slot.startsAt ? 'selected' : ''}`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {formatTime(slot.startTime)}
                    </button>
                  ))}
                </div>
              )}
              <div className="modal-actions">
                <button className="modal-btn secondary" onClick={() => setStep('date')}>
                  Back
                </button>
                <button
                  className="modal-btn secondary"
                  onClick={addCurrentSlotToCart}
                  disabled={!selectedSlot || loadingTimes}
                >
                  Add to Cart
                </button>
                {bookingCart.length > 0 ? (
                  <button
                    className="modal-btn primary"
                    onClick={() => setStep('confirm')}
                  >
                    View Cart ({bookingCart.length})
                  </button>
                ) : null}
              </div>
            </>
          ) : null}

          {step === 'confirm' ? (
            <>
              <h2>Booking Cart</h2>
              <p className="modal-subtitle">
                Review every selected slot before we reserve them and continue to WhatsApp checkout.
              </p>
              {bookingCart.length > 0 ? (
                <div className="barber-list">
                  {bookingCart.map((item) => (
                    <div key={item.key} className="barber-card">
                      <div className="barber-info">
                        <h4>{item.serviceName}</h4>
                        <p>{item.barberName}</p>
                        <p>{formatDate(item.date)}</p>
                        <p>{formatTime(item.startTime)} - {formatTime(item.endTime)}</p>
                        <p>R{item.price}</p>
                      </div>
                      <button className="modal-btn secondary" onClick={() => removeCartItem(item.key)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-times-message">
                  <p>No booking slots have been added yet.</p>
                </div>
              )}
              <div className="modal-actions">
                <button className="modal-btn secondary" onClick={() => setStep('barber')}>
                  Continue Shopping
                </button>
                <button
                  className="modal-btn primary"
                  onClick={handleCheckout}
                  disabled={submitting || bookingCart.length === 0}
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
