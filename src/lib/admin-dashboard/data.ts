import { createClient } from '@/lib/supabase/server'
import {
  formatBookingBarberName,
  formatBookingCustomerContact,
  formatBookingCustomerName,
} from '@/lib/bookings/display'
import { countBookings, listBookings } from '@/lib/bookings/service'
import { createMockAdminDashboardData } from './mock-data'
import type {
  AdminDashboardViewModel,
  ApprovalStatus,
  BookingStatus,
  DashboardBooking,
  DashboardContentItem,
  DashboardCustomerInsight,
  DashboardHealthItem,
  DashboardOverviewCard,
  DashboardRevenuePanel,
  SectionSource,
} from './types'

type QueryState<T> = {
  source: SectionSource
  data: T
  failed: boolean
}

type RawTransactionRecord = {
  id: string | number
  customer_email?: string | null
  amount?: number | null
  status?: string | null
  processed_at?: string | null
}

type RawContentRecord = {
  id: string | number
  title?: string | null
  creator_name?: string | null
  submitted_at?: string | null
  status?: string | null
  content_type?: string | null
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDateLabel(value: string) {
  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return 'Schedule pending'
  }

  return new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

function formatRelativeVisit(value: string) {
  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return 'Visit date pending'
  }

  const differenceInDays = Math.max(
    0,
    Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24))
  )

  if (differenceInDays === 0) {
    return 'Last visit today'
  }

  if (differenceInDays === 1) {
    return 'Last visit 1 day ago'
  }

  return `Last visit ${differenceInDays} days ago`
}

function toTitleCase(value: string) {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function normalizeBookingStatus(status?: string | null): BookingStatus {
  switch (status) {
    case 'confirmed':
    case 'pending':
    case 'scheduled':
    case 'arrived':
    case 'in_progress':
    case 'completed':
    case 'cancelled':
      return status
    default:
      return 'confirmed'
  }
}

function normalizeApprovalStatus(status?: string | null): ApprovalStatus {
  switch (status) {
    case 'pending':
    case 'in_review':
    case 'approved':
    case 'changes_requested':
      return status
    default:
      return 'pending'
  }
}

function isMissingRelationError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false
  }

  return (
    error.code === '42P01' ||
    error.code === 'PGRST116' ||
    error.code === 'PGRST205' ||
    error.message?.toLowerCase().includes('relation') === true
  )
}

function resolveReadiness(sources: SectionSource[]): AdminDashboardViewModel['readiness'] {
  const liveCount = sources.filter((source) => source === 'live').length

  if (liveCount === 0) {
    return 'mock'
  }

  if (liveCount === sources.length) {
    return 'live'
  }

  return 'hybrid'
}

async function getUpcomingBookings(): Promise<QueryState<DashboardBooking[]>> {
  const result = await listBookings({
    startsAtFrom: new Date().toISOString(),
    ascending: true,
    limit: 6,
  })

  if (!result.ok) {
    return {
      source: 'mock',
      data: [],
      failed: result.code !== 'TABLE_MISSING',
    }
  }

  return {
    source: 'live',
    failed: false,
    data: result.data.map((row) => ({
      id: row.id,
      customerName: formatBookingCustomerName(row.user_id),
      customerEmail: formatBookingCustomerContact(row.user_id),
      serviceType: row.service_name,
      barberAssigned: formatBookingBarberName(row.barber_id),
      startsAt: row.starts_at,
      startsAtLabel: formatDateLabel(row.starts_at),
      status: normalizeBookingStatus(row.status),
    })),
  }
}

async function getTodayBookingsCount(): Promise<QueryState<number>> {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const result = await countBookings({
    startsAtFrom: start.toISOString(),
    startsAtTo: end.toISOString(),
  })

  if (!result.ok) {
    return { source: 'mock', data: 0, failed: result.code !== 'TABLE_MISSING' }
  }

  return { source: 'live', data: result.data, failed: false }
}

async function getCustomerInsights(): Promise<QueryState<DashboardCustomerInsight[]>> {
  const lastThirtyDays = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
  const result = await listBookings({
    startsAtFrom: lastThirtyDays.toISOString(),
    limit: 50,
  })

  if (!result.ok) {
    return { source: 'mock', data: [], failed: result.code !== 'TABLE_MISSING' }
  }

  const byCustomer = new Map<
    string,
    {
      userId: string
      email: string
      visits: number
      lastVisit: string
    }
  >()

  result.data.forEach((row) => {
    const email = formatBookingCustomerContact(row.user_id)
    const lastVisit = row.starts_at
    const current = byCustomer.get(row.user_id)

    if (!current) {
      byCustomer.set(row.user_id, { userId: row.user_id, email, visits: 1, lastVisit })
      return
    }

    current.visits += 1

    if (lastVisit && lastVisit > current.lastVisit) {
      current.lastVisit = lastVisit
    }
  })

  return {
    source: 'live',
    failed: false,
    data: Array.from(byCustomer.values())
      .slice(0, 5)
      .map((customer, index) => ({
        id: `${customer.email}-${index}`,
        customerName: formatBookingCustomerName(customer.userId),
        email: customer.email,
        joinedLabel: 'Active in the last 30 days',
        lastVisitLabel: formatRelativeVisit(customer.lastVisit),
        repeatVisitLabel:
          customer.visits > 1
            ? `${customer.visits} visits in the last 30 days`
            : '1 recent visit in the last 30 days',
        loyaltyTier:
          customer.visits >= 5
            ? 'Gold Member'
            : customer.visits >= 3
              ? 'Committed Plan'
              : 'Emerging Client',
      })),
  }
}

