const TIME_ONLY_PATTERN = /^\d{2}:\d{2}(?::\d{2})?$/
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function normalizeText(value?: string | null) {
  return typeof value === 'string' ? value.trim() : ''
}

function toDate(value?: string | null) {
  const normalized = normalizeText(value)

  if (!normalized || TIME_ONLY_PATTERN.test(normalized)) {
    return null
  }

  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function toTimeOnly(value?: string | null) {
  const normalized = normalizeText(value)

  if (!TIME_ONLY_PATTERN.test(normalized)) {
    return null
  }

  return normalized.slice(0, 5)
}

export function isValidDateValue(value?: string | null): boolean {
  return Boolean(toDate(value) || toTimeOnly(value))
}

export function formatDate(value?: string | null): string {
  const normalized = normalizeText(value)

  if (!normalized) {
    return 'Date not set'
  }

  if (DATE_ONLY_PATTERN.test(normalized)) {
    const parsed = new Date(`${normalized}T00:00:00.000Z`)

    if (Number.isNaN(parsed.getTime())) {
      return 'Date not set'
    }

    return new Intl.DateTimeFormat('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(parsed)
  }

  const parsed = toDate(normalized)

  if (!parsed) {
    return 'Date not set'
  }

  return new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed)
}

export function formatTime(value?: string | null): string {
  const normalized = normalizeText(value)

  if (!normalized) {
    return 'Time not set'
  }

  const timeOnly = toTimeOnly(normalized)

  if (timeOnly) {
    return timeOnly
  }

  const parsed = toDate(normalized)

  if (!parsed) {
    return 'Time not set'
  }

  return new Intl.DateTimeFormat('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(parsed)
}

export function formatDateTime(value?: string | null): string {
  const normalized = normalizeText(value)

  if (!normalized) {
    return 'Date not set'
  }

  const parsed = toDate(normalized)

  if (!parsed) {
    if (DATE_ONLY_PATTERN.test(normalized)) {
      return formatDate(normalized)
    }

    if (TIME_ONLY_PATTERN.test(normalized)) {
      return formatTime(normalized)
    }

    return 'Date not set'
  }

  return new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(parsed)
}

export function formatTimeRange(start?: string | null, end?: string | null): string {
  const formattedStart = formatTime(start)
  const formattedEnd = formatTime(end)

  if (formattedStart === 'Time not set' && formattedEnd === 'Time not set') {
    return 'Time not set'
  }

  if (formattedStart === 'Time not set') {
    return formattedEnd
  }

  if (formattedEnd === 'Time not set') {
    return formattedStart
  }

  return `${formattedStart} - ${formattedEnd}`
}
