import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/require-role'
import { confirmBookingPayment } from '@/lib/bookings/service'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const roleError = await requireRole(request, ['admin'])

  if (roleError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          message: 'You are not allowed to confirm booking payments.',
        },
      },
      { status: roleError.status || 403 }
    )
  }

  const { id } = await context.params

  try {
    const body = await request.json().catch(() => ({}))
    const result = await confirmBookingPayment(id, {
      paymentStatus: body?.paymentStatus,
    })

    if (!result.ok) {
      const status =
        result.code === 'NOT_FOUND'
          ? 404
          : result.code === 'VALIDATION_ERROR'
            ? 400
            : result.code === 'UNAUTHORIZED'
              ? 401
              : result.code === 'FORBIDDEN'
                ? 403
                : 409

      return NextResponse.json(
        {
          ok: false,
          error: {
            code: result.code,
            message: result.message,
            details: result.details,
          },
        },
        { status }
      )
    }

    return NextResponse.json({ ok: true, data: result.data })
  } catch (error) {
    console.error('[api/admin/bookings/[id]/confirm-payment] Failed to confirm payment:', error)

    return NextResponse.json(
      {
        ok: false,
        error: {
          message: 'Request body must be valid JSON.',
        },
      },
      { status: 400 }
    )
  }
}
