'use client'

import { useState, useEffect } from 'react'
import { barbers, getAvailableTimes, isDateAvailable } from '@/data/barbers'

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

type Step = 'barber' | 'date' | 'time'

export default function BookingFlowModal({ service, isOpen, onClose }: BookingFlowModalProps) {
  const [step, setStep] = useState<Step>('barber')
  const [selectedBarber, setSelectedBarber] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loadingTimes, setLoadingTimes] = useState(false)

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('barber')
      setSelectedBarber(null)
      setSelectedDate('')
      setSelectedTime('')
      setCurrentMonth(new Date())
      setAvailableTimes([])
    }
  }, [isOpen])

  // Fetch available times when barber and date are selected
  useEffect(() => {
    if (selectedBarber && selectedDate) {
      setLoadingTimes(true)
      // Simulate async fetch (replace with real API call)
      setTimeout(() => {
        const times = getAvailableTimes(selectedBarber.id, selectedDate)
        setAvailableTimes(times)
        setLoadingTimes(false)
      }, 300)
    } else {
      setAvailableTimes([])
    }
  }, [selectedBarber, selectedDate])

  // Automatically move to time step when date is selected and times are available
  useEffect(() => {
    if (step === 'date' && selectedDate && availableTimes.length > 0) {
      setStep('time')
    }
  }, [selectedDate, availableTimes, step])

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr)
    // Immediately clear previous time selection
    setSelectedTime('')
  }

  const addToCart = () => {
    if (!selectedBarber || !selectedDate || !selectedTime) {
      return
    }
    const cartItem = {
      type: 'service',
      id: service.id,
      name: service.name,
      price: service.price,
      image: service.image,
      barberId: selectedBarber.id,
      barberName: selectedBarber.name,
      date: selectedDate,
      time: selectedTime,
      quantity: 1
    }

    const existingCart = JSON.parse(localStorage.getItem('onlyBangersCart') || '[]')
    existingCart.push(cartItem)
    localStorage.setItem('onlyBangersCart', JSON.stringify(existingCart))
    window.dispatchEvent(new Event('cartUpdated'))
    onClose()
  }

  // Calendar generation
  const generateCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    let days = []
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const isPast = dateStr < todayStr
      const isAvailable = isDateAvailable(dateStr)
      const isDisabled = isPast || !isAvailable
      const isSelected = dateStr === selectedDate

      days.push(
        <div
          key={dateStr}
          className={`calendar-day ${isDisabled ? 'unavailable' : ''} ${isSelected ? 'selected' : ''}`}
          onClick={() => !isDisabled && handleDateSelect(dateStr)}
        >
          <span className="day-number">{day}</span>
          {!isAvailable && !isPast && <span className="day-status">Full</span>}
        </div>
      )
    }
    return days
  }

  const changeMonth = (delta: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1))
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Book {service.name}</h3>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close">
            <svg className="modal-close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {step === 'barber' && (
            <>
              <h2>Choose Your Barber</h2>
              <p className="modal-subtitle">Select from our professional barbers</p>
              <div className="barber-list">
                {barbers.map(barber => (
                  <div
                    key={barber.id}
                    className="barber-card"
                    onClick={() => {
                      setSelectedBarber(barber)
                      setStep('date')
                    }}
                  >
                    <img src={barber.image} alt={barber.name} onError={(e) => { e.currentTarget.src = '/images/header-bg.png' }} />
                    <div className="barber-info">
                      <h4>{barber.name}</h4>
                      <p>{barber.specialty}</p>
                    </div>
                    <i className="fas fa-chevron-right"></i>
                  </div>
                ))}
              </div>
              <div className="modal-actions">
                <button className="modal-btn secondary" onClick={onClose}>Cancel</button>
              </div>
            </>
          )}

          {step === 'date' && (
            <>
              <h2>Select Date</h2>
              <p className="modal-subtitle">Booking with {selectedBarber?.name}</p>
              <div className="calendar-nav">
                <button className="calendar-nav-btn" onClick={() => changeMonth(-1)}>
                  <i className="fas fa-chevron-left"></i> Previous
                </button>
                <span className="calendar-month">
                  {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <button className="calendar-nav-btn" onClick={() => changeMonth(1)}>
                  Next <i className="fas fa-chevron-right"></i>
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
              <div className="calendar-legend">
                <span><span className="legend-box today"></span> Today</span>
                <span><span className="legend-box unavailable"></span> Unavailable</span>
                <span><span className="legend-box selected"></span> Selected</span>
              </div>
              <div className="modal-actions">
                <button className="modal-btn secondary" onClick={() => setStep('barber')}>
                  <i className="fas fa-arrow-left"></i> Back
                </button>
              </div>
            </>
          )}

          {step === 'time' && (
            <>
              <h2>Choose Time</h2>
              <p className="modal-subtitle">
                {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                {' '}with {selectedBarber?.name}
              </p>
              {loadingTimes ? (
                <div className="loading-times">
                  <i className="fas fa-spinner fa-spin"></i> Loading available times...
                </div>
              ) : availableTimes.length === 0 ? (
                <div className="no-times-message">
                  <i className="fas fa-calendar-times"></i>
                  <p>No available time slots for this date.</p>
                  <p>Please select a different date.</p>
                  <button className="modal-btn primary" onClick={() => setStep('date')}>
                    Back to Calendar
                  </button>
                </div>
              ) : (
                <div className="time-slots">
                  {availableTimes.map(time => (
                    <button
                      key={time}
                      className={`time-slot ${selectedTime === time ? 'selected' : ''}`}
                      onClick={() => setSelectedTime(time)}
                    >
                      <i className="far fa-clock"></i> {time}
                    </button>
                  ))}
                </div>
              )}
              <div className="modal-actions">
                <button className="modal-btn secondary" onClick={() => setStep('date')}>
                  <i className="fas fa-arrow-left"></i> Back
                </button>
                <button
                  className="modal-btn primary"
                  onClick={addToCart}
                  disabled={!selectedTime || loadingTimes}
                >
                  Add to Cart <i className="fas fa-shopping-cart"></i>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}