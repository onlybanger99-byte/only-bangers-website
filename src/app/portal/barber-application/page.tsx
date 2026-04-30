import { redirect } from 'next/navigation'
import { BarberApplicationForm } from '@/components/portal/BarberApplicationForm'
import { getUserRole } from '@/lib/auth/get-user-role'
import { getDefaultDashboardForRole } from '@/lib/auth/roles'
import { getLatestBarberApplicationForUser } from '@/lib/barber-applications/service'
import { getCustomerProfileCompletionState } from '@/lib/customer-profiles/service'
import styles from './barber-application.module.css'

export const dynamic = 'force-dynamic'

export default async function BarberApplicationPage() {
  const { user, role } = await getUserRole()

  if (!user) {
    redirect('/login')
  }

  if (role !== 'customer') {
    redirect(getDefaultDashboardForRole(role))
  }

  const [profileState, latestApplication] = await Promise.all([
    getCustomerProfileCompletionState(user.id),
    getLatestBarberApplicationForUser(user.id),
  ])

  if (!profileState.isComplete) {
    redirect('/portal/profile/complete?next=%2Fportal%2Fbarber-application')
  }

  if (latestApplication?.status === 'pending') {
    redirect('/portal/dashboard')
  }

  if (latestApplication?.status === 'approved') {
    redirect('/barber/dashboard')
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.heroCard}>
          <p className={styles.eyebrow}>Barber Application</p>
          <h1 className={styles.title}>Apply to join the Only Bangers barber lineup</h1>
          <p className={styles.text}>
            Share where you cut, how clients can view your work, and when you are available. Admin will review your application before your barber role is activated.
          </p>
        </section>

        <section className={styles.formCard}>
          <h2 className={styles.cardTitle}>Application details</h2>
          <p className={styles.text}>
            At least one social profile or portfolio link is required so admin can review your work.
          </p>

          <BarberApplicationForm
            initialValues={
              latestApplication?.status === 'rejected'
                ? {
                    cuttingLocation: latestApplication.cuttingLocation,
                    instagramUrl: latestApplication.instagramUrl ?? '',
                    tiktokUrl: latestApplication.tiktokUrl ?? '',
                    facebookUrl: latestApplication.facebookUrl ?? '',
                    portfolioUrl: latestApplication.portfolioUrl ?? '',
                    bio: latestApplication.bio,
                    availableDays: latestApplication.availableDays,
                    availableStartTime: latestApplication.availableStartTime ?? '',
                    availableEndTime: latestApplication.availableEndTime ?? '',
                    notes: latestApplication.notes ?? '',
                  }
                : undefined
            }
          />
        </section>
      </div>
    </div>
  )
}
