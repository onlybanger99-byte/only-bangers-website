import { barbers } from '@/data/barbers'
import { getBarberProfileByUserId } from '@/lib/barbers/service'
import { listBookings } from '@/lib/bookings/service'
import { getCustomerProfilesByUserIds } from '@/lib/customer-profiles/service'
import { createMockBarberDashboardData } from './mock-data'
import type {
  BarberDashboardBooking,
  BarberDashboardCustomer,
  BarberDashboardViewModel,
  BarberOperatorProfile,
} from './types'

type BarberDashboardIdentity = {
  userId: string
  email?: string
}

type InternalBooking = BarberDashboardBooking & {
  rawStartsAt: string
  customerUserId: string
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

function formatDateLabel(value?: string | null) {
  if (!value) {
    return 'Date pending'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return 'Date pending'
  }

  return new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed)
}

function formatDateTimeLabel(value?: string | null) {
  if (!value) {
    return 'Not set'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return 'Not set'
  }

  return new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

function formatAmount(amount?: number | null) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(amount ?? 0)
}

function hasPendingExpired(expiresAt?: string | null) {
  if (!expiresAt) {
    return false
  }

  const parsed = new Date(expiresAt)
  return !Number.isNaN(parsed.getTime()) && parsed.getTime() <= Date.now()
}

async function buildOperatorProfile(identity: BarberDashboardIdentity): Promise<BarberOperatorProfile> {
  const liveProfile = await getBarberProfileByUserId(identity.userId)

  if (liveProfile) {
    return {
      displayName: liveProfile.displayName,
      specialty: liveProfile.specialty,
      image: liveProfile.profileImageUrl,
      shiftLabel: '09:00 - 18:00',
      focusNote:
        'Confirmed bookings are service-ready. Keep payment holds separate, protect the chair flow, and finish every client to premium Only Bangers standard.',
    }
  }

  const emailValue = identity.email?.toLowerCase() ?? ''
  const matched =
    barbers.find((barber) => emailValue.includes(barber.name.split(' ')[0].toLowerCase())) ??
    barbers[0]

  return {
    displayName: matched.name,
    specialty: matched.specialty,
    image: matched.image,
    shiftLabel: '09:00 - 18:00',
    focusNote:
      'Keep the chair moving, retain client context, and maintain premium finishing standards across every appointment.',
  }
}

