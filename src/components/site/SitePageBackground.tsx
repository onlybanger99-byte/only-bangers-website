'use client'

import type { CSSProperties, PropsWithChildren } from 'react'
import { useSiteContent } from '@/hooks/useSiteContent'
import { getSiteImage } from '@/lib/site-content/public'

type SitePageBackgroundProps = PropsWithChildren<{
  backgroundKeys?: string[]
  className?: string
}>

const FALLBACK_BACKGROUND =
  'radial-gradient(circle at top left, rgba(212, 175, 55, 0.12), transparent 28%), radial-gradient(circle at top right, rgba(212, 175, 55, 0.08), transparent 22%), linear-gradient(180deg, #090909 0%, #050505 100%)'

export function SitePageBackground({
  backgroundKeys = ['global_page_background'],
  className,
  children,
}: SitePageBackgroundProps) {
  const { contentMap } = useSiteContent()
  const backgroundImage = getSiteImage(contentMap, backgroundKeys)
  const shellClassName = className ? `page-background ${className}` : 'page-background'
  const backgroundValue = backgroundImage
    ? `linear-gradient(rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.3)), url('${backgroundImage}')`
    : FALLBACK_BACKGROUND

  return (
    <div
      className={shellClassName}
      style={
        {
          ['--page-background-image' as string]: backgroundValue,
        } as CSSProperties
      }
    >
      {children}
    </div>
  )
}
