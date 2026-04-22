import { barbers } from '@/data/barbers'

function shortId(value: string) {
  return value.slice(0, 8)
}

export function formatBookingCustomerName(userId: string) {
  return `Client ${shortId(userId)}`
}

export function formatBookingCustomerContact(userId: string) {
  return `Account ${shortId(userId)}`
}

export function formatBookingBarberName(
  barberId: string | null | undefined,
  fallback = 'Only Bangers Team'
) {
  if (!barberId) {
    return fallback
  }

  const staticMatch = barbers.find((barber) => String(barber.id) === barberId)

  if (staticMatch) {
    return staticMatch.name
  }

  return `Barber ${shortId(barberId)}`
}
