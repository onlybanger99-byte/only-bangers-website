'use client'

import { useEffect, useState } from 'react'
import type { SiteContentItem } from '@/lib/site-content/types'

type SiteContentResponse = {
  ok: boolean
  data?: {
    items?: SiteContentItem[]
    map?: Record<string, SiteContentItem>
  }
}

export function useSiteContent() {
  const [contentMap, setContentMap] = useState<Record<string, SiteContentItem>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    fetch('/api/site-content')
      .then((response) => response.json())
      .then((payload: SiteContentResponse) => {
        if (!active) {
          return
        }

        setContentMap(payload?.data?.map ?? {})
      })
      .catch((error) => {
        console.error('[site-content] Failed to load public content', error)
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  return {
    contentMap,
    loading,
  }
}
