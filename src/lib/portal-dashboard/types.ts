export type PortalDataSource = 'live' | 'error'

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
  preferredBarber: string
  groomingNotes: string
  accountRoleLabel: string
  accountStatusLabel: string
  profileCompletionLabel: string
  isComplete: boolean
  editProfileHref: string | null
}

export interface PortalLoyaltySummary {
  visitsCompleted: number
  progressValue: number
  progressTarget: number
  progressLabel: string
  referralHeadline: string
  perkCopy: string
}

export interface PortalMediaItem {
  id: string
  title: string
  format: 'photo' | 'video'
  capturedAtLabel: string
  imageUrl: string
}

export interface PortalDashboardViewModel {
  source: PortalDataSource
  sourceMessage: string
  account: {
    firstName: string
    initials: string
    membershipLabel: string
  }
  headerDescription: string
  nextAppointmentSummary: string
  quickStats: {
    nextBookingLabel: string
    pendingPaymentCountLabel: string
    completedCutsLabel: string
    loyaltyProgressLabel: string
  }
  overview: {
    nextConfirmedBooking: PortalBookingCard | null
    pendingPaymentBooking: PortalBookingCard | null
  }
  bookings: {
    all: PortalBookingCard[]
    pendingPayment: PortalBookingCard[]
    confirmedUpcoming: PortalBookingCard[]
    completed: PortalBookingCard[]
    cancelledOrExpired: PortalBookingCard[]
  }
  payments: {
    pending: PortalBookingCard[]
    paid: PortalBookingCard[]
    failed: PortalBookingCard[]
  }
  tasks: PortalTaskItem[]
  history: PortalBookingCard[]
  visitSummary: {
    totalVisitsLabel: string
    spendToDateLabel: string
  }
  profile: PortalProfileSummary
  loyalty: PortalLoyaltySummary
  media: PortalMediaItem[]
}
