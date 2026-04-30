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
  { id: 'bookings', label: 'Bookings' },
  { id: 'payments', label: 'Payments' },
  { id: 'users', label: 'Users' },
  { id: 'barbers', label: 'Barbers' },
] as const

const USER_GROUPS = [
  { id: 'customers', label: 'Customers' },
  { id: 'barbers', label: 'Barbers' },
  { id: 'admins', label: 'Admins' },
] as const

type TabId = (typeof TABS)[number]['id']
type UserGroupId = (typeof USER_GROUPS)[number]['id']

type AdminCurrentQuery = {
  booking_q: string
  booking_status: string
  booking_sort: string
  booking_direction: string
  booking_page: string
  tab: string
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
          <span className={styles.metaLabel}>Payment</span>
          <strong className={styles.metaValue}>{booking.amountDueLabel}</strong>
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
          <span className={styles.metaLabel}>Account</span>
          <StatusBadge value={user.accountStatus} />
        </div>
        <div>
          <span className={styles.metaLabel}>Profile</span>
          <strong className={styles.metaValue}>
            {user.profileComplete ? 'Complete' : 'Needs attention'}
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
        <img src={barber.profileImageUrl} alt={barber.displayName} className={styles.avatarImage} />
        <div>
          <h3 className={styles.cardTitle}>{barber.displayName}</h3>
          <p className={styles.cardMeta}>{barber.specialty}</p>
        </div>
      </div>

      <div className={styles.metaGrid}>
        <div>
          <span className={styles.metaLabel}>Status</span>
          <StatusBadge value={barber.activeStatus} />
        </div>
        <div>
          <span className={styles.metaLabel}>Upcoming</span>
          <strong className={styles.metaValue}>{barber.upcomingBookings}</strong>
        </div>
        <div>
          <span className={styles.metaLabel}>Total Bookings</span>
          <strong className={styles.metaValue}>{barber.totalBookings}</strong>
        </div>
        <div>
          <span className={styles.metaLabel}>Profile</span>
          <strong className={styles.metaValue}>
            {barber.profileComplete ? 'Ready' : 'Missing details'}
          </strong>
        </div>
      </div>

      {!barber.profileComplete ? (
        <p className={styles.cardSubmeta}>
          This barber still needs a complete profile before the directory is fully operational.
        </p>
      ) : null}
    </article>
  )
}

