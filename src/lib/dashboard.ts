import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/auth/get-user-role'

export type DataSource = 'live' | 'fallback'

export interface PortalBooking {
  id: string
  serviceName: string
  startsAt: string
  status: string
  barberName: string
}

export interface PortalQuickAction {
  title: string
  description: string
  href: string
  cta: string
}

export interface PortalDashboardData {
  source: DataSource
  sourceMessage: string
  profile: {
    email: string
    firstName: string
    initials: string
    role: Exclude<UserRole, null> | 'guest'
  }
  membership: {
    tier: string
    renewalLabel: string
    perks: string[]
  }
  stats: Array<{
    label: string
    value: string
    detail: string
  }>
  upcomingBookings: PortalBooking[]
  quickActions: PortalQuickAction[]
}

export interface AdminMetric {
  label: string
  value: string
  detail: string
  source: DataSource
}

export interface AdminRoleSnapshot {
  role: string
  count: number
}

export interface AdminBookingSnapshot {
  id: string
  customerEmail: string
  serviceName: string
  startsAt: string
  status: string
}

export interface AdminDashboardData {
  sourceSummary: string
  metrics: AdminMetric[]
  roleBreakdown: AdminRoleSnapshot[]
  bookings: AdminBookingSnapshot[]
  operationalNotes: string[]
}

function getInitials(email: string) {
  const localPart = email.split('@')[0] || 'user'

  return localPart
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2) || 'OB'
}

function getFirstName(email: string) {
  const localPart = email.split('@')[0] || 'customer'
  const [firstSegment] = localPart.split(/[._-]/)

  if (!firstSegment) {
    return 'Customer'
  }

  return firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1)
}

