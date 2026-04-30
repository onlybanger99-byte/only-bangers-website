import type { UserRole } from '@/lib/auth/get-user-role'
import { formatBookingBarberName } from '@/lib/bookings/display'
import { listBookings } from '@/lib/bookings/service'
import { getCustomerProfileCompletionState } from '@/lib/customer-profiles/service'
import type { BookingRecord, BookingStatus } from '@/lib/bookings/types'
import {
  buildBookingWhatsAppMessage,
  buildBookingWhatsAppUrl,
} from '@/lib/whatsapp/booking-message'
import type {
  PortalBookingCard,
  PortalDashboardViewModel,
  PortalTaskItem,
} from './types'

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

function getInitials(firstName: string) {
  return firstName.slice(0, 2).toUpperCase()
}

function formatDateLabel(value?: string | null) {
  if (!value) {
    return 'Date pending'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return 'Date pending'
  }

  return new Intl.DateTimeFormat('en-ZA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed)
}

function formatTimeLabel(value?: string | null) {
  if (!value) {
    return 'Time pending'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return 'Time pending'
  }

  return new Intl.DateTimeFormat('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

function formatDateTimeLabel(value?: string | null) {
  if (!value) {
    return 'Date pending'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return 'Date pending'
  }

  return new Intl.DateTimeFormat('en-ZA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
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
  if (!value) {
    return null
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat('en-ZA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

function getAppointmentStatusMessage(status: BookingStatus) {
  if (status === 'pending_payment') {
    return 'Your booking is reserved while payment is being verified.'
  }

  if (status === 'confirmed') {
    return 'Your booking has been confirmed and the team has been notified.'
  }

  if (status === 'expired') {
    return 'The payment hold expired before confirmation. Reserve a new slot to continue.'
  }

  if (status === 'cancelled') {
    return 'This booking has been cancelled.'
  }

  if (status === 'completed') {
    return 'This appointment has been completed.'
  }

  return 'Your booking is being prepared.'
}

function getMembershipLabel(role: UserRole, completedVisits: number) {
  if (role === 'admin' || role === 'barber') {
    return 'Premium Member'
  }

  if (completedVisits >= 10) {
    return 'Gold Member'
  }

  if (completedVisits >= 5) {
    return 'Committed Member'
  }

  return 'Customer Member'
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
          input.booking.barber_name ??
          formatBookingBarberName(input.booking.barber_id),
        serviceName: input.booking.service_name,
        dateLabel: formatDateLabel(input.booking.starts_at),
        timeLabel: formatTimeLabel(input.booking.starts_at),
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
    service: booking.service_name,
    barberName: booking.barber_name ?? formatBookingBarberName(booking.barber_id),
    startsAt: booking.starts_at,
    dateLabel: formatDateLabel(booking.starts_at),
    timeLabel: formatTimeLabel(booking.starts_at),
    startsAtLabel: formatDateTimeLabel(booking.starts_at),
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
  const profile = profileState.profile
  const firstName = profile?.firstName || getFirstName(input.email)
  const fullName = profile?.fullName || getFullName(input.email)
  const phoneNumber = profile?.phoneNumber || 'Phone number pending'
  const profileImageUrl = profile?.profileImageUrl || '/images/header-bg.png'

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
        'We need a few more moments to load your booking activity. Your profile is still available, and you can continue booking from services.',
      account: {
        firstName,
        initials: getInitials(firstName),
        membershipLabel: getMembershipLabel(input.role, 0),
      },
      headerDescription:
        'Track your bookings, payments, tasks, and profile details in one premium customer portal.',
      nextAppointmentSummary:
        'Your dashboard is ready, but we could not load live booking activity right now.',
      quickStats: {
        nextBookingLabel: 'None yet',
        pendingPaymentCountLabel: '0',
        completedCutsLabel: '0',
        loyaltyProgressLabel: '0 / 10',
      },
      overview: {
        nextConfirmedBooking: null,
        pendingPaymentBooking: null,
      },
      bookings: {
        all: [],
        pendingPayment: [],
        confirmedUpcoming: [],
        completed: [],
        cancelledOrExpired: [],
      },
      payments: {
        pending: [],
        paid: [],
        failed: [],
      },
      tasks: profileState.isComplete
        ? [
            {
              id: 'book-next-cut',
              title: 'Book your next cut',
              description: 'Your profile is ready. Lock in your next premium appointment when you are ready.',
              tone: 'gold',
              actionHref: '/services',
              actionLabel: 'Book New Cut',
            },
          ]
        : [
            {
              id: 'complete-profile',
              title: 'Complete your profile',
              description: 'Add your customer details before your next booking checkout.',
              tone: 'rose',
              actionHref: '/portal/profile/complete?next=%2Fportal%2Fdashboard',
              actionLabel: 'Complete Profile',
            },
          ],
      history: [],
      visitSummary: {
        totalVisitsLabel: '0 bookings',
        spendToDateLabel: formatCurrency(0),
      },
      profile: {
        fullName,
        email: input.email,
        phoneNumber,
        profileImageUrl,
        preferredBarber: 'No preferred barber yet',
        groomingNotes:
          'Complete your next booking to build out your appointment history and service preferences.',
        accountRoleLabel: getRoleLabel(input.role),
        accountStatusLabel: 'Active account',
        profileCompletionLabel: profileState.isComplete ? 'Complete' : 'Needs attention',
        isComplete: profileState.isComplete,
        editProfileHref: '/portal/profile/complete?next=%2Fportal%2Fdashboard',
      },
      loyalty: {
        visitsCompleted: 0,
        progressValue: 0,
        progressTarget: 10,
        progressLabel: 'Your loyalty progress begins with your first completed premium session.',
        referralHeadline: 'Invite a friend into the Only Bangers experience.',
        perkCopy:
          'Referral rewards and member perks will appear here once you have completed visits on your account.',
      },
      media: [],
    }
  }

  const bookings = bookingsResult.data
    .map((booking) =>
      toPortalBookingCard({
        booking,
        customerName: fullName,
        phoneNumber,
      })
    )
    .sort(sortByStartsAtDescending)

  const now = Date.now()
  const pendingPayment = bookings
    .filter((booking) => booking.status === 'pending_payment')
    .sort(sortByStartsAtAscending)
  const confirmedUpcoming = bookings
    .filter((booking) => booking.status === 'confirmed' && new Date(booking.startsAt).getTime() >= now)
    .sort(sortByStartsAtAscending)
  const completed = bookings
    .filter((booking) => booking.status === 'completed')
    .sort(sortByStartsAtDescending)
  const cancelledOrExpired = bookings
    .filter((booking) => booking.status === 'cancelled' || booking.status === 'expired')
    .sort(sortByStartsAtDescending)
  const paidBookings = bookings
    .filter((booking) => booking.paymentStatus === 'paid' || booking.status === 'confirmed' || booking.status === 'completed')
    .sort(sortByStartsAtDescending)
  const failedPayments = bookings
    .filter(
      (booking) =>
        booking.paymentStatus === 'failed' ||
        booking.status === 'cancelled' ||
        booking.status === 'expired'
    )
    .sort(sortByStartsAtDescending)

  const nextConfirmedBooking = confirmedUpcoming[0] ?? null
  const pendingPaymentBooking = pendingPayment[0] ?? null
  const preferredBarber =
    bookings.find((booking) => booking.barberName)?.barberName || 'No preferred barber yet'
  const completedVisits = completed.length
  const totalSpend = completed.reduce((sum, booking) => sum + (booking.amountDueValue ?? 0), 0)
  const quickTasks: PortalTaskItem[] = []

  if (!profileState.isComplete) {
    quickTasks.push({
      id: 'complete-profile',
      title: 'Complete your profile',
      description: 'Add your required details before your next checkout so bookings can move smoothly.',
      tone: 'rose',
      actionHref: '/portal/profile/complete?next=%2Fportal%2Fdashboard',
      actionLabel: 'Complete Profile',
    })
  }

  if (pendingPaymentBooking) {
    quickTasks.push({
      id: 'send-proof',
      title: 'Send proof of payment',
      description: 'Your booking is being held while payment is verified on WhatsApp.',
      tone: 'gold',
      actionHref: pendingPaymentBooking.whatsappPaymentUrl ?? '/services',
      actionLabel: pendingPaymentBooking.whatsappPaymentUrl ? 'Open WhatsApp Payment' : 'View Booking',
    })
  }

  if (!nextConfirmedBooking) {
    quickTasks.push({
      id: 'book-next-cut',
      title: 'Book your next cut',
      description: 'You have no confirmed upcoming bookings right now.',
      tone: 'emerald',
      actionHref: '/services',
      actionLabel: 'Book New Cut',
    })
  }

  quickTasks.push({
    id: 'review-last-cut',
    title: 'Review your last cut',
    description: 'A customer review system has not been wired in yet, but this will live here soon.',
    tone: 'neutral',
    disabled: true,
  })

  return {
    source: 'live',
    sourceMessage:
      'Your account is connected to live booking activity. Upcoming appointments, payment holds, and profile details are up to date.',
    account: {
      firstName,
      initials: getInitials(firstName),
      membershipLabel: getMembershipLabel(input.role, completedVisits),
    },
    headerDescription:
      'Manage your cuts, payment holds, past visits, and account details in one premium portal.',
    nextAppointmentSummary: nextConfirmedBooking
      ? `Your next confirmed cut is ${nextConfirmedBooking.startsAtLabel} with ${nextConfirmedBooking.barberName}.`
      : pendingPaymentBooking
        ? 'You have a booking waiting for payment verification.'
        : 'You do not have a confirmed upcoming booking yet.',
    quickStats: {
      nextBookingLabel: nextConfirmedBooking?.dateLabel ?? 'None booked',
      pendingPaymentCountLabel: String(pendingPayment.length),
      completedCutsLabel: String(completedVisits),
      loyaltyProgressLabel: `${completedVisits % 10} / 10`,
    },
    overview: {
      nextConfirmedBooking,
      pendingPaymentBooking,
    },
    bookings: {
      all: bookings,
      pendingPayment,
      confirmedUpcoming,
      completed,
      cancelledOrExpired,
    },
    payments: {
      pending: pendingPayment,
      paid: paidBookings,
      failed: failedPayments,
    },
    tasks: quickTasks,
    history: completed,
    visitSummary: {
      totalVisitsLabel: `${bookings.length} total bookings`,
      spendToDateLabel: formatCurrency(totalSpend),
    },
    profile: {
      fullName,
      email: input.email,
      phoneNumber,
      profileImageUrl,
      preferredBarber,
      groomingNotes:
        'Your saved profile details help your barber prepare for each appointment and payment verification.',
      accountRoleLabel: getRoleLabel(input.role),
      accountStatusLabel: 'Active account',
      profileCompletionLabel: profileState.isComplete ? 'Complete' : 'Needs attention',
      isComplete: profileState.isComplete,
      editProfileHref: '/portal/profile/complete?next=%2Fportal%2Fdashboard',
    },
    loyalty: {
      visitsCompleted: completedVisits,
      progressValue: completedVisits % 10,
      progressTarget: 10,
      progressLabel:
        completedVisits > 0
          ? `${Math.max(0, 10 - (completedVisits % 10 || 10))} visits until your next milestone reward.`
          : 'Your loyalty progress begins with your first completed premium session.',
      referralHeadline: 'Invite a friend into the Only Bangers experience.',
      perkCopy:
        'Referral rewards, loyalty perks, and premium member offers can plug into this panel without changing the customer experience.',
    },
    media: [],
  }
}
