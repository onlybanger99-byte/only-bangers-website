import styles from './policy.module.css'

export default function PrivacyPage() {
  return (
    <div className="page-background">
      <div className="main-content">
        <div className="page-header">
          <h1 className="page-title">Privacy Policy</h1>
          <p className="page-subtitle">How we handle your data</p>
        </div>

        <div className={styles.policyContainer}>
          <section className={styles.policySection}>
            <h2 className={styles.sectionTitle}>1. Information We Collect</h2>
            <p className={styles.sectionText}>
              We collect information you provide directly to us, such as your name, email, phone number, and booking preferences when you schedule an appointment or purchase products.
            </p>
            <p className={styles.sectionText}>
              Automatically, we collect usage data like IP address, browser type, and pages visited to improve our services.
            </p>
          </section>

          <section className={styles.policySection}>
            <h2 className={styles.sectionTitle}>2. How We Use Your Information</h2>
            <ul className={styles.sectionList}>
              <li>Process bookings and payments</li>
              <li>Send confirmations and reminders</li>
              <li>Improve our website and services</li>
              <li>Respond to inquiries</li>
            </ul>
          </section>

          <section className={styles.policySection}>
            <h2 className={styles.sectionTitle}>3. Data Sharing</h2>
            <p className={styles.sectionText}>
              We do not sell your personal information. We may share data with third‑party service providers (payment processors, email services) only as necessary to operate our business.
            </p>
          </section>

          <section className={styles.policySection}>
            <h2 className={styles.sectionTitle}>4. Security</h2>
            <p className={styles.sectionText}>
              We use reasonable security measures to protect your data. However, no internet transmission is 100% secure.
            </p>
          </section>

          <section className={styles.policySection}>
            <h2 className={styles.sectionTitle}>5. Your Rights</h2>
            <p className={styles.sectionText}>
              You may request access, correction, or deletion of your personal data by contacting us.
            </p>
          </section>

          <div className={styles.lastUpdated}>
            <p>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>
    </div>
  )
}