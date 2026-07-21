import { BRAND_ASSETS } from './brand-assets'

export const FALLBACK_IMAGE = BRAND_ASSETS.background

function isAllowedImageSource(normalized: string) {
  return (
    normalized.startsWith('/') ||
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('data:image/')
  )
}

export function getSafeImageUrl(src?: string | null): string | null {
  if (!src) {
    return null
  }

  const normalized = src.trim()

  if (!normalized) {
    return null
  }

  return isAllowedImageSource(normalized) ? normalized : null
}

export function getSafeImage(src?: string | null): string {
  return getSafeImageUrl(src) ?? FALLBACK_IMAGE
}

export function isSafeImageSource(src?: string | null): boolean {
  return getSafeImageUrl(src) !== null
}
