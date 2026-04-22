export type BarberAppointmentStatus =
  | 'scheduled'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type BarberDataSource = 'live' | 'mock'

export interface BarberOperatorProfile {
  displayName: string
  specialty: string
  image: string
  shiftLabel: string
  focusNote: string
}

export interface BarberClientQuickView {
  recentVisitHistory: string[]
  servicePreference: string
  styleNotes: string
  contentConsent: boolean
}

export interface BarberContentCaptureState {
  beforePhotoReady: boolean
  afterPhotoReady: boolean
  videoReady: boolean
}

export interface BarberAppointment {
  id: string
  timeLabel: string
  customerName: string
  customerEmail: string
  serviceBooked: string
  durationLabel: string
  barberAssigned: string
  status: BarberAppointmentStatus
  clientQuickView: BarberClientQuickView
  contentCapture: BarberContentCaptureState
}

export interface BarberPerformanceSummary {
  cutsCompletedToday: number
  repeatClientsCount: number
  averageServiceDuration: string
}

export interface BarberDashboardViewModel {
  dataSource: BarberDataSource
  readinessMessage: string
  operator: BarberOperatorProfile
  todaySchedule: BarberAppointment[]
  performance: BarberPerformanceSummary
  quickNotesSeed: {
    haircutNotes: string
    followUpRecommendation: string
  }
}
