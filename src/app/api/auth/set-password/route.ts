import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return Response.json(
      { ok: false, error: { code: 'UNAUTHORIZED', message: 'You must be signed in to set or change your password.' } },
      { status: 401 }
    )
  }

  const body = await request.json().catch(() => null)
  const password = normalizeText(body?.password)
  const confirmPassword = normalizeText(body?.confirmPassword)

  if (!password) {
    return Response.json(
      { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Enter a new password before saving.' } },
      { status: 400 }
    )
  }

  if (password !== confirmPassword) {
    return Response.json(
      { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Password and confirm password must match.' } },
      { status: 400 }
    )
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return Response.json(
      {
        ok: false,
        error: {
          code: error.code ?? 'PASSWORD_UPDATE_FAILED',
          message: error.message,
        },
      },
      { status: 400 }
    )
  }

  return Response.json({
    ok: true,
    message: 'Password saved successfully.',
  })
}
