import type { AppRole } from '@/lib/auth/roles'

export const BOOKING_STATUSES = [
  'pending_payment',
  'confirmed',
  'cancelled',
  'completed',
  'expired',
] as const

export type BookingStatus = (typeof BOOKING_STATUSES)[number]

export const PAYMENT_STATUSES = [
  'unpaid',
  'paid',
  'cancelled',
  'refunded',
  'pending_verification',
  'failed',
] as const

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export type BookingErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INCOMPLETE_PROFILE'
  | 'NOT_FOUND'
  | 'SLOT_UNAVAILABLE'
  | 'VALIDATION_ERROR'
  | 'TABLE_MISSING'
  | 'DATABASE_ERROR'

export interface BookingRecord {
  id: string
  user_id: string
  barber_id: string | null
  barber_name: string | null
  barber_service_price_id: string | null
  service_name: string
  service_id: string | null
  starts_at: string
  status: BookingStatus
  payment_status: PaymentStatus
  notes: string | null
  whatsapp_redirect_url: string | null
  amount_due: number | null
  payment_reference: string | null
  pending_expires_at: string | null
  confirmed_at: string | null
  confirmed_by: string | null
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
  barberId?: string | null
  barberServicePriceId?: string | null
  serviceId?: string
  serviceName?: string
  startsAt: string
  notes?: string | null
}

export interface UpdateBookingInput {
  barberId?: string | null
  serviceId?: string
  serviceName?: string
  startsAt?: string
  status?: BookingStatus
  paymentStatus?: PaymentStatus
  notes?: string | null
  pendingExpiresAt?: string | null
  confirmedAt?: string | null
  confirmedBy?: string | null
  whatsappRedirectUrl?: string | null
  amountDue?: number | null
  paymentReference?: string | null
}

export interface BookingAvailability {
  barberId: string
  date: string
  slots: Array<{
    id: string
    available_date: string
    start_time: string
    end_time: string
  }>
  availabilitySlots: Array<{
    id: string
    availableDate: string
    startTime: string
    endTime: string
  }>
  availableSlots: string[]
  bookedSlots: string[]
  temporarilyReservedSlots: string[]
}

export interface ConfirmPaymentInput {
  paymentStatus?: Extract<PaymentStatus, 'paid'>
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
