'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type {
  AdminBarberRow,
  AdminBookingRow,
  AdminDashboardViewModel,
  AdminUserRow,
} from '@/lib/admin-dashboard/types'
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard'
import { DashboardTabs } from '@/components/dashboard/DashboardTabs'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import styles from '@/app/admin/dashboard/dashboard.module.css'
import { AdminBookingActions } from './AdminBookingActions'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'pending-payments', label: 'Pending Payments' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'customers', label: 'Customers' },
  { id: 'barbers', label: 'Barbers' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'system-health', label: 'System Health' },
] as const

type TabId = (typeof TABS)[number]['id']

type AdminCurrentQuery = {
  booking_q: string
  booking_status: string
  booking_sort: string
  booking_direction: string
  booking_page: string
  user_q: string
  user_page: string
  barber_q: string
  barber_page: string
  tab: string
}

function formatLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}

function BookingCard({
  booking,
  showActions = false,
}: {
  booking: AdminBookingRow
  showActions?: boolean
}) {
  return (
    <article className={styles.recordCard}>
      <div className={styles.recordTop}>
        <div>
          <p className={styles.referenceText}>{booking.paymentReference}</p>
          <h3 className={styles.cardTitle}>{booking.customerName}</h3>
          <p className={styles.cardMeta}>{booking.customerEmail}</p>
          <p className={styles.cardSubmeta}>{booking.customerPhone}</p>
        </div>

        <div className={styles.badgeCluster}>
          <StatusBadge value={booking.status} />
          <StatusBadge value={booking.paymentStatus} />
        </div>
      </div>

      <div className={styles.metaGrid}>
        <div>
          <span className={styles.metaLabel}>Service</span>
          <strong className={styles.metaValue}>{booking.serviceName}</strong>
        </div>
        <div>
          <span className={styles.metaLabel}>Barber</span>
          <strong className={styles.metaValue}>{booking.barberName}</strong>
        </div>
        <div>
          <span className={styles.metaLabel}>Appointment</span>
          <strong className={styles.metaValue}>{booking.startsAtLabel}</strong>
        </div>
        <div>
          <span className={styles.metaLabel}>Amount Due</span>
          <strong className={styles.metaValue}>{booking.amountDueLabel}</strong>
        </div>
        <div>
          <span className={styles.metaLabel}>Created</span>
          <strong className={styles.metaValue}>{booking.createdAtLabel}</strong>
        </div>
        <div>
          <span className={styles.metaLabel}>Pending Expiry</span>
          <strong className={styles.metaValue}>{booking.pendingExpiresAtLabel}</strong>
        </div>
      </div>

      {showActions ? <AdminBookingActions bookingId={booking.id} status={booking.status} /> : null}
    </article>
  )
}

function UserCard({ user }: { user: AdminUserRow }) {
  return (
    <article className={styles.recordCard}>
      <div className={styles.personTop}>
        <img src={user.profileImageUrl} alt={user.fullName} className={styles.avatarImage} />
        <div>
          <h3 className={styles.cardTitle}>{user.fullName}</h3>
          <p className={styles.cardMeta}>{user.email}</p>
          <p className={styles.cardSubmeta}>{user.phoneNumber}</p>
        </div>
      </div>

      <div className={styles.metaGrid}>
        <div>
          <span className={styles.metaLabel}>Role</span>
          <strong className={styles.metaValue}>{user.role}</strong>
        </div>
        <div>
          <span className={styles.metaLabel}>Status</span>
          <StatusBadge value={user.accountStatus} />
        </div>
        <div>
          <span className={styles.metaLabel}>Profile</span>
          <strong className={styles.metaValue}>
            {user.profileComplete ? 'Complete' : 'Needs details'}
          </strong>
        </div>
        <div>
          <span className={styles.metaLabel}>Created</span>
          <strong className={styles.metaValue}>{user.createdAtLabel}</strong>
        </div>
      </div>
    </article>
  )
}

