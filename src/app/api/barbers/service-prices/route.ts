import { NextRequest } from 'next/server'
import {
  listPublicBarbersForService,
  listPublicServicePriceSummaries,
} from '@/lib/barber-service-prices/service'

export async function GET(request: NextRequest) {
  const serviceId = request.nextUrl.searchParams.get('serviceId')

  if (serviceId) {
    const result = await listPublicBarbersForService({ serviceId })

    if (!result.ok) {
      return Response.json(
        { ok: false, error: { code: 'DATABASE_ERROR', message: result.message } },
        { status: 500 }
      )
    }

    return Response.json({ ok: true, data: result.data })
  }

  const summaryResult = await listPublicServicePriceSummaries()

  if (!summaryResult.ok) {
    return Response.json(
      { ok: false, error: { code: 'DATABASE_ERROR', message: summaryResult.message } },
      { status: 500 }
    )
  }

  return Response.json({ ok: true, data: summaryResult.data })
}
