import { NextRequest } from 'next/server'
import { getUserRole } from '@/lib/auth/get-user-role'
import {
  deactivateBarberServicePrice,
  updateBarberServicePrice,
} from '@/lib/barber-service-prices/service'

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
  const result = await updateBarberServicePrice(user.id, id, {
    serviceId: body.serviceId,
    serviceName: body.serviceName,
    price: body.price,
    durationMinutes: body.durationMinutes,
    isActive: typeof body.isActive === 'boolean' ? body.isActive : undefined,
  })

  if (!result.ok) {
    return Response.json(
      { ok: false, error: { code: 'VALIDATION_ERROR', message: result.message, details: result.details } },
      { status: 400 }
    )
  }

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
  const result = await deactivateBarberServicePrice(user.id, id)

  if (!result.ok) {
    return Response.json(
      { ok: false, error: { code: 'VALIDATION_ERROR', message: result.message, details: result.details } },
      { status: 400 }
    )
  }

  return Response.json({ ok: true, data: result.data })
}
