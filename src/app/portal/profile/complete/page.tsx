import { redirect } from 'next/navigation'
import { CompleteProfileForm } from '@/components/CompleteProfileForm'
import { sanitizeNextPath } from '@/lib/auth/next-path'
import { getUserRole } from '@/lib/auth/get-user-role'
import { getDefaultDashboardForRole } from '@/lib/auth/roles'
import { getCustomerProfile } from '@/lib/customer-profiles/service'
import styles from './complete.module.css'

export const dynamic = 'force-dynamic'

export default async function CompleteProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; setup?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const requestedNextPath = sanitizeNextPath(resolvedSearchParams.next)
  const { user, role } = await getUserRole()

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(requestedNextPath ?? '/portal/dashboard')}`)
  }
  const resolvedRole = role ?? 'customer'
  const defaultDashboard = getDefaultDashboardForRole(resolvedRole)
  const nextPath =
    resolvedRole === 'customer' && requestedNextPath && !requestedNextPath.startsWith('/portal/profile/complete')
      ? requestedNextPath
      : defaultDashboard

  const profile = await getCustomerProfile(user.id)

  if (profile?.isComplete) {
    redirect(nextPath)
  }

  return (
    <div className="page-background">
      <div className={styles.shell}>
        <div className={styles.heroCard}>
          <p className={styles.eyebrow}>Complete your profile</p>
          <h1 className={styles.title}>We need a few more details before you can continue</h1>
          <p className={styles.subtitle}>
            Add your name, phone number, and a password so your dashboard and booking flow can continue
            without interruption.
          </p>
        </div>

        <CompleteProfileForm
          nextPath={nextPath}
          initialProfile={profile}
          requirePasswordSetup={true}
        />
      </div>
    </div>
  )
}
