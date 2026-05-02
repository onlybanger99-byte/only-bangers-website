import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { listBarberApplicationsForAdmin } from '@/lib/barber-applications/service'
import { listBarberServicePricesForOwner } from '@/lib/barber-service-prices/service'
import { listPublicServicePriceSummaries } from '@/lib/barber-service-prices/service'
import type { BarberApplicationSummary } from '@/lib/barber-applications/types'
import { getCustomerProfile, getCustomerProfilesByUserIds } from '@/lib/customer-profiles/service'
import { normalizeRole } from '@/lib/auth/roles'
import type { BookingStatus, PaymentStatus } from '@/lib/bookings/types'
import { formatDate, formatDateTime } from '@/lib/date-time'
import { getSafeImage } from '@/lib/safe-image'
import type {
  AdminBarberRow,
  AdminBarberApplicationRow,
  AdminBarbersSection,
  AdminBookingRow,
  AdminBookingsSection,
  AdminDashboardViewModel,
  AdminMetric,
  AdminProfileSummary,
  AdminServiceRow,
  AdminServicesSection,
  AdminUserRow,
  AdminUsersSection,
} from './types'
import { getFallbackServices, listAllServices } from '@/lib/services/service'

type AdminDashboardParams = {
  userId: string
  email: string
  bookingQuery?: string
  bookingStatus?: string
  bookingSort?: 'starts_at' | 'created_at' | 'status'
  bookingDirection?: 'asc' | 'desc'
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function resolveFirstText(row: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = normalizeText(row[key])

    if (value) {
      return value
    }
  }

  return ''
}

