import type { NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth/require-role'
import { deactivateBarberProfile, updateBarberProfileAsAdmin } from '@/lib/admin-users/service'
import { reviewBarberGoLiveRequest } from '@/lib/barber-applications/service'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authError = await requireRole(request, ['admin'])

  if (authError) {
    return authError
  }

  const { id } = await context.params
  const body = await request.json()
  const result = await updateBarberProfileAsAdmin({
    userId: id,
    displayName: body.displayName,
    specialty: body.specialty,
    bio: body.bio,
    cuttingLocation: body.cuttingLocation,
    instagramUrl: body.instagramUrl,
    tiktokUrl: body.tiktokUrl,
    facebookUrl: body.facebookUrl,
    portfolioUrl: body.portfolioUrl,
    isActive: body.isActive !== false,
  })

  if (!result.ok) {
    return Response.json(
      { ok: false, error: { code: 'DATABASE_ERROR', message: result.message, details: result.details } },
      { status: 400 }
    )
  }

  return Response.json({ ok: true })
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authError = await requireRole(request, ['admin'])

  if (authError) {
    return authError
  }

  const { id } = await context.params
  const body = await request.json().catch(() => ({}))

  if (
    body?.action !== 'deactivate' &&
    body?.action !== 'approve_go_live' &&
    body?.action !== 'reject_go_live'
  ) {
    return Response.json(
      { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Unsupported barber action.' } },
      { status: 400 }
    )
  }

  if (body?.action === 'approve_go_live' || body?.action === 'reject_go_live') {
    const result = await reviewBarberGoLiveRequest({
      userId: id,
      action: body.action,
      rejectionReason: body.rejectionReason,
    })

    if (!result.ok) {
      return Response.json(
        { ok: false, error: { code: 'DATABASE_ERROR', message: result.message, details: result.details } },
        { status: 400 }
      )
    }

    return Response.json({ ok: true })
  }

  const result = await deactivateBarberProfile(id)

  if (!result.ok) {
    return Response.json(
      { ok: false, error: { code: 'DATABASE_ERROR', message: result.message, details: result.details } },
      { status: 400 }
    )
  }

  return Response.json({ ok: true })
}
