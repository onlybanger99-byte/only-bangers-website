import { listBarberAvailabilitySlotsForDate } from '@/lib/barber-availability/service'
import { getBarberServicePriceById } from '@/lib/barber-service-prices/service'
import { getBarberProfileByUserId } from '@/lib/barbers/service'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { BookingResult } from './types'
import { calculateEndTime, combineDateAndTime, formatMinutesToTime, getDateRangeForLocalDate, parseTimeToMinutes, rangesOverlap } from './time'

const BLOCKING_STATUSES = new Set([
  'pending_payment',
  'confirmed',
  'paid',
  'payment_pending',
  'awaiting_confirmation',
])

const BLOCKING_PAYMENT_STATUSES = new Set(['unpaid', 'paid', 'pending'])
const IGNORED_STATUSES = new Set(['cancelled', 'rejected', 'expired'])
const SLOT_INCREMENT_MINUTES = 15
const DEFAULT_DURATION_MINUTES = 30
const NEXT_AVAILABLE_SEARCH_DAYS = 30

type BlockingBookingRow = {
  id: string | number
  barber_service_price_id?: string | null
  starts_at?: string | null
  ends_at?: string | null
  status?: string | null
  payment_status?: string | null
}

export type AvailableTimeOption = {
  startTime: string
  endTime: string
  startsAt: string
  endsAt: string
}

export type AvailabilityStatusSummary = {
  availabilityStatus: string
  nextAvailableSlot: string | null
}

export type BookingAvailabilityDetail = {
  date: string
  barberId: string
  servicePriceId: string
  durationMinutes: number
  availableTimes: AvailableTimeOption[]
  message?: string
}

function success<T>(data: T): BookingResult<T> {
  return { ok: true, data }
}

function failure<T>(message: string, details?: string[]): BookingResult<T> {
  return { ok: false, code: 'VALIDATION_ERROR', message, details }
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function getCurrentBusinessTimestamp() {
  return new Date().getTime()
}

function getSupabase() {
  return createAdminClient() ?? createClient()
}

function shouldBlockBooking(row: BlockingBookingRow) {
  const status = normalizeText(row.status)
  const paymentStatus = normalizeText(row.payment_status)

  if (IGNORED_STATUSES.has(status)) {
    return false
  }

  if (BLOCKING_STATUSES.has(status)) {
    return true
  }

  return BLOCKING_PAYMENT_STATUSES.has(paymentStatus)
}

async function loadBlockingBookings(barberId: string, date: string) {
  const supabase = await getSupabase()
  const range = getDateRangeForLocalDate(date)
  const { data, error } = await supabase
    .from('bookings')
    .select('id, barber_service_price_id, starts_at, ends_at, status, payment_status')
    .eq('barber_id', barberId)
    .lt('starts_at', range.end)
    .gte('starts_at', range.start)

  if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
    return {
      ok: false as const,
      message: 'We could not load existing bookings for this barber.',
      details: [error.message],
      data: [] as BlockingBookingRow[],
    }
  }

  const rows = ((data ?? []) as BlockingBookingRow[]).filter(shouldBlockBooking)
  return {
    ok: true as const,
    data: rows,
  }
}

async function resolveBookingEndsAt(row: BlockingBookingRow, fallbackDurationMinutes: number) {
  if (normalizeText(row.ends_at)) {
    return normalizeText(row.ends_at)
  }

  const priceId = normalizeText(row.barber_service_price_id)

  if (priceId) {
    const price = await getBarberServicePriceById(priceId)
    const duration = price?.durationMinutes ?? fallbackDurationMinutes
    return calculateEndTime(normalizeText(row.starts_at), duration) ?? normalizeText(row.starts_at)
  }

  return calculateEndTime(normalizeText(row.starts_at), fallbackDurationMinutes) ?? normalizeText(row.starts_at)
}

function buildAvailabilityMessage(
  availabilitySlotsCount: number,
  availableTimesCount: number
) {
  if (availabilitySlotsCount === 0) {
    return 'No availability set for this date.'
  }

  if (availableTimesCount === 0) {
    return 'No available times left for this date.'
  }

  return undefined
}

