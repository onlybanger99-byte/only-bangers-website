'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { BarberDashboardBooking, BarberDashboardViewModel } from '@/lib/barber-dashboard/types'
import { DashboardTabs } from '@/components/dashboard/DashboardTabs'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { AvailabilitySlotManager } from './AvailabilitySlotManager'
import { BarberProfileEditor } from './BarberProfileEditor'
import { BarberServicePricesManager } from './BarberServicePricesManager'
import { getSafeImage } from '@/lib/safe-image'
import styles from '@/app/barber/dashboard/dashboard.module.css'

const TABS = [
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'services', label: 'Services & Prices' },
  { id: 'profile', label: 'Profile' },
] as const

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
    <div className={styles.cardGrid}>
      {bookings.map((booking) => (
        <article key={booking.id} className={styles.recordCard}>
          <div className={styles.recordTop}>
            <div>
              <p className={styles.referenceText}>{booking.bookingTimeLabel}</p>
              <h3 className={styles.cardTitle}>{booking.customerName}</h3>
              <p className={styles.cardMeta}>{booking.serviceName}</p>
            </div>

            <div className={styles.badgeCluster}>
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
              <span className={styles.metaLabel}>Customer Phone</span>
              <strong className={styles.metaValue}>{booking.customerPhone}</strong>
            </div>
            <div>
              <span className={styles.metaLabel}>Amount</span>
              <strong className={styles.metaValue}>{booking.amountDueLabel}</strong>
            </div>
            <div>
              <span className={styles.metaLabel}>Notes</span>
              <strong className={styles.metaValue}>{booking.notes}</strong>
            </div>
          </div>

          {booking.messageCustomerHref ? (
            <div className={styles.inlineActions}>
              <Link href={booking.messageCustomerHref} className={styles.primaryButton}>
                Message Customer
              </Link>
            </div>
          ) : null}
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
  if (!dashboard?.operator) {
    return null
  }

  const [activeTab, setActiveTab] = useState<TabId>('today')

  const nextUpcomingLabel = useMemo(() => {
    return dashboard.upcoming[0]?.startsAtLabel ?? 'No confirmed booking after today'
  }, [dashboard.upcoming])

  return (
    <>
      <article className={styles.heroCard}>
        <div className={styles.heroCopy}>
          <div>
            <p className={styles.eyebrow}>Today&apos;s Schedule</p>
            <h2 className={styles.heroTitle}>
              {dashboard.today.length > 0
                ? `${dashboard.today.length} confirmed booking${dashboard.today.length === 1 ? '' : 's'} today`
                : 'No confirmed bookings today'}
            </h2>
            <p className={styles.heroText}>
              {dashboard.today.length > 0
                ? 'Work from the list below and message clients directly when you need to confirm details.'
                : 'New confirmed bookings will appear here as soon as admin payment confirmation is complete.'}
            </p>
          </div>
        </div>

        <div className={styles.heroMeta}>
          <div className={styles.panelCard}>
            <span className={styles.metaLabel}>Next upcoming</span>
            <strong className={styles.metaValue}>{nextUpcomingLabel}</strong>
            <p className={styles.cardSubmeta}>{dashboard.readinessMessage}</p>
          </div>
        </div>
      </article>

      {dashboard.awaitingPayment.length > 0 ? (
        <article className={styles.panelCard}>
          <p className={styles.eyebrow}>Waiting For Payment Confirmation</p>
          <h2 className={styles.sectionTitle}>
            {dashboard.awaitingPayment.length} booking
            {dashboard.awaitingPayment.length === 1 ? '' : 's'} still pending admin confirmation
          </h2>
          <p className={styles.cardText}>
            These bookings are assigned to you, but they should only move into your working schedule once admin confirms payment.
          </p>
        </article>
      ) : null}

      <div className={styles.tabbedShell}>
        <DashboardTabs
          tabs={TABS}
          activeTab={activeTab}
          onChange={setActiveTab}
          label="Barber dashboard sections"
        />

        {activeTab === 'today' ? (
          <section className={styles.tabPanel}>
            <BookingTimeline
              bookings={dashboard.today}
              emptyTitle="No confirmed work today"
              emptyDescription="Confirmed bookings for today will appear here once they are ready for the chair."
            />
          </section>
        ) : null}

        {activeTab === 'upcoming' ? (
          <section className={styles.tabPanel}>
            <BookingTimeline
              bookings={dashboard.upcoming}
              emptyTitle="No upcoming confirmed bookings"
              emptyDescription="Future confirmed bookings assigned to you will appear here."
            />
          </section>
        ) : null}

        {activeTab === 'profile' ? (
          <section className={styles.tabPanel}>
            <article className={styles.recordCard}>
              <div className={styles.personTop}>
                <Image
                  src={getSafeImage(dashboard.operator.image)}
                  alt={dashboard.operator.displayName}
                  width={72}
                  height={72}
                  className={styles.heroAvatar}
                />
                <div>
                  <h3 className={styles.cardTitle}>{dashboard.operator.displayName}</h3>
                  <p className={styles.cardMeta}>{dashboard.operator.specialty}</p>
                  <div className={styles.badgeCluster}>
                    <StatusBadge value={dashboard.operator.activeStatus} />
                  </div>
                </div>
              </div>

              <p className={styles.cardText}>{dashboard.operator.bio}</p>

              <div className={styles.metaGrid}>
                <div>
                  <span className={styles.metaLabel}>Location</span>
                  <strong className={styles.metaValue}>
                    {dashboard.operator.cuttingLocation ?? 'Location not set'}
                  </strong>
                </div>
                <div>
                  <span className={styles.metaLabel}>Availability</span>
                  <strong className={styles.metaValue}>
                    Barbers manage their own schedules
                  </strong>
                </div>
                <div>
                  <span className={styles.metaLabel}>Booking Flow</span>
                  <strong className={styles.metaValue}>
                    Customers only see the slots you publish
                  </strong>
                </div>
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

              <BarberProfileEditor profile={dashboard.operator} />

              <div className={styles.formStack}>
                <div>
                  <p className={styles.eyebrow}>Availability</p>
                  <h3 className={styles.cardTitle}>Manage date-based availability slots</h3>
                  <p className={styles.cardText}>
                    Add the exact dates and times you want customers to book. Availability depends on each barber.
                  </p>
                </div>
                <AvailabilitySlotManager />
              </div>
            </article>
          </section>
        ) : null}

        {activeTab === 'services' ? (
          <section className={styles.tabPanel}>
            <article className={styles.recordCard}>
              <div>
                <p className={styles.eyebrow}>Services & Prices</p>
                <h3 className={styles.cardTitle}>Manage your bookable services</h3>
                <p className={styles.cardText}>
                  Customers only see the services and prices you publish here.
                </p>
              </div>

              <BarberServicePricesManager initialPrices={dashboard.servicePrices} />
            </article>
          </section>
        ) : null}
      </div>
    </>
  )
}
