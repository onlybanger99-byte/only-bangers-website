import type {
  AdminDashboardViewModel,
  DashboardBooking,
  DashboardContentItem,
  DashboardCustomerInsight,
  DashboardHealthItem,
  DashboardOverviewCard,
  DashboardQuickAction,
  DashboardRevenuePanel,
} from './types'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function createMockAdminDashboardData(): AdminDashboardViewModel {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0)

  const bookings: DashboardBooking[] = [
    {
      id: 'bk-101',
      customerName: 'Siyabonga M.',
      customerEmail: 'siya@example.com',
      serviceType: 'Premium Fade + Beard',
      barberAssigned: 'Antonio Prince',
      startsAt: today.toISOString(),
      startsAtLabel: formatDateLabel(today.toISOString()),
      status: 'confirmed',
    },
    {
      id: 'bk-102',
      customerName: 'Lwazi D.',
      customerEmail: 'lwazi@example.com',
      serviceType: 'Signature Cut',
      barberAssigned: 'Neo Jacobs',
      startsAt: new Date(today.getTime() + 1000 * 60 * 90).toISOString(),
      startsAtLabel: formatDateLabel(new Date(today.getTime() + 1000 * 60 * 90).toISOString()),
      status: 'pending',
    },
    {
      id: 'bk-103',
      customerName: 'Thato P.',
      customerEmail: 'thato@example.com',
      serviceType: 'Father + Son Session',
      barberAssigned: 'Antonio Prince',
      startsAt: new Date(today.getTime() + 1000 * 60 * 180).toISOString(),
      startsAtLabel: formatDateLabel(new Date(today.getTime() + 1000 * 60 * 180).toISOString()),
      status: 'arrived',
    },
  ]

  const revenue: DashboardRevenuePanel = {
    source: 'mock',
    weeklyRevenue: formatCurrency(18450),
    averageOrderValue: formatCurrency(615),
    trendSummary: 'Revenue is pacing 14% ahead of last week, led by premium grooming bundles and repeat clients.',
    recentTransactions: [
      {
        id: 'txn-301',
        customerName: 'Aphiwe N.',
        amountLabel: formatCurrency(720),
        statusLabel: 'Captured',
        processedAtLabel: 'Today, 09:18',
      },
      {
        id: 'txn-302',
        customerName: 'Kabelo S.',
        amountLabel: formatCurrency(540),
        statusLabel: 'Captured',
        processedAtLabel: 'Today, 08:41',
      },
      {
        id: 'txn-303',
        customerName: 'Musa T.',
        amountLabel: formatCurrency(860),
        statusLabel: 'Pending Payout',
        processedAtLabel: 'Yesterday, 17:12',
      },
    ],
  }

  const customers: DashboardCustomerInsight[] = [
    {
      id: 'cust-1',
      customerName: 'Aphiwe Ndlovu',
      email: 'aphiwe@example.com',
      joinedLabel: 'Joined 11 Feb',
      lastVisitLabel: 'Last visit 4 days ago',
      repeatVisitLabel: '6 visits in the last 90 days',
      loyaltyTier: 'Gold Member',
    },
    {
      id: 'cust-2',
      customerName: 'Karabo Mokoena',
      email: 'karabo@example.com',
      joinedLabel: 'Joined 24 Jan',
      lastVisitLabel: 'Last visit today',
      repeatVisitLabel: '4 visits in the last 60 days',
      loyaltyTier: 'Committed Plan',
    },
    {
      id: 'cust-3',
      customerName: 'Lethabo Moagi',
      email: 'lethabo@example.com',
      joinedLabel: 'Joined 3 Mar',
      lastVisitLabel: 'Last visit 1 week ago',
      repeatVisitLabel: '2 visits in the last 45 days',
      loyaltyTier: 'Growth Watch',
    },
  ]

  const content: DashboardContentItem[] = [
    {
      id: 'cnt-1',
      title: 'Weekend transformation reel',
      creatorName: 'Antonio Prince',
      submittedLabel: 'Submitted 42 min ago',
      approvalState: 'pending',
      contentType: 'Instagram Reel',
    },
    {
      id: 'cnt-2',
      title: 'Skin fade tutorial cutdown',
      creatorName: 'Neo Jacobs',
      submittedLabel: 'Submitted 2 hours ago',
      approvalState: 'in_review',
      contentType: 'Promo Video',
    },
    {
      id: 'cnt-3',
      title: 'Product spotlight - texture powder',
      creatorName: 'Studio Team',
      submittedLabel: 'Submitted yesterday',
      approvalState: 'changes_requested',
      contentType: 'Campaign Asset',
    },
  ]

  const health: DashboardHealthItem[] = [
    {
      id: 'health-bookings',
      label: 'Bookings API',
      detail: 'Scheduling pipeline is responding within expected latency.',
      status: 'healthy',
    },
    {
      id: 'health-automation',
      label: 'Automation Flows',
      detail: 'One content automation job is queued for retry after asset validation.',
      status: 'degraded',
    },
    {
      id: 'health-email',
      label: 'Email Delivery',
      detail: 'Transactional email channel is available and bounce tracking is enabled.',
      status: 'healthy',
    },
  ]

  const overviewCards: DashboardOverviewCard[] = [
    {
      label: "Today's Bookings",
      value: '8',
      detail: '3 premium appointments start within the next 2 hours.',
      tone: 'gold',
      source: 'mock',
    },
    {
      label: 'Weekly Revenue',
      value: revenue.weeklyRevenue,
      detail: 'Premium bundles are the strongest driver this week.',
      tone: 'emerald',
      source: 'mock',
    },
    {
      label: 'Active Customers',
      value: '46',
      detail: 'Clients with an appointment or purchase in the last 30 days.',
      tone: 'blue',
      source: 'mock',
    },
    {
      label: 'Awaiting Approval',
      value: '5',
      detail: 'Content pieces waiting on publishing or revision decisions.',
      tone: 'rose',
      source: 'mock',
    },
  ]

  const quickActions: DashboardQuickAction[] = [
    {
      id: 'qa-bookings',
      title: 'Manage Bookings',
      description: "Review today's appointments, barber load, and service pacing.",
      href: '/services',
      cta: 'Open Schedule',
    },
    {
      id: 'qa-content',
      title: 'Review Content',
      description: 'Move video and campaign assets through approval with cleaner turnaround.',
      href: '/blogs',
      cta: 'Open Queue',
    },
    {
      id: 'qa-customers',
      title: 'View Customer List',
      description: 'Check high-value clients, repeat visit patterns, and support opportunities.',
      href: '/portal/dashboard',
      cta: 'View Customers',
    },
    {
      id: 'qa-finance',
      title: 'Finance Reporting',
      description: 'Track payment velocity, average ticket size, and weekly performance.',
      href: '/admin',
      cta: 'View Reports',
    },
  ]

  return {
    readiness: 'mock',
    readinessLabel: 'Mock data mode',
    headerMessage: 'Dashboard modules are fully wired and will automatically promote live Supabase data where matching tables and policies are available.',
    overviewCards,
    bookings: {
      source: 'mock',
      items: bookings,
      emptyMessage: 'No bookings are scheduled in the current admin view.',
    },
    revenue,
    customers: {
      source: 'mock',
      items: customers,
      emptyMessage: 'No recent customer activity is available yet.',
    },
    content: {
      source: 'mock',
      items: content,
      emptyMessage: 'There is no content waiting in the review queue.',
    },
    health,
    quickActions,
  }
}