export async function getAvailabilityForBarberServiceDate(input: {
  barberId: string
  servicePriceId: string
  date: string
}) {
  const barberId = normalizeText(input.barberId)
  const servicePriceId = normalizeText(input.servicePriceId)
  const date = normalizeText(input.date)

  if (!barberId) {
    return failure<BookingAvailabilityDetail>('barberId is required.')
  }

  if (!servicePriceId) {
    return failure<BookingAvailabilityDetail>('servicePriceId is required.')
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return failure<BookingAvailabilityDetail>('date must be formatted as YYYY-MM-DD.')
  }

  const [barber, servicePrice, availabilityResult, blockingResult] = await Promise.all([
    getBarberProfileByUserId(barberId),
    getBarberServicePriceById(servicePriceId),
    listBarberAvailabilitySlotsForDate(barberId, date),
    loadBlockingBookings(barberId, date),
  ])

  if (!barber || !barber.isActive || !barber.isLive) {
    return failure<BookingAvailabilityDetail>('Selected barber is not available for booking.')
  }

  if (!servicePrice || !servicePrice.isActive) {
    return failure<BookingAvailabilityDetail>('Selected service price is not available.')
  }

  if (barber.id && servicePrice.barberProfileId !== barber.id) {
    return failure<BookingAvailabilityDetail>('Selected service price does not belong to this barber.')
  }

  if (!availabilityResult.ok) {
    return failure<BookingAvailabilityDetail>(availabilityResult.message)
  }

  if (!blockingResult.ok) {
    return failure<BookingAvailabilityDetail>(blockingResult.message, blockingResult.details)
  }

  const durationMinutes = servicePrice.durationMinutes ?? DEFAULT_DURATION_MINUTES
  const blockingRanges = await Promise.all(
    blockingResult.data.map(async (row) => {
      const startsAt = normalizeText(row.starts_at)
      const endsAt = await resolveBookingEndsAt(row, durationMinutes)
      return {
        startsAt,
        endsAt,
      }
    })
  )

  const availableTimes: AvailableTimeOption[] = []

  for (const slot of availabilityResult.data) {
    const windowStartMinutes = parseTimeToMinutes(slot.startTime)
    const windowEndMinutes = parseTimeToMinutes(slot.endTime)

    if (windowStartMinutes == null || windowEndMinutes == null || windowEndMinutes <= windowStartMinutes) {
      continue
    }

    for (
      let cursor = windowStartMinutes;
      cursor + durationMinutes <= windowEndMinutes;
      cursor += SLOT_INCREMENT_MINUTES
    ) {
      const startTime = formatMinutesToTime(cursor)
      const endTime = formatMinutesToTime(cursor + durationMinutes)
      const startsAt = new Date(combineDateAndTime(date, startTime)).toISOString()
      const endsAt = new Date(combineDateAndTime(date, endTime)).toISOString()

      const overlapsBooking = blockingRanges.some((booking) =>
        rangesOverlap(startsAt, endsAt, booking.startsAt, booking.endsAt)
      )

      if (!overlapsBooking && new Date(startsAt).getTime() > getCurrentBusinessTimestamp()) {
        availableTimes.push({
          startTime,
          endTime,
          startsAt,
          endsAt,
        })
      }
    }
  }

  return success<BookingAvailabilityDetail>({
    date,
    barberId,
    servicePriceId,
    durationMinutes,
    availableTimes,
    message: buildAvailabilityMessage(availabilityResult.data.length, availableTimes.length),
  })
}

export async function isBookableSlotStillAvailable(input: {
  barberId: string
  servicePriceId: string
  date: string
  startsAt: string
  endsAt: string
}) {
  const availability = await getAvailabilityForBarberServiceDate({
    barberId: input.barberId,
    servicePriceId: input.servicePriceId,
    date: input.date,
  })

  if (!availability.ok) {
    return availability
  }

  const match = availability.data.availableTimes.find(
    (slot) => slot.startsAt === input.startsAt && slot.endsAt === input.endsAt
  )

  if (!match) {
    return {
      ok: false as const,
      code: 'SLOT_UNAVAILABLE' as const,
      message: 'This time has just been booked. Please choose another time.',
    }
  }

  return {
    ok: true as const,
    data: match,
  }
}

function getTodayDateInJohannesburg() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function formatAvailabilityDateTime(slot: AvailableTimeOption) {
  const date = new Date(slot.startsAt)

  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export async function getBarberAvailabilityStatusSummary(input: {
  barberId: string
  servicePriceId: string
}) {
  const today = getTodayDateInJohannesburg()

  for (let offset = 0; offset < NEXT_AVAILABLE_SEARCH_DAYS; offset += 1) {
    const date = new Date(`${today}T00:00:00+02:00`)
    date.setDate(date.getDate() + offset)
    const localDate = date.toISOString().slice(0, 10)
    const availability = await getAvailabilityForBarberServiceDate({
      barberId: input.barberId,
      servicePriceId: input.servicePriceId,
      date: localDate,
    })

    if (!availability.ok) {
      continue
    }

    if (availability.data.availableTimes.length === 0) {
      continue
    }

    const firstSlot = availability.data.availableTimes[0]

    if (offset === 0) {
      return {
        availabilityStatus: 'Available today',
        nextAvailableSlot: formatAvailabilityDateTime(firstSlot),
      } satisfies AvailabilityStatusSummary
    }

    return {
      availabilityStatus: `Next available: ${formatAvailabilityDateTime(firstSlot)}`,
      nextAvailableSlot: firstSlot.startsAt,
    } satisfies AvailabilityStatusSummary
  }

  return {
    availabilityStatus: 'No availability set',
    nextAvailableSlot: null,
  } satisfies AvailabilityStatusSummary
}
