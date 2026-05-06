'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { BarberDashboardBooking, BarberDashboardViewModel } from '@/lib/barber-dashboard/types'
import { DashboardTabs } from '@/components/dashboard/DashboardTabs'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { AvailabilitySlotManager } from './AvailabilitySlotManager'
import { BarberGalleryManager } from './BarberGalleryManager'
import { BarberProfileEditor } from './BarberProfileEditor'
import { BarberServicePricesManager } from './BarberServicePricesManager'
import { SetupChecklistModal } from './SetupChecklistModal'
import { getSafeImage } from '@/lib/safe-image'
import styles from '@/app/barber/dashboard/dashboard.module.css'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'services', label: 'Services' },
  { id: 'availability', label: 'Availability' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'profile', label: 'Profile' },
] as const

const REMINDER_STORAGE_KEY = 'only-bangers-barber-setup-checklist-dismissed-at'
const MIN_RESHOW_MS = 30 * 60 * 1000
const MAX_RESHOW_MS = 60 * 60 * 1000

type TabId = (typeof TABS)[number]['id']

function toExternalHref(platform: 'instagram' | 'tiktok' | 'facebook' | 'portfolio', value: string) {
  const normalized = value.trim()

  if (!normalized) {
    return null
  }

  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized
  }

  const handle = normalized.replace(/^@/, '')

  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${handle}`
    case 'tiktok':
      return `https://tiktok.com/@${handle}`
    case 'facebook':
      return `https://facebook.com/${handle}`
    case 'portfolio':
    default:
      return normalized.startsWith('www.') ? `https://${normalized}` : normalized
  }
}

