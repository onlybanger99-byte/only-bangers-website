import type { CSSProperties } from 'react'
import { getSafeImageUrl } from '@/lib/safe-image'

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'OB'
}

export function PublicBarberImage({
  src,
  name,
  alt,
  className,
  style,
}: {
  src?: string | null
  name: string
  alt?: string
  className?: string
  style?: CSSProperties
}) {
  const safeSrc = getSafeImageUrl(src)

  if (safeSrc) {
    return <img src={safeSrc} alt={alt ?? name} className={className} style={style} />
  }

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'linear-gradient(135deg, rgba(212, 175, 55, 0.22), rgba(24, 24, 24, 0.95))',
        color: '#f7e9c3',
        fontWeight: 800,
        fontSize: '1.6rem',
        letterSpacing: '0.08em',
        ...style,
      }}
      aria-label={alt ?? name}
    >
      {getInitials(name)}
    </div>
  )
}
