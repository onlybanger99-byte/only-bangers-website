import { NextRequest } from 'next/server'
import { createBarberReview } from '@/lib/barber-reviews/service'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const result = await createBarberReview({
    bookingId: body.bookingId,
    rating: Number(body.rating),
    comment: body.comment,
  })

  if (!result.ok) {
    const status =
      result.code === 'UNAUTHORIZED'
        ? 401
        : result.code === 'FORBIDDEN'
          ? 403
          : result.code === 'NOT_FOUND'
            ? 404
            : result.code === 'DATABASE_ERROR'
              ? 500
              : 400

    return Response.json(
      {
        ok: false,
        error: {
          code: result.code,
          message: result.message,
        },
      },
      { status }
    )
  }

  return Response.json({ ok: true, data: result.data })
}
