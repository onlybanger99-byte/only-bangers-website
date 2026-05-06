import { getUserRole } from '@/lib/auth/get-user-role'
import { uploadServiceImageAsAdmin } from '@/lib/services/service'
import type { NextRequest } from 'next/server'

export async function POST(
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

  if (role !== 'admin') {
    return Response.json(
      { ok: false, error: { code: 'FORBIDDEN', message: 'Only admins can upload service media.' } },
      { status: 403 }
    )
  }

  const formData = await request.formData().catch(() => null)
  const file = formData?.get('file')
  const field = formData?.get('field')
  const { id } = await context.params

  if (!(file instanceof File)) {
    return Response.json(
      { ok: false, error: { code: 'INVALID_FILE', message: 'Choose an image before uploading.' } },
      { status: 400 }
    )
  }

  const result = await uploadServiceImageAsAdmin({
    id,
    file,
    field: field === 'background' ? 'background' : 'image',
  })

  if (!result.ok) {
    return Response.json(
      { ok: false, error: { code: 'UPLOAD_FAILED', message: result.message, details: result.details } },
      { status: 400 }
    )
  }

  return Response.json({ ok: true, data: result.data })
}
