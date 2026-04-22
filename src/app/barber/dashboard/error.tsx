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
          <p className={styles.eyebrow}>Barber Dashboard</p>
          <h1 className={styles.heroTitle}>The operator view could not load</h1>
          <p className={styles.panelText}>
            Retry the workspace to restore the day&apos;s schedule and client context.
          </p>
          <button type="button" className={styles.primaryAction} onClick={reset}>
            Retry Workspace
          </button>
        </div>
      </div>
    </div>
  )
}
