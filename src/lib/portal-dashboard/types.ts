export type PortalDataSource = 'live' | 'mock'

import type { BookingStatus as PortalBookingStatus } from '@/lib/bookings/types'

export interface PortalAppointment {
  id: string
  service: string
  barberName: string
  startsAt: string
  startsAtLabel: string
  status: PortalBookingStatus
}

export interface PortalHistoryItem {
  id: string
  service: string
  barberName: string
  completedAtLabel: string
  spendLabel: string
}

export interface PortalProfileSummary {
  fullName: string
  email: string
  preferredBarber: string
  groomingNotes: string
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
  nextAppointmentSummary: string
  upcomingAppointments: PortalAppointment[]
  bookingHistory: PortalHistoryItem[]
  visitSummary: {
    totalVisitsLabel: string
    spendToDateLabel: string
  }
  profile: PortalProfileSummary
  loyalty: PortalLoyaltySummary
  media: PortalMediaItem[]
}
