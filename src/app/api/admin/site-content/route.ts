import type { NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth/require-role'
import { createSiteContent, listSiteContentAdmin } from '@/lib/site-content/service'
import type { SiteContentType } from '@/lib/site-content/types'

export async function GET(request: NextRequest) {
  const authError = await requireRole(request, ['admin'])

  if (authError) {
    return authError
  }

  const result = await listSiteContentAdmin()

  if (!result.ok) {
    return Response.json(
      { ok: false, error: { code: 'DATABASE_ERROR', message: result.message, details: result.details } },
      { status: 500 }
    )
  }

  return Response.json({ ok: true, data: result.groups })
}

export async function POST(request: NextRequest) {
  const authError = await requireRole(request, ['admin'])

  if (authError) {
    return authError
  }

  const body = await request.json().catch(() => null)
  const result = await createSiteContent({
    key: typeof body?.key === 'string' ? body.key : '',
    label: typeof body?.label === 'string' ? body.label : '',
    type: (typeof body?.type === 'string' ? body.type : 'text') as SiteContentType,
    value: typeof body?.value === 'string' ? body.value : null,
    imageUrl: typeof body?.imageUrl === 'string' ? body.imageUrl : null,
    videoUrl: typeof body?.videoUrl === 'string' ? body.videoUrl : null,
    storagePath: typeof body?.storagePath === 'string' ? body.storagePath : null,
    metadata: body?.metadata && typeof body.metadata === 'object' ? body.metadata : {},
    isActive: body?.isActive !== false,
  })

  if (!result.ok) {
    return Response.json(
      { ok: false, error: { code: 'VALIDATION_ERROR', message: result.message, details: result.details } },
      { status: 400 }
    )
  }

  return Response.json({ ok: true, data: result.data })
}
