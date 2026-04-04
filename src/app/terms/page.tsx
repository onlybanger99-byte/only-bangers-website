import styles from './policy.module.css'

export default function TermsPage() {
  return (
    <div className="page-background">
      <div className="main-content">
        <div className="page-header">
          <h1 className="page-title">Terms of Service</h1>
          <p className="page-subtitle">Our terms and conditions</p>
        </div>

        <div className={styles.policyContainer}>
          <section className={styles.policySection}>
            <h2 className={styles.sectionTitle}>1. Acceptance of Terms</h2>
            <p className={styles.sectionText}>
              By using our website or booking an appointment, you agree to these Terms of Service.
            </p>
          </section>

          <section className={styles.policySection}>
            <h2 className={styles.sectionTitle}>2. Booking & Payment</h2>
            <p className={styles.sectionText}>
              A 30% booking fee is required to secure your appointment. This fee is non‑refundable after 24 hours from booking.
            </p>
            <p className={styles.sectionText}>
              The remaining balance is payable in person. All prices are in South African Rand (ZAR).
            </p>
          </section>

          <section className={styles.policySection}>
            <h2 className={styles.sectionTitle}>3. Cancellation Policy</h2>
            <ul className={styles.sectionList}>
              <li>Cancel within 24 hours of booking → full refund of booking fee</li>
              <li>Cancel after 24 hours → booking fee forfeited</li>
              <li>No‑show → booking fee forfeited</li>
            </ul>
          </section>

          <section className={styles.policySection}>
            <h2 className={styles.sectionTitle}>4. Service Providers</h2>
            <p className={styles.sectionText}>
              Our barbers are carefully selected for their skill. Some may be in training. By booking, you acknowledge that not all barbers may hold formal licenses.
            </p>
          </section>

          <section className={styles.policySection}>
            <h2 className={styles.sectionTitle}>5. Liability</h2>
            <p className={styles.sectionText}>
              Only Bangers is not liable for allergic reactions, dissatisfaction with agreed‑upon styles, or lost/damaged personal items.
            </p>
          </section>

          <section className={styles.policySection}>
            <h2 className={styles.sectionTitle}>6. Changes to Terms</h2>
            <p className={styles.sectionText}>
              We may update these terms at any time. Continued use of our services constitutes acceptance of the new terms.
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