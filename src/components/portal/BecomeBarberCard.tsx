import Link from 'next/link'
import type { PortalBarberApplicationSummary } from '@/lib/portal-dashboard/types'
import styles from '@/app/portal/dashboard/dashboard.module.css'

export function BecomeBarberCard({
  application,
}: {
  application: PortalBarberApplicationSummary
}) {
  return (
    <article className={styles.profileCard}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Barber Application</p>
          <h3 className={styles.cardTitle}>{application.title}</h3>
          <p className={styles.cardText}>{application.description}</p>
        </div>
        <span
          className={styles.statusBadge}
          data-status={application.status === 'none' ? 'pending' : application.status}
        >
          {application.status === 'none' ? 'not started' : application.status.replace(/_/g, ' ')}
        </span>
      </div>

      {application.rejectionReason ? (
        <div className={styles.pendingCallout}>
          <p className={styles.pendingText}>Rejection reason</p>
          <p className={styles.pendingExpiry}>{application.rejectionReason}</p>
        </div>
      ) : null}

      <div className={styles.inlineActions}>
        <Link
          href={application.ctaHref}
          className={application.canApply || application.status === 'approved' ? styles.primaryLink : styles.inlineLink}
        >
          {application.ctaLabel}
        </Link>
      </div>
    </article>
  )
}
