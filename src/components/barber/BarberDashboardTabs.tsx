'use client'

import { useState } from 'react'
import Image from 'next/image'
import type {
  BarberDashboardBooking,
  BarberDashboardCustomer,
  BarberDashboardViewModel,
} from '@/lib/barber-dashboard/types'
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard'
import { DashboardTabs } from '@/components/dashboard/DashboardTabs'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import styles from '@/app/barber/dashboard/dashboard.module.css'

const TABS = [
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'awaiting-payment', label: 'Awaiting Payment' },
  { id: 'completed', label: 'Completed' },
  { id: 'customers', label: 'Customers' },
  { id: 'performance', label: 'Performance' },
] as const

type TabId = (typeof TABS)[number]['id']

function BookingCard({
  booking,
  emphasis,
}: {
  booking: BarberDashboardBooking
  emphasis: 'confirmed' | 'pending' | 'completed'
}) {
  return (
    <article className={styles.recordCard} data-emphasis={emphasis}>
      <div className={styles.recordTop}>
        <div>
          <p className={styles.referenceText}>{booking.reference}</p>
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
          <span className={styles.metaLabel}>Date</span>
          <strong className={styles.metaValue}>{booking.bookingDateLabel}</strong>
        </div>
        <div>
          <span className={styles.metaLabel}>Time</span>
          <strong className={styles.metaValue}>{booking.bookingTimeLabel}</strong>
        </div>
        <div>
          <span className={styles.metaLabel}>Amount</span>
          <strong className={styles.metaValue}>{booking.amountDueLabel}</strong>
        </div>
        <div>
          <span className={styles.metaLabel}>Customer Phone</span>
          <strong className={styles.metaValue}>{booking.customerPhone}</strong>
        </div>
        <div>
          <span className={styles.metaLabel}>Booking Window</span>
          <strong className={styles.metaValue}>
            {booking.status === 'pending_payment'
              ? booking.pendingExpiresAtLabel
              : booking.startsAtLabel}
          </strong>
        </div>
        <div>
          <span className={styles.metaLabel}>Notes</span>
          <strong className={styles.metaValue}>{booking.notes}</strong>
        </div>
      </div>
    </article>
  )
}

function CustomerCard({ customer }: { customer: BarberDashboardCustomer }) {
  return (
    <article className={styles.recordCard}>
      <div className={styles.personTop}>
        <Image
          src={customer.profileImageUrl}
          alt={customer.fullName}
          width={56}
          height={56}
          className={styles.avatarImage}
        />
        <div>
          <h3 className={styles.cardTitle}>{customer.fullName}</h3>
          <p className={styles.cardMeta}>{customer.phoneNumber}</p>
          <p className={styles.cardSubmeta}>{customer.email}</p>
        </div>
      </div>

      <div className={styles.metaGrid}>
        <div>
          <span className={styles.metaLabel}>Visit History</span>
          <strong className={styles.metaValue}>{customer.visitCountLabel}</strong>
        </div>
        <div>
          <span className={styles.metaLabel}>Upcoming</span>
          <strong className={styles.metaValue}>{customer.upcomingBookingLabel}</strong>
        </div>
        <div>
          <span className={styles.metaLabel}>Preferred Service</span>
          <strong className={styles.metaValue}>{customer.preferredService}</strong>
        </div>
      </div>
    </article>
  )
}

export function BarberDashboardTabs({
  dashboard,
}: {
  dashboard: BarberDashboardViewModel
}) {
  const [activeTab, setActiveTab] = useState<TabId>('today')

  return (
    <div className={styles.tabbedShell}>
      <DashboardTabs
        tabs={TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
        label="Barber dashboard sections"
      />

      {activeTab === 'today' ? (
        <section className={styles.tabPanel}>
          <div className={styles.statsGrid}>
            <DashboardStatCard
              label="Confirmed Today"
              value={dashboard.performance.todayConfirmedCount}
              detail="Confirmed jobs ready for the chair today."
              tone="gold"
            />
            <DashboardStatCard
              label="Awaiting Payment"
              value={dashboard.performance.awaitingPaymentCount}
              detail="Payment holds still waiting for admin confirmation."
              tone="rose"
            />
          </div>

          {dashboard.today.length > 0 ? (
            <div className={styles.cardGrid}>
              {dashboard.today.map((booking) => (
                <BookingCard key={booking.id} booking={booking} emphasis="confirmed" />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No confirmed work today"
              description="Confirmed bookings for today will appear here once they are ready for the chair."
            />
          )}
        </section>
      ) : null}

      {activeTab === 'upcoming' ? (
        <section className={styles.tabPanel}>
          {dashboard.upcoming.length > 0 ? (
            <div className={styles.cardGrid}>
              {dashboard.upcoming.map((booking) => (
                <BookingCard key={booking.id} booking={booking} emphasis="confirmed" />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No upcoming confirmed bookings"
              description="Future confirmed bookings assigned to this barber will appear here."
            />
          )}
        </section>
      ) : null}

      {activeTab === 'awaiting-payment' ? (
        <section className={styles.tabPanel}>
          {dashboard.awaitingPayment.length > 0 ? (
            <div className={styles.cardGrid}>
              {dashboard.awaitingPayment.map((booking) => (
                <BookingCard key={booking.id} booking={booking} emphasis="pending" />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No payment holds"
              description="Pending-payment bookings stay here until the admin team confirms payment."
            />
          )}
        </section>
      ) : null}

      {activeTab === 'completed' ? (
        <section className={styles.tabPanel}>
          {dashboard.completed.length > 0 ? (
            <div className={styles.cardGrid}>
              {dashboard.completed.map((booking) => (
                <BookingCard key={booking.id} booking={booking} emphasis="completed" />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No completed jobs yet"
              description="Completed bookings will appear here once service has been delivered."
            />
          )}
        </section>
      ) : null}

      {activeTab === 'customers' ? (
        <section className={styles.tabPanel}>
          {dashboard.customers.length > 0 ? (
            <div className={styles.cardGrid}>
              {dashboard.customers.map((customer) => (
                <CustomerCard key={customer.id} customer={customer} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No customer data yet"
              description="Customer details will surface here once bookings are connected to the barber workflow."
            />
          )}
        </section>
      ) : null}

      {activeTab === 'performance' ? (
        <section className={styles.tabPanel}>
          <div className={styles.statsGrid}>
            <DashboardStatCard
              label="Cuts Completed Today"
              value={dashboard.performance.cutsCompletedToday}
              detail="Completed appointments delivered today."
              tone="emerald"
            />
            <DashboardStatCard
              label="Repeat Clients"
              value={dashboard.performance.repeatClientsCount}
              detail="Returning customers visible in the current booking set."
              tone="blue"
            />
          </div>

          <article className={styles.panelCard}>
            <p className={styles.eyebrow}>Workflow State</p>
            <h2 className={styles.sectionTitle}>How this shift is connected</h2>
            <p className={styles.cardText}>{dashboard.readinessMessage}</p>
          </article>
        </section>
      ) : null}
    </div>
  )
}
