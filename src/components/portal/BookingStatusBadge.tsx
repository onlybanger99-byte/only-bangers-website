'use client'

import type { BookingStatus, PaymentStatus } from '@/lib/bookings/types'
import styles from '@/app/portal/dashboard/dashboard.module.css'

export function BookingStatusBadge({
  value,
  kind = 'booking',
}: {
  value: BookingStatus | PaymentStatus
  kind?: 'booking' | 'payment'
}) {
  return (
    <span className={styles.statusBadge} data-kind={kind} data-status={value}>
      {value.replace(/_/g, ' ')}
    </span>
  )
}
