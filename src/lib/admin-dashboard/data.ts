import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCustomerProfilesByUserIds } from '@/lib/customer-profiles/service'
import { normalizeRole } from '@/lib/auth/roles'
import type { BookingStatus, PaymentStatus } from '@/lib/bookings/types'
import type {
  AdminBarberRow,
  AdminBarbersSection,
  AdminBookingRow,
  AdminBookingsSection,
  AdminDashboardViewModel,
  AdminFeatureStatus,
  AdminOverviewSummary,
  AdminMetric,
  AdminRevenuePanel,
  AdminUserRow,
  AdminUsersSection,
} from './types'

type AdminDashboardParams = {
  bookingQuery?: string
  bookingStatus?: string
  bookingSort?: 'starts_at' | 'created_at' | 'status'
  bookingDirection?: 'asc' | 'desc'
  bookingPage?: number
  userQuery?: string
  userPage?: number
  barberQuery?: string
  barberPage?: number
}

type CountResponse = {
  count: number | null
  error: { code?: string; message?: string } | null
}

const BOOKING_PAGE_SIZE = 12
const USER_PAGE_SIZE = 10
const BARBER_PAGE_SIZE = 10

function getPrivilegedSupabase() {
  return createAdminClient()
}

function toCurrency(amount: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatOptionalDateTime(value?: string | null) {
  if (!value) {
    return 'Not set'
  }

  return formatDateTime(value)
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return 'Not available'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return 'Not available'
  }

  return new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Not available'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return 'Not available'
  }

  return new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed)
}