function BookingTimeline({
  bookings,
  emptyTitle,
  emptyDescription,
}: {
  bookings: BarberDashboardBooking[]
  emptyTitle: string
  emptyDescription: string
}) {
  if (bookings.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className={styles.compactBookingList}>
      {bookings.map((booking) => (
        <article key={booking.id} className={styles.compactBookingCard}>
          <div className={styles.recordTop}>
            <div>
              <p className={styles.referenceText}>{booking.bookingTimeLabel}</p>
              <h3 className={styles.cardTitle}>{booking.customerName}</h3>
              <p className={styles.cardMeta}>{booking.serviceName}</p>
            </div>
            <div className={styles.badgeCluster}>
              {booking.status === 'confirmed' && booking.paymentStatus === 'paid' ? (
                <span className={styles.secondaryButton}>Ready</span>
              ) : null}
              <StatusBadge value={booking.status} />
              <StatusBadge value={booking.paymentStatus} />
            </div>
          </div>

          <div className={styles.metaGrid}>
            <div>
              <span className={styles.metaLabel}>Appointment</span>
              <strong className={styles.metaValue}>{booking.startsAtLabel}</strong>
            </div>
            <div>
              <span className={styles.metaLabel}>Customer</span>
              <strong className={styles.metaValue}>{booking.customerPhone}</strong>
            </div>
            <div>
              <span className={styles.metaLabel}>Amount</span>
              <strong className={styles.metaValue}>{booking.amountDueLabel}</strong>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

export function BarberDashboardTabs({
  dashboard,
}: {
  dashboard: BarberDashboardViewModel
}) {
  const router = useRouter()

  if (!dashboard?.operator) {
    return null
  }

  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [requestingGoLive, setRequestingGoLive] = useState(false)
  const [goLiveError, setGoLiveError] = useState('')
  const [goLiveMessage, setGoLiveMessage] = useState('')
  const [isChecklistOpen, setIsChecklistOpen] = useState(false)
  const [hasDismissedChecklist, setHasDismissedChecklist] = useState(false)

  const todayReadyCount = dashboard.today.length
  const nextUpcoming = useMemo(() => dashboard.upcoming[0] ?? null, [dashboard.upcoming])
  const setupLabel =
    dashboard.setupStatus.setupStatus === 'live'
      ? 'You are live'
      : dashboard.setupStatus.setupStatus === 'pending_review'
        ? 'Go-live pending'
        : dashboard.setupStatus.canSubmitGoLive
          ? 'Ready to go live'
          : 'Setup incomplete'
  const nextRequiredAction =
    dashboard.setupStatus.setupStatus === 'live'
      ? 'You are visible publicly and ready for bookings.'
      : dashboard.setupStatus.setupStatus === 'pending_review'
        ? 'Wait for admin review to go live.'
        : dashboard.setupStatus.canSubmitGoLive
          ? 'Submit your go-live request.'
          : dashboard.setupStatus.missingItems[0] ?? 'Complete the remaining setup steps.'

  useEffect(() => {
    if (dashboard.setupStatus.setupStatus === 'live') {
      setIsChecklistOpen(false)
      return
    }

    const rawDismissedAt = window.localStorage.getItem(REMINDER_STORAGE_KEY)
    const dismissedAt = rawDismissedAt ? Number.parseInt(rawDismissedAt, 10) : 0
    const now = Date.now()

    if (!dismissedAt || Number.isNaN(dismissedAt)) {
      setIsChecklistOpen(true)
      return
    }

    const elapsed = now - dismissedAt

    if (elapsed < MIN_RESHOW_MS) {
      return
    }

    if (elapsed >= MAX_RESHOW_MS || Math.random() >= 0.5) {
      setIsChecklistOpen(true)
    }
  }, [dashboard.setupStatus])

  function dismissChecklist() {
    window.localStorage.setItem(REMINDER_STORAGE_KEY, String(Date.now()))
    setHasDismissedChecklist(true)
    setIsChecklistOpen(false)
  }

  const submitGoLiveRequest = async () => {
    if (!dashboard.setupStatus.canSubmitGoLive) {
      setIsChecklistOpen(true)
      return
    }

    setRequestingGoLive(true)
    setGoLiveError('')
    setGoLiveMessage('')

    const response = await fetch('/api/barber/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'request_go_live' }),
    })
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      const details = Array.isArray(payload?.error?.details) ? payload.error.details.join(' ') : ''
      setGoLiveError(
        payload?.error?.message
          ? `${payload.error.message}${details ? ` ${details}` : ''}`
          : 'Could not submit go-live request.'
      )
      setRequestingGoLive(false)
      return
    }

    setGoLiveMessage('Go-live request submitted for admin review.')
    setRequestingGoLive(false)
    setIsChecklistOpen(false)
    router.refresh()
  }

  const showSetupProgress =
    dashboard.setupStatus.setupStatus !== 'live' || !dashboard.setupStatus.canSubmitGoLive

  return (
    <>
      <SetupChecklistModal
        open={isChecklistOpen}
        onClose={dismissChecklist}
        setupStatus={dashboard.setupStatus}
        goLiveRejectionReason={dashboard.operator.goLiveRejectionReason}
        onOpenServices={() => {
          setActiveTab('services')
          dismissChecklist()
        }}
        onOpenAvailability={() => {
          setActiveTab('availability')
          dismissChecklist()
        }}
        onOpenProfile={() => {
          setActiveTab('profile')
          dismissChecklist()
        }}
        onRequestGoLive={() => {
          void submitGoLiveRequest()
        }}
      />

      <article className={styles.commandCard}>
        <div className={styles.commandCardTop}>
          <div className={styles.personTop}>
            <Image
              src={getSafeImage(dashboard.operator.image)}
              alt={dashboard.operator.displayName}
              width={68}
              height={68}
              className={styles.heroAvatar}
            />
            <div>
              <h2 className={styles.cardTitle}>{dashboard.operator.displayName}</h2>
              <p className={styles.cardMeta}>{dashboard.operator.specialty}</p>
            </div>
          </div>

          <div className={styles.badgeCluster}>
            <StatusBadge value={dashboard.operator.activeStatus} />
            <span className={styles.secondaryButton}>{dashboard.operator.isLive ? 'Live' : 'Not live'}</span>
            <span className={styles.secondaryButton}>{setupLabel}</span>
          </div>
        </div>

        {showSetupProgress ? (
          <div className={styles.commandStatusBlock}>
            <div>
              <h3 className={styles.cardTitle}>{dashboard.setupStatus.completionPercentage}% complete</h3>
              <p className={styles.cardSubmeta}>{nextRequiredAction}</p>
            </div>
            <div className={styles.progressBarTrack}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${dashboard.setupStatus.completionPercentage}%` }}
              />
            </div>
          </div>
        ) : (
          <p className={styles.cardSubmeta}>You are live.</p>
        )}

        {dashboard.operator.goLiveRejectionReason ? (
          <div className={styles.warningBanner}>
            <strong className={styles.metaValue}>Go-live review note</strong>
            <p className={styles.cardSubmeta}>{dashboard.operator.goLiveRejectionReason}</p>
          </div>
        ) : null}

        <div className={styles.inlineActions}>
          {showSetupProgress ? (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => setIsChecklistOpen(true)}
            >
              {dashboard.setupStatus.canSubmitGoLive ? 'Ready to go live' : 'Setup incomplete'}
            </button>
          ) : null}
          <button type="button" className={styles.secondaryButton} onClick={() => setActiveTab('services')}>
            Edit Services
          </button>
          <button type="button" className={styles.secondaryButton} onClick={() => setActiveTab('availability')}>
            Edit Availability
          </button>
          <button type="button" className={styles.secondaryButton} onClick={() => setActiveTab('profile')}>
            Edit Profile
          </button>
          {!dashboard.operator.isLive ? (
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={requestingGoLive || dashboard.setupStatus.setupStatus === 'pending_review'}
              onClick={() => {
                void submitGoLiveRequest()
              }}
            >
              {dashboard.setupStatus.setupStatus === 'pending_review'
                ? 'Go-Live Pending'
                : requestingGoLive
                  ? 'Submitting...'
                  : 'Submit Go-Live Request'}
            </button>
          ) : null}
        </div>

        {goLiveMessage ? <p className={styles.successText}>{goLiveMessage}</p> : null}
        {goLiveError ? <p className={styles.errorText}>{goLiveError}</p> : null}
      </article>

      <div className={styles.tabbedShell}>
        <DashboardTabs
          tabs={TABS}
          activeTab={activeTab}
          onChange={setActiveTab}
          label="Barber dashboard sections"
        />

        {activeTab === 'overview' ? (
          <section className={styles.tabPanel}>
            <div className={styles.overviewGrid}>
              <article className={styles.summaryCard}>
                <p className={styles.eyebrow}>Setup</p>
                <h3 className={styles.cardTitle}>{dashboard.setupStatus.completionPercentage}%</h3>
                <p className={styles.cardSubmeta}>{setupLabel}</p>
              </article>

              <article className={styles.summaryCard}>
                <p className={styles.eyebrow}>Today</p>
                <h3 className={styles.cardTitle}>{todayReadyCount}</h3>
                <p className={styles.cardSubmeta}>
                  {todayReadyCount === 1 ? 'confirmed booking ready today' : 'confirmed bookings ready today'}
                </p>
              </article>

              <article className={styles.summaryCard}>
                <p className={styles.eyebrow}>Next Up</p>
                <h3 className={styles.cardTitle}>{nextUpcoming ? nextUpcoming.bookingTimeLabel : 'No booking'}</h3>
                <p className={styles.cardSubmeta}>
                  {nextUpcoming
                    ? `${nextUpcoming.customerName} · ${nextUpcoming.serviceName}`
                    : 'No confirmed booking after today'}
                </p>
              </article>
            </div>

            {!dashboard.operator.isLive && !hasDismissedChecklist ? (
              <article className={styles.panelCard}>
                <div className={styles.recordTop}>
                  <div>
                    <p className={styles.eyebrow}>Needs Attention</p>
                    <p className={styles.cardSubmeta}>{nextRequiredAction}</p>
                  </div>
                  <button type="button" className={styles.primaryButton} onClick={() => setIsChecklistOpen(true)}>
                    View setup checklist
                  </button>
                </div>
              </article>
            ) : null}

            {dashboard.today.length > 0 ? (
              <article className={styles.panelCard}>
                <p className={styles.eyebrow}>Today&apos;s Bookings</p>
                <BookingTimeline
                  bookings={dashboard.today}
                  emptyTitle="No confirmed work today"
                  emptyDescription="Confirmed bookings for today will appear here once they are ready."
                />
              </article>
            ) : (
              <article className={styles.compactEmptyCard}>
                <p className={styles.cardSubmeta}>No confirmed bookings today.</p>
              </article>
            )}
          </section>
        ) : null}

        {activeTab === 'services' ? (
          <section className={styles.tabPanel}>
            <article className={styles.recordCard}>
              <div className={styles.sectionHeadingCompact}>
                <div>
                  <p className={styles.eyebrow}>Services</p>
                  <h3 className={styles.cardTitle}>All six approved cuts</h3>
                </div>
                <p className={styles.cardSubmeta}>
                  Prices and durations must be active for every service before go-live.
                </p>
              </div>

              <BarberServicePricesManager initialPrices={dashboard.servicePrices} />
            </article>
          </section>
        ) : null}

        {activeTab === 'availability' ? (
          <section className={styles.tabPanel}>
            <article className={styles.recordCard}>
              <div className={styles.sectionHeadingCompact}>
                <div>
                  <p className={styles.eyebrow}>Availability</p>
                  <h3 className={styles.cardTitle}>Calendar view</h3>
                </div>
                <p className={styles.cardSubmeta}>View your time slots by day, then edit them in a bulk modal.</p>
              </div>

              <AvailabilitySlotManager />
            </article>
          </section>
        ) : null}

        {activeTab === 'gallery' ? (
          <section className={styles.tabPanel}>
            <article className={styles.recordCard}>
              <div className={styles.sectionHeadingCompact}>
                <div>
                  <p className={styles.eyebrow}>Gallery</p>
                  <h3 className={styles.cardTitle}>Portfolio images</h3>
                </div>
                <p className={styles.cardSubmeta}>Optional, but it helps customers trust your profile.</p>
              </div>

              <BarberGalleryManager initialImages={dashboard.galleryImages} />
            </article>
          </section>
        ) : null}

        {activeTab === 'profile' ? (
          <section className={styles.tabPanel}>
            <article className={styles.recordCard}>
              <div className={styles.sectionHeadingCompact}>
                <div>
                  <p className={styles.eyebrow}>Profile</p>
                  <h3 className={styles.cardTitle}>Basic info, location, socials, and images</h3>
                </div>
                <div className={styles.inlineActions}>
                  {dashboard.operator.instagramUrl ? (
                    <Link
                      href={toExternalHref('instagram', dashboard.operator.instagramUrl) ?? '#'}
                      className={styles.secondaryButton}
                    >
                      Instagram
                    </Link>
                  ) : null}
                  {dashboard.operator.tiktokUrl ? (
                    <Link
                      href={toExternalHref('tiktok', dashboard.operator.tiktokUrl) ?? '#'}
                      className={styles.secondaryButton}
                    >
                      TikTok
                    </Link>
                  ) : null}
                  {dashboard.operator.facebookUrl ? (
                    <Link
                      href={toExternalHref('facebook', dashboard.operator.facebookUrl) ?? '#'}
                      className={styles.secondaryButton}
                    >
                      Facebook
                    </Link>
                  ) : null}
                  {dashboard.operator.portfolioUrl ? (
                    <Link
                      href={toExternalHref('portfolio', dashboard.operator.portfolioUrl) ?? '#'}
                      className={styles.secondaryButton}
                    >
                      Portfolio
                    </Link>
                  ) : null}
                </div>
              </div>

              <BarberProfileEditor profile={dashboard.operator} />
            </article>
          </section>
        ) : null}
      </div>
    </>
  )
}
