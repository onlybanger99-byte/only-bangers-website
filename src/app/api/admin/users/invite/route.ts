import type { NextRequest } from 'next/server'
import { getUserRole } from '@/lib/auth/get-user-role'
import { inviteUserByEmailAsAdmin } from '@/lib/admin-users/service'

export async function POST(request: NextRequest) {
  const { user, role } = await getUserRole()

  if (!user) {
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
    return Response.json(
      {
        ok: false,
        error: {
          step: 'admin_role_check',
          code: 'FORBIDDEN',
          message: 'Only admins can send invites.',
          details: [`Current role: ${role ?? 'none'}`],
        },
      },
      { status: 403 }
    )
  }

  const body = await request.json().catch(() => null)
  const result = await inviteUserByEmailAsAdmin({
    email: body?.email,
    role: body?.role,
    displayName: body?.displayName,
    redirectTo: `${request.nextUrl.origin}/profile/complete?setup=1`,
  })

  if (!result.ok) {
    const failedStep = 'step' in result ? result.step : 'supabase.auth.admin.inviteUserByEmail'
    const supabaseCode = 'code' in result ? result.code : null

    return Response.json(
      {
        ok: false,
        error: {
          step: failedStep,
          code: 'INVITE_FAILED',
          message: result.message,
          supabaseCode,
          details: [
            `Failed step: ${failedStep}`,
            ...(supabaseCode ? [`Supabase code: ${supabaseCode}`] : []),
            ...result.details,
          ],
        },
      },
      { status: 400 }
    )
  }

  return Response.json(
    {
      ok: true,
      message: 'Invitation sent to email.',
      data: result.data,
    },
    { status: 201 }
  )
}
