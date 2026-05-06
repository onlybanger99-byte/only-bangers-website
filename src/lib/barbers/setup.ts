import type { BarberProfileSummary } from '@/lib/barbers/service'
import type { BarberServicePriceSummary } from '@/lib/barber-service-prices/types'
import type { AvailabilitySlotSummary } from '@/lib/barber-availability/types'
import { getBarberSetupStatus } from '@/lib/barber/setup-status'

export interface BarberSetupChecklistItem {
  id: string
  label: string
  completed: boolean
  detail: string
}

export interface BarberSetupChecklist {
  items: BarberSetupChecklistItem[]
  readyForGoLive: boolean
}

export function buildBarberSetupChecklist(params: {
  profile: BarberProfileSummary | null
  servicePrices: BarberServicePriceSummary[]
  availabilitySlots: AvailabilitySlotSummary[]
  galleryImageCount?: number
}): BarberSetupChecklist {
  const setupStatus = getBarberSetupStatus(params)

  const items: BarberSetupChecklistItem[] = [
    {
      id: 'profile',
      label: 'Profile and bio completed',
      completed: setupStatus.profileComplete && setupStatus.hasLocation,
      detail:
        setupStatus.profileComplete && setupStatus.hasLocation
          ? 'Profile details are ready for review.'
          : 'Add your name, bio, and location.',
    },
    {
      id: 'pricing',
      label: 'All six service prices are set',
      completed: setupStatus.hasAllRequiredServicePrices && setupStatus.hasAllDurations,
      detail: setupStatus.hasAllRequiredServicePrices && setupStatus.hasAllDurations
        ? 'Every approved service has a live price and duration.'
        : 'Add prices and durations for all six approved services.',
    },
    {
      id: 'availability',
      label: 'Availability has been published',
      completed: setupStatus.hasAvailability,
      detail: setupStatus.hasAvailability ? 'Customers can see your published slots.' : 'Add at least one availability slot.',
    },
    {
      id: 'gallery',
      label: 'Gallery images added',
      completed: setupStatus.hasGalleryImages,
      detail: setupStatus.hasGalleryImages
        ? 'Your public barber page has portfolio images.'
        : 'Optional: add a few gallery images to strengthen your barber page.',
    },
  ]

  return {
    items,
    readyForGoLive: setupStatus.canSubmitGoLive,
  }
}
