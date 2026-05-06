import { barbers } from '@/data/barbers'
import { getLatestBarberApplicationForUser } from '@/lib/barber-applications/service'
import { listBarberAvailabilitySlots } from '@/lib/barber-availability/service'
import { listGalleryImagesForOwner } from '@/lib/barber-gallery/service'
import { listBarberServicePricesForOwner } from '@/lib/barber-service-prices/service'
import { getBarberProfileByUserId } from '@/lib/barbers/service'
import { buildBarberSetupChecklist } from '@/lib/barbers/setup'
import { getBarberSetupStatus } from '@/lib/barber/setup-status'
import { listBookings } from '@/lib/bookings/service'
import { getCustomerProfilesByUserIds } from '@/lib/customer-profiles/service'
import { formatDate, formatDateTime, formatTime } from '@/lib/date-time'
import { getSafeImage } from '@/lib/safe-image'
import type { BarberDashboardBooking, BarberDashboardViewModel, BarberOperatorProfile } from './types'

type BarberDashboardIdentity = {
  userId: string
  email?: string
}

type InternalBooking = BarberDashboardBooking & {
  rawStartsAt: string
}

function formatAmount(amount?: number | null) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(amount ?? 0)
}

function buildWhatsAppHref(phoneNumber?: string | null) {
  if (!phoneNumber) {
    return null
  }

  const digits = phoneNumber.replace(/[^\d]/g, '')
  return digits ? `https://wa.me/${digits}` : null
}

async function buildOperatorProfile(identity: BarberDashboardIdentity): Promise<BarberOperatorProfile> {
  const liveProfile = await getBarberProfileByUserId(identity.userId)

  if (liveProfile) {
    return {
      email: identity.email ?? null,
      displayName: liveProfile.displayName,
      fullName: liveProfile.fullName,
      phone: liveProfile.phone,
      slug: liveProfile.slug,
      specialty: liveProfile.specialty,
      image: liveProfile.profileImageUrl ?? null,
      coverImageUrl: liveProfile.coverImageUrl ?? null,
      bio: liveProfile.bio,
      location: liveProfile.location,
      cuttingLocation: liveProfile.cuttingLocation,
      latitude: liveProfile.latitude,
      longitude: liveProfile.longitude,
      mapUrl: liveProfile.mapUrl,
      instagramUrl: liveProfile.instagramUrl,
      tiktokUrl: liveProfile.tiktokUrl,
      facebookUrl: liveProfile.facebookUrl,
      portfolioUrl: liveProfile.portfolioUrl,
      availableDays: liveProfile.availableDays,
      availableStartTime: liveProfile.availableStartTime,
      availableEndTime: liveProfile.availableEndTime,
      activeStatus: liveProfile.isActive ? 'active' : 'inactive',
      isLive: liveProfile.isLive,
      setupStatus: liveProfile.setupStatus,
      goLiveRejectionReason: liveProfile.goLiveRejectionReason,
      editProfileHref: '/barber/dashboard',
    }
  }

  const latestApplication = await getLatestBarberApplicationForUser(identity.userId)

  const emailValue = identity.email?.toLowerCase() ?? ''
  const matched =
    barbers.find((barber) => emailValue.includes(barber.name.split(' ')[0].toLowerCase())) ??
    barbers[0]

    return {
      email: identity.email ?? null,
      displayName: matched.name,
      fullName: latestApplication?.displayName ?? matched.name,
      phone: latestApplication?.phone ?? null,
      slug: null,
      specialty: matched.specialty,
      image: matched.image ?? null,
      coverImageUrl: null,
      bio:
      latestApplication?.bio ||
      'Your public barber profile can be completed once profile management is connected.',
    location: latestApplication?.cuttingLocation ?? null,
    cuttingLocation: latestApplication?.cuttingLocation ?? null,
    latitude: null,
    longitude: null,
    mapUrl: null,
    instagramUrl: latestApplication?.instagramUrl ?? null,
    tiktokUrl: latestApplication?.tiktokUrl ?? null,
    facebookUrl: latestApplication?.facebookUrl ?? null,
    portfolioUrl: latestApplication?.portfolioUrl ?? null,
    availableDays: latestApplication?.availableDays ?? [],
    availableStartTime: latestApplication?.availableStartTime ?? null,
    availableEndTime: latestApplication?.availableEndTime ?? null,
      activeStatus: 'inactive',
      isLive: false,
      setupStatus: 'draft',
      goLiveRejectionReason: null,
      editProfileHref: '/barber/dashboard',
    }
  }