function BarberCard({ barber }: { barber: AdminBarberRow }) {
  return (
    <article className={styles.recordCard}>
      <div className={styles.personTop}>
        <img
          src={barber.profileImageUrl}
          alt={barber.displayName}
          className={styles.avatarImage}
        />
        <div>
          <h3 className={styles.cardTitle}>{barber.displayName}</h3>
          <p className={styles.cardMeta}>{barber.specialty}</p>
        </div>
      </div>

      <div className={styles.metaGrid}>
        <div>
          <span className={styles.metaLabel}>Active Status</span>
          <StatusBadge value={barber.activeStatus} />
        </div>
        <div>
          <span className={styles.metaLabel}>Total Bookings</span>
          <strong className={styles.metaValue}>{barber.totalBookings}</strong>
        </div>
        <div>
          <span className={styles.metaLabel}>Upcoming</span>
          <strong className={styles.metaValue}>{barber.upcomingBookings}</strong>
        </div>
        <div>
          <span className={styles.metaLabel}>Completed</span>
          <strong className={styles.metaValue}>{barber.completedBookings}</strong>
        </div>
      </div>
    </article>
  )
}

function buildQuery(
  current: AdminCurrentQuery,
  updates: Partial<AdminCurrentQuery>
) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries({ ...current, ...updates })) {
    if (value) {
      params.set(key, value)
    }
  }

  const query = params.toString()
  return query ? `?${query}` : ''
}

