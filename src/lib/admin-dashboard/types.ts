import type { BookingStatus, PaymentStatus } from '@/lib/bookings/types'

export interface AdminMetric {
  id: string
  label: string
  value: string
  detail: string
  tone: 'gold' | 'emerald' | 'blue' | 'rose'
}

export interface AdminBookingsFilters {
  query: string
  status: string
  sort: 'starts_at' | 'created_at' | 'status'
  direction: 'asc' | 'desc'
  page: number
  pageSize: number
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
  filters: AdminBookingsFilters
  items: AdminBookingRow[]
  totalCount: number
  totalPages: number
  hasResults: boolean
  errorMessage?: string
}

export interface AdminUsersFilters {
  query: string
  page: number
  pageSize: number
}

export interface AdminUserRow {
  id: string
  fullName: string
  email: string
  phoneNumber: string
  profileImageUrl: string
  role: string
  accountStatus: 'active' | 'suspended' | 'pending'
  createdAtLabel: string
  profileComplete: boolean
}

export interface AdminUsersSection {
  filters: AdminUsersFilters
  items: AdminUserRow[]
  totalCount: number
  totalPages: number
  enabled: boolean
  errorMessage?: string
}

export interface AdminBarbersFilters {
  query: string
  page: number
  pageSize: number
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
  filters: AdminBarbersFilters
  items: AdminBarberRow[]
  totalCount: number
  totalPages: number
  enabled: boolean
  errorMessage?: string
}

export interface AdminRevenuePanel {
  enabled: boolean
  weeklyRevenue: string
  totalRevenue: string
  averageOrderValue: string
  transactionCount: number
  errorMessage?: string
}

export interface AdminFeatureStatus {
  id: string
  label: string
  status: 'enabled' | 'not_enabled' | 'error'
  detail: string
}

export interface AdminOverviewSummary {
  totalBookings: string
  pendingPayments: string
  confirmedBookings: string
  completedBookings: string
}

export interface AdminDashboardViewModel {
  headerMessage: string
  metrics: AdminMetric[]
  overview: AdminOverviewSummary
  pendingPayments: {
    items: AdminBookingRow[]
    countLabel: string
  }
  bookings: AdminBookingsSection
  users: AdminUsersSection
  barbers: AdminBarbersSection
  revenue: AdminRevenuePanel
  featureStatuses: AdminFeatureStatus[]
}
