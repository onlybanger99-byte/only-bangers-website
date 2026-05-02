import { services as fallbackServices, type Service } from '@/data/services'
import { parseDurationToMinutes } from '@/lib/services/duration'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export interface ServiceRow {
  id: string
  name: string
  slug: string
  description: string
  is_active: boolean
  sort_order: number
}

export interface ServiceSummary {
  id: string
  name: string
  slug: string
  description: string
  duration: string
  sortOrder: number
  isActive: boolean
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

function getFallbackDuration(slug: string) {
  return fallbackServices.find((service) => service.slug === slug)?.duration ?? '30 min'
}

function toServiceSummary(row: ServiceRow): ServiceSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    duration: getFallbackDuration(row.slug),
    sortOrder: row.sort_order,
    isActive: row.is_active,
  }
}

function fallbackToSummaries(items: Service[] = fallbackServices): ServiceSummary[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    description: item.description,
    duration: item.duration,
    sortOrder: item.sortOrder,
    isActive: true,
  }))
}

async function getSupabase() {
  return createAdminClient() ?? (await createClient())
}

export async function listActiveServices() {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('services')
    .select('id, name, slug, description, is_active, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('[services] Failed to load active services', error)
    return {
      ok: false as const,
      message: 'We could not load the service catalog right now.',
      data: [] as ServiceSummary[],
    }
  }

  if (!data || data.length === 0) {
    return {
      ok: true as const,
      data: [] as ServiceSummary[],
    }
  }

  return {
    ok: true as const,
    data: (data as ServiceRow[])
      .filter((row) => typeof row.id === 'string' && isUuid(row.id))
      .map(toServiceSummary),
  }
}

export async function listAllServices() {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('services')
    .select('id, name, slug, description, is_active, sort_order')
    .order('sort_order', { ascending: true })

  if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('[services] Failed to load service catalog', error)
    return {
      ok: false as const,
      message: 'We could not load the service catalog right now.',
      data: [] as ServiceSummary[],
    }
  }

  return {
    ok: true as const,
    data: ((data ?? []) as ServiceRow[])
      .filter((row) => typeof row.id === 'string' && isUuid(row.id))
      .map(toServiceSummary),
  }
}

export async function getActiveServiceById(serviceId: string) {
  const normalized = normalizeText(serviceId)

  if (!normalized || !isUuid(normalized)) {
    return null
  }

  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('services')
    .select('id, name, slug, description, is_active, sort_order')
    .eq('id', normalized)
    .eq('is_active', true)
    .maybeSingle()

  if (error && error.code !== '42P01' && error.code !== 'PGRST116' && error.code !== 'PGRST205') {
    console.error('[services] Failed to load active service by id', error)
  }

  if (data) {
    return toServiceSummary(data as ServiceRow)
  }
  return null
}

export function getFallbackServices() {
  return fallbackToSummaries()
}

export async function updateServiceAsAdmin(input: {
  id: string
  description: string
  isActive: boolean
  sortOrder: number
}) {
  const serviceId = normalizeText(input.id)

  if (!serviceId || !isUuid(serviceId)) {
    return {
      ok: false as const,
      message: 'A valid service id is required.',
      details: ['Select a valid service before saving.'],
    }
  }

  const adminClient = createAdminClient()

  if (!adminClient) {
    return {
      ok: false as const,
      message: 'Supabase service role is not configured for admin service updates.',
      details: ['Set SUPABASE_SERVICE_ROLE_KEY before editing services from admin.'],
    }
  }

  const { data, error } = await adminClient
    .from('services')
    .update({
      description: normalizeText(input.description),
      is_active: input.isActive,
      sort_order: input.sortOrder,
    })
    .eq('id', serviceId)
    .select('id, name, slug, description, is_active, sort_order')
    .maybeSingle()

  if (error) {
    console.error('[services] Failed to update service as admin', error)
    return {
      ok: false as const,
      message: 'We could not update this service right now.',
      details: [error.message],
    }
  }

  if (!data) {
    return {
      ok: false as const,
      message: 'Service not found.',
      details: ['The selected service no longer exists in the catalog.'],
    }
  }

  return {
    ok: true as const,
    data: toServiceSummary(data as ServiceRow),
  }
}
