import type { BookingStatus, PaymentStatus } from '@/lib/bookings/types'
import type { BarberApplicationStatus } from '@/lib/barber-applications/types'
import type { SiteContentGroup, SiteContentItem } from '@/lib/site-content/types'
import type { ContactMessageSummary } from '@/lib/contact-messages/service'

export type AdminDashboardTabId =
  | 'pending-actions'
  | 'overview'
  | 'bookings'
  | 'barbers'
  | 'users'
  | 'services'
  | 'products'
  | 'settings'

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
  startsAt: string
  startsAtLabel: string
  createdAt: string
  createdAtLabel: string
  status: BookingStatus
  paymentStatus: PaymentStatus
  amountDueValue: number
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
  displayName: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  phoneNumber: string
  profileImageUrl: string
  role: 'customer' | 'barber' | 'admin'
  accountStatus: 'active' | 'suspended' | 'pending'
  createdAt: string | null
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
  imageUrl: string | null
  backgroundImageUrl: string | null
  mediaStoragePath: string | null
  mediaImageUrl?: string | null
}

export interface AdminServicesSection {
  items: AdminServiceRow[]
  errorMessage?: string
}

export interface AdminProductRow {
  id: string
  name: string
  slug: string
  description: string
  priceLabel: string
  price: number
  imageUrl: string | null
  category: string
  stockQuantity: number
  isActive: boolean
}

export interface AdminProductsSection {
  items: AdminProductRow[]
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
  phone: string | null
  specialty: string
  profileImageUrl: string
  avatarUrl: string | null
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
  hasLocation: boolean
  hasPrices: boolean
  hasAvailability: boolean
  hasProfileImage: boolean
  issueLabels: string[]
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
  siteContentNeedingReview: number
}

export interface AdminPendingActionItem {
  id: string
  title: string
  type: string
  priority: 'high' | 'medium' | 'low'
  status: string
  description: string
  createdAtLabel?: string | null
  actionLabel: string
  targetTab: AdminDashboardTabId
  barberId?: string
  bookingId?: string
  applicationId?: string
  siteContentKey?: string
  contactMessageId?: string
}

export interface AdminOverviewAction {
  id: string
  title: string
  count: number
  description: string
  actionLabel: string
  targetTab: AdminDashboardTabId
}

export interface AdminOverviewSectionRow {
  id: string
  title: string
  summary: string
  status: string
  actionLabel: string
  targetTab: AdminDashboardTabId
}

export interface AdminOverviewSection {
  id: string
  title: string
  description: string
  stats: Array<{
    id: string
    label: string
    value: string
  }>
  rows: AdminOverviewSectionRow[]
}

export interface AdminRequestsSection {
  barberApplications: {
    pending: AdminBarberApplicationRow[]
    approved: AdminBarberApplicationRow[]
    rejected: AdminBarberApplicationRow[]
  }
  goLiveRequests: AdminBarberRow[]
  setupIssues: AdminBarberRow[]
  deactivatedBarbers: AdminBarberRow[]
}

export interface AdminSiteContentSection {
  groups: SiteContentGroup[]
  items: SiteContentItem[]
  socialLinks: SiteContentItem[]
  mediaAssets: SiteContentItem[]
  reviewCount: number
}

export interface AdminDashboardViewModel {
  headerMessage: string
  currentAdmin: AdminProfileSummary
  metrics: AdminMetric[]
  pendingActions: AdminPendingActionItem[]
  overviewActions: AdminOverviewAction[]
  overviewSections: AdminOverviewSection[]
  attention: AdminAttentionSummary
  requests: AdminRequestsSection
  siteContent: AdminSiteContentSection
  bookings: AdminBookingsSection
  services: AdminServicesSection
  products: AdminProductsSection
  users: AdminUsersSection
  barbers: AdminBarbersSection
  barberApplications: {
    items: AdminBarberApplicationRow[]
    errorMessage?: string
  }
  contactMessages: ContactMessageSummary[]
}
