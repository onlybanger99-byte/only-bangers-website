import { listPublicBarbers } from '@/lib/barbers/service'

export async function GET() {
  const barbers = await listPublicBarbers()

  return Response.json({
    ok: true,
    data: barbers,
  })
}
