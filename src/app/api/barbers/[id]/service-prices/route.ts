import { listActiveBarberServicePricesForPublic } from '@/lib/barber-service-prices/service'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const result = await listActiveBarberServicePricesForPublic(id)

  if (!result.ok) {
    return Response.json(
      { ok: false, error: { code: 'DATABASE_ERROR', message: result.message } },
      { status: 500 }
    )
  }

  return Response.json({ ok: true, data: result.data })
}