function normalizePage(value: number | undefined, fallback: number) {
  if (!value || !Number.isFinite(value) || value < 1) {
    return fallback
  }

  return Math.floor(value)
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
    case 'pending_verification':
    case 'paid':
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

function getAuthListTotal(
  data: { total?: number; users?: unknown[] } | { users?: unknown[] } | null | undefined
) {
  if (!data) {
    return 0
  }

  if ('total' in data && typeof data.total === 'number') {
    return data.total
  }

  return Array.isArray(data.users) ? data.users.length : 0
}

async function countTable(
  table: string,
  apply?: (query: any) => any
): Promise<CountResponse> {
  const supabase = await createClient()
  let query = supabase.from(table).select('*', { count: 'exact', head: true })

  if (apply) {
    query = apply(query)
  }

  const { count, error } = await query
  return { count, error }
}

async function loadUserEmails(userIds: string[]) {
  const adminClient = createAdminClient()
  const byId = new Map<string, string>()

  if (!adminClient || userIds.length === 0) {
    return byId
  }

  await Promise.all(
    Array.from(new Set(userIds)).map(async (userId) => {
      const { data, error } = await adminClient.auth.admin.getUserById(userId)

      if (error || !data.user) {
        return
      }

      byId.set(userId, data.user.email ?? '')
    })
  )

  return byId
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

async function getUserIdsForRole(role: 'customer' | 'barber') {
  const privilegedSupabase = getPrivilegedSupabase()
  const supabase = privilegedSupabase ?? (await createClient())
  const { data, error } = await supabase
    .from('user_roles')
    .select('user_id, role')
    .eq('role', role)

  if (error) {
    return { ids: [] as string[], error }
  }

  const ids = Array.from(
    new Set(
      ((data ?? []) as Array<{ user_id: string | null; role: string | null }>)
        .filter((row) => normalizeRole(row.role) === role)
        .map((row) => row.user_id)
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
    )
  )

  return { ids, error: null as null }
}

async function getMetrics(): Promise<AdminMetric[]> {
  const [
    totalCustomers,
    totalBarbers,
    activeBarbers,
    totalBookings,
    upcomingBookings,
    completedBookings,
    cancelledBookings,
    incompleteCustomerProfiles,
    incompleteBarberProfiles,
  ] = await Promise.all([
    countTable('user_roles', (query) => query.eq('role', 'customer')),
    countTable('barber_profiles'),
    countTable('barber_profiles', (query) => query.eq('is_active', true)),
    countTable('bookings'),
    countTable('bookings', (query) =>
      query
        .gte('starts_at', new Date().toISOString())
        .in('status', ['pending_payment', 'confirmed'])
    ),
    countTable('bookings', (query) => query.eq('status', 'completed')),
    countTable('bookings', (query) => query.eq('status', 'cancelled')),
    countTable('customer_profiles', (query) =>
      query.or(
        'first_name.is.null,last_name.is.null,phone_number.is.null,profile_image_url.is.null'
      )
    ),
    countTable('barber_profiles', (query) =>
      query.or('display_name.is.null,specialty.is.null,profile_photo_url.is.null')
    ),
  ])

  return [
    {
      id: 'total-customers',
      label: 'Total Customers',
      value: String(totalCustomers.count ?? 0),
      detail: 'Customer accounts currently assigned through RBAC.',
      tone: 'blue',
    },
    {
      id: 'total-barbers',
      label: 'Total Barbers',
      value: String(totalBarbers.count ?? 0),
      detail: `${activeBarbers.count ?? 0} currently marked active for bookings.`,
      tone: 'gold',
    },
    {
      id: 'total-bookings',
      label: 'Total Bookings',
      value: String(totalBookings.count ?? 0),
      detail: 'All bookings currently stored in the live platform.',
      tone: 'emerald',
    },
    {
      id: 'upcoming-bookings',
      label: 'Upcoming Bookings',
      value: String(upcomingBookings.count ?? 0),
      detail: 'Bookings still in the active appointment pipeline.',
      tone: 'gold',
    },
    {
      id: 'completed-bookings',
      label: 'Completed',
      value: String(completedBookings.count ?? 0),
      detail: 'Bookings marked completed.',
      tone: 'emerald',
    },
    {
      id: 'cancelled-bookings',
      label: 'Cancelled',
      value: String(cancelledBookings.count ?? 0),
      detail: 'Bookings cancelled by staff or customers.',
      tone: 'rose',
    },
    {
      id: 'customer-profile-gaps',
      label: 'Customer Profile Gaps',
      value: String(incompleteCustomerProfiles.count ?? 0),
      detail: 'Customer profiles still missing required booking details.',
      tone: (incompleteCustomerProfiles.count ?? 0) > 0 ? 'rose' : 'emerald',
    },
    {
      id: 'barber-profile-gaps',
      label: 'Barber Profile Gaps',
      value: String(incompleteBarberProfiles.count ?? 0),
      detail: 'Barber records missing profile details needed for operations.',
      tone: (incompleteBarberProfiles.count ?? 0) > 0 ? 'rose' : 'emerald',
    },
  ]
}

async function getOverviewSummary(): Promise<AdminOverviewSummary> {
  const [totalBookings, pendingPayments, confirmedBookings, completedBookings] = await Promise.all([
    countTable('bookings'),
    countTable('bookings', (query) => query.eq('status', 'pending_payment')),
    countTable('bookings', (query) => query.eq('status', 'confirmed')),
    countTable('bookings', (query) => query.eq('status', 'completed')),
  ])

  return {
    totalBookings: String(totalBookings.count ?? 0),
    pendingPayments: String(pendingPayments.count ?? 0),
    confirmedBookings: String(confirmedBookings.count ?? 0),
    completedBookings: String(completedBookings.count ?? 0),
  }
}

async function getBookingsSection(params: AdminDashboardParams): Promise<AdminBookingsSection> {
  const supabase = await createClient()
  const queryText = params.bookingQuery?.trim() ?? ''
  const status = params.bookingStatus?.trim() ?? ''
  const sort = params.bookingSort ?? 'starts_at'
  const direction = params.bookingDirection === 'asc' ? 'asc' : 'desc'
  const page = normalizePage(params.bookingPage, 1)
  let countQuery = supabase.from('bookings').select('id', { count: 'exact', head: true })
  let rowsQuery = supabase
    .from('bookings')
    .select(
      'id, user_id, barber_name, service_name, starts_at, status, payment_status, amount_due, payment_reference, pending_expires_at, created_at'
    )
    .order(sort, { ascending: direction === 'asc' })

  const parsedStatus = parseBookingStatus(status)

  if (parsedStatus) {
    if (parsedStatus === 'expired') {
      const nowIso = new Date().toISOString()
      countQuery = countQuery.eq('status', 'pending_payment').lte('pending_expires_at', nowIso)
      rowsQuery = rowsQuery.eq('status', 'pending_payment').lte('pending_expires_at', nowIso)
    } else {
      countQuery = countQuery.eq('status', parsedStatus)
      rowsQuery = rowsQuery.eq('status', parsedStatus)
    }
  }

  if (!queryText) {
    const from = (page - 1) * BOOKING_PAGE_SIZE
    const to = from + BOOKING_PAGE_SIZE - 1
    rowsQuery = rowsQuery.range(from, to)
  }

  const [{ count, error: countError }, { data, error }] = await Promise.all([
    queryText ? Promise.resolve({ count: null, error: null }) : countQuery,
    rowsQuery,
  ])

  if (countError || error) {
    console.error('[admin-dashboard] Failed to load bookings section', {
      countError,
      error,
    })

    return {
      filters: {
        query: queryText,
        status,
        sort,
        direction,
        page,
        pageSize: BOOKING_PAGE_SIZE,
      },
      items: [],
      totalCount: 0,
      totalPages: 0,
      hasResults: false,
      errorMessage: 'We could not load live bookings for the admin console.',
    }
  }

  const rows = (data ?? []) as Array<{
    id: string
    user_id: string
    barber_name: string | null
    service_name: string | null
    starts_at: string | null
    status: BookingStatus | null
    payment_status: PaymentStatus | null
    amount_due: number | null
    payment_reference: string | null
    pending_expires_at: string | null
    created_at: string | null
  }>

  const profiles = await getCustomerProfilesByUserIds(rows.map((row) => row.user_id))
  const emails = await loadUserEmails(rows.map((row) => row.user_id))

  const items: AdminBookingRow[] = rows
    .map((row) => {
      const profile = profiles.get(row.user_id)
      const normalizedStatus = normalizeAdminBookingStatus(
        parseBookingStatus(row.status ?? undefined),
        row.pending_expires_at
      )

      return {
        id: row.id,
        customerName: profile?.isComplete ? profile.fullName : 'Profile incomplete',
        customerEmail: emails.get(row.user_id) || 'Email unavailable',
        customerPhone: profile?.isComplete ? profile.phoneNumber : 'Phone unavailable',
        serviceName: row.service_name || 'Service unavailable',
        barberName: row.barber_name || 'Barber unavailable',
        startsAtLabel: formatDateTime(row.starts_at),
        createdAtLabel: formatDateTime(row.created_at),
        status: normalizedStatus,
        paymentStatus: parsePaymentStatus(row.payment_status ?? undefined),
        amountDueLabel: toCurrency(row.amount_due ?? 0),
        paymentReference: row.payment_reference || 'Not assigned',
        pendingExpiresAtLabel: formatOptionalDateTime(row.pending_expires_at),
      }
    })
    .filter((row) => {
      if (!queryText) {
        return true
      }

      const search = queryText.toLowerCase()
      return (
        row.customerName.toLowerCase().includes(search) ||
        row.customerEmail.toLowerCase().includes(search) ||
        row.customerPhone.toLowerCase().includes(search) ||
        row.serviceName.toLowerCase().includes(search) ||
        row.barberName.toLowerCase().includes(search)
      )
    })
  const pagedItems = queryText
    ? items.slice((page - 1) * BOOKING_PAGE_SIZE, page * BOOKING_PAGE_SIZE)
    : items
  const totalCount = queryText ? items.length : count ?? items.length

  return {
    filters: {
      query: queryText,
      status,
      sort,
      direction,
      page,
      pageSize: BOOKING_PAGE_SIZE,
    },
    items: pagedItems,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / BOOKING_PAGE_SIZE)),
    hasResults: pagedItems.length > 0,
  }
}

