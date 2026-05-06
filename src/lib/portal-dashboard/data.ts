import type { UserRole } from '@/lib/auth/get-user-role'
import { getLatestBarberApplicationForUser } from '@/lib/barber-applications/service'
import { formatBookingBarberName } from '@/lib/bookings/display'
import { listBookings } from '@/lib/bookings/service'
import { getCustomerProfileCompletionState } from '@/lib/customer-profiles/service'
import type { BookingRecord, BookingStatus } from '@/lib/bookings/types'
import {
  buildBookingWhatsAppMessage,
  buildBookingWhatsAppUrl,
} from '@/lib/whatsapp/booking-message'
import { formatDate, formatDateTime, formatTime, isValidDateValue } from '@/lib/date-time'
import { getSafeImage } from '@/lib/safe-image'
import { getReviewForBooking } from '@/lib/barber-reviews/service'
import type { PortalBookingCard, PortalDashboardViewModel } from './types'

function getFirstName(email: string) {
  const localPart = email.split('@')[0] || 'customer'
  const firstSegment = localPart.split(/[._-]/)[0] || 'customer'

  return firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1)
}

function getFullName(email: string) {
  const localPart = email.split('@')[0] || 'customer'
  const segments = localPart
    .split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))

  if (segments.length === 0) {
    return 'Only Bangers Customer'
  }

  if (segments.length === 1) {
    return `${segments[0]} Customer`
  }

  return segments.join(' ')
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatOptionalCurrency(amount: number | null | undefined) {
  return typeof amount === 'number' ? formatCurrency(amount) : 'Amount pending'
}

function formatOptionalDateTime(value?: string | null) {
  if (!value || !isValidDateValue(value)) {
    return null
  }

  return formatDateTime(value)
}

function getAppointmentStatusMessage(status: BookingStatus) {
  if (status === 'pending_payment') {
    return 'Payment is still required before this booking is fully confirmed.'
  }

  if (status === 'confirmed') {
    return 'Your booking is confirmed and ready for the chair.'
  }

  if (status === 'cancelled') {
    return 'This booking has been cancelled.'
  }

  if (status === 'expired') {
    return 'This payment window expired before confirmation.'
  }

  if (status === 'completed') {
    return 'This appointment has already been completed.'
  }

  return 'Your booking is being prepared.'
}

function getRoleLabel(role: UserRole) {
  if (role === 'admin') {
    return 'Admin'
  }

  if (role === 'barber') {
    return 'Barber'
  }

  return 'Customer'
}

function buildPaymentUrl(input: {
  booking: BookingRecord
  customerName: string
  phoneNumber: string
}) {
  if (input.booking.whatsapp_redirect_url) {
    return input.booking.whatsapp_redirect_url
  }

  if (!input.booking.payment_reference || typeof input.booking.amount_due !== 'number') {
    return null
  }

  try {
    return buildBookingWhatsAppUrl(
      process.env.NEXT_PUBLIC_WHATSAPP_BOOKING_NUMBER ?? '',
      buildBookingWhatsAppMessage({
        customerName: input.customerName,
        phoneNumber: input.phoneNumber,
        barberName:
          input.booking.barber_name ?? formatBookingBarberName(input.booking.barber_id),
        serviceName: input.booking.service_name,
        dateLabel: formatDate(input.booking.starts_at),
        timeLabel: formatTime(input.booking.starts_at),
        bookingReference: input.booking.payment_reference,
        amountDueLabel: formatCurrency(input.booking.amount_due),
      })
    )
  } catch {
    return null
  }
}

