import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AdminDashboardTabs } from '@/components/admin/AdminDashboardTabs'
import { getUserRole } from '@/lib/auth/get-user-role'
import { getDefaultDashboardForRole } from '@/lib/auth/roles'
import { getAdminDashboardViewModel } from '@/lib/admin-dashboard/data'
import styles from './dashboard.module.css'

export const dynamic = 'force-dynamic'

type AdminTabId =
  | 'overview'
  | 'bookings'
  | 'users'
  | 'barbers'
  | 'barber-applications'

const VALID_TABS = new Set<AdminTabId>([
  'overview',
  'bookings',
  'users',
  'barbers',
  'barber-applications',
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
    tab: typeof resolvedSearchParams.tab === 'string' ? resolvedSearchParams.tab : 'overview',
  }

  const dashboard = await getAdminDashboardViewModel({
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
    : 'overview'

  return (
    <div className="page-background">
      <div className={styles.shell}>
        <header className={styles.panelCard}>
          <div className={styles.heroCopy}>
            <div>
              <p className={styles.eyebrow}>Only Bangers Operations</p>
              <h1 className={styles.sectionTitle}>Admin command center</h1>
              <p className={styles.heroText}>
                Signed in with admin access. Use the dashboard below to review approvals, manage bookings, and control user roles.
              </p>
            </div>
          </div>

          <div className={styles.heroMeta}>
            <div className={styles.identityCard}>
              <span className={styles.metaLabel}>Signed in as</span>
              <strong className={styles.metaValue}>{user.email}</strong>
              <p className={styles.cardSubmeta}>Admin role verified for full operational control.</p>
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
