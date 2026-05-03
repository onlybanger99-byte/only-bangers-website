import type { NextRequest } from 'next/server'
import { getUserRole } from '@/lib/auth/get-user-role'
import { requireRole } from '@/lib/auth/require-role'
import { resendAccountSetupEmail } from '@/lib/admin-users/service'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authError = await requireRole(request, ['admin'])

  if (authError) {
    return authError
  }

  const { id } = await context.params
  const redirectTo = new URL('/profile/complete?setup=1', request.nextUrl.origin).toString()
  const result = await resendAccountSetupEmail({
    userId: id,
    redirectTo,
  })

  if (!result.ok) {
    return Response.json(
      { ok: false, error: { code: 'EMAIL_SEND_FAILED', message: result.message, details: result.details } },
      { status: 400 }
    )
  }

  return Response.json({ ok: true })
}
