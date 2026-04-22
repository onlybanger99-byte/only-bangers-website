import { getUserRole } from '@/lib/auth/get-user-role'
import { createClient } from '@/lib/supabase/server'
import type {
  BookingActor,
  BookingErrorCode,
  BookingListFilters,
  BookingRecord,
  BookingResult,
  BookingStatus,
  CreateBookingInput,
  UpdateBookingInput,
} from './types'
import { BOOKING_STATUSES } from './types'

const BOOKING_SELECT =
  'id, user_id, barber_id, service_name, starts_at, status, notes, created_at'

type RawBookingRecord = {
  id: string | number
  user_id?: string | null
  barber_id?: string | null
  service_name?: string | null
  starts_at?: string | null
  status?: string | null
  notes?: string | null
  created_at?: string | null
}

function success<T>(data: T): BookingResult<T> {
  return { ok: true, data }
}

function failure<T>(
  code: BookingErrorCode,
  message: string,
  details?: string[]
): BookingResult<T> {
  return { ok: false, code, message, details }
}

function isBookingStatus(value: string | null | undefined): value is BookingStatus {
  return typeof value === 'string' && BOOKING_STATUSES.includes(value as BookingStatus)
}

function isMissingRelationError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false
  }

  return (
    error.code === '42P01' ||
    error.code === 'PGRST116' ||
    error.code === 'PGRST205' ||
    error.message?.toLowerCase().includes('relation') === true
  )
}

function normalizeTimestamp(value: string) {
  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.toISOString()
}

function normalizeOptionalText(value: string | null | undefined) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeRequiredText(value: string | null | undefined) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeBookingRecord(row: RawBookingRecord): BookingRecord {
  return {
    id: String(row.id),
    user_id: row.user_id ?? '',
    barber_id: row.barber_id ?? null,
    service_name: row.service_name ?? 'Appointment',
    starts_at: row.starts_at ?? '',
    status: isBookingStatus(row.status) ? row.status : 'scheduled',
    notes: row.notes ?? null,
    created_at: row.created_at ?? '',
  }
}

function applyScopedFilters<T extends { eq: Function }>(
  query: T,
  actor: BookingActor
) {
  if (actor.role === 'customer') {
    return query.eq('user_id', actor.userId)
  }

  if (actor.role === 'barber') {
    return query.eq('barber_id', actor.userId)
  }

  return query
}

function applyListFilters<T extends { eq: Function; gte: Function; lte: Function; limit: Function; order: Function }>(
  query: T,
  filters: BookingListFilters,
  actor: BookingActor
) {
  let nextQuery = applyScopedFilters(query, actor)

  if (filters.id) {
    nextQuery = nextQuery.eq('id', filters.id)
  }

  if (actor.role === 'admin' && filters.userId) {
    nextQuery = nextQuery.eq('user_id', filters.userId)
  }

  if (actor.role === 'admin' && filters.barberId) {
    nextQuery = nextQuery.eq('barber_id', filters.barberId)
  }

  if (filters.status) {
    nextQuery = nextQuery.eq('status', filters.status)
  }

  if (filters.startsAtFrom) {
    nextQuery = nextQuery.gte('starts_at', filters.startsAtFrom)
  }

  if (filters.startsAtTo) {
    nextQuery = nextQuery.lte('starts_at', filters.startsAtTo)
  }

  const requestedLimit =
    typeof filters.limit === 'number' && Number.isFinite(filters.limit) && filters.limit > 0
      ? filters.limit
      : 50
  const limit = Math.min(requestedLimit, 200)

  return nextQuery.order('starts_at', { ascending: filters.ascending ?? false }).limit(limit)
}

async function getActorOrError(): Promise<BookingResult<BookingActor>> {
  const { user, role } = await getUserRole()

  if (!user || !role) {
    return failure('UNAUTHORIZED', 'You must be signed in to access bookings.')
  }

  return success({
    userId: user.id,
    email: user.email,
    role,
  })
}

