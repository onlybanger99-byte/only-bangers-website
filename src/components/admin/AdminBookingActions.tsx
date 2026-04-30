'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BookingStatus } from '@/lib/bookings/types'
import styles from '@/app/admin/dashboard/dashboard.module.css'

export function AdminBookingActions({
  bookingId,
  status,
}: {
  bookingId: string
  status: BookingStatus
}) {
  const router = useRouter()
  const [loadingAction, setLoadingAction] = useState<'confirm' | 'cancel' | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const runAction = async (action: 'confirm' | 'cancel') => {
    if (
      action === 'confirm' &&
      !window.confirm('Mark this booking as paid and confirmed?')
    ) {
      return
    }

    if (
      action === 'cancel' &&
      !window.confirm('Cancel this booking for the customer and barber workflows?')
    ) {
      return
    }

    setLoadingAction(action)
    setMessage('')
    setError('')

    const response =
      action === 'confirm'
        ? await fetch(`/api/admin/bookings/${bookingId}/confirm-payment`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ paymentStatus: 'paid' }),
          })
        : await fetch(`/api/admin/bookings/${bookingId}/status`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'cancelled' }),
          })

    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      setError(
        payload?.error?.message ??
          (action === 'confirm'
            ? 'Could not confirm this payment.'
            : 'Could not cancel this booking.')
      )
      setLoadingAction(null)
      return
    }

    setMessage(action === 'confirm' ? 'Payment confirmed.' : 'Booking cancelled.')
    setLoadingAction(null)
    router.refresh()
  }

  const showConfirm = status === 'pending_payment'
  const showCancel = status !== 'cancelled' && status !== 'completed' && status !== 'expired'

  return (
    <div className={styles.actionStack}>
      <div className={styles.inlineActions}>
        {showConfirm ? (
          <button
            type="button"
            className={styles.primaryButton}
            disabled={loadingAction !== null}
            onClick={() => runAction('confirm')}
          >
            {loadingAction === 'confirm' ? 'Confirming...' : 'Confirm Payment'}
          </button>
        ) : null}

        {showCancel ? (
          <button
            type="button"
            className={styles.dangerButton}
            disabled={loadingAction !== null}
            onClick={() => runAction('cancel')}
          >
            {loadingAction === 'cancel' ? 'Cancelling...' : 'Cancel Booking'}
          </button>
        ) : null}
      </div>

      {message ? <p className={styles.successText}>{message}</p> : null}
      {error ? <p className={styles.errorText}>{error}</p> : null}
    </div>
  )
}
