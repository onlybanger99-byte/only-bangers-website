'use client'

import styles from '@/app/barber/dashboard/dashboard.module.css'
import type { BarberAppointment } from '@/lib/barber-dashboard/types'
import { StatusBadge } from './StatusBadge'

export function ScheduleCard({
  appointment,
  isActive,
  onSelect,
}: {
  appointment: BarberAppointment
  isActive: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={styles.scheduleCard}
      data-active={isActive}
      onClick={onSelect}
      aria-pressed={isActive}
    >
      <div className={styles.scheduleTop}>
        <div>
          <span className={styles.scheduleTime}>{appointment.timeLabel}</span>
          <h3 className={styles.cardTitle}>{appointment.customerName}</h3>
        </div>

        <StatusBadge
          label={appointment.status.replace(/_/g, ' ')}
          tone={appointment.status}
        />
      </div>

      <p className={styles.cardMeta}>{appointment.serviceBooked}</p>
      <p className={styles.cardSubmeta}>
        {appointment.durationLabel} - {appointment.barberAssigned}
      </p>
    </button>
  )
}
