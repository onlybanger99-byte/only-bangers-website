import { barbers } from '@/data/barbers'
import type {
  BarberAppointment,
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

function buildAppointments(operatorName: string): BarberAppointment[] {
  return [
    {
      id: 'apt-801',
      timeLabel: '09:30',
      customerName: 'Siyabonga Mokoena',
      customerEmail: 'siya@example.com',
      serviceBooked: 'Premium Fade + Beard Sculpt',
      durationLabel: '60 min',
      barberAssigned: operatorName,
      status: 'scheduled',
      clientQuickView: {
        recentVisitHistory: [
          'Skin fade + beard line-up - 2 weeks ago',
          'Premium fade refresh - 5 weeks ago',
          'Full grooming package - 8 weeks ago',
        ],
        servicePreference: 'Clean low fade with defined beard edge',
        styleNotes:
          'Prefers a crisp temple blend, light texture on top, and no product shine in the final finish.',
        contentConsent: true,
      },
      contentCapture: {
        beforePhotoReady: false,
        afterPhotoReady: false,
        videoReady: false,
      },
    },
    {
      id: 'apt-802',
      timeLabel: '11:00',
      customerName: 'Karabo Dlamini',
      customerEmail: 'karabo@example.com',
      serviceBooked: 'Signature Cut',
      durationLabel: '45 min',
      barberAssigned: operatorName,
      status: 'arrived',
      clientQuickView: {
        recentVisitHistory: [
          'Signature cut - 3 weeks ago',
          'Hairline clean-up - 6 weeks ago',
        ],
        servicePreference: 'Structured crop with soft taper',
        styleNotes:
          'Keep the crown natural and maintain extra weight through the front fringe.',
        contentConsent: false,
      },
      contentCapture: {
        beforePhotoReady: true,
        afterPhotoReady: false,
        videoReady: false,
      },
    },
    {
      id: 'apt-803',
      timeLabel: '13:15',
      customerName: 'Lethabo Nkosi',
      customerEmail: 'lethabo@example.com',
      serviceBooked: 'Father + Son Session',
      durationLabel: '75 min',
      barberAssigned: operatorName,
      status: 'in_progress',
      clientQuickView: {
        recentVisitHistory: [
          'Family cut session - 1 month ago',
          'Kids taper + father beard trim - 2 months ago',
        ],
        servicePreference: 'Polished family cuts with premium finishing',
        styleNotes:
          'Strong repeat client. Appreciates efficiency, photo-ready finishing, and child-friendly pacing.',
        contentConsent: true,
      },
      contentCapture: {
        beforePhotoReady: true,
        afterPhotoReady: false,
        videoReady: false,
      },
    },
    {
      id: 'apt-804',
      timeLabel: '16:00',
      customerName: 'Aphiwe Ndlovu',
      customerEmail: 'aphiwe@example.com',
      serviceBooked: 'Texture Refresh + Beard Detail',
      durationLabel: '50 min',
      barberAssigned: operatorName,
      status: 'completed',
      clientQuickView: {
        recentVisitHistory: [
          'Texture refresh - 10 days ago',
          'Premium shape-up - 4 weeks ago',
        ],
        servicePreference: 'Natural texture with clean outline',
        styleNotes:
          'Likes subtle movement on top and a natural matte finish in after shots.',
        contentConsent: true,
      },
      contentCapture: {
        beforePhotoReady: true,
        afterPhotoReady: true,
        videoReady: true,
      },
    },
  ]
}

export function createMockBarberDashboardData(email?: string): BarberDashboardViewModel {
  const operator = buildOperatorProfile(email)
  const todaySchedule = buildAppointments(operator.displayName)

  return {
    dataSource: 'mock',
    readinessMessage:
      'Barber operations are running on seeded shift data until live booking and upload tables are connected.',
    operator,
    todaySchedule,
    performance: {
      cutsCompletedToday: todaySchedule.filter((item) => item.status === 'completed').length,
      repeatClientsCount: 3,
      averageServiceDuration: '52 min',
    },
    quickNotesSeed: {
      haircutNotes: 'Document blend detail, line-up finish, and product used for the final style.',
      followUpRecommendation: 'Recommend a 2-week maintenance booking and matte styling powder for home finish.',
    },
  }
}
