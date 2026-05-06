import { listVisibleGalleryImages } from '@/lib/barber-gallery/service'
import { listActiveBarberServicePricesForPublic } from '@/lib/barber-service-prices/service'
import type { BarberServicePriceSummary } from '@/lib/barber-service-prices/types'
import { getBarberReviewAggregate } from '@/lib/barber-reviews/service'
import { listAvailabilitySlotsByBarberProfileId } from '@/lib/barber-availability/service'
import { ensureUniqueBarberSlug, slugifyBarberName } from '@/lib/barbers/slug'
import { getSiteContentMap } from '@/lib/site-content/service'
import { getSiteImage } from '@/lib/site-content/public'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isSafeImageSource } from '@/lib/safe-image'

export interface BarberProfileSummary {
  id: string | null
  userId: string
  slug: string | null
  displayName: string
  fullName: string | null
  phone: string | null
  specialty: string
  profileImageUrl: string | null
  coverImageUrl: string | null
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
  goLiveRejectionReason: string | null
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

function resolvePublicBarberDisplayImage(input: {
  profileImageUrl?: string | null
  galleryImages?: Array<{ imageUrl: string }>
  defaultBarberAvatar?: string | null
}) {
  if (isSafeImageSource(input.profileImageUrl)) {
    return input.profileImageUrl ?? null
  }

  const galleryImage = input.galleryImages?.find((item) => isSafeImageSource(item.imageUrl))

  if (galleryImage) {
    return galleryImage.imageUrl
  }

  if (isSafeImageSource(input.defaultBarberAvatar)) {
    return input.defaultBarberAvatar ?? null
  }

  return null
}

function resolveBarberCoverImage(profile: BarberProfileRow | null | undefined) {
  const coverImageUrl = normalizeText(profile?.cover_image_url)
  return isSafeImageSource(coverImageUrl) ? coverImageUrl : null
}

function resolveBarberSpecialty(profile: BarberProfileRow | null | undefined) {
  return normalizeText(profile?.specialty) || 'Only Bangers Team'
}

function resolveBarberPhone(profile: BarberProfileRow | null | undefined) {
  return normalizeNullableText(profile?.phone)
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

function resolveGoLiveRejectionReason(profile: BarberProfileRow | null | undefined) {
  return normalizeNullableText(profile?.go_live_rejection_reason)
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

async function ensureBarberSlug(
  profile: BarberProfileRow | null | undefined,
  authUser?: AuthUserSummary
) {
  const existingSlug = resolveBarberSlug(profile)

  if (existingSlug) {
    return existingSlug
  }

  const userId = typeof profile?.user_id === 'string' ? profile.user_id : ''
  const profileId = typeof profile?.id === 'string' ? profile.id : null
  const displayName = resolveBarberDisplayName(userId || 'barber', profile, authUser)
  const fullName = resolveBarberFullName(profile)
  const fallbackSlug = slugifyBarberName(displayName || fullName || 'only-bangers-barber')

  if (!profileId) {
    return fallbackSlug
  }

  const nextSlug = await ensureUniqueBarberSlug({
    displayName,
    fullName,
    excludeProfileId: profileId,
  })

  const adminClient = createAdminClient()

  if (!adminClient) {
    return nextSlug
  }

  const { error } = await adminClient
    .from('barber_profiles')
    .update({
      slug: nextSlug,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profileId)

  if (error) {
    console.error('[barbers] Failed to persist generated barber slug:', error)
  }

  return nextSlug
}

async function normalizeBarberProfileRow(
  profile: BarberProfileRow,
  authUser?: AuthUserSummary
): Promise<BarberProfileRow & { slug: string }> {
  const slug = await ensureBarberSlug(profile, authUser)
  return {
    ...profile,
    slug,
  }
}

async function findBarberProfileBySlugFallback(
  supabase: Awaited<ReturnType<typeof createClient>> | NonNullable<ReturnType<typeof createAdminClient>>,
  slug: string
) {
  const normalizedSlug = slugifyBarberName(slug)
  const { data, error } = await supabase
    .from('barber_profiles')
    .select('*')
    .eq('is_active', true)
    .eq('is_live', true)

  if (error && error.code !== 'PGRST116' && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('[barbers] Failed to load fallback barber rows:', error)
    return null
  }

  const rows = (data ?? []) as BarberProfileRow[]

  for (const row of rows) {
    const matchesStoredSlug = resolveBarberSlug(row) === normalizedSlug
    const matchesDisplayName = slugifyBarberName(resolveBarberDisplayName('barber', row)) === normalizedSlug
    const matchesFullName = slugifyBarberName(resolveBarberFullName(row) ?? '') === normalizedSlug

    if (matchesStoredSlug || matchesDisplayName || matchesFullName) {
      return row
    }
  }

  return null
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
  const { data: allProfiles } = await supabase.from('barber_profiles').select('id, is_active, is_live')

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

  const totalCount = Array.isArray(allProfiles) ? allProfiles.length : 0
  const activeCount = Array.isArray(allProfiles)
    ? allProfiles.filter((row) => row.is_active === true).length
    : 0
  const liveCount = Array.isArray(allProfiles)
    ? allProfiles.filter((row) => row.is_live === true).length
    : 0
  const activeLiveCount = Array.isArray(allProfiles)
    ? allProfiles.filter((row) => row.is_active === true && row.is_live === true).length
    : 0

  console.info('[barbers] public visibility counts', {
    totalBarberProfiles: totalCount,
    activeBarbers: activeCount,
    liveBarbers: liveCount,
    activeAndLiveBarbers: activeLiveCount,
  })

  const rows = (profileRows ?? []) as BarberProfileRow[]
  const authUsers = await loadAuthUsersByIds(
    rows
      .map((row) => (typeof row.user_id === 'string' ? row.user_id : ''))
      .filter(Boolean)
  )

  const normalizedRows = await Promise.all(
    rows.map(async (row) =>
      normalizeBarberProfileRow(
        row,
        typeof row.user_id === 'string' ? authUsers.get(row.user_id) : undefined
      )
    )
  )

  return normalizedRows
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
  const activeSiteContentMap = await getSiteContentMap()
  const defaultBarberAvatar = getSiteImage(activeSiteContentMap, 'default_barber_avatar')

  const priced = await Promise.all(
    barbers.map(async (barber) => {
      const publicProfile = await getBarberProfileByUserId(barber.id)
      const gallery = publicProfile?.id ? await listVisibleGalleryImages(publicProfile.id) : []
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
        profile_image_url: resolvePublicBarberDisplayImage({
          profileImageUrl: barber.profile_image_url,
          galleryImages: gallery,
          defaultBarberAvatar,
        }),
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
    phone: null,
    specialty: row.specialty,
    profileImageUrl: row.profile_image_url,
    coverImageUrl: null,
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
    goLiveRejectionReason: null,
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

  const normalizedProfile = await normalizeBarberProfileRow(data as BarberProfileRow, authUsers.get(userId))

  return {
    id: typeof normalizedProfile.id === 'string' ? normalizedProfile.id : null,
    userId: typeof normalizedProfile.user_id === 'string' ? normalizedProfile.user_id : userId,
    slug: resolveBarberSlug(normalizedProfile),
    displayName: resolveBarberDisplayName(userId, normalizedProfile, authUsers.get(userId)),
    fullName: resolveBarberFullName(normalizedProfile),
    phone: resolveBarberPhone(normalizedProfile),
    specialty: resolveBarberSpecialty(normalizedProfile),
    profileImageUrl: resolveBarberImage(normalizedProfile),
    coverImageUrl: resolveBarberCoverImage(normalizedProfile),
    bio: resolveBarberBio(normalizedProfile),
    location: resolveBarberLocation(normalizedProfile),
    cuttingLocation: resolveBarberCuttingLocation(normalizedProfile),
    latitude: normalizeNumber(normalizedProfile.latitude),
    longitude: normalizeNumber(normalizedProfile.longitude),
    mapUrl: resolveOptionalLink(normalizedProfile, 'map_url'),
    instagramUrl: resolveOptionalLink(normalizedProfile, 'instagram_url'),
    tiktokUrl: resolveOptionalLink(normalizedProfile, 'tiktok_url'),
    facebookUrl: resolveOptionalLink(normalizedProfile, 'facebook_url'),
    portfolioUrl: resolveOptionalLink(normalizedProfile, 'portfolio_url'),
    availableDays: resolveBarberDays(normalizedProfile),
    availableStartTime: resolveOptionalTime(normalizedProfile, 'available_start_time'),
    availableEndTime: resolveOptionalTime(normalizedProfile, 'available_end_time'),
    isActive: resolveBarberActive(normalizedProfile),
    isLive: resolveBarberLive(normalizedProfile),
    setupStatus: resolveBarberSetupStatus(normalizedProfile),
    goLiveRejectionReason: resolveGoLiveRejectionReason(normalizedProfile),
  } satisfies BarberProfileSummary
}

export async function getBarberProfileBySlug(slug: string): Promise<PublicBarberDetailPageData | null> {
  const normalizedSlug = normalizeText(slug)

  if (!normalizedSlug) {
    return null
  }

  const privilegedSupabase = getPrivilegedSupabase()
  const supabase = privilegedSupabase ?? (await createClient())
  const { data: exactMatch, error } = await supabase
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

  const resolvedRow =
    exactMatch ??
    (await findBarberProfileBySlugFallback(supabase, normalizedSlug))

  if (!resolvedRow || typeof resolvedRow.id !== 'string' || typeof resolvedRow.user_id !== 'string') {
    return null
  }

  const authUsers = await loadAuthUsersByIds([resolvedRow.user_id])
  const normalizedRow = await normalizeBarberProfileRow(
    resolvedRow as BarberProfileRow,
    authUsers.get(resolvedRow.user_id)
  )
  const barber = toPublicSummary(normalizedRow, authUsers.get(resolvedRow.user_id))

  if (!barber) {
    return null
  }

  const [servicePricesResult, gallery, reviews, availability] = await Promise.all([
    listActiveBarberServicePricesForPublic(barber.id),
    listVisibleGalleryImages(String(resolvedRow.id)),
    getBarberReviewAggregate(String(resolvedRow.id)),
    listAvailabilitySlotsByBarberProfileId(String(resolvedRow.id)),
  ])
  const activeSiteContentMap = await getSiteContentMap()
  const defaultBarberAvatar = getSiteImage(activeSiteContentMap, 'default_barber_avatar')

  return {
    barber: {
      ...barber,
      profile_image_url: resolvePublicBarberDisplayImage({
        profileImageUrl: barber.profile_image_url,
        galleryImages: gallery,
        defaultBarberAvatar,
      }),
    },
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

  const normalizedRows = await Promise.all(
    ((data ?? []) as Array<Record<string, unknown>>).map(async (row) =>
      normalizeBarberProfileRow(row, typeof row.user_id === 'string' ? authUsers.get(row.user_id) : undefined)
    )
  )

  for (const row of normalizedRows) {
    if (typeof row.user_id !== 'string') {
      continue
    }

    byId.set(row.user_id, {
      id: typeof row.id === 'string' ? row.id : null,
      userId: row.user_id,
      slug: resolveBarberSlug(row),
      displayName: resolveBarberDisplayName(row.user_id, row, authUsers.get(row.user_id)),
      fullName: resolveBarberFullName(row),
      phone: resolveBarberPhone(row),
      specialty: resolveBarberSpecialty(row),
      profileImageUrl: resolveBarberImage(row),
      coverImageUrl: resolveBarberCoverImage(row),
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
      goLiveRejectionReason: resolveGoLiveRejectionReason(row),
    })
  }

  return byId
}
