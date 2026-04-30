import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeNextPath } from '@/lib/auth/next-path'
import { getDefaultDashboardForRole, normalizeRole } from '@/lib/auth/roles'
import { getCustomerProfileCompletionState } from '@/lib/customer-profiles/service'

function createLoginRedirect(requestUrl: URL, reason: string) {
  const url = new URL('/login', requestUrl.origin)
  url.searchParams.set('error', reason)
  return NextResponse.redirect(url)
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const nextPath = sanitizeNextPath(requestUrl.searchParams.get('next'))

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

  if (nextPath) {
    if (role === 'customer') {
      const profile = await getCustomerProfileCompletionState(user.id)

      if (!profile.isComplete) {
        const profileUrl = new URL('/portal/profile/complete', requestUrl.origin)
        profileUrl.searchParams.set('next', nextPath)
        return NextResponse.redirect(profileUrl)
      }
    }

    return NextResponse.redirect(new URL(nextPath, requestUrl.origin))
  }

  if (role === 'customer') {
    const profile = await getCustomerProfileCompletionState(user.id)

    if (!profile.isComplete) {
      const profileUrl = new URL('/portal/profile/complete', requestUrl.origin)
      profileUrl.searchParams.set('next', '/portal/dashboard')
      return NextResponse.redirect(profileUrl)
    }
  }

  return NextResponse.redirect(new URL(getDefaultDashboardForRole(role), requestUrl.origin))
}
