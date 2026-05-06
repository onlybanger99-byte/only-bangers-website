import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeNextPath } from '@/lib/auth/next-path'
import { getDefaultDashboardForRole, normalizeRole } from '@/lib/auth/roles'
import { ensureUserBootstrap } from '@/lib/auth/bootstrap-user'
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
  const isMagicLinkProfileSetup = nextPath === '/portal/profile/complete'

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

  const bootstrapResult = await ensureUserBootstrap({
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata,
  })

  if (!bootstrapResult.ok) {
    console.warn('[auth/callback] User bootstrap fallback did not complete cleanly:', bootstrapResult.message)
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

  const profile = await getCustomerProfileCompletionState(user.id)
  const defaultDashboard = getDefaultDashboardForRole(role)
  const resolvedNextPath =
    role === 'customer' && nextPath
      ? nextPath
      : defaultDashboard

  if (isMagicLinkProfileSetup) {
    return NextResponse.redirect(new URL('/portal/profile/complete?setup=1', requestUrl.origin))
  }

  if (!profile.isComplete) {
    const profileUrl = new URL('/portal/profile/complete', requestUrl.origin)
    profileUrl.searchParams.set('next', resolvedNextPath)
    profileUrl.searchParams.set('setup', '1')
    return NextResponse.redirect(profileUrl)
  }

  return NextResponse.redirect(new URL(resolvedNextPath, requestUrl.origin))
}
