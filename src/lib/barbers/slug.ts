import { createAdminClient } from '@/lib/supabase/admin'

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function slugifyBarberName(value: string) {
  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || 'only-bangers-barber'
}

export async function ensureUniqueBarberSlug(params: {
  displayName?: string | null
  fullName?: string | null
  excludeProfileId?: string | null
}) {
  const adminClient = createAdminClient()
  const base = slugifyBarberName(
    normalizeText(params.displayName) || normalizeText(params.fullName) || 'only-bangers-barber'
  )

  if (!adminClient) {
    return base
  }

  for (let index = 0; index < 100; index += 1) {
    const candidate = index === 0 ? base : `${base}-${index + 1}`
    let query = adminClient.from('barber_profiles').select('id').eq('slug', candidate).limit(1)

    if (params.excludeProfileId) {
      query = query.neq('id', params.excludeProfileId)
    }

    const { data, error } = await query.maybeSingle()

    if (error && error.code !== 'PGRST116' && error.code !== '42P01' && error.code !== 'PGRST205') {
      console.error('[barbers.slug] Failed to check slug uniqueness', error)
      return candidate
    }

    if (!data?.id) {
      return candidate
    }
  }

  return `${base}-${Date.now()}`
}
