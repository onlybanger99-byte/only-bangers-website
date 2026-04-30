import Link from 'next/link'
import type { PortalBookingCard } from '@/lib/portal-dashboard/types'
import styles from '@/app/portal/dashboard/dashboard.module.css'
import { BookingStatusBadge } from './BookingStatusBadge'

export function BookingCard({
  booking,
}: {
  booking: PortalBookingCard
}) {
  return (
    <article className={styles.bookingCard}>
      <div className={styles.bookingTop}>
        <div>
          <p className={styles.bookingReference}>{booking.reference}</p>
          <h3 className={styles.cardTitle}>{booking.service}</h3>
          <p className={styles.cardMeta}>With {booking.barberName}</p>
        </div>

        <div className={styles.badgeCluster}>
          <BookingStatusBadge value={booking.status} />
          <BookingStatusBadge value={booking.paymentStatus} kind="payment" />
        </div>
      </div>

      <div className={styles.bookingMetaGrid}>
        <div>
          <span className={styles.infoLabel}>Date</span>
          <span className={styles.infoValue}>{booking.dateLabel}</span>
        </div>
        <div>
          <span className={styles.infoLabel}>Time</span>
          <span className={styles.infoValue}>{booking.timeLabel}</span>
        </div>
        <div>
          <span className={styles.infoLabel}>Amount Due</span>
          <span className={styles.infoValue}>{booking.amountDueLabel}</span>
        </div>
      </div>

      <p className={styles.cardText}>{booking.statusMessage}</p>

      {booking.status === 'pending_payment' ? (
        <div className={styles.pendingCallout}>
          <p className={styles.pendingText}>
            Send proof of payment on WhatsApp to confirm your booking.
          </p>
          {booking.pendingExpiresAtLabel ? (
            <p className={styles.pendingExpiry}>Held until {booking.pendingExpiresAtLabel}</p>
          ) : null}
        </div>
      ) : null}

      {booking.whatsappPaymentUrl && booking.status === 'pending_payment' ? (
        <div className={styles.inlineActions}>
          <Link href={booking.whatsappPaymentUrl} className={styles.primaryLink}>
            Open WhatsApp Payment
          </Link>
        </div>
      ) : null}
    </article>
  )
}
