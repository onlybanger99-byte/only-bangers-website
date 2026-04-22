'use client'

import styles from './dashboard.module.css'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.errorCard}>
          <p className={styles.eyebrow}>Admin Dashboard</p>
          <h1 className={styles.title}>Something interrupted the dashboard</h1>
          <p className={styles.subtitle}>
            The admin console could not finish loading this request. You can retry
            without leaving the protected area.
          </p>
          <button type="button" onClick={reset} className={styles.primaryButton}>
            Retry Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
