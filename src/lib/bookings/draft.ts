'use client'

export interface BookingDraft {
  serviceId: string
  serviceName: string
  servicePrice: number
  barberServicePriceId?: string
  serviceImage?: string
  barberId: string
  barberName: string
  date: string
  time: string
}

const STORAGE_KEY = 'onlyBangersBookingDraft'

export function readBookingDraft(): BookingDraft | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as BookingDraft
  } catch {
    return null
  }
}

export function writeBookingDraft(draft: BookingDraft) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
}

export function clearBookingDraft() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(STORAGE_KEY)
}
