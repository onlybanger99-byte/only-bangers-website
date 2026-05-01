import { createAdminClient } from '@/lib/supabase/admin'

type AppRole = 'customer' | 'barber' | 'admin'

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function fallbackDisplayNameFromEmail(email: string) {
  const localPart = email.split('@')[0]?.trim() || 'barber'
  return localPart.replace(/[._-]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}

function isAppRole(value: string): value is AppRole {
  return value === 'customer' || value === 'barber' || value === 'admin'
}

function requireAdminClient() {
  const adminClient = createAdminClient()

  if (!adminClient) {
    throw new Error('Supabase admin client is not configured.')
  }

  return adminClient
}

async function saveBarberProfile(
  adminClient: ReturnType<typeof requireAdminClient>,
  userId: string,
  payload: Record<string, unknown>
) {
  const { data: existingProfile, error: existingProfileError } = await adminClient
    .from('barber_profiles')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (
    existingProfileError &&
    existingProfileError.code !== 'PGRST116' &&
    existingProfileError.code !== '42P01' &&
    existingProfileError.code !== 'PGRST205'
  ) {
    return {
      ok: false as const,
      error: existingProfileError,
    }
  }

  if (existingProfile?.id) {
    const { error } = await adminClient
      .from('barber_profiles')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingProfile.id)

    return error ? { ok: false as const, error } : { ok: true as const }
  }

  const { error } = await adminClient.from('barber_profiles').insert({
    user_id: userId,
    ...payload,
  })

  return error ? { ok: false as const, error } : { ok: true as const }
}

export async function createManualUser(input: {
  email: string
  password: string
  role: AppRole
}) {
  const email = normalizeText(input.email).toLowerCase()
  const password = normalizeText(input.password)

  if (!email || !password || !isAppRole(input.role)) {
    return {
      ok: false as const,
      message: 'Email, password, and role are required.',
      details: ['Provide a valid email, password, and role.'],
    }
  }

  const adminClient = requireAdminClient()
  const createdUser = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createdUser.error || !createdUser.data.user) {
    return {
      ok: false as const,
      message: 'Could not create this user.',
      details: [createdUser.error?.message ?? 'User creation failed.'],
    }
  }

  const userId = createdUser.data.user.id

  const { error: roleError } = await adminClient
    .from('user_roles')
    .upsert({ user_id: userId, role: input.role }, { onConflict: 'user_id' })

  if (roleError) {
    return {
      ok: false as const,
      message: 'User was created, but the role could not be assigned.',
      details: [roleError.message],
    }
  }

  if (input.role === 'barber') {
    await saveBarberProfile(adminClient, userId, {
      display_name: fallbackDisplayNameFromEmail(email),
      specialty: 'Only Bangers Team',
      bio: 'New barber profile created by admin.',
      is_active: true,
    })
  }

  return {
    ok: true as const,
    data: {
      id: userId,
      email,
      role: input.role,
    },
  }
}

export async function changeUserRole(input: {
  userId: string
  role: AppRole
}) {
  if (!input.userId || !isAppRole(input.role)) {
    return {
      ok: false as const,
      message: 'User and role are required.',
      details: ['Provide a target user and valid role.'],
    }
  }

  const adminClient = requireAdminClient()
  const { error: roleError } = await adminClient
    .from('user_roles')
    .upsert({ user_id: input.userId, role: input.role }, { onConflict: 'user_id' })

  if (roleError) {
    return {
      ok: false as const,
      message: 'Could not update this user role.',
      details: [roleError.message],
    }
  }

  if (input.role === 'barber') {
    const userResponse = await adminClient.auth.admin.getUserById(input.userId)
    const fallbackDisplayName = fallbackDisplayNameFromEmail(userResponse.data.user?.email ?? 'barber@example.com')

    await saveBarberProfile(adminClient, input.userId, {
        display_name: fallbackDisplayName,
        specialty: 'Only Bangers Team',
        bio: 'Barber profile activated by admin role change.',
        is_active: true,
      })
  } else {
    await adminClient
      .from('barber_profiles')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', input.userId)
  }

  return { ok: true as const }
}

export async function deleteUserAccount(userId: string) {
  if (!userId) {
    return {
      ok: false as const,
      message: 'User id is required.',
      details: ['Provide a target user id.'],
    }
  }

  const adminClient = requireAdminClient()

  await Promise.all([
    adminClient.from('user_roles').delete().eq('user_id', userId),
    adminClient.from('customer_profiles').delete().eq('user_id', userId),
    adminClient.from('barber_profiles').delete().eq('user_id', userId),
    adminClient.from('barber_applications').delete().eq('user_id', userId),
    adminClient.from('barber_availability_slots').delete().eq('user_id', userId),
  ])

  const deletion = await adminClient.auth.admin.deleteUser(userId)

  if (deletion.error) {
    return {
      ok: false as const,
      message: 'Could not delete this user.',
      details: [deletion.error.message],
    }
  }

  return { ok: true as const }
}

export async function updateBarberProfileAsAdmin(input: {
  userId: string
  displayName: string
  specialty: string
  bio: string
  cuttingLocation: string
  instagramUrl?: string | null
  tiktokUrl?: string | null
  facebookUrl?: string | null
  portfolioUrl?: string | null
  isActive: boolean
}) {
  const adminClient = requireAdminClient()
  const displayName = normalizeText(input.displayName)
  const specialty = normalizeText(input.specialty)
  const bio = normalizeText(input.bio)
  const cuttingLocation = normalizeText(input.cuttingLocation)

  if (!input.userId || !displayName || !specialty || !bio) {
    return {
      ok: false as const,
      message: 'Display name, specialty, and bio are required.',
      details: ['Provide barber profile details before saving.'],
    }
  }

  const profileResult = await saveBarberProfile(adminClient, input.userId, {
      display_name: displayName,
      specialty,
      bio,
      cutting_location: cuttingLocation || null,
      instagram_url: normalizeText(input.instagramUrl) || null,
      tiktok_url: normalizeText(input.tiktokUrl) || null,
      facebook_url: normalizeText(input.facebookUrl) || null,
      portfolio_url: normalizeText(input.portfolioUrl) || null,
      is_active: input.isActive,
    })

  if (!profileResult.ok) {
    return {
      ok: false as const,
      message: 'Could not update this barber profile.',
      details: [profileResult.error.message],
    }
  }

  if (input.isActive) {
    await adminClient
      .from('user_roles')
      .upsert({ user_id: input.userId, role: 'barber' }, { onConflict: 'user_id' })
  }

  return { ok: true as const }
}

export async function deactivateBarberProfile(userId: string) {
  const adminClient = requireAdminClient()
  const { error } = await adminClient
    .from('barber_profiles')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  if (error) {
    return {
      ok: false as const,
      message: 'Could not deactivate this barber.',
      details: [error.message],
    }
  }

  return { ok: true as const }
}
