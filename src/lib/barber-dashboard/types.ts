import type { BookingStatus, PaymentStatus } from '@/lib/bookings/types'
import type { BarberServicePriceSummary } from '@/lib/barber-service-prices/types'
import type { AvailabilitySlotSummary } from '@/lib/barber-availability/types'
import type { BarberGalleryImageSummary } from '@/lib/barber-gallery/service'
import type { BarberSetupChecklist } from '@/lib/barbers/setup'
import type { BarberSetupStatusSummary } from '@/lib/barber/setup-status'

export type BarberDataSource = 'live' | 'empty'

export interface BarberOperatorProfile {
  email: string | null
  displayName: string
  fullName: string | null
  phone: string | null
  slug: string | null
  specialty: string
  image?: string | null
  coverImageUrl: string | null
  bio: string
  location: string | null
  cuttingLocation: string | null
  latitude: number | null
  longitude: number | null
  mapUrl: string | null
  instagramUrl: string | null
  tiktokUrl: string | null
  facebookUrl: string | null
  portfolioUrl: string | null
  availableDays: string[]
  availableStartTime: string | null
  availableEndTime: string | null
  activeStatus: 'active' | 'inactive'
  isLive: boolean
  setupStatus: string
  goLiveRejectionReason: string | null
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
  availabilitySlots: AvailabilitySlotSummary[]
  galleryImages: BarberGalleryImageSummary[]
  setupChecklist: BarberSetupChecklist
  setupStatus: BarberSetupStatusSummary
  today: BarberDashboardBooking[]
  upcoming: BarberDashboardBooking[]
  awaitingPayment: BarberDashboardBooking[]
}
