import { NextRequest } from 'next/server'
import { getUserRole } from '@/lib/auth/get-user-role'
import {
  deactivateBarberServicePrice,
  updateBarberServicePrice,
} from '@/lib/barber-service-prices/service'
import { isUuid } from '@/lib/services/service'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { user, role } = await getUserRole()

  if (!user) {
    return Response.json(
      { ok: false, error: { code: 'UNAUTHORIZED', message: 'You must be signed in.' } },
      { status: 401 }
    )
  }

  if (role !== 'barber') {
    return Response.json(
      { ok: false, error: { code: 'FORBIDDEN', message: 'Only barbers can manage service prices.' } },
      { status: 403 }
    )
  }

  const { id } = await context.params
  const body = await request.json()
  console.info('[api/barber/service-prices/[id]] PATCH request', {
    authUserId: user.id,
    role,
    priceId: id,
    serviceId: body?.serviceId ?? null,
    price: body?.price ?? null,
    durationMinutes: body?.durationMinutes ?? null,
    isActive: body?.isActive ?? null,
  })

  if (typeof body.serviceName === 'string' && body.serviceName.trim().length > 0) {
    return Response.json(
      { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Custom service names are not allowed.' } },
      { status: 400 }
    )
  }

  if (typeof body.serviceId !== 'string' || !isUuid(body.serviceId)) {
    return Response.json(
      {
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'service_id is required and must be a valid service UUID.',
        },
      },
      { status: 400 }
    )
  }

  const result = await updateBarberServicePrice(user.id, id, {
    serviceId: body.serviceId,
    price: body.price,
    durationMinutes: body.durationMinutes,
    isActive: typeof body.isActive === 'boolean' ? body.isActive : undefined,
  })

  if (!result.ok) {
    console.error('[api/barber/service-prices/[id]] PATCH failed', {
      authUserId: user.id,
      priceId: id,
      errorMessage: result.message,
      errorDetails: result.details ?? [],
    })
    return Response.json(
      { ok: false, error: { code: 'VALIDATION_ERROR', message: result.message, details: result.details } },
      { status: 400 }
    )
  }

  console.info('[api/barber/service-prices/[id]] PATCH success', {
    authUserId: user.id,
    priceId: result.data.id,
    serviceId: result.data.serviceId,
    serviceName: result.data.serviceName,
  })

  return Response.json({ ok: true, data: result.data })
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { user, role } = await getUserRole()

  if (!user) {
    return Response.json(
      { ok: false, error: { code: 'UNAUTHORIZED', message: 'You must be signed in.' } },
      { status: 401 }
    )
  }

  if (role !== 'barber') {
    return Response.json(
      { ok: false, error: { code: 'FORBIDDEN', message: 'Only barbers can manage service prices.' } },
      { status: 403 }
    )
  }

  const { id } = await context.params
  console.info('[api/barber/service-prices/[id]] DELETE request', {
    authUserId: user.id,
    role,
    priceId: id,
  })
  const result = await deactivateBarberServicePrice(user.id, id)

  if (!result.ok) {
    console.error('[api/barber/service-prices/[id]] DELETE failed', {
      authUserId: user.id,
      priceId: id,
      errorMessage: result.message,
      errorDetails: result.details ?? [],
    })
    return Response.json(
      { ok: false, error: { code: 'VALIDATION_ERROR', message: result.message, details: result.details } },
      { status: 400 }
    )
  }

  return Response.json({ ok: true, data: result.data })
}