async function getUsersSection(params: AdminDashboardParams): Promise<AdminUsersSection> {
  const queryText = params.userQuery?.trim() ?? ''
  const page = normalizePage(params.userPage, 1)
  const { ids: customerIds, error: roleError } = await getUserIdsForRole('customer')

  if (roleError) {
    console.error('[admin-dashboard] Failed to load customer roles', roleError)
    return {
      filters: { query: queryText, page, pageSize: USER_PAGE_SIZE },
      items: [],
      totalCount: 0,
      totalPages: 0,
      enabled: false,
      errorMessage: 'We could not load customer role assignments from Supabase.',
    }
  }

  const idsForLookup = queryText ? customerIds : customerIds.slice((page - 1) * USER_PAGE_SIZE, page * USER_PAGE_SIZE)
  const [profiles, authUsers] = await Promise.all([
    getCustomerProfilesByUserIds(idsForLookup),
    loadAuthUsersByIds(idsForLookup),
  ])

  const baseItems: AdminUserRow[] = idsForLookup.map((userId) => {
    const profile = profiles.get(userId)
    const authUser = authUsers.get(userId)
    const isSuspended = Boolean(
      authUser?.bannedUntil && new Date(authUser.bannedUntil) > new Date()
    )

    return {
      id: userId,
      fullName: profile?.fullName ?? 'Profile incomplete',
      email: authUser?.email || 'Email unavailable',
      phoneNumber: profile?.phoneNumber ?? 'Phone unavailable',
      profileImageUrl: profile?.profileImageUrl ?? '/images/header-bg.png',
      role: 'customer',
      accountStatus: isSuspended ? 'suspended' : profile?.isComplete ? 'active' : 'pending',
      createdAtLabel: formatDate(authUser?.createdAt),
      profileComplete: profile?.isComplete ?? false,
    } satisfies AdminUserRow
  })

  const filteredItems = queryText
    ? baseItems.filter((user) => {
        const search = queryText.toLowerCase()
        return (
          user.fullName.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search) ||
          user.phoneNumber.toLowerCase().includes(search)
        )
      })
    : baseItems
  const items = queryText
    ? filteredItems.slice((page - 1) * USER_PAGE_SIZE, page * USER_PAGE_SIZE)
    : filteredItems
  const totalCount = queryText ? filteredItems.length : customerIds.length

  return {
    filters: { query: queryText, page, pageSize: USER_PAGE_SIZE },
    items,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / USER_PAGE_SIZE)),
    enabled: true,
  }
}

