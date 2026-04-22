import type { BookingStatus } from '@/lib/bookings/types'
export type { BookingStatus } from '@/lib/bookings/types'

export type SectionSource = 'live' | 'mock'

export type DashboardReadiness = 'live' | 'hybrid' | 'mock'

export type ApprovalStatus = 'pending' | 'in_review' | 'approved' | 'changes_requested'

export type HealthStatus = 'healthy' | 'degraded' | 'offline'

export interface DashboardOverviewCard {
  label: string
  value: string
  detail: string
  tone: 'gold' | 'emerald' | 'blue' | 'rose'
  source: SectionSource
}

export interface DashboardBooking {
  id: string
  customerName: string
  customerEmail: string
  serviceType: string
  barberAssigned: string
  startsAt: string
  startsAtLabel: string
  status: BookingStatus
}

export interface DashboardTransaction {
  id: string
  customerName: string
  amountLabel: string
  statusLabel: string
  processedAtLabel: string
}

export interface DashboardRevenuePanel {
  source: SectionSource
  weeklyRevenue: string
  averageOrderValue: string
  trendSummary: string
  recentTransactions: DashboardTransaction[]
}

export interface DashboardCustomerInsight {
  id: string
  customerName: string
  email: string
  joinedLabel: string
  lastVisitLabel: string
  repeatVisitLabel: string
  loyaltyTier: string
}

export interface DashboardContentItem {
  id: string
  title: string
  creatorName: string
  submittedLabel: string
  approvalState: ApprovalStatus
  contentType: string
}

export interface DashboardHealthItem {
  id: string
  label: string
  detail: string
  status: HealthStatus
}

export interface DashboardQuickAction {
  id: string
  title: string
  description: string
  href: string
  cta: string
}

export interface DashboardPanel<T> {
  source: SectionSource
  items: T[]
  emptyMessage: string
}

export interface AdminDashboardViewModel {
  readiness: DashboardReadiness
  readinessLabel: string
  headerMessage: string
  overviewCards: DashboardOverviewCard[]
  bookings: DashboardPanel<DashboardBooking>
  revenue: DashboardRevenuePanel
  customers: DashboardPanel<DashboardCustomerInsight>
  content: DashboardPanel<DashboardContentItem>
  health: DashboardHealthItem[]
  quickActions: DashboardQuickAction[]
}
