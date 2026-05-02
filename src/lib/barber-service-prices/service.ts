import { isSafeImageSource } from '@/lib/safe-image'
import { parseDurationToMinutes } from '@/lib/services/duration'
import {
  getActiveServiceById,
  isUuid,
  listActiveServices,
} from '@/lib/services/service'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type {
  BarberServicePriceInput,
  BarberServicePriceRecord,
  BarberServicePriceSummary,
  PublicBarberServicePriceSummary,
  PublicServicePriceSummary,
} from './types'

type BarberProfileRow = Record<string, unknown>

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function resolveLocation(profile: BarberProfileRow) {
  const location = normalizeText(profile.location)
  const cuttingLocation = normalizeText(profile.cutting_location)
  return {
    location: location || null,
    cuttingLocation: cuttingLocation || null,
  }
}

function resolveProfileImage(profile: BarberProfileRow) {
  const candidates = [
    normalizeText(profile.avatar_url),
    normalizeText(profile.profile_image_url),
    normalizeText(profile.profile_photo_url),
  ]
  const safe = candidates.find((candidate) => isSafeImageSource(candidate))
  return safe || null
}

function resolveDisplayName(profile: BarberProfileRow) {
  return (
    normalizeText(profile.display_name) ||
    normalizeText(profile.name) ||
    normalizeText(profile.full_name) ||
    'Only Bangers Barber'
  )
}

function resolveBio(profile: BarberProfileRow) {
  return normalizeText(profile.bio) || 'Premium barber available through the Only Bangers booking flow.'
}

function toSummary(row: BarberServicePriceRecord): BarberServicePriceSummary {
  return {
    id: row.id,
    barberProfileId: row.barber_profile_id,
    serviceId: row.service_id,
    serviceName: row.service_name,
    price: row.price,
    durationMinutes: row.duration_minutes,
    isActive: row.is_active,
  }
}

async function getSupabase() {
  return createAdminClient() ?? (await createClient())
}

async function getBarberProfileIdentity(userId: string, requireActive = false) {
  const supabase = await getSupabase()
  let query = supabase
    .from('barber_profiles')
    .select('id, user_id, is_active')
    .eq('user_id', userId)
  if (requireActive) {
    query = query.eq('is_active', true)
  }
  const { data, error } = await query.maybeSingle()

  if (error && error.code !== 'PGRST116' && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('[barber-service-prices] Failed to resolve barber profile', error)
  }

  return data && typeof data.id === 'string'
    ? {
        id: data.id,
        userId: typeof data.user_id === 'string' ? data.user_id : userId,
        isActive: typeof data.is_active === 'boolean' ? data.is_active : false,
      }
    : null
}

async function getValidActiveServiceIds() {
  const servicesResult = await listActiveServices()

  return new Set(servicesResult.data.map((service) => service.id))
}

async function getPublicProfilesMap(barberProfileIds: string[]) {
  if (barberProfileIds.length === 0) {
    return new Map<string, BarberProfileRow>()
  }

  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('barber_profiles')
    .select('*')
    .in('id', barberProfileIds)
    .eq('is_active', true)
    .eq('is_live', true)

  if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('[barber-service-prices] Failed to load public barber profiles', error)
    return new Map<string, BarberProfileRow>()
  }

  return new Map(
    ((data ?? []) as BarberProfileRow[])
      .filter((row) => typeof row.id === 'string' && typeof row.user_id === 'string')
      .map((row) => [row.id as string, row])
  )
}

async function getFilteredPriceRows(options?: {
  barberProfileId?: string | null
  onlyActive?: boolean
  serviceId?: string | null
}) {
  const supabase = await getSupabase()
  let query = supabase.from('barber_service_prices').select('*').order('service_name', { ascending: true })

  if (options?.barberProfileId) {
    query = query.eq('barber_profile_id', options.barberProfileId)
  }

  if (options?.onlyActive) {
    query = query.eq('is_active', true)
  }

  if (options?.serviceId) {
    query = query.eq('service_id', options.serviceId)
  }

  const { data, error } = await query

  if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('[barber-service-prices] Failed to load price rows', error)
    return {
      ok: false as const,
      message: 'We could not load barber service prices right now.',
      data: [] as BarberServicePriceRecord[],
    }
  }

  const validServiceIds = await getValidActiveServiceIds()
  const filtered = ((data ?? []) as BarberServicePriceRecord[]).filter(
    (row) => typeof row.service_id === 'string' && validServiceIds.has(row.service_id)
  )

  return {
    ok: true as const,
    data: filtered,
  }
}

