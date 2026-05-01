import {
  removeBarberAvailabilitySlot,
  updateBarberAvailabilitySlot,
} from '@/lib/barber-availability/service'
import { getUserRole } from '@/lib/auth/get-user-role'
import type { NextRequest } from 'next/server'

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
      { ok: false, error: { code: 'FORBIDDEN', message: 'Only barbers can manage availability.' } },
      { status: 403 }
    )
  }

  const { id } = await context.params
  const result = await removeBarberAvailabilitySlot(user.id, id)

  if (!result.ok) {
    return Response.json(
      { ok: false, error: { code: 'DATABASE_ERROR', message: result.message, details: result.details } },
      { status: 400 }
    )
  }

  return Response.json({ ok: true })
}

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
      { ok: false, error: { code: 'FORBIDDEN', message: 'Only barbers can manage availability.' } },
      { status: 403 }
    )
  }

  const body = await request.json()
  const { id } = await context.params
  const result = await updateBarberAvailabilitySlot(user.id, id, {
    availableDate: body.available_date,
    startTime: body.start_time,
    endTime: body.end_time,
  })

  if (!result.ok) {
    return Response.json(
      { ok: false, error: { code: 'VALIDATION_ERROR', message: result.message, details: result.details } },
      { status: 400 }
    )
  }

  return Response.json({ ok: true, data: result.data })
}
