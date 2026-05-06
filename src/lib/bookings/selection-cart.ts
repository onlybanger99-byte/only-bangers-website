'use client'

export interface BookingSelectionCartItem {
  key: string
  serviceId: string
  serviceName: string
  serviceImage?: string
  barberId: string
  barberName: string
  barberServicePriceId: string
  price: number
  date: string
  startTime: string
  endTime: string
  startsAt: string
  endsAt: string
}

const STORAGE_KEY = 'onlyBangersBookingSelectionCart'

export function readBookingSelectionCart() {
  if (typeof window === 'undefined') {
    return [] as BookingSelectionCartItem[]
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as BookingSelectionCartItem[]) : []
  } catch {
    return []
  }
}

export function writeBookingSelectionCart(items: BookingSelectionCartItem[]) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event('bookingSelectionCartUpdated'))
}

export function clearBookingSelectionCart() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event('bookingSelectionCartUpdated'))
}
