import { getCustomerProfileCompletionState } from '@/lib/customer-profiles/service'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  copyApplicationAvailabilityToBarber,
  listApplicationAvailabilitySlots,
  replaceApplicationAvailabilitySlots,
} from '@/lib/barber-availability/service'
import type {
  BarberApplicationRecord,
  BarberApplicationStatus,
  BarberApplicationSummary,
  CreateBarberApplicationInput,
  UpdateBarberProfileInput,
} from './types'

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeNullableText(value: unknown) {
  const normalized = normalizeText(value)
  return normalized.length > 0 ? normalized : null
}

function normalizeDays(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((day) => normalizeText(day))
    .filter(Boolean)
}

async function toSummary(row: BarberApplicationRecord): Promise<BarberApplicationSummary> {
  const availabilitySlots = await listApplicationAvailabilitySlots(row.id)

  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    displayName: normalizeNullableText(row.display_name),
    phone: normalizeNullableText(row.phone),
    cuttingLocation: normalizeText(row.cutting_location),
    instagramUrl: normalizeNullableText(row.instagram_url),
    tiktokUrl: normalizeNullableText(row.tiktok_url),
    facebookUrl: normalizeNullableText(row.facebook_url),
    portfolioUrl: normalizeNullableText(row.portfolio_url),
    bio: normalizeText(row.bio),
    availableDays: normalizeDays(row.available_days),
    availableStartTime: normalizeNullableText(row.available_start_time),
    availableEndTime: normalizeNullableText(row.available_end_time),
    availabilitySlots,
    notes: normalizeNullableText(row.notes),
    reviewedBy: normalizeNullableText(row.reviewed_by),
    reviewedAt: normalizeNullableText(row.reviewed_at),
    rejectionReason: normalizeNullableText(row.rejection_reason),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function getStatusOrder(status: BarberApplicationStatus) {
  switch (status) {
    case 'pending':
      return 0
    case 'approved':
      return 1
    case 'rejected':
    default:
      return 2
  }
}

function ensureLinks(input: CreateBarberApplicationInput | UpdateBarberProfileInput) {
  return [
    normalizeNullableText(input.instagramUrl),
    normalizeNullableText(input.tiktokUrl),
    normalizeNullableText(input.facebookUrl),
    normalizeNullableText(input.portfolioUrl),
  ].filter(Boolean)
}

function validateAvailability(input: Pick<CreateBarberApplicationInput, 'availabilitySlots'>) {
  const details: string[] = []

  if (!Array.isArray(input.availabilitySlots) || input.availabilitySlots.length === 0) {
    details.push('Add at least one availability slot.')
    return details
  }

  for (const [index, slot] of input.availabilitySlots.entries()) {
    const date = normalizeText(slot?.availableDate)
    const startTime = normalizeText(slot?.startTime)
    const endTime = normalizeText(slot?.endTime)

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(`${date}T00:00:00.000Z`).getTime())) {
      details.push(`Availability slot ${index + 1} must include a valid date.`)
    }

    if (!/^\d{2}:\d{2}$/.test(startTime)) {
      details.push(`Availability slot ${index + 1} must include a valid start time.`)
    }

    if (!/^\d{2}:\d{2}$/.test(endTime)) {
      details.push(`Availability slot ${index + 1} must include a valid end time.`)
    }

    if (/^\d{2}:\d{2}$/.test(startTime) && /^\d{2}:\d{2}$/.test(endTime) && startTime >= endTime) {
      details.push(`Availability slot ${index + 1} must end after it starts.`)
    }
  }

  return details
}

function validateInput(input: CreateBarberApplicationInput | UpdateBarberProfileInput) {
  const details: string[] = []

  if (!normalizeText(input.cuttingLocation)) {
    details.push('Cutting location is required.')
  }

  if (!normalizeText(input.bio)) {
    details.push('Short barber bio is required.')
  }

  if (ensureLinks(input).length === 0) {
    details.push('Add at least one social profile or portfolio link.')
  }

  if ('availabilitySlots' in input) {
    details.push(...validateAvailability(input))
  }

  return details
}

async function getPrivilegedSupabase() {
  return createAdminClient() ?? (await createClient())
}

function logApprovalStep(step: string, context: Record<string, unknown>) {
  console.info('[barber-applications][approve]', step, context)
}

function serializeError(error: { message?: string; code?: string; details?: string | null; hint?: string | null } | null | undefined) {
  if (!error) {
    return 'Unknown error.'
  }

  return [error.message, error.code, error.details, error.hint].filter(Boolean).join(' | ')
}

