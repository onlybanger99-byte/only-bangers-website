import { createClient } from '@/lib/supabase/server'
import type {
  CustomerProfileCompletionState,
  CustomerProfileInput,
  CustomerProfileRecord,
  CustomerProfileSummary,
} from './types'

function normalizeRequired(value: string | null | undefined) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

function getProfileImageValue(profile: Partial<CustomerProfileRecord> | null | undefined) {
  return normalizeRequired(
    profile?.profile_image_url ?? profile?.profile_photo_url ?? profile?.avatar_url
  )
}

function toSummary(
  userId: string,
  profile: Partial<CustomerProfileRecord> | null | undefined
): CustomerProfileSummary {
  const firstName = normalizeRequired(profile?.first_name)
  const lastName = normalizeRequired(profile?.last_name)
  const phoneNumber = normalizeRequired(profile?.phone_number)
  const profileImageUrl = getProfileImageValue(profile)

  return {
    userId,
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(' ').trim() || 'Only Bangers Customer',
    phoneNumber,
    profileImageUrl,
    isComplete:
      firstName.length > 0 &&
      lastName.length > 0 &&
      phoneNumber.length > 0 &&
      profileImageUrl.length > 0,
  }
}

export function isCustomerProfileComplete(profile: CustomerProfileSummary | null | undefined) {
  return profile?.isComplete ?? false
}

export async function getCustomerProfileCompletionState(
  userId: string
): Promise<CustomerProfileCompletionState> {
  const profile = await getCustomerProfile(userId)

  return {
    userId,
    profile,
    isComplete: isCustomerProfileComplete(profile),
    missingRequiredFields: [
      !profile?.firstName ? 'first_name' : null,
      !profile?.lastName ? 'last_name' : null,
      !profile?.phoneNumber ? 'phone_number' : null,
      !profile?.profileImageUrl ? 'profile_image_url' : null,
    ].filter(
      (
        field
      ): field is 'first_name' | 'last_name' | 'phone_number' | 'profile_image_url' =>
        field !== null
    ),
  }
}

export async function isProfileComplete(userId: string) {
  const profileState = await getCustomerProfileCompletionState(userId)
  return profileState.isComplete
}

export async function getCustomerProfile(userId: string): Promise<CustomerProfileSummary | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('customer_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[customer-profiles] Failed to read profile:', error)
    }

    return null
  }

  return toSummary(userId, data ?? null)
}

export async function getCustomerProfilesByUserIds(
  userIds: string[]
): Promise<Map<string, CustomerProfileSummary>> {
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)))

  if (uniqueUserIds.length === 0) {
    return new Map()
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('customer_profiles')
    .select('*')
    .in('user_id', uniqueUserIds)

  if (error) {
    console.error('[customer-profiles] Failed to read profile batch:', error)
    return new Map()
  }

  const byId = new Map<string, CustomerProfileSummary>()

  for (const row of (data ?? []) as CustomerProfileRecord[]) {
    byId.set(row.user_id, toSummary(row.user_id, row))
  }

  return byId
}

export async function upsertCustomerProfile(
  userId: string,
  input: CustomerProfileInput
): Promise<
  | { ok: true; data: CustomerProfileSummary }
  | { ok: false; message: string; details: string[] }
> {
  const payload = {
    user_id: userId,
    first_name: normalizeRequired(input.firstName),
    last_name: normalizeRequired(input.lastName),
    phone_number: normalizeRequired(input.phoneNumber),
    profile_image_url: normalizeRequired(input.profileImageUrl),
  }

  const details: string[] = []

  if (!payload.first_name) {
    details.push('first_name is required.')
  }

  if (!payload.last_name) {
    details.push('last_name is required.')
  }

  if (!payload.phone_number) {
    details.push('phone_number is required.')
  }

  if (!payload.profile_image_url) {
    details.push('profile_image_url is required.')
  }

  if (details.length > 0) {
    return {
      ok: false,
      message: 'Profile is incomplete.',
      details,
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('customer_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (error) {
    console.error('[customer-profiles] Failed to upsert profile:', error)

    return {
      ok: false,
      message: 'Failed to save profile.',
      details: [error.message],
    }
  }

  return {
    ok: true,
    data: toSummary(userId, data as CustomerProfileRecord),
  }
}
