import Link from 'next/link'
import type { PortalProfileSummary } from '@/lib/portal-dashboard/types'
import styles from '@/app/portal/dashboard/dashboard.module.css'

export function ProfileSummaryCard({
  profile,
}: {
  profile: PortalProfileSummary
}) {
  return (
    <article className={styles.profileCard}>
      <div className={styles.profileTop}>
        <img
          src={profile.profileImageUrl}
          alt={profile.fullName}
          className={styles.profileAvatar}
        />
        <div>
          <h3 className={styles.cardTitle}>{profile.fullName}</h3>
          <p className={styles.cardMeta}>{profile.email}</p>
        </div>
      </div>

      <div className={styles.profileGrid}>
        <div>
          <span className={styles.infoLabel}>Phone</span>
          <span className={styles.infoValue}>{profile.phoneNumber}</span>
        </div>
        <div>
          <span className={styles.infoLabel}>Role</span>
          <span className={styles.infoValue}>{profile.accountRoleLabel}</span>
        </div>
        <div>
          <span className={styles.infoLabel}>Profile Status</span>
          <span className={styles.infoValue}>{profile.profileCompletionLabel}</span>
        </div>
      </div>

      {profile.editProfileHref ? (
        <div className={styles.inlineActions}>
          <Link href={profile.editProfileHref} className={styles.primaryLink}>
            Edit Profile
          </Link>
        </div>
      ) : null}
    </article>
  )
}
