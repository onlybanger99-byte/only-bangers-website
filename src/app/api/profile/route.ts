import { NextRequest } from 'next/server'
import { getUserRole } from '@/lib/auth/get-user-role'
import {
  getCustomerProfileCompletionState,
  upsertCustomerProfile,
} from '@/lib/customer-profiles/service'

export async function GET() {
  const { user } = await getUserRole()

  if (!user) {
    return Response.json(
      { ok: false, error: { code: 'UNAUTHORIZED', message: 'You must be signed in.' } },
      { status: 401 }
    )
  }

  const completionState = await getCustomerProfileCompletionState(user.id)

  return Response.json({
    ok: true,
    data: {
      profile: completionState.profile,
      requiredFieldsComplete: completionState.isComplete,
      completionState,
    },
  })
}

export async function PUT(request: NextRequest) {
  const { user } = await getUserRole()

  if (!user) {
    return Response.json(
      { ok: false, error: { code: 'UNAUTHORIZED', message: 'You must be signed in.' } },
      { status: 401 }
    )
  }

  const body = await request.json()
  const result = await upsertCustomerProfile(user.id, {
    firstName: body.firstName,
    lastName: body.lastName,
    phoneNumber: body.phoneNumber,
    profileImageUrl: body.profileImageUrl,
  })

  if (!result.ok) {
    return Response.json(
      {
        ok: false,
        error: {
          code: 'INCOMPLETE_PROFILE',
          message: result.message,
          details: result.details,
        },
      },
      { status: 400 }
    )
  }

  return Response.json({ ok: true, data: result.data })
}