function toCurrency(amount: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function parseBookingStatus(value?: string): BookingStatus | null {
  switch (value) {
    case 'pending_payment':
    case 'confirmed':
    case 'completed':
    case 'cancelled':
    case 'expired':
      return value
    default:
      return null
  }
}

function parsePaymentStatus(value?: string): PaymentStatus {
  switch (value) {
    case 'paid':
    case 'cancelled':
    case 'refunded':
    case 'pending_verification':
    case 'failed':
      return value
    case 'unpaid':
    default:
      return 'unpaid'
  }
}

function normalizeAdminBookingStatus(
  status: BookingStatus | null,
  pendingExpiresAt?: string | null
): BookingStatus {
  if (status === 'pending_payment' && pendingExpiresAt) {
    const expiresAt = new Date(pendingExpiresAt)

    if (!Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() <= Date.now()) {
      return 'expired'
    }
  }

  return status ?? 'pending_payment'
}

async function countTable(table: string, apply?: (query: any) => any) {
  const supabase = await createClient()
  let query = supabase.from(table).select('*', { count: 'exact', head: true })

  if (apply) {
    query = apply(query)
  }

  const { count, error } = await query
  return { count: count ?? 0, error }
}

async function loadAuthUsersByIds(userIds: string[]) {
  const adminClient = createAdminClient()
  const byId = new Map<
    string,
    {
      email: string
      createdAt: string | undefined
      bannedUntil: string | null | undefined
    }
  >()

  if (!adminClient || userIds.length === 0) {
    return byId
  }

  await Promise.all(
    Array.from(new Set(userIds)).map(async (userId) => {
      const { data, error } = await adminClient.auth.admin.getUserById(userId)

      if (error || !data.user) {
        return
      }

      byId.set(userId, {
        email: data.user.email ?? '',
        createdAt: data.user.created_at,
        bannedUntil: data.user.banned_until,
      })
    })
  )

  return byId
}

async function getUserIdsForRoles() {
  const privilegedSupabase = createAdminClient()
  const supabase = privilegedSupabase ?? (await createClient())
  const { data, error } = await supabase.from('user_roles').select('user_id, role')

  if (error) {
    return {
      customers: [] as string[],
      barbers: [] as string[],
      admins: [] as string[],
      error,
    }
  }

  const rows = (data ?? []) as Array<{ user_id: string | null; role: string | null }>

  return {
    customers: Array.from(
      new Set(
        rows
          .filter((row) => normalizeRole(row.role) === 'customer')
          .map((row) => row.user_id)
          .filter((value): value is string => typeof value === 'string' && value.length > 0)
      )
    ),
    barbers: Array.from(
      new Set(
        rows
          .filter((row) => normalizeRole(row.role) === 'barber')
          .map((row) => row.user_id)
          .filter((value): value is string => typeof value === 'string' && value.length > 0)
      )
    ),
    admins: Array.from(
      new Set(
        rows
          .filter((row) => normalizeRole(row.role) === 'admin')
          .map((row) => row.user_id)
          .filter((value): value is string => typeof value === 'string' && value.length > 0)
      )
    ),
    error: null as null,
  }
}

async function mapBookingRows(rows: Array<Record<string, unknown>>): Promise<AdminBookingRow[]> {
  const userIds = rows
    .map((row) => (typeof row.user_id === 'string' ? row.user_id : ''))
    .filter(Boolean)
  const profiles = await getCustomerProfilesByUserIds(userIds)
  const authUsers = await loadAuthUsersByIds(userIds)

  return rows
    .map((row) => {
      const userId = typeof row.user_id === 'string' ? row.user_id : ''
      const bookingId =
        typeof row.id === 'string' || typeof row.id === 'number' ? String(row.id) : ''
      const profile = profiles.get(userId)

      return {
        id: bookingId,
        customerName: profile?.fullName ?? 'Profile incomplete',
        customerEmail: authUsers.get(userId)?.email ?? 'Email unavailable',
        customerPhone: profile?.phoneNumber ?? 'Phone unavailable',
        serviceName:
          resolveFirstText(row, 'service_name', 'service', 'service_title') || 'Service not specified',
        barberName:
          resolveFirstText(row, 'barber_name', 'barber_display_name') || 'Barber not assigned',
        startsAtLabel: formatDateTime(typeof row.starts_at === 'string' ? row.starts_at : null),
        createdAtLabel: formatDateTime(typeof row.created_at === 'string' ? row.created_at : null),
        status: normalizeAdminBookingStatus(
          parseBookingStatus(typeof row.status === 'string' ? row.status : undefined),
          typeof row.pending_expires_at === 'string' ? row.pending_expires_at : null
        ),
        paymentStatus: parsePaymentStatus(
          typeof row.payment_status === 'string' ? row.payment_status : undefined
        ),
        amountDueLabel: toCurrency(typeof row.amount_due === 'number' ? row.amount_due : 0),
        paymentReference:
          (typeof row.payment_reference === 'string' && row.payment_reference) || 'Not assigned',
        pendingExpiresAtLabel:
          typeof row.pending_expires_at === 'string'
            ? formatDateTime(row.pending_expires_at)
            : 'Not set',
      } satisfies AdminBookingRow
    })
    .filter((row) => row.id.length > 0)
}

async function getMetrics(barberProfileGapCount: number): Promise<AdminMetric[]> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)

  const [todayBookings, pendingPayments, confirmedBookings, activeBarbers] = await Promise.all([
    countTable('bookings', (query) =>
      query.gte('starts_at', todayStart.toISOString()).lt('starts_at', tomorrowStart.toISOString())
    ),
    countTable('bookings', (query) => query.eq('status', 'pending_payment')),
    countTable('bookings', (query) => query.eq('status', 'confirmed')),
    countTable('barber_profiles', (query) => query.eq('is_active', true)),
  ])

  return [
    {
      id: 'today-bookings',
      label: "Today's bookings",
      value: String(todayBookings.count),
      detail: 'All bookings scheduled for today.',
      tone: 'gold',
    },
    {
      id: 'pending-payments',
      label: 'Pending payments',
      value: String(pendingPayments.count),
      detail: 'Bookings waiting for admin confirmation.',
      tone: 'rose',
    },
    {
      id: 'confirmed-bookings',
      label: 'Confirmed bookings',
      value: String(confirmedBookings.count),
      detail: 'Bookings ready for barber operations.',
      tone: 'emerald',
    },
    {
      id: 'active-barbers',
      label: 'Active barbers',
      value: String(activeBarbers.count),
      detail:
        barberProfileGapCount > 0
          ? `${barberProfileGapCount} barber profile${barberProfileGapCount === 1 ? '' : 's'} still need attention.`
          : 'All active barber profiles look ready.',
      tone: 'blue',
    },
  ]
}