async function getBarbersSection(params: AdminDashboardParams): Promise<AdminBarbersSection> {
  const queryText = params.barberQuery?.trim() ?? ''
  const page = normalizePage(params.barberPage, 1)
  const { ids: barberIds, error: roleError } = await getUserIdsForRole('barber')

  if (roleError) {
    console.error('[admin-dashboard] Failed to load barber roles', roleError)
    return {
      filters: { query: queryText, page, pageSize: BARBER_PAGE_SIZE },
      items: [],
      totalCount: 0,
      totalPages: 0,
      enabled: false,
      errorMessage: 'We could not load barber role assignments from Supabase.',
    }
  }

  const privilegedSupabase = getPrivilegedSupabase()
  const supabase = privilegedSupabase ?? (await createClient())
  const [profileResponse, authUsers] = await Promise.all([
    supabase
      .from('barber_profiles')
      .select('user_id, display_name, specialty, profile_photo_url, is_active')
      .in('user_id', barberIds),
    loadAuthUsersByIds(barberIds),
  ])

  const profileError = profileResponse.error
  if (profileError && profileError.code !== '42P01' && profileError.code !== 'PGRST116') {
    console.error('[admin-dashboard] Failed to load barber profile rows', profileError)
  }

  const profileMap = new Map(
    ((profileResponse.data ?? []) as Array<{
      user_id: string
      display_name: string | null
      specialty: string | null
      profile_photo_url: string | null
      is_active: boolean | null
    }>).map((row) => [row.user_id, row])
  )

  const { data: bookingRows, error: bookingError } = await supabase
    .from('bookings')
    .select('barber_id, status, starts_at')
    .in('barber_id', barberIds)

  const bookingMap = new Map<string, { total: number; upcoming: number; completed: number }>()

  if (!bookingError) {
    for (const row of (bookingRows ?? []) as Array<{
      barber_id: string | null
      status: BookingStatus | null
      starts_at: string | null
    }>) {
      if (!row.barber_id) {
        continue
      }

      const current = bookingMap.get(row.barber_id) ?? {
        total: 0,
        upcoming: 0,
        completed: 0,
      }

      current.total += 1

      if (row.status === 'completed') {
        current.completed += 1
      }

      if (row.starts_at && new Date(row.starts_at) >= new Date() && row.status !== 'cancelled') {
        current.upcoming += 1
      }

      bookingMap.set(row.barber_id, current)
    }
  }

  const items: AdminBarberRow[] = barberIds
    .map((userId) => {
      const profile = profileMap.get(userId)
      const authUser = authUsers.get(userId)
      const stats = bookingMap.get(userId) ?? { total: 0, upcoming: 0, completed: 0 }
      const fallbackName =
        authUser?.email?.split('@')[0]?.replace(/[._-]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase()) ||
        'Unnamed barber'

      return {
        id: userId,
        displayName: profile?.display_name?.trim() || fallbackName,
        specialty: profile?.specialty?.trim() || 'Specialty not set',
        profileImageUrl: profile?.profile_photo_url?.trim() || '/images/header-bg.png',
        activeStatus: profile ? (profile.is_active === false ? 'inactive' : 'active') : 'inactive',
        profileComplete: Boolean(
          profile?.display_name?.trim() &&
            profile?.specialty?.trim() &&
            profile?.profile_photo_url?.trim()
        ),
        totalBookings: stats.total,
        upcomingBookings: stats.upcoming,
        completedBookings: stats.completed,
      } satisfies AdminBarberRow
    })
    .filter((barber) => {
      if (!queryText) {
        return true
      }

      const search = queryText.toLowerCase()
      return (
        barber.displayName.toLowerCase().includes(search) ||
        barber.specialty.toLowerCase().includes(search)
      )
    })
    .sort((left, right) => left.displayName.localeCompare(right.displayName))

  const pagedItems = items.slice((page - 1) * BARBER_PAGE_SIZE, page * BARBER_PAGE_SIZE)

  return {
    filters: { query: queryText, page, pageSize: BARBER_PAGE_SIZE },
    items: pagedItems,
    totalCount: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / BARBER_PAGE_SIZE)),
    enabled: true,
  }
}

