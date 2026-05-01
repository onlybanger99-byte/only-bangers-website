import { services } from '@/data/services'
import { getSafeImage, isSafeImageSource } from '@/lib/safe-image'
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

async function getBarberProfileIdentity(userId: string) {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('barber_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116' && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('[barber-service-prices] Failed to resolve barber profile', error)
  }

  return typeof data?.id === 'string' ? data.id : null
}

function validateInput(input: BarberServicePriceInput) {
  const serviceName = normalizeText(input.serviceName)
  const price = normalizeNumber(input.price)
  const durationMinutes =
    input.durationMinutes == null ? null : normalizeNumber(input.durationMinutes)
  const details: string[] = []

  if (!serviceName) {
    details.push('Service name is required.')
  }

  if (price == null || price < 0) {
    details.push('Price must be a valid non-negative number.')
  }

  if (durationMinutes != null && durationMinutes <= 0) {
    details.push('Duration must be greater than zero.')
  }

  return {
    details,
    payload: {
      service_id: normalizeText(input.serviceId) || null,
      service_name: serviceName,
      price: price ?? 0,
      duration_minutes: durationMinutes == null ? null : Math.round(durationMinutes),
    },
  }
}

function matchesRequestedService(
  row: BarberServicePriceRecord,
  filter?: { serviceId?: string | null; serviceName?: string | null }
) {
  const serviceId = normalizeText(filter?.serviceId)
  const serviceName = normalizeText(filter?.serviceName).toLowerCase()

  if (!serviceId && !serviceName) {
    return true
  }

  if (serviceId && row.service_id === serviceId) {
    return true
  }

  if (serviceName && normalizeText(row.service_name).toLowerCase() === serviceName) {
    return true
  }

  return false
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

export async function listBarberServicePricesForOwner(userId: string) {
  const barberProfileId = await getBarberProfileIdentity(userId)

  if (!barberProfileId) {
    return {
      ok: false as const,
      message: 'Your barber profile is not active yet.',
      data: [] as BarberServicePriceSummary[],
    }
  }

  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('barber_service_prices')
    .select('*')
    .eq('barber_profile_id', barberProfileId)
    .order('service_name', { ascending: true })

  if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('[barber-service-prices] Failed to load owner prices', error)
    return {
      ok: false as const,
      message: 'We could not load your barber prices right now.',
      data: [] as BarberServicePriceSummary[],
    }
  }

  return {
    ok: true as const,
    data: ((data ?? []) as BarberServicePriceRecord[]).map(toSummary),
  }
}

export async function listActiveBarberServicePricesForPublic(barberUserId: string) {
  const barberProfileId = await getBarberProfileIdentity(barberUserId)

  if (!barberProfileId) {
    return {
      ok: true as const,
      data: [] as BarberServicePriceSummary[],
    }
  }

  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('barber_service_prices')
    .select('*')
    .eq('barber_profile_id', barberProfileId)
    .eq('is_active', true)
    .order('service_name', { ascending: true })

  if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('[barber-service-prices] Failed to load public prices', error)
    return {
      ok: false as const,
      message: 'We could not load barber service prices right now.',
      data: [] as BarberServicePriceSummary[],
    }
  }

  return {
    ok: true as const,
    data: ((data ?? []) as BarberServicePriceRecord[]).map(toSummary),
  }
}