async function getBookingsSection(params: AdminDashboardParams): Promise<AdminBookingsSection> {
  const supabase = await createClient()
  const queryText = params.bookingQuery?.trim().toLowerCase() ?? ''
  const status = params.bookingStatus?.trim() ?? ''
  const sort = params.bookingSort ?? 'starts_at'
  const direction = params.bookingDirection === 'asc' ? 'asc' : 'desc'

  let query = supabase.from('bookings').select('*').order(sort, { ascending: direction === 'asc' })
  const parsedStatus = parseBookingStatus(status)

  if (parsedStatus === 'expired') {
    query = query.eq('status', 'pending_payment').lte('pending_expires_at', new Date().toISOString())
  } else if (parsedStatus) {
    query = query.eq('status', parsedStatus)
  }

  const { data, error } = await query.limit(200)

  if (error) {
    console.error('[admin-dashboard] Failed to load bookings section', error)
    return {
      items: [],
      totalCount: 0,
      errorMessage: 'We could not load live bookings for the admin console.',
    }
  }

  const items = await mapBookingRows((data ?? []) as Array<Record<string, unknown>>)
  const filtered = queryText
    ? items.filter((row) => {
        return (
          row.customerName.toLowerCase().includes(queryText) ||
          row.customerEmail.toLowerCase().includes(queryText) ||
          row.customerPhone.toLowerCase().includes(queryText) ||
          row.serviceName.toLowerCase().includes(queryText) ||
          row.barberName.toLowerCase().includes(queryText)
        )
      })
    : items

  return {
    items: filtered,
    totalCount: filtered.length,
  }
}

async function getUsersSection(barberRows: AdminBarberRow[]): Promise<AdminUsersSection> {
  const roles = await getUserIdsForRoles()

  if (roles.error) {
    console.error('[admin-dashboard] Failed to load user roles', roles.error)
    return {
      customers: [],
      barbers: [],
      admins: [],
      enabled: false,
      errorMessage: 'We could not load role assignments from Supabase.',
    }
  }

  const [customerProfiles, authUsers] = await Promise.all([
    getCustomerProfilesByUserIds(roles.customers),
    loadAuthUsersByIds([...roles.customers, ...roles.barbers, ...roles.admins]),
  ])

  const customers = roles.customers.map((userId) => {
    const profile = customerProfiles.get(userId)
    const authUser = authUsers.get(userId)
    const isSuspended = Boolean(authUser?.bannedUntil && new Date(authUser.bannedUntil) > new Date())

    return {
      id: userId,
      fullName: profile?.fullName ?? 'Profile incomplete',
      email: authUser?.email ?? 'Email unavailable',
      phoneNumber: profile?.phoneNumber ?? 'Phone unavailable',
      profileImageUrl: profile?.profileImageUrl ?? '/images/header-bg.png',
      role: 'customer',
      accountStatus: isSuspended ? 'suspended' : profile?.isComplete ? 'active' : 'pending',
      createdAtLabel: formatDate(authUser?.createdAt),
      profileComplete: profile?.isComplete ?? false,
      editable: true,
    } satisfies AdminUserRow
  })

  const barbers = roles.barbers.map((userId) => {
    const row = barberRows.find((item) => item.id === userId)
    const authUser = authUsers.get(userId)

    return {
      id: userId,
      fullName: row?.displayName ?? 'Barber profile missing',
      email: authUser?.email ?? 'Email unavailable',
      phoneNumber: 'Managed in barber profile',
      profileImageUrl: row?.profileImageUrl ?? '/images/header-bg.png',
      role: 'barber',
      accountStatus:
        row?.activeStatus === 'inactive'
          ? 'pending'
          : row?.activeStatus ?? 'pending',
      createdAtLabel: formatDate(authUser?.createdAt),
      profileComplete: row?.profileComplete ?? false,
      editable: true,
    } satisfies AdminUserRow
  })

  const admins = roles.admins.map((userId) => {
    const authUser = authUsers.get(userId)
    const isSuspended = Boolean(authUser?.bannedUntil && new Date(authUser.bannedUntil) > new Date())

    return {
      id: userId,
      fullName: authUser?.email?.split('@')[0] ?? 'Admin user',
      email: authUser?.email ?? 'Email unavailable',
      phoneNumber: 'Not shared',
      profileImageUrl: '/images/header-bg.png',
      role: 'admin',
      accountStatus: isSuspended ? 'suspended' : 'active',
      createdAtLabel: formatDate(authUser?.createdAt),
      profileComplete: true,
      editable: true,
    } satisfies AdminUserRow
  })

  return {
    customers,
    barbers,
    admins,
    enabled: true,
  }
}

