import Link from 'next/link'
import type { PortalBookingCard } from '@/lib/portal-dashboard/types'
import styles from '@/app/portal/dashboard/dashboard.module.css'
import { BookingStatusBadge } from './BookingStatusBadge'

export function PaymentCard({
  booking,
}: {
  booking: PortalBookingCard
}) {
  return (
    <article className={styles.paymentCard}>
      <div className={styles.paymentTop}>
        <div>
          <p className={styles.bookingReference}>{booking.reference}</p>
          <h3 className={styles.cardTitle}>{booking.amountDueLabel}</h3>
          <p className={styles.cardMeta}>{booking.service}</p>
        </div>

        <div className={styles.badgeCluster}>
          <BookingStatusBadge value={booking.paymentStatus} kind="payment" />
          <BookingStatusBadge value={booking.status} />
        </div>
      </div>

      <div className={styles.bookingMetaGrid}>
        <div>
          <span className={styles.infoLabel}>Appointment</span>
          <span className={styles.infoValue}>{booking.startsAtLabel}</span>
        </div>
        <div>
          <span className={styles.infoLabel}>Barber</span>
          <span className={styles.infoValue}>{booking.barberName}</span>
        </div>
      </div>

      {booking.status === 'pending_payment' && booking.whatsappPaymentUrl ? (
        <div className={styles.inlineActions}>
          <Link href={booking.whatsappPaymentUrl} className={styles.primaryLink}>
            Open WhatsApp Payment
          </Link>
        </div>
      ) : null}
    </article>
  )
}
