'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BookingStatus } from '@/lib/bookings/types'

const STATUS_OPTIONS: BookingStatus[] = [
  'pending_payment',
  'confirmed',
  'completed',
  'cancelled',
  'expired',
]

export function AdminBookingStatusForm({
  bookingId,
  currentStatus,
}: {
  bookingId: string
  currentStatus: BookingStatus
}) {
  const router = useRouter()
  const [nextStatus, setNextStatus] = useState<BookingStatus>(currentStatus)
  const [loading, setLoading] = useState(false)
  const [confirmingPayment, setConfirmingPayment] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (nextStatus === currentStatus) {
      return
    }

    if (
      (nextStatus === 'cancelled' || nextStatus === 'completed' || nextStatus === 'expired') &&
      !window.confirm(`Change this booking status to ${nextStatus.replace('_', ' ')}?`)
    ) {
      return
    }

    setLoading(true)
    setMessage('')
    setError('')

    const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: nextStatus }),
    })
    const payload = await response.json()

    if (!response.ok || !payload.ok) {
      setError(payload?.error?.message ?? 'Could not update the booking status.')
      setLoading(false)
      return
    }

    setMessage('Status updated')
    setLoading(false)
    router.refresh()
  }

  const handleConfirmPayment = async () => {
    if (
      currentStatus !== 'pending_payment' ||
      !window.confirm('Mark this booking as paid and confirmed?')
    ) {
      return
    }

    setConfirmingPayment(true)
    setMessage('')
    setError('')

    const response = await fetch(`/api/admin/bookings/${bookingId}/confirm-payment`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentStatus: 'paid' }),
    })
    const payload = await response.json()

    if (!response.ok || !payload.ok) {
      setError(payload?.error?.message ?? 'Could not confirm payment.')
      setConfirmingPayment(false)
      return
    }

    setNextStatus('confirmed')
    setMessage('Payment confirmed')
    setConfirmingPayment(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.55rem' }}>
      <label style={{ display: 'grid', gap: '0.35rem' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Status</span>
        <select
          value={nextStatus}
          onChange={(event) => setNextStatus(event.target.value as BookingStatus)}
          style={{
            borderRadius: '0.9rem',
            border: '1px solid rgba(212, 175, 55, 0.18)',
            background: 'rgba(255,255,255,0.03)',
            color: 'var(--text-primary)',
            padding: '0.7rem 0.85rem',
          }}
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        disabled={loading || nextStatus === currentStatus}
        style={{
          borderRadius: '999px',
          border: '1px solid rgba(212, 175, 55, 0.2)',
          background: 'rgba(255,255,255,0.02)',
          color: 'var(--text-secondary)',
          padding: '0.72rem 1rem',
          cursor: loading ? 'wait' : 'pointer',
        }}
      >
        {loading ? 'Saving...' : 'Save Status'}
      </button>

      {currentStatus === 'pending_payment' ? (
        <button
          type="button"
          onClick={handleConfirmPayment}
          disabled={confirmingPayment}
          style={{
            borderRadius: '999px',
            border: 'none',
            background: 'var(--premium-gold)',
            color: 'var(--premium-dark)',
            padding: '0.72rem 1rem',
            cursor: confirmingPayment ? 'wait' : 'pointer',
            fontWeight: 700,
          }}
        >
          {confirmingPayment ? 'Confirming Payment...' : 'Mark Payment Confirmed'}
        </button>
      ) : null}

      {message ? <span style={{ color: '#9bf4cf', fontSize: '0.84rem' }}>{message}</span> : null}
      {error ? <span style={{ color: '#fecdd3', fontSize: '0.84rem' }}>{error}</span> : null}
    </form>
  )
}
