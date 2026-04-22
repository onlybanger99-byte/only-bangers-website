import type { UserRole } from '@/lib/auth/get-user-role'
import { formatBookingBarberName } from '@/lib/bookings/display'
import { listBookings } from '@/lib/bookings/service'
import { createMockPortalDashboardData } from './mock-data'
import type {
  PortalAppointment,
  PortalDashboardViewModel,
  PortalHistoryItem,
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

function formatShortDate(value?: string | null) {
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

function formatHistoryDate(value?: string | null) {
  if (!value) {
    return 'Visit pending'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return 'Visit pending'
  }

  return new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed)
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(amount)
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

export async function getPortalDashboardViewModel(input: {
  userId: string
  email: string
  role: UserRole
}): Promise<PortalDashboardViewModel> {
  const mock = createMockPortalDashboardData(input.email)
  const bookingsResult = await listBookings({
    userId: input.userId,
    limit: 12,
  })

  if (!bookingsResult.ok) {
    if (bookingsResult.code !== 'TABLE_MISSING') {
      console.error('[portal-dashboard] Failed to read bookings:', bookingsResult)
    }

    return mock
  }

  const rows = bookingsResult.data

  if (rows.length === 0) {
    return {
      ...mock,
      source: 'live',
      sourceMessage:
        'Your member area is live. Booking history will populate as soon as your first appointment is recorded.',
      upcomingAppointments: [],
      bookingHistory: [],
      nextAppointmentSummary:
        'You do not have an upcoming booking yet. Choose your next premium session when you are ready.',
      visitSummary: {
        totalVisitsLabel: '0 visits',
        spendToDateLabel: formatCurrency(0),
      },
      media: [],
    }
  }

  const upcomingAppointments: PortalAppointment[] = rows
    .filter((booking) => {
      const startsAt = booking.starts_at ? new Date(booking.starts_at).getTime() : 0
      return startsAt >= Date.now()
    })
    .slice()
    .reverse()
    .slice(0, 3)
    .map((booking) => ({
      id: booking.id,
      service: booking.service_name,
      barberName: formatBookingBarberName(booking.barber_id),
      startsAt: booking.starts_at,
      startsAtLabel: formatShortDate(booking.starts_at),
      status: booking.status,
    }))

  const bookingHistory: PortalHistoryItem[] = rows
    .filter((booking) => {
      const startsAt = booking.starts_at ? new Date(booking.starts_at).getTime() : 0
      return startsAt < Date.now()
    })
    .slice(0, 5)
    .map((booking) => ({
      id: booking.id,
      service: booking.service_name,
      barberName: formatBookingBarberName(booking.barber_id),
      completedAtLabel: formatHistoryDate(booking.starts_at),
      spendLabel: 'Spend sync pending',
    }))

  const firstName = getFirstName(input.email)
  const fullName = getFullName(input.email)
  const preferredBarber =
    formatBookingBarberName(rows.find((booking) => booking.barber_id)?.barber_id)
  const completedVisits = bookingHistory.length

  return {
    source: 'live',
    sourceMessage:
      'Your account is connected to live booking activity. Loyalty, media, and profile modules are ready for deeper Supabase integration.',
    account: {
      firstName,
      initials: getInitials(firstName),
      membershipLabel: getMembershipLabel(input.role, completedVisits),
    },
    nextAppointmentSummary:
      upcomingAppointments[0]
        ? `Your next appointment is ${upcomingAppointments[0].startsAtLabel} with ${upcomingAppointments[0].barberName}.`
        : 'You do not have an upcoming booking yet. Choose your next premium session when you are ready.',
    upcomingAppointments,
    bookingHistory,
    visitSummary: {
      totalVisitsLabel: `${bookingHistory.length + upcomingAppointments.length} total bookings`,
      spendToDateLabel:
        bookingHistory.length > 0 ? 'Spend sync pending' : formatCurrency(0),
    },
    profile: {
      fullName,
      email: input.email,
      preferredBarber,
      groomingNotes:
        'Profile preferences are ready to connect to saved consultation notes, haircut references, and style history.',
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
    media:
      bookingHistory.length > 0
        ? [
            {
              id: 'live-placeholder-1',
              title: 'Transformation Gallery',
              format: 'photo',
              capturedAtLabel: 'Media timeline ready for connected visit uploads',
              imageUrl: '/images/feature-glowup.jpg',
            },
          ]
        : [],
  }
}
