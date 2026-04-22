import { redirect } from 'next/navigation'
import { BarberDashboardClient } from '@/components/barber-dashboard/BarberDashboardClient'
import { getUserRole } from '@/lib/auth/get-user-role'
import { getDefaultDashboardForRole } from '@/lib/auth/roles'
import { getBarberDashboardViewModel } from '@/lib/barber-dashboard/data'
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

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <BarberDashboardClient dashboard={dashboard} />
      </div>
    </div>
  )
}
