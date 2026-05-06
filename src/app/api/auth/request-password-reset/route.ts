import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const email = normalizeText(body?.email).toLowerCase()

  if (!email) {
    return Response.json(
      { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Enter your email address first.' } },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${request.nextUrl.origin}/profile/complete?setup=1`,
  })

  if (error) {
    return Response.json(
      {
        ok: false,
        error: {
          code: error.code ?? 'PASSWORD_RESET_FAILED',
          message: error.message,
          details: ['Check Supabase email provider and redirect URL configuration if this keeps failing.'],
        },
      },
      { status: 400 }
    )
  }

  return Response.json({
    ok: true,
    message: 'Check your email for the password setup or recovery link.',
  })
}
