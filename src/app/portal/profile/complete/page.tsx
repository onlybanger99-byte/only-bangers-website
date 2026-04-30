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
  searchParams: Promise<{ next?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const requestedNextPath = sanitizeNextPath(resolvedSearchParams.next)
  const nextPath =
    requestedNextPath && !requestedNextPath.startsWith('/portal/profile/complete')
      ? requestedNextPath
      : '/portal/dashboard'
  const { user, role } = await getUserRole()

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`)
  }

  if (role && role !== 'customer') {
    redirect(getDefaultDashboardForRole(role))
  }

  const profile = await getCustomerProfile(user.id)

  if (profile?.isComplete) {
    redirect(nextPath)
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.heroCard}>
          <p className={styles.eyebrow}>Complete your profile</p>
          <h1 className={styles.title}>We need a few more details before you can continue</h1>
          <p className={styles.subtitle}>
            Add your name, phone number, and profile photo so your dashboard and booking flow
            can continue without interruption.
          </p>
        </div>

        <CompleteProfileForm nextPath={nextPath} initialProfile={profile} />
      </div>
    </div>
  )
}
