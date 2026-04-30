import type { BookingStatus, PaymentStatus } from '@/lib/bookings/types'

export type BarberDataSource = 'live' | 'mock'

export interface BarberOperatorProfile {
  displayName: string
  specialty: string
  image: string
  shiftLabel: string
  focusNote: string
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
}

export interface BarberDashboardCustomer {
  id: string
  fullName: string
  phoneNumber: string
  email: string
  visitCountLabel: string
  upcomingBookingLabel: string
  preferredService: string
  profileImageUrl: string
}

export interface BarberPerformanceSummary {
  cutsCompletedToday: string
  todayConfirmedCount: string
  awaitingPaymentCount: string
  repeatClientsCount: string
}

export interface BarberDashboardViewModel {
  dataSource: BarberDataSource
  readinessMessage: string
  operator: BarberOperatorProfile
  today: BarberDashboardBooking[]
  upcoming: BarberDashboardBooking[]
  awaitingPayment: BarberDashboardBooking[]
  completed: BarberDashboardBooking[]
  customers: BarberDashboardCustomer[]
  performance: BarberPerformanceSummary
}
