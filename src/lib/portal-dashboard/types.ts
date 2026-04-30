export type PortalDataSource = 'live' | 'error'

import type { BarberApplicationStatus } from '@/lib/barber-applications/types'
import type { BookingStatus, PaymentStatus } from '@/lib/bookings/types'

export interface PortalBookingCard {
  id: string
  reference: string
  service: string
  barberName: string
  startsAt: string
  dateLabel: string
  timeLabel: string
  startsAtLabel: string
  status: BookingStatus
  paymentStatus: PaymentStatus
  statusMessage: string
  amountDueLabel: string
  amountDueValue: number | null
  pendingExpiresAtLabel: string | null
  pendingExpiresAt: string | null
  whatsappPaymentUrl: string | null
}

export interface PortalTaskItem {
  id: string
  title: string
  description: string
  tone: 'gold' | 'emerald' | 'rose' | 'neutral'
  actionHref?: string
  actionLabel?: string
  disabled?: boolean
}

export interface PortalProfileSummary {
  fullName: string
  email: string
  phoneNumber: string
  profileImageUrl: string
  accountRoleLabel: string
  profileCompletionLabel: string
  isComplete: boolean
  editProfileHref: string | null
}

export interface PortalBarberApplicationSummary {
  status: BarberApplicationStatus | 'none'
  canApply: boolean
  ctaHref: string
  ctaLabel: string
  title: string
  description: string
  rejectionReason: string | null
}

export interface PortalDashboardViewModel {
  source: PortalDataSource
  sourceMessage: string
  account: {
    firstName: string
    initials: string
  }
  bookings: {
    nextConfirmedBooking: PortalBookingCard | null
    pendingPaymentBooking: PortalBookingCard | null
    attentionPending: PortalBookingCard[]
    active: PortalBookingCard[]
    history: PortalBookingCard[]
  }
  profile: PortalProfileSummary
  barberApplication: PortalBarberApplicationSummary
}
