import styles from '@/app/portal/dashboard/dashboard.module.css'
import type { PortalAppointment } from '@/lib/portal-dashboard/types'

function formatStatusLabel(status: PortalAppointment['status']) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}

export function AppointmentCard({
  appointment,
}: {
  appointment: PortalAppointment
}) {
  return (
    <article className={styles.appointmentCard}>
      <div className={styles.appointmentTop}>
        <div>
          <h4 className={styles.cardTitle}>{appointment.service}</h4>
          <p className={styles.cardMeta}>With {appointment.barberName}</p>
        </div>
        <span className={styles.statusBadge} data-status={appointment.status}>
          {formatStatusLabel(appointment.status)}
        </span>
      </div>

      <p className={styles.appointmentDate}>{appointment.startsAtLabel}</p>

      <div className={styles.inlineActions}>
        <button
          type="button"
          className={styles.inlineActionButton}
          aria-label={`Reschedule ${appointment.service}`}
        >
          Reschedule
        </button>
        <button
          type="button"
          className={styles.inlineActionButton}
          aria-label={`Cancel ${appointment.service}`}
        >
          Cancel
        </button>
      </div>
    </article>
  )
}
