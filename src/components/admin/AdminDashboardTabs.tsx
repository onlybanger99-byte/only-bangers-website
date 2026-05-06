'use client'

import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import type {
  AdminBarberApplicationRow,
  AdminBarberRow,
  AdminBookingRow,
  AdminDashboardViewModel,
  AdminPendingActionItem,
  AdminOverviewSection,
  AdminUserRow,
} from '@/lib/admin-dashboard/types'
import type { ContactMessageSummary } from '@/lib/contact-messages/service'
import type { SiteContentItem } from '@/lib/site-content/types'
import { DashboardTabs } from '@/components/dashboard/DashboardTabs'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { AdminBarberActions } from './AdminBarberActions'
import { AdminBarberApplicationActions } from './AdminBarberApplicationActions'
import { AdminBookingActions } from './AdminBookingActions'
import { AdminCreateUserForm } from './AdminCreateUserForm'
import { AdminModal } from './AdminModal'
import { AdminProfileSettings } from './AdminProfileSettings'
import { AdminProductManager } from './AdminProductManager'
import { AdminServiceCatalogManager } from './AdminServiceCatalogManager'
import { AdminSiteContentManager } from './AdminSiteContentManager'
import { AdminUserActions } from './AdminUserActions'
import { formatDate, formatTimeRange } from '@/lib/date-time'
import { getSafeImage } from '@/lib/safe-image'
import styles from '@/app/admin/dashboard/dashboard.module.css'

const TABS = [
  { id: 'pending-actions', label: 'Pending Actions' },
  { id: 'overview', label: 'Overview' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'barbers', label: 'Barbers' },
  { id: 'users', label: 'Users' },
  { id: 'services', label: 'Services' },
  { id: 'products', label: 'Products' },
  { id: 'settings', label: 'Settings' },
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

function normalizeInitialTab(tab: string): TabId {
  return TABS.some((item) => item.id === tab) ? (tab as TabId) : 'pending-actions'
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

function RequestSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <article className={styles.panelCard}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h2 className={styles.sectionTitle}>{title}</h2>
          {description ? <p className={styles.cardText}>{description}</p> : null}
        </div>
      </div>
      {children}
    </article>
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
      </div>

      {showActions ? <AdminBookingActions bookingId={booking.id} status={booking.status} /> : null}
    </article>
  )
}

function BarberCard({
  barber,
  onManage,
  actionLabel = 'Manage',
}: {
  barber: AdminBarberRow
  onManage: () => void
  actionLabel?: string
}) {
  return (
    <article className={styles.recordCard}>
      <div className={styles.personTop}>
        <img src={getSafeImage(barber.profileImageUrl)} alt={barber.displayName} className={styles.avatarImage} />
        <div>
          <h3 className={styles.cardTitle}>{barber.displayName}</h3>
          <p className={styles.cardMeta}>{barber.specialty}</p>
          <p className={styles.cardSubmeta}>
            {barber.issueLabels.length > 0 ? barber.issueLabels.join(' | ') : barber.cuttingLocation || barber.location || 'Profile looks healthy.'}
          </p>
        </div>
      </div>

      <div className={styles.badgeCluster}>
        <StatusBadge value={barber.activeStatus} />
        <span className={styles.secondaryButton}>{barber.setupStatus.replace(/_/g, ' ')}</span>
        {barber.isLive ? <span className={styles.secondaryButton}>live</span> : null}
      </div>

      <button type="button" className={styles.primaryButton} onClick={onManage}>
        {actionLabel}
      </button>
    </article>
  )
}

