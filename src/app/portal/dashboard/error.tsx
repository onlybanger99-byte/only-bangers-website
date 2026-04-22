'use client'

import styles from './dashboard.module.css'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="page-background">
      <div className={styles.pageShell}>
        <div className={styles.errorCard}>
          <p className={styles.eyebrow}>Only Bangers Member Area</p>
          <h1 className={styles.heroTitle}>Your dashboard needs another pass</h1>
          <p className={styles.cardText}>
            We couldn&apos;t finish loading your member experience. Retry to restore
            your bookings, profile, and rewards view.
          </p>
          <button type="button" className={styles.primaryLink} onClick={reset}>
            Retry Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
