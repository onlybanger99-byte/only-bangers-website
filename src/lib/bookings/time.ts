const BUSINESS_TZ_OFFSET = '+02:00'

function normalizeTime(value: string) {
  return value.trim().slice(0, 5)
}

export function parseTimeToMinutes(value: string) {
  const normalized = normalizeTime(value)

  if (!/^\d{2}:\d{2}$/.test(normalized)) {
    return null
  }

  const [hours, minutes] = normalized.split(':').map((part) => Number.parseInt(part, 10))

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null
  }

  return hours * 60 + minutes
}

export function formatMinutesToTime(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    return '00:00'
  }

  const hours = Math.floor(value / 60)
  const minutes = value % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function combineDateAndTime(date: string, time: string) {
  const normalizedTime = normalizeTime(time)
  return `${date}T${normalizedTime}:00${BUSINESS_TZ_OFFSET}`
}

export function calculateEndTime(startsAt: string, durationMinutes: number) {
  const start = new Date(startsAt)

  if (Number.isNaN(start.getTime())) {
    return null
  }

  return new Date(start.getTime() + durationMinutes * 60 * 1000).toISOString()
}

export function rangesOverlap(
  startA: string | Date,
  endA: string | Date,
  startB: string | Date,
  endB: string | Date
) {
  const aStart = new Date(startA).getTime()
  const aEnd = new Date(endA).getTime()
  const bStart = new Date(startB).getTime()
  const bEnd = new Date(endB).getTime()

  if ([aStart, aEnd, bStart, bEnd].some((value) => Number.isNaN(value))) {
    return false
  }

  return aStart < bEnd && bStart < aEnd
}

export function getDateRangeForLocalDate(date: string) {
  return {
    start: `${date}T00:00:00${BUSINESS_TZ_OFFSET}`,
    end: `${date}T23:59:59.999${BUSINESS_TZ_OFFSET}`,
  }
}
