import { listVisibleGalleryImages } from '@/lib/barber-gallery/service'
import { listActiveBarberServicePricesForPublic } from '@/lib/barber-service-prices/service'
import type { BarberServicePriceSummary } from '@/lib/barber-service-prices/types'
import { getBarberReviewAggregate } from '@/lib/barber-reviews/service'
import { listAvailabilitySlotsByBarberProfileId } from '@/lib/barber-availability/service'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isSafeImageSource } from '@/lib/safe-image'

export interface BarberProfileSummary {
  id: string | null
  userId: string
  slug: string | null
  displayName: string
  fullName: string | null
  specialty: string
  profileImageUrl: string | null
  bio: string
  location: string | null
  cuttingLocation: string | null
  latitude: number | null
  longitude: number | null
  mapUrl: string | null
  instagramUrl: string | null
  tiktokUrl: string | null
  facebookUrl: string | null
  portfolioUrl: string | null
  availableDays: string[]
  availableStartTime: string | null
  availableEndTime: string | null
  isActive: boolean
  isLive: boolean
  setupStatus: string
}

export interface PublicBarberSummary {
  id: string
  slug: string
  display_name: string
  full_name: string | null
  profile_image_url: string | null
  specialty: string
  bio: string
  location: string | null
  cutting_location: string | null
  latitude: number | null
  longitude: number | null
  map_url: string | null
  instagram_url: string | null
  tiktok_url: string | null
  facebook_url: string | null
  portfolio_url: string | null
  available_days: string[]
  available_start_time: string | null
  available_end_time: string | null
  is_active: boolean
  is_live: boolean
  setup_status: string
}

export interface PublicBarberDirectoryCard extends PublicBarberSummary {
  startingPrice: number | null
  averageRating: number | null
  reviewCount: number
}

export interface PublicBarberDetailPageData {
  barber: PublicBarberSummary
  servicePrices: BarberServicePriceSummary[]
  gallery: Awaited<ReturnType<typeof listVisibleGalleryImages>>
  reviews: Awaited<ReturnType<typeof getBarberReviewAggregate>>
  availabilityPreview: Array<{
    id: string
    availableDate: string
    startTime: string
    endTime: string
  }>
}

type AuthUserSummary = {
  email?: string
}

type BarberProfileRow = Record<string, unknown>

