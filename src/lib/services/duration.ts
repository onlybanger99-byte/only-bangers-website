function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function parseDurationToMinutes(duration: string) {
  const normalized = normalizeText(duration)
  const match = normalized.match(/(\d+)/)

  if (!match) {
    return 30
  }

  const parsed = Number.parseInt(match[1], 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30
}
