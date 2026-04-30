import type { BookingStatus, PaymentStatus } from '@/lib/bookings/types'
import styles from './dashboard-shared.module.css'

type BadgeValue =
  | BookingStatus
  | PaymentStatus
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'pending'
  | 'enabled'
  | 'not_enabled'
  | 'error'
  | 'approved'
  | 'rejected'

export function StatusBadge({
  value,
}: {
  value: BadgeValue
}) {
  return (
    <span className={styles.statusBadge} data-status={value}>
      {value.replace(/_/g, ' ')}
    </span>
  )
}
