import { redirect } from 'next/navigation'
import Image from 'next/image'
import { BarberDashboardTabs } from '@/components/barber/BarberDashboardTabs'
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
        <header className={styles.heroCard}>
          <div className={styles.heroCopy}>
            <Image
              src={dashboard.operator.image}
              alt={dashboard.operator.displayName}
              width={84}
              height={84}
              className={styles.heroAvatar}
            />
            <div>
              <p className={styles.eyebrow}>Barber Portal</p>
              <h1 className={styles.heroTitle}>{dashboard.operator.displayName}</h1>
              <p className={styles.cardMeta}>{dashboard.operator.specialty}</p>
              <p className={styles.heroText}>{dashboard.operator.focusNote}</p>
            </div>
          </div>

          <div className={styles.heroMeta}>
            <div className={styles.panelCard}>
              <span className={styles.metaLabel}>Shift</span>
              <strong className={styles.metaValue}>{dashboard.operator.shiftLabel}</strong>
              <p className={styles.cardSubmeta}>
                {dashboard.dataSource === 'live'
                  ? 'Live schedule connected.'
                  : 'Development fallback data in use.'}
              </p>
            </div>
          </div>
        </header>

        <BarberDashboardTabs dashboard={dashboard} />
      </div>
    </div>
  )
}
