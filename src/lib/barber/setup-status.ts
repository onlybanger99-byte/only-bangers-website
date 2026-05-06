import type { AvailabilitySlotSummary } from '@/lib/barber-availability/types'
import type { BarberServicePriceSummary } from '@/lib/barber-service-prices/types'
import type { BarberProfileSummary } from '@/lib/barbers/service'

export interface BarberSetupStatusSummary {
  profileComplete: boolean
  hasLocation: boolean
  hasAllRequiredServicePrices: boolean
  hasAllDurations: boolean
  hasAvailability: boolean
  hasGalleryImages: boolean
  canSubmitGoLive: boolean
  setupStatus: 'live' | 'pending_review' | 'ready_to_submit' | 'incomplete' | 'deactivated'
  completionPercentage: number
  completedCount: number
  requiredCount: number
  missingItems: string[]
}

function hasProfileBasics(profile: BarberProfileSummary | null) {
  return Boolean(profile?.displayName?.trim()) && Boolean(profile?.bio?.trim())
}

function hasLocation(profile: BarberProfileSummary | null) {
  return Boolean((profile?.cuttingLocation || profile?.location || '').trim())
}

export function getBarberSetupStatus(params: {
  profile: BarberProfileSummary | null
  servicePrices: BarberServicePriceSummary[]
  availabilitySlots: AvailabilitySlotSummary[]
  galleryImageCount?: number
}): BarberSetupStatusSummary {
  const activeServicePrices = params.servicePrices.filter((item) => item.isActive)
  const requiredServicesCount = 6
  const pricedServiceIds = new Set(
    activeServicePrices
      .filter((item) => typeof item.serviceId === 'string' && item.price > 0)
      .map((item) => item.serviceId as string)
  )
  const durationServiceIds = new Set(
    activeServicePrices
      .filter((item) => typeof item.serviceId === 'string' && (item.durationMinutes ?? 0) > 0)
      .map((item) => item.serviceId as string)
  )
  const profileComplete = hasProfileBasics(params.profile)
  const locationComplete = hasLocation(params.profile)
  const hasAllRequiredServicePrices = pricedServiceIds.size >= requiredServicesCount
  const hasAllDurations = durationServiceIds.size >= requiredServicesCount
  const hasAvailability = params.availabilitySlots.length > 0
  const hasGalleryImages = (params.galleryImageCount ?? 0) > 0
  const requiredChecks = [
    profileComplete,
    locationComplete,
    hasAllRequiredServicePrices,
    hasAllDurations,
    hasAvailability,
  ]
  const completedCount = requiredChecks.filter(Boolean).length
  const requiredCount = requiredChecks.length
  const completionPercentage = Math.round((completedCount / requiredCount) * 100)
  const missingItems: string[] = []

  if (!profileComplete) {
    missingItems.push('Complete your display name and barber bio.')
  }

  if (!locationComplete) {
    missingItems.push('Add your location or cutting location.')
  }

  if (!hasAllRequiredServicePrices) {
    missingItems.push('Set active prices for all six approved services.')
  }

  if (!hasAllDurations) {
    missingItems.push('Set a duration for all six approved services.')
  }

  if (!hasAvailability) {
    missingItems.push('Publish at least one availability slot.')
  }

  const canSubmitGoLive = requiredChecks.every(Boolean)
  let setupStatus: BarberSetupStatusSummary['setupStatus'] = 'incomplete'

  if (params.profile?.setupStatus === 'deactivated' || params.profile?.isActive === false) {
    setupStatus = 'deactivated'
  } else if (params.profile?.isLive) {
    setupStatus = 'live'
  } else if (params.profile?.setupStatus === 'pending_review') {
    setupStatus = 'pending_review'
  } else if (canSubmitGoLive) {
    setupStatus = 'ready_to_submit'
  }

  return {
    profileComplete,
    hasLocation: locationComplete,
    hasAllRequiredServicePrices,
    hasAllDurations,
    hasAvailability,
    hasGalleryImages,
    canSubmitGoLive,
    setupStatus,
    completionPercentage,
    completedCount,
    requiredCount,
    missingItems,
  }
}