async function validateInput(input: BarberServicePriceInput) {
  const serviceId = normalizeText(input.serviceId)
  const price = normalizeNumber(input.price)
  const details: string[] = []
  const service = await getActiveServiceById(serviceId)
  const requestedDuration = normalizeNumber(input.durationMinutes)
  const fallbackDurationMinutes = service ? parseDurationToMinutes(service.duration) : null

  if (!serviceId || !isUuid(serviceId)) {
    details.push('Select a valid approved service UUID.')
  }

  if (!service) {
    details.push('Select an approved active service.')
  }

  if (price == null || price <= 0) {
    details.push('Price must be a valid number greater than 0.')
  }

  if (requestedDuration != null && requestedDuration <= 0) {
    details.push('Duration must be a valid number greater than 0.')
  }

  return {
    details,
    service,
    payload: service
      ? {
          service_id: service.id,
          service_name: service.name,
          price: price ?? 0,
          duration_minutes:
            requestedDuration != null
              ? Math.round(requestedDuration)
              : fallbackDurationMinutes == null
                ? null
                : Math.round(fallbackDurationMinutes),
        }
      : null,
  }
}

export async function listBarberServicePricesForOwner(userId: string) {
  const barberProfile = await getBarberProfileIdentity(userId, true)

  if (!barberProfile) {
    return {
      ok: false as const,
      message: 'Your barber profile is not active yet.',
      data: [] as BarberServicePriceSummary[],
    }
  }

  const result = await getFilteredPriceRows({ barberProfileId: barberProfile.id })

  if (!result.ok) {
    return result
  }

  return {
    ok: true as const,
    data: result.data.map(toSummary),
  }
}

export async function listActiveBarberServicePricesForPublic(barberUserId: string) {
  const barberProfile = await getBarberProfileIdentity(barberUserId, true)

  if (!barberProfile) {
    return {
      ok: true as const,
      data: [] as BarberServicePriceSummary[],
    }
  }

  const result = await getFilteredPriceRows({ barberProfileId: barberProfile.id, onlyActive: true })

  if (!result.ok) {
    return result
  }

  return {
    ok: true as const,
    data: result.data.map(toSummary),
  }
}

export async function listPublicBarbersForService(filter: {
  serviceId?: string | null
}) {
  const serviceId = normalizeText(filter.serviceId)

  if (!serviceId) {
    return {
      ok: true as const,
      data: [] as PublicBarberServicePriceSummary[],
    }
  }

  const service = await getActiveServiceById(serviceId)

  if (!service) {
    return {
      ok: true as const,
      data: [] as PublicBarberServicePriceSummary[],
    }
  }

  const result = await getFilteredPriceRows({ serviceId: service.id, onlyActive: true })

  if (!result.ok) {
    return {
      ok: false as const,
      message: result.message,
      data: [] as PublicBarberServicePriceSummary[],
    }
  }

  const profileMap = await getPublicProfilesMap(
    Array.from(new Set(result.data.map((row) => row.barber_profile_id)))
  )

  return {
    ok: true as const,
    data: result.data
      .map((row) => {
        const profile = profileMap.get(row.barber_profile_id)

        if (!profile || typeof profile.user_id !== 'string') {
          return null
        }

        const { location, cuttingLocation } = resolveLocation(profile)

        return {
          ...toSummary(row),
          barberUserId: profile.user_id,
          barberName: resolveDisplayName(profile),
          location,
          cuttingLocation,
          bio: resolveBio(profile),
          profileImageUrl: resolveProfileImage(profile),
          barberIsActive: Boolean(profile.is_active),
        } satisfies PublicBarberServicePriceSummary
      })
      .filter((row): row is PublicBarberServicePriceSummary => row !== null)
      .sort((left, right) => {
        if (left.price !== right.price) {
          return left.price - right.price
        }

        return left.barberName.localeCompare(right.barberName)
      }),
  }
}

