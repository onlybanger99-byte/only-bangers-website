import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { BRAND_ASSETS } from '@/lib/brand-assets'
import { getSafeImage, isSafeImageSource } from '@/lib/safe-image'
import type {
  SiteContentDefinition,
  SiteContentGroup,
  SiteContentGroupId,
  SiteContentItem,
  SiteContentType,
} from './types'

const SITE_ASSET_BUCKET = 'site-assets'
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_VIDEO_BYTES = 50 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/webm'])

const GROUP_CONFIG: Record<
  SiteContentGroupId,
  {
    label: string
    description: string
  }
> = {
  brand: {
    label: 'Brand',
    description: 'Manage logo and core brand presentation.',
  },
  backgrounds: {
    label: 'Backgrounds',
    description: 'Control reusable background images across key experiences.',
  },
  'site-images': {
    label: 'Site Images',
    description: 'Manage the shared page background, homepage visuals, founder image, and default avatar.',
  },
  media: {
    label: 'Media',
    description: 'Adjust homepage hero media, default images, and shared visual assets.',
  },
  services: {
    label: 'Services',
    description: 'Manage service images and media shown in the catalog.',
  },
  'social-links': {
    label: 'Social Links',
    description: 'Keep footer and social destination links current.',
  },
  'contact-details': {
    label: 'Contact',
    description: 'Update public-facing business contact details and footer links.',
  },
}

