export const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" preserveAspectRatio="none">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#080808"/>
          <stop offset="55%" stop-color="#141414"/>
          <stop offset="100%" stop-color="#1d1a11"/>
        </linearGradient>
        <radialGradient id="glow" cx="25%" cy="25%" r="70%">
          <stop offset="0%" stop-color="rgba(212,175,55,0.35)"/>
          <stop offset="100%" stop-color="rgba(212,175,55,0)"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="800" fill="url(#bg)"/>
      <rect width="1200" height="800" fill="url(#glow)"/>
      <rect x="120" y="120" width="960" height="560" rx="40" fill="none" stroke="#D4AF37" stroke-opacity="0.28" stroke-width="4"/>
      <circle cx="600" cy="330" r="92" fill="#D4AF37" fill-opacity="0.16" stroke="#D4AF37" stroke-opacity="0.42" stroke-width="10"/>
      <path d="M410 610c36-108 126-162 190-162s154 54 190 162" fill="none" stroke="#D4AF37" stroke-opacity="0.42" stroke-width="34" stroke-linecap="round"/>
    </svg>
  `)

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
