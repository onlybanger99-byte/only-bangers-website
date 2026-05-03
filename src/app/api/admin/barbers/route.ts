import type { NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth/require-role'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const authError = await requireRole(request, ['admin'])

  if (authError) {
    return authError
  }

  const adminClient = createAdminClient()

  if (!adminClient) {
    return Response.json(
      { ok: false, error: { code: 'CONFIG_ERROR', message: 'Supabase service role is not configured.' } },
      { status: 500 }
    )
  }

  const { data, error } = await adminClient
    .from('barber_profiles')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    return Response.json(
      { ok: false, error: { code: 'DATABASE_ERROR', message: error.message } },
      { status: 400 }
    )
  }

  return Response.json({ ok: true, data: data ?? [] })
}
