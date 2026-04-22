/**
 * GET /api/admin/test
 * Test endpoint to verify role-based access is working.
 * Requires 'admin' role.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth/require-role';
import { getUserRole } from '@/lib/auth/get-user-role';

export async function GET(request: NextRequest) {
  const roleError = await requireRole(request, ['admin']);
  if (roleError) return roleError;

  // If we got here, user is authorized
  const { user, role } = await getUserRole();

  return NextResponse.json({
    ok: true,
    message: 'Admin access confirmed',
    user: {
      id: user?.id,
      email: user?.email,
    },
    role,
    timestamp: new Date().toISOString(),
  });
}
