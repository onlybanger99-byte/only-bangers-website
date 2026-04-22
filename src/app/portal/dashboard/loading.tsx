import styles from './dashboard.module.css'

export default function Loading() {
  return (
    <div className="page-background">
      <div className={styles.pageShell}>
        <div className={styles.loadingHero} />
        <div className={styles.loadingGrid}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className={styles.loadingCard} />
          ))}
        </div>
      </div>
    </div>
  )
}