function isMissingColumnError(error: { code?: string; message?: string } | null | undefined) {
  if (!error) {
    return false
  }

  return error.code === '42703' || /column .* does not exist/i.test(error.message ?? '')
}

async function requireAdminSupabaseForMutations() {
  const adminClient = createAdminClient()

  if (!adminClient) {
    return {
      ok: false as const,
      message: 'Supabase service role is not configured for admin approval.',
      details: ['Set SUPABASE_SERVICE_ROLE_KEY in the deployment environment before approving barber applications.'],
    }
  }

  return {
    ok: true as const,
    client: adminClient,
  }
}

async function insertOrUpdateBarberProfileWithFallbacks(
  supabase: SupabaseClient,
  userId: string,
  payload: Record<string, unknown>
) {
  const optionalColumns = new Set([
    'specialty',
    'phone',
    'avatar_url',
    'profile_image_url',
    'profile_photo_url',
    'instagram_url',
    'tiktok_url',
    'facebook_url',
    'portfolio_url',
    'available_days',
    'available_start_time',
    'available_end_time',
    'location',
    'cutting_location',
    'bio',
    'display_name',
    'is_active',
  ])

  const nextPayload = { ...payload }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const saveResult = await saveBarberProfileForUser(supabase, userId, nextPayload)

    if (saveResult.ok) {
      return saveResult
    }

    if (!isMissingColumnError(saveResult.error)) {
      return saveResult
    }

    const match = /column ["']?([a-zA-Z0-9_]+)["']?/i.exec(saveResult.error.message ?? '')
    const missingColumn = match?.[1]

    if (!missingColumn || !optionalColumns.has(missingColumn) || !(missingColumn in nextPayload)) {
      return saveResult
    }

    logApprovalStep('retry_without_missing_column', {
      userId,
      missingColumn,
    })
    delete nextPayload[missingColumn]
  }

  return {
    ok: false as const,
    error: {
      message: 'Too many schema compatibility retries while saving the barber profile.',
    },
  }
}

async function saveBarberProfileForUser(
  supabase: Awaited<ReturnType<typeof getPrivilegedSupabase>>,
  userId: string,
  payload: Record<string, unknown>
) {
  const { data: existingProfile, error: existingProfileError } = await supabase
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
    const { error } = await supabase
      .from('barber_profiles')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingProfile.id)

    return error ? { ok: false as const, error } : { ok: true as const }
  }

  const { error } = await supabase.from('barber_profiles').insert({
    user_id: userId,
    ...payload,
  })

  return error ? { ok: false as const, error } : { ok: true as const }
}

export async function getLatestBarberApplicationForUser(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('barber_applications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116' && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('[barber-applications] Failed to load latest user application', error)
    return null
  }

  if (!data) {
    return null
  }

  return toSummary(data as BarberApplicationRecord)
}

export async function listBarberApplicationsForAdmin() {
  const supabase = await getPrivilegedSupabase()
  const { data, error } = await supabase
    .from('barber_applications')
    .select('*')
    .order('status', { ascending: true })
    .order('created_at', { ascending: false })

  if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('[barber-applications] Failed to load admin application list', error)
    return {
      ok: false as const,
      message: 'We could not load barber applications right now.',
      data: [] as BarberApplicationSummary[],
    }
  }

  return {
    ok: true as const,
    data: (await Promise.all(((data ?? []) as BarberApplicationRecord[]).map(toSummary))).sort((left, right) => {
        const statusDiff = getStatusOrder(left.status) - getStatusOrder(right.status)

        if (statusDiff !== 0) {
          return statusDiff
        }

        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      }),
  }
}

