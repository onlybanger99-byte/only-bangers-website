import type { PortalDashboardViewModel } from './types'

function getInitials(firstName: string) {
  return firstName.slice(0, 2).toUpperCase()
}

export function createMockPortalDashboardData(email: string): PortalDashboardViewModel {
  const firstName =
    email.split('@')[0]?.split(/[._-]/)[0]?.replace(/^./, (character) =>
      character.toUpperCase()
    ) || 'Client'

  return {
    source: 'mock',
    sourceMessage:
      'Member data is running in premium shell mode until all booking, profile, and media records are connected in Supabase.',
    account: {
      firstName,
      initials: getInitials(firstName),
      membershipLabel: 'Committed Member',
    },
    nextAppointmentSummary: 'Your next premium session is booked for Friday at 14:30.',
    upcomingAppointments: [
      {
        id: 'upcoming-1',
        service: 'Premium Fade + Beard Sculpt',
        barberName: 'Antonio Prince',
        startsAt: new Date().toISOString(),
        startsAtLabel: 'Fri, 14:30',
        status: 'confirmed',
      },
      {
        id: 'upcoming-2',
        service: 'Texture Refresh',
        barberName: 'Antonio Prince',
        startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21).toISOString(),
        startsAtLabel: 'Fri, 13:00',
        status: 'scheduled',
      },
    ],
    bookingHistory: [
      {
        id: 'history-1',
        service: 'Signature Cut',
        barberName: 'Antonio Prince',
        completedAtLabel: '12 Apr 2026',
        spendLabel: 'R320',
      },
      {
        id: 'history-2',
        service: 'Fade + Beard Detail',
        barberName: 'Antonio Prince',
        completedAtLabel: '28 Mar 2026',
        spendLabel: 'R420',
      },
      {
        id: 'history-3',
        service: 'Premium Grooming Session',
        barberName: 'Antonio Prince',
        completedAtLabel: '14 Mar 2026',
        spendLabel: 'R560',
      },
    ],
    visitSummary: {
      totalVisitsLabel: '12 visits',
      spendToDateLabel: 'R4,860 lifetime spend',
    },
    profile: {
      fullName: `${firstName} Mokoena`,
      email,
      preferredBarber: 'Antonio Prince',
      groomingNotes:
        'Prefers a clean low fade, natural texture on top, and matte styling product with no shine finish.',
    },
    loyalty: {
      visitsCompleted: 12,
      progressValue: 12,
      progressTarget: 15,
      progressLabel: '3 more visits to unlock your next premium member reward.',
      referralHeadline: 'Refer a friend and unlock priority booking perks.',
      perkCopy:
        'Members who bring in a new client move up the queue for premium Friday and Saturday slots.',
    },
    media: [
      {
        id: 'media-1',
        title: 'Transformation Finish',
        format: 'photo',
        capturedAtLabel: 'Captured after your 12 Apr visit',
        imageUrl: '/images/feature-fade.jpg',
      },
      {
        id: 'media-2',
        title: 'Beard Detail Highlight',
        format: 'photo',
        capturedAtLabel: 'Captured after your 28 Mar visit',
        imageUrl: '/images/feature-beard.jpg',
      },
    ],
  }
}
