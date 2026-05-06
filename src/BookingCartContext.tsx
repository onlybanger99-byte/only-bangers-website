'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export interface BookingCartItem {
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
  durationMinutes?: number
  location?: string | null
}

interface BookingCartContextType {
  items: BookingCartItem[]
  addItem: (item: BookingCartItem) => boolean
  removeItem: (key: string) => void
  clearCart: () => void
  itemCount: number
  totalPrice: number
}

const BookingCartContext = createContext<BookingCartContextType | undefined>(undefined)

const STORAGE_KEY = 'onlyBangersBookingCart'

export function BookingCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<BookingCartItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  // Initialize from localStorage on client only
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setItems(parsed as BookingCartItem[])
        }
      } catch (error) {
        console.error('[BookingCartProvider] Failed to parse cart from localStorage:', error)
      }
    }

    setIsHydrated(true)

    // Listen for changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          if (Array.isArray(parsed)) {
            setItems(parsed as BookingCartItem[])
          }
        } catch (error) {
          console.error('[BookingCartProvider] Failed to parse cart from storage event:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // Persist to localStorage whenever items change
  useEffect(() => {
    if (typeof window === 'undefined' || !isHydrated) {
      return
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    window.dispatchEvent(new Event('bookingCartUpdated'))
  }, [items, isHydrated])

  const addItem = useCallback((item: BookingCartItem): boolean => {
    setItems((prevItems) => {
      // Check for duplicate
      const existingIndex = prevItems.findIndex(
        (existing) =>
          existing.barberServicePriceId === item.barberServicePriceId &&
          existing.serviceId === item.serviceId &&
          existing.date === item.date &&
          existing.startTime === item.startTime
      )

      if (existingIndex !== -1) {
        // Duplicate found
        return prevItems
      }

      // Add new item
      return [...prevItems, item]
    })

    return true
  }, [])

  const removeItem = useCallback((key: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.key !== key))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const itemCount = items.length

  const totalPrice = items.reduce((sum, item) => sum + item.price, 0)

  const value: BookingCartContextType = {
    items,
    addItem,
    removeItem,
    clearCart,
    itemCount,
    totalPrice,
  }

  return <BookingCartContext.Provider value={value}>{children}</BookingCartContext.Provider>
}

export function useBookingCart() {
  const context = useContext(BookingCartContext)
  if (context === undefined) {
    throw new Error('useBookingCart must be used within BookingCartProvider')
  }
  return context
}
