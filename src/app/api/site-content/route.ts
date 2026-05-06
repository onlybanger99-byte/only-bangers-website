import { listActiveSiteContent } from '@/lib/site-content/service'

export async function GET() {
  const result = await listActiveSiteContent()

  return Response.json({
    ok: result.ok,
    data: {
      items: result.items,
      map: result.map,
    },
    error: result.ok ? null : { message: result.message, details: result.details },
  })
}
