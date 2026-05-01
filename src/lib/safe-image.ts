const FALLBACK_IMAGE = '/web-app-manifest-192x192.png'

export function getSafeImage(src?: string | null): string {
  if (!src) {
    return FALLBACK_IMAGE
  }

  const normalized = src.trim()

  if (!normalized) {
    return FALLBACK_IMAGE
  }

  const isValid =
    normalized.startsWith('/') ||
    normalized.startsWith('http://') ||
    normalized.startsWith('https://')

  return isValid ? normalized : FALLBACK_IMAGE
}

export function isSafeImageSource(src?: string | null): boolean {
  if (!src) {
    return false
  }

  const normalized = src.trim()

  return (
    normalized.startsWith('/') ||
    normalized.startsWith('http://') ||
    normalized.startsWith('https://')
  )
}
