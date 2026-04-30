import styles from './dashboard-shared.module.css'

export function DashboardStatCard({
  label,
  value,
  detail,
  tone = 'gold',
}: {
  label: string
  value: string
  detail: string
  tone?: 'gold' | 'emerald' | 'blue' | 'rose'
}) {
  return (
    <article className={styles.statCard} data-tone={tone}>
      <span className={styles.statLabel}>{label}</span>
      <strong className={styles.statValue}>{value}</strong>
      <p className={styles.statDetail}>{detail}</p>
    </article>
  )
}
