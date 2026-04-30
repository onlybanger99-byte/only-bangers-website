import { NextRequest } from 'next/server'
import {
  createBarberAvailabilitySlot,
  listBarberAvailabilitySlots,
} from '@/lib/barber-availability/service'
import { getUserRole } from '@/lib/auth/get-user-role'

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
      { ok: false, error: { code: 'FORBIDDEN', message: 'Only barbers can manage availability.' } },
      { status: 403 }
    )
  }

  const result = await listBarberAvailabilitySlots(user.id)

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
      { ok: false, error: { code: 'FORBIDDEN', message: 'Only barbers can manage availability.' } },
      { status: 403 }
    )
  }

  const body = await request.json()
  const result = await createBarberAvailabilitySlot(user.id, {
    availableDate: body.available_date,
    startTime: body.start_time,
    endTime: body.end_time,
  })

  if (!result.ok) {
    return Response.json(
      {
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: result.message,
          details: result.details,
        },
      },
      { status: 400 }
    )
  }

  return Response.json({ ok: true, data: result.data }, { status: 201 })
}
