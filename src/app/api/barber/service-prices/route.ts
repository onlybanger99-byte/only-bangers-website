import { NextRequest } from 'next/server'
import { getUserRole } from '@/lib/auth/get-user-role'
import {
  createBarberServicePrice,
  listBarberServicePricesForOwner,
} from '@/lib/barber-service-prices/service'

export async function GET() {
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

  const result = await listBarberServicePricesForOwner(user.id)

  if (!result.ok) {
    return Response.json(
      { ok: false, error: { code: 'DATABASE_ERROR', message: result.message } },
      { status: 500 }
    )
  }

  return Response.json({ ok: true, data: result.data })
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
      { ok: false, error: { code: 'FORBIDDEN', message: 'Only barbers can manage service prices.' } },
      { status: 403 }
    )
  }

  const body = await request.json()

  if (typeof body.serviceName === 'string' && body.serviceName.trim().length > 0) {
    return Response.json(
      { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Custom service names are not allowed.' } },
      { status: 400 }
    )
  }

  const result = await createBarberServicePrice(user.id, {
    serviceId: body.serviceId,
    price: body.price,
    durationMinutes: body.durationMinutes,
    isActive: body.isActive,
  })

  if (!result.ok) {
    return Response.json(
      { ok: false, error: { code: 'VALIDATION_ERROR', message: result.message, details: result.details } },
      { status: 400 }
    )
  }

  return Response.json({ ok: true, data: result.data }, { status: 201 })
}
