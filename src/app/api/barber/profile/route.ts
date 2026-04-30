import { NextRequest } from 'next/server'
import { updateApprovedBarberProfile } from '@/lib/barber-applications/service'
import { getUserRole } from '@/lib/auth/get-user-role'

export async function PUT(request: NextRequest) {
  const { user, role } = await getUserRole()

  if (!user) {
    return Response.json(
      { ok: false, error: { code: 'UNAUTHORIZED', message: 'You must be signed in.' } },
      { status: 401 }
    )
  }

  if (role !== 'barber') {
    return Response.json(
      { ok: false, error: { code: 'FORBIDDEN', message: 'Only approved barbers can edit barber profile details.' } },
      { status: 403 }
    )
  }

  const body = await request.json()
  const result = await updateApprovedBarberProfile(user.id, {
    displayName: body.displayName,
    cuttingLocation: body.cuttingLocation,
    instagramUrl: body.instagramUrl,
    tiktokUrl: body.tiktokUrl,
    facebookUrl: body.facebookUrl,
    portfolioUrl: body.portfolioUrl,
    bio: body.bio,
    availableDays: Array.isArray(body.availableDays) ? body.availableDays : [],
    availableStartTime: body.availableStartTime,
    availableEndTime: body.availableEndTime,
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
      { status: 400 }
    )
  }

  return Response.json({ ok: true })
}