function UserCard({
  user,
  onManage,
}: {
  user: AdminUserRow
  onManage: () => void
}) {
  return (
    <article className={styles.recordCard}>
      <div className={styles.personTop}>
        <img src={getSafeImage(user.profileImageUrl)} alt={user.fullName} className={styles.avatarImage} />
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

function BarberApplicationCard({
  application,
  onReview,
}: {
  application: AdminBarberApplicationRow
  onReview: () => void
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
              : 'No slots'}
          </strong>
        </div>
      </div>

      <button type="button" className={styles.primaryButton} onClick={onReview}>
        Review
      </button>
    </article>
  )
}

function PendingActionRow({
  item,
  onAction,
}: {
  item: AdminPendingActionItem
  onAction: () => void
}) {
  return (
    <article className={styles.recordCard}>
      <div className={styles.recordTop}>
        <div>
          <p className={styles.referenceText}>{item.type}</p>
          <h3 className={styles.cardTitle}>{item.title}</h3>
          <p className={styles.cardText}>{item.description}</p>
          {item.createdAtLabel ? <p className={styles.cardSubmeta}>{item.createdAtLabel}</p> : null}
        </div>

        <div className={styles.badgeCluster}>
          <span className={styles.secondaryButton}>{item.priority}</span>
          <span className={styles.secondaryButton}>{item.status.replace(/_/g, ' ')}</span>
        </div>
      </div>

      <button type="button" className={styles.primaryButton} onClick={onAction}>
        Review
      </button>
    </article>
  )
}

function OverviewSectionCard({
  section,
  onOpenTab,
}: {
  section: AdminOverviewSection
  onOpenTab: (tab: TabId) => void
}) {
  return (
    <article className={styles.panelCard}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>{section.title}</h2>
          <p className={styles.cardText}>{section.description}</p>
        </div>
      </div>

      <div className={styles.statsGridCompact}>
        {section.stats.map((stat) => (
          <article key={stat.id} className={styles.summaryCard}>
            <p className={styles.referenceText}>{stat.label}</p>
            <h3 className={styles.cardTitle}>{stat.value}</h3>
          </article>
        ))}
      </div>

      {section.rows.length > 0 ? (
        <div className={styles.cardGrid}>
          {section.rows.map((row) => (
            <article key={row.id} className={styles.recordCard}>
              <div className={styles.recordTop}>
                <div>
                  <h3 className={styles.cardTitle}>{row.title}</h3>
                  <p className={styles.cardText}>{row.summary}</p>
                </div>
                <span className={styles.secondaryButton}>{row.status.replace(/_/g, ' ')}</span>
              </div>

              <button type="button" className={styles.secondaryButton} onClick={() => onOpenTab(row.targetTab)}>
                {row.actionLabel}
              </button>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title={`No ${section.title.toLowerCase()} updates`} description="This section does not have any records to surface right now." />
      )}
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
    default:
      return normalized.startsWith('www.') ? `https://${normalized}` : normalized
  }
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
  const [selectedBooking, setSelectedBooking] = useState<AdminBookingRow | null>(null)
  const [selectedSiteContent, setSelectedSiteContent] = useState<SiteContentItem | null>(null)
  const [selectedContactMessage, setSelectedContactMessage] = useState<ContactMessageSummary | null>(null)
  const [barberQuery, setBarberQuery] = useState('')

  const usersByGroup = {
    customers: dashboard.users.customers,
    barbers: dashboard.users.barbers,
    admins: dashboard.users.admins,
  } satisfies Record<UserGroupId, AdminUserRow[]>

  const filteredBarbers = useMemo(() => {
    const query = barberQuery.trim().toLowerCase()

    if (!query) {
      return dashboard.barbers.items
    }

    return dashboard.barbers.items.filter((item) =>
      [item.displayName, item.specialty, item.location, item.cuttingLocation, ...item.issueLabels]
        .join(' ')
        .toLowerCase()
        .includes(query)
    )
  }, [barberQuery, dashboard.barbers.items])

  const liveBarbers = filteredBarbers.filter((item) => item.activeStatus === 'active' && item.isLive)
  const pendingGoLive = filteredBarbers.filter(
    (item) => item.setupStatus === 'pending_review' && item.activeStatus === 'active' && !item.isLive
  )
  const incompleteBarbers = filteredBarbers.filter(
    (item) => !item.profileComplete || item.issueLabels.length > 0 || item.setupStatus === 'draft'
  )
  const deactivatedBarbers = filteredBarbers.filter((item) => item.activeStatus === 'inactive')
  const serviceContentGroups = dashboard.siteContent.groups.filter((group) => group.id === 'services')
  const settingsContentGroups = dashboard.siteContent.groups.filter((group) => group.id !== 'services')

  const handlePendingAction = (item: AdminPendingActionItem) => {
    if (item.applicationId) {
      const application = dashboard.barberApplications.items.find((entry) => entry.id === item.applicationId)

      if (application) {
        setSelectedApplication(application)
        return
      }
    }

    if (item.barberId) {
      const barber = dashboard.barbers.items.find((entry) => entry.id === item.barberId)

      if (barber) {
        setSelectedBarber(barber)
        return
      }
    }

    if (item.bookingId) {
      const booking = dashboard.bookings.items.find((entry) => entry.id === item.bookingId)

      if (booking) {
        setSelectedBooking(booking)
        return
      }
    }

    if (item.siteContentKey) {
      const siteContent = dashboard.siteContent.items.find((entry) => entry.key === item.siteContentKey)

      if (siteContent) {
        setSelectedSiteContent(siteContent)
        return
      }
    }

    if (item.contactMessageId) {
      const message = dashboard.contactMessages.find((entry) => entry.id === item.contactMessageId)

      if (message) {
        setSelectedContactMessage(message)
        return
      }
    }

    setActiveTab(item.targetTab)
  }

  return (
    <>
      <div className={styles.tabbedShell}>
        <DashboardTabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} label="Admin dashboard modules" />

        {activeTab === 'pending-actions' ? (
          <section className={styles.tabPanel}>
            {dashboard.pendingActions.length > 0 ? (
              <div className={styles.queueList}>
                {dashboard.pendingActions.map((item) => (
                  <PendingActionRow key={item.id} item={item} onAction={() => handlePendingAction(item)} />
                ))}
              </div>
            ) : (
              <div className={styles.emptyQueue}>
                <span className={styles.emptyQueueBadge}>✓</span>
                <EmptyState title="All caught up" description="No pending actions" />
              </div>
            )}
          </section>
        ) : null}

        {activeTab === 'overview' ? (
          <section className={styles.tabPanel}>
            {dashboard.overviewSections.map((section) => (
              <OverviewSectionCard key={section.id} section={section} onOpenTab={setActiveTab} />
            ))}
          </section>
        ) : null}

        {activeTab === 'bookings' ? (
          <section className={styles.tabPanel}>
            <RequestSection
              eyebrow="Pending Payments"
              title="Bookings waiting on admin confirmation"
              description="Pending payment bookings only."
            >
              {dashboard.attention.pendingPayments.length > 0 ? (
                <div className={styles.cardGrid}>
                  {dashboard.attention.pendingPayments.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} showActions />
                  ))}
                </div>
              ) : (
                <EmptyState title="No pending payments" description="There are no payment confirmations waiting right now." />
              )}
            </RequestSection>

            <RequestSection
              eyebrow="Booking Feed"
              title="Booking queue"
              description="Search, filter, and review bookings."
            >
              <form method="get" className={styles.filtersGrid}>
                <input type="hidden" name="tab" value="bookings" />
                <input type="text" name="booking_q" defaultValue={current.booking_q} placeholder="Search customer, phone, barber or service" className={styles.input} />
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
            </RequestSection>
          </section>
        ) : null}

        {activeTab === 'barbers' ? (
          <section className={styles.tabPanel}>
            <article className={styles.panelCard}>
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.eyebrow}>Barber Search</p>
                  <h2 className={styles.sectionTitle}>Barbers</h2>
                  <p className={styles.cardText}>Find barber records fast.</p>
                </div>
              </div>

              <input
                className={styles.input}
                value={barberQuery}
                onChange={(event) => setBarberQuery(event.target.value)}
                placeholder="Search barber name, location, specialty, or setup blocker"
              />
            </article>

            <RequestSection
              eyebrow="Pending Applications"
              title="Pending applications"
              description="Review new barber applications."
            >
              {dashboard.barberApplications.items.filter((item) => item.status === 'pending').length > 0 ? (
                <div className={styles.cardGrid}>
                  {dashboard.barberApplications.items
                    .filter((item) => item.status === 'pending')
                    .map((application) => (
                      <BarberApplicationCard
                        key={application.id}
                        application={application}
                        onReview={() => setSelectedApplication(application)}
                      />
                    ))}
                </div>
              ) : (
                <EmptyState title="No pending applications" description="New barber applications will show up here for review." />
              )}
            </RequestSection>

            <RequestSection
              eyebrow="Approved but Incomplete"
              title="Setup incomplete"
              description="Approved barbers still missing setup requirements."
            >
              {incompleteBarbers.length > 0 ? (
                <div className={styles.cardGrid}>
                  {incompleteBarbers.map((barber) => (
                    <BarberCard key={barber.id} barber={barber} onManage={() => setSelectedBarber(barber)} />
                  ))}
                </div>
              ) : (
                <EmptyState title="No incomplete barbers" description="Approved barber profiles are currently looking healthy." />
              )}
            </RequestSection>

            <RequestSection
              eyebrow="Go-Live Pending"
              title="Go-live pending"
              description="Profiles waiting for live approval."
            >
              {pendingGoLive.length > 0 ? (
                <div className={styles.cardGrid}>
                  {pendingGoLive.map((barber) => (
                    <BarberCard key={barber.id} barber={barber} onManage={() => setSelectedBarber(barber)} actionLabel="Approve" />
                  ))}
                </div>
              ) : (
                <EmptyState title="No go-live reviews" description="No barber profiles are waiting for public launch right now." />
              )}
            </RequestSection>

            <RequestSection
              eyebrow="Live Barbers"
              title="Live barbers"
              description="Public barber profiles."
            >
              {liveBarbers.length > 0 ? (
                <div className={styles.cardGrid}>
                  {liveBarbers.map((barber) => (
                    <BarberCard key={barber.id} barber={barber} onManage={() => setSelectedBarber(barber)} />
                  ))}
                </div>
              ) : (
                <EmptyState title="No live barbers" description="Public live barber profiles will appear here once go-live is approved." />
              )}
            </RequestSection>

            <RequestSection
              eyebrow="Deactivated"
              title="Deactivated"
              description="Inactive barber profiles."
            >
              {deactivatedBarbers.length > 0 ? (
                <div className={styles.cardGrid}>
                  {deactivatedBarbers.map((barber) => (
                    <BarberCard key={barber.id} barber={barber} onManage={() => setSelectedBarber(barber)} />
                  ))}
                </div>
              ) : (
                <EmptyState title="No deactivated barbers" description="Inactive barber profiles will appear here if they need attention." />
              )}
            </RequestSection>
          </section>
        ) : null}

        {activeTab === 'users' ? (
          <section className={styles.tabPanel}>
            <RequestSection eyebrow="User Management" title="Users" description="Create accounts and manage access.">
              <AdminCreateUserForm />
            </RequestSection>

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
              <EmptyState title="Users unavailable" description={dashboard.users.errorMessage ?? 'User data is not available right now.'} />
            ) : usersByGroup[activeUserGroup].length > 0 ? (
              <div className={styles.cardGrid}>
                {usersByGroup[activeUserGroup].map((user) => (
                  <UserCard key={user.id} user={user} onManage={() => setSelectedUser(user)} />
                ))}
              </div>
            ) : (
              <EmptyState title="No users in this group" description="No users matched this role group." />
            )}
          </section>
        ) : null}

        {activeTab === 'services' ? (
          <section className={styles.tabPanel}>
            <RequestSection
              eyebrow="Fixed Catalog"
              title="Fixed service catalog"
              description="Descriptions, order, status, and duration."
            >
              {dashboard.services.errorMessage ? (
                <EmptyState title="Services unavailable" description={dashboard.services.errorMessage} />
              ) : (
                <AdminServiceCatalogManager services={dashboard.services.items} />
              )}
            </RequestSection>

            <RequestSection
              eyebrow="Service Media"
              title="Service media"
              description="Upload and manage service visuals."
            >
              <AdminSiteContentManager groups={serviceContentGroups} />
            </RequestSection>
          </section>
        ) : null}

        {activeTab === 'products' ? (
          <section className={styles.tabPanel}>
            <RequestSection eyebrow="Products" title="Products" description="Manage public grooming products.">
              {dashboard.products.errorMessage ? (
                <EmptyState title="Products unavailable" description={dashboard.products.errorMessage} />
              ) : (
                <AdminProductManager products={dashboard.products.items} />
              )}
            </RequestSection>
          </section>
        ) : null}

        {activeTab === 'settings' ? (
          <section className={styles.tabPanel}>
            <RequestSection
              eyebrow="Site Assets"
              title="Site assets and links"
              description="Brand, backgrounds, media, socials, and contact details."
            >
              <div className={styles.statsGridCompact}>
                <article className={styles.summaryCard}>
                  <p className={styles.referenceText}>Configured assets</p>
                  <h3 className={styles.cardTitle}>
                    {dashboard.siteContent.items.length - dashboard.siteContent.reviewCount}
                  </h3>
                </article>
                <article className={styles.summaryCard}>
                  <p className={styles.referenceText}>Missing or inactive assets</p>
                  <h3 className={styles.cardTitle}>{dashboard.siteContent.reviewCount}</h3>
                </article>
                <article className={styles.summaryCard}>
                  <p className={styles.referenceText}>Social links</p>
                  <h3 className={styles.cardTitle}>{dashboard.siteContent.socialLinks.length}</h3>
                </article>
              </div>

              <AdminSiteContentManager groups={settingsContentGroups} />
            </RequestSection>

            <RequestSection
              eyebrow="Admin Profile"
              title="Admin profile"
              description="Manage your account details."
            >
              <div className={styles.recordCard}>
                <div className={styles.personTop}>
                  <img
                    src={getSafeImage(dashboard.currentAdmin.profileImageUrl)}
                    alt={dashboard.currentAdmin.fullName}
                    className={styles.avatarImage}
                  />
                  <div>
                    <h3 className={styles.cardTitle}>{dashboard.currentAdmin.fullName}</h3>
                    <p className={styles.cardMeta}>{dashboard.currentAdmin.email}</p>
                  </div>
                </div>

                <AdminProfileSettings profile={dashboard.currentAdmin} />
              </div>
            </RequestSection>
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
                <ExternalLinkPill href={toExternalHref('instagram', selectedApplication.instagramUrl ?? '')} label="Instagram" />
                <ExternalLinkPill href={toExternalHref('tiktok', selectedApplication.tiktokUrl ?? '')} label="TikTok" />
                <ExternalLinkPill href={toExternalHref('facebook', selectedApplication.facebookUrl ?? '')} label="Facebook" />
                <ExternalLinkPill href={toExternalHref('portfolio', selectedApplication.portfolioUrl ?? '')} label="Portfolio" />
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

            <div className={styles.modalActionPanel}>
              {selectedApplication.status === 'pending' ? (
                <AdminBarberApplicationActions applicationId={selectedApplication.id} />
              ) : (
                <p className={styles.cardSubmeta}>
                  {selectedApplication.status === 'approved'
                    ? 'This application has already been approved.'
                    : selectedApplication.rejectionReason || 'This application has already been rejected.'}
                </p>
              )}
            </div>
          </div>
        ) : null}
      </AdminModal>

      <AdminModal
        open={selectedBooking !== null}
        title={selectedBooking?.customerName ?? 'Booking review'}
        subtitle={selectedBooking ? `${selectedBooking.serviceName} · ${selectedBooking.paymentReference}` : undefined}
        onClose={() => setSelectedBooking(null)}
      >
        {selectedBooking ? (
          <div className={styles.modalContent}>
            <DetailStack
              items={[
                { label: 'Barber', value: selectedBooking.barberName },
                { label: 'Customer email', value: selectedBooking.customerEmail },
                { label: 'Customer phone', value: selectedBooking.customerPhone },
                { label: 'Appointment', value: selectedBooking.startsAtLabel },
                { label: 'Amount due', value: selectedBooking.amountDueLabel },
              ]}
            />

            <div className={styles.badgeCluster}>
              <StatusBadge value={selectedBooking.status} />
              <StatusBadge value={selectedBooking.paymentStatus} />
            </div>

            <div className={styles.modalActionPanel}>
              <AdminBookingActions bookingId={selectedBooking.id} status={selectedBooking.status} />
            </div>
          </div>
        ) : null}
      </AdminModal>

      <AdminModal
        open={selectedSiteContent !== null}
        title={selectedSiteContent?.label ?? 'Site asset review'}
        subtitle={selectedSiteContent?.key}
        onClose={() => setSelectedSiteContent(null)}
      >
        {selectedSiteContent ? (
          <div className={styles.modalContent}>
            <DetailStack
              items={[
                { label: 'Group', value: selectedSiteContent.group.replace(/-/g, ' ') },
                { label: 'Type', value: selectedSiteContent.type.replace(/_/g, ' ') },
                { label: 'Status', value: selectedSiteContent.isActive ? 'Active' : 'Inactive' },
                {
                  label: 'Configured',
                  value:
                    selectedSiteContent.imageUrl ||
                    selectedSiteContent.videoUrl ||
                    selectedSiteContent.value
                      ? 'Yes'
                      : 'Missing',
                },
              ]}
            />

            <div className={styles.modalActionPanel}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => {
                  setSelectedSiteContent(null)
                  setActiveTab('settings')
                }}
              >
                Review
              </button>
            </div>
          </div>
        ) : null}
      </AdminModal>

      <AdminModal
        open={selectedContactMessage !== null}
        title={selectedContactMessage?.subject || 'Contact message'}
        subtitle={selectedContactMessage ? `${selectedContactMessage.userName || selectedContactMessage.userEmail}` : undefined}
        onClose={() => setSelectedContactMessage(null)}
      >
        {selectedContactMessage ? (
          <ContactMessageModalContent
            message={selectedContactMessage}
            onResolved={() => setSelectedContactMessage(null)}
          />
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
                currentEmail={selectedUser.email}
                displayName={selectedUser.displayName}
                firstName={selectedUser.firstName}
                lastName={selectedUser.lastName}
                phoneNumber={selectedUser.phoneNumber}
                accountStatus={selectedUser.accountStatus}
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
                { label: 'Full name', value: selectedBarber.fullName || 'Not set' },
                { label: 'Phone', value: selectedBarber.phone || 'Not set' },
                { label: 'Setup', value: selectedBarber.setupStatus },
                { label: 'Live', value: selectedBarber.isLive ? 'Yes' : 'No' },
                { label: 'Upcoming bookings', value: String(selectedBarber.upcomingBookings) },
                { label: 'Location', value: selectedBarber.cuttingLocation || selectedBarber.location || 'Not set' },
              ]}
            />

            {selectedBarber.mapUrl ? (
              <div className={styles.inlineActions}>
                <ExternalLinkPill href={selectedBarber.mapUrl} label="Open in Maps" />
              </div>
            ) : null}

            <div className={styles.panelCard}>
              <p className={styles.eyebrow}>Setup Issues</p>
              <p className={styles.cardText}>
                {selectedBarber.issueLabels.length > 0 ? selectedBarber.issueLabels.join(' | ') : 'No setup blockers detected.'}
              </p>
            </div>

            <div className={styles.panelCard}>
              <p className={styles.eyebrow}>Barber Bio</p>
              <p className={styles.cardText}>{selectedBarber.bio}</p>
            </div>

            <div className={styles.panelCard}>
              <p className={styles.eyebrow}>Barber Prices</p>
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

