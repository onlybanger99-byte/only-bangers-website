'use client'

import type { PropsWithChildren } from 'react'
import { useSiteContent } from '@/hooks/useSiteContent'
import { getSiteImage } from '@/lib/site-content/public'

type SitePageBackgroundProps = PropsWithChildren<{
  backgroundKeys?: string[]
  className?: string
}>

export function SitePageBackground({
  backgroundKeys = ['global_page_background'],
  className,
  children,
}: SitePageBackgroundProps) {
  const { contentMap } = useSiteContent()
  const shellClassName = className ? `page-background ${className}` : 'page-background'

  return (
    <div className={shellClassName} data-background={getSiteImage(contentMap, backgroundKeys) ? 'custom' : 'global'}>
      {children}
    </div>
  )
}