export async function listPublicBarbersForService(filter: {
  serviceId?: string | null
  serviceName?: string | null
}) {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('barber_service_prices')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true })
    .order('service_name', { ascending: true })

  if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('[barber-service-prices] Failed to load service offerings', error)
    return {
      ok: false as const,
      message: 'We could not load barber prices for this service right now.',
      data: [] as PublicBarberServicePriceSummary[],
    }
  }

  const matchingRows = ((data ?? []) as BarberServicePriceRecord[]).filter((row) =>
    matchesRequestedService(row, filter)
  )
  const profileMap = await getPublicProfilesMap(
    Array.from(new Set(matchingRows.map((row) => row.barber_profile_id)))
  )

  return {
    ok: true as const,
    data: matchingRows
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
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('barber_service_prices')
    .select('*')
    .eq('is_active', true)

  if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('[barber-service-prices] Failed to load public service summaries', error)
    return {
      ok: false as const,
      message: 'We could not load public service pricing right now.',
      data: [] as PublicServicePriceSummary[],
    }
  }

  const profileMap = await getPublicProfilesMap(
    Array.from(new Set(((data ?? []) as BarberServicePriceRecord[]).map((row) => row.barber_profile_id)))
  )
  const serviceDefinitions = new Map(
    services.map((service) => [
      service.id,
      {
        serviceId: service.id,
        serviceName: service.name,
      },
    ])
  )
  const grouped = new Map<string, PublicServicePriceSummary>()

  for (const row of (data ?? []) as BarberServicePriceRecord[]) {
    const profile = profileMap.get(row.barber_profile_id)

    if (!profile) {
      continue
    }

    const knownDefinition = row.service_id ? serviceDefinitions.get(row.service_id) : null
    const serviceName = knownDefinition?.serviceName ?? normalizeText(row.service_name)
    const serviceId = knownDefinition?.serviceId ?? row.service_id ?? null
    const key = serviceId ?? serviceName.toLowerCase()
    const current = grouped.get(key)

    if (!current) {
      grouped.set(key, {
        serviceId,
        serviceName,
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

  return {
    ok: true as const,
    data: Array.from(grouped.values()).sort((left, right) =>
      left.serviceName.localeCompare(right.serviceName)
    ),
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

  return data ? toSummary(data as BarberServicePriceRecord) : null
}

export async function createBarberServicePrice(userId: string, input: BarberServicePriceInput) {
  const barberProfileId = await getBarberProfileIdentity(userId)

  if (!barberProfileId) {
    return {
      ok: false as const,
      message: 'Your barber profile is not active yet.',
      details: ['A barber profile is required before you can add prices.'],
    }
  }

  const validated = validateInput(input)

  if (validated.details.length > 0) {
    return {
      ok: false as const,
      message: 'Service pricing is invalid.',
      details: validated.details,
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('barber_service_prices')
    .insert({
      barber_profile_id: barberProfileId,
      ...validated.payload,
      is_active: true,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[barber-service-prices] Failed to create price', error)
    return {
      ok: false as const,
      message: 'We could not save this barber price.',
      details: [error.message],
    }
  }

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
  const barberProfileId = await getBarberProfileIdentity(userId)

  if (!barberProfileId) {
    return {
      ok: false as const,
      message: 'Your barber profile is not active yet.',
      details: ['A barber profile is required before you can manage prices.'],
    }
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  const details: string[] = []

  if (Object.prototype.hasOwnProperty.call(input, 'serviceName')) {
    const serviceName = normalizeText(input.serviceName)

    if (!serviceName) {
      details.push('Service name is required.')
    } else {
      updates.service_name = serviceName
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, 'serviceId')) {
    updates.service_id = normalizeText(input.serviceId) || null
  }

  if (Object.prototype.hasOwnProperty.call(input, 'price')) {
    const price = normalizeNumber(input.price)

    if (price == null || price < 0) {
      details.push('Price must be a valid non-negative number.')
    } else {
      updates.price = price
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, 'durationMinutes')) {
    const duration = input.durationMinutes == null ? null : normalizeNumber(input.durationMinutes)

    if (duration != null && duration <= 0) {
      details.push('Duration must be greater than zero.')
    } else {
      updates.duration_minutes = duration == null ? null : Math.round(duration)
    }
  }

  if (typeof input.isActive === 'boolean') {
    updates.is_active = input.isActive
  }

  if (details.length > 0) {
    return {
      ok: false as const,
      message: 'Service pricing is invalid.',
      details,
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('barber_service_prices')
    .update(updates)
    .eq('id', priceId)
    .eq('barber_profile_id', barberProfileId)
    .select('*')
    .maybeSingle()

  if (error) {
    console.error('[barber-service-prices] Failed to update price', error)
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

  return {
    ok: true as const,
    data: toSummary(data as BarberServicePriceRecord),
  }
}

export async function deactivateBarberServicePrice(userId: string, priceId: string) {
  return updateBarberServicePrice(userId, priceId, { isActive: false })
}

export function getPriceDisplayLabel(price?: number | null) {
  if (price == null || !Number.isFinite(price)) {
    return 'Prices vary by barber'
  }

  return `From R${price}`
}

export function getSafeProfileImage(src?: string | null) {
  return getSafeImage(src)
}
