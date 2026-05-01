import type { NextRequest } from 'next/server'
import { approveBarberApplication } from '@/lib/barber-applications/service'
import { getUserRole } from '@/lib/auth/get-user-role'
import { requireRole } from '@/lib/auth/require-role'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  console.info('[api][admin][barber-applications][approve] request_received')
  const authError = await requireRole(request, ['admin'])

  if (authError) {
    console.warn('[api][admin][barber-applications][approve] role_check_failed')
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
  console.info('[api][admin][barber-applications][approve] approving', {
    applicationId: id,
    reviewerId: user.id,
  })
  const result = await approveBarberApplication(id, user.id)

  if (!result.ok) {
    console.error('[api][admin][barber-applications][approve] failed', {
      applicationId: id,
      reviewerId: user.id,
      message: result.message,
      details: result.details,
    })
    return Response.json(
      {
        ok: false,
        error: {
          code: 'DATABASE_ERROR',
          message: result.message,
          details: result.details,
          debugMessage: [result.message, ...(result.details ?? [])].filter(Boolean).join(' | '),
        },
      },
      { status: 500 }
    )
  }

  console.info('[api][admin][barber-applications][approve] success', {
    applicationId: id,
    reviewerId: user.id,
  })
  return Response.json({ ok: true, data: result.data })
}
