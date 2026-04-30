import type { BookingStatus, PaymentStatus } from '@/lib/bookings/types'

export type BarberDataSource = 'live' | 'empty'

export interface BarberOperatorProfile {
  displayName: string
  specialty: string
  image: string
  bio: string
  activeStatus: 'active' | 'inactive'
  editProfileHref: string | null
}

export interface BarberDashboardBooking {
  id: string
  reference: string
  status: BookingStatus
  paymentStatus: PaymentStatus
  customerName: string
  customerPhone: string
  customerEmail: string
  serviceName: string
  bookingDateLabel: string
  bookingTimeLabel: string
  startsAtLabel: string
  amountDueLabel: string
  pendingExpiresAtLabel: string
  notes: string
  customerAvatarUrl: string
  messageCustomerHref: string | null
}

export interface BarberDashboardViewModel {
  dataSource: BarberDataSource
  readinessMessage: string
  operator: BarberOperatorProfile
  today: BarberDashboardBooking[]
  upcoming: BarberDashboardBooking[]
  awaitingPayment: BarberDashboardBooking[]
}
