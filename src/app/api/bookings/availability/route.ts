import { NextRequest } from 'next/server'
import { bookingApiResponse } from '@/lib/bookings/http'
import { getAvailabilityForBarberDate } from '@/lib/bookings/service'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  return bookingApiResponse(
    await getAvailabilityForBarberDate(
      searchParams.get('barberId') ?? '',
      searchParams.get('date') ?? '',
      searchParams.get('servicePriceId') ?? undefined
    )
  )
}
