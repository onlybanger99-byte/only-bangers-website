import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AppointmentCard } from '@/components/portal-dashboard/AppointmentCard'
import { LoyaltyCard } from '@/components/portal-dashboard/LoyaltyCard'
import { MediaCard } from '@/components/portal-dashboard/MediaCard'
import { PortalStatCard } from '@/components/portal-dashboard/PortalStatCard'
import { ProfileCard } from '@/components/portal-dashboard/ProfileCard'
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
                <p className={styles.eyebrow}>Only Bangers Member Area</p>
                <h1 className={styles.heroTitle}>
                  Welcome back, {dashboard.account.firstName}
                </h1>
                <p className={styles.heroText}>{dashboard.nextAppointmentSummary}</p>
              </div>
            </div>

            <div className={styles.heroMeta}>
              <span className={styles.membershipBadge}>
                {dashboard.account.membershipLabel}
              </span>
              <div className={styles.dataModeCard} data-source={dashboard.source}>
                {dashboard.sourceMessage}
              </div>
            </div>
          </header>

          <section className={styles.statsGrid} aria-label="Member overview">
            <PortalStatCard
              label="Upcoming Appointments"
              value={String(dashboard.upcomingAppointments.length)}
              detail="Your next sessions lined up with the team."
            />
            <PortalStatCard
              label="Visit Summary"
              value={dashboard.visitSummary.totalVisitsLabel}
              detail="A quick snapshot of your recent Only Bangers rhythm."
            />
            <PortalStatCard
              label="Lifetime Spend"
              value={dashboard.visitSummary.spendToDateLabel}
              detail="Your premium grooming investment to date."
            />
          </section>

          <div className={styles.contentGrid}>
            <section className={styles.panel}>
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.eyebrow}>Upcoming Bookings</p>
                  <h2 className={styles.sectionTitle}>Your next appointments</h2>
                </div>
                <Link href="/services" className={styles.inlineLink}>
                  Book Another
                </Link>
              </div>

              {dashboard.upcomingAppointments.length > 0 ? (
                <div className={styles.listGrid}>
                  {dashboard.upcomingAppointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                    />
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <h3 className={styles.cardTitle}>No upcoming bookings yet</h3>
                  <p className={styles.cardText}>
                    Book your next premium cut when you are ready. Your next session
                    will appear here with barber, service, and timing details.
                  </p>
                  <Link href="/services" className={styles.primaryLink}>
                    Explore Services
                  </Link>
                </div>
              )}
            </section>

            <section className={styles.panel}>
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.eyebrow}>Profile</p>
                  <h2 className={styles.sectionTitle}>Account and preferences</h2>
                </div>
              </div>

              <ProfileCard profile={dashboard.profile} />
            </section>

            <section className={styles.panel}>
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.eyebrow}>Booking History</p>
                  <h2 className={styles.sectionTitle}>Previous visits</h2>
                </div>
              </div>

              {dashboard.bookingHistory.length > 0 ? (
                <div className={styles.historyGrid}>
                  {dashboard.bookingHistory.map((visit) => (
                    <article key={visit.id} className={styles.historyCard}>
                      <div>
                        <h3 className={styles.cardTitle}>{visit.service}</h3>
                        <p className={styles.cardMeta}>With {visit.barberName}</p>
                      </div>
                      <div className={styles.historyMeta}>
                        <span>{visit.completedAtLabel}</span>
                        <strong>{visit.spendLabel}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <h3 className={styles.cardTitle}>Your visit history starts here</h3>
                  <p className={styles.cardText}>
                    Completed appointments will build out your service history and spend summary automatically.
                  </p>
                </div>
              )}
            </section>

            <section className={styles.panel}>
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.eyebrow}>Loyalty and Value</p>
                  <h2 className={styles.sectionTitle}>Member progress</h2>
                </div>
              </div>

              <LoyaltyCard loyalty={dashboard.loyalty} />
            </section>

            <section className={styles.panel}>
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.eyebrow}>Transformation Media</p>
                  <h2 className={styles.sectionTitle}>Your style archive</h2>
                </div>
              </div>

              {dashboard.media.length > 0 ? (
                <div className={styles.mediaGrid}>
                  {dashboard.media.map((item) => (
                    <MediaCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <h3 className={styles.cardTitle}>No media saved yet</h3>
                  <p className={styles.cardText}>
                    Transformation photos and featured visit media can live here once your appointments are connected to captured content.
                  </p>
                </div>
              )}
            </section>

            <section className={styles.panel}>
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.eyebrow}>Keep the Momentum</p>
                  <h2 className={styles.sectionTitle}>Next steps</h2>
                </div>
              </div>

              <div className={styles.ctaGrid}>
                <Link href="/services" className={styles.ctaCard}>
                  <h3 className={styles.cardTitle}>Book Another Appointment</h3>
                  <p className={styles.cardText}>
                    Lock in your next session while the timing works for you.
                  </p>
                </Link>
                <Link href="/services" className={styles.ctaCard}>
                  <h3 className={styles.cardTitle}>Browse Services</h3>
                  <p className={styles.cardText}>
                    Explore grooming experiences, add-ons, and signature finishes.
                  </p>
                </Link>
                <Link href="/contact" className={styles.ctaCard}>
                  <h3 className={styles.cardTitle}>Contact Support</h3>
                  <p className={styles.cardText}>
                    Reach the team for booking help, account updates, or special requests.
                  </p>
                </Link>
              </div>
            </section>
          </div>
      </div>
    </div>
  )
}
