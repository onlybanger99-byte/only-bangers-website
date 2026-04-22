import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/auth/get-user-role'
import { getDefaultDashboardForRole } from '@/lib/auth/roles'
import styles from './admin.module.css'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const { user, role } = await getUserRole()

  if (!user?.email) {
    redirect('/login')
  }

  if (role === 'admin') {
    redirect('/admin/dashboard')
  }

  if (role) {
    redirect(getDefaultDashboardForRole(role))
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Admin Access</h1>
          <p className={styles.subtitle}>Role-Based Access Control</p>
          <p className={styles.roleLabel}>
            Signed in as <strong>{user.email}</strong>
          </p>
        </div>

        <form action="/auth/signout" method="post">
          <button type="submit" className={styles.logoutButton}>
            Sign Out
          </button>
        </form>
      </header>

      <main className={styles.main}>
        <section className={styles.messageCard}>
          <div className={styles.messageIcon}>Locked</div>
          <h2 className={styles.messageTitle}>Admin approval required</h2>
          <p className={styles.messageText}>
            Your account is authenticated, but it does not currently have an
            admin-facing role.
          </p>
          <p className={styles.messageSubtext}>
            Current role: <strong>{role || 'none'}</strong>
          </p>
          <p className={styles.messageHint}>
            Ask an administrator to assign the `admin` role in the `user_roles` table.
          </p>

          <Link href="/portal/dashboard" className={styles.logoutButton}>
            Go To Customer Dashboard
          </Link>
        </section>
      </main>
    </div>
  )
}
