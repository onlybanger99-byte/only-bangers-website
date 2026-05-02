import type { BarberProfileSummary } from '@/lib/barbers/service'
import type { BarberServicePriceSummary } from '@/lib/barber-service-prices/types'
import type { AvailabilitySlotSummary } from '@/lib/barber-availability/types'

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
}) : BarberSetupChecklist {
  const activeServicePrices = params.servicePrices.filter((item) => item.isActive && item.price > 0)
  const completePrices =
    activeServicePrices.length >= 6 &&
    activeServicePrices.every((item) => (item.durationMinutes ?? 0) > 0)
  const hasProfile =
    Boolean(params.profile?.displayName?.trim()) &&
    Boolean(params.profile?.bio?.trim()) &&
    Boolean((params.profile?.cuttingLocation || params.profile?.location || '').trim())
  const hasAvailability = params.availabilitySlots.length > 0

  const items: BarberSetupChecklistItem[] = [
    {
      id: 'profile',
      label: 'Profile and bio completed',
      completed: hasProfile,
      detail: hasProfile ? 'Profile details are ready for review.' : 'Add your name, bio, and location.',
    },
    {
      id: 'pricing',
      label: 'All six service prices are set',
      completed: completePrices,
      detail: completePrices
        ? 'Every approved service has a live price and duration.'
        : 'Add prices and durations for all six approved services.',
    },
    {
      id: 'availability',
      label: 'Availability has been published',
      completed: hasAvailability,
      detail: hasAvailability ? 'Customers can see your published slots.' : 'Add at least one availability slot.',
    },
  ]

  return {
    items,
    readyForGoLive: items.every((item) => item.completed),
  }
}
