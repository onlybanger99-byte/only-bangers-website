import { createAdminClient } from '@/lib/supabase/admin'
import { getUserRole } from '@/lib/auth/get-user-role'
import { createClient } from '@/lib/supabase/server'

export interface BarberReviewSummary {
  id: string
  bookingId?: string | null
  barberProfileId?: string | null
  rating: number
  comment: string | null
  createdAt: string
}

export interface BarberReviewAggregate {
  averageRating: number | null
  reviewCount: number
  recentReviews: BarberReviewSummary[]
}

async function getSupabase() {
  return createAdminClient() ?? (await createClient())
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function getBarberReviewAggregate(barberProfileId: string): Promise<BarberReviewAggregate> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('barber_reviews')
    .select('id, booking_id, barber_profile_id, rating, comment, created_at')
    .eq('barber_profile_id', barberProfileId)
    .eq('is_visible', true)
    .order('created_at', { ascending: false })

  if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('[barber-reviews] Failed to load barber reviews', error)
    return {
      averageRating: null,
      reviewCount: 0,
      recentReviews: [],
    }
  }

  const rows = (data ?? []) as Array<Record<string, unknown>>
  const ratings = rows
    .map((row) => (typeof row.rating === 'number' ? row.rating : null))
    .filter((rating): rating is number => rating !== null)
  const average =
    ratings.length > 0 ? Number((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1)) : null

  return {
    averageRating: average,
    reviewCount: rows.length,
    recentReviews: rows.slice(0, 6).map((row) => ({
      id: String(row.id),
      bookingId: typeof row.booking_id === 'string' ? row.booking_id : null,
      barberProfileId: typeof row.barber_profile_id === 'string' ? row.barber_profile_id : null,
      rating: typeof row.rating === 'number' ? row.rating : 0,
      comment: normalizeText(row.comment) || null,
      createdAt: typeof row.created_at === 'string' ? row.created_at : '',
    })),
  }
}

export async function getReviewForBooking(bookingId: string) {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('barber_reviews')
    .select('id, booking_id, barber_profile_id, rating, comment, created_at')
    .eq('booking_id', bookingId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116' && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('[barber-reviews] Failed to load booking review', error)
    return null
  }

  if (!data) {
    return null
  }

  const row = data as Record<string, unknown>

  return {
    id: String(row.id),
    bookingId: typeof row.booking_id === 'string' ? row.booking_id : null,
    barberProfileId: typeof row.barber_profile_id === 'string' ? row.barber_profile_id : null,
    rating: typeof row.rating === 'number' ? row.rating : 0,
    comment: normalizeText(row.comment) || null,
    createdAt: typeof row.created_at === 'string' ? row.created_at : '',
  } satisfies BarberReviewSummary
}

export async function createBarberReview(input: {
  bookingId: string
  rating: number
  comment?: string | null
}) {
  const { user } = await getUserRole()

  if (!user) {
    return {
      ok: false as const,
      code: 'UNAUTHORIZED',
      message: 'You must be signed in to leave a review.',
    }
  }

  const rating = Math.max(1, Math.min(5, Math.round(input.rating)))
  const comment = normalizeText(input.comment) || null
  const supabase = await createClient()
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, user_id, barber_id, status, payment_status, starts_at')
    .eq('id', input.bookingId)
    .maybeSingle()

  if (bookingError || !booking) {
    return {
      ok: false as const,
      code: 'NOT_FOUND',
      message: 'Booking not found for this review.',
    }
  }

  if (booking.user_id !== user.id) {
    return {
      ok: false as const,
      code: 'FORBIDDEN',
      message: 'You can only review your own booking.',
    }
  }

  const eligibleStatus = ['confirmed', 'completed', 'paid'].includes(normalizeText(booking.status))
  const eligiblePayment = ['paid'].includes(normalizeText(booking.payment_status))
  const hasStarted = typeof booking.starts_at === 'string' && new Date(booking.starts_at).getTime() < Date.now()

  if ((!eligibleStatus && !eligiblePayment) || !hasStarted) {
    return {
      ok: false as const,
      code: 'VALIDATION_ERROR',
      message: 'Only completed or paid past bookings can be reviewed.',
    }
  }

  const { data: barberProfile } = await supabase
    .from('barber_profiles')
    .select('id')
    .eq('user_id', booking.barber_id)
    .maybeSingle()

  if (!barberProfile?.id) {
    return {
      ok: false as const,
      code: 'VALIDATION_ERROR',
      message: 'This booking does not have a reviewable barber profile.',
    }
  }

  const existingReview = await getReviewForBooking(input.bookingId)

  if (existingReview) {
    return {
      ok: false as const,
      code: 'VALIDATION_ERROR',
      message: 'A review has already been submitted for this booking.',
    }
  }

  const { data, error } = await supabase
    .from('barber_reviews')
    .insert({
      barber_profile_id: barberProfile.id,
      user_id: user.id,
      booking_id: input.bookingId,
      rating,
      comment,
      is_visible: true,
    })
    .select('id, booking_id, barber_profile_id, rating, comment, created_at')
    .single()

  if (error) {
    console.error('[barber-reviews] Failed to create review', error)
    return {
      ok: false as const,
      code: 'DATABASE_ERROR',
      message: error.message || 'We could not save your review.',
    }
  }

  const row = data as Record<string, unknown>

  return {
    ok: true as const,
    data: {
      id: String(row.id),
      bookingId: typeof row.booking_id === 'string' ? row.booking_id : null,
      barberProfileId: typeof row.barber_profile_id === 'string' ? row.barber_profile_id : null,
      rating: typeof row.rating === 'number' ? row.rating : rating,
      comment: normalizeText(row.comment) || null,
      createdAt: typeof row.created_at === 'string' ? row.created_at : '',
    } satisfies BarberReviewSummary,
  }
}