export async function listPublicServicePriceSummaries() {
  const result = await getFilteredPriceRows({ onlyActive: true })

  if (!result.ok) {
    return {
      ok: false as const,
      message: result.message,
      data: [] as PublicServicePriceSummary[],
    }
  }

  const grouped = new Map<string, PublicServicePriceSummary>()

  for (const row of result.data) {
    if (!row.service_id) {
      continue
    }

    const current = grouped.get(row.service_id)

    if (!current) {
      grouped.set(row.service_id, {
        serviceId: row.service_id,
        serviceName: row.service_name,
        minPrice: row.price,
        maxPrice: row.price,
        barberCount: 1,
      })
      continue
    }

    current.minPrice = current.minPrice == null ? row.price : Math.min(current.minPrice, row.price)
    current.maxPrice = current.maxPrice == null ? row.price : Math.max(current.maxPrice, row.price)
    current.barberCount += 1
  }

  const servicesResult = await listActiveServices()
  const ordered = servicesResult.data.map((service) => {
    const summary = grouped.get(service.id)

    return {
      serviceId: service.id,
      serviceName: service.name,
      minPrice: summary?.minPrice ?? null,
      maxPrice: summary?.maxPrice ?? null,
      barberCount: summary?.barberCount ?? 0,
    } satisfies PublicServicePriceSummary
  })

  return {
    ok: true as const,
    data: ordered,
  }
}

export async function getBarberServicePriceById(priceId: string) {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('barber_service_prices')
    .select('*')
    .eq('id', priceId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116' && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('[barber-service-prices] Failed to load price by id', error)
    return null
  }

  if (!data) {
    return null
  }

  if (typeof data.service_id !== 'string') {
    return null
  }

  const service = await getActiveServiceById(data.service_id)

  if (!service) {
    return null
  }

  return toSummary(data as BarberServicePriceRecord)
}

export async function createBarberServicePrice(userId: string, input: BarberServicePriceInput) {
  console.info('[barber-service-prices] create request', {
    authUserId: userId,
    selectedServiceId: input.serviceId,
    requestedPrice: input.price,
    requestedDurationMinutes: input.durationMinutes ?? null,
  })

  const barberProfile = await getBarberProfileIdentity(userId, true)

  if (!barberProfile) {
    return {
      ok: false as const,
      message: 'Your barber profile is not active yet.',
      details: ['A barber profile is required before you can add prices.'],
    }
  }

  console.info('[barber-service-prices] barber profile found', {
    authUserId: userId,
    barberProfileId: barberProfile.id,
    barberProfileActive: barberProfile.isActive,
  })

  const validated = await validateInput(input)

  if (validated.details.length > 0 || !validated.payload) {
    return {
      ok: false as const,
      message: 'Service pricing is invalid.',
      details: validated.details,
    }
  }

  console.info('[barber-service-prices] validated service', {
    authUserId: userId,
    barberProfileId: barberProfile.id,
    selectedServiceId: validated.payload.service_id,
    selectedServiceName: validated.payload.service_name,
    price: validated.payload.price,
    durationMinutes: validated.payload.duration_minutes,
  })

  const supabase = createAdminClient() ?? (await createClient())
  const { data: existing } = await supabase
    .from('barber_service_prices')
    .select('*')
    .eq('barber_profile_id', barberProfile.id)
    .eq('service_id', validated.payload.service_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    console.info('[barber-service-prices] existing row found, updating instead of inserting', {
      authUserId: userId,
      barberProfileId: barberProfile.id,
      existingPriceId: String(existing.id),
      selectedServiceId: validated.payload.service_id,
      selectedServiceName: validated.payload.service_name,
    })
    return updateBarberServicePrice(userId, String(existing.id), {
      serviceId: validated.payload.service_id,
      price: validated.payload.price,
      durationMinutes: validated.payload.duration_minutes,
      isActive: true,
    })
  }

  const { data, error } = await supabase
    .from('barber_service_prices')
    .insert({
      barber_profile_id: barberProfile.id,
      ...validated.payload,
      is_active: true,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[barber-service-prices] Failed to create price', {
      authUserId: userId,
      barberProfileId: barberProfile.id,
      selectedServiceId: validated.payload.service_id,
      selectedServiceName: validated.payload.service_name,
      error,
    })
    return {
      ok: false as const,
      message: 'We could not save this barber price.',
      details: [error.message],
    }
  }

  console.info('[barber-service-prices] inserted row', {
    authUserId: userId,
    barberProfileId: barberProfile.id,
    priceId: String(data.id),
    serviceId: data.service_id,
    serviceName: data.service_name,
    price: data.price,
    durationMinutes: data.duration_minutes,
    isActive: data.is_active,
  })

  return {
    ok: true as const,
    data: toSummary(data as BarberServicePriceRecord),
  }
}

