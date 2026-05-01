export interface BarberServicePriceRecord {
  id: string
  barber_profile_id: string
  service_id: string | null
  service_name: string
  price: number
  duration_minutes: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BarberServicePriceSummary {
  id: string
  barberProfileId: string
  serviceId: string | null
  serviceName: string
  price: number
  durationMinutes: number | null
  isActive: boolean
}

export interface PublicBarberServicePriceSummary extends BarberServicePriceSummary {
  barberUserId: string
  barberName: string
  location: string | null
  cuttingLocation: string | null
  bio: string
  profileImageUrl: string | null
  barberIsActive: boolean
}

export interface BarberServicePriceInput {
  serviceId?: string | null
  serviceName: string
  price: number
  durationMinutes?: number | null
}

export interface PublicServicePriceSummary {
  serviceId: string | null
  serviceName: string
  minPrice: number | null
  maxPrice: number | null
  barberCount: number
}
