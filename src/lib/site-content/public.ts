import { getSafeImage, getSafeImageUrl, isSafeImageSource } from '@/lib/safe-image'
import type { SiteContentItem } from './types'

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

export function getSiteContentMap(items: SiteContentItem[] | null | undefined) {
  return Object.fromEntries((items ?? []).map((item) => [item.key, item]))
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

export function getSiteImage(
  contentMap: Record<string, SiteContentItem | undefined> | null | undefined,
  key: string | string[]
) {
  const keys = Array.isArray(key) ? key : [key]

  for (const currentKey of keys) {
    const item = contentMap?.[currentKey]

    if (!item || !item.isActive) {
      continue
    }

    const candidate =
      getSafeImageUrl(item.imageUrl) ??
      getSafeImageUrl(item.value) ??
      getSafeImageUrl(item.videoUrl)

    if (candidate) {
      return candidate
    }
  }

  return null
}

export function getSiteContentImage(
  contentMap: Record<string, SiteContentItem | undefined> | null | undefined,
  key: string,
  fallback: string
) {
  return getSafeImage(getSiteImage(contentMap, key) ?? fallback)
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

export function getServiceImage(
  contentMap: Record<string, SiteContentItem | undefined> | null | undefined,
  input: {
    slug: string
    imageUrl?: string | null
  }
) {
  return getSafeImageUrl(input.imageUrl) ?? getSiteImage(contentMap, getServiceMediaKey(input.slug))
}
