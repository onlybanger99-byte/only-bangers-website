'use client'

import { useEffect, useMemo, useState } from 'react'
import type { BarberSetupChecklist } from '@/lib/barbers/setup'
import type { BarberSetupStatusSummary } from '@/lib/barber/setup-status'
import styles from '@/app/barber/dashboard/dashboard.module.css'

const STORAGE_KEY = 'only-bangers-barber-setup-reminder-dismissed-at'
const MIN_RESHOW_MS = 30 * 60 * 1000
const MAX_RESHOW_MS = 60 * 60 * 1000

function shouldShowReminder(setupStatus: BarberSetupStatusSummary) {
  return setupStatus.setupStatus !== 'live'
}

export function BarberSetupReminderModal({
  setupStatus,
  checklist,
  onOpenServices,
  onOpenAvailability,
  onOpenProfile,
  onRequestGoLive,
}: {
  setupStatus: BarberSetupStatusSummary
  checklist: BarberSetupChecklist
  onOpenServices: () => void
  onOpenAvailability: () => void
  onOpenProfile: () => void
  onRequestGoLive: () => void
}) {
  const [open, setOpen] = useState(false)

  const reminderItems = useMemo(() => {
    const items: string[] = []

    if (!setupStatus.profileComplete) {
      items.push('Profile incomplete')
    }

    if (!setupStatus.hasLocation) {
      items.push('Missing location')
    }

    if (!setupStatus.hasAllRequiredServicePrices || !setupStatus.hasAllDurations) {
      items.push('Missing services or prices')
    }

    if (!setupStatus.hasAvailability) {
      items.push('Missing availability')
    }

    if (!setupStatus.hasGalleryImages) {
      items.push('Gallery images recommended')
    }

    if (setupStatus.setupStatus === 'ready_to_submit') {
      items.push('Your setup is ready. Submit go-live request.')
    }

    if (setupStatus.setupStatus === 'pending_review') {
      items.push('Go-live request pending admin review')
    }

    if (setupStatus.setupStatus === 'deactivated') {
      items.push('Your barber profile is currently deactivated')
    }

    return items
  }, [setupStatus])

  useEffect(() => {
    if (!shouldShowReminder(setupStatus)) {
      setOpen(false)
      return
    }

    const lastDismissedRaw = window.localStorage.getItem(STORAGE_KEY)
    const lastDismissedAt = lastDismissedRaw ? Number.parseInt(lastDismissedRaw, 10) : 0
    const now = Date.now()

    if (!lastDismissedAt || Number.isNaN(lastDismissedAt)) {
      setOpen(true)
      return
    }

    const elapsed = now - lastDismissedAt

    if (elapsed < MIN_RESHOW_MS) {
      return
    }

    if (elapsed >= MAX_RESHOW_MS) {
      setOpen(true)
      return
    }

    if (Math.random() >= 0.5) {
      setOpen(true)
    }
  }, [setupStatus])

  if (!open) {
    return null
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.reminderModal}>
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.eyebrow}>Setup Reminder</p>
            <h2 className={styles.sectionTitle}>A few things still need attention</h2>
            <p className={styles.cardSubmeta}>
              Setup progress: {setupStatus.completionPercentage}% complete.
            </p>
          </div>
          <button
            type="button"
            className={styles.modalCloseButton}
            onClick={() => {
              window.localStorage.setItem(STORAGE_KEY, String(Date.now()))
              setOpen(false)
            }}
          >
            Close
          </button>
        </div>

        <div className={styles.modalBodyStack}>
          <div className={styles.reminderList}>
            {reminderItems.map((item) => (
              <div key={item} className={styles.reminderItem}>
                {item}
              </div>
            ))}
          </div>

          <div className={styles.cardGrid}>
            {checklist.items.map((item) => (
              <article key={item.id} className={styles.summaryCard}>
                <div className={styles.recordTop}>
                  <strong className={styles.cardTitle}>{item.label}</strong>
                  <span className={styles.secondaryButton}>{item.completed ? 'Done' : 'Needed'}</span>
                </div>
                <p className={styles.cardSubmeta}>{item.detail}</p>
              </article>
            ))}
          </div>

          <div className={styles.inlineActions}>
            <button type="button" className={styles.primaryButton} onClick={onOpenProfile}>
              Complete Profile
            </button>
            <button type="button" className={styles.secondaryButton} onClick={onOpenServices}>
              Add Services
            </button>
            <button type="button" className={styles.secondaryButton} onClick={onOpenAvailability}>
              Add Availability
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={!setupStatus.canSubmitGoLive}
              onClick={onRequestGoLive}
            >
              Submit Go Live
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
