import { isSafeImageSource } from '@/lib/safe-image'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const GALLERY_BUCKET = 'barber-gallery'
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const ALLOWED_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export interface BarberGalleryImageSummary {
  id: string
  barberProfileId: string
  imageUrl: string
  storagePath: string | null
  caption: string | null
  sortOrder: number
  isVisible: boolean
  createdAt: string
  updatedAt: string
}

export interface BarberStorageUploadSummary {
  imageUrl: string
  storagePath: string
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

async function getSupabase() {
  return createAdminClient() ?? (await createClient())
}

function toSummary(row: Record<string, unknown>): BarberGalleryImageSummary {
  return {
    id: String(row.id),
    barberProfileId: String(row.barber_profile_id),
    imageUrl: normalizeText(row.image_url),
    storagePath: normalizeText(row.storage_path) || null,
    caption: normalizeText(row.caption) || null,
    sortOrder: typeof row.sort_order === 'number' ? row.sort_order : 0,
    isVisible: typeof row.is_visible === 'boolean' ? row.is_visible : true,
    createdAt: typeof row.created_at === 'string' ? row.created_at : '',
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : '',
  }
}

function sanitizeFileName(name: string) {
  const cleaned = normalizeText(name)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')

  return cleaned || 'gallery-image'
}

async function ensureGalleryBucket() {
  const adminClient = createAdminClient()

  if (!adminClient) {
    return {
      ok: false as const,
      message: 'Supabase service role is not configured for gallery uploads.',
      details: ['Set SUPABASE_SERVICE_ROLE_KEY before uploading gallery images.'],
    }
  }

  const buckets = await adminClient.storage.listBuckets()

  if (buckets.error) {
    return {
      ok: false as const,
      message: 'We could not verify the gallery storage bucket.',
      details: [buckets.error.message],
    }
  }

  if (buckets.data.some((bucket) => bucket.name === GALLERY_BUCKET)) {
    return { ok: true as const, client: adminClient }
  }

  const created = await adminClient.storage.createBucket(GALLERY_BUCKET, {
    public: true,
    fileSizeLimit: MAX_UPLOAD_BYTES,
    allowedMimeTypes: Array.from(ALLOWED_CONTENT_TYPES),
  })

  if (created.error && !/already exists/i.test(created.error.message)) {
    return {
      ok: false as const,
      message: 'We could not create the gallery storage bucket.',
      details: [created.error.message],
    }
  }

  return { ok: true as const, client: adminClient }
}

function validateUpload(file: File) {
  const details: string[] = []

  if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
    details.push('Only JPG, PNG, and WEBP images are allowed.')
  }

  if (file.size <= 0) {
    details.push('Choose an image before uploading.')
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    details.push('Image size must be 5MB or smaller.')
  }

  return details
}

export async function listVisibleGalleryImages(barberProfileId: string) {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('barber_gallery_images')
    .select('*')
    .eq('barber_profile_id', barberProfileId)
    .eq('is_visible', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('[barber-gallery] Failed to load visible gallery images', error)
    return [] as BarberGalleryImageSummary[]
  }

  return ((data ?? []) as Array<Record<string, unknown>>)
    .map(toSummary)
    .filter((item) => isSafeImageSource(item.imageUrl))
}

export async function listGalleryImagesForOwner(barberProfileId: string) {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('barber_gallery_images')
    .select('*')
    .eq('barber_profile_id', barberProfileId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('[barber-gallery] Failed to load owner gallery images', error)
    return {
      ok: false as const,
      message: 'We could not load your gallery images right now.',
      data: [] as BarberGalleryImageSummary[],
    }
  }

  return {
    ok: true as const,
    data: ((data ?? []) as Array<Record<string, unknown>>).map(toSummary),
  }
}

