import type { BookingStatus, PaymentStatus } from '@/lib/bookings/types'
import type { BarberApplicationStatus } from '@/lib/barber-applications/types'

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
  editable: boolean
}

export interface AdminUsersSection {
  customers: AdminUserRow[]
  barbers: AdminUserRow[]
  admins: AdminUserRow[]
  enabled: boolean
  errorMessage?: string
}

export interface AdminServiceRow {
  id: string
  name: string
  slug: string
  description: string
  duration: string
  sortOrder: number
  isActive: boolean
  barberCount: number
  minPriceLabel: string
}

export interface AdminServicesSection {
  items: AdminServiceRow[]
  errorMessage?: string
}

export interface AdminProfileSummary {
  userId: string
  email: string
  fullName: string
  firstName: string
  lastName: string
  phoneNumber: string
  profileImageUrl: string
  profileComplete: boolean
}

export interface AdminBarberRow {
  id: string
  slug: string | null
  displayName: string
  fullName: string | null
  specialty: string
  profileImageUrl: string
  bio: string
  location: string
  cuttingLocation: string
  mapUrl: string | null
  instagramUrl: string | null
  tiktokUrl: string | null
  facebookUrl: string | null
  portfolioUrl: string | null
  activeStatus: 'active' | 'inactive'
  isLive: boolean
  setupStatus: string
  goLiveRequestedAt: string | null
  goLiveReviewedAt: string | null
  goLiveRejectionReason: string | null
  profileComplete: boolean
  totalBookings: number
  upcomingBookings: number
  completedBookings: number
  servicePrices: Array<{
    id: string
    serviceName: string
    price: number
    durationMinutes: number | null
    isActive: boolean
  }>
}

export interface AdminBarberApplicationRow {
  id: string
  userId: string
  applicantName: string
  applicantEmail: string
  applicantPhone: string
  cuttingLocation: string
  instagramUrl: string | null
  tiktokUrl: string | null
  facebookUrl: string | null
  portfolioUrl: string | null
  bio: string
  availabilitySlots: Array<{
    id: string
    availableDate: string
    startTime: string
    endTime: string
  }>
  submittedAtLabel: string
  status: BarberApplicationStatus
  rejectionReason: string | null
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
  pendingBarberApplications: number
  pendingGoLiveRequests: number
  incompleteBarbers: number
}

export interface AdminDashboardViewModel {
  headerMessage: string
  currentAdmin: AdminProfileSummary
  metrics: AdminMetric[]
  attention: AdminAttentionSummary
  bookings: AdminBookingsSection
  services: AdminServicesSection
  users: AdminUsersSection
  barbers: AdminBarbersSection
  barberApplications: {
    items: AdminBarberApplicationRow[]
    errorMessage?: string
  }
}
