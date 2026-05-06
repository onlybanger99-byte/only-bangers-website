import { createAdminClient } from '@/lib/supabase/admin'
import { ensureUniqueBarberSlug } from '@/lib/barbers/slug'

type AppRole = 'customer' | 'barber' | 'admin'
type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>
type CreateUserFailureStep =
  | 'service_role_validation'
  | 'supabase.auth.admin.createUser'
  | 'supabase.auth.admin.inviteUserByEmail'
  | 'user_roles.upsert'
  | 'customer_profiles.upsert'
  | 'barber_profiles.upsert'
  | 'rollback.deleteUser'

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

function splitFullName(fullName: string) {
  const normalized = normalizeText(fullName)

  if (!normalized) {
    return {
      firstName: '',
      lastName: '',
    }
  }

  const [firstName, ...rest] = normalized.split(/\s+/)

  return {
    firstName,
    lastName: rest.join(' '),
  }
}

function requireAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!serviceRoleKey || !serviceRoleKey.trim()) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing on the server.')
  }

  if (anonKey && serviceRoleKey.trim() === anonKey.trim()) {
    throw new Error('Service role key is missing or incorrectly set to anon key.')
  }

  const adminClient = createAdminClient()

  if (!adminClient) {
    throw new Error('Supabase admin client is not configured.')
  }

  return adminClient
}