export const SITE_CONTENT_DEFAULTS: SiteContentDefinition[] = [
  {
    key: 'global_page_background',
    label: 'Global Page Background',
    type: 'background',
    group: 'site-images',
    imageUrl: BRAND_ASSETS.background,
    metadata: { accepts: 'image', section: 'Shared page background' },
  },
  {
    key: 'site_banner_image',
    label: 'Site Banner Image',
    type: 'image',
    group: 'site-images',
    imageUrl: BRAND_ASSETS.hero,
    metadata: { accepts: 'image', section: 'Homepage hero banner' },
  },
  {
    key: 'site_logo',
    label: 'Site Logo',
    type: 'logo',
    group: 'brand',
    imageUrl: BRAND_ASSETS.logo,
    metadata: { accepts: 'image' },
  },
  {
    key: 'site_background_image',
    label: 'Site Background Image',
    type: 'background',
    group: 'backgrounds',
    imageUrl: BRAND_ASSETS.background,
    metadata: { accepts: 'image' },
  },
  {
    key: 'home_background_image',
    label: 'Home Background Image',
    type: 'background',
    group: 'backgrounds',
    imageUrl: BRAND_ASSETS.background,
    metadata: { accepts: 'image' },
  },
  {
    key: 'home_section_1_image',
    label: 'Homepage Section 1 Image',
    type: 'image',
    group: 'site-images',
    imageUrl: BRAND_ASSETS.hero,
    metadata: { accepts: 'image', section: 'Homepage proof 1' },
  },
  {
    key: 'home_section_2_image',
    label: 'Homepage Section 2 Image',
    type: 'image',
    group: 'site-images',
    imageUrl: BRAND_ASSETS.hero,
    metadata: { accepts: 'image', section: 'Homepage proof 2' },
  },
  {
    key: 'home_section_3_image',
    label: 'Homepage Section 3 Image',
    type: 'image',
    group: 'site-images',
    imageUrl: BRAND_ASSETS.hero,
    metadata: { accepts: 'image', section: 'Homepage proof 3' },
  },
  {
    key: 'home_section_4_image',
    label: 'Homepage Section 4 Image',
    type: 'image',
    group: 'site-images',
    imageUrl: BRAND_ASSETS.hero,
    metadata: { accepts: 'image', section: 'Homepage plan 1' },
  },
  {
    key: 'home_section_5_image',
    label: 'Homepage Section 5 Image',
    type: 'image',
    group: 'site-images',
    imageUrl: BRAND_ASSETS.hero,
    metadata: { accepts: 'image', section: 'Homepage plan 2' },
  },
  {
    key: 'home_section_6_image',
    label: 'Homepage Section 6 Image',
    type: 'image',
    group: 'site-images',
    imageUrl: BRAND_ASSETS.hero,
    metadata: { accepts: 'image', section: 'Homepage plan 3' },
  },
  {
    key: 'home_section_7_image',
    label: 'Homepage Section 7 Image',
    type: 'image',
    group: 'site-images',
    imageUrl: BRAND_ASSETS.hero,
    metadata: { accepts: 'image', section: 'Homepage call to action' },
  },
  {
    key: 'home_hero_image',
    label: 'Home Hero Image',
    type: 'image',
    group: 'media',
    imageUrl: BRAND_ASSETS.background,
    metadata: { accepts: 'image' },
  },
  {
    key: 'home_hero_video',
    label: 'Home Hero Video',
    type: 'video',
    group: 'media',
    videoUrl: null,
    metadata: { accepts: 'video' },
  },
  {
    key: 'services_background_image',
    label: 'Services Background Image',
    type: 'background',
    group: 'backgrounds',
    imageUrl: BRAND_ASSETS.background,
    metadata: { accepts: 'image' },
  },
  {
    key: 'barber_dashboard_background',
    label: 'Barber Dashboard Background',
    type: 'background',
    group: 'backgrounds',
    imageUrl: BRAND_ASSETS.background,
    metadata: { accepts: 'image' },
  },
  {
    key: 'admin_dashboard_background',
    label: 'Admin Dashboard Background',
    type: 'background',
    group: 'backgrounds',
    imageUrl: BRAND_ASSETS.background,
    metadata: { accepts: 'image' },
  },
  {
    key: 'login_background_image',
    label: 'Login Background Image',
    type: 'background',
    group: 'backgrounds',
    imageUrl: BRAND_ASSETS.background,
    metadata: { accepts: 'image' },
  },
  {
    key: 'about_founder_image',
    label: 'About Founder Image',
    type: 'image',
    group: 'site-images',
    imageUrl: BRAND_ASSETS.hero,
    metadata: { accepts: 'image', section: 'Founder profile' },
  },
  {
    key: 'default_barber_avatar',
    label: 'Default Barber Avatar',
    type: 'image',
    group: 'site-images',
    imageUrl: BRAND_ASSETS.logoColour,
    metadata: { accepts: 'image' },
  },
  {
    key: 'default_product_image',
    label: 'Default Product Image',
    type: 'image',
    group: 'media',
    imageUrl: BRAND_ASSETS.background,
    metadata: { accepts: 'image' },
  },
  {
    key: 'footer_instagram_url',
    label: 'Footer Instagram URL',
    type: 'social_link',
    group: 'social-links',
    value: 'https://www.instagram.com/only_bangers99/',
  },
  {
    key: 'footer_facebook_url',
    label: 'Footer Facebook URL',
    type: 'social_link',
    group: 'social-links',
    value: 'https://www.facebook.com/61582809069248/?modal=focused_switcher_dialog',
  },
  {
    key: 'footer_tiktok_url',
    label: 'Footer TikTok URL',
    type: 'social_link',
    group: 'social-links',
    value: 'https://www.tiktok.com/@onlybanger.co.za?is_from_webapp=1&sender_device=pc',
  },
  {
    key: 'footer_whatsapp_url',
    label: 'Footer WhatsApp URL',
    type: 'social_link',
    group: 'social-links',
    value: 'https://wa.me/27699864730',
  },
  {
    key: 'footer_youtube_url',
    label: 'Footer YouTube URL',
    type: 'social_link',
    group: 'social-links',
    value: '',
  },
  {
    key: 'business_phone',
    label: 'Business Phone',
    type: 'text',
    group: 'contact-details',
    value: '+27 661591976',
  },
  {
    key: 'business_email',
    label: 'Business Email',
    type: 'text',
    group: 'contact-details',
    value: 'support@onlybangers.co.za',
  },
  {
    key: 'service_classic_fade_media',
    label: 'Classic Fade Media',
    type: 'service_media',
    group: 'services',
    imageUrl: BRAND_ASSETS.hero,
    metadata: { serviceSlug: 'classic-fade', accepts: 'image' },
  },
  {
    key: 'service_fade_with_dye_media',
    label: 'Fade with Dye Media',
    type: 'service_media',
    group: 'services',
    imageUrl: BRAND_ASSETS.hero,
    metadata: { serviceSlug: 'fade-with-dye', accepts: 'image' },
  },
  {
    key: 'service_brush_with_trim_media',
    label: 'Brush with Trim Media',
    type: 'service_media',
    group: 'services',
    imageUrl: BRAND_ASSETS.hero,
    metadata: { serviceSlug: 'brush-with-trim', accepts: 'image' },
  },
  {
    key: 'service_beard_trim_media',
    label: 'Beard Trim Media',
    type: 'service_media',
    group: 'services',
    imageUrl: BRAND_ASSETS.hero,
    metadata: { serviceSlug: 'beard-trim', accepts: 'image' },
  },
  {
    key: 'service_clean_shave_media',
    label: 'Clean Shave Media',
    type: 'service_media',
    group: 'services',
    imageUrl: BRAND_ASSETS.hero,
    metadata: { serviceSlug: 'clean-shave', accepts: 'image' },
  },
  {
    key: 'service_hair_beard_combo_media',
    label: 'Hair & Beard Combo Media',
    type: 'service_media',
    group: 'services',
    imageUrl: BRAND_ASSETS.hero,
    metadata: { serviceSlug: 'hair-beard-combo', accepts: 'image' },
  },
]

