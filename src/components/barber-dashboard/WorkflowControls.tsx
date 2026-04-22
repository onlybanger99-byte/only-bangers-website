'use client'

import styles from '@/app/barber/dashboard/dashboard.module.css'
import type { BarberAppointmentStatus } from '@/lib/barber-dashboard/types'

const WORKFLOW_STEPS: Array<{
  status: BarberAppointmentStatus
  label: string
}> = [
  { status: 'arrived', label: 'Mark Arrived' },
  { status: 'in_progress', label: 'Mark In Progress' },
  { status: 'completed', label: 'Mark Completed' },
]

export function WorkflowControls({
  currentStatus,
  onChangeStatus,
}: {
  currentStatus: BarberAppointmentStatus
  onChangeStatus: (status: BarberAppointmentStatus) => void
}) {
  return (
    <article className={styles.detailCard}>
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.eyebrow}>Service Workflow</p>
          <h2 className={styles.panelTitle}>Chair-side controls</h2>
        </div>
      </div>

      <div className={styles.workflowGrid}>
        {WORKFLOW_STEPS.map((step) => (
          <button
            key={step.status}
            type="button"
            className={styles.workflowButton}
            data-active={currentStatus === step.status}
            onClick={() => onChangeStatus(step.status)}
            aria-pressed={currentStatus === step.status}
          >
            {step.label}
          </button>
        ))}
      </div>
    </article>
  )
}
