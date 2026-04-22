import { NextRequest } from 'next/server'
import { bookingApiResponse } from '@/lib/bookings/http'
import { createBooking, listBookings } from '@/lib/bookings/service'
import type { BookingStatus } from '@/lib/bookings/types'

function getStatusFilter(value: string | null): BookingStatus | undefined {
  switch (value) {
    case 'pending':
    case 'confirmed':
    case 'scheduled':
    case 'arrived':
    case 'in_progress':
    case 'completed':
    case 'cancelled':
      return value
    default:
      return undefined
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const result = await listBookings({
    id: searchParams.get('id') ?? undefined,
    userId: searchParams.get('userId') ?? undefined,
    barberId: searchParams.get('barberId') ?? undefined,
    status: getStatusFilter(searchParams.get('status')),
    startsAtFrom: searchParams.get('from') ?? undefined,
    startsAtTo: searchParams.get('to') ?? undefined,
    limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
    ascending: searchParams.get('ascending') === 'true',
  })

  return bookingApiResponse(result)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const result = await createBooking({
      userId: body.userId,
      barberId: body.barberId,
      serviceName: body.serviceName,
      startsAt: body.startsAt,
      status: body.status,
      notes: body.notes,
    })

    return bookingApiResponse(result)
  } catch (error) {
    console.error('[api/bookings] Invalid POST payload:', error)
    return bookingApiResponse({
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'Request body must be valid JSON.',
    })
  }
}