export async function createGalleryImage(barberProfileId: string, input: {
  imageUrl: string
  storagePath?: string | null
  caption?: string | null
  sortOrder?: number
  isVisible?: boolean
}) {
  const imageUrl = normalizeText(input.imageUrl)

  if (!isSafeImageSource(imageUrl)) {
    return {
      ok: false as const,
      message: 'Add a valid image URL before saving.',
      details: ['Gallery images must use a safe relative path or http/https URL.'],
    }
  }

  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('barber_gallery_images')
    .insert({
      barber_profile_id: barberProfileId,
      image_url: imageUrl,
      storage_path: normalizeText(input.storagePath) || null,
      caption: normalizeText(input.caption) || null,
      sort_order: typeof input.sortOrder === 'number' ? input.sortOrder : 0,
      is_visible: input.isVisible !== false,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[barber-gallery] Failed to create gallery image', error)
    return {
      ok: false as const,
      message: 'We could not save this gallery image.',
      details: [error.message],
    }
  }

  return {
    ok: true as const,
    data: toSummary(data as Record<string, unknown>),
  }
}

export async function uploadGalleryImage(barberProfileId: string, input: {
  file: File
  caption?: string | null
  sortOrder?: number
  isVisible?: boolean
}) {
  const validationErrors = validateUpload(input.file)

  if (validationErrors.length > 0) {
    return {
      ok: false as const,
      message: 'Gallery upload is invalid.',
      details: validationErrors,
    }
  }

  const bucketResult = await ensureGalleryBucket()

  if (!bucketResult.ok) {
    return bucketResult
  }

  const adminClient = bucketResult.client
  const uploadResult = await uploadBarberStorageImage(barberProfileId, input.file, {
    folder: 'gallery',
    bucketClient: adminClient,
  })

  if (!uploadResult.ok) {
    return uploadResult
  }

  const imageResult = await createGalleryImage(barberProfileId, {
    imageUrl: uploadResult.data.imageUrl,
    storagePath: uploadResult.data.storagePath,
    caption: input.caption,
    sortOrder: input.sortOrder,
    isVisible: input.isVisible,
  })

  if (!imageResult.ok) {
    await adminClient.storage.from(GALLERY_BUCKET).remove([uploadResult.data.storagePath])
    return imageResult
  }

  return imageResult
}

export async function uploadBarberStorageImage(
  barberProfileId: string,
  file: File,
  options?: {
    folder?: string
    bucketClient?: ReturnType<typeof createAdminClient>
  }
) {
  const validationErrors = validateUpload(file)

  if (validationErrors.length > 0) {
    return {
      ok: false as const,
      message: 'Image upload is invalid.',
      details: validationErrors,
    }
  }

  const bucketResult = options?.bucketClient
    ? { ok: true as const, client: options.bucketClient }
    : await ensureGalleryBucket()

  if (!bucketResult.ok) {
    return bucketResult
  }

  const adminClient = bucketResult.client
  const safeFileName = sanitizeFileName(file.name)
  const folder = normalizeText(options?.folder) || 'gallery'
  const storagePath = `${barberProfileId}/${folder}/${Date.now()}-${safeFileName}`
  const arrayBuffer = await file.arrayBuffer()
  const uploadResult = await adminClient.storage
    .from(GALLERY_BUCKET)
    .upload(storagePath, Buffer.from(arrayBuffer), {
      contentType: file.type,
      upsert: false,
    })

  if (uploadResult.error) {
    console.error('[barber-gallery] Failed to upload image to storage', uploadResult.error)
    return {
      ok: false as const,
      message: 'We could not upload this image.',
      details: [uploadResult.error.message],
    }
  }

  const publicUrlResult = adminClient.storage.from(GALLERY_BUCKET).getPublicUrl(storagePath)
  const publicUrl = normalizeText(publicUrlResult.data.publicUrl)

  return {
    ok: true as const,
    data: {
      imageUrl: publicUrl,
      storagePath,
    } satisfies BarberStorageUploadSummary,
  }
}

export async function updateGalleryImage(
  barberProfileId: string,
  imageId: string,
  input: {
    imageUrl?: string
    caption?: string | null
    sortOrder?: number
    isVisible?: boolean
  }
) {
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (typeof input.imageUrl === 'string') {
    const imageUrl = normalizeText(input.imageUrl)

    if (!isSafeImageSource(imageUrl)) {
      return {
        ok: false as const,
        message: 'Add a valid image URL before saving.',
        details: ['Gallery images must use a safe relative path or http/https URL.'],
      }
    }

    updates.image_url = imageUrl
  }

  if (Object.prototype.hasOwnProperty.call(input, 'caption')) {
    updates.caption = normalizeText(input.caption) || null
  }

  if (typeof input.sortOrder === 'number') {
    updates.sort_order = input.sortOrder
  }

  if (typeof input.isVisible === 'boolean') {
    updates.is_visible = input.isVisible
  }

  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('barber_gallery_images')
    .update(updates)
    .eq('id', imageId)
    .eq('barber_profile_id', barberProfileId)
    .select('*')
    .maybeSingle()

  if (error) {
    console.error('[barber-gallery] Failed to update gallery image', error)
    return {
      ok: false as const,
      message: 'We could not update this gallery image.',
      details: [error.message],
    }
  }

  if (!data) {
    return {
      ok: false as const,
      message: 'Gallery image not found.',
      details: ['The selected gallery image does not belong to this barber.'],
    }
  }

  return {
    ok: true as const,
    data: toSummary(data as Record<string, unknown>),
  }
}

export async function deleteGalleryImage(barberProfileId: string, imageId: string) {
  const supabase = await getSupabase()
  const { data: existing, error: existingError } = await supabase
    .from('barber_gallery_images')
    .select('storage_path')
    .eq('id', imageId)
    .eq('barber_profile_id', barberProfileId)
    .maybeSingle()

  if (existingError) {
    console.error('[barber-gallery] Failed to load gallery image before delete', existingError)
    return {
      ok: false as const,
      message: 'We could not remove this gallery image.',
      details: [existingError.message],
    }
  }

  const { error } = await supabase
    .from('barber_gallery_images')
    .delete()
    .eq('id', imageId)
    .eq('barber_profile_id', barberProfileId)

  if (error) {
    console.error('[barber-gallery] Failed to delete gallery image', error)
    return {
      ok: false as const,
      message: 'We could not remove this gallery image.',
      details: [error.message],
    }
  }

  const storagePath = normalizeText(existing?.storage_path)
  const adminClient = createAdminClient()

  if (storagePath && adminClient) {
    const removeResult = await adminClient.storage.from(GALLERY_BUCKET).remove([storagePath])

    if (removeResult.error) {
      console.error('[barber-gallery] Failed to remove image from storage', removeResult.error)
    }
  }

  return { ok: true as const }
}
