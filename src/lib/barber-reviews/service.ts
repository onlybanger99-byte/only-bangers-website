import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export interface BarberReviewSummary {
  id: string
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
    .select('id, rating, comment, created_at')
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
      rating: typeof row.rating === 'number' ? row.rating : 0,
      comment: normalizeText(row.comment) || null,
      createdAt: typeof row.created_at === 'string' ? row.created_at : '',
    })),
  }
}
