import { services as fallbackServices, type Service } from '@/data/services'
import { parseDurationToMinutes } from '@/lib/services/duration'
import { getSafeImageUrl } from '@/lib/safe-image'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export interface ServiceRow {
  id: string
  name: string
  slug: string
  description: string
  is_active: boolean
  sort_order: number
  image_url?: string | null
  background_image_url?: string | null
  media_storage_path?: string | null
}

export interface ServiceSummary {
  id: string
  name: string
  slug: string
  description: string
  duration: string
  sortOrder: number
  isActive: boolean
  imageUrl: string | null
  backgroundImageUrl: string | null
  mediaStoragePath: string | null
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
    imageUrl: getSafeImageUrl(row.image_url) ?? null,
    backgroundImageUrl: getSafeImageUrl(row.background_image_url) ?? null,
    mediaStoragePath: normalizeText(row.media_storage_path) || null,
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
    imageUrl: null,
    backgroundImageUrl: null,
    mediaStoragePath: null,
  }))
}

async function getSupabase() {
  return createAdminClient() ?? (await createClient())
}

export async function listActiveServices() {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('services')
    .select('id, name, slug, description, is_active, sort_order, image_url, background_image_url, media_storage_path')
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
    .select('id, name, slug, description, is_active, sort_order, image_url, background_image_url, media_storage_path')
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
    .select('id, name, slug, description, is_active, sort_order, image_url, background_image_url, media_storage_path')
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
  imageUrl?: string | null
  backgroundImageUrl?: string | null
  mediaStoragePath?: string | null
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
      image_url: getSafeImageUrl(input.imageUrl) ?? null,
      background_image_url: getSafeImageUrl(input.backgroundImageUrl) ?? null,
      media_storage_path: normalizeText(input.mediaStoragePath) || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', serviceId)
    .select('id, name, slug, description, is_active, sort_order, image_url, background_image_url, media_storage_path')
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

const SERVICE_ASSET_BUCKET = 'site-assets'
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function sanitizeFileName(name: string) {
  return (
    normalizeText(name)
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') || 'service-asset'
  )
}

async function ensureServiceAssetBucket(adminClient: NonNullable<ReturnType<typeof createAdminClient>>) {
  const buckets = await adminClient.storage.listBuckets()

  if (buckets.error) {
    return {
      ok: false as const,
      message: 'We could not verify the service asset bucket.',
      details: [buckets.error.message],
    }
  }

  if (buckets.data.some((bucket) => bucket.name === SERVICE_ASSET_BUCKET)) {
    return { ok: true as const }
  }

  const created = await adminClient.storage.createBucket(SERVICE_ASSET_BUCKET, {
    public: true,
    fileSizeLimit: MAX_IMAGE_BYTES,
    allowedMimeTypes: [...ALLOWED_IMAGE_TYPES],
  })

  if (created.error && !/already exists/i.test(created.error.message)) {
    return {
      ok: false as const,
      message: 'We could not create the service asset bucket automatically.',
      details: [created.error.message],
    }
  }

  return { ok: true as const }
}

export async function uploadServiceImageAsAdmin(input: {
  id: string
  file: File
  field: 'image' | 'background'
}) {
  const adminClient = createAdminClient()

  if (!adminClient) {
    return {
      ok: false as const,
      message: 'Supabase service role is not configured for service uploads.',
      details: ['Set SUPABASE_SERVICE_ROLE_KEY before uploading service images from admin.'],
    }
  }

  const serviceId = normalizeText(input.id)

  if (!serviceId || !isUuid(serviceId)) {
    return {
      ok: false as const,
      message: 'A valid service id is required.',
      details: ['Select a valid service before uploading media.'],
    }
  }

  if (!ALLOWED_IMAGE_TYPES.has(input.file.type)) {
    return {
      ok: false as const,
      message: 'Only JPG, PNG, and WEBP images are allowed.',
      details: [],
    }
  }

  if (input.file.size <= 0 || input.file.size > MAX_IMAGE_BYTES) {
    return {
      ok: false as const,
      message: 'Service images must be 5MB or smaller.',
      details: [],
    }
  }

  const serviceLookup = await adminClient
    .from('services')
    .select('id, slug, description, is_active, sort_order, image_url, background_image_url, media_storage_path')
    .eq('id', serviceId)
    .maybeSingle()

  if (serviceLookup.error || !serviceLookup.data?.id || typeof serviceLookup.data.slug !== 'string') {
    return {
      ok: false as const,
      message: 'Service not found.',
      details: [serviceLookup.error?.message ?? 'The selected service no longer exists.'],
    }
  }

  const bucketResult = await ensureServiceAssetBucket(adminClient)

  if (!bucketResult.ok) {
    return bucketResult
  }

  const extension = input.file.name.includes('.') ? input.file.name.split('.').pop() : ''
  const safeFileName = sanitizeFileName(input.file.name.replace(/\.[^.]+$/, ''))
  const fileName = `${Date.now()}-${safeFileName}${extension ? `.${extension}` : ''}`
  const storagePath = `services/${serviceLookup.data.slug}/${fileName}`
  const upload = await adminClient.storage.from(SERVICE_ASSET_BUCKET).upload(storagePath, input.file, {
    upsert: false,
    contentType: input.file.type,
  })

  if (upload.error) {
    return {
      ok: false as const,
      message: 'We could not upload this service image.',
      details: [upload.error.message],
    }
  }

  const publicUrlResult = adminClient.storage.from(SERVICE_ASSET_BUCKET).getPublicUrl(storagePath)
  const publicUrl = getSafeImageUrl(publicUrlResult.data.publicUrl)

  const update = await updateServiceAsAdmin({
    id: serviceId,
    description: typeof serviceLookup.data.description === 'string' ? serviceLookup.data.description : '',
    isActive: serviceLookup.data.is_active !== false,
    sortOrder:
      typeof serviceLookup.data.sort_order === 'number' && Number.isFinite(serviceLookup.data.sort_order)
        ? serviceLookup.data.sort_order
        : 0,
    imageUrl:
      input.field === 'image'
        ? publicUrl
        : getSafeImageUrl(serviceLookup.data.image_url) ?? null,
    backgroundImageUrl:
      input.field === 'background'
        ? publicUrl
        : getSafeImageUrl(serviceLookup.data.background_image_url) ?? null,
    mediaStoragePath: storagePath,
  })

  if (!update.ok) {
    return update
  }

  return update
}
