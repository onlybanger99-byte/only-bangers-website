import type { NextRequest } from 'next/server'
import { getUserRole } from '@/lib/auth/get-user-role'
import { createManualUser } from '@/lib/admin-users/service'

export async function POST(request: NextRequest) {
  const { user, role } = await getUserRole()

  if (!user) {
    console.error('[api/admin/users/create] admin role check failed', {
      step: 'admin_role_check',
      reason: 'unauthenticated',
    })

    return Response.json(
      {
        ok: false,
        error: {
          step: 'admin_role_check',
          code: 'UNAUTHORIZED',
          message: 'You must be signed in.',
          details: ['The current request does not have an authenticated user session.'],
        },
      },
      { status: 401 }
    )
  }

  if (role !== 'admin') {
    console.error('[api/admin/users/create] admin role check failed', {
      step: 'admin_role_check',
      userId: user.id,
      role,
      reason: 'forbidden',
    })

    return Response.json(
      {
        ok: false,
        error: {
          step: 'admin_role_check',
          code: 'FORBIDDEN',
          message: 'Only admins can create users.',
          details: [`Current role: ${role ?? 'none'}`],
        },
      },
      { status: 403 }
    )
  }

  const body = await request.json().catch(() => null)
  const result = await createManualUser({
    email: body?.email,
    password: body?.password,
    role: body?.role,
  })

  if (!result.ok) {
    const failedStep = 'step' in result ? result.step : 'supabase.auth.admin.createUser'
    const supabaseCode = 'code' in result ? result.code : null
    const rollbackFailed = 'rollbackFailed' in result ? result.rollbackFailed : false
    const rollbackDetails = 'rollbackDetails' in result ? result.rollbackDetails : []

    console.error('[api/admin/users/create] create user failed', {
      adminUserId: user.id,
      step: failedStep,
      code: supabaseCode ?? null,
      message: result.message,
      details: result.details,
      rollbackFailed,
      rollbackDetails,
    })

    return Response.json(
      {
        ok: false,
        error: {
          step: failedStep,
          code: 'CREATE_USER_FAILED',
          message: result.message,
          supabaseCode,
          details: [
            `Failed step: ${failedStep}`,
            ...(supabaseCode ? [`Supabase code: ${supabaseCode}`] : []),
            ...result.details,
            ...(rollbackFailed
              ? ['Rollback step failed: rollback.deleteUser', ...rollbackDetails]
              : []),
          ],
        },
      },
      { status: 400 }
    )
  }

  return Response.json({ ok: true, data: result.data }, { status: 201 })
}
