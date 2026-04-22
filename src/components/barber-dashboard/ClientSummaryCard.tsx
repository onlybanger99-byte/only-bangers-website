'use client'

import styles from '@/app/barber/dashboard/dashboard.module.css'
import type { BarberAppointment } from '@/lib/barber-dashboard/types'
import { StatusBadge } from './StatusBadge'

export function ClientSummaryCard({
  appointment,
}: {
  appointment: BarberAppointment
}) {
  return (
    <article className={styles.detailCard}>
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.eyebrow}>Client Quick View</p>
          <h2 className={styles.panelTitle}>{appointment.customerName}</h2>
        </div>

        <StatusBadge
          label={appointment.clientQuickView.contentConsent ? 'Consent On File' : 'Consent Needed'}
          tone={appointment.clientQuickView.contentConsent ? 'consent_yes' : 'consent_no'}
        />
      </div>

      <div className={styles.clientInfoGrid}>
        <div className={styles.infoBlock}>
          <span className={styles.infoLabel}>Client contact</span>
          <p className={styles.infoText}>{appointment.customerEmail}</p>
        </div>

        <div className={styles.infoBlock}>
          <span className={styles.infoLabel}>Service preference</span>
          <p className={styles.infoText}>{appointment.clientQuickView.servicePreference}</p>
        </div>

        <div className={styles.infoBlock}>
          <span className={styles.infoLabel}>Style notes</span>
          <p className={styles.infoText}>{appointment.clientQuickView.styleNotes}</p>
        </div>
      </div>

      <div className={styles.infoBlock}>
        <span className={styles.infoLabel}>Recent visit history</span>
        <ul className={styles.historyList}>
          {appointment.clientQuickView.recentVisitHistory.map((entry) => (
            <li key={entry}>{entry}</li>
          ))}
        </ul>
      </div>
    </article>
  )
}