function getPrivilegedSupabase() {
  return createAdminClient()
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeNullableText(value: unknown) {
  const normalized = normalizeText(value)
  return normalized || null
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

function resolveBarberDisplayName(
  userId: string,
  profile: BarberProfileRow | null | undefined,
  authUser?: AuthUserSummary
) {
  const candidates = [
    normalizeText(profile?.display_name),
    normalizeText(profile?.full_name),
    normalizeText(profile?.name),
  ]

  return candidates.find(Boolean) || fallbackDisplayName(userId, authUser)
}

function resolveBarberFullName(profile: BarberProfileRow | null | undefined) {
  return normalizeNullableText(profile?.full_name) ?? normalizeNullableText(profile?.display_name)
}

function resolveBarberImage(profile: BarberProfileRow | null | undefined) {
  const avatarUrl = normalizeText(profile?.avatar_url)
  const profileImageUrl = normalizeText(profile?.profile_image_url)
  const profilePhotoUrl = normalizeText(profile?.profile_photo_url)
  const candidates = [avatarUrl, profileImageUrl, profilePhotoUrl]
  const valid = candidates.find((candidate) => isSafeImageSource(candidate))

  return valid ?? null
}

function resolveBarberSpecialty(profile: BarberProfileRow | null | undefined) {
  return normalizeText(profile?.specialty) || 'Only Bangers Team'
}

function resolveBarberBio(profile: BarberProfileRow | null | undefined) {
  return (
    normalizeText(profile?.bio) ||
    'Premium barber available through the Only Bangers booking flow.'
  )
}

function resolveBarberDays(profile: BarberProfileRow | null | undefined) {
  if (!Array.isArray(profile?.available_days)) {
    return []
  }

  return profile.available_days
    .map((day) => normalizeText(day))
    .filter(Boolean)
}

function resolveOptionalTime(
  profile: BarberProfileRow | null | undefined,
  key: 'available_start_time' | 'available_end_time'
) {
  const value = normalizeText(profile?.[key])
  return value || null
}

function resolveBarberActive(profile: BarberProfileRow | null | undefined) {
  return typeof profile?.is_active === 'boolean' ? profile.is_active : true
}

function resolveBarberLive(profile: BarberProfileRow | null | undefined) {
  return typeof profile?.is_live === 'boolean' ? profile.is_live : false
}

function resolveBarberSetupStatus(profile: BarberProfileRow | null | undefined) {
  return normalizeText(profile?.setup_status) || 'draft'
}

function resolveOptionalLink(
  profile: BarberProfileRow | null | undefined,
  key: 'instagram_url' | 'tiktok_url' | 'facebook_url' | 'portfolio_url' | 'map_url'
) {
  const value = normalizeText(profile?.[key])
  return value || null
}

function resolveBarberLocation(profile: BarberProfileRow | null | undefined) {
  return normalizeNullableText(profile?.location)
}

function resolveBarberCuttingLocation(profile: BarberProfileRow | null | undefined) {
  return normalizeNullableText(profile?.cutting_location)
}

function resolveBarberSlug(profile: BarberProfileRow | null | undefined) {
  return normalizeNullableText(profile?.slug)
}

function fallbackDisplayName(userId: string, authUser?: AuthUserSummary) {
  const email = authUser?.email?.trim()

  if (email) {
    const localPart = email.split('@')[0]?.trim()

    if (localPart) {
      return localPart
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase())
    }
  }

  return `Barber ${userId.slice(0, 8).toUpperCase()}`
}

async function loadAuthUsersByIds(userIds: string[]) {
  const adminClient = createAdminClient()
  const byId = new Map<string, AuthUserSummary>()

  if (!adminClient || userIds.length === 0) {
    return byId
  }

  await Promise.all(
    Array.from(new Set(userIds)).map(async (userId) => {
      const { data, error } = await adminClient.auth.admin.getUserById(userId)

      if (error || !data.user) {
        return
      }

      byId.set(userId, {
        email: data.user.email ?? '',
      })
    })
  )

  return byId
}

function toPublicSummary(profile: BarberProfileRow, authUser?: AuthUserSummary): PublicBarberSummary | null {
  const userId = typeof profile.user_id === 'string' ? profile.user_id : null
  const profileId = typeof profile.id === 'string' ? profile.id : null
  const slug = resolveBarberSlug(profile)

  if (!userId || !profileId || !slug) {
    return null
  }

  return {
    id: userId,
    slug,
    display_name: resolveBarberDisplayName(userId, profile, authUser),
    full_name: resolveBarberFullName(profile),
    profile_image_url: resolveBarberImage(profile),
    specialty: resolveBarberSpecialty(profile),
    bio: resolveBarberBio(profile),
    location: resolveBarberLocation(profile),
    cutting_location: resolveBarberCuttingLocation(profile),
    latitude: normalizeNumber(profile.latitude),
    longitude: normalizeNumber(profile.longitude),
    map_url: resolveOptionalLink(profile, 'map_url'),
    instagram_url: resolveOptionalLink(profile, 'instagram_url'),
    tiktok_url: resolveOptionalLink(profile, 'tiktok_url'),
    facebook_url: resolveOptionalLink(profile, 'facebook_url'),
    portfolio_url: resolveOptionalLink(profile, 'portfolio_url'),
    available_days: resolveBarberDays(profile),
    available_start_time: resolveOptionalTime(profile, 'available_start_time'),
    available_end_time: resolveOptionalTime(profile, 'available_end_time'),
    is_active: resolveBarberActive(profile),
    is_live: resolveBarberLive(profile),
    setup_status: resolveBarberSetupStatus(profile),
  }
}

export async function listPublicBarbers(): Promise<PublicBarberSummary[]> {
  const privilegedSupabase = getPrivilegedSupabase()
  const supabase = privilegedSupabase ?? (await createClient())

  const { data: profileRows, error } = await supabase
    .from('barber_profiles')
    .select('*')
    .eq('is_active', true)
    .eq('is_live', true)
    .order('display_name', { ascending: true })

  if (error && error.code !== '42P01' && error.code !== 'PGRST116') {
    console.error('[barbers] Failed to load public barber rows:', error)
    return []
  }

  const rows = (profileRows ?? []) as BarberProfileRow[]
  const authUsers = await loadAuthUsersByIds(
    rows
      .map((row) => (typeof row.user_id === 'string' ? row.user_id : ''))
      .filter(Boolean)
  )

  return rows
    .map((row) =>
      toPublicSummary(
        row,
        typeof row.user_id === 'string' ? authUsers.get(row.user_id) : undefined
      )
    )
    .filter((barber): barber is PublicBarberSummary => barber !== null)
    .sort((left, right) => left.display_name.localeCompare(right.display_name))
}

export async function listPublicBarberDirectoryCards(): Promise<PublicBarberDirectoryCard[]> {
  const barbers = await listPublicBarbers()

  const priced = await Promise.all(
    barbers.map(async (barber) => {
      const publicProfile = await getBarberProfileByUserId(barber.id)
      const reviewAggregate = publicProfile?.id
        ? await getBarberReviewAggregate(publicProfile.id)
        : { averageRating: null, reviewCount: 0, recentReviews: [] }
      const servicePricesResult = await listActiveBarberServicePricesForPublic(barber.id)
      const startingPrice =
        servicePricesResult.ok && servicePricesResult.data.length > 0
          ? Math.min(...servicePricesResult.data.map((item) => item.price))
          : null

      return {
        ...barber,
        startingPrice,
        averageRating: reviewAggregate.averageRating,
        reviewCount: reviewAggregate.reviewCount,
      }
    })
  )

  return priced
}

export async function listBookableBarbers(): Promise<BarberProfileSummary[]> {
  const rows = await listPublicBarbers()

  return rows.map((row) => ({
    id: null,
    userId: row.id,
    slug: row.slug,
    displayName: row.display_name,
    fullName: row.full_name,
    specialty: row.specialty,
    profileImageUrl: row.profile_image_url,
    bio: row.bio,
    location: row.location,
    cuttingLocation: row.cutting_location,
    latitude: row.latitude,
    longitude: row.longitude,
    mapUrl: row.map_url,
    instagramUrl: row.instagram_url,
    tiktokUrl: row.tiktok_url,
    facebookUrl: row.facebook_url,
    portfolioUrl: row.portfolio_url,
    availableDays: row.available_days,
    availableStartTime: row.available_start_time,
    availableEndTime: row.available_end_time,
    isActive: row.is_active,
    isLive: row.is_live,
    setupStatus: row.setup_status,
  }))
}

export async function getBarberProfileByUserId(userId: string) {
  const privilegedSupabase = getPrivilegedSupabase()
  const supabase = privilegedSupabase ?? (await createClient())
  const { data, error } = await supabase
    .from('barber_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116' && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('[barbers] Failed to load barber profile:', error)
    return null
  }

  if (!data) {
    return null
  }

  const authUsers = await loadAuthUsersByIds([userId])

  return {
    id: typeof data.id === 'string' ? data.id : null,
    userId: typeof data.user_id === 'string' ? data.user_id : userId,
    slug: resolveBarberSlug(data as BarberProfileRow),
    displayName: resolveBarberDisplayName(userId, data as BarberProfileRow, authUsers.get(userId)),
    fullName: resolveBarberFullName(data as BarberProfileRow),
    specialty: resolveBarberSpecialty(data as BarberProfileRow),
    profileImageUrl: resolveBarberImage(data as BarberProfileRow),
    bio: resolveBarberBio(data as BarberProfileRow),
    location: resolveBarberLocation(data as BarberProfileRow),
    cuttingLocation: resolveBarberCuttingLocation(data as BarberProfileRow),
    latitude: normalizeNumber((data as BarberProfileRow).latitude),
    longitude: normalizeNumber((data as BarberProfileRow).longitude),
    mapUrl: resolveOptionalLink(data as BarberProfileRow, 'map_url'),
    instagramUrl: resolveOptionalLink(data as BarberProfileRow, 'instagram_url'),
    tiktokUrl: resolveOptionalLink(data as BarberProfileRow, 'tiktok_url'),
    facebookUrl: resolveOptionalLink(data as BarberProfileRow, 'facebook_url'),
    portfolioUrl: resolveOptionalLink(data as BarberProfileRow, 'portfolio_url'),
    availableDays: resolveBarberDays(data as BarberProfileRow),
    availableStartTime: resolveOptionalTime(data as BarberProfileRow, 'available_start_time'),
    availableEndTime: resolveOptionalTime(data as BarberProfileRow, 'available_end_time'),
    isActive: resolveBarberActive(data as BarberProfileRow),
    isLive: resolveBarberLive(data as BarberProfileRow),
    setupStatus: resolveBarberSetupStatus(data as BarberProfileRow),
  } satisfies BarberProfileSummary
}

export async function getBarberProfileBySlug(slug: string): Promise<PublicBarberDetailPageData | null> {
  const normalizedSlug = normalizeText(slug)

  if (!normalizedSlug) {
    return null
  }

  const privilegedSupabase = getPrivilegedSupabase()
  const supabase = privilegedSupabase ?? (await createClient())
  const { data, error } = await supabase
    .from('barber_profiles')
    .select('*')
    .eq('slug', normalizedSlug)
    .eq('is_active', true)
    .eq('is_live', true)
    .maybeSingle()

  if (error && error.code !== 'PGRST116' && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('[barbers] Failed to load barber by slug:', error)
    return null
  }

  if (!data || typeof data.id !== 'string' || typeof data.user_id !== 'string') {
    return null
  }

  const authUsers = await loadAuthUsersByIds([data.user_id])
  const barber = toPublicSummary(data as BarberProfileRow, authUsers.get(data.user_id))

  if (!barber) {
    return null
  }

  const [servicePricesResult, gallery, reviews, availability] = await Promise.all([
    listActiveBarberServicePricesForPublic(barber.id),
    listVisibleGalleryImages(String(data.id)),
    getBarberReviewAggregate(String(data.id)),
    listAvailabilitySlotsByBarberProfileId(String(data.id)),
  ])

  return {
    barber,
    servicePrices: servicePricesResult.ok ? servicePricesResult.data : [],
    gallery,
    reviews,
    availabilityPreview: availability.slice(0, 8),
  }
}

export async function getBarberProfilesByUserIds(
  userIds: string[]
): Promise<Map<string, BarberProfileSummary>> {
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)))

  if (uniqueUserIds.length === 0) {
    return new Map()
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('barber_profiles')
    .select('*')
    .in('user_id', uniqueUserIds)

  if (error) {
    console.error('[barbers] Failed to load barber profile batch:', error)
    return new Map()
  }

  const authUsers = await loadAuthUsersByIds(uniqueUserIds)
  const byId = new Map<string, BarberProfileSummary>()

  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    if (typeof row.user_id !== 'string') {
      continue
    }

    byId.set(row.user_id, {
      id: typeof row.id === 'string' ? row.id : null,
      userId: row.user_id,
      slug: resolveBarberSlug(row),
      displayName: resolveBarberDisplayName(row.user_id, row, authUsers.get(row.user_id)),
      fullName: resolveBarberFullName(row),
      specialty: resolveBarberSpecialty(row),
      profileImageUrl: resolveBarberImage(row),
      bio: resolveBarberBio(row),
      location: resolveBarberLocation(row),
      cuttingLocation: resolveBarberCuttingLocation(row),
      latitude: normalizeNumber(row.latitude),
      longitude: normalizeNumber(row.longitude),
      mapUrl: resolveOptionalLink(row, 'map_url'),
      instagramUrl: resolveOptionalLink(row, 'instagram_url'),
      tiktokUrl: resolveOptionalLink(row, 'tiktok_url'),
      facebookUrl: resolveOptionalLink(row, 'facebook_url'),
      portfolioUrl: resolveOptionalLink(row, 'portfolio_url'),
      availableDays: resolveBarberDays(row),
      availableStartTime: resolveOptionalTime(row, 'available_start_time'),
      availableEndTime: resolveOptionalTime(row, 'available_end_time'),
      isActive: resolveBarberActive(row),
      isLive: resolveBarberLive(row),
      setupStatus: resolveBarberSetupStatus(row),
    })
  }

  return byId
}
