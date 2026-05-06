import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { listBarberApplicationsForAdmin } from '@/lib/barber-applications/service'
import { listBarberServicePricesForOwner } from '@/lib/barber-service-prices/service'
import { listPublicServicePriceSummaries } from '@/lib/barber-service-prices/service'
import { listBarberAvailabilitySlots } from '@/lib/barber-availability/service'
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
  AdminOverviewSection,
  AdminPendingActionItem,
  AdminProfileSummary,
  AdminProductRow,
  AdminProductsSection,
  AdminServiceRow,
  AdminServicesSection,
  AdminUserRow,
  AdminUsersSection,
} from './types'
import { getFallbackServices, listAllServices } from '@/lib/services/service'
import { listAllProductsForAdmin } from '@/lib/products/service'
import { getServiceMediaKey, listActiveSiteContent, listSiteContentAdmin } from '@/lib/site-content/service'
import { listPendingContactMessages } from '@/lib/contact-messages/service'

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

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

function isRecentDate(value: string | null | undefined, days = 30) {
  if (!value) {
    return false
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return false
  }

  const threshold = new Date()
  threshold.setDate(threshold.getDate() - days)

  return parsed >= threshold
}

function getSiteAssetValue(
  contentMap: Record<string, { imageUrl: string | null; value: string | null } | undefined>,
  key: string
) {
  const item = contentMap[key]
  return item?.imageUrl || item?.value || null
}