export function AdminDashboardTabs({
  dashboard,
  current,
  initialTab,
}: {
  dashboard: AdminDashboardViewModel
  current: AdminCurrentQuery
  initialTab: TabId
}) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab)
  const pendingQueue = useMemo(
    () =>
      dashboard.pendingPayments.items.length > 0
        ? dashboard.pendingPayments.items
        : dashboard.bookings.items.filter((booking) => booking.status === 'pending_payment'),
    [dashboard.bookings.items, dashboard.pendingPayments.items]
  )

  return (
    <div className={styles.tabbedShell}>
      <DashboardTabs
        tabs={TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
        label="Admin dashboard sections"
      />

      {activeTab === 'overview' ? (
        <section className={styles.tabPanel}>
          <div className={styles.statsGrid}>
            <DashboardStatCard
              label="Total Bookings"
              value={dashboard.overview.totalBookings}
              detail="Every booking currently recorded in the platform."
              tone="gold"
            />
            <DashboardStatCard
              label="Pending Payments"
              value={dashboard.overview.pendingPayments}
              detail="Bookings waiting for WhatsApp proof and admin verification."
              tone="rose"
            />
            <DashboardStatCard
              label="Confirmed"
              value={dashboard.overview.confirmedBookings}
              detail="Bookings ready for barber operations."
              tone="emerald"
            />
            <DashboardStatCard
              label="Completed"
              value={dashboard.overview.completedBookings}
              detail="Appointments already delivered by the team."
              tone="blue"
            />
          </div>

          <div className={styles.twoColumnGrid}>
            <article className={styles.panelCard}>
              <p className={styles.eyebrow}>Pending Payment Queue</p>
              <h2 className={styles.sectionTitle}>What needs action first</h2>
              <p className={styles.cardText}>
                {dashboard.pendingPayments.countLabel}. Use this queue to confirm paid bookings
                before they reach the barber workflow.
              </p>
              <div className={styles.stackList}>
                {pendingQueue.slice(0, 3).map((booking) => (
                  <BookingCard key={booking.id} booking={booking} showActions />
                ))}
              </div>
            </article>

            <article className={styles.panelCard}>
              <p className={styles.eyebrow}>Operations Snapshot</p>
              <h2 className={styles.sectionTitle}>Live platform pulse</h2>
              <div className={styles.statsGridCompact}>
                {dashboard.metrics.slice(0, 4).map((metric) => (
                  <DashboardStatCard
                    key={metric.id}
                    label={metric.label}
                    value={metric.value}
                    detail={metric.detail}
                    tone={metric.tone}
                  />
                ))}
              </div>
            </article>
          </div>
        </section>
      ) : null}

      {activeTab === 'pending-payments' ? (
        <section className={styles.tabPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Pending Payments</p>
              <h2 className={styles.sectionTitle}>Bookings waiting for verification</h2>
            </div>
          </div>

          {pendingQueue.length > 0 ? (
            <div className={styles.cardGrid}>
              {pendingQueue.map((booking) => (
                <BookingCard key={booking.id} booking={booking} showActions />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No pending payments"
              description="The payment queue is clear right now. New WhatsApp payment holds will appear here."
            />
          )}
        </section>
      ) : null}

      {activeTab === 'bookings' ? (
        <section className={styles.tabPanel}>
          <article className={styles.panelCard}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.eyebrow}>Bookings</p>
                <h2 className={styles.sectionTitle}>Filter bookings by status and search</h2>
              </div>
            </div>

            <form method="get" className={styles.filtersGrid}>
              <input type="hidden" name="tab" value="bookings" />
              <input
                type="text"
                name="booking_q"
                defaultValue={dashboard.bookings.filters.query}
                placeholder="Search customer, phone, barber or service"
                className={styles.input}
              />
              <select
                name="booking_status"
                defaultValue={dashboard.bookings.filters.status}
                className={styles.input}
              >
                <option value="">All statuses</option>
                <option value="pending_payment">Pending payment</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>
              <select
                name="booking_sort"
                defaultValue={dashboard.bookings.filters.sort}
                className={styles.input}
              >
                <option value="starts_at">Appointment date</option>
                <option value="created_at">Created date</option>
                <option value="status">Status</option>
              </select>
              <select
                name="booking_direction"
                defaultValue={dashboard.bookings.filters.direction}
                className={styles.input}
              >
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
              <button type="submit" className={styles.secondaryButton}>
                Apply Filters
              </button>
            </form>

            {dashboard.bookings.errorMessage ? (
              <EmptyState
                title="Bookings unavailable"
                description={dashboard.bookings.errorMessage}
              />
            ) : dashboard.bookings.items.length > 0 ? (
              <div className={styles.cardGrid}>
                {dashboard.bookings.items.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    showActions={booking.status === 'pending_payment'}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No bookings found"
                description="No live bookings matched the current filters."
              />
            )}

            <div className={styles.paginationRow}>
              <span className={styles.cardSubmeta}>
                {dashboard.bookings.totalCount} booking
                {dashboard.bookings.totalCount === 1 ? '' : 's'} found
              </span>

              <div className={styles.inlineActions}>
                {dashboard.bookings.filters.page > 1 ? (
                  <Link
                    href={buildQuery(current, {
                      booking_page: String(dashboard.bookings.filters.page - 1),
                      tab: 'bookings',
                    })}
                    className={styles.secondaryButton}
                  >
                    Previous
                  </Link>
                ) : null}
                {dashboard.bookings.filters.page < dashboard.bookings.totalPages ? (
                  <Link
                    href={buildQuery(current, {
                      booking_page: String(dashboard.bookings.filters.page + 1),
                      tab: 'bookings',
                    })}
                    className={styles.secondaryButton}
                  >
                    Next
                  </Link>
                ) : null}
              </div>
            </div>
          </article>
        </section>
      ) : null}

      {activeTab === 'customers' ? (
        <section className={styles.tabPanel}>
          <article className={styles.panelCard}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.eyebrow}>Customers</p>
                <h2 className={styles.sectionTitle}>Customer directory</h2>
              </div>
            </div>

            <form method="get" className={styles.filtersGridCompact}>
              <input type="hidden" name="tab" value="customers" />
              <input
                type="text"
                name="user_q"
                defaultValue={dashboard.users.filters.query}
                placeholder="Search by email"
                className={styles.input}
              />
              <button type="submit" className={styles.secondaryButton}>
                Search Users
              </button>
            </form>

            {!dashboard.users.enabled || dashboard.users.errorMessage ? (
              <EmptyState
                title="Customer directory unavailable"
                description={dashboard.users.errorMessage ?? 'User management is not enabled.'}
              />
            ) : dashboard.users.items.length > 0 ? (
              <div className={styles.cardGrid}>
                {dashboard.users.items.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No customers found"
                description="No registered users matched the current search."
              />
            )}

            <div className={styles.paginationRow}>
              <span className={styles.cardSubmeta}>
                {dashboard.users.totalCount} user
                {dashboard.users.totalCount === 1 ? '' : 's'}
              </span>

              <div className={styles.inlineActions}>
                {dashboard.users.filters.page > 1 ? (
                  <Link
                    href={buildQuery(current, {
                      user_page: String(dashboard.users.filters.page - 1),
                      tab: 'customers',
                    })}
                    className={styles.secondaryButton}
                  >
                    Previous
                  </Link>
                ) : null}
                {dashboard.users.filters.page < dashboard.users.totalPages ? (
                  <Link
                    href={buildQuery(current, {
                      user_page: String(dashboard.users.filters.page + 1),
                      tab: 'customers',
                    })}
                    className={styles.secondaryButton}
                  >
                    Next
                  </Link>
                ) : null}
              </div>
            </div>
          </article>
        </section>
      ) : null}

      {activeTab === 'barbers' ? (
        <section className={styles.tabPanel}>
          <article className={styles.panelCard}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.eyebrow}>Barbers</p>
                <h2 className={styles.sectionTitle}>Barber directory and workload</h2>
              </div>
            </div>

            <form method="get" className={styles.filtersGridCompact}>
              <input type="hidden" name="tab" value="barbers" />
              <input
                type="text"
                name="barber_q"
                defaultValue={dashboard.barbers.filters.query}
                placeholder="Search barber name or specialty"
                className={styles.input}
              />
              <button type="submit" className={styles.secondaryButton}>
                Search Barbers
              </button>
            </form>

            {!dashboard.barbers.enabled || dashboard.barbers.errorMessage ? (
              <EmptyState
                title="Barber directory unavailable"
                description={
                  dashboard.barbers.errorMessage ?? 'Barber profiles are not enabled yet.'
                }
              />
            ) : dashboard.barbers.items.length > 0 ? (
              <div className={styles.cardGrid}>
                {dashboard.barbers.items.map((barber) => (
                  <BarberCard key={barber.id} barber={barber} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No barbers found"
                description="No barber records matched the current search."
              />
            )}

            <div className={styles.paginationRow}>
              <span className={styles.cardSubmeta}>
                {dashboard.barbers.totalCount} barber
                {dashboard.barbers.totalCount === 1 ? '' : 's'}
              </span>

              <div className={styles.inlineActions}>
                {dashboard.barbers.filters.page > 1 ? (
                  <Link
                    href={buildQuery(current, {
                      barber_page: String(dashboard.barbers.filters.page - 1),
                      tab: 'barbers',
                    })}
                    className={styles.secondaryButton}
                  >
                    Previous
                  </Link>
                ) : null}
                {dashboard.barbers.filters.page < dashboard.barbers.totalPages ? (
                  <Link
                    href={buildQuery(current, {
                      barber_page: String(dashboard.barbers.filters.page + 1),
                      tab: 'barbers',
                    })}
                    className={styles.secondaryButton}
                  >
                    Next
                  </Link>
                ) : null}
              </div>
            </div>
          </article>
        </section>
      ) : null}

      {activeTab === 'revenue' ? (
        <section className={styles.tabPanel}>
          <div className={styles.statsGrid}>
            <DashboardStatCard
              label="Weekly Revenue"
              value={dashboard.revenue.weeklyRevenue}
              detail="Revenue tracked over the last seven days."
              tone="gold"
            />
            <DashboardStatCard
              label="Total Revenue"
              value={dashboard.revenue.totalRevenue}
              detail="All paid revenue recognized by the current backend."
              tone="emerald"
            />
            <DashboardStatCard
              label="Average Order"
              value={dashboard.revenue.averageOrderValue}
              detail="Average booking value across available payment data."
              tone="blue"
            />
            <DashboardStatCard
              label="Transactions"
              value={String(dashboard.revenue.transactionCount)}
              detail="Transactions or paid bookings available for reporting."
              tone="rose"
            />
          </div>

          {!dashboard.revenue.enabled ? (
            <EmptyState
              title="Revenue tracking unavailable"
              description={dashboard.revenue.errorMessage ?? 'Revenue data is not available yet.'}
            />
          ) : null}
        </section>
      ) : null}

      {activeTab === 'system-health' ? (
        <section className={styles.tabPanel}>
          <article className={styles.panelCard}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.eyebrow}>System Health</p>
                <h2 className={styles.sectionTitle}>Feature and table readiness</h2>
              </div>
            </div>

            <div className={styles.cardGrid}>
              {dashboard.featureStatuses.map((feature) => (
                <article key={feature.id} className={styles.recordCard}>
                  <div className={styles.recordTop}>
                    <div>
                      <h3 className={styles.cardTitle}>{feature.label}</h3>
                      <p className={styles.cardText}>{feature.detail}</p>
                    </div>
                    <StatusBadge value={feature.status} />
                  </div>
                </article>
              ))}
            </div>

            <div className={styles.metricsList}>
              {dashboard.metrics.map((metric) => (
                <article key={metric.id} className={styles.metricStrip}>
                  <div>
                    <h3 className={styles.cardTitle}>{metric.label}</h3>
                    <p className={styles.cardSubmeta}>{metric.detail}</p>
                  </div>
                  <strong className={styles.metricValue}>{metric.value}</strong>
                </article>
              ))}
            </div>
          </article>
        </section>
      ) : null}
    </div>
  )
}
