import { listActiveServices } from '@/lib/services/service'

export async function GET() {
  const result = await listActiveServices()

  if (!result.ok) {
    return Response.json(
      { ok: false, error: { code: 'DATABASE_ERROR', message: result.message } },
      { status: 500 }
    )
  }

  return Response.json({ ok: true, data: result.data })
}
