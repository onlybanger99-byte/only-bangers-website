import { isSafeImageSource } from '@/lib/safe-image'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export interface BarberGalleryImageSummary {
  id: string
  barberProfileId: string
  imageUrl: string
  caption: string | null
  sortOrder: number
  isVisible: boolean
  createdAt: string
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
    caption: normalizeText(row.caption) || null,
    sortOrder: typeof row.sort_order === 'number' ? row.sort_order : 0,
    isVisible: typeof row.is_visible === 'boolean' ? row.is_visible : true,
    createdAt: typeof row.created_at === 'string' ? row.created_at : '',
  }
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
  const updates: Record<string, unknown> = {}

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

  return { ok: true as const }
}
