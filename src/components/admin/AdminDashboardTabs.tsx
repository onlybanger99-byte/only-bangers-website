'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type {
  AdminBarberApplicationRow,
  AdminBarberRow,
  AdminBookingRow,
  AdminDashboardViewModel,
  AdminUserRow,
} from '@/lib/admin-dashboard/types'
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard'
import { DashboardTabs } from '@/components/dashboard/DashboardTabs'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { AdminBarberActions } from './AdminBarberActions'
import { AdminBarberApplicationActions } from './AdminBarberApplicationActions'
import { AdminBookingActions } from './AdminBookingActions'
import { AdminCreateUserForm } from './AdminCreateUserForm'
import { AdminModal } from './AdminModal'
import { AdminUserActions } from './AdminUserActions'
import { formatDate, formatTimeRange } from '@/lib/date-time'
import styles from '@/app/admin/dashboard/dashboard.module.css'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'barber-applications', label: 'Barber Applications' },
  { id: 'bookings', label: 'Bookings' },
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

function SummaryRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className={styles.summaryRow}>
      <span className={styles.metaLabel}>{label}</span>
      <strong className={styles.metaValue}>{value}</strong>
    </div>
  )
}

function DetailStack({
  items,
}: {
  items: Array<{ label: string; value: string }>
}) {
  return (
    <div className={styles.detailStack}>
      {items.map((item) => (
        <SummaryRow key={item.label} label={item.label} value={item.value} />
      ))}
    </div>
  )
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

function AttentionCard({
  title,
  count,
  detail,
  actionLabel,
  onClick,
}: {
  title: string
  count: number
  detail: string
  actionLabel: string
  onClick: () => void
}) {
  return (
    <article className={styles.metricStrip}>
      <p className={styles.eyebrow}>{title}</p>
      <p className={styles.metricValue}>{count}</p>
      <p className={styles.cardText}>{detail}</p>
      <button type="button" className={styles.secondaryButton} onClick={onClick}>
        {actionLabel}
      </button>
    </article>
  )
}

function UserSummaryCard({
  user,
  onManage,
}: {
  user: AdminUserRow
  onManage: () => void
}) {
  return (
    <article className={styles.recordCard}>
      <div className={styles.personTop}>
        <img src={user.profileImageUrl} alt={user.fullName} className={styles.avatarImage} />
        <div>
          <h3 className={styles.cardTitle}>{user.fullName}</h3>
          <p className={styles.cardMeta}>{user.email}</p>
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
          <span className={styles.metaLabel}>Created</span>
          <strong className={styles.metaValue}>{user.createdAtLabel}</strong>
        </div>
      </div>

      <button type="button" className={styles.primaryButton} onClick={onManage}>
        Manage
      </button>
    </article>
  )
}

function BarberSummaryCard({
  barber,
  onManage,
}: {
  barber: AdminBarberRow
  onManage: () => void
}) {
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
          <strong className={styles.metaValue}>{String(barber.upcomingBookings)}</strong>
        </div>
        <div>
          <span className={styles.metaLabel}>Total Bookings</span>
          <strong className={styles.metaValue}>{String(barber.totalBookings)}</strong>
        </div>
      </div>

      <button type="button" className={styles.primaryButton} onClick={onManage}>
        Manage
      </button>
    </article>
  )
}

function BarberApplicationSummaryCard({
  application,
  onViewDetails,
}: {
  application: AdminBarberApplicationRow
  onViewDetails: () => void
}) {
  return (
    <article className={styles.recordCard}>
      <div className={styles.recordTop}>
        <div>
          <h3 className={styles.cardTitle}>{application.applicantName}</h3>
          <p className={styles.cardMeta}>{application.applicantEmail}</p>
          <p className={styles.cardSubmeta}>{application.submittedAtLabel}</p>
        </div>
        <StatusBadge value={application.status} />
      </div>

      <div className={styles.metaGrid}>
        <div>
          <span className={styles.metaLabel}>Location</span>
          <strong className={styles.metaValue}>{application.cuttingLocation}</strong>
        </div>
        <div>
          <span className={styles.metaLabel}>Phone</span>
          <strong className={styles.metaValue}>{application.applicantPhone}</strong>
        </div>
        <div>
          <span className={styles.metaLabel}>Availability</span>
          <strong className={styles.metaValue}>
            {application.availabilitySlots.length > 0
              ? `${application.availabilitySlots.length} slot${application.availabilitySlots.length === 1 ? '' : 's'}`
              : 'No slots submitted'}
          </strong>
        </div>
      </div>

      <button type="button" className={styles.primaryButton} onClick={onViewDetails}>
        View Details
      </button>
    </article>
  )
}

