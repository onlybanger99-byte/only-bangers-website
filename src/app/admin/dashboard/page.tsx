import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/auth/get-user-role'
import { getDefaultDashboardForRole } from '@/lib/auth/roles'
import { getAdminDashboardViewModel } from '@/lib/admin-dashboard/data'
import type {
  ApprovalStatus,
  BookingStatus,
  HealthStatus,
} from '@/lib/admin-dashboard/types'
import styles from './dashboard.module.css'

export const dynamic = 'force-dynamic'

// Server-first route: auth and dashboard data are resolved before rendering the console.
export default async function AdminDashboardPage() {
  const { user, role } = await getUserRole()

  if (!user?.email) {
    redirect('/login')
  }

  if (role !== 'admin') {
    redirect(getDefaultDashboardForRole(role))
  }

  const dashboard = await getAdminDashboardViewModel()

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Only Bangers Operations</p>
            <h1 className={styles.title}>Admin command center</h1>
            <p className={styles.subtitle}>{dashboard.headerMessage}</p>
          </div>

          <div className={styles.heroAside}>
            <div className={styles.identityCard}>
              <span className={styles.identityLabel}>Signed in as</span>
              <strong className={styles.identityValue}>{user.email}</strong>
              <div className={styles.identityMeta}>
                <span className={styles.roleBadge}>{role.toUpperCase()}</span>
                <span className={styles.readinessBadge} data-mode={dashboard.readiness}>
                  {dashboard.readinessLabel}
                </span>
              </div>
            </div>

            <div className={styles.actionCluster}>
              <Link href="/admin" className={styles.secondaryButton}>
                Access Summary
              </Link>
              <Link href="/portal/dashboard" className={styles.secondaryButton}>
                Customer View
              </Link>
              <form action="/auth/signout" method="post">
                <button type="submit" className={styles.primaryButton}>
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </header>

        <section className={styles.overviewGrid} aria-label="Overview metrics">
          {dashboard.overviewCards.map((card) => (
            <article
              key={card.label}
              className={styles.metricCard}
              data-tone={card.tone}
            >
              <div className={styles.metricTop}>
                <span className={styles.metricLabel}>{card.label}</span>
                <span className={styles.sourcePill} data-source={card.source}>
                  {card.source === 'live' ? 'Live' : 'Seeded'}
                </span>
              </div>
              <strong className={styles.metricValue}>{card.value}</strong>
              <p className={styles.metricDetail}>{card.detail}</p>
            </article>
          ))}
        </section>

        <div className={styles.grid}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>Bookings Panel</p>
                <h2 className={styles.panelTitle}>Upcoming appointments</h2>
              </div>
              <span className={styles.sourcePill} data-source={dashboard.bookings.source}>
                {dashboard.bookings.source === 'live' ? 'Live feed' : 'Seeded operations'}
              </span>
            </div>

            {dashboard.bookings.items.length > 0 ? (
              <div className={styles.list}>
                {dashboard.bookings.items.map((booking) => (
                  <article key={booking.id} className={styles.bookingCard}>
                    <div className={styles.bookingMain}>
                      <div>
                        <h3 className={styles.bookingTitle}>{booking.customerName}</h3>
                        <p className={styles.bookingMeta}>
                          {booking.serviceType} - {booking.barberAssigned}
                        </p>
                        <p className={styles.bookingSubmeta}>{booking.customerEmail}</p>
                      </div>

                      <div className={styles.bookingAside}>
                        <span className={styles.statusBadge} data-status={booking.status}>
                          {formatStatusLabel(booking.status)}
                        </span>
                        <span className={styles.bookingDate}>{booking.startsAtLabel}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyPanel message={dashboard.bookings.emptyMessage} />
            )}
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>Revenue Panel</p>
                <h2 className={styles.panelTitle}>Weekly revenue pulse</h2>
              </div>
              <span className={styles.sourcePill} data-source={dashboard.revenue.source}>
                {dashboard.revenue.source === 'live' ? 'Live finance' : 'Seeded finance'}
              </span>
            </div>

            <div className={styles.revenueSummary}>
              <div className={styles.revenueStat}>
                <span className={styles.revenueLabel}>Weekly Revenue</span>
                <strong className={styles.revenueValue}>
                  {dashboard.revenue.weeklyRevenue}
                </strong>
              </div>
              <div className={styles.revenueStat}>
                <span className={styles.revenueLabel}>Average Order Value</span>
                <strong className={styles.revenueValue}>
                  {dashboard.revenue.averageOrderValue}
                </strong>
              </div>
            </div>

            <p className={styles.panelText}>{dashboard.revenue.trendSummary}</p>

            <div className={styles.list}>
              {dashboard.revenue.recentTransactions.map((transaction) => (
                <article key={transaction.id} className={styles.transactionCard}>
                  <div>
                    <h3 className={styles.bookingTitle}>{transaction.customerName}</h3>
                    <p className={styles.bookingMeta}>{transaction.processedAtLabel}</p>
                  </div>
                  <div className={styles.transactionAside}>
                    <strong className={styles.transactionValue}>
                      {transaction.amountLabel}
                    </strong>
                    <span className={styles.transactionStatus}>
                      {transaction.statusLabel}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>Customer Insights</p>
                <h2 className={styles.panelTitle}>Recent customers and loyalty</h2>
              </div>
              <span className={styles.sourcePill} data-source={dashboard.customers.source}>
                {dashboard.customers.source === 'live' ? 'Live customers' : 'Seeded customers'}
              </span>
            </div>

            {dashboard.customers.items.length > 0 ? (
              <div className={styles.list}>
                {dashboard.customers.items.map((customer) => (
                  <article key={customer.id} className={styles.customerCard}>
                    <div>
                      <h3 className={styles.bookingTitle}>{customer.customerName}</h3>
                      <p className={styles.bookingMeta}>{customer.email}</p>
                    </div>
                    <div className={styles.customerMeta}>
                      <span>{customer.joinedLabel}</span>
                      <span>{customer.lastVisitLabel}</span>
                      <span>{customer.repeatVisitLabel}</span>
                      <strong className={styles.customerTier}>{customer.loyaltyTier}</strong>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyPanel message={dashboard.customers.emptyMessage} />
            )}
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>Content Operations</p>
                <h2 className={styles.panelTitle}>Pending video and content queue</h2>
              </div>
              <span className={styles.sourcePill} data-source={dashboard.content.source}>
                {dashboard.content.source === 'live' ? 'Live moderation' : 'Seeded queue'}
              </span>
            </div>

            {dashboard.content.items.length > 0 ? (
              <div className={styles.list}>
                {dashboard.content.items.map((item) => (
                  <article key={item.id} className={styles.contentCard}>
                    <div>
                      <h3 className={styles.bookingTitle}>{item.title}</h3>
                      <p className={styles.bookingMeta}>
                        {item.contentType} - {item.creatorName}
                      </p>
                      <p className={styles.bookingSubmeta}>{item.submittedLabel}</p>
                    </div>

                    <div className={styles.contentAside}>
                      <span
                        className={styles.statusBadge}
                        data-approval={item.approvalState}
                      >
                        {formatApprovalLabel(item.approvalState)}
                      </span>
                      <div className={styles.inlineActions}>
                        <button type="button" className={styles.inlineButton}>
                          Review
                        </button>
                        <button type="button" className={styles.inlineButton}>
                          Assign
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyPanel message={dashboard.content.emptyMessage} />
            )}
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>System Health</p>
                <h2 className={styles.panelTitle}>Provider and automation status</h2>
              </div>
            </div>

            <div className={styles.healthGrid}>
              {dashboard.health.map((item) => (
                <article key={item.id} className={styles.healthCard}>
                  <div className={styles.healthHeader}>
                    <h3 className={styles.bookingTitle}>{item.label}</h3>
                    <span className={styles.healthDot} data-health={item.status} />
                  </div>
                  <p className={styles.panelText}>{item.detail}</p>
                  <span className={styles.healthLabel} data-health={item.status}>
                    {formatHealthLabel(item.status)}
                  </span>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>Quick Actions</p>
                <h2 className={styles.panelTitle}>Fast operational shortcuts</h2>
              </div>
            </div>

            <div className={styles.quickActionsGrid}>
              {dashboard.quickActions.map((action) => (
                <article key={action.id} className={styles.quickActionCard}>
                  <h3 className={styles.bookingTitle}>{action.title}</h3>
                  <p className={styles.panelText}>{action.description}</p>
                  <Link href={action.href} className={styles.quickActionLink}>
                    {action.cta}
                  </Link>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className={styles.emptyState}>
      <p>{message}</p>
    </div>
  )
}

function formatStatusLabel(status: BookingStatus) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}

function formatApprovalLabel(status: ApprovalStatus) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}

function formatHealthLabel(status: HealthStatus) {
  return status.replace(/\b\w/g, (character) => character.toUpperCase())
}
