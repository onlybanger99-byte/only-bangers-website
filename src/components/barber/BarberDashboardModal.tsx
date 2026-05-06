'use client'

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import styles from '@/app/barber/dashboard/dashboard.module.css'

export function BarberDashboardModal({
  open,
  onClose,
  eyebrow,
  title,
  subtitle,
  footer,
  children,
  size = 'default',
}: {
  open: boolean
  onClose: () => void
  eyebrow?: string
  title: string
  subtitle?: string
  footer: ReactNode
  children: ReactNode
  size?: 'default' | 'wide'
}) {
  useEffect(() => {
    if (!open) {
      document.body.classList.remove('barber-dashboard-modal-open')
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.body.classList.add('barber-dashboard-modal-open')
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.classList.remove('barber-dashboard-modal-open')
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose, open])

  if (!open) {
    return null
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.dashboardModal}
        data-size={size}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.modalHeader}>
          <div>
            {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
            <h2 className={styles.sectionTitle}>{title}</h2>
            {subtitle ? <p className={styles.cardSubmeta}>{subtitle}</p> : null}
          </div>
        </div>

        <div className={styles.modalContent}>{children}</div>
        <div className={styles.modalFooter}>{footer}</div>
      </div>
    </div>
  )
}