function ExternalLinkPill({
  href,
  label,
}: {
  href: string | null
  label: string
}) {
  if (!href) {
    return null
  }

  return (
    <Link href={href} target="_blank" rel="noreferrer" className={styles.secondaryButton}>
      {label}
    </Link>
  )
}

function normalizeInitialTab(tab: string): TabId {
  return TABS.some((item) => item.id === tab) ? (tab as TabId) : 'overview'
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
  const [activeTab, setActiveTab] = useState<TabId>(normalizeInitialTab(initialTab))
  const [activeUserGroup, setActiveUserGroup] = useState<UserGroupId>('customers')
  const [selectedApplication, setSelectedApplication] = useState<AdminBarberApplicationRow | null>(null)
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null)
  const [selectedBarber, setSelectedBarber] = useState<AdminBarberRow | null>(null)

  const paymentsQueue = useMemo(
    () =>
      dashboard.attention.pendingPayments.filter(
        (booking) => booking.status === 'pending_payment' || booking.paymentStatus === 'unpaid'
      ),
    [dashboard.attention.pendingPayments]
  )

  const pendingApplications = useMemo(
    () => dashboard.barberApplications.items.filter((application) => application.status === 'pending'),
    [dashboard.barberApplications.items]
  )

  const usersByGroup = {
    customers: dashboard.users.customers,
    barbers: dashboard.users.barbers,
    admins: dashboard.users.admins,
  } satisfies Record<UserGroupId, AdminUserRow[]>

  return (
    <>
      <section className={styles.tabPanel}>
        <article className={styles.heroCard}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Admin Management</p>
            <h2 className={styles.heroTitle}>Keep approvals, bookings, and role access moving.</h2>
            <p className={styles.heroText}>{dashboard.headerMessage}</p>
          </div>

          <div className={styles.statsGridCompact}>
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
        </article>
      </section>

      <div className={styles.tabbedShell}>
        <DashboardTabs
          tabs={TABS}
          activeTab={activeTab}
          onChange={setActiveTab}
          label="Admin dashboard sections"
        />

        {activeTab === 'overview' ? (
          <section className={styles.tabPanel}>
            <article className={styles.panelCard}>
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.eyebrow}>Needs Attention</p>
                  <h2 className={styles.sectionTitle}>Summary first, details when you need them</h2>
                </div>
              </div>

              <div className={styles.statsGridCompact}>
                <AttentionCard
                  title="Pending barber applications"
                  count={dashboard.attention.pendingBarberApplications}
                  detail="Review new barber requests and promote approved applicants."
                  actionLabel="Open Applications"
                  onClick={() => setActiveTab('barber-applications')}
                />
                <AttentionCard
                  title="Pending payments"
                  count={paymentsQueue.length}
                  detail="Confirm manual WhatsApp payments so bookings reach the barber."
                  actionLabel="Open Bookings"
                  onClick={() => setActiveTab('bookings')}
                />
                <AttentionCard
                  title="Booking issues"
                  count={dashboard.attention.problemBookings.length}
                  detail="Expired, cancelled, or failed-payment bookings that need admin awareness."
                  actionLabel="Review Bookings"
                  onClick={() => setActiveTab('bookings')}
                />
              </div>
            </article>

            <div className={styles.twoColumnGrid}>
              <article className={styles.panelCard}>
                <div className={styles.sectionHeader}>
                  <div>
                    <p className={styles.eyebrow}>Applications Queue</p>
                    <h3 className={styles.sectionTitle}>Next barber requests</h3>
                  </div>
                  <button type="button" className={styles.secondaryButton} onClick={() => setActiveTab('barber-applications')}>
                    View All
                  </button>
                </div>

                {pendingApplications.length > 0 ? (
                  <div className={styles.stackList}>
                    {pendingApplications.slice(0, 3).map((application) => (
                      <div key={application.id} className={styles.summaryCard}>
                        <div className={styles.recordTop}>
                          <div>
                            <h4 className={styles.cardTitle}>{application.applicantName}</h4>
                            <p className={styles.cardSubmeta}>{application.applicantEmail}</p>
                          </div>
                          <StatusBadge value={application.status} />
                        </div>
                        <p className={styles.cardSubmeta}>{application.cuttingLocation}</p>
                        <button
                          type="button"
                          className={styles.primaryButton}
                          onClick={() => {
                            setSelectedApplication(application)
                            setActiveTab('barber-applications')
                          }}
                        >
                          View Details
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No pending applications"
                    description="New barber applications will appear here when customers apply."
                  />
                )}
              </article>

              <article className={styles.panelCard}>
                <div className={styles.sectionHeader}>
                  <div>
                    <p className={styles.eyebrow}>Payments Queue</p>
                    <h3 className={styles.sectionTitle}>Manual confirmations waiting</h3>
                  </div>
                  <button type="button" className={styles.secondaryButton} onClick={() => setActiveTab('bookings')}>
                    Review Bookings
                  </button>
                </div>

                {paymentsQueue.length > 0 ? (
                  <div className={styles.stackList}>
                    {paymentsQueue.slice(0, 3).map((booking) => (
                      <div key={booking.id} className={styles.summaryCard}>
                        <div className={styles.recordTop}>
                          <div>
                            <h4 className={styles.cardTitle}>{booking.customerName}</h4>
                            <p className={styles.cardSubmeta}>{booking.serviceName}</p>
                          </div>
                          <StatusBadge value={booking.paymentStatus} />
                        </div>
                        <p className={styles.cardSubmeta}>{booking.startsAtLabel}</p>
                        <p className={styles.cardSubmeta}>{booking.amountDueLabel}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No pending payments"
                    description="There are no unpaid bookings waiting for admin confirmation."
                  />
                )}
              </article>
            </div>
          </section>
        ) : null}

        {activeTab === 'barber-applications' ? (
          <section className={styles.tabPanel}>
            {dashboard.barberApplications.errorMessage ? (
              <EmptyState
                title="Applications unavailable"
                description={dashboard.barberApplications.errorMessage}
              />
            ) : dashboard.barberApplications.items.length > 0 ? (
              <div className={styles.cardGrid}>
                {dashboard.barberApplications.items.map((application) => (
                  <BarberApplicationSummaryCard
                    key={application.id}
                    application={application}
                    onViewDetails={() => setSelectedApplication(application)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No barber applications"
                description="New customer applications to become barbers will appear here."
              />
            )}
          </section>
        ) : null}

        {activeTab === 'bookings' ? (
          <section className={styles.tabPanel}>
            <article className={styles.panelCard}>
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.eyebrow}>Payments</p>
                  <h2 className={styles.sectionTitle}>Pending payment confirmations</h2>
                </div>
              </div>

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
            </article>

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

        {activeTab === 'users' ? (
          <section className={styles.tabPanel}>
            <article className={styles.panelCard}>
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.eyebrow}>User Management</p>
                  <h2 className={styles.sectionTitle}>Add a user manually</h2>
                </div>
              </div>
              <AdminCreateUserForm />
            </article>

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
                  <UserSummaryCard key={user.id} user={user} onManage={() => setSelectedUser(user)} />
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
                  <BarberSummaryCard key={barber.id} barber={barber} onManage={() => setSelectedBarber(barber)} />
                ))}
              </div>
            ) : (
              <EmptyState title="No barbers found" description="No barber records are available." />
            )}
          </section>
        ) : null}
      </div>

      <AdminModal
        open={selectedApplication !== null}
        title={selectedApplication?.applicantName ?? 'Barber application'}
        subtitle={selectedApplication?.applicantEmail}
        onClose={() => setSelectedApplication(null)}
      >
        {selectedApplication ? (
          <div className={styles.modalContent}>
            <div className={styles.badgeCluster}>
              <StatusBadge value={selectedApplication.status} />
            </div>

            <DetailStack
              items={[
                { label: 'Phone', value: selectedApplication.applicantPhone },
                { label: 'Location', value: selectedApplication.cuttingLocation },
                { label: 'Submitted', value: selectedApplication.submittedAtLabel },
              ]}
            />

            <div className={styles.panelCard}>
              <p className={styles.eyebrow}>Bio</p>
              <p className={styles.cardText}>{selectedApplication.bio}</p>
            </div>

            <div className={styles.panelCard}>
              <p className={styles.eyebrow}>Socials</p>
              <div className={styles.inlineActions}>
                <ExternalLinkPill
                  href={toExternalHref('instagram', selectedApplication.instagramUrl ?? '')}
                  label="Instagram"
                />
                <ExternalLinkPill
                  href={toExternalHref('tiktok', selectedApplication.tiktokUrl ?? '')}
                  label="TikTok"
                />
                <ExternalLinkPill
                  href={toExternalHref('facebook', selectedApplication.facebookUrl ?? '')}
                  label="Facebook"
                />
                <ExternalLinkPill
                  href={toExternalHref('portfolio', selectedApplication.portfolioUrl ?? '')}
                  label="Portfolio"
                />
                {!selectedApplication.instagramUrl &&
                !selectedApplication.tiktokUrl &&
                !selectedApplication.facebookUrl &&
                !selectedApplication.portfolioUrl ? (
                  <p className={styles.cardSubmeta}>No social or portfolio links were supplied.</p>
                ) : null}
              </div>
            </div>

            <div className={styles.panelCard}>
              <p className={styles.eyebrow}>Availability</p>
              {selectedApplication.availabilitySlots.length > 0 ? (
                <div className={styles.inlineActions}>
                  {selectedApplication.availabilitySlots.map((slot) => (
                    <span key={slot.id} className={styles.secondaryButton}>
                      {formatDate(slot.availableDate)} {formatTimeRange(slot.startTime, slot.endTime)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className={styles.cardSubmeta}>No availability slots were submitted with this application.</p>
              )}
            </div>

            {selectedApplication.rejectionReason ? (
              <div className={styles.panelCard}>
                <p className={styles.eyebrow}>Rejection Reason</p>
                <p className={styles.cardText}>{selectedApplication.rejectionReason}</p>
              </div>
            ) : null}

            {selectedApplication.status === 'pending' ? (
              <div className={styles.modalActionPanel}>
                <AdminBarberApplicationActions applicationId={selectedApplication.id} />
              </div>
            ) : null}
          </div>
        ) : null}
      </AdminModal>

      <AdminModal
        open={selectedUser !== null}
        title={selectedUser?.fullName ?? 'User details'}
        subtitle={selectedUser?.email}
        onClose={() => setSelectedUser(null)}
      >
        {selectedUser ? (
          <div className={styles.modalContent}>
            <DetailStack
              items={[
                { label: 'Role', value: selectedUser.role },
                { label: 'Phone', value: selectedUser.phoneNumber },
                { label: 'Account status', value: selectedUser.accountStatus },
                { label: 'Created', value: selectedUser.createdAtLabel },
                { label: 'Profile', value: selectedUser.profileComplete ? 'Complete' : 'Needs attention' },
              ]}
            />

            <div className={styles.modalActionPanel}>
              <AdminUserActions
                userId={selectedUser.id}
                currentRole={selectedUser.role}
                editable={selectedUser.editable}
              />
            </div>
          </div>
        ) : null}
      </AdminModal>

      <AdminModal
        open={selectedBarber !== null}
        title={selectedBarber?.displayName ?? 'Barber profile'}
        subtitle={selectedBarber?.specialty}
        onClose={() => setSelectedBarber(null)}
      >
        {selectedBarber ? (
          <div className={styles.modalContent}>
            <DetailStack
              items={[
                { label: 'Status', value: selectedBarber.activeStatus },
                { label: 'Upcoming bookings', value: String(selectedBarber.upcomingBookings) },
                { label: 'Total bookings', value: String(selectedBarber.totalBookings) },
                { label: 'Location', value: selectedBarber.cuttingLocation || 'Not set' },
              ]}
            />

            <div className={styles.panelCard}>
              <p className={styles.eyebrow}>Barber Bio</p>
              <p className={styles.cardText}>{selectedBarber.bio}</p>
            </div>

            <div className={styles.panelCard}>
              <p className={styles.eyebrow}>Active Prices</p>
              {selectedBarber.servicePrices.length > 0 ? (
                <div className={styles.inlineActions}>
                  {selectedBarber.servicePrices.map((price) => (
                    <span key={price.id} className={styles.secondaryButton}>
                      {price.serviceName} R{price.price}
                      {price.durationMinutes ? ` · ${price.durationMinutes} min` : ''}
                    </span>
                  ))}
                </div>
              ) : (
                <p className={styles.cardSubmeta}>No active barber prices have been added yet.</p>
              )}
            </div>

            <div className={styles.modalActionPanel}>
              <AdminBarberActions barber={selectedBarber} />
            </div>
          </div>
        ) : null}
      </AdminModal>
    </>
  )
}