async function getLiveAppointments(
  identity: BarberDashboardIdentity
): Promise<{
  today: BarberDashboardBooking[]
  upcoming: BarberDashboardBooking[]
  awaitingPayment: BarberDashboardBooking[]
  completed: BarberDashboardBooking[]
  customers: BarberDashboardCustomer[]
  repeatClientsCount: number
  completedTodayCount: number
} | null> {
  const bookingsResult = await listBookings({
    barberId: identity.userId,
    ascending: true,
    limit: 120,
  })

  if (!bookingsResult.ok) {
    if (bookingsResult.code !== 'TABLE_MISSING') {
      console.error('[barber-dashboard] Live bookings query failed:', bookingsResult)
    }

    return null
  }

  const profiles = await getCustomerProfilesByUserIds(bookingsResult.data.map((row) => row.user_id))

  const rows = bookingsResult.data
    .filter((row) => row.status !== 'expired' && row.status !== 'cancelled')
    .filter((row) => !(row.status === 'pending_payment' && hasPendingExpired(row.pending_expires_at)))

  const items: InternalBooking[] = rows.map((row) => {
    const profile = profiles.get(row.user_id)

    return {
      id: row.id,
      reference: row.payment_reference ?? `OB-${row.id.slice(0, 8).toUpperCase()}`,
      status: row.status,
      paymentStatus: row.payment_status,
      customerName: profile?.fullName ?? 'Only Bangers Customer',
      customerPhone: profile?.phoneNumber ?? 'Phone pending',
      customerEmail: 'Email unavailable',
      serviceName: row.service_name,
      bookingDateLabel: formatDateLabel(row.starts_at),
      bookingTimeLabel: formatTimeLabel(row.starts_at),
      startsAtLabel: formatDateTimeLabel(row.starts_at),
      amountDueLabel: formatAmount(row.amount_due),
      pendingExpiresAtLabel:
        row.pending_expires_at ? formatDateTimeLabel(row.pending_expires_at) : 'Not set',
      notes: row.notes ?? 'No customer notes were captured on this booking yet.',
      customerAvatarUrl: profile?.profileImageUrl ?? '/images/header-bg.png',
      rawStartsAt: row.starts_at,
      customerUserId: row.user_id,
    }
  })

  const now = new Date()
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(now)
  endOfDay.setHours(23, 59, 59, 999)

  const today = items.filter((item) => {
    if (item.status !== 'confirmed') {
      return false
    }

    const startsAt = new Date(item.rawStartsAt)
    return !Number.isNaN(startsAt.getTime()) && startsAt >= startOfDay && startsAt <= endOfDay
  })

  const upcoming = items.filter((item) => {
    if (item.status !== 'confirmed') {
      return false
    }

    const startsAt = new Date(item.rawStartsAt)
    return !Number.isNaN(startsAt.getTime()) && startsAt > endOfDay
  })

  const awaitingPayment = items.filter((item) => item.status === 'pending_payment')
  const completed = items.filter((item) => item.status === 'completed')
  const completedTodayCount = completed.filter((item) => {
    const startsAt = new Date(item.rawStartsAt)
    return !Number.isNaN(startsAt.getTime()) && startsAt >= startOfDay && startsAt <= endOfDay
  }).length

  const visitCounts = new Map<string, number>()

  for (const item of items) {
    visitCounts.set(item.customerUserId, (visitCounts.get(item.customerUserId) ?? 0) + 1)
  }

  const repeatClientsCount = Array.from(visitCounts.values()).filter((count) => count > 1).length
  const customers = Array.from(
    new Map(
      items.map((item) => [
        item.customerUserId,
        {
          id: item.customerUserId,
          fullName: item.customerName,
          phoneNumber: item.customerPhone,
          email: item.customerEmail,
          visitCountLabel: `${visitCounts.get(item.customerUserId) ?? 1} visit${
            (visitCounts.get(item.customerUserId) ?? 1) === 1 ? '' : 's'
          }`,
          upcomingBookingLabel:
            today.find((entry) => entry.customerUserId === item.customerUserId)?.startsAtLabel ??
            upcoming.find((entry) => entry.customerUserId === item.customerUserId)?.startsAtLabel ??
            'No upcoming booking',
          preferredService: item.serviceName,
          profileImageUrl: item.customerAvatarUrl,
        } satisfies BarberDashboardCustomer,
      ])
    ).values()
  )

  return {
    today: today.map(({ rawStartsAt: _raw, customerUserId: _customerUserId, ...item }) => item),
    upcoming: upcoming.map(({ rawStartsAt: _raw, customerUserId: _customerUserId, ...item }) => item),
    awaitingPayment: awaitingPayment.map(({ rawStartsAt: _raw, customerUserId: _customerUserId, ...item }) => item),
    completed: completed.map(({ rawStartsAt: _raw, customerUserId: _customerUserId, ...item }) => item),
    customers,
    repeatClientsCount,
    completedTodayCount,
  }
}

export async function getBarberDashboardViewModel(
  identity: BarberDashboardIdentity
): Promise<BarberDashboardViewModel> {
  const mock = createMockBarberDashboardData(identity.email)
  const operator = await buildOperatorProfile(identity)
  const liveAppointments = await getLiveAppointments(identity)

  if (
    !liveAppointments ||
    (liveAppointments.today.length === 0 &&
      liveAppointments.upcoming.length === 0 &&
      liveAppointments.awaitingPayment.length === 0 &&
      liveAppointments.completed.length === 0)
  ) {
    return {
      ...mock,
      operator,
    }
  }

  return {
    dataSource: 'live',
    readinessMessage:
      "Today's barber portal is connected to live booking data. Confirmed bookings are real work, pending-payment holds stay separate until admin verification, and expired holds stay out of the active workflow.",
    operator,
    today: liveAppointments.today,
    upcoming: liveAppointments.upcoming,
    awaitingPayment: liveAppointments.awaitingPayment,
    completed: liveAppointments.completed,
    customers: liveAppointments.customers,
    performance: {
      cutsCompletedToday: String(liveAppointments.completedTodayCount),
      todayConfirmedCount: String(liveAppointments.today.length),
      awaitingPaymentCount: String(liveAppointments.awaitingPayment.length),
      repeatClientsCount: String(liveAppointments.repeatClientsCount),
    },
  }
}
