import { NextRequest } from 'next/server'
import { updateContactMessage } from '@/lib/contact-messages/service'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const body = await request.json().catch(() => ({}))
  const result = await updateContactMessage(id, {
    status: body.status,
    adminNotes: body.adminNotes,
  })

  if (!result.ok) {
    const status =
      result.code === 'FORBIDDEN'
        ? 403
        : result.code === 'DATABASE_ERROR'
          ? 500
          : 400

    return Response.json(
      {
        ok: false,
        error: {
          code: result.code,
          message: result.message,
        },
      },
      { status }
    )
  }

  return Response.json({ ok: true, data: result.data })
}
