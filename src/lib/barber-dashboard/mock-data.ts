import { barbers } from '@/data/barbers'
import type {
  BarberDashboardBooking,
  BarberDashboardCustomer,
  BarberDashboardViewModel,
  BarberOperatorProfile,
} from './types'

function findBarberProfile(email?: string) {
  const emailValue = email?.toLowerCase() ?? ''
  const matched = barbers.find((barber) =>
    emailValue.includes(barber.name.split(' ')[0].toLowerCase())
  )

  return matched ?? barbers[0]
}

function buildOperatorProfile(email?: string): BarberOperatorProfile {
  const barber = findBarberProfile(email)

  return {
    displayName: barber.name,
    specialty: barber.specialty,
    image: barber.image,
    shiftLabel: '09:00 - 18:00',
    focusNote:
      'Keep the day moving, capture clean content, and maintain premium finishing standards on every client.',
  }
}

function buildAppointments(operatorName: string): BarberDashboardBooking[] {
  return [
    {
      id: 'apt-801',
      reference: 'OB-APT801',
      status: 'confirmed',
      paymentStatus: 'paid',
      customerName: 'Siyabonga Mokoena',
      customerPhone: '+27 69 100 1001',
      customerEmail: 'siya@example.com',
      serviceName: 'Premium Fade + Beard Sculpt',
      bookingDateLabel: '28 Apr 2026',
      bookingTimeLabel: '09:30',
      startsAtLabel: '28 Apr 2026, 09:30',
      amountDueLabel: 'R450',
      pendingExpiresAtLabel: 'Not set',
      notes: 'Prefers a crisp temple blend with light texture on top.',
      customerAvatarUrl: '/images/feature-fade.jpg',
    },
    {
      id: 'apt-802',
      reference: 'OB-APT802',
      status: 'pending_payment',
      paymentStatus: 'pending_verification',
      customerName: 'Karabo Dlamini',
      customerPhone: '+27 69 100 1002',
      customerEmail: 'karabo@example.com',
      serviceName: 'Signature Cut',
      bookingDateLabel: '28 Apr 2026',
      bookingTimeLabel: '11:00',
      startsAtLabel: '28 Apr 2026, 11:00',
      amountDueLabel: 'R320',
      pendingExpiresAtLabel: '28 Apr 2026, 11:15',
      notes: 'Keep the crown natural and maintain extra weight through the fringe.',
      customerAvatarUrl: '/images/feature-glowup.jpg',
    },
    {
      id: 'apt-803',
      reference: 'OB-APT803',
      status: 'confirmed',
      paymentStatus: 'paid',
      customerName: 'Lethabo Nkosi',
      customerPhone: '+27 69 100 1003',
      customerEmail: 'lethabo@example.com',
      serviceName: 'Father + Son Session',
      bookingDateLabel: '29 Apr 2026',
      bookingTimeLabel: '13:15',
      startsAtLabel: '29 Apr 2026, 13:15',
      amountDueLabel: 'R600',
      pendingExpiresAtLabel: 'Not set',
      notes: 'Strong repeat client. Appreciates efficient family pacing.',
      customerAvatarUrl: '/images/book-cut.jpg',
    },
    {
      id: 'apt-804',
      reference: 'OB-APT804',
      status: 'completed',
      paymentStatus: 'paid',
      customerName: 'Aphiwe Ndlovu',
      customerPhone: '+27 69 100 1004',
      customerEmail: 'aphiwe@example.com',
      serviceName: 'Texture Refresh + Beard Detail',
      bookingDateLabel: '27 Apr 2026',
      bookingTimeLabel: '16:00',
      startsAtLabel: '27 Apr 2026, 16:00',
      amountDueLabel: 'R380',
      pendingExpiresAtLabel: 'Not set',
      notes: 'Likes subtle movement on top and a matte finish in after shots.',
      customerAvatarUrl: '/images/feature-beard.jpg',
    },
  ]
}

function buildCustomers(bookings: BarberDashboardBooking[]): BarberDashboardCustomer[] {
  return bookings.slice(0, 3).map((booking, index) => ({
    id: booking.id,
    fullName: booking.customerName,
    phoneNumber: booking.customerPhone,
    email: booking.customerEmail,
    visitCountLabel: `${index + 2} visits`,
    upcomingBookingLabel: booking.startsAtLabel,
    preferredService: booking.serviceName,
    profileImageUrl: booking.customerAvatarUrl,
  }))
}

export function createMockBarberDashboardData(email?: string): BarberDashboardViewModel {
  const operator = buildOperatorProfile(email)
  const bookings = buildAppointments(operator.displayName)
  const confirmedBookings = bookings.filter((item) => item.status === 'confirmed')
  const pendingBookings = bookings.filter((item) => item.status === 'pending_payment')
  const completedBookings = bookings.filter((item) => item.status === 'completed')

  return {
    dataSource: 'mock',
    readinessMessage:
      'Barber operations are running on seeded shift data until live booking and upload tables are connected.',
    operator,
    today: confirmedBookings.slice(0, 1),
    upcoming: confirmedBookings,
    awaitingPayment: pendingBookings,
    completed: completedBookings,
    customers: buildCustomers(bookings),
    performance: {
      cutsCompletedToday: String(completedBookings.length),
      todayConfirmedCount: String(confirmedBookings.slice(0, 1).length),
      awaitingPaymentCount: String(pendingBookings.length),
      repeatClientsCount: '3',
    },
  }
}