type SiteContentRow = {
  id: string
  key: string
  label: string
  type: SiteContentType
  value: string | null
  image_url: string | null
  video_url: string | null
  storage_path: string | null
  metadata: Record<string, unknown> | null
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeUrl(value: unknown) {
  const normalized = normalizeText(value)

  if (!normalized) {
    return null
  }

  if (
    normalized.startsWith('/') ||
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('mailto:') ||
    normalized.startsWith('tel:')
  ) {
    return normalized
  }

  return null
}

function sanitizeFileName(name: string) {
  const cleaned = normalizeText(name)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')

  return cleaned || 'site-asset'
}

function getDefaultDefinition(key: string) {
  return SITE_CONTENT_DEFAULTS.find((item) => item.key === key) ?? null
}

function toItemFromDefinition(definition: SiteContentDefinition): SiteContentItem {
  return {
    id: null,
    key: definition.key,
    label: definition.label,
    type: definition.type,
    value: definition.value ?? null,
    imageUrl: definition.imageUrl ?? null,
    videoUrl: definition.videoUrl ?? null,
    storagePath: definition.storagePath ?? null,
    metadata: definition.metadata ?? {},
    isActive: definition.isActive !== false,
    createdAt: null,
    updatedAt: null,
    group: definition.group,
    persisted: false,
  }
}

function resolveGroupId(key: string, metadata: Record<string, unknown>, fallback?: SiteContentGroupId | null) {
  if (fallback) {
    return fallback
  }

  const metadataGroup = normalizeText(metadata.group)

  if (metadataGroup in GROUP_CONFIG) {
    return metadataGroup as SiteContentGroupId
  }

  const fromDefaults = getDefaultDefinition(key)
  return fromDefaults?.group ?? 'brand'
}

function toItem(row: SiteContentRow): SiteContentItem {
  const defaultDefinition = getDefaultDefinition(row.key)
  const metadata =
    row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? row.metadata
      : {}

  return {
    id: row.id,
    key: row.key,
    label: normalizeText(row.label) || defaultDefinition?.label || row.key,
    type: row.type ?? defaultDefinition?.type ?? 'text',
    value: normalizeText(row.value) || defaultDefinition?.value || null,
    imageUrl:
      normalizeUrl(row.image_url) ??
      normalizeUrl(defaultDefinition?.imageUrl) ??
      null,
    videoUrl:
      normalizeUrl(row.video_url) ??
      normalizeUrl(defaultDefinition?.videoUrl) ??
      null,
    storagePath: normalizeText(row.storage_path) || defaultDefinition?.storagePath || null,
    metadata: {
      ...(defaultDefinition?.metadata ?? {}),
      ...metadata,
    },
    isActive: row.is_active !== false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    group: resolveGroupId(row.key, metadata, defaultDefinition?.group ?? null),
    persisted: true,
  }
}

function groupItems(items: SiteContentItem[]): SiteContentGroup[] {
  return (Object.keys(GROUP_CONFIG) as SiteContentGroupId[]).map((groupId) => {
    const groupItemsList = items.filter((item) => item.group === groupId)
    return {
      id: groupId,
      label: GROUP_CONFIG[groupId].label,
      description: GROUP_CONFIG[groupId].description,
      itemCount: groupItemsList.length,
      activeCount: groupItemsList.filter((item) => item.isActive).length,
      items: groupItemsList,
    }
  })
}

async function getSupabase() {
  return createAdminClient() ?? (await createClient())
}

async function requireAdminClient() {
  const adminClient = createAdminClient()

  if (!adminClient) {
    return {
      ok: false as const,
      message: 'Supabase service role is not configured for site content management.',
      details: ['Set SUPABASE_SERVICE_ROLE_KEY before editing site content or uploading site assets.'],
    }
  }

  return {
    ok: true as const,
    client: adminClient,
  }
}

async function ensureSiteAssetBucket() {
  const adminResult = await requireAdminClient()

  if (!adminResult.ok) {
    return adminResult
  }

  const adminClient = adminResult.client
  const buckets = await adminClient.storage.listBuckets()

  if (buckets.error) {
    return {
      ok: false as const,
      message: 'We could not verify the site-assets storage bucket.',
      details: [buckets.error.message],
    }
  }

  if (buckets.data.some((bucket) => bucket.name === SITE_ASSET_BUCKET)) {
    return { ok: true as const, client: adminClient }
  }

  const created = await adminClient.storage.createBucket(SITE_ASSET_BUCKET, {
    public: true,
    fileSizeLimit: MAX_VIDEO_BYTES,
    allowedMimeTypes: [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES],
  })

  if (created.error && !/already exists/i.test(created.error.message)) {
    return {
      ok: false as const,
      message: 'We could not create the site-assets bucket automatically.',
      details: [
        created.error.message,
        'Create a public Supabase Storage bucket named "site-assets" if automatic creation is blocked.',
      ],
    }
  }

  return { ok: true as const, client: adminClient }
}

async function seedDefaultsIfPossible() {
  const adminClient = createAdminClient()

  if (!adminClient) {
    return
  }

  const existing = await adminClient.from('site_content').select('key')

  if (existing.error) {
    if (existing.error.code !== '42P01' && existing.error.code !== 'PGRST205') {
      console.error('[site-content] Failed to inspect existing keys before seeding', existing.error)
    }
    return
  }

  const existingKeys = new Set(
    ((existing.data ?? []) as Array<{ key: string | null }>)
      .map((item) => item.key)
      .filter((key): key is string => typeof key === 'string' && key.length > 0)
  )

  const payload = SITE_CONTENT_DEFAULTS.filter((item) => !existingKeys.has(item.key)).map((item) => ({
    key: item.key,
    label: item.label,
    type: item.type,
    value: item.value ?? null,
    image_url: item.imageUrl ?? null,
    video_url: item.videoUrl ?? null,
    storage_path: item.storagePath ?? null,
    metadata: {
      group: item.group,
      ...(item.metadata ?? {}),
    },
    is_active: item.isActive !== false,
  }))

  if (payload.length === 0) {
    return
  }

  const result = await adminClient.from('site_content').upsert(payload, { onConflict: 'key', ignoreDuplicates: true })

  if (result.error && result.error.code !== '42P01' && result.error.code !== 'PGRST205') {
    console.error('[site-content] Failed to seed defaults', result.error)
  }
}

export async function listSiteContentAdmin() {
  await seedDefaultsIfPossible()
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('site_content')
    .select('*')
    .order('label', { ascending: true })

  if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('[site-content] Failed to load admin site content', error)
    const fallbackItems = SITE_CONTENT_DEFAULTS.map(toItemFromDefinition)
    return {
      ok: false as const,
      message: 'We could not load site content right now.',
      details: [error.message],
      groups: groupItems(fallbackItems),
      items: fallbackItems,
    }
  }

  const rows = ((data ?? []) as SiteContentRow[]).map(toItem)
  const existingKeys = new Set(rows.map((item) => item.key))
  const merged = [
    ...rows,
    ...SITE_CONTENT_DEFAULTS.filter((item) => !existingKeys.has(item.key)).map(toItemFromDefinition),
  ]

  return {
    ok: true as const,
    groups: groupItems(merged),
    items: merged,
  }
}

