import type { NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth/require-role'
import { deleteSiteContentById, updateSiteContentById } from '@/lib/site-content/service'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authError = await requireRole(request, ['admin'])

  if (authError) {
    return authError
  }

  const body = await request.json().catch(() => null)
  const { id } = await context.params
  const result = await updateSiteContentById(id, {
    label: typeof body?.label === 'string' ? body.label : undefined,
    value: typeof body?.value === 'string' ? body.value : undefined,
    imageUrl: typeof body?.imageUrl === 'string' ? body.imageUrl : undefined,
    videoUrl: typeof body?.videoUrl === 'string' ? body.videoUrl : undefined,
    storagePath: typeof body?.storagePath === 'string' ? body.storagePath : undefined,
    metadata: body?.metadata && typeof body.metadata === 'object' ? body.metadata : undefined,
    isActive: typeof body?.isActive === 'boolean' ? body.isActive : undefined,
  })

  if (!result.ok) {
    return Response.json(
      { ok: false, error: { code: 'VALIDATION_ERROR', message: result.message, details: result.details } },
      { status: 400 }
    )
  }

  return Response.json({ ok: true, data: result.data })
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authError = await requireRole(request, ['admin'])

  if (authError) {
    return authError
  }

  const { id } = await context.params
  const result = await deleteSiteContentById(id)

  if (!result.ok) {
    return Response.json(
      { ok: false, error: { code: 'DATABASE_ERROR', message: result.message, details: result.details } },
      { status: 400 }
    )
  }

  return Response.json({ ok: true })
}
