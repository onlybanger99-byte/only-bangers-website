import { getUserRole } from '@/lib/auth/get-user-role'
import { getBarberProfileByUserId } from '@/lib/barbers/service'
import {
  getCustomerProfile,
  isProfileComplete,
} from '@/lib/customer-profiles/service'
import { services } from '@/data/services'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  buildBookingWhatsAppMessage,
  buildBookingWhatsAppUrl,
} from '@/lib/whatsapp/booking-message'
import type {
  BookingAvailability,
  BookingActor,
  ConfirmPaymentInput,
  BookingErrorCode,
  BookingListFilters,
  BookingRecord,
  BookingResult,
  BookingStatus,
  CreateBookingInput,
  PaymentStatus,
  UpdateBookingInput,
} from './types'
import { BOOKING_STATUSES, PAYMENT_STATUSES } from './types'

type SupabaseLikeError = {
  code?: string
  constraint?: string
  message?: string
  details?: string
  hint?: string
  name?: string
}

const BOOKING_SELECT =
  'id, user_id, barber_id, barber_name, service_id, service_name, starts_at, status, payment_status, notes, whatsapp_redirect_url, amount_due, payment_reference, pending_expires_at, confirmed_at, confirmed_by, created_at'

const BOOKABLE_TIME_SLOTS = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
const PENDING_BOOKING_WINDOW_MINUTES = 15

type RawBookingRecord = {
  id: string | number
  user_id?: string | null
  barber_id?: string | null
  barber_name?: string | null
  service_id?: string | null
  service_name?: string | null
  starts_at?: string | null
  status?: string | null
  payment_status?: string | null
  notes?: string | null
  whatsapp_redirect_url?: string | null
  amount_due?: number | string | null
  payment_reference?: string | null
  pending_expires_at?: string | null
  confirmed_at?: string | null
  confirmed_by?: string | null
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

function isPaymentStatus(value: string | null | undefined): value is PaymentStatus {
  return typeof value === 'string' && PAYMENT_STATUSES.includes(value as PaymentStatus)
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

function isSupabaseLikeError(value: unknown): value is SupabaseLikeError {
  return typeof value === 'object' && value !== null
}

function isUniqueSlotViolation(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false
  }

  const message = error.message?.toLowerCase() ?? ''
  const constraint =
    'constraint' in error && typeof error.constraint === 'string'
      ? error.constraint
      : ''

  return (
    error.code === '23505' &&
    (message.includes('bookings_barber_slot_unique') ||
      message.includes('booking_slot_conflict') ||
      constraint === 'bookings_barber_slot_unique')
  )
}

function isForeignKeyViolation(error: { code?: string; message?: string; details?: string } | null) {
  return error?.code === '23503'
}

function getSupabaseErrorContext(error: unknown) {
  if (!isSupabaseLikeError(error)) {
    return null
  }

  const code = typeof error.code === 'string' ? error.code : undefined
  const message = typeof error.message === 'string' ? error.message : undefined
  const details = typeof error.details === 'string' ? error.details : undefined
  const hint = typeof error.hint === 'string' ? error.hint : undefined

  if (!code && !message && !details && !hint) {
    return null
  }

  return { code, message, details, hint }
}

function isPermissionDeniedError(error: { code?: string; message?: string; details?: string } | null) {
  if (!error) {
    return false
  }

  const message = error.message?.toLowerCase() ?? ''
  const details = error.details?.toLowerCase() ?? ''

  return (
    error.code === '42501' ||
    message.includes('permission denied') ||
    message.includes('row-level security') ||
    details.includes('row-level security')
  )
}

function isSchemaMismatchError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false
  }

  const message = error.message?.toLowerCase() ?? ''

  return (
    error.code === '42703' ||
    error.code === 'PGRST100' ||
    error.code === 'PGRST200' ||
    error.code === 'PGRST201' ||
    message.includes('column') ||
    message.includes('select') ||
    message.includes('relationship')
  )
}

