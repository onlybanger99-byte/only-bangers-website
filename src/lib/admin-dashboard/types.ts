import type { BookingStatus, PaymentStatus } from '@/lib/bookings/types'

export interface AdminMetric {
  id: string
  label: string
  value: string
  detail: string
  tone: 'gold' | 'emerald' | 'blue' | 'rose'
}

export interface AdminBookingRow {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  serviceName: string
  barberName: string
  startsAtLabel: string
  createdAtLabel: string
  status: BookingStatus
  paymentStatus: PaymentStatus
  amountDueLabel: string
  paymentReference: string
  pendingExpiresAtLabel: string
}

export interface AdminBookingsSection {
  items: AdminBookingRow[]
  totalCount: number
  errorMessage?: string
}

export interface AdminUserRow {
  id: string
  fullName: string
  email: string
  phoneNumber: string
  profileImageUrl: string
  role: 'customer' | 'barber' | 'admin'
  accountStatus: 'active' | 'suspended' | 'pending'
  createdAtLabel: string
  profileComplete: boolean
}

export interface AdminUsersSection {
  customers: AdminUserRow[]
  barbers: AdminUserRow[]
  admins: AdminUserRow[]
  enabled: boolean
  errorMessage?: string
}

export interface AdminBarberRow {
  id: string
  displayName: string
  specialty: string
  profileImageUrl: string
  activeStatus: 'active' | 'inactive'
  profileComplete: boolean
  totalBookings: number
  upcomingBookings: number
  completedBookings: number
}

export interface AdminBarbersSection {
  items: AdminBarberRow[]
  totalCount: number
  enabled: boolean
  errorMessage?: string
}

export interface AdminAttentionSummary {
  pendingPayments: AdminBookingRow[]
  problemBookings: AdminBookingRow[]
  customerProfileGaps: number
  barberProfileGaps: number
}

export interface AdminDashboardViewModel {
  headerMessage: string
  metrics: AdminMetric[]
  attention: AdminAttentionSummary
  bookings: AdminBookingsSection
  users: AdminUsersSection
  barbers: AdminBarbersSection
}
