import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export interface BarberProfileSummary {
  userId: string
  displayName: string
  specialty: string
  profileImageUrl: string
  bio: string
  cuttingLocation: string | null
  instagramUrl: string | null
  tiktokUrl: string | null
  facebookUrl: string | null
  portfolioUrl: string | null
  availableDays: string[]
  availableStartTime: string | null
  availableEndTime: string | null
  isActive: boolean
}

export interface PublicBarberSummary {
  id: string
  display_name: string
  profile_image_url: string
  specialty: string
  bio: string
  cutting_location: string | null
  instagram_url: string | null
  tiktok_url: string | null
  facebook_url: string | null
  portfolio_url: string | null
  available_days: string[]
  available_start_time: string | null
  available_end_time: string | null
  is_active: boolean
}

type AuthUserSummary = {
  email?: string
}

function getPrivilegedSupabase() {
  return createAdminClient()
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function resolveBarberDisplayName(
  userId: string,
  profile: Record<string, unknown> | null | undefined,
  authUser?: AuthUserSummary
) {
  const candidates = [
    normalizeText(profile?.display_name),
    normalizeText(profile?.name),
    normalizeText(profile?.full_name),
  ]

  return candidates.find(Boolean) || fallbackDisplayName(userId, authUser)
}

function resolveBarberImage(profile: Record<string, unknown> | null | undefined) {
  const candidates = [
    normalizeText(profile?.profile_image_url),
    normalizeText(profile?.profile_photo_url),
    normalizeText(profile?.avatar_url),
  ]

  return candidates.find(Boolean) || '/images/header-bg.png'
}

function resolveBarberSpecialty(profile: Record<string, unknown> | null | undefined) {
  return normalizeText(profile?.specialty) || 'Only Bangers Team'
}

function resolveBarberBio(profile: Record<string, unknown> | null | undefined) {
  return (
    normalizeText(profile?.bio) ||
    'Premium barber available through the Only Bangers booking flow.'
  )
}

function resolveBarberLocation(profile: Record<string, unknown> | null | undefined) {
  const value = normalizeText(profile?.cutting_location)
  return value || null
}

function resolveOptionalLink(
  profile: Record<string, unknown> | null | undefined,
  key: 'instagram_url' | 'tiktok_url' | 'facebook_url' | 'portfolio_url'
) {
  const value = normalizeText(profile?.[key])
  return value || null
}

function resolveBarberDays(profile: Record<string, unknown> | null | undefined) {
  if (!Array.isArray(profile?.available_days)) {
    return []
  }

  return profile.available_days
    .map((day) => normalizeText(day))
    .filter(Boolean)
}

function resolveOptionalTime(
  profile: Record<string, unknown> | null | undefined,
  key: 'available_start_time' | 'available_end_time'
) {
  const value = normalizeText(profile?.[key])
  return value || null
}

function resolveBarberActive(profile: Record<string, unknown> | null | undefined) {
  return typeof profile?.is_active === 'boolean' ? profile.is_active : true
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

export async function listPublicBarbers(): Promise<PublicBarberSummary[]> {
  const privilegedSupabase = getPrivilegedSupabase()
  const supabase = privilegedSupabase ?? (await createClient())

  const { data: roleRows, error: roleError } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'barber')

  if (roleError) {
    console.error('[barbers] Failed to load barber roles:', roleError)
    return []
  }

  const barberIds = Array.from(
    new Set(
      ((roleRows ?? []) as Array<{ user_id: string | null }>)
        .map((row) => row.user_id)
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
    )
  )

  if (barberIds.length === 0) {
    return []
  }

  const { data: profileRows, error: profileError } = await supabase
    .from('barber_profiles')
    .select('*')
    .in('user_id', barberIds)

  if (profileError && profileError.code !== '42P01' && profileError.code !== 'PGRST116') {
    console.error('[barbers] Failed to load barber profile rows:', profileError)
  }

  const profileMap = new Map(
    ((profileRows ?? []) as Array<Record<string, unknown>>)
      .filter((row) => typeof row.user_id === 'string' && row.user_id.length > 0)
      .map((row) => [row.user_id as string, row])
  )
  const authUsers = await loadAuthUsersByIds(barberIds)

  return barberIds
    .map((userId) => {
      const profile = profileMap.get(userId)
      const authUser = authUsers.get(userId)
      const isActive = resolveBarberActive(profile)

      return {
        id: userId,
        display_name: resolveBarberDisplayName(userId, profile, authUser),
        profile_image_url: resolveBarberImage(profile),
        specialty: resolveBarberSpecialty(profile),
        bio: resolveBarberBio(profile),
        cutting_location: resolveBarberLocation(profile),
        instagram_url: resolveOptionalLink(profile, 'instagram_url'),
        tiktok_url: resolveOptionalLink(profile, 'tiktok_url'),
        facebook_url: resolveOptionalLink(profile, 'facebook_url'),
        portfolio_url: resolveOptionalLink(profile, 'portfolio_url'),
        available_days: resolveBarberDays(profile),
        available_start_time: resolveOptionalTime(profile, 'available_start_time'),
        available_end_time: resolveOptionalTime(profile, 'available_end_time'),
        is_active: isActive,
      } satisfies PublicBarberSummary
    })
    .filter((barber) => barber.is_active)
    .sort((left, right) => left.display_name.localeCompare(right.display_name))
}

export async function listBookableBarbers(): Promise<BarberProfileSummary[]> {
  const rows = await listPublicBarbers()

  return rows.map((row) => ({
    userId: row.id,
    displayName: row.display_name,
    specialty: row.specialty,
    profileImageUrl: row.profile_image_url,
    bio: row.bio,
    cuttingLocation: row.cutting_location,
    instagramUrl: row.instagram_url,
    tiktokUrl: row.tiktok_url,
    facebookUrl: row.facebook_url,
    portfolioUrl: row.portfolio_url,
    availableDays: row.available_days,
    availableStartTime: row.available_start_time,
    availableEndTime: row.available_end_time,
    isActive: row.is_active,
  }))
}

export async function getBarberProfileByUserId(userId: string) {
  const privilegedSupabase = getPrivilegedSupabase()
  const supabase = privilegedSupabase ?? (await createClient())
  const { data, error } = await supabase
    .from('barber_profiles')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  if (error && error.code !== 'PGRST116' && error.code !== '42P01' && error.code !== 'PGRST205') {
    if (error.code !== 'PGRST116') {
      console.error('[barbers] Failed to load barber profile:', error)
    }

    return null
  }

  if (!data) {
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()

    if (roleError || roleData?.role !== 'barber') {
      return null
    }

    const authUsers = await loadAuthUsersByIds([userId])

    return {
      userId,
      displayName: fallbackDisplayName(userId, authUsers.get(userId)),
      specialty: 'Only Bangers Team',
      profileImageUrl: '/images/header-bg.png',
      bio: 'Premium barber available through the Only Bangers booking flow.',
      cuttingLocation: null,
      instagramUrl: null,
      tiktokUrl: null,
      facebookUrl: null,
      portfolioUrl: null,
      availableDays: [],
      availableStartTime: null,
      availableEndTime: null,
      isActive: true,
    } satisfies BarberProfileSummary
  }

  return {
    userId: typeof data.user_id === 'string' ? data.user_id : userId,
    displayName: resolveBarberDisplayName(userId, data as Record<string, unknown>),
    specialty: resolveBarberSpecialty(data as Record<string, unknown>),
    profileImageUrl: resolveBarberImage(data as Record<string, unknown>),
    bio: resolveBarberBio(data as Record<string, unknown>),
    cuttingLocation: resolveBarberLocation(data as Record<string, unknown>),
    instagramUrl: resolveOptionalLink(data as Record<string, unknown>, 'instagram_url'),
    tiktokUrl: resolveOptionalLink(data as Record<string, unknown>, 'tiktok_url'),
    facebookUrl: resolveOptionalLink(data as Record<string, unknown>, 'facebook_url'),
    portfolioUrl: resolveOptionalLink(data as Record<string, unknown>, 'portfolio_url'),
    availableDays: resolveBarberDays(data as Record<string, unknown>),
    availableStartTime: resolveOptionalTime(data as Record<string, unknown>, 'available_start_time'),
    availableEndTime: resolveOptionalTime(data as Record<string, unknown>, 'available_end_time'),
    isActive: resolveBarberActive(data as Record<string, unknown>),
  } satisfies BarberProfileSummary
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

  const byId = new Map<string, BarberProfileSummary>()

  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    if (typeof row.user_id !== 'string') {
      continue
    }

    byId.set(row.user_id, {
      userId: row.user_id,
      displayName: resolveBarberDisplayName(row.user_id, row),
      specialty: resolveBarberSpecialty(row),
      profileImageUrl: resolveBarberImage(row),
      bio: resolveBarberBio(row),
      cuttingLocation: resolveBarberLocation(row),
      instagramUrl: resolveOptionalLink(row, 'instagram_url'),
      tiktokUrl: resolveOptionalLink(row, 'tiktok_url'),
      facebookUrl: resolveOptionalLink(row, 'facebook_url'),
      portfolioUrl: resolveOptionalLink(row, 'portfolio_url'),
      availableDays: resolveBarberDays(row),
      availableStartTime: resolveOptionalTime(row, 'available_start_time'),
      availableEndTime: resolveOptionalTime(row, 'available_end_time'),
      isActive: resolveBarberActive(row),
    })
  }

  return byId
}
