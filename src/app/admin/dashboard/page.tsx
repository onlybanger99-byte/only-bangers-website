import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AdminDashboardTabs } from '@/components/admin/AdminDashboardTabs'
import { getUserRole } from '@/lib/auth/get-user-role'
import { getDefaultDashboardForRole } from '@/lib/auth/roles'
import { getAdminDashboardViewModel } from '@/lib/admin-dashboard/data'
import { listActiveSiteContent } from '@/lib/site-content/service'
import { getSiteContentImage, getSiteImage } from '@/lib/site-content/public'
import styles from './dashboard.module.css'

export const dynamic = 'force-dynamic'

type AdminTabId =
  | 'pending-actions'
  | 'overview'
  | 'bookings'
  | 'barbers'
  | 'users'
  | 'services'
  | 'products'
  | 'settings'

const VALID_TABS = new Set<AdminTabId>([
  'pending-actions',
  'overview',
  'bookings',
  'barbers',
  'users',
  'services',
  'products',
  'settings',
] as const)

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { user, role } = await getUserRole()

  if (!user?.email) {
    redirect('/login')
  }

  if (role !== 'admin') {
    redirect(getDefaultDashboardForRole(role))
  }

  const resolvedSearchParams = await searchParams
  const current = {
    booking_q: typeof resolvedSearchParams.booking_q === 'string' ? resolvedSearchParams.booking_q : '',
    booking_status:
      typeof resolvedSearchParams.booking_status === 'string'
        ? resolvedSearchParams.booking_status
        : '',
    booking_sort:
      typeof resolvedSearchParams.booking_sort === 'string'
        ? resolvedSearchParams.booking_sort
        : 'starts_at',
    booking_direction:
      typeof resolvedSearchParams.booking_direction === 'string'
        ? resolvedSearchParams.booking_direction
        : 'desc',
    booking_page:
      typeof resolvedSearchParams.booking_page === 'string'
        ? resolvedSearchParams.booking_page
        : '1',
    tab: typeof resolvedSearchParams.tab === 'string' ? resolvedSearchParams.tab : 'pending-actions',
  }

  const dashboard = await getAdminDashboardViewModel({
    userId: user.id,
    email: user.email,
    bookingQuery: current.booking_q,
    bookingStatus: current.booking_status,
    bookingSort:
      current.booking_sort === 'created_at' || current.booking_sort === 'status'
        ? current.booking_sort
        : 'starts_at',
    bookingDirection: current.booking_direction === 'asc' ? 'asc' : 'desc',
  })

  const initialTab: AdminTabId = VALID_TABS.has(current.tab as AdminTabId)
    ? (current.tab as AdminTabId)
    : 'pending-actions'
  const siteContent = await listActiveSiteContent()
  const adminBackground =
    getSiteImage(siteContent.ok ? siteContent.map : {}, ['admin_dashboard_background', 'global_page_background']) ??
    null

  return (
    <div
      className="page-background"
      style={
        adminBackground
          ? {
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.88), rgba(0, 0, 0, 0.92)), url('${adminBackground}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      <div className={styles.shell}>
        <header className={styles.panelCard}>
          <div className={styles.heroCopy}>
            <div>
              <p className={styles.eyebrow}>Operational control center</p>
              <h1 className={styles.sectionTitle}>Admin dashboard</h1>
              <p className={styles.heroText}>Clear actions, manage the platform, and keep public content current.</p>
            </div>
          </div>

          <div className={styles.heroMeta}>
            <div className={styles.identityCard}>
              <span className={styles.metaLabel}>Signed in as</span>
              <strong className={styles.metaValue}>{user.email}</strong>
              <p className={styles.cardSubmeta}>Admin access verified.</p>
            </div>

            <div className={styles.inlineActions}>
              <Link href="/portal/dashboard" className={styles.secondaryButton}>
                Customer View
              </Link>
              <Link href="/barber/dashboard" className={styles.secondaryButton}>
                Barber View
              </Link>
              <form action="/auth/signout" method="post">
                <button type="submit" className={styles.primaryButton}>
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </header>

        <AdminDashboardTabs dashboard={dashboard} current={current} initialTab={initialTab} />
      </div>
    </div>
  )
}