async function getRevenuePanel(): Promise<AdminRevenuePanel> {
  const supabase = await createClient()
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - 7)

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, processed_at')
    .order('processed_at', { ascending: false })
    .limit(500)

  if (error) {
    if (isMissingRelationError(error)) {
      const fallback = await supabase
        .from('bookings')
        .select('amount_due, confirmed_at, starts_at, payment_status, status')
        .in('status', ['confirmed', 'completed'])
        .eq('payment_status', 'paid')

      if (!fallback.error) {
        const fallbackRows = (fallback.data ?? []) as Array<{
          amount_due?: number | null
          confirmed_at?: string | null
          starts_at?: string | null
        }>
        const weeklyRows = fallbackRows.filter((row) => {
          const marker = row.confirmed_at ?? row.starts_at
          const processedAt = marker ? new Date(marker) : null
          return processedAt && processedAt >= startOfWeek
        })
        const totalRevenue = fallbackRows.reduce((sum, row) => sum + (row.amount_due ?? 0), 0)
        const weeklyRevenue = weeklyRows.reduce((sum, row) => sum + (row.amount_due ?? 0), 0)
        const averageOrderValue =
          fallbackRows.length > 0 ? totalRevenue / fallbackRows.length : 0

        return {
          enabled: true,
          weeklyRevenue: toCurrency(weeklyRevenue),
          totalRevenue: toCurrency(totalRevenue),
          averageOrderValue: toCurrency(averageOrderValue),
          transactionCount: fallbackRows.length,
        }
      }
    }

    return {
      enabled: false,
      weeklyRevenue: toCurrency(0),
      totalRevenue: toCurrency(0),
      averageOrderValue: toCurrency(0),
      transactionCount: 0,
      errorMessage: isMissingRelationError(error)
        ? 'Revenue tracking is not enabled because the transactions table is not available.'
        : 'We could not load revenue data from the transactions table.',
    }
  }

  const rows = (data ?? []) as Array<{ amount?: number | null; processed_at?: string | null }>
  const weeklyRows = rows.filter((row) => {
    const processedAt = row.processed_at ? new Date(row.processed_at) : null
    return processedAt && processedAt >= startOfWeek
  })
  const totalRevenue = rows.reduce((sum, row) => sum + (row.amount ?? 0), 0)
  const weeklyRevenue = weeklyRows.reduce((sum, row) => sum + (row.amount ?? 0), 0)
  const averageOrderValue = rows.length > 0 ? totalRevenue / rows.length : 0

  return {
    enabled: true,
    weeklyRevenue: toCurrency(weeklyRevenue),
    totalRevenue: toCurrency(totalRevenue),
    averageOrderValue: toCurrency(averageOrderValue),
    transactionCount: rows.length,
  }
}

