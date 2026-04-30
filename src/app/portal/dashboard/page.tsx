import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CustomerDashboardTabs } from '@/components/portal/CustomerDashboardTabs'
import { DashboardStatCard } from '@/components/portal/DashboardStatCard'
import { getUserRole } from '@/lib/auth/get-user-role'
import { getDefaultDashboardForRole } from '@/lib/auth/roles'
import { getPortalDashboardViewModel } from '@/lib/portal-dashboard/data'
import styles from './dashboard.module.css'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const { user, role } = await getUserRole()

  if (!user?.email) {
    redirect('/login')
  }

  if (role !== 'customer') {
    redirect(getDefaultDashboardForRole(role))
  }

  const dashboard = await getPortalDashboardViewModel({
    userId: user.id,
    email: user.email,
    role,
  })

  return (
    <div className="page-background">
      <div className={styles.pageShell}>
        <header className={styles.heroCard}>
          <div className={styles.heroCopy}>
            <div className={styles.avatar}>{dashboard.account.initials}</div>
            <div>
              <p className={styles.eyebrow}>Customer Portal</p>
              <h1 className={styles.heroTitle}>Welcome back, {dashboard.account.firstName}</h1>
              <p className={styles.heroText}>{dashboard.headerDescription}</p>
            </div>
          </div>

          <div className={styles.heroMeta}>
            <span className={styles.membershipBadge}>{dashboard.account.membershipLabel}</span>
            <p className={styles.cardText}>{dashboard.nextAppointmentSummary}</p>
            <Link href="/services" className={styles.primaryLink}>
              Book New Cut
            </Link>
          </div>
        </header>

        {dashboard.source === 'error' ? (
          <section className={styles.errorCard} aria-live="polite">
            <p className={styles.eyebrow}>Dashboard Notice</p>
            <h2 className={styles.sectionTitle}>Some live booking data is temporarily unavailable</h2>
            <p className={styles.cardText}>{dashboard.sourceMessage}</p>
          </section>
        ) : null}

        <section className={styles.statsGrid} aria-label="Customer portal quick stats">
          <DashboardStatCard
            label="Next Booking"
            value={dashboard.quickStats.nextBookingLabel}
            detail="Your next confirmed appointment at a glance."
          />
          <DashboardStatCard
            label="Pending Payment"
            value={dashboard.quickStats.pendingPaymentCountLabel}
            detail="Bookings waiting for payment proof verification."
          />
          <DashboardStatCard
            label="Completed Cuts"
            value={dashboard.quickStats.completedCutsLabel}
            detail="Premium cuts already completed on your account."
          />
          <DashboardStatCard
            label="Loyalty Progress"
            value={dashboard.quickStats.loyaltyProgressLabel}
            detail="How close you are to the next loyalty milestone."
          />
        </section>

        <CustomerDashboardTabs dashboard={dashboard} />
      </div>
    </div>
  )
}
