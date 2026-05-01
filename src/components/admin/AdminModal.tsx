'use client'

import type { ReactNode } from 'react'
import styles from '@/app/admin/dashboard/dashboard.module.css'

export function AdminModal({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  if (!open) {
    return null
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="presentation">
      <div
        className={styles.modalPanel}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>{title}</h3>
            {subtitle ? <p className={styles.cardSubmeta}>{subtitle}</p> : null}
          </div>
          <button type="button" className={styles.modalCloseButton} onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>

        <div className={styles.modalBody}>{children}</div>

        {footer ? <div className={styles.modalFooter}>{footer}</div> : null}
      </div>
    </div>
  )
}
