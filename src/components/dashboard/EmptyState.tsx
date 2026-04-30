import styles from './dashboard-shared.module.css'

export function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className={styles.emptyState}>
      <h3 className={styles.emptyTitle}>{title}</h3>
      <p className={styles.emptyText}>{description}</p>
    </div>
  )
}
