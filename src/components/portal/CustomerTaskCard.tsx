import Link from 'next/link'
import type { PortalTaskItem } from '@/lib/portal-dashboard/types'
import styles from '@/app/portal/dashboard/dashboard.module.css'

export function CustomerTaskCard({
  task,
}: {
  task: PortalTaskItem
}) {
  return (
    <article className={styles.taskCard} data-tone={task.tone}>
      <div>
        <h3 className={styles.cardTitle}>{task.title}</h3>
        <p className={styles.cardText}>{task.description}</p>
      </div>

      {task.actionHref && task.actionLabel ? (
        <Link
          href={task.actionHref}
          className={task.disabled ? styles.disabledAction : styles.inlineLink}
          aria-disabled={task.disabled}
          onClick={(event) => {
            if (task.disabled) {
              event.preventDefault()
            }
          }}
        >
          {task.actionLabel}
        </Link>
      ) : task.disabled ? (
        <span className={styles.disabledAction}>Coming Soon</span>
      ) : null}
    </article>
  )
}
