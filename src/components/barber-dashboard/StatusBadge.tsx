'use client'

import styles from '@/app/barber/dashboard/dashboard.module.css'

type BadgeTone =
  | 'scheduled'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'consent_yes'
  | 'consent_no'
  | 'ready'
  | 'missing'

export function StatusBadge({
  label,
  tone,
}: {
  label: string
  tone: BadgeTone
}) {
  return (
    <span className={styles.statusBadge} data-tone={tone}>
      {label}
    </span>
  )
}