async function getCurrentAdminProfile(params: {
  userId: string
  email: string
}): Promise<AdminProfileSummary> {
  const profile = await getCustomerProfile(params.userId)
  const fallbackFirstName =
    params.email
      .split('@')[0]
      ?.replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (character) => character.toUpperCase()) ?? 'Admin'

  return {
    userId: params.userId,
    email: params.email,
    fullName: profile?.fullName || fallbackFirstName,
    firstName: profile?.firstName || fallbackFirstName,
    lastName: profile?.lastName || '',
    phoneNumber: profile?.phoneNumber || '',
    profileImageUrl: profile?.profileImageUrl || '/images/header-bg.png',
    profileComplete: profile?.isComplete ?? false,
  }
}

async function getServicesSection(): Promise<AdminServicesSection> {
  const [servicesResult, pricingSummaryResult] = await Promise.all([
    listAllServices(),
    listPublicServicePriceSummaries(),
  ])

  if (!servicesResult.ok) {
    return {
      items: [],
      errorMessage: servicesResult.message,
    }
  }

  const summaries = pricingSummaryResult.ok ? pricingSummaryResult.data : []
  const summaryMap = new Map(
    summaries
      .filter((item) => typeof item.serviceId === 'string')
      .map((item) => [item.serviceId as string, item])
  )

  const services = (servicesResult.data.length > 0 ? servicesResult.data : getFallbackServices()).map(
    (service) => {
      const summary = summaryMap.get(service.id)
      return {
        id: service.id,
        name: service.name,
        slug: service.slug,
        description: service.description,
        duration: service.duration,
        sortOrder: service.sortOrder,
        isActive: service.isActive,
        barberCount: summary?.barberCount ?? 0,
        minPriceLabel:
          summary?.minPrice != null
            ? toCurrency(summary.minPrice)
            : 'No active barber pricing yet',
      } satisfies AdminServiceRow
    }
  )

  return {
    items: services,
    errorMessage: pricingSummaryResult.ok ? undefined : pricingSummaryResult.message,
  }
}

