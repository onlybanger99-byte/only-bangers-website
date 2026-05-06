import { NextRequest } from 'next/server'
import { createContactMessage } from '@/lib/contact-messages/service'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const result = await createContactMessage({
    subject: body.subject,
    message: body.message,
  })

  if (!result.ok) {
    const status =
      result.code === 'UNAUTHORIZED'
        ? 401
        : result.code === 'VALIDATION_ERROR'
          ? 400
          : 500

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
