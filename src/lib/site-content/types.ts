export type SiteContentType =
  | 'image'
  | 'video'
  | 'text'
  | 'url'
  | 'social_link'
  | 'service_media'
  | 'logo'
  | 'background'

export type SiteContentGroupId =
  | 'brand'
  | 'backgrounds'
  | 'site-images'
  | 'media'
  | 'services'
  | 'social-links'
  | 'contact-details'

export interface SiteContentDefinition {
  key: string
  label: string
  type: SiteContentType
  group: SiteContentGroupId
  value?: string | null
  imageUrl?: string | null
  videoUrl?: string | null
  storagePath?: string | null
  isActive?: boolean
  metadata?: Record<string, unknown>
}

export interface SiteContentItem {
  id: string | null
  key: string
  label: string
  type: SiteContentType
  value: string | null
  imageUrl: string | null
  videoUrl: string | null
  storagePath: string | null
  metadata: Record<string, unknown>
  isActive: boolean
  createdAt: string | null
  updatedAt: string | null
  group: SiteContentGroupId
  persisted: boolean
}

export interface SiteContentGroup {
  id: SiteContentGroupId
  label: string
  description: string
  itemCount: number
  activeCount: number
  items: SiteContentItem[]
}
