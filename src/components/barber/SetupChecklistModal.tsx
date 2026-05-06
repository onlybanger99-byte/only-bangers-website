'use client'

import type { BarberSetupStatusSummary } from '@/lib/barber/setup-status'
import { BarberDashboardModal } from './BarberDashboardModal'
import styles from '@/app/barber/dashboard/dashboard.module.css'

type ChecklistItem = {
  id: string
  label: string
  detail: string
  completed: boolean
  recommended?: boolean
  actionLabel?: string
  onAction?: () => void
}

function ChecklistRow({ item }: { item: ChecklistItem }) {
  return (
    <article className={styles.checklistItemCard} data-complete={item.completed}>
      <div className={styles.checklistItemCopy}>
        <div className={styles.checklistItemTop}>
          <span className={styles.checklistStatusIcon}>{item.completed ? '✓' : item.recommended ? '•' : '!'}</span>
          <div>
            <h3 className={styles.cardTitle}>{item.label}</h3>
            <p className={styles.cardSubmeta}>{item.detail}</p>
          </div>
        </div>
      </div>

      <div className={styles.inlineActions}>
        <span className={styles.secondaryButton}>
          {item.completed ? 'Completed' : item.recommended ? 'Recommended' : 'Required'}
        </span>
        {!item.completed && item.actionLabel && item.onAction ? (
          <button type="button" className={styles.primaryButton} onClick={item.onAction}>
            {item.actionLabel}
          </button>
        ) : null}
      </div>
    </article>
  )
}

export function SetupChecklistModal({
  open,
  onClose,
  setupStatus,
  goLiveRejectionReason,
  onOpenServices,
  onOpenAvailability,
  onOpenProfile,
  onRequestGoLive,
}: {
  open: boolean
  onClose: () => void
  setupStatus: BarberSetupStatusSummary
  goLiveRejectionReason?: string | null
  onOpenServices: () => void
  onOpenAvailability: () => void
  onOpenProfile: () => void
  onRequestGoLive: () => void
}) {
  const items: ChecklistItem[] = [
    {
      id: 'profile',
      label: 'Basic profile',
      detail: setupStatus.profileComplete
        ? 'Display name and barber bio are set.'
        : 'Add your display name and a short barber bio.',
      completed: setupStatus.profileComplete,
      actionLabel: 'Open Profile',
      onAction: onOpenProfile,
    },
    {
      id: 'location',
      label: 'Location',
      detail: setupStatus.hasLocation
        ? 'Location details are available for customers.'
        : 'Add your area, cutting location, or Google Maps link.',
      completed: setupStatus.hasLocation,
      actionLabel: 'Add Location',
      onAction: onOpenProfile,
    },
    {
      id: 'prices',
      label: 'Services and prices',
      detail: setupStatus.hasAllRequiredServicePrices
        ? 'All six approved services have active prices.'
        : 'Set active prices for all six approved services.',
      completed: setupStatus.hasAllRequiredServicePrices,
      actionLabel: 'Open Services',
      onAction: onOpenServices,
    },
    {
      id: 'durations',
      label: 'Service durations',
      detail: setupStatus.hasAllDurations
        ? 'All six approved services have durations.'
        : 'Add a duration to every approved service.',
      completed: setupStatus.hasAllDurations,
      actionLabel: 'Open Services',
      onAction: onOpenServices,
    },
    {
      id: 'availability',
      label: 'Availability',
      detail: setupStatus.hasAvailability
        ? 'You have bookable time slots published.'
        : 'Add at least one availability slot.',
      completed: setupStatus.hasAvailability,
      actionLabel: 'Open Availability',
      onAction: onOpenAvailability,
    },
    {
      id: 'gallery',
      label: 'Gallery',
      detail: setupStatus.hasGalleryImages
        ? 'Your portfolio already includes gallery images.'
        : 'Recommended: add gallery images to strengthen your public page.',
      completed: setupStatus.hasGalleryImages,
      recommended: true,
    },
    {
      id: 'go-live',
      label: 'Go-live request',
      detail:
        setupStatus.setupStatus === 'pending_review'
          ? 'Your go-live request is already pending admin review.'
          : setupStatus.setupStatus === 'live'
            ? 'You are already live and visible to customers.'
            : setupStatus.canSubmitGoLive
              ? 'Your setup is ready. Submit your go-live request.'
              : 'Finish the required setup items before submitting a go-live request.',
      completed: setupStatus.setupStatus === 'pending_review' || setupStatus.setupStatus === 'live',
      actionLabel: setupStatus.canSubmitGoLive ? 'Submit Go-Live Request' : undefined,
      onAction: setupStatus.canSubmitGoLive ? onRequestGoLive : undefined,
    },
  ]

  return (
    <BarberDashboardModal
      open={open}
      onClose={onClose}
      eyebrow="Setup Checklist"
      title="Finish Your Barber Setup"
      subtitle={`Setup progress: ${setupStatus.completionPercentage}% complete.`}
      size="wide"
      footer={
        <div className={styles.modalFooterActions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            Close
          </button>
        </div>
      }
    >
      {goLiveRejectionReason ? (
        <div className={styles.warningBanner}>
          <strong className={styles.metaValue}>Go-live review note</strong>
          <p className={styles.cardSubmeta}>{goLiveRejectionReason}</p>
        </div>
      ) : null}

      <div className={styles.checklistStack}>
        {items.map((item) => (
          <ChecklistRow key={item.id} item={item} />
        ))}
      </div>
    </BarberDashboardModal>
  )
}