export async function listActiveSiteContent() {
  await seedDefaultsIfPossible()
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('site_content')
    .select('*')
    .order('label', { ascending: true })

  if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('[site-content] Failed to load active site content', error)
    const fallbackItems = SITE_CONTENT_DEFAULTS.filter((item) => item.isActive !== false).map(toItemFromDefinition)
    return {
      ok: false as const,
      message: 'We could not load site content from the database.',
      details: [error.message],
      items: fallbackItems,
      map: Object.fromEntries(fallbackItems.map((item) => [item.key, item])),
    }
  }

  const allRows = ((data ?? []) as SiteContentRow[]).map(toItem)
  const rows = allRows.filter((item) => item.isActive)
  const existingKeys = new Set(allRows.map((item) => item.key))
  const merged = [
    ...rows,
    ...SITE_CONTENT_DEFAULTS.filter((item) => item.isActive !== false && !existingKeys.has(item.key)).map(toItemFromDefinition),
  ]

  return {
    ok: true as const,
    items: merged,
    map: Object.fromEntries(merged.map((item) => [item.key, item])),
  }
}

export async function getSiteContentMap() {
  const result = await listActiveSiteContent()
  return result.ok ? result.map : {}
}

export async function getSiteImage(key: string | string[]) {
  const contentMap = await getSiteContentMap()
  const keys = Array.isArray(key) ? key : [key]

  for (const currentKey of keys) {
    const item = contentMap[currentKey]

    if (!item || !item.isActive) {
      continue
    }

    const candidate = normalizeUrl(item.imageUrl || item.value || item.videoUrl)

    if (candidate && isSafeImageSource(candidate)) {
      return candidate
    }
  }

  return null
}

