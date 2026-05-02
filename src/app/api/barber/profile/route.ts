import { NextRequest } from 'next/server'
import { submitBarberGoLiveRequest, updateApprovedBarberProfile } from '@/lib/barber-applications/service'
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
    mapUrl: body.mapUrl,
    bio: body.bio,
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

export async function POST(request: NextRequest) {
  const { user, role } = await getUserRole()

  if (!user) {
    return Response.json(
      { ok: false, error: { code: 'UNAUTHORIZED', message: 'You must be signed in.' } },
      { status: 401 }
    )
  }

  if (role !== 'barber') {
    return Response.json(
      { ok: false, error: { code: 'FORBIDDEN', message: 'Only approved barbers can request go-live.' } },
      { status: 403 }
    )
  }

  const body = await request.json().catch(() => ({}))

  if (body?.action !== 'request_go_live') {
    return Response.json(
      { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Unsupported barber profile action.' } },
      { status: 400 }
    )
  }

  const result = await submitBarberGoLiveRequest(user.id)

  if (!result.ok) {
    return Response.json(
      { ok: false, error: { code: 'DATABASE_ERROR', message: result.message, details: result.details } },
      { status: 400 }
    )
  }

  return Response.json({ ok: true })
}