export async function createBarberApplication(userId: string, input: CreateBarberApplicationInput) {
  const profileState = await getCustomerProfileCompletionState(userId)

  if (!profileState.isComplete || !profileState.profile) {
    return {
      ok: false as const,
      code: 'INCOMPLETE_PROFILE',
      message: 'Complete your profile before applying to become a barber.',
      details: profileState.missingRequiredFields.map((field) => `${field} is missing.`),
    }
  }

  const validationErrors = validateInput(input)

  if (validationErrors.length > 0) {
    return {
      ok: false as const,
      code: 'VALIDATION_ERROR',
      message: 'Please complete the required barber application fields.',
      details: validationErrors,
    }
  }

  const supabase = await createClient()
  const { data: existingPending, error: pendingError } = await supabase
    .from('barber_applications')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .limit(1)
    .maybeSingle()

  if (pendingError && pendingError.code !== 'PGRST116' && pendingError.code !== '42P01' && pendingError.code !== 'PGRST205') {
    console.error('[barber-applications] Failed to check pending application', pendingError)
    return {
      ok: false as const,
      code: 'DATABASE_ERROR',
      message: 'We could not verify your current application status.',
      details: [pendingError.message],
    }
  }

  if (existingPending?.id) {
    return {
      ok: false as const,
      code: 'VALIDATION_ERROR',
      message: 'You already have a barber application pending review.',
      details: ['Wait for admin review before submitting another application.'],
    }
  }

  const payload = {
    user_id: userId,
    status: 'pending',
    display_name: profileState.profile.fullName,
    phone: profileState.profile.phoneNumber,
    cutting_location: normalizeText(input.cuttingLocation),
    instagram_url: normalizeNullableText(input.instagramUrl),
    tiktok_url: normalizeNullableText(input.tiktokUrl),
    facebook_url: normalizeNullableText(input.facebookUrl),
    portfolio_url: normalizeNullableText(input.portfolioUrl),
    bio: normalizeText(input.bio),
    available_days: [],
    available_start_time: null,
    available_end_time: null,
    notes: normalizeNullableText(input.notes),
  }

  const { data, error } = await supabase
    .from('barber_applications')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    console.error('[barber-applications] Failed to create application', error)
    return {
      ok: false as const,
      code: 'DATABASE_ERROR',
      message: 'We could not submit your barber application.',
      details: [error.message],
    }
  }

  await replaceApplicationAvailabilitySlots(
    (data as BarberApplicationRecord).id,
    userId,
    input.availabilitySlots
  )

  return {
    ok: true as const,
    data: await toSummary(data as BarberApplicationRecord),
  }
}

