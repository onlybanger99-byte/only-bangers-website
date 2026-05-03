import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isSafeImageSource } from '@/lib/safe-image'

export interface ProductSummary {
  id: string
  name: string
  slug: string
  description: string
  price: number
  imageUrl: string | null
  category: string
  stockQuantity: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function slugifyProductName(value: string) {
  return normalizeText(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'product'
}

function normalizeNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function toSummary(row: Record<string, unknown>): ProductSummary {
  return {
    id: String(row.id),
    name: normalizeText(row.name),
    slug: normalizeText(row.slug),
    description: normalizeText(row.description),
    price: normalizeNumber(row.price) ?? 0,
    imageUrl: isSafeImageSource(normalizeText(row.image_url)) ? normalizeText(row.image_url) : null,
    category: normalizeText(row.category),
    stockQuantity: typeof row.stock_quantity === 'number' ? row.stock_quantity : 0,
    isActive: typeof row.is_active === 'boolean' ? row.is_active : true,
    createdAt: typeof row.created_at === 'string' ? row.created_at : '',
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : '',
  }
}

async function getSupabase() {
  return createAdminClient() ?? (await createClient())
}

async function ensureUniqueProductSlug(input: { name: string; slug?: string | null; excludeId?: string | null }) {
  const adminClient = createAdminClient()
  const base = slugifyProductName(input.slug || input.name)

  if (!adminClient) {
    return base
  }

  for (let index = 0; index < 100; index += 1) {
    const candidate = index === 0 ? base : `${base}-${index + 1}`
    let query = adminClient.from('products').select('id').eq('slug', candidate).limit(1)

    if (input.excludeId) {
      query = query.neq('id', input.excludeId)
    }

    const { data, error } = await query.maybeSingle()

    if (error && error.code !== 'PGRST116' && error.code !== '42P01' && error.code !== 'PGRST205') {
      console.error('[products] Failed to validate product slug', error)
      return candidate
    }

    if (!data?.id) {
      return candidate
    }
  }

  return `${base}-${Date.now()}`
}

export async function listActiveProducts() {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('[products] Failed to load active products', error)
    return {
      ok: false as const,
      message: 'We could not load products right now.',
      data: [] as ProductSummary[],
    }
  }

  return {
    ok: true as const,
    data: ((data ?? []) as Array<Record<string, unknown>>).map(toSummary),
  }
}

export async function listAllProductsForAdmin() {
  const adminClient = createAdminClient()

  if (!adminClient) {
    return {
      ok: false as const,
      message: 'Supabase service role is not configured for admin products.',
      data: [] as ProductSummary[],
    }
  }

  const { data, error } = await adminClient
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('[products] Failed to load admin products', error)
    return {
      ok: false as const,
      message: 'We could not load products right now.',
      data: [] as ProductSummary[],
    }
  }

  return {
    ok: true as const,
    data: ((data ?? []) as Array<Record<string, unknown>>).map(toSummary),
  }
}

export async function createProductAsAdmin(input: {
  name: string
  slug?: string | null
  description?: string | null
  price: number
  imageUrl?: string | null
  category?: string | null
  stockQuantity?: number
  isActive?: boolean
}) {
  const adminClient = createAdminClient()

  if (!adminClient) {
    return {
      ok: false as const,
      message: 'Supabase service role is not configured for product management.',
      details: ['Set SUPABASE_SERVICE_ROLE_KEY before editing products.'],
    }
  }

  const name = normalizeText(input.name)
  const price = normalizeNumber(input.price)
  const stockQuantity = Math.max(0, Math.round(normalizeNumber(input.stockQuantity) ?? 0))
  const imageUrl = normalizeText(input.imageUrl)
  const details: string[] = []

  if (!name) {
    details.push('Product name is required.')
  }

  if (price == null || price < 0) {
    details.push('Product price must be a valid positive number.')
  }

  if (imageUrl && !isSafeImageSource(imageUrl)) {
    details.push('Image URL must be a safe relative path or http/https URL.')
  }

  if (details.length > 0) {
    return {
      ok: false as const,
      message: 'Product details are invalid.',
      details,
    }
  }

  const slug = await ensureUniqueProductSlug({ name, slug: input.slug ?? null })
  const { data, error } = await adminClient
    .from('products')
    .insert({
      name,
      slug,
      description: normalizeText(input.description) || null,
      price,
      image_url: imageUrl || null,
      category: normalizeText(input.category) || null,
      stock_quantity: stockQuantity,
      is_active: input.isActive !== false,
    })
    .select('*')
    .single()

  if (error) {
    return {
      ok: false as const,
      message: 'We could not create this product.',
      details: [error.message],
    }
  }

  return {
    ok: true as const,
    data: toSummary(data as Record<string, unknown>),
  }
}

export async function updateProductAsAdmin(
  productId: string,
  input: {
    name: string
    slug?: string | null
    description?: string | null
    price: number
    imageUrl?: string | null
    category?: string | null
    stockQuantity?: number
    isActive?: boolean
  }
) {
  const adminClient = createAdminClient()

  if (!adminClient) {
    return {
      ok: false as const,
      message: 'Supabase service role is not configured for product management.',
      details: ['Set SUPABASE_SERVICE_ROLE_KEY before editing products.'],
    }
  }

  const slug = await ensureUniqueProductSlug({
    name: input.name,
    slug: input.slug ?? null,
    excludeId: productId,
  })

  const { data, error } = await adminClient
    .from('products')
    .update({
      name: normalizeText(input.name),
      slug,
      description: normalizeText(input.description) || null,
      price: normalizeNumber(input.price) ?? 0,
      image_url: normalizeText(input.imageUrl) || null,
      category: normalizeText(input.category) || null,
      stock_quantity: Math.max(0, Math.round(normalizeNumber(input.stockQuantity) ?? 0)),
      is_active: input.isActive !== false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)
    .select('*')
    .maybeSingle()

  if (error) {
    return {
      ok: false as const,
      message: 'We could not update this product.',
      details: [error.message],
    }
  }

  if (!data) {
    return {
      ok: false as const,
      message: 'Product not found.',
      details: ['The selected product no longer exists.'],
    }
  }

  return {
    ok: true as const,
    data: toSummary(data as Record<string, unknown>),
  }
}

export async function deleteProductAsAdmin(productId: string) {
  const adminClient = createAdminClient()

  if (!adminClient) {
    return {
      ok: false as const,
      message: 'Supabase service role is not configured for product management.',
      details: ['Set SUPABASE_SERVICE_ROLE_KEY before editing products.'],
    }
  }

  const { error } = await adminClient
    .from('products')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)

  if (error) {
    return {
      ok: false as const,
      message: 'We could not deactivate this product.',
      details: [error.message],
    }
  }

  return { ok: true as const }
}
