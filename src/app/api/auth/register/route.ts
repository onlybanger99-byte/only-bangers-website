import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(request: NextRequest) {
  const adminClient = createAdminClient()

  if (!adminClient) {
    return Response.json(
      {
        ok: false,
        error: {
          code: 'SERVER_MISCONFIGURED',
          message: 'Account creation is not configured right now. Please contact support.',
        },
      },
      { status: 500 }
    )
  }

  const body = await request.json().catch(() => null)
  const email = normalizeText(body?.email).toLowerCase()
  const password = normalizeText(body?.password)
  const confirmPassword = normalizeText(body?.confirmPassword)

  if (!email || !password || !confirmPassword) {
    return Response.json(
      {
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email, password, and confirm password are required.',
        },
      },
      { status: 400 }
    )
  }

  if (password.length < 6) {
    return Response.json(
      {
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password must be at least 6 characters long.',
        },
      },
      { status: 400 }
    )
  }

  if (password !== confirmPassword) {
    return Response.json(
      {
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password and confirm password must match.',
        },
      },
      { status: 400 }
    )
  }

  const createdUser = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createdUser.error || !createdUser.data.user) {
    return Response.json(
      {
        ok: false,
        error: {
          code: 'SIGNUP_FAILED',
          message: createdUser.error?.message ?? 'We could not create this account.',
        },
      },
      { status: 400 }
    )
  }

  const userId = createdUser.data.user.id

  const { error: roleError } = await adminClient
    .from('user_roles')
    .upsert({ user_id: userId, role: 'customer' }, { onConflict: 'user_id' })

  if (roleError) {
    await adminClient.auth.admin.deleteUser(userId)

    return Response.json(
      {
        ok: false,
        error: {
          code: 'ROLE_ASSIGNMENT_FAILED',
          message: 'Your account was created, but customer access could not be assigned.',
          details: [roleError.message],
        },
      },
      { status: 500 }
    )
  }

  return Response.json({
    ok: true,
    data: {
      userId,
      email,
      role: 'customer',
    },
  })
}