function buildQuery(current: AdminCurrentQuery, updates: Partial<AdminCurrentQuery>) {
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
  const [activeUserGroup, setActiveUserGroup] = useState<UserGroupId>('customers')

  const paymentsQueue = useMemo(
    () =>
      dashboard.attention.pendingPayments.filter(
        (booking) => booking.status === 'pending_payment' || booking.paymentStatus === 'unpaid'
      ),
    [dashboard.attention.pendingPayments]
  )

  const usersByGroup = {
    customers: dashboard.users.customers,
    barbers: dashboard.users.barbers,
    admins: dashboard.users.admins,
  } satisfies Record<UserGroupId, AdminUserRow[]>

  return (
    <>
      <section className={styles.tabPanel}>
        <article className={styles.panelCard}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Needs Attention</p>
              <h2 className={styles.sectionTitle}>What needs action first</h2>
            </div>
            <button type="button" className={styles.primaryButton} onClick={() => setActiveTab('payments')}>
              Review Pending Payments
            </button>
          </div>

          <div className={styles.cardGrid}>
            {paymentsQueue.slice(0, 3).map((booking) => (
              <BookingCard key={booking.id} booking={booking} showActions />
            ))}
            {paymentsQueue.length === 0 && dashboard.attention.problemBookings.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No urgent payment or booking issues are waiting right now.</p>
              </div>
            ) : null}
          </div>

          {(dashboard.attention.customerProfileGaps > 0 || dashboard.attention.barberProfileGaps > 0) ? (
            <div className={styles.inlineActions}>
              {dashboard.attention.customerProfileGaps > 0 ? (
                <span className={styles.cardSubmeta}>
                  {dashboard.attention.customerProfileGaps} customer profile
                  {dashboard.attention.customerProfileGaps === 1 ? '' : 's'} need details.
                </span>
              ) : null}
              {dashboard.attention.barberProfileGaps > 0 ? (
                <span className={styles.cardSubmeta}>
                  {dashboard.attention.barberProfileGaps} barber profile
                  {dashboard.attention.barberProfileGaps === 1 ? '' : 's'} need details.
                </span>
              ) : null}
            </div>
          ) : null}
        </article>

        <div className={styles.statsGrid}>
          {dashboard.metrics.map((metric) => (
            <DashboardStatCard
              key={metric.id}
              label={metric.label}
              value={metric.value}
              detail={metric.detail}
              tone={metric.tone}
            />
          ))}
        </div>
      </section>

      <div className={styles.tabbedShell}>
        <DashboardTabs
          tabs={TABS}
          activeTab={activeTab}
          onChange={setActiveTab}
          label="Admin dashboard sections"
        />

        {activeTab === 'bookings' ? (
          <section className={styles.tabPanel}>
            <article className={styles.panelCard}>
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.eyebrow}>Bookings</p>
                  <h2 className={styles.sectionTitle}>Booking management</h2>
                </div>
              </div>

              <form method="get" className={styles.filtersGrid}>
                <input type="hidden" name="tab" value="bookings" />
                <input
                  type="text"
                  name="booking_q"
                  defaultValue={current.booking_q}
                  placeholder="Search customer, phone, barber or service"
                  className={styles.input}
                />
                <select name="booking_status" defaultValue={current.booking_status} className={styles.input}>
                  <option value="">All statuses</option>
                  <option value="pending_payment">Pending payment</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
                <select name="booking_sort" defaultValue={current.booking_sort} className={styles.input}>
                  <option value="starts_at">Appointment date</option>
                  <option value="created_at">Created date</option>
                  <option value="status">Status</option>
                </select>
                <select name="booking_direction" defaultValue={current.booking_direction} className={styles.input}>
                  <option value="desc">Newest first</option>
                  <option value="asc">Oldest first</option>
                </select>
                <button type="submit" className={styles.secondaryButton}>
                  Apply Filters
                </button>
              </form>

              {dashboard.bookings.errorMessage ? (
                <EmptyState title="Bookings unavailable" description={dashboard.bookings.errorMessage} />
              ) : dashboard.bookings.items.length > 0 ? (
                <div className={styles.cardGrid}>
                  {dashboard.bookings.items.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} showActions={booking.status === 'pending_payment'} />
                  ))}
                </div>
              ) : (
                <EmptyState title="No bookings found" description="No bookings matched the current filters." />
              )}
            </article>
          </section>
        ) : null}

        {activeTab === 'payments' ? (
          <section className={styles.tabPanel}>
            {paymentsQueue.length > 0 ? (
              <div className={styles.cardGrid}>
                {paymentsQueue.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} showActions />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No pending payments"
                description="There are no unpaid or pending-payment bookings waiting for admin action."
              />
            )}
          </section>
        ) : null}

        {activeTab === 'users' ? (
          <section className={styles.tabPanel}>
            <div className={styles.tabsBar} role="tablist" aria-label="User role groups">
              {USER_GROUPS.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  className={styles.tabButton}
                  data-active={activeUserGroup === group.id}
                  onClick={() => setActiveUserGroup(group.id)}
                >
                  {group.label}
                </button>
              ))}
            </div>

            {!dashboard.users.enabled ? (
              <EmptyState
                title="Users unavailable"
                description={dashboard.users.errorMessage ?? 'User data is not available right now.'}
              />
            ) : usersByGroup[activeUserGroup].length > 0 ? (
              <div className={styles.cardGrid}>
                {usersByGroup[activeUserGroup].map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No users in this group"
                description="No users matched this role group."
              />
            )}
          </section>
        ) : null}

        {activeTab === 'barbers' ? (
          <section className={styles.tabPanel}>
            {!dashboard.barbers.enabled ? (
              <EmptyState
                title="Barbers unavailable"
                description={dashboard.barbers.errorMessage ?? 'Barber data is not available right now.'}
              />
            ) : dashboard.barbers.items.length > 0 ? (
              <div className={styles.cardGrid}>
                {dashboard.barbers.items.map((barber) => (
                  <BarberCard key={barber.id} barber={barber} />
                ))}
              </div>
            ) : (
              <EmptyState title="No barbers found" description="No barber records are available." />
            )}
          </section>
        ) : null}
      </div>
    </>
  )
}