function validateCreateInput(input: CreateBookingInput, actor: BookingActor) {
  const details: string[] = []
  const serviceName = normalizeRequiredText(input.serviceName)
  const startsAt = normalizeTimestamp(input.startsAt)
  const notes = normalizeOptionalText(input.notes)
  const status = input.status ?? 'scheduled'

  if (!serviceName) {
    details.push('serviceName is required.')
  }

  if (!startsAt) {
    details.push('startsAt must be a valid ISO date string.')
  }

  if (!isBookingStatus(status)) {
    details.push('status is invalid.')
  }

  let userId: string | null = null
  let barberId: string | null = input.barberId ?? null

  if (actor.role === 'customer') {
    userId = actor.userId
  } else if (actor.role === 'barber') {
    userId = input.userId ?? null
    barberId = actor.userId
  } else {
    userId = input.userId ?? null
  }

  if (!userId) {
    details.push('userId is required for this role.')
  }

  if (details.length > 0 || !serviceName || !startsAt || !userId) {
    return failure<CreateBookingInput>('VALIDATION_ERROR', 'Booking payload is invalid.', details)
  }

  return success({
    userId,
    barberId,
    serviceName,
    startsAt,
    status,
    notes,
  })
}

function validateUpdateInput(input: UpdateBookingInput, actor: BookingActor) {
  const details: string[] = []
  const payload: {
    barber_id?: string | null
    service_name?: string
    starts_at?: string
    status?: BookingStatus
    notes?: string | null
  } = {}

  if (typeof input.serviceName === 'string') {
    const serviceName = normalizeRequiredText(input.serviceName)

    if (!serviceName) {
      details.push('serviceName cannot be empty.')
    } else if (actor.role === 'admin') {
      payload.service_name = serviceName
    } else {
      details.push('serviceName cannot be updated by this role.')
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, 'barberId')) {
    if (actor.role === 'admin') {
      payload.barber_id = input.barberId ?? null
    } else {
      details.push('barberId cannot be updated by this role.')
    }
  }

  if (typeof input.startsAt === 'string') {
    const startsAt = normalizeTimestamp(input.startsAt)

    if (!startsAt) {
      details.push('startsAt must be a valid ISO date string.')
    } else if (
      actor.role === 'admin' ||
      actor.role === 'customer'
    ) {
      payload.starts_at = startsAt
    } else {
      details.push('startsAt cannot be updated by this role.')
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, 'notes')) {
    if (
      actor.role === 'admin' ||
      actor.role === 'barber' ||
      actor.role === 'customer'
    ) {
      payload.notes = normalizeOptionalText(input.notes)
    }
  }

  if (typeof input.status === 'string') {
    if (!isBookingStatus(input.status)) {
      details.push('status is invalid.')
    } else if (actor.role === 'customer') {
      if (['pending', 'confirmed', 'scheduled', 'cancelled'].includes(input.status)) {
        payload.status = input.status
      } else {
        details.push('Customers can only confirm or cancel their own bookings.')
      }
    } else if (actor.role === 'barber') {
      if (['arrived', 'in_progress', 'completed', 'cancelled'].includes(input.status)) {
        payload.status = input.status
      } else {
        details.push('Barbers can only update assigned workflow statuses.')
      }
    } else {
      payload.status = input.status
    }
  }

  if (details.length > 0) {
    return failure<typeof payload>('VALIDATION_ERROR', 'Booking update is invalid.', details)
  }

  if (Object.keys(payload).length === 0) {
    return failure<typeof payload>(
      'VALIDATION_ERROR',
      'No valid booking fields were supplied for update.'
    )
  }

  return success(payload)
}

