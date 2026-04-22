import { NextRequest } from 'next/server'
import { bookingApiResponse } from '@/lib/bookings/http'
import { deleteBooking, getBookingById, updateBooking } from '@/lib/bookings/service'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  return bookingApiResponse(await getBookingById(id))
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  try {
    const body = await request.json()

    return bookingApiResponse(
      await updateBooking(id, {
        barberId: body.barberId,
        serviceName: body.serviceName,
        startsAt: body.startsAt,
        status: body.status,
        notes: body.notes,
      })
    )
  } catch (error) {
    console.error('[api/bookings/[id]] Invalid PATCH payload:', error)
    return bookingApiResponse({
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'Request body must be valid JSON.',
    })
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  return bookingApiResponse(await deleteBooking(id))
}