export async function approveBarberApplication(applicationId: string, reviewerId: string) {
  const adminResult = await requireAdminSupabaseForMutations()

  if (!adminResult.ok) {
    return adminResult
  }

  const supabase = adminResult.client
  logApprovalStep('start', { applicationId, reviewerId })
  const { data, error } = await supabase
    .from('barber_applications')
    .select('*')
    .eq('id', applicationId)
    .maybeSingle()

  if (error || !data) {
    console.error('[barber-applications] Failed to load application for approval', error)
    return {
      ok: false as const,
      message: 'Application not found.',
      details: [serializeError(error) || 'Missing application record.'],
    }
  }

  const application = data as BarberApplicationRecord
  logApprovalStep('application_loaded', {
    applicationId,
    applicantUserId: application.user_id,
    status: application.status,
  })
  const { data: customerProfile } = await supabase
    .from('customer_profiles')
    .select('*')
    .eq('user_id', application.user_id)
    .maybeSingle()
  const authUser = await supabase.auth.admin.getUserById(application.user_id)
  const fallbackDisplayName =
    normalizeText(application.display_name) ||
    normalizeText(customerProfile?.full_name) ||
    normalizeText(authUser?.data.user?.email?.split('@')[0]) ||
    'Barber'

  const profileImage =
    normalizeNullableText(customerProfile?.profile_image_url) ??
    normalizeNullableText(customerProfile?.profile_photo_url) ??
    normalizeNullableText(customerProfile?.avatar_url)

  const profilePayload = {
    display_name: fallbackDisplayName,
    phone: normalizeNullableText(application.phone),
    specialty: 'Only Bangers Team',
    bio: normalizeText(application.bio) || 'Only Bangers barber profile approved by admin.',
    profile_image_url: profileImage,
    profile_photo_url: profileImage,
    avatar_url: profileImage,
    cutting_location: normalizeText(application.cutting_location),
    location: normalizeText(application.cutting_location),
    instagram_url: normalizeNullableText(application.instagram_url),
    tiktok_url: normalizeNullableText(application.tiktok_url),
    facebook_url: normalizeNullableText(application.facebook_url),
    portfolio_url: normalizeNullableText(application.portfolio_url),
    available_days: [],
    available_start_time: null,
    available_end_time: null,
    is_active: true,
  }

  logApprovalStep('saving_profile', {
    applicantUserId: application.user_id,
    hasPhone: Boolean(profilePayload.phone),
    hasProfileImage: Boolean(profileImage),
  })
  const profileResult = await insertOrUpdateBarberProfileWithFallbacks(
    supabase,
    application.user_id,
    profilePayload
  )

  if (!profileResult.ok) {
    console.error(
      '[barber-applications] Failed to create or update barber profile',
      profileResult.error
    )
    return {
      ok: false as const,
      message: 'Could not activate barber profile.',
      details: [serializeError(profileResult.error)],
    }
  }

  logApprovalStep('profile_saved', { applicantUserId: application.user_id })
  const { data: existingRoleRow, error: existingRoleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', application.user_id)
    .maybeSingle()

  if (existingRoleError && existingRoleError.code !== 'PGRST116' && existingRoleError.code !== 'PGRST205') {
    console.error('[barber-applications] Failed to inspect existing role', existingRoleError)
    return {
      ok: false as const,
      message: 'Could not inspect the current user role before approval.',
      details: [serializeError(existingRoleError)],
    }
  }

  if (existingRoleRow?.role !== 'admin') {
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({ user_id: application.user_id, role: 'barber' }, { onConflict: 'user_id' })

    if (roleError) {
      console.error('[barber-applications] Failed to promote role', roleError)
      return {
        ok: false as const,
        message: 'Could not update the user role to barber.',
        details: [serializeError(roleError)],
      }
    }

    logApprovalStep('role_updated', {
      applicantUserId: application.user_id,
      role: 'barber',
    })
  } else {
    logApprovalStep('role_preserved', {
      applicantUserId: application.user_id,
      existingRole: 'admin',
    })
  }

  await copyApplicationAvailabilityToBarber(application.id, application.user_id, supabase)
  logApprovalStep('availability_copied', {
    applicationId,
    applicantUserId: application.user_id,
  })

  const { data: updated, error: updateError } = await supabase
    .from('barber_applications')
    .update({
      status: 'approved',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId)
    .select('*')
    .single()

  if (updateError) {
    console.error('[barber-applications] Failed to mark approved', updateError)
    return {
      ok: false as const,
      message: 'Barber role was updated, but the application status could not be finalized.',
      details: [serializeError(updateError)],
    }
  }

  logApprovalStep('complete', {
    applicationId,
    applicantUserId: application.user_id,
    finalStatus: 'approved',
  })

  return {
    ok: true as const,
    data: await toSummary(updated as BarberApplicationRecord),
  }
}

export async function rejectBarberApplication(
  applicationId: string,
  reviewerId: string,
  rejectionReason: string
) {
  const supabase = await getPrivilegedSupabase()
  const normalizedReason = normalizeText(rejectionReason)

  if (!normalizedReason) {
    return {
      ok: false as const,
      message: 'Rejection reason is required.',
      details: ['Provide a short reason so the applicant knows what to improve.'],
    }
  }

  const { data, error } = await supabase
    .from('barber_applications')
    .update({
      status: 'rejected',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: normalizedReason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId)
    .select('*')
    .single()

  if (error) {
    console.error('[barber-applications] Failed to reject application', error)
    return {
      ok: false as const,
      message: 'We could not reject this application right now.',
      details: [error.message],
    }
  }

  return {
    ok: true as const,
    data: await toSummary(data as BarberApplicationRecord),
  }
}

export async function updateApprovedBarberProfile(userId: string, input: UpdateBarberProfileInput) {
  const validationErrors = validateInput(input)

  if (validationErrors.length > 0) {
    return {
      ok: false as const,
      code: 'VALIDATION_ERROR',
      message: 'Please complete the required profile details.',
      details: validationErrors,
    }
  }

  const supabase = await createClient()
  const payload = {
    display_name: normalizeText(input.displayName) || 'Only Bangers Barber',
    cutting_location: normalizeText(input.cuttingLocation),
    instagram_url: normalizeNullableText(input.instagramUrl),
    tiktok_url: normalizeNullableText(input.tiktokUrl),
    facebook_url: normalizeNullableText(input.facebookUrl),
    portfolio_url: normalizeNullableText(input.portfolioUrl),
    bio: normalizeText(input.bio),
    available_days: [],
    available_start_time: null,
    available_end_time: null,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('barber_profiles')
    .update(payload)
    .eq('user_id', userId)

  if (error) {
    console.error('[barber-applications] Failed to update barber profile', error)
    return {
      ok: false as const,
      code: 'DATABASE_ERROR',
      message: 'We could not update your barber profile.',
      details: [error.message],
    }
  }

  return { ok: true as const }
}