function parseBookingStatus(value?: string): BookingStatus | null {
  switch (value) {
    case 'pending_payment':
    case 'payment_pending':
    case 'awaiting_confirmation':
    case 'paid':
    case 'confirmed':
    case 'completed':
    case 'cancelled':
    case 'rejected':
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
        startsAt: typeof row.starts_at === 'string' ? row.starts_at : '',
        startsAtLabel: formatDateTime(typeof row.starts_at === 'string' ? row.starts_at : null),
        createdAt: typeof row.created_at === 'string' ? row.created_at : '',
        createdAtLabel: formatDateTime(typeof row.created_at === 'string' ? row.created_at : null),
        status: normalizeAdminBookingStatus(
          parseBookingStatus(typeof row.status === 'string' ? row.status : undefined),
          typeof row.pending_expires_at === 'string' ? row.pending_expires_at : null
        ),
        paymentStatus: parsePaymentStatus(
          typeof row.payment_status === 'string' ? row.payment_status : undefined
        ),
        amountDueValue: toNumber(row.amount_due),
        amountDueLabel: toCurrency(toNumber(row.amount_due)),
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
      displayName: profile?.fullName ?? 'Profile incomplete',
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      fullName: profile?.fullName ?? 'Profile incomplete',
      email: authUser?.email ?? 'Email unavailable',
      phoneNumber: profile?.phoneNumber ?? 'Phone unavailable',
      profileImageUrl: profile?.profileImageUrl ?? getSafeImage(null),
      role: 'customer',
      accountStatus: isSuspended ? 'suspended' : profile?.isComplete ? 'active' : 'pending',
      createdAt: authUser?.createdAt ?? null,
      createdAtLabel: formatDate(authUser?.createdAt),
      profileComplete: profile?.isComplete ?? false,
      editable: true,
    } satisfies AdminUserRow
  })

  const barbers = roles.barbers.map((userId) => {
    const row = barberRows.find((item) => item.id === userId)
    const authUser = authUsers.get(userId)
    const fullName = row?.fullName || row?.displayName || 'Barber profile missing'
    const isSuspended = row?.activeStatus === 'inactive'

    return {
      id: userId,
      displayName: row?.displayName ?? fullName,
      firstName: fullName.split(' ')[0] ?? '',
      lastName: fullName.split(' ').slice(1).join(' '),
      fullName,
      email: authUser?.email ?? 'Email unavailable',
      phoneNumber: row?.phone ?? 'Not set',
      profileImageUrl: row?.profileImageUrl ?? getSafeImage(null),
      role: 'barber',
      accountStatus: isSuspended ? 'suspended' : row?.profileComplete ? 'active' : 'pending',
      createdAt: authUser?.createdAt ?? null,
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
      displayName: authUser?.email?.split('@')[0] ?? 'Admin user',
      firstName: authUser?.email?.split('@')[0] ?? 'Admin',
      lastName: '',
      fullName: authUser?.email?.split('@')[0] ?? 'Admin user',
      email: authUser?.email ?? 'Email unavailable',
      phoneNumber: 'Not shared',
      profileImageUrl: getSafeImage(null),
      role: 'admin',
      accountStatus: isSuspended ? 'suspended' : 'active',
      createdAt: authUser?.createdAt ?? null,
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
    profileImageUrl: profile?.profileImageUrl || getSafeImage(null),
    profileComplete: profile?.isComplete ?? false,
  }
}

async function getServicesSection(): Promise<AdminServicesSection> {
  const [servicesResult, pricingSummaryResult, siteContentResult] = await Promise.all([
    listAllServices(),
    listPublicServicePriceSummaries(),
    listSiteContentAdmin(),
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

  const mediaMap = new Map(
    (siteContentResult.ok ? siteContentResult.items : [])
      .filter((item) => item.type === 'service_media')
      .map((item) => [String(item.metadata.serviceSlug ?? ''), item])
  )

  const services = (servicesResult.data.length > 0 ? servicesResult.data : getFallbackServices()).map(
    (service) => {
      const summary = summaryMap.get(service.id)
      const media = mediaMap.get(service.slug)
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
        imageUrl: service.imageUrl,
        backgroundImageUrl: service.backgroundImageUrl,
        mediaStoragePath: service.mediaStoragePath,
        mediaImageUrl: media?.imageUrl ?? null,
      } satisfies AdminServiceRow
    }
  )

  return {
    items: services,
    errorMessage: pricingSummaryResult.ok ? undefined : pricingSummaryResult.message,
  }
}

async function getProductsSection(): Promise<AdminProductsSection> {
  const productsResult = await listAllProductsForAdmin()

  if (!productsResult.ok) {
    return {
      items: [],
      errorMessage: productsResult.message,
    }
  }

  return {
    items: productsResult.data.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      priceLabel: toCurrency(product.price),
      price: product.price,
      imageUrl: product.imageUrl,
      category: product.category || 'Uncategorized',
      stockQuantity: product.stockQuantity,
      isActive: product.isActive,
    } satisfies AdminProductRow)),
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
      const [servicePricesResult, availabilityResult] = await Promise.all([
        listBarberServicePricesForOwner(userId),
        listBarberAvailabilitySlots(userId),
      ])
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
      const servicePrices = servicePricesResult.ok ? servicePricesResult.data : []
      const availabilitySlots = availabilityResult.ok ? availabilityResult.data : []
      const hasLocation = Boolean(location)
      const hasPrices = servicePrices.some((item) => item.isActive)
      const hasAvailability = availabilitySlots.length > 0
      const hasProfileImage = Boolean(
        resolveFirstText(profile ?? {}, 'profile_image_url', 'profile_photo_url', 'avatar_url')
      )
      const issueLabels = [
        hasLocation ? null : 'Missing location',
        hasPrices ? null : 'Missing prices',
        hasAvailability ? null : 'Missing availability',
        hasProfileImage ? null : 'Missing profile image',
      ].filter((value): value is string => Boolean(value))

      return {
        id: userId,
        slug: resolveFirstText(profile ?? {}, 'slug') || null,
        displayName,
        fullName: resolveFirstText(profile ?? {}, 'full_name') || null,
        phone: resolveFirstText(profile ?? {}, 'phone') || null,
        specialty,
        profileImageUrl,
        avatarUrl: resolveFirstText(profile ?? {}, 'avatar_url', 'profile_image_url') || null,
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
        hasLocation,
        hasPrices,
        hasAvailability,
        hasProfileImage,
        issueLabels,
        servicePrices,
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
  const [bookings, services, products, users, customerProfilesCount, metricsBase, currentAdmin, siteContentResult, activeSiteContentResult, contactMessagesResult] = await Promise.all([
    getBookingsSection(params),
    getServicesSection(),
    getProductsSection(),
    getUsersSection(barbers.items),
    countTable('customer_profiles'),
    Promise.resolve(barbers.items.filter((item) => !item.profileComplete).length),
    getCurrentAdminProfile({
      userId: params.userId,
      email: params.email,
    }),
    listSiteContentAdmin(),
    listActiveSiteContent(),
    listPendingContactMessages(),
  ])
  const pendingContactMessages = contactMessagesResult.ok ? contactMessagesResult.data : []

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
  const incompleteBarbers = barbers.items.filter(
    (item) => !item.profileComplete || item.setupStatus === 'draft' || item.issueLabels.length > 0
  ).length
  const siteContentGroups = siteContentResult.ok ? siteContentResult.groups : []
  const siteContentItems = siteContentResult.ok ? siteContentResult.items : []
  const activeSiteContentMap = activeSiteContentResult.ok ? activeSiteContentResult.map : {}
  const defaultBarberAvatar = getSiteAssetValue(activeSiteContentMap, 'default_barber_avatar')
  const defaultProductImage = getSiteAssetValue(activeSiteContentMap, 'default_product_image')
  const siteContentReviewCount = siteContentItems.filter((item) => {
    if (!item.isActive) {
      return true
    }

    if (item.type === 'image' || item.type === 'background' || item.type === 'logo' || item.type === 'service_media') {
      return !item.imageUrl
    }

    if (item.type === 'video') {
      return !item.videoUrl
    }

    return !item.value
  }).length
  const approvedApplications = barberApplications.filter((application) => application.status === 'approved')
  const rejectedApplications = barberApplications.filter((application) => application.status === 'rejected')
  const pendingApplications = barberApplications.filter((application) => application.status === 'pending')
  const goLiveRequests = barbers.items.filter(
    (item) => item.setupStatus === 'pending_review' && item.activeStatus === 'active' && !item.isLive
  )
  const setupIssues = barbers.items.filter(
    (item) => !item.profileComplete || item.issueLabels.length > 0 || item.setupStatus === 'draft'
  )
  const deactivatedBarbers = barbers.items.filter((item) => item.activeStatus === 'inactive')
  const missingSiteAssets = siteContentItems.filter((item) => {
    if (!item.isActive) {
      return true
    }

    if (['image', 'background', 'logo', 'service_media'].includes(item.type)) {
      return !item.imageUrl
    }

    if (item.type === 'video') {
      return !item.videoUrl
    }

    return !item.value
  })
  const normalizedBarbers = barbers.items.map((item) => ({
    ...item,
    profileImageUrl: item.profileImageUrl || getSafeImage(defaultBarberAvatar),
  }))
  const normalizedUsers = {
    ...users,
    customers: users.customers.map((item) => ({
      ...item,
      profileImageUrl: item.profileImageUrl || getSafeImage(defaultBarberAvatar),
    })),
    barbers: users.barbers.map((item) => ({
      ...item,
      profileImageUrl: item.profileImageUrl || getSafeImage(defaultBarberAvatar),
    })),
    admins: users.admins.map((item) => ({
      ...item,
      profileImageUrl: item.profileImageUrl || getSafeImage(defaultBarberAvatar),
    })),
  }
  const normalizedCurrentAdmin = {
    ...currentAdmin,
    profileImageUrl: currentAdmin.profileImageUrl || getSafeImage(defaultBarberAvatar),
  }
  const normalizedProducts = {
    ...products,
    items: products.items.map((item) => ({
      ...item,
      imageUrl: item.imageUrl || defaultProductImage || null,
    })),
  }
  const overviewActions = [
    {
      id: 'overview-applications',
      title: 'Pending barber applications',
      count: pendingApplications.length,
      description: 'Applications waiting for an approval decision.',
      actionLabel: 'Review',
      targetTab: 'pending-actions',
    },
    {
      id: 'overview-go-live',
      title: 'Pending go-live requests',
      count: goLiveRequests.length,
      description: 'Approved barbers waiting to be pushed live.',
      actionLabel: 'Review',
      targetTab: 'pending-actions',
    },
    {
      id: 'overview-payments',
      title: 'Pending payment confirmations',
      count: pendingPayments.length,
      description: 'Bookings still waiting for payment confirmation.',
      actionLabel: 'Open Bookings',
      targetTab: 'bookings',
    },
    {
      id: 'overview-booking-issues',
      title: 'Unresolved booking issues',
      count: problemBookings.length,
      description: 'Cancelled, expired, or failed-payment bookings need review.',
      actionLabel: 'Open Bookings',
      targetTab: 'bookings',
    },
    {
      id: 'overview-site-content',
      title: 'Site content needing review',
      count: siteContentReviewCount,
      description: 'Inactive or incomplete brand, media, or social content entries.',
      actionLabel: 'Manage',
      targetTab: 'settings',
    },
    {
      id: 'overview-barbers',
      title: 'Incomplete barber profiles',
      count: setupIssues.length,
      description: 'Profiles missing setup requirements before go-live.',
      actionLabel: 'Review',
      targetTab: 'barbers',
    },
  ] as const
  const recentSales = bookings.items
    .filter((item) => item.paymentStatus === 'paid' || item.status === 'confirmed' || item.status === 'completed')
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 5)
  const totalRevenue = bookings.items
    .filter((item) => item.paymentStatus === 'paid' || item.status === 'confirmed' || item.status === 'completed')
    .reduce((sum, item) => sum + item.amountDueValue, 0)
  const pendingRevenue = pendingPayments.reduce((sum, item) => sum + item.amountDueValue, 0)
  const cancelledOrRejectedCount = bookings.items.filter(
    (item) => item.status === 'cancelled' || item.status === 'rejected' || item.status === 'expired'
  ).length
  const upcomingBookings = bookings.items.filter(
    (item) => item.status === 'confirmed' && new Date(item.startsAt).getTime() >= Date.now()
  ).length
  const liveBarberCount = normalizedBarbers.filter(
    (item) => item.activeStatus === 'active' && item.isLive
  ).length
  const activeProductsCount = normalizedProducts.items.filter((item) => item.isActive).length
  const inactiveProductsCount = normalizedProducts.items.filter((item) => !item.isActive).length
  const lowStockProducts = normalizedProducts.items.filter((item) => item.stockQuantity <= 3)
  const allUsers = [
    ...normalizedUsers.customers,
    ...normalizedUsers.barbers,
    ...normalizedUsers.admins,
  ]
  const newUsersCount = allUsers.filter((item) => isRecentDate(item.createdAt)).length
  const inactiveUsersCount = allUsers.filter((item) => item.accountStatus !== 'active').length
  const socialLinks = siteContentItems.filter((item) => item.group === 'social-links')
  const activeSocialLinks = socialLinks.filter((item) => item.isActive && item.value).length
  const missingSocialLinks = socialLinks.filter((item) => !item.isActive || !item.value).length
  const overviewSections: AdminOverviewSection[] = [
    {
      id: 'sales',
      title: 'Sales / Revenue',
      description: 'Track payment flow, confirmed work, and recent revenue signals.',
      stats: [
        { id: 'total-revenue', label: 'Total revenue', value: toCurrency(totalRevenue) },
        { id: 'pending-revenue', label: 'Pending payments', value: toCurrency(pendingRevenue) },
        { id: 'confirmed-bookings', label: 'Confirmed bookings', value: String(bookings.items.filter((item) => item.status === 'confirmed').length) },
        { id: 'cancelled-bookings', label: 'Cancelled / rejected', value: String(cancelledOrRejectedCount) },
      ],
      rows: recentSales.map((item) => ({
        id: `sale-${item.id}`,
        title: item.customerName,
        summary: `${item.serviceName} · ${item.amountDueLabel}`,
        status: item.status,
        actionLabel: 'View',
        targetTab: 'bookings' as const,
      })),
    },
    {
      id: 'users',
      title: 'Users',
      description: 'See user distribution, new signups, and accounts needing review.',
      stats: [
        { id: 'total-customers', label: 'Total customers', value: String(normalizedUsers.customers.length) },
        { id: 'total-barbers', label: 'Total barbers', value: String(normalizedUsers.barbers.length) },
        { id: 'total-admins', label: 'Total admins', value: String(normalizedUsers.admins.length) },
        { id: 'new-users', label: 'New users', value: String(newUsersCount) },
        { id: 'inactive-users', label: 'Inactive users', value: String(inactiveUsersCount) },
      ],
      rows: normalizedUsers.admins.slice(0, 3).map((item) => ({
        id: `admin-${item.id}`,
        title: item.fullName,
        summary: `${item.role} · ${item.email}`,
        status: item.accountStatus,
        actionLabel: 'Manage',
        targetTab: 'users' as const,
      })),
    },
    {
      id: 'barbers',
      title: 'Barbers',
      description: 'Watch live status, setup progress, and approval flow at a glance.',
      stats: [
        { id: 'live-barbers', label: 'Live barbers', value: String(liveBarberCount) },
        { id: 'pending-applications', label: 'Pending applications', value: String(pendingApplications.length) },
        { id: 'go-live-pending', label: 'Go-live pending', value: String(goLiveRequests.length) },
        { id: 'setup-incomplete', label: 'Setup incomplete', value: String(setupIssues.length) },
        { id: 'deactivated-barbers', label: 'Deactivated', value: String(deactivatedBarbers.length) },
      ],
      rows: normalizedBarbers.slice(0, 5).map((item) => ({
        id: `barber-${item.id}`,
        title: item.displayName,
        summary: item.issueLabels.length > 0 ? item.issueLabels.join(', ') : item.specialty,
        status: item.isLive ? 'live' : item.setupStatus,
        actionLabel: 'Manage',
        targetTab: 'barbers' as const,
      })),
    },
    {
      id: 'bookings',
      title: 'Bookings',
      description: 'Follow upcoming workload, payment holds, and bookings that need intervention.',
      stats: [
        { id: 'upcoming-bookings', label: 'Upcoming bookings', value: String(upcomingBookings) },
        { id: 'pending-payment-bookings', label: 'Pending payment', value: String(pendingPayments.length) },
        { id: 'confirmed-bookings-total', label: 'Confirmed', value: String(bookings.items.filter((item) => item.status === 'confirmed').length) },
        { id: 'booking-issues', label: 'Issues', value: String(problemBookings.length) },
      ],
      rows: bookings.items.slice(0, 5).map((item) => ({
        id: `booking-${item.id}`,
        title: item.customerName,
        summary: `${item.serviceName} with ${item.barberName}`,
        status: item.status,
        actionLabel: 'View',
        targetTab: 'bookings' as const,
      })),
    },
    {
      id: 'products',
      title: 'Products',
      description: 'Keep product visibility and stock health under control.',
      stats: [
        { id: 'active-products', label: 'Active products', value: String(activeProductsCount) },
        { id: 'inactive-products', label: 'Inactive products', value: String(inactiveProductsCount) },
        { id: 'low-stock-products', label: 'Low stock', value: String(lowStockProducts.length) },
      ],
      rows: lowStockProducts.slice(0, 5).map((item) => ({
        id: `product-${item.id}`,
        title: item.name,
        summary: `${item.category} · Stock ${item.stockQuantity}`,
        status: item.isActive ? 'active' : 'inactive',
        actionLabel: 'Manage',
        targetTab: 'products' as const,
      })),
    },
    {
      id: 'site-content',
      title: 'Site Content',
      description: 'Track content readiness across uploaded assets and public links.',
      stats: [
        { id: 'configured-assets', label: 'Configured assets', value: String(siteContentItems.length - missingSiteAssets.length) },
        { id: 'missing-assets', label: 'Missing assets', value: String(missingSiteAssets.length) },
        { id: 'active-social-links', label: 'Active social links', value: String(activeSocialLinks) },
        { id: 'missing-social-links', label: 'Missing social links', value: String(missingSocialLinks) },
      ],
      rows: missingSiteAssets.slice(0, 5).map((item) => ({
        id: `content-${item.key}`,
        title: item.label,
        summary: item.group.replace(/-/g, ' '),
        status: item.isActive ? 'missing' : 'inactive',
        actionLabel: 'Manage',
        targetTab: 'settings' as const,
      })),
    },
  ]
  const pendingActions: AdminPendingActionItem[] = [
    ...pendingApplications.slice(0, 3).map((item) => ({
      id: `application-${item.id}`,
      title: item.applicantName,
      type: 'Barber Application',
      priority: 'high' as const,
      status: item.status,
      description: `${item.applicantEmail} · ${item.cuttingLocation}`,
      createdAtLabel: item.submittedAtLabel,
      actionLabel: 'Review',
      targetTab: 'barbers' as const,
      applicationId: item.id,
    })),
    ...goLiveRequests.slice(0, 3).map((item) => ({
      id: `go-live-${item.id}`,
      title: item.displayName,
      type: 'Go-Live Request',
      priority: 'high' as const,
      status: item.setupStatus,
      description: item.cuttingLocation || item.location || 'Location not set',
      createdAtLabel: item.goLiveRequestedAt ? formatDateTime(item.goLiveRequestedAt) : null,
      actionLabel: 'Approve',
      targetTab: 'barbers' as const,
      barberId: item.id,
    })),
    ...pendingPayments.slice(0, 3).map((item) => ({
      id: `payment-${item.id}`,
      title: item.customerName,
      type: 'Payment Confirmation',
      priority: 'high' as const,
      status: item.paymentStatus,
      description: `${item.serviceName} · ${item.amountDueLabel}`,
      createdAtLabel: item.createdAtLabel,
      actionLabel: 'Review',
      targetTab: 'bookings' as const,
      bookingId: item.id,
    })),
    ...problemBookings.slice(0, 3).map((item) => ({
      id: `issue-${item.id}`,
      title: item.customerName,
      type: 'Booking Issue',
      priority: 'medium' as const,
      status: item.status,
      description: `${item.serviceName} · ${item.barberName}`,
      createdAtLabel: item.createdAtLabel,
      actionLabel: 'Resolve',
      targetTab: 'bookings' as const,
      bookingId: item.id,
    })),
    ...setupIssues.slice(0, 3).map((item) => ({
      id: `setup-${item.id}`,
      title: item.displayName,
      type: 'Incomplete Barber Profile',
      priority: 'medium' as const,
      status: item.setupStatus,
      description: item.issueLabels.join(', ') || 'Profile needs review',
      createdAtLabel: null,
      actionLabel: 'Manage',
      targetTab: 'barbers' as const,
      barberId: item.id,
    })),
    ...missingSiteAssets.slice(0, 3).map((item) => ({
      id: `asset-${item.key}`,
      title: item.label,
      type: 'Site Asset',
      priority: 'low' as const,
      status: item.isActive ? 'missing' : 'inactive',
      description: `${item.group.replace(/-/g, ' ')} is not configured`,
      createdAtLabel: item.updatedAt ? formatDateTime(item.updatedAt) : null,
      actionLabel: 'Manage',
      targetTab: 'settings' as const,
      siteContentKey: item.key,
    })),
    ...pendingContactMessages.slice(0, 3).map((item: (typeof pendingContactMessages)[number]) => ({
      id: `contact-${item.id}`,
      title: item.userName || item.userEmail,
      type: 'Contact Message',
      priority: 'medium' as const,
      status: item.status,
      description: `${item.subject || 'General message'} · ${item.userEmail}`,
      createdAtLabel: item.createdAt ? formatDateTime(item.createdAt) : null,
      actionLabel: 'Review',
      targetTab: 'pending-actions' as const,
      contactMessageId: item.id,
    })),
  ]

  return {
    headerMessage:
      'Work from the smallest high-impact queue first, then move into content, users, and catalog updates.',
    currentAdmin: normalizedCurrentAdmin,
    metrics,
    pendingActions,
    overviewActions: [...overviewActions],
    overviewSections: [...overviewSections],
    attention: {
      pendingPayments,
      problemBookings,
      customerProfileGaps:
        customerProfilesCount.error ? customerProfileGaps : customerProfileGaps,
      barberProfileGaps: metricsBase,
      pendingBarberApplications,
      pendingGoLiveRequests,
      incompleteBarbers,
      siteContentNeedingReview: siteContentReviewCount,
    },
    requests: {
      barberApplications: {
        pending: pendingApplications,
        approved: approvedApplications,
        rejected: rejectedApplications,
      },
      goLiveRequests,
      setupIssues,
      deactivatedBarbers,
    },
    siteContent: {
      groups: siteContentGroups,
      items: siteContentItems,
      socialLinks: siteContentItems.filter((item) => item.group === 'social-links'),
      mediaAssets: siteContentItems.filter(
        (item) =>
          item.type === 'image' ||
          item.type === 'video' ||
          item.type === 'background' ||
          item.type === 'logo' ||
          item.type === 'service_media'
      ),
      reviewCount: siteContentReviewCount,
    },
    bookings,
    services,
    products: normalizedProducts,
    users: normalizedUsers,
    barbers: {
      ...barbers,
      items: normalizedBarbers,
    },
    barberApplications: {
      items: barberApplications,
      errorMessage: barberApplicationsResult.ok ? undefined : barberApplicationsResult.message,
    },
    contactMessages: pendingContactMessages,
  }
}
