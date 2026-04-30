export const BARBER_APPLICATION_STATUSES = ['pending', 'approved', 'rejected'] as const

export type BarberApplicationStatus = (typeof BARBER_APPLICATION_STATUSES)[number]

export interface BarberApplicationRecord {
  id: string
  user_id: string
  status: BarberApplicationStatus
  display_name: string | null
  phone: string | null
  cutting_location: string
  instagram_url: string | null
  tiktok_url: string | null
  facebook_url: string | null
  portfolio_url: string | null
  bio: string | null
  available_days: string[] | null
  available_start_time: string | null
  available_end_time: string | null
  notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

export interface CreateBarberApplicationInput {
  cuttingLocation: string
  instagramUrl?: string | null
  tiktokUrl?: string | null
  facebookUrl?: string | null
  portfolioUrl?: string | null
  bio: string
  availableDays: string[]
  availableStartTime: string
  availableEndTime: string
  notes?: string | null
}

export interface UpdateBarberProfileInput {
  displayName?: string | null
  cuttingLocation: string
  instagramUrl?: string | null
  tiktokUrl?: string | null
  facebookUrl?: string | null
  portfolioUrl?: string | null
  bio: string
  availableDays: string[]
  availableStartTime: string
  availableEndTime: string
}

export interface BarberApplicationSummary {
  id: string
  userId: string
  status: BarberApplicationStatus
  displayName: string | null
  phone: string | null
  cuttingLocation: string
  instagramUrl: string | null
  tiktokUrl: string | null
  facebookUrl: string | null
  portfolioUrl: string | null
  bio: string
  availableDays: string[]
  availableStartTime: string | null
  availableEndTime: string | null
  notes: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  rejectionReason: string | null
  createdAt: string
  updatedAt: string
}
