import { barbers } from '@/data/barbers'
import {
  formatBookingCustomerContact,
  formatBookingCustomerName,
} from '@/lib/bookings/display'
import { listBookings } from '@/lib/bookings/service'
import { createMockBarberDashboardData } from './mock-data'
import type {
  BarberAppointment,
  BarberAppointmentStatus,
  BarberDashboardViewModel,
  BarberOperatorProfile,
} from './types'

type BarberDashboardIdentity = {
  userId: string
  email?: string
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

function normalizeStatus(status?: string | null): BarberAppointmentStatus {
  switch (status) {
    case 'scheduled':
    case 'arrived':
    case 'in_progress':
    case 'completed':
    case 'cancelled':
      return status
    default:
      return 'scheduled'
  }
}

function buildOperatorProfile(email?: string): BarberOperatorProfile {
  const emailValue = email?.toLowerCase() ?? ''
  const matched =
    barbers.find((barber) =>
      emailValue.includes(barber.name.split(' ')[0].toLowerCase())
    ) ?? barbers[0]

  return {
    displayName: matched.name,
    specialty: matched.specialty,
    image: matched.image,
    shiftLabel: '09:00 - 18:00',
    focusNote:
      'Keep the chair moving, retain client context, and capture polished before-and-after moments when consent is available.',
  }
}

async function getLiveAppointments(
  operator: BarberOperatorProfile,
  identity: BarberDashboardIdentity
): Promise<BarberAppointment[] | null> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date()
  endOfDay.setHours(23, 59, 59, 999)
  const bookingsResult = await listBookings({
    barberId: identity.userId,
    startsAtFrom: startOfDay.toISOString(),
    startsAtTo: endOfDay.toISOString(),
    ascending: true,
    limit: 12,
  })

  if (!bookingsResult.ok) {
    if (bookingsResult.code !== 'TABLE_MISSING') {
      console.error('[barber-dashboard] Live bookings query failed:', bookingsResult)
    }

    return null
  }

  return bookingsResult.data.map((row) => ({
    id: row.id,
    timeLabel: formatTimeLabel(row.starts_at),
    customerName: formatBookingCustomerName(row.user_id),
    customerEmail: formatBookingCustomerContact(row.user_id),
    serviceBooked: row.service_name,
    durationLabel: '45 min',
    barberAssigned: operator.displayName,
    status: normalizeStatus(row.status),
    clientQuickView: {
      recentVisitHistory: [
        'Live visit history will populate from bookings and client history records.',
      ],
      servicePreference: row.service_name ?? 'Preference not captured yet',
      styleNotes:
        row.notes ??
        'Style notes are ready for a future client profile or booking notes field.',
      contentConsent: false,
    },
    contentCapture: {
      beforePhotoReady: false,
      afterPhotoReady: false,
      videoReady: false,
    },
  }))
}

export async function getBarberDashboardViewModel(
  identity: BarberDashboardIdentity
): Promise<BarberDashboardViewModel> {
  const mock = createMockBarberDashboardData(identity.email)
  const operator = buildOperatorProfile(identity.email)
  const liveAppointments = await getLiveAppointments(operator, identity)

  if (!liveAppointments || liveAppointments.length === 0) {
    return mock
  }

  return {
    dataSource: 'live',
    readinessMessage:
      "Today's operator schedule is connected to live booking data. Workflow actions and content uploads are structured for later persistence wiring.",
    operator,
    todaySchedule: liveAppointments,
    performance: {
      cutsCompletedToday: liveAppointments.filter((item) => item.status === 'completed')
        .length,
      repeatClientsCount: Math.max(
        0,
        liveAppointments.filter((item) => item.clientQuickView.contentConsent).length
      ),
      averageServiceDuration:
        liveAppointments.length > 0
          ? `${Math.round(
              liveAppointments.reduce((sum, item) => {
                const parsed = Number.parseInt(item.durationLabel, 10)
                return sum + (Number.isNaN(parsed) ? 45 : parsed)
              }, 0) / liveAppointments.length
            )} min`
          : '45 min',
    },
    quickNotesSeed: {
      haircutNotes:
        'Use session notes for finishing details, clipper guard sequence, and client requests that should carry to the next booking.',
      followUpRecommendation:
        'Capture a practical maintenance recommendation before the client leaves the chair.',
    },
  }
}