function toPortalBookingCard(input: {
  booking: BookingRecord
  customerName: string
  phoneNumber: string
}): PortalBookingCard {
  const { booking } = input

  return {
    id: booking.id,
    reference: booking.payment_reference || `OB-${booking.id.slice(0, 8).toUpperCase()}`,
    service: booking.service_name || 'Service not specified',
    barberName:
      booking.barber_name ?? formatBookingBarberName(booking.barber_id) ?? 'Barber not assigned',
    startsAt: booking.starts_at,
    dateLabel: formatDate(booking.starts_at),
    timeLabel: formatTime(booking.starts_at),
    startsAtLabel: formatDateTime(booking.starts_at),
    status: booking.status,
    paymentStatus: booking.payment_status,
    statusMessage: getAppointmentStatusMessage(booking.status),
    amountDueLabel: formatOptionalCurrency(booking.amount_due),
    amountDueValue: booking.amount_due,
    pendingExpiresAtLabel: formatOptionalDateTime(booking.pending_expires_at),
    pendingExpiresAt: booking.pending_expires_at,
    whatsappPaymentUrl: buildPaymentUrl({
      booking,
      customerName: input.customerName,
      phoneNumber: input.phoneNumber,
    }),
  }
}

async function enrichReviewState(booking: PortalBookingCard): Promise<PortalBookingCard> {
  const existingReview = await getReviewForBooking(booking.id)
  const startsAt = new Date(booking.startsAt).getTime()
  const isPast = Number.isFinite(startsAt) && startsAt < Date.now()
  const isEligible =
    isPast &&
    (booking.status === 'completed' ||
      booking.status === 'paid' ||
      (booking.status === 'confirmed' && booking.paymentStatus === 'paid'))

  return {
    ...booking,
    reviewEligible: isEligible,
    hasReview: Boolean(existingReview),
  }
}

function sortByStartsAtAscending(left: PortalBookingCard, right: PortalBookingCard) {
  return new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime()
}

function sortByStartsAtDescending(left: PortalBookingCard, right: PortalBookingCard) {
  return new Date(right.startsAt).getTime() - new Date(left.startsAt).getTime()
}

export async function getPortalDashboardViewModel(input: {
  userId: string
  email: string
  role: UserRole
}): Promise<PortalDashboardViewModel> {
  const bookingsResult = await listBookings({
    userId: input.userId,
    limit: 100,
  })
  const profileState = await getCustomerProfileCompletionState(input.userId)
  const latestApplication = await getLatestBarberApplicationForUser(input.userId)
  const profile = profileState.profile
  const firstName = profile?.firstName || getFirstName(input.email)
  const fullName = profile?.fullName || getFullName(input.email)
  const phoneNumber = profile?.phoneNumber || 'Phone number pending'
  const profileImageUrl = profile?.profileImageUrl || getSafeImage(null)

  if (!bookingsResult.ok) {
    if (bookingsResult.code !== 'TABLE_MISSING') {
      console.error('[portal-dashboard] Failed to read bookings', {
        code: bookingsResult.code,
        message: bookingsResult.message,
        details: bookingsResult.details ?? [],
        portalUserId: input.userId,
      })
    }

    return {
      source: 'error',
      sourceMessage:
        'We could not load your booking activity right now, but you can still book or update your profile.',
      account: {
        firstName,
        initials: firstName.slice(0, 2).toUpperCase(),
      },
      bookings: {
        nextConfirmedBooking: null,
        pendingPaymentBooking: null,
        attentionPending: [],
        active: [],
        history: [],
      },
      profile: {
        fullName,
        email: input.email,
        phoneNumber,
        profileImageUrl,
        accountRoleLabel: getRoleLabel(input.role),
        profileCompletionLabel: profileState.isComplete ? 'Complete' : 'Needs attention',
        isComplete: profileState.isComplete,
        editProfileHref: '/portal/profile/complete?next=%2Fportal%2Fdashboard',
      },
      barberApplication: buildBarberApplicationSummary(profileState.isComplete, latestApplication),
      reviewPrompt: {
        booking: null,
      },
    }
  }

  const bookings = (
    await Promise.all(
      bookingsResult.data.map((booking) =>
        enrichReviewState(
          toPortalBookingCard({
            booking,
            customerName: fullName,
            phoneNumber,
          })
        )
      )
    )
  ).sort(sortByStartsAtDescending)

  const now = Date.now()
  const pendingPayment = bookings
    .filter((booking) => booking.status === 'pending_payment')
    .sort(sortByStartsAtAscending)
  const confirmedUpcoming = bookings
    .filter(
      (booking) => booking.status === 'confirmed' && new Date(booking.startsAt).getTime() >= now
    )
    .sort(sortByStartsAtAscending)
  const history = bookings
    .filter((booking) => {
      if (booking.status === 'cancelled' || booking.status === 'expired' || booking.status === 'completed') {
        return true
      }

      return booking.status === 'confirmed' && new Date(booking.startsAt).getTime() < now
    })
    .sort(sortByStartsAtDescending)
  const reviewPromptBooking =
    history.find((booking) => booking.reviewEligible && !booking.hasReview) ?? null

  return {
    source: 'live',
    sourceMessage: 'Your dashboard is synced with your latest bookings and payment state.',
    account: {
      firstName,
      initials: firstName.slice(0, 2).toUpperCase(),
    },
    bookings: {
      nextConfirmedBooking: confirmedUpcoming[0] ?? null,
      pendingPaymentBooking: pendingPayment[0] ?? null,
      attentionPending: pendingPayment.slice(1),
      active: [...pendingPayment, ...confirmedUpcoming].sort(sortByStartsAtAscending),
      history,
    },
    profile: {
      fullName,
      email: input.email,
      phoneNumber,
      profileImageUrl,
      accountRoleLabel: getRoleLabel(input.role),
      profileCompletionLabel: profileState.isComplete ? 'Complete' : 'Needs attention',
      isComplete: profileState.isComplete,
      editProfileHref: '/portal/profile/complete?next=%2Fportal%2Fdashboard',
    },
    barberApplication: buildBarberApplicationSummary(profileState.isComplete, latestApplication),
    reviewPrompt: {
      booking: reviewPromptBooking,
    },
  }
}

