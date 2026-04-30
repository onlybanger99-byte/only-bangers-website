import styles from '@/app/portal/dashboard/dashboard.module.css'

export function DashboardStatCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <article className={styles.statCard}>
      <span className={styles.statLabel}>{label}</span>
      <strong className={styles.statValue}>{value}</strong>
      <p className={styles.statDetail}>{detail}</p>
    </article>
  )
}
