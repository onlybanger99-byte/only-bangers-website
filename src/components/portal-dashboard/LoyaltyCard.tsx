import styles from '@/app/portal/dashboard/dashboard.module.css'
import type { PortalLoyaltySummary } from '@/lib/portal-dashboard/types'

export function LoyaltyCard({
  loyalty,
}: {
  loyalty: PortalLoyaltySummary
}) {
  const progressPercent = Math.min(
    100,
    Math.round((loyalty.progressValue / loyalty.progressTarget) * 100)
  )

  return (
    <article className={styles.loyaltyCard}>
      <div className={styles.loyaltyHeader}>
        <div>
          <span className={styles.infoLabel}>Visits Completed</span>
          <strong className={styles.loyaltyValue}>{loyalty.visitsCompleted}</strong>
        </div>
        <div className={styles.loyaltyPill}>{progressPercent}% to reward</div>
      </div>

      <div className={styles.progressTrack} aria-hidden="true">
        <div
          className={styles.progressFill}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <p className={styles.cardText}>{loyalty.progressLabel}</p>

      <div className={styles.loyaltyReferral}>
        <h4 className={styles.cardTitle}>{loyalty.referralHeadline}</h4>
        <p className={styles.cardText}>{loyalty.perkCopy}</p>
      </div>
    </article>
  )
}