function buildBarberApplicationSummary(
  isProfileComplete: boolean,
  latestApplication: Awaited<ReturnType<typeof getLatestBarberApplicationForUser>>
) {
  if (!isProfileComplete) {
    return {
      status: 'none' as const,
      canApply: false,
      ctaHref: '/portal/profile/complete?next=%2Fportal%2Fbarber-application',
      ctaLabel: 'Complete Profile',
      title: 'Become a Barber',
      description: 'Complete your profile before applying to become a barber.',
      rejectionReason: null,
    }
  }

  if (!latestApplication) {
    return {
      status: 'none' as const,
      canApply: true,
      ctaHref: '/portal/barber-application',
      ctaLabel: 'Apply to Become a Barber',
      title: 'Become a Barber',
      description: 'Share your cutting location, socials, and availability for admin review.',
      rejectionReason: null,
    }
  }

  if (latestApplication.status === 'pending') {
    return {
      status: 'pending' as const,
      canApply: false,
      ctaHref: '/portal/dashboard',
      ctaLabel: 'Pending Review',
      title: 'Barber application pending review',
      description: 'Your application is in the admin review queue and will stay here until it is approved or rejected.',
      rejectionReason: null,
    }
  }

  if (latestApplication.status === 'approved') {
    return {
      status: 'approved' as const,
      canApply: false,
      ctaHref: '/barber/dashboard',
      ctaLabel: 'Go to Barber Dashboard',
      title: 'You are approved as a barber',
      description: 'Your barber role is active and your profile is now available in the barber workspace.',
      rejectionReason: null,
    }
  }

  return {
    status: 'rejected' as const,
    canApply: true,
    ctaHref: '/portal/barber-application',
    ctaLabel: 'Apply Again',
    title: 'Application needs updates',
    description: 'Your last application was reviewed and you can submit a stronger version after updating the details below.',
    rejectionReason: latestApplication.rejectionReason,
  }
}
