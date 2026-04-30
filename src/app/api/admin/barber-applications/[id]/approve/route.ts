import type { NextRequest } from 'next/server'
import { approveBarberApplication } from '@/lib/barber-applications/service'
import { getUserRole } from '@/lib/auth/get-user-role'
import { requireRole } from '@/lib/auth/require-role'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authError = await requireRole(request, ['admin'])

  if (authError) {
    return authError
  }

  const { user } = await getUserRole()

  if (!user) {
    return Response.json(
      { ok: false, error: { code: 'UNAUTHORIZED', message: 'You must be signed in.' } },
      { status: 401 }
    )
  }

  const { id } = await context.params
  const result = await approveBarberApplication(id, user.id)

  if (!result.ok) {
    return Response.json(
      {
        ok: false,
        error: {
          code: 'DATABASE_ERROR',
          message: result.message,
          details: result.details,
        },
      },
      { status: 400 }
    )
  }

  return Response.json({ ok: true, data: result.data })
}
