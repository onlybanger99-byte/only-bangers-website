import type { User } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function buildFallbackName(email: string | undefined) {
  const localPart = normalizeText(email?.split('@')[0] ?? '')

  if (!localPart) {
    return ''
  }

  return localPart
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function resolveNameParts(user: Pick<User, 'email' | 'user_metadata'>) {
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>
  const firstName = normalizeText(metadata.first_name)
  const lastName = normalizeText(metadata.last_name)
  const fullName =
    normalizeText(metadata.full_name) ||
    normalizeText(metadata.name) ||
    `${firstName} ${lastName}`.trim() ||
    buildFallbackName(user.email)

  if (firstName || lastName) {
    return {
      firstName: firstName || normalizeText(fullName.split(' ')[0] ?? ''),
      lastName: lastName || normalizeText(fullName.split(' ').slice(1).join(' ')),
    }
  }

  const segments = fullName.split(' ').filter(Boolean)

  return {
    firstName: normalizeText(segments[0] ?? ''),
    lastName: normalizeText(segments.slice(1).join(' ')),
  }
}

function resolveAvatar(user: Pick<User, 'user_metadata'>) {
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>
  return (
    normalizeText(metadata.avatar_url) ||
    normalizeText(metadata.picture) ||
    normalizeText(metadata.profile_image_url) ||
    null
  )
}

export async function ensureUserBootstrap(user: Pick<User, 'id' | 'email' | 'user_metadata'>) {
  const adminClient = createAdminClient()

  if (!adminClient) {
    return {
      ok: false as const,
      message: 'Supabase service role is not configured for auth bootstrap recovery.',
    }
  }

  const { data: existingRole, error: roleLookupError } = await adminClient
    .from('user_roles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (roleLookupError && roleLookupError.code !== 'PGRST116') {
    console.error('[auth/bootstrap] Failed to inspect existing role', roleLookupError)
  }

  if (!existingRole) {
    const { error: roleInsertError } = await adminClient.from('user_roles').insert({
      user_id: user.id,
      role: 'customer',
    })

    if (roleInsertError && roleInsertError.code !== '23505') {
      console.error('[auth/bootstrap] Failed to create default customer role', roleInsertError)
      return {
        ok: false as const,
        message: roleInsertError.message,
      }
    }
  }

  const { data: existingProfile, error: profileLookupError } = await adminClient
    .from('customer_profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileLookupError && profileLookupError.code !== 'PGRST116') {
    console.error('[auth/bootstrap] Failed to inspect existing customer profile', profileLookupError)
  }

  if (!existingProfile) {
    const { firstName, lastName } = resolveNameParts(user)
    const avatar = resolveAvatar(user)
    const { error: profileInsertError } = await adminClient.from('customer_profiles').insert({
      user_id: user.id,
      first_name: firstName || null,
      last_name: lastName || null,
      phone_number: null,
      profile_image_url: avatar,
      profile_photo_url: avatar,
      avatar_url: avatar,
    })

    if (profileInsertError && profileInsertError.code !== '23505') {
      console.error('[auth/bootstrap] Failed to create default customer profile', profileInsertError)
      return {
        ok: false as const,
        message: profileInsertError.message,
      }
    }
  }

  return { ok: true as const }
}
