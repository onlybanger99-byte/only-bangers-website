/**
 * Middleware helper for API routes that require specific roles.
 * Phase 5: This will replace the temporary ADMIN_SECRET check.
 * Phase 4: Used alongside cookie checks for defense-in-depth.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { UserRole } from './get-user-role';

/**
 * Requires that the request is from an authenticated user with one of the allowed roles.
 * Returns an error response if not authorized, otherwise returns null.
 *
 * Usage in API routes:
 * ```
 * const error = await requireRole(request, ['admin', 'owner']);
 * if (error) return error;
 * // Safe to proceed with authenticated admin user
 * ```
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<NextResponse | null> {
  try {
    // Create Supabase client
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

    // Check authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Not authenticated' },
        { status: 401 }
      );
    }

    // Check role
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const userRole = data?.role as UserRole;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json(
        {
          error: 'Forbidden: Insufficient permissions',
          requiredRoles: allowedRoles,
          userRole: userRole || 'none',
        },
        { status: 403 }
      );
    }

    // Authorization passed
    return null;
  } catch (error) {
    console.error('[requireRole] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
