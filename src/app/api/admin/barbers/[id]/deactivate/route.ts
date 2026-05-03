import type { NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth/require-role'
import { deactivateBarberProfile } from '@/lib/admin-users/service'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authError = await requireRole(request, ['admin'])

  if (authError) {
    return authError
  }

  const { id } = await context.params
  const result = await deactivateBarberProfile(id)

  if (!result.ok) {
    return Response.json(
      { ok: false, error: { code: 'DATABASE_ERROR', message: result.message, details: result.details } },
      { status: 400 }
    )
  }

  return Response.json({ ok: true })
}