async function getRevenuePanel(): Promise<QueryState<DashboardRevenuePanel>> {
  const supabase = await createClient()
  const now = new Date()
  const previousWeekStart = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 14)
  const currentWeekStart = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7)

  const { data, error } = await supabase
    .from('transactions')
    .select('id, customer_email, amount, status, processed_at')
    .gte('processed_at', previousWeekStart.toISOString())
    .order('processed_at', { ascending: false })
    .limit(12)

  if (error) {
    return {
      source: 'mock',
      failed: !isMissingRelationError(error),
      data: createMockAdminDashboardData().revenue,
    }
  }

  const rows = (data ?? []) as RawTransactionRecord[]
  const currentWeekRows = rows.filter((row) => {
    const processedAt = row.processed_at ? new Date(row.processed_at).getTime() : 0
    return processedAt >= currentWeekStart.getTime()
  })
  const previousWeekRows = rows.filter((row) => {
    const processedAt = row.processed_at ? new Date(row.processed_at).getTime() : 0
    return (
      processedAt >= previousWeekStart.getTime() &&
      processedAt < currentWeekStart.getTime()
    )
  })

  const currentTotal = currentWeekRows.reduce((sum, row) => sum + (row.amount ?? 0), 0)
  const previousTotal = previousWeekRows.reduce((sum, row) => sum + (row.amount ?? 0), 0)
  const averageOrderValue =
    currentWeekRows.length > 0 ? currentTotal / currentWeekRows.length : 0

  const trendSummary =
    previousTotal > 0
      ? `${currentTotal >= previousTotal ? 'Revenue is ahead' : 'Revenue is tracking below'} last week by ${formatCurrency(Math.abs(currentTotal - previousTotal))}.`
      : 'Revenue tracking has started for the current weekly window.'

  return {
    source: 'live',
    failed: false,
    data: {
      source: 'live',
      weeklyRevenue: formatCurrency(currentTotal),
      averageOrderValue: formatCurrency(averageOrderValue),
      trendSummary,
      recentTransactions: rows.slice(0, 4).map((row) => ({
        id: String(row.id),
        customerName: row.customer_email
          ? row.customer_email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
          : 'Only Bangers Client',
        amountLabel: formatCurrency(row.amount ?? 0),
        statusLabel: toTitleCase(row.status ?? 'captured'),
        processedAtLabel: formatDateLabel(row.processed_at ?? ''),
      })),
    },
  }
}

async function getContentQueue(): Promise<QueryState<DashboardContentItem[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('content_items')
    .select('id, title, creator_name, submitted_at, status, content_type')
    .in('status', ['pending', 'in_review', 'changes_requested'])
    .order('submitted_at', { ascending: false })
    .limit(5)

  if (error) {
    return { source: 'mock', data: [], failed: !isMissingRelationError(error) }
  }

  const rows = (data ?? []) as RawContentRecord[]

  return {
    source: 'live',
    failed: false,
    data: rows.map((row) => ({
      id: String(row.id),
      title: row.title ?? 'Untitled asset',
      creatorName: row.creator_name ?? 'Only Bangers Team',
      submittedLabel: row.submitted_at
        ? `Submitted ${formatDateLabel(row.submitted_at)}`
        : 'Submission time pending',
      approvalState: normalizeApprovalStatus(row.status),
      contentType: row.content_type ?? 'Content Item',
    })),
  }
}

async function getEmailHealth(): Promise<QueryState<number>> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('email_subscribers')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)

  if (error) {
    return { source: 'mock', data: 0, failed: !isMissingRelationError(error) }
  }

  return { source: 'live', data: count ?? 0, failed: false }
}

