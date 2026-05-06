'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { PortalBookingCard, PortalDashboardViewModel } from '@/lib/portal-dashboard/types'
import styles from '@/app/portal/dashboard/dashboard.module.css'
import { BookingCard } from './BookingCard'
import { BecomeBarberCard } from './BecomeBarberCard'
import { ProfileSummaryCard } from './ProfileSummaryCard'

const TABS = [
  { id: 'active', label: 'Active Bookings' },
  { id: 'history', label: 'History' },
  { id: 'account', label: 'Account' },
] as const

type TabId = (typeof TABS)[number]['id']

function PrimaryBookingCard({
  dashboard,
  onViewBookings,
}: {
  dashboard: PortalDashboardViewModel
  onViewBookings: () => void
}) {
  const confirmed = dashboard.bookings.nextConfirmedBooking
  const pending = dashboard.bookings.pendingPaymentBooking

  if (pending) {
    return (
      <article className={styles.heroCard}>
        <div className={styles.heroCopy}>
          <div>
            <p className={styles.eyebrow}>Payment Required</p>
            <h2 className={styles.heroTitle}>{pending.service}</h2>
            <p className={styles.heroText}>
              {pending.startsAtLabel} with {pending.barberName}. Complete payment to hold this booking.
            </p>
          </div>
        </div>

        <div className={styles.heroMeta}>
          <div className={styles.badgeCluster}>
            <span className={styles.membershipBadge}>{pending.reference}</span>
          </div>
          <div className={styles.badgeCluster}>
            <span className={styles.statusBadge} data-status={pending.status}>
              {pending.status.replace(/_/g, ' ')}
            </span>
            <span className={styles.statusBadge} data-status={pending.paymentStatus}>
              {pending.paymentStatus.replace(/_/g, ' ')}
            </span>
          </div>
          <div className={styles.inlineActions}>
            {pending.whatsappPaymentUrl ? (
              <Link href={pending.whatsappPaymentUrl} className={styles.primaryLink}>
                Continue to WhatsApp Checkout
              </Link>
            ) : null}
            <button type="button" className={styles.inlineLink} onClick={onViewBookings}>
              View booking details
            </button>
          </div>
        </div>
      </article>
    )
  }

  if (confirmed) {
    return (
      <article className={styles.heroCard}>
        <div className={styles.heroCopy}>
          <div>
            <p className={styles.eyebrow}>Your Next Booking</p>
            <h2 className={styles.heroTitle}>{confirmed.service}</h2>
            <p className={styles.heroText}>
              {confirmed.startsAtLabel} with {confirmed.barberName}.
            </p>
          </div>
        </div>

        <div className={styles.heroMeta}>
          <div className={styles.badgeCluster}>
            <span className={styles.statusBadge} data-status={confirmed.status}>
              {confirmed.status.replace(/_/g, ' ')}
            </span>
            <span className={styles.statusBadge} data-status={confirmed.paymentStatus}>
              {confirmed.paymentStatus.replace(/_/g, ' ')}
            </span>
          </div>
          <div className={styles.inlineActions}>
            <button type="button" className={styles.primaryLink} onClick={onViewBookings}>
              View booking details
            </button>
            {confirmed.whatsappPaymentUrl ? (
              <Link href={confirmed.whatsappPaymentUrl} className={styles.inlineLink}>
                Open WhatsApp
              </Link>
            ) : null}
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className={styles.heroCard}>
      <div className={styles.heroCopy}>
        <div>
          <p className={styles.eyebrow}>No Active Booking</p>
          <h2 className={styles.heroTitle}>Ready for your next cut?</h2>
          <p className={styles.heroText}>
            Lock in your next appointment and we&apos;ll guide you straight into checkout.
          </p>
        </div>
      </div>

      <div className={styles.heroMeta}>
        <div className={styles.inlineActions}>
          <Link href="/services" className={styles.primaryLink}>
            Book Appointment
          </Link>
        </div>
      </div>
    </article>
  )
}

function CompactAttentionList({ bookings }: { bookings: PortalBookingCard[] }) {
  if (bookings.length === 0) {
    return null
  }

  return (
    <section className={styles.panel}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Attention</p>
          <h2 className={styles.sectionTitle}>More bookings waiting for payment</h2>
        </div>
      </div>

      <div className={styles.cardGrid}>
        {bookings.map((booking) => (
          <article key={booking.id} className={styles.bookingCard}>
            <div className={styles.bookingTop}>
              <div>
                <p className={styles.bookingReference}>{booking.reference}</p>
                <h3 className={styles.cardTitle}>{booking.service}</h3>
                <p className={styles.cardMeta}>{booking.startsAtLabel}</p>
              </div>
              <div className={styles.badgeCluster}>
                <span className={styles.statusBadge} data-status={booking.status}>
                  {booking.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {booking.whatsappPaymentUrl ? (
              <div className={styles.inlineActions}>
                <Link href={booking.whatsappPaymentUrl} className={styles.inlineLink}>
                  Complete payment
                </Link>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}

export function CustomerDashboardTabs({
  dashboard,
}: {
  dashboard: PortalDashboardViewModel
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>('active')
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState('')

  const hasActiveBookings = dashboard.bookings.active.length > 0
  const historyBookings = dashboard.bookings.history
  const accountStatusTone = useMemo(
    () => (dashboard.profile.isComplete ? 'Complete' : 'Needs attention'),
    [dashboard.profile.isComplete]
  )
  const reviewPrompt = dashboard.reviewPrompt.booking

  const submitReview = async () => {
    if (!reviewPrompt) {
      return
    }

    setReviewLoading(true)
    setReviewError('')

    const response = await fetch('/api/barber-reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookingId: reviewPrompt.id,
        rating: reviewRating,
        comment: reviewComment,
      }),
    })
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      setReviewError(payload?.error?.message ?? 'Could not save your review.')
      setReviewLoading(false)
      return
    }

    setReviewLoading(false)
    setReviewOpen(false)
    setReviewComment('')
    router.refresh()
  }

  return (
    <>
      <PrimaryBookingCard dashboard={dashboard} onViewBookings={() => setActiveTab('active')} />
      <CompactAttentionList bookings={dashboard.bookings.attentionPending} />

      <div className={styles.tabbedShell}>
        <div className={styles.tabsBar} role="tablist" aria-label="Customer dashboard sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={styles.tabButton}
              data-active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'active' ? (
          <section id="customer-active-bookings" className={styles.tabPanel}>
            {hasActiveBookings ? (
              <div className={styles.cardGrid}>
                {dashboard.bookings.active.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    actionLabel={booking.status === 'confirmed' ? 'Book another cut' : undefined}
                    actionHref={booking.status === 'confirmed' ? '/services' : undefined}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <h3 className={styles.cardTitle}>No active bookings right now</h3>
                <p className={styles.cardText}>
                  When you book or complete payment, the booking will appear here.
                </p>
                <Link href="/services" className={styles.primaryLink}>
                  Book Appointment
                </Link>
              </div>
            )}
          </section>
        ) : null}

        {activeTab === 'history' ? (
          <section className={styles.tabPanel}>
            {historyBookings.length > 0 ? (
              <div className={styles.cardGrid}>
                {historyBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    actionLabel="Rebook"
                    actionHref="/services"
                  />
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <h3 className={styles.cardTitle}>No booking history yet</h3>
                <p className={styles.cardText}>
                  Completed and cancelled bookings will appear here once your appointment history begins.
                </p>
              </div>
            )}
          </section>
        ) : null}

        {activeTab === 'account' ? (
          <section className={styles.tabPanel}>
            <article className={styles.panel}>
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.eyebrow}>Account</p>
                  <h2 className={styles.sectionTitle}>Profile summary</h2>
                </div>
                <span className={styles.membershipBadge}>{accountStatusTone}</span>
              </div>
              <ProfileSummaryCard profile={dashboard.profile} />
            </article>

            {reviewPrompt ? (
              <article className={styles.panel}>
                <div className={styles.sectionHeader}>
                  <div>
                    <p className={styles.eyebrow}>Review</p>
                    <h2 className={styles.sectionTitle}>Review last cut</h2>
                  </div>
                </div>
                <p className={styles.cardText}>
                  {reviewPrompt.service} with {reviewPrompt.barberName} on {reviewPrompt.startsAtLabel}
                </p>
                <div className={styles.inlineActions}>
                  <button type="button" className={styles.primaryLink} onClick={() => setReviewOpen(true)}>
                    Review last cut
                  </button>
                </div>
              </article>
            ) : null}

            <BecomeBarberCard application={dashboard.barberApplication} />
          </section>
        ) : null}
      </div>

      {reviewOpen && reviewPrompt ? (
        <div className="modal-overlay" onClick={() => setReviewOpen(false)}>
          <div className="modal-container" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Review Last Cut</h3>
              <button type="button" className="modal-close-btn" onClick={() => setReviewOpen(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className={styles.cardText}>
                {reviewPrompt.service} with {reviewPrompt.barberName}
              </p>
              <div className={styles.inlineActions}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={value === reviewRating ? styles.primaryLink : styles.inlineLink}
                    onClick={() => setReviewRating(value)}
                  >
                    {value} Star{value === 1 ? '' : 's'}
                  </button>
                ))}
              </div>
              <div className={styles.inlineActions}>
                <textarea
                  className={styles.input}
                  rows={4}
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  placeholder="Tell us about the cut, service, and overall experience."
                />
              </div>
              {reviewError ? <p className={styles.cardText}>{reviewError}</p> : null}
              <div className="modal-footer">
                <button type="button" className="modal-btn secondary" onClick={() => setReviewOpen(false)}>
                  Close
                </button>
                <button type="button" className="modal-btn primary" disabled={reviewLoading} onClick={submitReview}>
                  {reviewLoading ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