export async function updateBarberServicePrice(
  userId: string,
  priceId: string,
  input: Partial<BarberServicePriceInput> & { isActive?: boolean }
) {
  console.info('[barber-service-prices] update request', {
    authUserId: userId,
    priceId,
    selectedServiceId: input.serviceId ?? null,
    requestedPrice: input.price ?? null,
    requestedDurationMinutes: input.durationMinutes ?? null,
    requestedIsActive: input.isActive ?? null,
  })

  const barberProfile = await getBarberProfileIdentity(userId, true)

  if (!barberProfile) {
    return {
      ok: false as const,
      message: 'Your barber profile is not active yet.',
      details: ['A barber profile is required before you can manage prices.'],
    }
  }

  console.info('[barber-service-prices] barber profile found', {
    authUserId: userId,
    barberProfileId: barberProfile.id,
    barberProfileActive: barberProfile.isActive,
  })

  const supabase = createAdminClient() ?? (await createClient())
  const { data: existing, error: existingError } = await supabase
    .from('barber_service_prices')
    .select('*')
    .eq('id', priceId)
    .eq('barber_profile_id', barberProfile.id)
    .maybeSingle()

  if (existingError) {
    console.error('[barber-service-prices] Failed to load price for update', existingError)
    return {
      ok: false as const,
      message: 'We could not load this barber price.',
      details: [existingError.message],
    }
  }

  if (!existing) {
    return {
      ok: false as const,
      message: 'This barber price was not found.',
      details: ['The selected service price does not belong to the current barber.'],
    }
  }

  const resolvedServiceId =
    normalizeText(input.serviceId) ||
    (typeof existing.service_id === 'string' ? existing.service_id : '')
  const resolvedPrice =
    Object.prototype.hasOwnProperty.call(input, 'price') ? input.price : existing.price
  const resolvedDuration =
    Object.prototype.hasOwnProperty.call(input, 'durationMinutes')
      ? input.durationMinutes
      : existing.duration_minutes
  const validated = await validateInput({
    serviceId: resolvedServiceId,
    price: resolvedPrice as number,
    durationMinutes: resolvedDuration as number | null | undefined,
  })

  if (validated.details.length > 0 || !validated.payload) {
    return {
      ok: false as const,
      message: 'Service pricing is invalid.',
      details: validated.details,
    }
  }

  console.info('[barber-service-prices] validated service for update', {
    authUserId: userId,
    barberProfileId: barberProfile.id,
    priceId,
    selectedServiceId: validated.payload.service_id,
    selectedServiceName: validated.payload.service_name,
    price: validated.payload.price,
    durationMinutes: validated.payload.duration_minutes,
  })

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    ...validated.payload,
  }

  if (typeof input.isActive === 'boolean') {
    updates.is_active = input.isActive
  }

  const { data, error } = await supabase
    .from('barber_service_prices')
    .update(updates)
    .eq('id', priceId)
    .eq('barber_profile_id', barberProfile.id)
    .select('*')
    .maybeSingle()

  if (error) {
    console.error('[barber-service-prices] Failed to update price', {
      authUserId: userId,
      barberProfileId: barberProfile.id,
      priceId,
      selectedServiceId: validated.payload.service_id,
      selectedServiceName: validated.payload.service_name,
      error,
    })
    return {
      ok: false as const,
      message: 'We could not update this barber price.',
      details: [error.message],
    }
  }

  if (!data) {
    return {
      ok: false as const,
      message: 'This barber price was not found.',
      details: ['The selected service price does not belong to the current barber.'],
    }
  }

  console.info('[barber-service-prices] upserted row', {
    authUserId: userId,
    barberProfileId: barberProfile.id,
    priceId: String(data.id),
    serviceId: data.service_id,
    serviceName: data.service_name,
    price: data.price,
    durationMinutes: data.duration_minutes,
    isActive: data.is_active,
  })

  return {
    ok: true as const,
    data: toSummary(data as BarberServicePriceRecord),
  }
}

export async function deactivateBarberServicePrice(userId: string, priceId: string) {
  return updateBarberServicePrice(userId, priceId, { isActive: false })
}
