import type { AppRole } from '@/lib/auth/roles'

export const BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'scheduled',
  'arrived',
  'in_progress',
  'completed',
  'cancelled',
] as const

export type BookingStatus = (typeof BOOKING_STATUSES)[number]

export type BookingErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'TABLE_MISSING'
  | 'DATABASE_ERROR'

export interface BookingRecord {
  id: string
  user_id: string
  barber_id: string | null
  service_name: string
  starts_at: string
  status: BookingStatus
  notes: string | null
  created_at: string
}

export interface BookingActor {
  userId: string
  email?: string
  role: AppRole
}

export interface BookingListFilters {
  id?: string
  userId?: string
  barberId?: string
  status?: BookingStatus
  startsAtFrom?: string
  startsAtTo?: string
  limit?: number
  ascending?: boolean
}

export interface CreateBookingInput {
  userId?: string
  barberId?: string | null
  serviceName: string
  startsAt: string
  status?: BookingStatus
  notes?: string | null
}

export interface UpdateBookingInput {
  barberId?: string | null
  serviceName?: string
  startsAt?: string
  status?: BookingStatus
  notes?: string | null
}

export type BookingResult<T> =
  | { ok: true; data: T }
  | {
      ok: false
      code: BookingErrorCode
      message: string
      details?: string[]
    }

export type BookingApiResponse<T> =
  | { ok: true; data: T }
  | {
      ok: false
      error: {
        code: BookingErrorCode
        message: string
        details?: string[]
      }
    }