async function getBarbersSection(): Promise<AdminBarbersSection> {
  const roles = await getUserIdsForRoles()

  if (roles.error) {
    console.error('[admin-dashboard] Failed to load barber roles', roles.error)
    return {
      items: [],
      totalCount: 0,
      enabled: false,
      errorMessage: 'We could not load barber role assignments from Supabase.',
    }
  }

  const privilegedSupabase = createAdminClient()
  const supabase = privilegedSupabase ?? (await createClient())
  const [profileResponse, authUsers, bookingResponse] = await Promise.all([
    supabase.from('barber_profiles').select('*').in('user_id', roles.barbers),
    loadAuthUsersByIds(roles.barbers),
    supabase.from('bookings').select('barber_id, status, starts_at').in('barber_id', roles.barbers),
  ])

  if (profileResponse.error && profileResponse.error.code !== '42P01' && profileResponse.error.code !== 'PGRST116') {
    console.error('[admin-dashboard] Failed to load barber profiles', profileResponse.error)
  }

  const profileMap = new Map(
    ((profileResponse.data ?? []) as Array<Record<string, unknown>>)
      .filter((row) => typeof row.user_id === 'string' && row.user_id.length > 0)
      .map((row) => [row.user_id as string, row])
  )

  const bookingMap = new Map<string, { total: number; upcoming: number; completed: number }>()

  for (const row of (bookingResponse.data ?? []) as Array<{
    barber_id: string | null
    status: BookingStatus | null
    starts_at: string | null
  }>) {
    if (!row.barber_id) {
      continue
    }

    const current = bookingMap.get(row.barber_id) ?? { total: 0, upcoming: 0, completed: 0 }
    current.total += 1

    if (row.status === 'completed') {
      current.completed += 1
    }

    if (row.starts_at && new Date(row.starts_at) >= new Date() && row.status !== 'cancelled') {
      current.upcoming += 1
    }

    bookingMap.set(row.barber_id, current)
  }

  const items = roles.barbers
    .map(async (userId) => {
      const profile = profileMap.get(userId)
      const authUser = authUsers.get(userId)
      const stats = bookingMap.get(userId) ?? { total: 0, upcoming: 0, completed: 0 }
      const servicePricesResult = await listBarberServicePricesForOwner(userId)
      const fallbackName =
        authUser?.email
          ?.split('@')[0]
          ?.replace(/[._-]+/g, ' ')
          .replace(/\b\w/g, (character) => character.toUpperCase()) || 'Unnamed barber'
      const displayName = resolveFirstText(profile ?? {}, 'display_name', 'name', 'full_name') || fallbackName
      const profileImageUrl = getSafeImage(
        resolveFirstText(profile ?? {}, 'profile_image_url', 'profile_photo_url', 'avatar_url') ||
          null
      )
      const specialty = resolveFirstText(profile ?? {}, 'specialty') || 'Specialty not set'
      const setupStatus = resolveFirstText(profile ?? {}, 'setup_status') || 'draft'
      const isLive = typeof profile?.is_live === 'boolean' ? profile.is_live : false
      const location = resolveFirstText(profile ?? {}, 'location') || resolveFirstText(profile ?? {}, 'cutting_location') || ''

      return {
        id: userId,
        slug: resolveFirstText(profile ?? {}, 'slug') || null,
        displayName,
        fullName: resolveFirstText(profile ?? {}, 'full_name') || null,
        specialty,
        profileImageUrl,
        bio: resolveFirstText(profile ?? {}, 'bio') || 'Bio not set',
        location,
        cuttingLocation: resolveFirstText(profile ?? {}, 'cutting_location') || '',
        mapUrl: resolveFirstText(profile ?? {}, 'map_url') || null,
        instagramUrl: resolveFirstText(profile ?? {}, 'instagram_url') || null,
        tiktokUrl: resolveFirstText(profile ?? {}, 'tiktok_url') || null,
        facebookUrl: resolveFirstText(profile ?? {}, 'facebook_url') || null,
        portfolioUrl: resolveFirstText(profile ?? {}, 'portfolio_url') || null,
        activeStatus:
          profile && typeof profile.is_active === 'boolean'
            ? (profile.is_active === false ? 'inactive' : 'active')
            : 'inactive',
        isLive,
        setupStatus,
        goLiveRequestedAt: resolveFirstText(profile ?? {}, 'go_live_requested_at') || null,
        goLiveReviewedAt: resolveFirstText(profile ?? {}, 'go_live_reviewed_at') || null,
        goLiveRejectionReason: resolveFirstText(profile ?? {}, 'go_live_rejection_reason') || null,
        profileComplete: Boolean(
          displayName &&
            specialty &&
            resolveFirstText(profile ?? {}, 'bio') &&
            location &&
            resolveFirstText(profile ?? {}, 'slug')
        ),
        totalBookings: stats.total,
        upcomingBookings: stats.upcoming,
        completedBookings: stats.completed,
        servicePrices: servicePricesResult.ok ? servicePricesResult.data : [],
      } satisfies AdminBarberRow
    })
  const resolvedItems = await Promise.all(items)

  return {
    items: resolvedItems.sort((left, right) => left.displayName.localeCompare(right.displayName)),
    totalCount: resolvedItems.length,
    enabled: true,
  }
}