function serializeUnknownError(error: unknown): unknown {
  if (error instanceof Error) {
    const serialized: Record<string, unknown> = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
    const errorRecord = error as unknown as Record<string, unknown>

    for (const key of Object.getOwnPropertyNames(error)) {
      if (!(key in serialized)) {
        serialized[key] = errorRecord[key]
      }
    }

    return serialized
  }

  if (typeof error === 'string') {
    return error
  }

  if (typeof error === 'number' || typeof error === 'boolean' || error == null) {
    return error
  }

  if (typeof error === 'object') {
    const serialized: Record<string, unknown> = {}

    for (const key of Object.getOwnPropertyNames(error)) {
      serialized[key] = (error as Record<string, unknown>)[key]
    }

    if (Object.keys(serialized).length > 0) {
      return serialized
    }
  }

  try {
    return JSON.parse(JSON.stringify(error))
  } catch {
    return String(error)
  }
}

function buildBookingErrorDetails(error: unknown, context: string) {
  const details = [`Context: ${context}`]
  const supabase = getSupabaseErrorContext(error)

  if (supabase?.code) {
    details.push(`Supabase code: ${supabase.code}`)
  }

  if (supabase?.message) {
    details.push(`Supabase message: ${supabase.message}`)
  }

  if (supabase?.details) {
    details.push(`Supabase details: ${supabase.details}`)
  }

  if (supabase?.hint) {
    details.push(`Supabase hint: ${supabase.hint}`)
  }

  if (error instanceof Error) {
    details.push(`Thrown error: ${error.name}: ${error.message}`)
    return details
  }

  if (!supabase) {
    details.push(`Thrown value: ${JSON.stringify(serializeUnknownError(error))}`)
  }

  return details
}

function logBookingFailure(scope: string, error: unknown, context: string) {
  const supabase = getSupabaseErrorContext(error)

  console.error(`[bookings] ${scope} failed`, {
    context,
    code: supabase?.code ?? null,
    message: supabase?.message ?? (error instanceof Error ? error.message : null),
    details: supabase?.details ?? null,
    hint: supabase?.hint ?? null,
    error: serializeUnknownError(error),
  })
}

function createListBookingsContext(actor: BookingActor, filters: BookingListFilters) {
  return `actorRole=${actor.role}; actorUserId=${actor.userId}; filters=${JSON.stringify(filters)}`
}

function logListBookingsDebug(input: {
  authUser: { id: string; email?: string } | null
  role: BookingActor['role']
  filters: BookingListFilters
  select: string
}) {
  console.debug('[bookings] listBookings debug', {
    authUser: input.authUser,
    role: input.role,
    filters: input.filters,
    table: 'bookings',
    select: input.select,
  })
}

