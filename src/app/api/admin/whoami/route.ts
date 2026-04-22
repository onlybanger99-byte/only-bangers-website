/**
 * GET /api/admin/whoami
 * Return current user's email and role.
 * Requires the authenticated admin role.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { getUserRole } from '@/lib/auth/get-user-role';
import { requireRole } from '@/lib/auth/require-role';

export async function GET(request: NextRequest) {
  try {
    const roleError = await requireRole(request, ['admin']);

    if (roleError) {
      return roleError;
    }

    const { user, role } = await getUserRole();

    if (!user) {
      return NextResponse.json(null, { status: 401 });
    }

    return NextResponse.json({
      email: user.email,
      role,
    });
  } catch (error) {
    console.error('[/api/admin/whoami] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
