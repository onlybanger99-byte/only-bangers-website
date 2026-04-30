import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export interface BarberProfileSummary {
  userId: string
  displayName: string
  specialty: string
  profileImageUrl: string
}

export interface PublicBarberSummary {
  id: string
  display_name: string
  profile_image_url: string
  specialty: string
  bio: string
  is_active: boolean
}

type AuthUserSummary = {
  email?: string
}

function getPrivilegedSupabase() {
  return createAdminClient()
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
    .select('user_id, display_name, specialty, profile_photo_url, bio, is_active')
    .in('user_id', barberIds)

  if (profileError && profileError.code !== '42P01' && profileError.code !== 'PGRST116') {
    console.error('[barbers] Failed to load barber profile rows:', profileError)
  }

  const profileMap = new Map(
    ((profileRows ?? []) as Array<{
      user_id: string
      display_name: string | null
      specialty: string | null
      profile_photo_url: string | null
      bio: string | null
      is_active: boolean | null
    }>).map((row) => [row.user_id, row])
  )
  const authUsers = await loadAuthUsersByIds(barberIds)

  return barberIds
    .map((userId) => {
      const profile = profileMap.get(userId)
      const authUser = authUsers.get(userId)
      const isActive = profile ? profile.is_active !== false : true

      return {
        id: userId,
        display_name:
          profile?.display_name?.trim() || fallbackDisplayName(userId, authUser),
        profile_image_url:
          profile?.profile_photo_url?.trim() || '/images/header-bg.png',
        specialty: profile?.specialty?.trim() || 'Only Bangers Team',
        bio:
          profile?.bio?.trim() ||
          'Premium barber available through the Only Bangers booking flow.',
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
  }))
}

export async function getBarberProfileByUserId(userId: string) {
  const privilegedSupabase = getPrivilegedSupabase()
  const supabase = privilegedSupabase ?? (await createClient())
  const { data, error } = await supabase
    .from('barber_profiles')
    .select('user_id, display_name, specialty, profile_photo_url')
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
    } satisfies BarberProfileSummary
  }

  return {
    userId: data.user_id,
    displayName: data.display_name?.trim() || 'Only Bangers Barber',
    specialty: data.specialty?.trim() || 'Only Bangers Team',
    profileImageUrl: data.profile_photo_url?.trim() || '/images/header-bg.png',
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
    .select('user_id, display_name, specialty, profile_photo_url')
    .in('user_id', uniqueUserIds)

  if (error) {
    console.error('[barbers] Failed to load barber profile batch:', error)
    return new Map()
  }

  const byId = new Map<string, BarberProfileSummary>()

  for (const row of (data ?? []) as Array<{
    user_id: string
    display_name: string | null
    specialty: string | null
    profile_photo_url: string | null
  }>) {
    byId.set(row.user_id, {
      userId: row.user_id,
      displayName: row.display_name?.trim() || 'Only Bangers Barber',
      specialty: row.specialty?.trim() || 'Only Bangers Team',
      profileImageUrl: row.profile_photo_url?.trim() || '/images/header-bg.png',
    })
  }

  return byId
}