async function getFeatureStatuses(
  usersEnabled: boolean,
  revenuePanel: AdminRevenuePanel
): Promise<AdminFeatureStatus[]> {
  const supabase = await createClient()
  const [{ error: contentError }, { error: emailError }] = await Promise.all([
    supabase.from('content_items').select('id', { head: true, count: 'exact' }).limit(1),
    supabase.from('email_subscribers').select('id', { head: true, count: 'exact' }).limit(1),
  ])

  return [
    {
      id: 'feature-users',
      label: 'User directory',
      status: usersEnabled ? 'enabled' : 'not_enabled',
      detail: usersEnabled
        ? 'Admin user management is connected to Supabase Auth and customer profiles.'
        : 'User directory requires SUPABASE_SERVICE_ROLE_KEY on the server.',
    },
    {
      id: 'feature-services',
      label: 'Services management',
      status: 'not_enabled',
      detail:
        'Services are still defined in application code and do not have a production CRUD table yet, so admin editing is hidden.',
    },
    {
      id: 'feature-revenue',
      label: 'Revenue tracking',
      status: revenuePanel.enabled ? 'enabled' : 'not_enabled',
      detail: revenuePanel.enabled
        ? 'Revenue metrics are sourced from the live transactions table.'
        : revenuePanel.errorMessage || 'Revenue tracking is not enabled.',
    },
    {
      id: 'feature-content',
      label: 'Content queue',
      status: contentError
        ? isMissingRelationError(contentError)
          ? 'not_enabled'
          : 'error'
        : 'enabled',
      detail: contentError
        ? isMissingRelationError(contentError)
          ? 'Content moderation tables are not available yet, so no admin queue is shown.'
          : 'Content moderation is configured but could not be loaded.'
        : 'Content moderation records are available in the database.',
    },
    {
      id: 'feature-email',
      label: 'Email audience',
      status: emailError
        ? isMissingRelationError(emailError)
          ? 'not_enabled'
          : 'error'
        : 'enabled',
      detail: emailError
        ? isMissingRelationError(emailError)
          ? 'Email subscriber management is not enabled yet.'
          : 'Email subscriber data could not be read.'
        : 'Email subscriber records are available for operational reporting.',
    },
  ]
}

export async function getAdminDashboardViewModel(
  params: AdminDashboardParams = {}
): Promise<AdminDashboardViewModel> {
  const [metrics, overview, bookings, users, barbers, revenue] = await Promise.all([
    getMetrics(),
    getOverviewSummary(),
    getBookingsSection(params),
    getUsersSection(params),
    getBarbersSection(params),
    getRevenuePanel(),
  ])

  const featureStatuses = await getFeatureStatuses(users.enabled, revenue)
  const pendingPayments = bookings.items.filter((booking) => booking.status === 'pending_payment')

  return {
    headerMessage:
      'This admin console is running on live operational data only. Unsupported backend features are explicitly marked instead of being simulated.',
    metrics,
    overview,
    pendingPayments: {
      items: pendingPayments,
      countLabel: `${pendingPayments.length} pending payment${pendingPayments.length === 1 ? '' : 's'} on this view`,
    },
    bookings,
    users,
    barbers,
    revenue,
    featureStatuses,
  }
}
