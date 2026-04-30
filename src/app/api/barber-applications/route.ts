import { NextRequest } from 'next/server'
import { createBarberApplication } from '@/lib/barber-applications/service'
import { getUserRole } from '@/lib/auth/get-user-role'

export async function POST(request: NextRequest) {
  const { user, role } = await getUserRole()

  if (!user) {
    return Response.json(
      { ok: false, error: { code: 'UNAUTHORIZED', message: 'You must be signed in.' } },
      { status: 401 }
    )
  }

  if (role !== 'customer') {
    return Response.json(
      { ok: false, error: { code: 'FORBIDDEN', message: 'Only customers can submit barber applications.' } },
      { status: 403 }
    )
  }

  const body = await request.json()
  const result = await createBarberApplication(user.id, {
    cuttingLocation: body.cuttingLocation,
    instagramUrl: body.instagramUrl,
    tiktokUrl: body.tiktokUrl,
    facebookUrl: body.facebookUrl,
    portfolioUrl: body.portfolioUrl,
    bio: body.bio,
    availableDays: Array.isArray(body.availableDays) ? body.availableDays : [],
    availableStartTime: body.availableStartTime,
    availableEndTime: body.availableEndTime,
    notes: body.notes,
  })

  if (!result.ok) {
    return Response.json(
      {
        ok: false,
        error: {
          code: result.code,
          message: result.message,
          details: result.details,
        },
      },
      { status: result.code === 'INCOMPLETE_PROFILE' ? 400 : result.code === 'FORBIDDEN' ? 403 : 400 }
    )
  }

  return Response.json({ ok: true, data: result.data }, { status: 201 })
}