function ContactMessageModalContent({
  message,
  onResolved,
}: {
  message: ContactMessageSummary
  onResolved: () => void
}) {
  const [adminNotes, setAdminNotes] = useState(message.adminNotes ?? '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleResolve = async () => {
    setLoading(true)
    setSuccess('')
    setError('')

    const response = await fetch(`/api/admin/contact-messages/${message.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'resolved',
        adminNotes,
      }),
    })
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      setError(payload?.error?.message ?? 'Could not update this contact message.')
      setLoading(false)
      return
    }

    setSuccess('Contact message resolved.')
    setLoading(false)
    onResolved()
  }

  return (
    <div className={styles.modalContent}>
      <DetailStack
        items={[
          { label: 'From', value: message.userName || 'Logged-in customer' },
          { label: 'Email', value: message.userEmail },
          { label: 'Created', value: formatDate(message.createdAt) },
          { label: 'Status', value: message.status },
        ]}
      />

      <div className={styles.panelCard}>
        <p className={styles.eyebrow}>Message</p>
        <p className={styles.cardText}>{message.message}</p>
      </div>

      <label className={styles.field}>
        <span className={styles.metaLabel}>Admin note</span>
        <textarea
          className={styles.textarea}
          rows={4}
          value={adminNotes}
          onChange={(event) => setAdminNotes(event.target.value)}
        />
      </label>

      {success ? <p className={styles.successText}>{success}</p> : null}
      {error ? <p className={styles.errorText}>{error}</p> : null}

      <div className={styles.modalActionPanel}>
        <button type="button" className={styles.primaryButton} disabled={loading} onClick={handleResolve}>
          {loading ? 'Saving...' : 'Resolve'}
        </button>
      </div>
    </div>
  )
}