function isMissingTableError(error: { code?: string; message?: string } | null) {
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

export async function getPortalDashboardData(input: {
  userId: string
  email: string
  role: UserRole
}): Promise<PortalDashboardData> {
  const supabase = await createClient()
  const normalizedRole = input.role ?? 'guest'

  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, service_name, starts_at, status, barber_name')
    .eq('user_id', input.userId)
    .order('starts_at', { ascending: true })
    .limit(3)

  const hasLiveBookings = !bookingsError && Array.isArray(bookings)
  const upcomingBookings: PortalBooking[] = hasLiveBookings
    ? bookings.map((booking) => ({
        id: String(booking.id),
        serviceName: booking.service_name ?? 'Appointment',
        startsAt: booking.starts_at ?? '',
        status: booking.status ?? 'scheduled',
        barberName: booking.barber_name ?? 'Only Bangers Team',
      }))
    : []

  const sourceMessage = hasLiveBookings
    ? 'Live booking data is connected from Supabase.'
    : isMissingTableError(bookingsError)
      ? 'Dashboard shell is live. Booking modules are waiting for a `bookings` table or matching view in Supabase.'
      : 'Dashboard shell is live. Booking data is temporarily unavailable, so placeholder modules are shown.'

  return {
    source: hasLiveBookings ? 'live' : 'fallback',
    sourceMessage,
    profile: {
      email: input.email,
      firstName: getFirstName(input.email),
      initials: getInitials(input.email),
      role: normalizedRole,
    },
    membership: {
      tier: normalizedRole === 'customer' ? 'Customer Access' : normalizedRole === 'guest' ? 'Starter Access' : `${normalizedRole.toUpperCase()} Access`,
      renewalLabel: 'Membership management can be connected once billing tables are available.',
      perks: [
        'Priority reminders for upcoming appointments',
        'Account-ready shell for loyalty and plan upgrades',
        'Direct links into services, products, and support',
      ],
    },
    stats: [
      {
        label: 'Upcoming Cuts',
        value: String(upcomingBookings.length),
        detail: hasLiveBookings ? 'Synced from your booking records' : 'Ready for booking table integration',
      },
      {
        label: 'Membership',
        value: normalizedRole === 'customer' ? 'Customer' : normalizedRole === 'guest' ? 'Starter' : normalizedRole.toUpperCase(),
        detail: 'Role-aware account experience',
      },
      {
        label: 'Priority Access',
        value: upcomingBookings.length > 0 ? 'Active' : 'Available',
        detail: 'Book premium slots from your dashboard',
      },
    ],
    upcomingBookings,
    quickActions: [
      {
        title: 'Book Your Next Appointment',
        description: 'Jump back into the premium services flow without leaving your dashboard.',
        href: '/services',
        cta: 'Browse Services',
      },
      {
        title: 'Refresh Your Grooming Shelf',
        description: 'Restock product essentials and keep your look consistent between visits.',
        href: '/products',
        cta: 'View Products',
      },
      {
        title: 'Speak To The Team',
        description: 'Need to reschedule or ask a question? Reach support from the same premium flow.',
        href: '/contact',
        cta: 'Contact Support',
      },
    ],
  }
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = await createClient()

  const [
    roleCountResponse,
    bookingCountResponse,
    subscriberCountResponse,
    recentBookingsResponse,
  ] = await Promise.all([
    supabase.from('user_roles').select('role', { count: 'exact' }),
    supabase.from('bookings').select('id', { count: 'exact', head: true }),
    supabase
      .from('email_subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),
    supabase
      .from('bookings')
      .select('id, customer_email, service_name, starts_at, status')
      .order('starts_at', { ascending: false })
      .limit(5),
  ])

  const roleBreakdown = !roleCountResponse.error && roleCountResponse.data
    ? Object.entries(
        roleCountResponse.data.reduce<Record<string, number>>((accumulator, row) => {
          const key = row.role ?? 'unassigned'
          accumulator[key] = (accumulator[key] ?? 0) + 1
          return accumulator
        }, {})
      ).map(([role, count]) => ({ role, count }))
    : []

  const recentBookings = !recentBookingsResponse.error && recentBookingsResponse.data
    ? recentBookingsResponse.data.map((booking) => ({
        id: String(booking.id),
        customerEmail: booking.customer_email ?? 'unknown@customer',
        serviceName: booking.service_name ?? 'Appointment',
        startsAt: booking.starts_at ?? '',
        status: booking.status ?? 'scheduled',
      }))
    : []

  const metrics: AdminMetric[] = [
    {
      label: 'Role Records',
      value: String(roleCountResponse.count ?? roleBreakdown.reduce((sum, item) => sum + item.count, 0)),
      detail: roleCountResponse.error ? 'Fallback mode: user_roles could not be counted' : 'Live count from Supabase RBAC',
      source: roleCountResponse.error ? 'fallback' : 'live',
    },
    {
      label: 'Bookings',
      value: String(bookingCountResponse.count ?? 0),
      detail: bookingCountResponse.error
        ? 'Waiting for a readable bookings table or policy'
        : 'Live appointment volume',
      source: bookingCountResponse.error ? 'fallback' : 'live',
    },
    {
      label: 'Active Subscribers',
      value: String(subscriberCountResponse.count ?? 0),
      detail: subscriberCountResponse.error
        ? 'Subscriber reporting is ready once email_subscribers is exposed to the dashboard'
        : 'Live email audience count',
      source: subscriberCountResponse.error ? 'fallback' : 'live',
    },
  ]

  const operationalNotes = [
    roleCountResponse.error
      ? 'RBAC records could not be read from `user_roles`; check policies if this should be visible to admins.'
      : 'RBAC role metrics are live and can anchor future admin permissions.',
    bookingCountResponse.error
      ? 'The dashboard expects a `bookings` table or view with admin-readable policies.'
      : 'Booking volume is connected and ready for deeper operational modules.',
    recentBookingsResponse.error && !isMissingTableError(recentBookingsResponse.error)
      ? 'Recent booking previews failed due to an access or query mismatch.'
      : 'Recent booking previews are scaffolded and can be expanded into approval and fulfillment workflows.',
  ]

  const fallbackCount = metrics.filter((metric) => metric.source === 'fallback').length
  const sourceSummary =
    fallbackCount === 0
      ? 'All admin summary modules are reading live Supabase data.'
      : `${fallbackCount} admin module${fallbackCount === 1 ? ' is' : 's are'} running in dashboard-shell mode until the corresponding tables or policies are ready.`

  return {
    sourceSummary,
    metrics,
    roleBreakdown,
    bookings: recentBookings,
    operationalNotes,
  }
}
