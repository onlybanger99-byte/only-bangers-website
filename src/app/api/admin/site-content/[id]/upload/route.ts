import type { NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth/require-role'
import { uploadSiteContentAsset } from '@/lib/site-content/service'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authError = await requireRole(request, ['admin'])

  if (authError) {
    return authError
  }

  const formData = await request.formData()
  const file = formData.get('file')
  const { id } = await context.params

  if (!(file instanceof File)) {
    return Response.json(
      { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Upload a file before saving.' } },
      { status: 400 }
    )
  }

  const result = await uploadSiteContentAsset(id, file)

  if (!result.ok) {
    return Response.json(
      { ok: false, error: { code: 'UPLOAD_ERROR', message: result.message, details: result.details } },
      { status: 400 }
    )
  }

  return Response.json({ ok: true, data: result.data })
}
