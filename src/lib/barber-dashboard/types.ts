import type { BookingStatus, PaymentStatus } from '@/lib/bookings/types'
import type { BarberServicePriceSummary } from '@/lib/barber-service-prices/types'

export type BarberDataSource = 'live' | 'empty'

export interface BarberOperatorProfile {
  displayName: string
  specialty: string
  image?: string | null
  bio: string
  cuttingLocation: string | null
  instagramUrl: string | null
  tiktokUrl: string | null
  facebookUrl: string | null
  portfolioUrl: string | null
  availableDays: string[]
  availableStartTime: string | null
  availableEndTime: string | null
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
  servicePrices: BarberServicePriceSummary[]
  today: BarberDashboardBooking[]
  upcoming: BarberDashboardBooking[]
  awaitingPayment: BarberDashboardBooking[]
}
