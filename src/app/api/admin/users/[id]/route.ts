import type { NextRequest } from 'next/server'
import { getUserRole } from '@/lib/auth/get-user-role'
import { requireRole } from '@/lib/auth/require-role'
import { changeUserRole, deleteUserAccount } from '@/lib/admin-users/service'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authError = await requireRole(request, ['admin'])

  if (authError) {
    return authError
  }

  const { user } = await getUserRole()
  const { id } = await context.params

  if (!user) {
    return Response.json(
      { ok: false, error: { code: 'UNAUTHORIZED', message: 'You must be signed in.' } },
      { status: 401 }
    )
  }

  if (user.id === id) {
    return Response.json(
      { ok: false, error: { code: 'FORBIDDEN', message: 'You cannot change your own admin role here.' } },
      { status: 403 }
    )
  }

  const body = await request.json()
  const result = await changeUserRole({
    userId: id,
    role: body.role,
  })

  if (!result.ok) {
    return Response.json(
      { ok: false, error: { code: 'DATABASE_ERROR', message: result.message, details: result.details } },
      { status: 400 }
    )
  }

  return Response.json({ ok: true })
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authError = await requireRole(request, ['admin'])

  if (authError) {
    return authError
  }

  const { user } = await getUserRole()
  const { id } = await context.params

  if (!user) {
    return Response.json(
      { ok: false, error: { code: 'UNAUTHORIZED', message: 'You must be signed in.' } },
      { status: 401 }
    )
  }

  if (user.id === id) {
    return Response.json(
      { ok: false, error: { code: 'FORBIDDEN', message: 'You cannot delete your own admin account here.' } },
      { status: 403 }
    )
  }

  const result = await deleteUserAccount(id)

  if (!result.ok) {
    return Response.json(
      { ok: false, error: { code: 'DATABASE_ERROR', message: result.message, details: result.details } },
      { status: 400 }
    )
  }

  return Response.json({ ok: true })
}
