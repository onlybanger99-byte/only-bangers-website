'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { PortalBookingCard, PortalDashboardViewModel } from '@/lib/portal-dashboard/types'
import styles from '@/app/portal/dashboard/dashboard.module.css'
import { BookingCard } from './BookingCard'
import { CustomerTaskCard } from './CustomerTaskCard'
import { PaymentCard } from './PaymentCard'
import { ProfileSummaryCard } from './ProfileSummaryCard'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'payments', label: 'Payments' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'history', label: 'History' },
  { id: 'profile', label: 'Profile' },
] as const

type TabId = (typeof TABS)[number]['id']

function BookingGroup({
  title,
  description,
  bookings,
  emptyMessage,
}: {
  title: string
  description: string
  bookings: PortalBookingCard[]
  emptyMessage: string
}) {
  return (
    <section className={styles.tabSection}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>{title}</p>
          <h2 className={styles.sectionTitle}>{description}</h2>
        </div>
      </div>

      {bookings.length > 0 ? (
        <div className={styles.cardGrid}>
          {bookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>{emptyMessage}</p>
        </div>
      )}
    </section>
  )
}

function PaymentGroup({
  title,
  bookings,
  emptyMessage,
}: {
  title: string
  bookings: PortalBookingCard[]
  emptyMessage: string
}) {
  return (
    <section className={styles.tabSection}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Payments</p>
          <h2 className={styles.sectionTitle}>{title}</h2>
        </div>
      </div>

      {bookings.length > 0 ? (
        <div className={styles.cardGrid}>
          {bookings.map((booking) => (
            <PaymentCard key={booking.id} booking={booking} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>{emptyMessage}</p>
        </div>
      )}
    </section>
  )
}

export function CustomerDashboardTabs({
  dashboard,
}: {
  dashboard: PortalDashboardViewModel
}) {
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  const pendingPaymentLink = useMemo(
    () => dashboard.overview.pendingPaymentBooking?.whatsappPaymentUrl ?? null,
    [dashboard.overview.pendingPaymentBooking]
  )

  return (
    <div className={styles.tabbedShell}>
      <div className={styles.tabsBar} role="tablist" aria-label="Customer dashboard sections">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            className={styles.tabButton}
            data-active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' ? (
        <section id="panel-overview" role="tabpanel" aria-labelledby="overview" className={styles.tabPanel}>
          <div className={styles.overviewGrid}>
            <article className={styles.featureCard}>
              <p className={styles.eyebrow}>Next Confirmed Booking</p>
              <h2 className={styles.sectionTitle}>
                {dashboard.overview.nextConfirmedBooking
                  ? dashboard.overview.nextConfirmedBooking.service
                  : 'No confirmed booking yet'}
              </h2>
              <p className={styles.cardText}>
                {dashboard.overview.nextConfirmedBooking
                  ? `${dashboard.overview.nextConfirmedBooking.startsAtLabel} with ${dashboard.overview.nextConfirmedBooking.barberName}.`
                  : 'Your next confirmed appointment will appear here once payment has been approved.'}
              </p>
            </article>

            <article className={styles.featureCard}>
              <p className={styles.eyebrow}>Pending Payment</p>
              <h2 className={styles.sectionTitle}>
                {dashboard.overview.pendingPaymentBooking
                  ? dashboard.overview.pendingPaymentBooking.reference
                  : 'No payment holds'}
              </h2>
              <p className={styles.cardText}>
                {dashboard.overview.pendingPaymentBooking
                  ? 'Your booking is reserved while payment is being verified.'
                  : 'You have no payment verification tasks waiting right now.'}
              </p>
            </article>

            <article className={styles.featureCard}>
              <p className={styles.eyebrow}>Loyalty Progress</p>
              <h2 className={styles.sectionTitle}>{dashboard.quickStats.loyaltyProgressLabel}</h2>
              <p className={styles.cardText}>{dashboard.loyalty.progressLabel}</p>
            </article>
          </div>

          <div className={styles.panel}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.eyebrow}>Quick Actions</p>
                <h2 className={styles.sectionTitle}>Move faster from here</h2>
              </div>
            </div>

            <div className={styles.actionGrid}>
              <Link href="/services" className={styles.primaryLink}>
                Book New Cut
              </Link>
              {pendingPaymentLink ? (
                <Link href={pendingPaymentLink} className={styles.inlineLink}>
                  Open WhatsApp Payment
                </Link>
              ) : null}
              <Link href="/services" className={styles.inlineLink}>
                View Services
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === 'bookings' ? (
        <section id="panel-bookings" role="tabpanel" aria-labelledby="bookings" className={styles.tabPanel}>
          <BookingGroup
            title="Pending Payment"
            description="Bookings waiting for payment proof"
            bookings={dashboard.bookings.pendingPayment}
            emptyMessage="No payment holds right now."
          />
          <BookingGroup
            title="Confirmed / Upcoming"
            description="Your confirmed upcoming cuts"
            bookings={dashboard.bookings.confirmedUpcoming}
            emptyMessage="No confirmed upcoming bookings yet."
          />
          <BookingGroup
            title="Completed"
            description="Cuts you have already completed"
            bookings={dashboard.bookings.completed}
            emptyMessage="Completed bookings will appear here."
          />
          <BookingGroup
            title="Cancelled / Expired"
            description="Bookings that need a fresh rebooking"
            bookings={dashboard.bookings.cancelledOrExpired}
            emptyMessage="No cancelled or expired bookings."
          />
        </section>
      ) : null}

      {activeTab === 'payments' ? (
        <section id="panel-payments" role="tabpanel" aria-labelledby="payments" className={styles.tabPanel}>
          <PaymentGroup
            title="Pending payment verification"
            bookings={dashboard.payments.pending}
            emptyMessage="No payments are waiting for verification."
          />
          <PaymentGroup
            title="Paid and confirmed"
            bookings={dashboard.payments.paid}
            emptyMessage="Paid bookings will appear here once confirmed."
          />
          <PaymentGroup
            title="Failed or expired"
            bookings={dashboard.payments.failed}
            emptyMessage="No failed or expired payments."
          />
        </section>
      ) : null}

      {activeTab === 'tasks' ? (
        <section id="panel-tasks" role="tabpanel" aria-labelledby="tasks" className={styles.tabPanel}>
          <div className={styles.cardGrid}>
            {dashboard.tasks.map((task) => (
              <CustomerTaskCard key={task.id} task={task} />
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === 'history' ? (
        <section id="panel-history" role="tabpanel" aria-labelledby="history" className={styles.tabPanel}>
          {dashboard.history.length > 0 ? (
            <div className={styles.cardGrid}>
              {dashboard.history.map((booking) => (
                <article key={booking.id} className={styles.historyCard}>
                  <div>
                    <p className={styles.bookingReference}>{booking.reference}</p>
                    <h3 className={styles.cardTitle}>{booking.service}</h3>
                    <p className={styles.cardMeta}>With {booking.barberName}</p>
                  </div>
                  <div className={styles.historyMeta}>
                    <span>{booking.startsAtLabel}</span>
                    <strong>{booking.amountDueLabel}</strong>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <h3 className={styles.cardTitle}>Your premium history starts with the next cut</h3>
              <p className={styles.cardText}>
                Completed visits will appear here once your appointment history begins.
              </p>
              <Link href="/services" className={styles.primaryLink}>
                Book New Cut
              </Link>
            </div>
          )}
        </section>
      ) : null}

      {activeTab === 'profile' ? (
        <section id="panel-profile" role="tabpanel" aria-labelledby="profile" className={styles.tabPanel}>
          <ProfileSummaryCard profile={dashboard.profile} />
        </section>
      ) : null}
    </div>
  )
}
