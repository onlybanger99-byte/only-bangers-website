import styles from '@/app/portal/dashboard/dashboard.module.css'
import type { PortalProfileSummary } from '@/lib/portal-dashboard/types'

export function ProfileCard({
  profile,
}: {
  profile: PortalProfileSummary
}) {
  return (
    <article className={styles.profileSummaryCard}>
      <div className={styles.infoRow}>
        <span className={styles.infoLabel}>Name</span>
        <strong className={styles.infoValue}>{profile.fullName}</strong>
      </div>
      <div className={styles.infoRow}>
        <span className={styles.infoLabel}>Email</span>
        <strong className={styles.infoValue}>{profile.email}</strong>
      </div>
      <div className={styles.infoRow}>
        <span className={styles.infoLabel}>Preferred Barber</span>
        <strong className={styles.infoValue}>{profile.preferredBarber}</strong>
      </div>
      <div className={styles.profileNotes}>
        <span className={styles.infoLabel}>Grooming Preferences</span>
        <p className={styles.cardText}>{profile.groomingNotes}</p>
      </div>
    </article>
  )
}
