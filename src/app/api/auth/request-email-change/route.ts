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
      { ok: false, error: { code: 'UNAUTHORIZED', message: 'You must be signed in to change your email.' } },
      { status: 401 }
    )
  }

  const body = await request.json().catch(() => null)
  const newEmail = normalizeText(body?.newEmail).toLowerCase()

  if (!newEmail) {
    return Response.json(
      { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Enter the new email address you want to use.' } },
      { status: 400 }
    )
  }

  if (user.email?.toLowerCase() === newEmail) {
    return Response.json(
      { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Enter a different email address to continue.' } },
      { status: 400 }
    )
  }

  const { error } = await supabase.auth.updateUser(
    { email: newEmail },
    { emailRedirectTo: `${request.nextUrl.origin}/auth/callback` }
  )

  if (error) {
    return Response.json(
      {
        ok: false,
        error: {
          code: error.code ?? 'EMAIL_CHANGE_FAILED',
          message: error.message,
        },
      },
      { status: 400 }
    )
  }

  return Response.json({
    ok: true,
    message: 'Check your new email address to verify the change before it becomes active.',
  })
}
