import { requireRole } from '@/lib/auth/require-role'
import { listBarberApplicationsForAdmin } from '@/lib/barber-applications/service'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const authError = await requireRole(request, ['admin'])

  if (authError) {
    return authError
  }

  const result = await listBarberApplicationsForAdmin()

  if (!result.ok) {
    return Response.json(
      { ok: false, error: { code: 'DATABASE_ERROR', message: result.message } },
      { status: 500 }
    )
  }

  const pending = result.data.filter((application) => application.status === 'pending')
  const approved = result.data.filter((application) => application.status === 'approved')
  const rejected = result.data.filter((application) => application.status === 'rejected')

  return Response.json({
    ok: true,
    data: {
      pending,
      approved,
      rejected,
      items: [...pending, ...approved, ...rejected],
    },
  })
}