function validateSiteContentInput(input: {
  key: string
  label: string
  type: SiteContentType
}) {
  const details: string[] = []

  if (!normalizeText(input.key)) {
    details.push('Content key is required.')
  }

  if (!normalizeText(input.label)) {
    details.push('Content label is required.')
  }

  if (!normalizeText(input.type)) {
    details.push('Content type is required.')
  }

  return details
}

export async function createSiteContent(input: {
  key: string
  label: string
  type: SiteContentType
  value?: string | null
  imageUrl?: string | null
  videoUrl?: string | null
  storagePath?: string | null
  metadata?: Record<string, unknown>
  isActive?: boolean
}) {
  const adminResult = await requireAdminClient()

  if (!adminResult.ok) {
    return adminResult
  }

  const validationErrors = validateSiteContentInput({
    key: input.key,
    label: input.label,
    type: input.type,
  })

  if (validationErrors.length > 0) {
    return {
      ok: false as const,
      message: 'Site content is invalid.',
      details: validationErrors,
    }
  }

  const definition = getDefaultDefinition(input.key)
  const metadata = {
    group: definition?.group ?? 'brand',
    ...(definition?.metadata ?? {}),
    ...(input.metadata ?? {}),
  }

  const { data, error } = await adminResult.client
    .from('site_content')
    .upsert(
      {
        key: normalizeText(input.key),
        label: normalizeText(input.label),
        type: input.type,
        value: normalizeText(input.value) || null,
        image_url: normalizeUrl(input.imageUrl),
        video_url: normalizeUrl(input.videoUrl),
        storage_path: normalizeText(input.storagePath) || null,
        metadata,
        is_active: input.isActive !== false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    )
    .select('*')
    .single()

  if (error) {
    return {
      ok: false as const,
      message: 'We could not save this site content item.',
      details: [error.message],
    }
  }

  return {
    ok: true as const,
    data: toItem(data as SiteContentRow),
  }
}

export async function updateSiteContentById(
  id: string,
  input: {
    label?: string | null
    value?: string | null
    imageUrl?: string | null
    videoUrl?: string | null
    storagePath?: string | null
    metadata?: Record<string, unknown>
    isActive?: boolean
  }
) {
  const adminResult = await requireAdminClient()

  if (!adminResult.ok) {
    return adminResult
  }

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (input.label !== undefined) {
    updatePayload.label = normalizeText(input.label)
  }

  if (input.value !== undefined) {
    updatePayload.value = normalizeText(input.value) || null
  }

  if (input.imageUrl !== undefined) {
    updatePayload.image_url = normalizeUrl(input.imageUrl)
  }

  if (input.videoUrl !== undefined) {
    updatePayload.video_url = normalizeUrl(input.videoUrl)
  }

  if (input.storagePath !== undefined) {
    updatePayload.storage_path = normalizeText(input.storagePath) || null
  }

  if (input.metadata !== undefined) {
    updatePayload.metadata = input.metadata
  }

  if (typeof input.isActive === 'boolean') {
    updatePayload.is_active = input.isActive
  }

  const { data, error } = await adminResult.client
    .from('site_content')
    .update(updatePayload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    return {
      ok: false as const,
      message: 'We could not update this site content item.',
      details: [error.message],
    }
  }

  return {
    ok: true as const,
    data: toItem(data as SiteContentRow),
  }
}

export async function deleteSiteContentById(id: string) {
  const adminResult = await requireAdminClient()

  if (!adminResult.ok) {
    return adminResult
  }

  const { data: existing, error: loadError } = await adminResult.client
    .from('site_content')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (loadError) {
    return {
      ok: false as const,
      message: 'We could not load this site content item before deleting it.',
      details: [loadError.message],
    }
  }

  const storagePath = normalizeText((existing as SiteContentRow | null)?.storage_path)

  if (storagePath) {
    await adminResult.client.storage.from(SITE_ASSET_BUCKET).remove([storagePath])
  }

  const { error } = await adminResult.client.from('site_content').delete().eq('id', id)

  if (error) {
    return {
      ok: false as const,
      message: 'We could not delete this site content item.',
      details: [error.message],
    }
  }

  return { ok: true as const }
}

function validateUpload(item: SiteContentItem, file: File) {
  const details: string[] = []
  const accepts = normalizeText(item.metadata.accepts)
  const expectsVideo = item.type === 'video' || accepts === 'video'
  const allowedTypes = expectsVideo ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES
  const maxBytes = expectsVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES

  if (!allowedTypes.has(file.type)) {
    details.push(expectsVideo ? 'Only MP4 and WEBM videos are allowed.' : 'Only JPG, PNG, and WEBP images are allowed.')
  }

  if (file.size <= 0) {
    details.push('Choose a file before uploading.')
  }

  if (file.size > maxBytes) {
    details.push(expectsVideo ? 'Video size must be 50MB or smaller.' : 'Image size must be 5MB or smaller.')
  }

  return details
}

export async function uploadSiteContentAsset(id: string, file: File) {
  const listResult = await listSiteContentAdmin()

  if (!listResult.ok) {
    return {
      ok: false as const,
      message: listResult.message,
      details: listResult.details,
    }
  }

  const item = listResult.items.find((entry) => entry.id === id)

  if (!item) {
    return {
      ok: false as const,
      message: 'Site content item not found.',
      details: ['Create the content entry before uploading an asset.'],
    }
  }

  const validationErrors = validateUpload(item, file)

  if (validationErrors.length > 0) {
    return {
      ok: false as const,
      message: 'Asset upload is invalid.',
      details: validationErrors,
    }
  }

  const bucketResult = await ensureSiteAssetBucket()

  if (!bucketResult.ok) {
    return bucketResult
  }

  const extension = file.name.includes('.') ? file.name.split('.').pop() : ''
  const safeFileName = sanitizeFileName(file.name.replace(/\.[^.]+$/, ''))
  const fileName = `${Date.now()}-${safeFileName}${extension ? `.${extension}` : ''}`
  const storagePath = `${item.key}/${fileName}`
  const upload = await bucketResult.client.storage.from(SITE_ASSET_BUCKET).upload(storagePath, file, {
    upsert: false,
    contentType: file.type,
  })

  if (upload.error) {
    return {
      ok: false as const,
      message: 'We could not upload this site asset.',
      details: [upload.error.message],
    }
  }

  const publicUrlResult = bucketResult.client.storage.from(SITE_ASSET_BUCKET).getPublicUrl(storagePath)
  const publicUrl = normalizeUrl(publicUrlResult.data.publicUrl)

  const updatePayload =
    item.type === 'video' || normalizeText(item.metadata.accepts) === 'video'
      ? {
          videoUrl: publicUrl,
          imageUrl: null,
          storagePath,
          value: publicUrl,
        }
      : {
          imageUrl: publicUrl,
          videoUrl: null,
          storagePath,
          value: publicUrl,
        }

  return updateSiteContentById(id, updatePayload)
}

export function getSiteContentValue(
  contentMap: Record<string, SiteContentItem | undefined> | null | undefined,
  key: string,
  fallback = ''
) {
  const item = contentMap?.[key]

  if (!item || !item.isActive) {
    return fallback
  }

  return normalizeText(item.value) || normalizeText(item.imageUrl) || normalizeText(item.videoUrl) || fallback
}

export function getSiteContentImage(
  contentMap: Record<string, SiteContentItem | undefined> | null | undefined,
  key: string,
  fallback: string
) {
  const item = contentMap?.[key]

  if (!item || !item.isActive) {
    return getSafeImage(fallback)
  }

  return getSafeImage(item.imageUrl || item.value || fallback)
}

export function getSiteContentVideo(
  contentMap: Record<string, SiteContentItem | undefined> | null | undefined,
  key: string
) {
  const item = contentMap?.[key]

  if (!item || !item.isActive) {
    return null
  }

  const videoUrl = normalizeUrl(item.videoUrl || item.value)
  return videoUrl && isSafeImageSource(videoUrl) ? videoUrl : null
}

export function getServiceMediaKey(serviceSlug: string) {
  return `service_${serviceSlug.replace(/-/g, '_')}_media`
}
