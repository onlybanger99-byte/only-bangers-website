import styles from './dashboard.module.css'

export default function Loading() {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.loadingHero}>
          <div className={styles.loadingBlock} />
          <div className={styles.loadingActions}>
            <div className={styles.loadingChip} />
            <div className={styles.loadingChip} />
            <div className={styles.loadingChip} />
          </div>
        </div>

        <div className={styles.loadingGrid}>
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className={styles.loadingCard} />
          ))}
        </div>
      </div>
    </div>
  )
}
