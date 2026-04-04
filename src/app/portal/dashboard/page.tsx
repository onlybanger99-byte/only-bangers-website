import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UserAuthHandler } from "@/components/UserAuthHandler";
import styles from "./dashboard.module.css";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userInitials = user.email
    ?.split("@")[0]
    .split(".")
    .map((part: string) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2) || "U";

  return (
    <>
      <UserAuthHandler userEmail={user.email || ''} />
      <div className="page-background">
      <div className={styles.dashboardContainer}>
        {/* Sidebar */}
        <aside className={styles.dashboardSidebar}>
          <nav className={styles.sidebarMenu}>
            <h3 className={styles.sidebarTitle}>Menu</h3>
            <a href="/services" className={styles.sidebarLink} aria-label="View services">
              <span>📋</span> Services
            </a>
            <a href="/products" className={styles.sidebarLink} aria-label="View products">
              <span>🛍️</span> Products
            </a>
            <a href="/cart" className={styles.sidebarLink} aria-label="View cart">
              <span>🛒</span> Cart
            </a>
            <a href="/about" className={styles.sidebarLink} aria-label="About us">
              <span>ℹ️</span> About
            </a>
            <form action="/auth/signout" method="post">
              <button type="submit" className={styles.signOutButton} aria-label="Sign out">
                <span>🚪</span> Sign out
              </button>
            </form>
          </nav>
        </aside>

        {/* Main Content */}
        <main className={styles.dashboardMain}>
          <h1 className={styles.dashboardTitle}>Welcome Back</h1>
          <p className={styles.welcomeMessage}>Manage your account and view bookings</p>

          <div className={styles.userInfo}>
            <div className={styles.userInfoLabel}>Signed in as</div>
            <div className={styles.userEmail}>{user.email}</div>
          </div>

          <section className={styles.contentSection}>
            <h2 className={styles.sectionTitle}>Your Bookings</h2>
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>📅</div>
              <p className={styles.emptyStateText}>No active bookings yet</p>
              <a href="/services" className={styles.cardButton}>Book an Appointment</a>
            </div>
          </section>

          <section className={styles.contentSection}>
            <h2 className={styles.sectionTitle}>Account Settings</h2>
            <div className={styles.sectionGrid}>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Profile</h3>
                <p className={styles.cardContent}>Manage your profile information and preferences</p>
                <div className={styles.cardAction}>
                  <a href="#" className={styles.cardButton} aria-label="Edit profile">Edit Profile</a>
                </div>
              </div>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Preferences</h3>
                <p className={styles.cardContent}>Update notification settings and preferences</p>
                <div className={styles.cardAction}>
                  <a href="#" className={styles.cardButton} aria-label="View preferences">Settings</a>
                </div>
              </div>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Help & Support</h3>
                <p className={styles.cardContent}>Get help and contact our support team</p>
                <div className={styles.cardAction}>
                  <a href="/contact" className={styles.cardButton} aria-label="Contact support">Contact Us</a>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
    </>
  );
}