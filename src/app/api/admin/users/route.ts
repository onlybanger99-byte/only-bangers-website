import type { NextRequest } from 'next/server'
import { getUserRole } from '@/lib/auth/get-user-role'
import { requireRole } from '@/lib/auth/require-role'
import { getAdminDashboardViewModel } from '@/lib/admin-dashboard/data'
import { createManualUser } from '@/lib/admin-users/service'

export async function GET(request: NextRequest) {
  const authError = await requireRole(request, ['admin'])

  if (authError) {
    return authError
  }

  const { user } = await getUserRole()

  if (!user?.email) {
    return Response.json(
      { ok: false, error: { code: 'UNAUTHORIZED', message: 'You must be signed in.' } },
      { status: 401 }
    )
  }

  const dashboard = await getAdminDashboardViewModel({
    userId: user.id,
    email: user.email,
  })

  return Response.json({
    ok: true,
    data: {
      customers: dashboard.users.customers,
      barbers: dashboard.users.barbers,
      admins: dashboard.users.admins,
    },
  })
}

export async function POST(request: NextRequest) {
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

  const body = await request.json()
  const result = await createManualUser({
    email: body.email,
    password: body.password,
    role: body.role,
  })

  if (!result.ok) {
    return Response.json(
      { ok: false, error: { code: 'DATABASE_ERROR', message: result.message, details: result.details } },
      { status: 400 }
    )
  }

  return Response.json({ ok: true, data: result.data }, { status: 201 })
}