async function getLiveAppointments(
  identity: BarberDashboardIdentity
): Promise<{
  today: BarberDashboardBooking[]
  upcoming: BarberDashboardBooking[]
  awaitingPayment: BarberDashboardBooking[]
}> {
  const bookingsResult = await listBookings({
    barberId: identity.userId,
    ascending: true,
    limit: 120,
  })

  if (!bookingsResult.ok) {
    if (bookingsResult.code !== 'TABLE_MISSING') {
      console.error('[barber-dashboard] Live bookings query failed:', bookingsResult)
    }

    return {
      today: [],
      upcoming: [],
      awaitingPayment: [],
    }
  }

  const profiles = await getCustomerProfilesByUserIds(bookingsResult.data.map((row) => row.user_id))

  const items: InternalBooking[] = bookingsResult.data
    .filter((row) => row.status !== 'cancelled' && row.status !== 'expired')
    .map((row) => {
      const profile = profiles.get(row.user_id)

      return {
        id: row.id,
        reference: row.payment_reference ?? `OB-${row.id.slice(0, 8).toUpperCase()}`,
        status: row.status,
        paymentStatus: row.payment_status,
        customerName: profile?.fullName ?? 'Only Bangers Customer',
        customerPhone: profile?.phoneNumber ?? 'Phone pending',
        customerEmail: 'Email unavailable',
        serviceName: row.service_name || 'Service not specified',
        bookingDateLabel: formatDate(row.starts_at),
        bookingTimeLabel: formatTime(row.starts_at),
        startsAtLabel: formatDateTime(row.starts_at),
        amountDueLabel: formatAmount(row.amount_due),
        pendingExpiresAtLabel:
          row.pending_expires_at ? formatDateTime(row.pending_expires_at) : 'Date not set',
        notes: row.notes ?? 'No customer notes were captured for this booking.',
        customerAvatarUrl: profile?.profileImageUrl ?? getSafeImage(null),
        messageCustomerHref: buildWhatsAppHref(profile?.phoneNumber ?? null),
        rawStartsAt: row.starts_at,
      }
    })

  const now = new Date()
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(now)
  endOfDay.setHours(23, 59, 59, 999)

  const today = items
    .filter((item) => {
      if (item.status !== 'confirmed' || item.paymentStatus !== 'paid') {
        return false
      }

      const startsAt = new Date(item.rawStartsAt)
      return !Number.isNaN(startsAt.getTime()) && startsAt >= startOfDay && startsAt <= endOfDay
    })
    .sort((left, right) => new Date(left.rawStartsAt).getTime() - new Date(right.rawStartsAt).getTime())

  const upcoming = items
    .filter((item) => {
      if (item.status !== 'confirmed' || item.paymentStatus !== 'paid') {
        return false
      }

      const startsAt = new Date(item.rawStartsAt)
      return !Number.isNaN(startsAt.getTime()) && startsAt > endOfDay
    })
    .sort((left, right) => new Date(left.rawStartsAt).getTime() - new Date(right.rawStartsAt).getTime())

  const awaitingPayment = items
    .filter((item) => item.status === 'pending_payment')
    .sort((left, right) => new Date(left.rawStartsAt).getTime() - new Date(right.rawStartsAt).getTime())

  return {
    today: today.map(({ rawStartsAt: _raw, ...item }) => item),
    upcoming: upcoming.map(({ rawStartsAt: _raw, ...item }) => item),
    awaitingPayment: awaitingPayment.map(({ rawStartsAt: _raw, ...item }) => item),
  }
}

export async function getBarberDashboardViewModel(
  identity: BarberDashboardIdentity
): Promise<BarberDashboardViewModel> {
  const operator = await buildOperatorProfile(identity)
  const [liveAppointments, servicePricesResult, availabilityResult] = await Promise.all([
    getLiveAppointments(identity),
    listBarberServicePricesForOwner(identity.userId),
    listBarberAvailabilitySlots(identity.userId),
  ])
  const galleryResult = operator.slug
    ? await getBarberProfileByUserId(identity.userId)
    : await getBarberProfileByUserId(identity.userId)
  const galleryImagesResult =
    galleryResult?.id ? await listGalleryImagesForOwner(galleryResult.id) : { ok: true as const, data: [] }
  const servicePrices = servicePricesResult.ok ? servicePricesResult.data : []
  const availabilitySlots = availabilityResult.ok ? availabilityResult.data : []
  const setupChecklist = buildBarberSetupChecklist({
    profile: galleryResult,
    servicePrices,
    availabilitySlots,
    galleryImageCount: galleryImagesResult.ok ? galleryImagesResult.data.length : 0,
  })
  const setupStatus = getBarberSetupStatus({
    profile: galleryResult,
    servicePrices,
    availabilitySlots,
    galleryImageCount: galleryImagesResult.ok ? galleryImagesResult.data.length : 0,
  })

  return {
    dataSource:
      liveAppointments.today.length > 0 ||
      liveAppointments.upcoming.length > 0 ||
      liveAppointments.awaitingPayment.length > 0
        ? 'live'
        : 'empty',
    readinessMessage:
      'Confirmed and paid bookings appear in your working schedule. Pending-payment holds stay separate until admin verification is complete.',
    operator,
    servicePrices,
    availabilitySlots,
    galleryImages: galleryImagesResult.ok ? galleryImagesResult.data : [],
    setupChecklist,
    setupStatus,
    today: liveAppointments.today,
    upcoming: liveAppointments.upcoming,
    awaitingPayment: liveAppointments.awaitingPayment,
  }
}
