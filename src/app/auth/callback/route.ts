import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDefaultDashboardForRole, normalizeRole } from '@/lib/auth/roles'

function createLoginRedirect(requestUrl: URL, reason: string) {
  const url = new URL('/login', requestUrl.origin)
  url.searchParams.set('error', reason)
  return NextResponse.redirect(url)
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (!code) {
    return createLoginRedirect(requestUrl, 'missing-code')
  }

  const supabase = await createClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('[auth/callback] Failed to exchange auth code:', exchangeError)
    return createLoginRedirect(requestUrl, 'auth-failed')
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('[auth/callback] Failed to resolve authenticated user:', userError)
    return createLoginRedirect(requestUrl, 'session-missing')
  }

  const { data, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (roleError) {
    console.error('[auth/callback] Failed to resolve role:', roleError)
    return createLoginRedirect(requestUrl, 'role-lookup-failed')
  }

  const role = normalizeRole(data?.role)

  if (!role) {
    return createLoginRedirect(requestUrl, 'missing-role')
  }

  return NextResponse.redirect(new URL(getDefaultDashboardForRole(role), requestUrl.origin))
}
