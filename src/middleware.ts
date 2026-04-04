import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const protectedRoutes = ['/portal', '/admin'];
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));

  if (!isProtected) return NextResponse.next();

  // Create a response object to modify cookies
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Phase 4: Temporary admin gate - check admin secret cookie for /admin routes
  if (pathname.startsWith('/admin')) {
    const adminCookie = request.cookies.get('ob_admin')?.value;
    const adminSecret = process.env.ADMIN_SECRET;

    // Allow access to /admin/unlock without admin cookie
    if (pathname === '/admin/unlock') {
      return response;
    }

    // For all other /admin routes, require valid admin cookie
    if (!adminCookie || adminCookie !== adminSecret) {
      return NextResponse.redirect(new URL('/admin/unlock', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/portal/:path*', '/admin/:path*'],
};