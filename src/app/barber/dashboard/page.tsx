import { redirect } from 'next/navigation'
import { BarberDashboardTabs } from '@/components/barber/BarberDashboardTabs'
import { getUserRole } from '@/lib/auth/get-user-role'
import { getDefaultDashboardForRole } from '@/lib/auth/roles'
import { getBarberDashboardViewModel } from '@/lib/barber-dashboard/data'
import { listActiveSiteContent } from '@/lib/site-content/service'
import { getSiteImage } from '@/lib/site-content/public'
import styles from './dashboard.module.css'

export const dynamic = 'force-dynamic'

export default async function BarberDashboardPage() {
  const { user, role } = await getUserRole()

  if (!user?.email) {
    redirect('/login')
  }

  if (role !== 'barber') {
    redirect(getDefaultDashboardForRole(role))
  }

  const dashboard = await getBarberDashboardViewModel({
    userId: user.id,
    email: user.email,
  })
  const siteContent = await listActiveSiteContent()
  const barberBackground =
    getSiteImage(siteContent.ok ? siteContent.map : {}, ['barber_dashboard_background', 'global_page_background']) ??
    null

  if (!dashboard?.operator) {
    return null
  }

  return (
    <div
      className="page-background"
      style={
        barberBackground
          ? {
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.88), rgba(0, 0, 0, 0.92)), url('${barberBackground}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      <div className={styles.shell}>
        <BarberDashboardTabs dashboard={dashboard} />
      </div>
    </div>
  )
}