export async function listBookings(
  filters: BookingListFilters = {}
): Promise<BookingResult<BookingRecord[]>> {
  const actorResult = await getActorOrError()

  if (!actorResult.ok) {
    return actorResult
  }

  const actor = actorResult.data
  const supabase = await createClient()
  const query = applyListFilters(
    supabase.from('bookings').select(BOOKING_SELECT),
    filters,
    actor
  )

  const { data, error } = await query

  if (error) {
    if (isMissingRelationError(error)) {
      return failure('TABLE_MISSING', 'The bookings table is not available yet.')
    }

    console.error('[bookings] listBookings failed:', error)
    return failure('DATABASE_ERROR', 'Failed to load bookings.')
  }

  return success(((data ?? []) as RawBookingRecord[]).map(normalizeBookingRecord))
}

export async function countBookings(
  filters: BookingListFilters = {}
): Promise<BookingResult<number>> {
  const actorResult = await getActorOrError()

  if (!actorResult.ok) {
    return actorResult
  }

  const actor = actorResult.data
  const supabase = await createClient()
  const query = applyListFilters(
    supabase.from('bookings').select('id', { count: 'exact', head: true }),
    filters,
    actor
  )

  const { count, error } = await query

  if (error) {
    if (isMissingRelationError(error)) {
      return failure('TABLE_MISSING', 'The bookings table is not available yet.')
    }

    console.error('[bookings] countBookings failed:', error)
    return failure('DATABASE_ERROR', 'Failed to count bookings.')
  }

  return success(count ?? 0)
}

export async function getBookingById(id: string): Promise<BookingResult<BookingRecord>> {
  const bookingsResult = await listBookings({ id, limit: 1 })

  if (!bookingsResult.ok) {
    return bookingsResult
  }

  const booking = bookingsResult.data[0]

  if (!booking) {
    return failure('NOT_FOUND', 'Booking not found.')
  }

  return success(booking)
}

export async function createBooking(
  input: CreateBookingInput
): Promise<BookingResult<BookingRecord>> {
  const actorResult = await getActorOrError()

  if (!actorResult.ok) {
    return actorResult
  }

  const actor = actorResult.data
  const payloadResult = validateCreateInput(input, actor)

  if (!payloadResult.ok) {
    return payloadResult
  }

  const supabase = await createClient()
  const payload = payloadResult.data

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      user_id: payload.userId,
      barber_id: payload.barberId,
      service_name: payload.serviceName,
      starts_at: payload.startsAt,
      status: payload.status,
      notes: payload.notes,
    })
    .select(BOOKING_SELECT)
    .single()

  if (error) {
    if (isMissingRelationError(error)) {
      return failure('TABLE_MISSING', 'The bookings table is not available yet.')
    }

    console.error('[bookings] createBooking failed:', error)
    return failure('DATABASE_ERROR', 'Failed to create booking.')
  }

  return success(normalizeBookingRecord(data as RawBookingRecord))
}

export async function updateBooking(
  id: string,
  input: UpdateBookingInput
): Promise<BookingResult<BookingRecord>> {
  const actorResult = await getActorOrError()

  if (!actorResult.ok) {
    return actorResult
  }

  const actor = actorResult.data
  const existingResult = await getBookingById(id)

  if (!existingResult.ok) {
    return existingResult
  }

  const payloadResult = validateUpdateInput(input, actor)

  if (!payloadResult.ok) {
    return payloadResult
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('bookings')
    .update(payloadResult.data)
    .eq('id', id)
    .select(BOOKING_SELECT)
    .single()

  if (error) {
    console.error('[bookings] updateBooking failed:', error)
    return failure('DATABASE_ERROR', 'Failed to update booking.')
  }

  return success(normalizeBookingRecord(data as RawBookingRecord))
}

export async function deleteBooking(id: string): Promise<BookingResult<{ id: string }>> {
  const existingResult = await getBookingById(id)

  if (!existingResult.ok) {
    return existingResult
  }

  const supabase = await createClient()
  const { error } = await supabase.from('bookings').delete().eq('id', id)

  if (error) {
    console.error('[bookings] deleteBooking failed:', error)
    return failure('DATABASE_ERROR', 'Failed to delete booking.')
  }

  return success({ id })
}
