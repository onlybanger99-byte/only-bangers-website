import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  ROLE_ROUTE_ACCESS,
  hasRequiredRole,
  getDefaultDashboardForRole,
  normalizeRole,
  type UserRole,
} from '@/lib/auth/roles'

async function resolveSessionAndRole(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { user: null, role: null as UserRole }
  }

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('[middleware] Failed to resolve role:', error)
    return { user, role: null as UserRole }
  }

  return {
    user,
    role: normalizeRole(data?.role),
  }
}

function createLoginRedirect(request: NextRequest, reason?: string) {
  const url = new URL('/login', request.url)

  if (reason) {
    url.searchParams.set('error', reason)
  }

  return NextResponse.redirect(url)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected =
    pathname.startsWith('/portal') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/barber')

  if (!isProtected) {
    return NextResponse.next()
  }

  const response = NextResponse.next()
  const { user, role } = await resolveSessionAndRole(request, response)

  if (!user) {
    return createLoginRedirect(request)
  }

  if (!role) {
    return createLoginRedirect(request, 'missing-role')
  }

  if (pathname === '/admin' || pathname === '/admin/login' || pathname === '/admin/unlock') {
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }

    return NextResponse.redirect(new URL(getDefaultDashboardForRole(role), request.url))
  }

  if (pathname.startsWith('/admin')) {
    if (!hasRequiredRole(role, ROLE_ROUTE_ACCESS.admin)) {
      return NextResponse.redirect(new URL(getDefaultDashboardForRole(role), request.url))
    }

    return response
  }

  if (pathname.startsWith('/barber')) {
    if (!hasRequiredRole(role, ROLE_ROUTE_ACCESS.barber)) {
      return NextResponse.redirect(new URL(getDefaultDashboardForRole(role), request.url))
    }

    return response
  }

  if (!hasRequiredRole(role, ROLE_ROUTE_ACCESS.portal)) {
    return NextResponse.redirect(new URL(getDefaultDashboardForRole(role), request.url))
  }

  return response
}

export const config = {
  matcher: ['/portal/:path*', '/admin/:path*', '/barber/:path*'],
}
