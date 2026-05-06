import { getUserRole } from '@/lib/auth/get-user-role'
import { updateServiceAsAdmin } from '@/lib/services/service'
import type { NextRequest } from 'next/server'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { user, role } = await getUserRole()

  if (!user) {
    return Response.json(
      { ok: false, error: { code: 'UNAUTHORIZED', message: 'You must be signed in.' } },
      { status: 401 }
    )
  }

  if (role !== 'admin') {
    return Response.json(
      { ok: false, error: { code: 'FORBIDDEN', message: 'Only admins can manage services.' } },
      { status: 403 }
    )
  }

  const body = await request.json().catch(() => null)
  const { id } = await context.params
  const result = await updateServiceAsAdmin({
    id,
    description: typeof body?.description === 'string' ? body.description : '',
    isActive: Boolean(body?.isActive),
    sortOrder:
      typeof body?.sortOrder === 'number' && Number.isFinite(body.sortOrder)
        ? body.sortOrder
        : 0,
    imageUrl: typeof body?.imageUrl === 'string' ? body.imageUrl : null,
    backgroundImageUrl:
      typeof body?.backgroundImageUrl === 'string' ? body.backgroundImageUrl : null,
    mediaStoragePath:
      typeof body?.mediaStoragePath === 'string' ? body.mediaStoragePath : null,
  })

  if (!result.ok) {
    return Response.json(
      { ok: false, error: { code: 'VALIDATION_ERROR', message: result.message, details: result.details } },
      { status: 400 }
    )
  }

  return Response.json({ ok: true, data: result.data })
}