async function saveBarberProfile(
  adminClient: AdminClient,
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

async function saveCustomerProfile(
  adminClient: AdminClient,
  userId: string,
  email: string
) {
  const fallbackDisplayName = fallbackDisplayNameFromEmail(email)
  const nameParts = fallbackDisplayName.split(' ').filter(Boolean)
  const firstName = nameParts[0] ?? 'Only'
  const lastName = nameParts.slice(1).join(' ') || 'Bangers'

  const { error } = await adminClient.from('customer_profiles').upsert(
    {
      user_id: userId,
      first_name: firstName,
      last_name: lastName,
      phone_number: null,
      profile_photo_url: null,
      profile_image_url: null,
      avatar_url: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  return error ? { ok: false as const, error } : { ok: true as const }
}

async function saveCustomerProfileFromInput(
  adminClient: AdminClient,
  userId: string,
  input: {
    fullName?: string | null
    phoneNumber?: string | null
    profileImageUrl?: string | null
  }
) {
  const { firstName, lastName } = splitFullName(input.fullName ?? '')
  const { error } = await adminClient.from('customer_profiles').upsert(
    {
      user_id: userId,
      first_name: firstName || null,
      last_name: lastName || null,
      phone_number: normalizeText(input.phoneNumber) || null,
      profile_photo_url: normalizeText(input.profileImageUrl) || null,
      profile_image_url: normalizeText(input.profileImageUrl) || null,
      avatar_url: normalizeText(input.profileImageUrl) || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  return error ? { ok: false as const, error } : { ok: true as const }
}

async function getBarberProfileRecord(adminClient: AdminClient, userId: string) {
  const { data, error } = await adminClient
    .from('barber_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116' && error.code !== '42P01' && error.code !== 'PGRST205') {
    return {
      ok: false as const,
      error,
      data: null,
    }
  }

  return {
    ok: true as const,
    data: (data ?? null) as Record<string, unknown> | null,
  }
}

async function getUserAccount(adminClient: AdminClient, userId: string) {
  const result = await adminClient.auth.admin.getUserById(userId)

  if (result.error || !result.data.user) {
    return {
      ok: false as const,
      message: 'Could not load this auth user.',
      details: [result.error?.message ?? 'User not found in Supabase Auth.'],
    }
  }

  return {
    ok: true as const,
    data: result.data.user,
  }
}

async function rollbackCreatedUser(adminClient: AdminClient, userId: string) {
  const { error } = await adminClient.auth.admin.deleteUser(userId)
  return error ? { ok: false as const, error } : { ok: true as const }
}

function createFailure(params: {
  step: CreateUserFailureStep
  message: string
  details: string[]
  code?: string | null
  rollbackFailed?: boolean
  rollbackDetails?: string[]
}) {
  return {
    ok: false as const,
    step: params.step,
    message: params.message,
    details: params.details,
    code: params.code ?? null,
    rollbackFailed: params.rollbackFailed ?? false,
    rollbackDetails: params.rollbackDetails ?? [],
  }
}

async function provisionAdminManagedUser(
  adminClient: AdminClient,
  input: {
    userId: string
    email: string
    role: AppRole
    displayName?: string | null
  }
) {
  const { error: roleError } = await adminClient
    .from('user_roles')
    .upsert({ user_id: input.userId, role: input.role }, { onConflict: 'user_id' })

  if (roleError) {
    return {
      ok: false as const,
      step: 'user_roles.upsert' as const,
      error: roleError,
    }
  }

  const profileSeedName = normalizeText(input.displayName) || fallbackDisplayNameFromEmail(input.email)
  const customerProfileResult = await saveCustomerProfileFromInput(adminClient, input.userId, {
    fullName: profileSeedName,
    phoneNumber: null,
    profileImageUrl: null,
  })

  if (!customerProfileResult.ok) {
    return {
      ok: false as const,
      step: 'customer_profiles.upsert' as const,
      error: customerProfileResult.error,
    }
  }

  if (input.role === 'barber') {
    const slug = await ensureUniqueBarberSlug({
      displayName: profileSeedName,
      fullName: profileSeedName,
    })
    const barberProfileResult = await saveBarberProfile(adminClient, input.userId, {
      slug,
      display_name: profileSeedName,
      full_name: profileSeedName,
      specialty: 'Only Bangers Team',
      bio: 'New barber profile created by admin.',
      is_active: true,
      is_live: false,
      setup_status: 'draft',
    })

    if (!barberProfileResult.ok) {
      return {
        ok: false as const,
        step: 'barber_profiles.upsert' as const,
        error: barberProfileResult.error,
      }
    }
  }

  return { ok: true as const }
}

export async function createManualUser(input: {
  email: string
  password: string
  role?: AppRole
}) {
  const email = normalizeText(input.email).toLowerCase()
  const password = normalizeText(input.password)
  const requestedRole = input.role ?? ''
  const role: AppRole = isAppRole(requestedRole) ? requestedRole : 'customer'

  if (!email || !password) {
    return {
      ok: false as const,
      message: 'Email and password are required.',
      details: ['Provide a valid email address and password.'],
    }
  }

  let adminClient: AdminClient

  try {
    adminClient = requireAdminClient()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Supabase admin client is not configured.'
    console.error('[admin-users.createManualUser] service role validation failed', {
      step: 'service_role_validation',
      message,
    })

    return createFailure({
      step: 'service_role_validation',
      message,
      details: [message],
    })
  }

  const createdUser = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createdUser.error || !createdUser.data.user) {
    console.error('[admin-users.createManualUser] auth create user failed', {
      step: 'supabase.auth.admin.createUser',
      email,
      role,
      code: createdUser.error?.code ?? null,
      message: createdUser.error?.message ?? 'User creation failed.',
    })

    return createFailure({
      step: 'supabase.auth.admin.createUser',
      message: createdUser.error?.message ?? 'Could not create this user.',
      details: [createdUser.error?.message ?? 'User creation failed.'],
      code: createdUser.error?.code ?? null,
    })
  }

  const userId = createdUser.data.user.id

  const provisionResult = await provisionAdminManagedUser(adminClient, {
    userId,
    email,
    role,
  })

  if (!provisionResult.ok) {
    const rollback = await rollbackCreatedUser(adminClient, userId)
    console.error('[admin-users.createManualUser] provisioning failed', {
      step: provisionResult.step,
      userId,
      email,
      role,
      code: provisionResult.error.code ?? null,
      message: provisionResult.error.message,
      rollbackOk: rollback.ok,
      rollbackMessage: rollback.ok ? null : rollback.error.message,
    })

    return createFailure({
      step: provisionResult.step,
      message:
        provisionResult.step === 'user_roles.upsert'
          ? 'User was created, but the role could not be assigned.'
          : provisionResult.step === 'customer_profiles.upsert'
            ? 'User was created, but the profile row could not be saved.'
            : 'User was created, but the barber profile could not be saved.',
      details: [
        provisionResult.error.message,
        rollback.ok ? 'The partially created auth user was rolled back.' : `Rollback failed: ${rollback.error.message}`,
      ],
      code: provisionResult.error.code ?? null,
      rollbackFailed: !rollback.ok,
      rollbackDetails: rollback.ok ? [] : [rollback.error.message],
    })
  }

  return {
    ok: true as const,
    data: {
      id: userId,
      email,
      role,
    },
  }
}

export async function inviteUserByEmailAsAdmin(input: {
  email: string
  role?: AppRole
  displayName?: string | null
  redirectTo: string
}) {
  const email = normalizeText(input.email).toLowerCase()
  const requestedRole = input.role ?? ''
  const role: AppRole = isAppRole(requestedRole) ? requestedRole : 'customer'
  const redirectTo = normalizeText(input.redirectTo)

  if (!email) {
    return {
      ok: false as const,
      message: 'Email is required.',
      details: ['Provide the user email before sending an invite.'],
    }
  }

  if (!redirectTo) {
    return {
      ok: false as const,
      message: 'Invite redirect URL is required.',
      details: ['Configure the complete-profile redirect before sending invites.'],
    }
  }

  let adminClient: AdminClient

  try {
    adminClient = requireAdminClient()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Supabase admin client is not configured.'
    return createFailure({
      step: 'service_role_validation',
      message,
      details: [message],
    })
  }

  const inviteResult = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: {
      role,
      display_name: normalizeText(input.displayName) || null,
    },
  })

  if (inviteResult.error || !inviteResult.data.user) {
    console.error('[admin-users.inviteUserByEmailAsAdmin] invite failed', {
      step: 'supabase.auth.admin.inviteUserByEmail',
      email,
      role,
      code: inviteResult.error?.code ?? null,
      message: inviteResult.error?.message ?? 'Invite failed.',
    })

    return createFailure({
      step: 'supabase.auth.admin.inviteUserByEmail',
      message: inviteResult.error?.message ?? 'Could not send this invite.',
      details: [
        inviteResult.error?.message ??
          'Supabase could not send the invite email. Check email provider and redirect URL configuration.',
      ],
      code: inviteResult.error?.code ?? null,
    })
  }

  const provisionResult = await provisionAdminManagedUser(adminClient, {
    userId: inviteResult.data.user.id,
    email,
    role,
    displayName: input.displayName,
  })

  if (!provisionResult.ok) {
    console.error('[admin-users.inviteUserByEmailAsAdmin] provisioning failed after invite', {
      step: provisionResult.step,
      email,
      role,
      userId: inviteResult.data.user.id,
      code: provisionResult.error.code ?? null,
      message: provisionResult.error.message,
    })

    return createFailure({
      step: provisionResult.step,
      message:
        provisionResult.step === 'user_roles.upsert'
          ? 'Invitation sent, but the user role could not be saved.'
          : provisionResult.step === 'customer_profiles.upsert'
            ? 'Invitation sent, but the customer profile could not be saved.'
            : 'Invitation sent, but the barber profile could not be saved.',
      details: [provisionResult.error.message],
      code: provisionResult.error.code ?? null,
    })
  }

  return {
    ok: true as const,
    data: {
      id: inviteResult.data.user.id,
      email,
      role,
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

export async function updateUserAccountAsAdmin(input: {
  userId: string
  email: string
  displayName: string
  fullName: string
  phoneNumber: string
  role: AppRole
  accountStatus: 'active' | 'suspended' | 'pending'
}) {
  if (!input.userId || !isAppRole(input.role)) {
    return {
      ok: false as const,
      message: 'User id and a valid role are required.',
      details: ['Select a user and role before saving.'],
    }
  }

  const adminClient = requireAdminClient()
  const accountResult = await getUserAccount(adminClient, input.userId)

  if (!accountResult.ok) {
    return accountResult
  }

  const normalizedEmail = normalizeText(input.email).toLowerCase()
  const normalizedDisplayName = normalizeText(input.displayName)
  const normalizedFullName = normalizeText(input.fullName)
  const normalizedPhone = normalizeText(input.phoneNumber)
  const banDuration = input.accountStatus === 'suspended' ? '876000h' : 'none'
  const authUpdate = await adminClient.auth.admin.updateUserById(input.userId, {
    email: normalizedEmail || accountResult.data.email,
    user_metadata: {
      ...(accountResult.data.user_metadata ?? {}),
      full_name: normalizedFullName || normalizedDisplayName || accountResult.data.user_metadata?.full_name || null,
      display_name: normalizedDisplayName || null,
      phone: normalizedPhone || null,
    },
    ban_duration: banDuration,
  })

  if (authUpdate.error) {
    return {
      ok: false as const,
      message: 'Could not update this auth account.',
      details: [authUpdate.error.message],
    }
  }

  const roleResult = await changeUserRole({
    userId: input.userId,
    role: input.role,
  })

  if (!roleResult.ok) {
    return roleResult
  }

  const customerProfileResult = await saveCustomerProfileFromInput(adminClient, input.userId, {
    fullName: normalizedFullName || normalizedDisplayName,
    phoneNumber: normalizedPhone,
    profileImageUrl: null,
  })

  if (!customerProfileResult.ok) {
    return {
      ok: false as const,
      message: 'Auth user updated, but the customer profile could not be saved.',
      details: [customerProfileResult.error.message],
    }
  }

  if (input.role === 'barber') {
    const barberRecord = await getBarberProfileRecord(adminClient, input.userId)

    if (!barberRecord.ok) {
      return {
        ok: false as const,
        message: 'Auth user updated, but the barber profile could not be loaded.',
        details: [barberRecord.error.message],
      }
    }

    const slug = await ensureUniqueBarberSlug({
      displayName: normalizedDisplayName || normalizedFullName || accountResult.data.email || '',
      fullName: normalizedFullName || normalizedDisplayName || accountResult.data.email || '',
      excludeProfileId: typeof barberRecord.data?.id === 'string' ? barberRecord.data.id : null,
    })

    const barberProfileResult = await saveBarberProfile(adminClient, input.userId, {
      slug,
      display_name: normalizedDisplayName || normalizedFullName || fallbackDisplayNameFromEmail(accountResult.data.email ?? 'barber'),
      full_name: normalizedFullName || normalizedDisplayName || null,
      phone: normalizedPhone || null,
      is_active: input.accountStatus !== 'suspended',
      is_live: input.accountStatus === 'suspended' ? false : barberRecord.data?.is_live ?? false,
      updated_at: new Date().toISOString(),
    })

    if (!barberProfileResult.ok) {
      return {
        ok: false as const,
        message: 'Auth user updated, but the barber profile could not be saved.',
        details: [barberProfileResult.error.message],
      }
    }
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
  fullName?: string | null
  phone?: string | null
  specialty: string
  bio: string
  location?: string | null
  cuttingLocation: string
  avatarUrl?: string | null
  profileImageUrl?: string | null
  instagramUrl?: string | null
  tiktokUrl?: string | null
  facebookUrl?: string | null
  portfolioUrl?: string | null
  setupStatus?: string | null
  isActive: boolean
  isLive?: boolean
}) {
  const adminClient = requireAdminClient()
  const displayName = normalizeText(input.displayName)
  const fullName = normalizeText(input.fullName)
  const phone = normalizeText(input.phone)
  const specialty = normalizeText(input.specialty)
  const bio = normalizeText(input.bio)
  const location = normalizeText(input.location)
  const cuttingLocation = normalizeText(input.cuttingLocation)

  if (!input.userId || !displayName || !specialty || !bio) {
    return {
      ok: false as const,
      message: 'Display name, specialty, and bio are required.',
      details: ['Provide barber profile details before saving.'],
    }
  }

  const profileRecord = await getBarberProfileRecord(adminClient, input.userId)

  if (!profileRecord.ok) {
    return {
      ok: false as const,
      message: 'Could not load this barber profile.',
      details: [profileRecord.error.message],
    }
  }

  const slug = await ensureUniqueBarberSlug({
    displayName,
    fullName: fullName || displayName,
    excludeProfileId: typeof profileRecord.data?.id === 'string' ? profileRecord.data.id : null,
  })

  const profileResult = await saveBarberProfile(adminClient, input.userId, {
      slug,
      display_name: displayName,
      full_name: fullName || displayName,
      phone: phone || null,
      specialty,
      bio,
      location: location || cuttingLocation || null,
      cutting_location: cuttingLocation || null,
      avatar_url: normalizeText(input.avatarUrl) || null,
      profile_image_url: normalizeText(input.profileImageUrl) || normalizeText(input.avatarUrl) || null,
      instagram_url: normalizeText(input.instagramUrl) || null,
      tiktok_url: normalizeText(input.tiktokUrl) || null,
      facebook_url: normalizeText(input.facebookUrl) || null,
      portfolio_url: normalizeText(input.portfolioUrl) || null,
      setup_status: normalizeText(input.setupStatus) || 'draft',
      is_active: input.isActive,
      is_live: input.isActive ? input.isLive === true : false,
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

  const customerProfileResult = await saveCustomerProfileFromInput(adminClient, input.userId, {
    fullName: fullName || displayName,
    phoneNumber: phone || null,
    profileImageUrl: normalizeText(input.profileImageUrl) || normalizeText(input.avatarUrl) || null,
  })

  if (!customerProfileResult.ok) {
    return {
      ok: false as const,
      message: 'Barber profile was updated, but the linked customer profile could not be saved.',
      details: [customerProfileResult.error.message],
    }
  }

  return { ok: true as const }
}

export async function deactivateBarberProfile(userId: string) {
  const adminClient = requireAdminClient()
  const { error } = await adminClient
    .from('barber_profiles')
    .update({
      is_active: false,
      is_live: false,
      setup_status: 'deactivated',
      updated_at: new Date().toISOString(),
    })
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

export async function activateBarberProfile(userId: string) {
  const adminClient = requireAdminClient()
  const { error } = await adminClient
    .from('barber_profiles')
    .update({
      is_active: true,
      setup_status: 'draft',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (error) {
    return {
      ok: false as const,
      message: 'Could not activate this barber profile.',
      details: [error.message],
    }
  }

  await adminClient
    .from('user_roles')
    .upsert({ user_id: userId, role: 'barber' }, { onConflict: 'user_id' })

  return { ok: true as const }
}

export async function resendAccountSetupEmail(input: {
  userId: string
  redirectTo: string
}) {
  const adminClient = requireAdminClient()
  const accountResult = await getUserAccount(adminClient, input.userId)

  if (!accountResult.ok || !accountResult.data.email) {
    return {
      ok: false as const,
      message: 'Could not find a valid email address for this user.',
      details: accountResult.ok ? ['The selected auth user does not have an email address.'] : accountResult.details,
    }
  }

  const sendResult = await adminClient.auth.resetPasswordForEmail(accountResult.data.email, {
    redirectTo: input.redirectTo,
  })

  if (sendResult.error) {
    return {
      ok: false as const,
      message: 'Could not send an account setup email.',
      details: [sendResult.error.message, 'Check Supabase email provider and redirect URL configuration.'],
    }
  }

  return { ok: true as const }
}