function failureFromListBookingsError(
  error: unknown,
  context: string
): BookingResult<BookingRecord[]> {
  const supabase = getSupabaseErrorContext(error)

  if (isMissingRelationError(supabase)) {
    return failure('TABLE_MISSING', 'The bookings table is not available yet.')
  }

  if (isPermissionDeniedError(supabase)) {
    return failure(
      'FORBIDDEN',
      'You do not have permission to read bookings.',
      buildBookingErrorDetails(error, context)
    )
  }

  if (isSchemaMismatchError(supabase)) {
    return failure(
      'DATABASE_ERROR',
      'The bookings query does not match the current Supabase schema.',
      buildBookingErrorDetails(error, context)
    )
  }

  return failure(
    'DATABASE_ERROR',
    'Failed to load bookings.',
    buildBookingErrorDetails(error, context)
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

function normalizeOptionalNumber(value: number | string | null | undefined) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat('en-ZA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function formatTimeLabel(value: string) {
  return new Intl.DateTimeFormat('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function buildPaymentReference(bookingId: string) {
  return `OB-${bookingId.slice(0, 8).toUpperCase()}`
}

function getPendingExpiryTimestamp(now = new Date()) {
  return new Date(now.getTime() + PENDING_BOOKING_WINDOW_MINUTES * 60 * 1000).toISOString()
}

function isExpiredPendingBooking(row: {
  status?: BookingStatus | null
  pending_expires_at?: string | null
}) {
  if (row.status !== 'pending_payment' || !row.pending_expires_at) {
    return false
  }

  const expiresAt = new Date(row.pending_expires_at)
  return !Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() <= Date.now()
}

function normalizeBookingStatus(
  status: string | null | undefined,
  pendingExpiresAt: string | null | undefined
): BookingStatus {
  const normalized = isBookingStatus(status) ? status : 'pending_payment'

  if (normalized === 'pending_payment' && pendingExpiresAt) {
    const expiresAt = new Date(pendingExpiresAt)

    if (!Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() <= Date.now()) {
      return 'expired'
    }
  }

  return normalized
}

function getServiceAmount(service: { price: string }) {
  return Number.parseInt(service.price.replace(/[^\d]/g, ''), 10)
}

function normalizeBookingRecord(row: RawBookingRecord): BookingRecord {
  const pendingExpiresAt = row.pending_expires_at ?? null

  return {
    id: String(row.id),
    user_id: row.user_id ?? '',
    barber_id: row.barber_id ?? null,
    barber_name: row.barber_name ?? null,
    service_id: row.service_id ?? null,
    service_name: row.service_name ?? 'Appointment',
    starts_at: row.starts_at ?? '',
    status: normalizeBookingStatus(row.status, pendingExpiresAt),
    payment_status: isPaymentStatus(row.payment_status)
      ? row.payment_status
      : 'unpaid',
    notes: row.notes ?? null,
    whatsapp_redirect_url: row.whatsapp_redirect_url ?? null,
    amount_due: normalizeOptionalNumber(row.amount_due),
    payment_reference: row.payment_reference ?? null,
    pending_expires_at: pendingExpiresAt,
    confirmed_at: row.confirmed_at ?? null,
    confirmed_by: row.confirmed_by ?? null,
    created_at: row.created_at ?? '',
  }
}

function getServiceDefinition(input: { serviceId?: string; serviceName?: string }) {
  if (input.serviceId) {
    const byId = services.find((service) => service.id === input.serviceId)

    if (byId) {
      return byId
    }
  }

  if (input.serviceName) {
    const normalizedName = input.serviceName.trim().toLowerCase()
    return (
      services.find((service) => service.name.trim().toLowerCase() === normalizedName) ?? null
    )
  }

  return null
}

function getDateOnly(value: string) {
  return value.slice(0, 10)
}

function getTimeOnly(value: string) {
  return value.slice(11, 16)
}

function isWeekendDate(date: Date) {
  const day = date.getUTCDay()
  return day === 0 || day === 6
}

function isValidBookableSlot(startsAt: string) {
  const parsed = new Date(startsAt)

  if (Number.isNaN(parsed.getTime())) {
    return false
  }

  if (parsed.getTime() <= Date.now()) {
    return false
  }

  if (isWeekendDate(parsed)) {
    return false
  }

  return BOOKABLE_TIME_SLOTS.includes(getTimeOnly(parsed.toISOString()))
}

function buildDateRange(date: string) {
  const start = new Date(`${date}T00:00:00.000Z`)
  const end = new Date(`${date}T23:59:59.999Z`)

  return {
    start: start.toISOString(),
    end: end.toISOString(),
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
  const service = getServiceDefinition({
    serviceId: input.serviceId,
    serviceName: input.serviceName,
  })
  const startsAt = normalizeTimestamp(input.startsAt)
  const notes = normalizeOptionalText(input.notes)
  const barberId = normalizeRequiredText(input.barberId)

  if (!service) {
    details.push('serviceId or serviceName must match a supported service.')
  }

  if (!startsAt || !isValidBookableSlot(startsAt)) {
    details.push('startsAt must be a valid future weekday slot.')
  }

  if (!barberId) {
    details.push('barberId is required.')
  }

  if (actor.role !== 'customer') {
    details.push('Only customers can create bookings.')
  }

  if (details.length > 0 || !service || !startsAt || !barberId) {
    return failure<CreateBookingInput>('VALIDATION_ERROR', 'Booking payload is invalid.', details)
  }

  return success({
    barberId,
    serviceId: service.id,
    serviceName: service.name,
    startsAt,
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
    payment_status?: PaymentStatus
    notes?: string | null
    pending_expires_at?: string | null
    confirmed_at?: string | null
    confirmed_by?: string | null
    whatsapp_redirect_url?: string | null
    amount_due?: number | null
    payment_reference?: string | null
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
      actor.role === 'admin' || actor.role === 'customer'
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
      if (['cancelled'].includes(input.status)) {
        payload.status = input.status
      } else {
        details.push('Customers can only cancel their own bookings.')
      }
    } else if (actor.role === 'barber') {
      if (['completed', 'cancelled'].includes(input.status)) {
        payload.status = input.status
      } else {
        details.push('Barbers can only complete or cancel assigned bookings.')
      }
    } else {
      payload.status = input.status
    }
  }

  if (typeof input.paymentStatus === 'string') {
    if (!isPaymentStatus(input.paymentStatus)) {
      details.push('paymentStatus is invalid.')
    } else if (actor.role === 'admin') {
      payload.payment_status = input.paymentStatus
    } else {
      details.push('paymentStatus cannot be updated by this role.')
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, 'pendingExpiresAt')) {
    if (actor.role === 'admin') {
      payload.pending_expires_at = input.pendingExpiresAt
        ? normalizeTimestamp(input.pendingExpiresAt)
        : null
    } else {
      details.push('pendingExpiresAt cannot be updated by this role.')
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, 'confirmedAt')) {
    if (actor.role === 'admin') {
      payload.confirmed_at = input.confirmedAt ? normalizeTimestamp(input.confirmedAt) : null
    } else {
      details.push('confirmedAt cannot be updated by this role.')
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, 'confirmedBy')) {
    if (actor.role === 'admin') {
      payload.confirmed_by = normalizeRequiredText(input.confirmedBy) ?? null
    } else {
      details.push('confirmedBy cannot be updated by this role.')
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, 'whatsappRedirectUrl')) {
    if (actor.role === 'admin') {
      payload.whatsapp_redirect_url = normalizeOptionalText(input.whatsappRedirectUrl)
    } else {
      details.push('whatsappRedirectUrl cannot be updated by this role.')
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, 'amountDue')) {
    if (actor.role === 'admin') {
      const amountDue = normalizeOptionalNumber(input.amountDue)

      if (input.amountDue !== null && input.amountDue !== undefined && amountDue === null) {
        details.push('amountDue must be a valid number.')
      } else {
        payload.amount_due = amountDue
      }
    } else {
      details.push('amountDue cannot be updated by this role.')
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, 'paymentReference')) {
    if (actor.role === 'admin') {
      payload.payment_reference = normalizeOptionalText(input.paymentReference)
    } else {
      details.push('paymentReference cannot be updated by this role.')
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
  try {
    const actorResult = await getActorOrError()

    if (!actorResult.ok) {
      return actorResult
    }

    const actor = actorResult.data
    const supabase = await createClient()
    const context = createListBookingsContext(actor, filters)
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      const authErrorContext = getSupabaseErrorContext(authError)

      console.error('[bookings] listBookings auth lookup failed', {
        code: authErrorContext?.code ?? null,
        message: authErrorContext?.message ?? authError.message ?? null,
        details: authErrorContext?.details ?? null,
        hint: authErrorContext?.hint ?? null,
        error: serializeUnknownError(authError),
      })
    }

    logListBookingsDebug({
      authUser: authUser
        ? {
            id: authUser.id,
            email: authUser.email,
          }
        : null,
      role: actor.role,
      filters,
      select: BOOKING_SELECT,
    })

    if (actor.role === 'customer' && filters.userId && filters.userId !== actor.userId) {
      return failure(
        'FORBIDDEN',
        'Customers can only access their own bookings.',
        [`Context: ${context}`]
      )
    }

    const query = applyListFilters(supabase.from('bookings').select(BOOKING_SELECT), filters, actor)

    const { data, error } = await query

    if (error) {
      console.error('[bookings] listBookings query error', {
        code: error.code ?? null,
        message: error.message ?? null,
        details: error.details ?? null,
        hint: error.hint ?? null,
      })
      logBookingFailure('listBookings query', error, context)
      return failureFromListBookingsError(error, context)
    }

    return success(((data ?? []) as RawBookingRecord[]).map(normalizeBookingRecord))
  } catch (error) {
    const context = `filters=${JSON.stringify(filters)}`
    logBookingFailure('listBookings', error, context)
    return failureFromListBookingsError(error, context)
  }
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

  if (actor.role !== 'customer') {
    return failure('FORBIDDEN', 'Only customers can create bookings.')
  }

  const profileComplete = await isProfileComplete(actor.userId)

  if (!profileComplete) {
    return failure(
      'INCOMPLETE_PROFILE',
      'Your profile must be completed before you can confirm a booking.',
      ['Required fields: first_name, last_name, phone_number, profile_image_url.']
    )
  }

  const payloadResult = validateCreateInput(input, actor)

  if (!payloadResult.ok) {
    return payloadResult
  }

  const supabase = await createClient()
  const payload = payloadResult.data
  const barber = await getBarberProfileByUserId(payload.barberId ?? '')
  const customerProfile = await getCustomerProfile(actor.userId)

  if (!barber) {
    return failure('VALIDATION_ERROR', 'Selected barber does not exist.')
  }

  if (!customerProfile?.isComplete) {
    return failure(
      'INCOMPLETE_PROFILE',
      'Your profile must be completed before you can continue to WhatsApp checkout.'
    )
  }

  const availability = await getAvailabilityForBarberDate(
    payload.barberId ?? '',
    getDateOnly(payload.startsAt)
  )

  if (!availability.ok) {
    return availability
  }

  if (!availability.data.availableSlots.includes(getTimeOnly(payload.startsAt))) {
    return failure(
      'SLOT_UNAVAILABLE',
      'This time slot is no longer available.'
    )
  }

  const service = getServiceDefinition({
    serviceId: payload.serviceId,
    serviceName: payload.serviceName,
  })

  if (!service) {
    return failure('VALIDATION_ERROR', 'Selected service does not exist.')
  }

  const amountDue = getServiceAmount(service)
  const bookingId = crypto.randomUUID()
  const paymentReference = buildPaymentReference(bookingId)
  const pendingExpiresAt = getPendingExpiryTimestamp()
  let whatsappRedirectUrl: string

  try {
    whatsappRedirectUrl = buildBookingWhatsAppUrl(
      process.env.NEXT_PUBLIC_WHATSAPP_BOOKING_NUMBER ?? '',
      buildBookingWhatsAppMessage({
        customerName: customerProfile.fullName,
        phoneNumber: customerProfile.phoneNumber,
        barberName: barber.displayName,
        serviceName: service.name,
        dateLabel: formatDateLabel(payload.startsAt),
        timeLabel: formatTimeLabel(payload.startsAt),
        bookingReference: paymentReference,
        amountDueLabel: formatCurrency(amountDue),
      })
    )
  } catch (error) {
    return failure(
      'VALIDATION_ERROR',
      error instanceof Error ? error.message : 'WhatsApp checkout is not configured.'
    )
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      id: bookingId,
      user_id: actor.userId,
      barber_id: payload.barberId,
      barber_name: barber.displayName,
      service_id: payload.serviceId ?? null,
      service_name: payload.serviceName,
      starts_at: payload.startsAt,
      status: 'pending_payment',
      payment_status: 'pending_verification',
      notes: payload.notes,
      amount_due: amountDue,
      payment_reference: paymentReference,
      pending_expires_at: pendingExpiresAt,
      whatsapp_redirect_url: whatsappRedirectUrl,
    })
    .select(BOOKING_SELECT)
    .single()

  if (error) {
    if (isUniqueSlotViolation(error)) {
      return failure(
        'SLOT_UNAVAILABLE',
        'This time slot is no longer available.'
      )
    }

    if (isForeignKeyViolation(error)) {
      return failure('UNAUTHORIZED', 'You must be signed in with a valid customer account.')
    }

    if (isMissingRelationError(error)) {
      return failure('TABLE_MISSING', 'The bookings table is not available yet.')
    }

    console.error('[bookings] createBooking failed:', error)
    return failure('DATABASE_ERROR', 'Failed to create booking.')
  }

  return success(normalizeBookingRecord(data as RawBookingRecord))
}

export async function getAvailabilityForBarberDate(
  barberId: string,
  date: string
): Promise<BookingResult<BookingAvailability>> {
  if (!barberId) {
    return failure('VALIDATION_ERROR', 'barberId is required.')
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return failure('VALIDATION_ERROR', 'date must be formatted as YYYY-MM-DD.')
  }

  const dateStart = new Date(`${date}T00:00:00.000Z`)

  if (Number.isNaN(dateStart.getTime()) || isWeekendDate(dateStart)) {
    return success({
      barberId,
      date,
      availableSlots: [],
      bookedSlots: [],
      temporarilyReservedSlots: [],
    })
  }

  const barber = await getBarberProfileByUserId(barberId)

  if (!barber) {
    return failure('VALIDATION_ERROR', 'Selected barber does not exist.')
  }

  const privilegedSupabase = createAdminClient()
  const dateRange = buildDateRange(date)
  let blockedRows:
    | Array<{ starts_at?: string | null; status?: string | null; pending_expires_at?: string | null }>
    | null = null
  let error:
    | { code?: string; message?: string; details?: string; hint?: string }
    | null = null

  if (privilegedSupabase) {
    const response = await privilegedSupabase
      .from('bookings')
      .select('starts_at, status, pending_expires_at')
      .eq('barber_id', barberId)
      .gte('starts_at', dateRange.start)
      .lte('starts_at', dateRange.end)
      .in('status', ['pending_payment', 'confirmed', 'completed'])

    blockedRows = response.data as Array<{
      starts_at?: string | null
      status?: string | null
      pending_expires_at?: string | null
    }> | null
    error = response.error
  } else {
    const supabase = await createClient()
    const response = await supabase.rpc('get_booked_barber_slots', {
      p_barber_id: barberId,
      p_day: date,
    })

    blockedRows = ((response.data ?? []) as Array<{ starts_at?: string | null }>).map((row) => ({
      starts_at: row.starts_at ?? null,
      status: 'confirmed',
      pending_expires_at: null,
    }))
    error = response.error
  }

  if (error) {
    if (error.code === '42883' || isMissingRelationError(error)) {
      return failure(
        'TABLE_MISSING',
        'Booking availability is not configured yet. Run the latest booking schema SQL.'
      )
    }

    console.error('[bookings] getAvailabilityForBarberDate failed:', error)
    return failure('DATABASE_ERROR', 'Failed to load booking availability.')
  }

  const activeRows = (blockedRows ?? []).filter((row) => {
    const normalizedStatus = normalizeBookingStatus(row.status, row.pending_expires_at)

    if (normalizedStatus === 'expired' || normalizedStatus === 'cancelled') {
      return false
    }

    if (normalizedStatus === 'pending_payment') {
      return !isExpiredPendingBooking({
        status: normalizedStatus,
        pending_expires_at: row.pending_expires_at ?? null,
      })
    }

    return true
  })

  const bookedSlots = activeRows
    .filter((row) => normalizeBookingStatus(row.status, row.pending_expires_at) !== 'pending_payment')
    .map((row) => row.starts_at)
    .filter((value): value is string => typeof value === 'string')
    .map((value) => getTimeOnly(new Date(value).toISOString()))

  const temporarilyReservedSlots = activeRows
    .filter((row) => normalizeBookingStatus(row.status, row.pending_expires_at) === 'pending_payment')
    .map((row) => row.starts_at)
    .filter((value): value is string => typeof value === 'string')
    .map((value) => getTimeOnly(new Date(value).toISOString()))

  const blockedSet = new Set([...bookedSlots, ...temporarilyReservedSlots])

  return success({
    barberId,
    date,
    bookedSlots,
    temporarilyReservedSlots,
    availableSlots: BOOKABLE_TIME_SLOTS.filter((slot) => !blockedSet.has(slot)),
  })
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

export async function confirmBookingPayment(
  id: string,
  input: ConfirmPaymentInput = {}
): Promise<BookingResult<BookingRecord>> {
  const { user, role } = await getUserRole()

  if (!user || role !== 'admin') {
    return failure('FORBIDDEN', 'Only admins can confirm booking payments.')
  }

  const existingResult = await getBookingById(id)

  if (!existingResult.ok) {
    return existingResult
  }

  const existing = existingResult.data

  if (existing.status === 'expired') {
    return failure('VALIDATION_ERROR', 'This booking payment window has already expired.')
  }

  if (existing.status === 'cancelled') {
    return failure('VALIDATION_ERROR', 'Cancelled bookings cannot be confirmed.')
  }

  if (existing.status === 'completed') {
    return failure('VALIDATION_ERROR', 'Completed bookings do not need payment confirmation.')
  }

  if (existing.status !== 'pending_payment' && existing.status !== 'confirmed') {
    return failure('VALIDATION_ERROR', 'Only pending-payment bookings can be confirmed.')
  }

  const supabase = await createClient()
  const confirmedAt = new Date().toISOString()
  const { data, error } = await supabase
    .from('bookings')
    .update({
      status: 'confirmed',
      payment_status: input.paymentStatus ?? 'paid',
      confirmed_at: confirmedAt,
      confirmed_by: user.id,
      pending_expires_at: null,
    })
    .eq('id', id)
    .select(BOOKING_SELECT)
    .single()

  if (error) {
    console.error('[bookings] confirmBookingPayment failed:', error)
    return failure('DATABASE_ERROR', 'Failed to confirm booking payment.')
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