export async function getAdminDashboardViewModel(): Promise<AdminDashboardViewModel> {
  const mock = createMockAdminDashboardData()

  const [
    upcomingBookingsResult,
    todayBookingsCountResult,
    customerInsightsResult,
    revenueResult,
    contentQueueResult,
    emailHealthResult,
  ] = await Promise.all([
    getUpcomingBookings(),
    getTodayBookingsCount(),
    getCustomerInsights(),
    getRevenuePanel(),
    getContentQueue(),
    getEmailHealth(),
  ])

  const bookings =
    upcomingBookingsResult.source === 'live'
      ? upcomingBookingsResult.data
      : mock.bookings.items

  const customers =
    customerInsightsResult.source === 'live' && customerInsightsResult.data.length > 0
      ? customerInsightsResult.data
      : mock.customers.items

  const contentItems =
    contentQueueResult.source === 'live'
      ? contentQueueResult.data
      : mock.content.items

  const overviewCards: DashboardOverviewCard[] = [
    {
      label: "Today's Bookings",
      value:
        todayBookingsCountResult.source === 'live'
          ? String(todayBookingsCountResult.data)
          : mock.overviewCards[0].value,
      detail:
        todayBookingsCountResult.source === 'live'
          ? 'Appointments scheduled from opening through close today.'
          : mock.overviewCards[0].detail,
      tone: 'gold',
      source: todayBookingsCountResult.source,
    },
    {
      label: 'Weekly Revenue',
      value:
        revenueResult.source === 'live'
          ? revenueResult.data.weeklyRevenue
          : mock.overviewCards[1].value,
      detail:
        revenueResult.source === 'live'
          ? 'Captured transaction volume across the current weekly window.'
          : mock.overviewCards[1].detail,
      tone: 'emerald',
      source: revenueResult.source,
    },
    {
      label: 'Active Customers',
      value:
        customerInsightsResult.source === 'live'
          ? String(customers.length)
          : mock.overviewCards[2].value,
      detail:
        customerInsightsResult.source === 'live'
          ? 'Recent clients identified from booking activity.'
          : mock.overviewCards[2].detail,
      tone: 'blue',
      source: customerInsightsResult.source,
    },
    {
      label: 'Awaiting Approval',
      value:
        contentQueueResult.source === 'live'
          ? String(contentItems.length)
          : mock.overviewCards[3].value,
      detail:
        contentQueueResult.source === 'live'
          ? 'Assets currently sitting in the content review flow.'
          : mock.overviewCards[3].detail,
      tone: 'rose',
      source: contentQueueResult.source,
    },
  ]

  const health: DashboardHealthItem[] = [
    {
      id: 'health-bookings',
      label: 'Bookings API',
      detail:
        upcomingBookingsResult.source === 'live'
          ? 'Upcoming appointment data is streaming from Supabase.'
          : upcomingBookingsResult.failed
            ? 'The bookings query returned an error and the dashboard is using seeded data.'
            : 'The bookings table is not connected yet, so the dashboard is using seeded data.',
      status: upcomingBookingsResult.source === 'live' ? 'healthy' : upcomingBookingsResult.failed ? 'degraded' : 'offline',
    },
    {
      id: 'health-automation',
      label: 'Automation Health',
      detail:
        contentQueueResult.source === 'live'
          ? 'Content operations are being sourced from the live moderation queue.'
          : contentQueueResult.failed
            ? 'Content review automation needs a query or policy fix.'
            : 'Content moderation tables are not online yet, so seeded queue data is displayed.',
      status: contentQueueResult.source === 'live' ? 'healthy' : contentQueueResult.failed ? 'degraded' : 'offline',
    },
    {
      id: 'health-email',
      label: 'Email Status',
      detail:
        emailHealthResult.source === 'live'
          ? `${emailHealthResult.data} active subscribers are currently addressable for campaigns.`
          : emailHealthResult.failed
            ? 'Email status could not be verified from Supabase and needs attention.'
            : 'Email monitoring is ready once the subscriber table is available to the dashboard.',
      status: emailHealthResult.source === 'live' ? 'healthy' : emailHealthResult.failed ? 'degraded' : 'offline',
    },
  ]

  const sectionSources: SectionSource[] = [
    overviewCards[0].source,
    overviewCards[1].source,
    overviewCards[2].source,
    overviewCards[3].source,
    revenueResult.source,
    upcomingBookingsResult.source,
    customerInsightsResult.source,
    contentQueueResult.source,
  ]

  const readiness = resolveReadiness(sectionSources)
  const readinessLabel =
    readiness === 'live'
      ? 'Live operations mode'
      : readiness === 'hybrid'
        ? 'Hybrid live + seeded mode'
        : 'Mock data mode'

  const headerMessage =
    readiness === 'live'
      ? 'Core admin modules are reading live data and are ready for day-to-day operations.'
      : readiness === 'hybrid'
        ? 'The dashboard is mixing live Supabase sections with seeded operational data while the remaining backend pieces come online.'
        : mock.headerMessage

  return {
    readiness,
    readinessLabel,
    headerMessage,
    overviewCards,
    bookings: {
      source: upcomingBookingsResult.source,
      items: bookings,
      emptyMessage:
        upcomingBookingsResult.source === 'live'
          ? 'No upcoming appointments are currently scheduled.'
          : mock.bookings.emptyMessage,
    },
    revenue:
      revenueResult.source === 'live'
        ? revenueResult.data
        : mock.revenue,
    customers: {
      source: customerInsightsResult.source === 'live' ? 'live' : 'mock',
      items: customers,
      emptyMessage:
        customerInsightsResult.source === 'live'
          ? 'No recent customers were found from booking activity.'
          : mock.customers.emptyMessage,
    },
    content: {
      source: contentQueueResult.source === 'live' ? 'live' : 'mock',
      items: contentItems,
      emptyMessage:
        contentQueueResult.source === 'live'
          ? 'No pending content items are waiting for review.'
          : mock.content.emptyMessage,
    },
    health,
    quickActions: mock.quickActions,
  }
}