async function mapBarberApplicationRows(
  rows: BarberApplicationSummary[]
): Promise<AdminBarberApplicationRow[]> {
  const authUsers = await loadAuthUsersByIds(rows.map((row) => row.userId))

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    applicantName: row.displayName || 'Applicant name missing',
    applicantEmail: authUsers.get(row.userId)?.email ?? 'Email unavailable',
    applicantPhone: row.phone || 'Phone unavailable',
    cuttingLocation: row.cuttingLocation,
    instagramUrl: row.instagramUrl,
    tiktokUrl: row.tiktokUrl,
    facebookUrl: row.facebookUrl,
    portfolioUrl: row.portfolioUrl,
    bio: row.bio || 'No barber bio supplied.',
    availabilitySlots: row.availabilitySlots,
    submittedAtLabel: formatDateTime(row.createdAt),
    status: row.status,
    rejectionReason: row.rejectionReason,
  }))
}

export async function getAdminDashboardViewModel(
  params: AdminDashboardParams
): Promise<AdminDashboardViewModel> {
  const barberApplicationsResult = await listBarberApplicationsForAdmin()
  const barbers = await getBarbersSection()
  const [bookings, services, users, customerProfilesCount, metricsBase, currentAdmin] = await Promise.all([
    getBookingsSection(params),
    getServicesSection(),
    getUsersSection(barbers.items),
    countTable('customer_profiles'),
    Promise.resolve(barbers.items.filter((item) => !item.profileComplete).length),
    getCurrentAdminProfile({
      userId: params.userId,
      email: params.email,
    }),
  ])

  const metrics = await getMetrics(metricsBase)
  const pendingPayments = bookings.items.filter(
    (booking) => booking.status === 'pending_payment' || booking.paymentStatus === 'unpaid'
  )
  const problemBookings = bookings.items.filter(
    (booking) =>
      booking.status === 'cancelled' ||
      booking.status === 'expired' ||
      booking.paymentStatus === 'failed' ||
      booking.paymentStatus === 'cancelled'
  )
  const customerProfileGaps = Math.max(
    0,
    users.customers.filter((user) => !user.profileComplete).length
  )
  const barberApplications = barberApplicationsResult.ok
    ? await mapBarberApplicationRows(barberApplicationsResult.data)
    : []
  const pendingBarberApplications = barberApplications.filter(
    (application) => application.status === 'pending'
  ).length
  const pendingGoLiveRequests = barbers.items.filter((item) => item.setupStatus === 'pending_review' && !item.isLive).length
  const incompleteBarbers = barbers.items.filter((item) => !item.profileComplete || item.setupStatus === 'draft').length

  return {
    headerMessage:
      'Start with the actions that unblock bookings, barber approvals, and service pricing first.',
    currentAdmin,
    metrics,
    attention: {
      pendingPayments,
      problemBookings,
      customerProfileGaps:
        customerProfilesCount.error ? customerProfileGaps : customerProfileGaps,
      barberProfileGaps: metricsBase,
      pendingBarberApplications,
      pendingGoLiveRequests,
      incompleteBarbers,
    },
    bookings,
    services,
    users,
    barbers,
    barberApplications: {
      items: barberApplications,
      errorMessage: barberApplicationsResult.ok ? undefined : barberApplicationsResult.message,
    },
  }
}
