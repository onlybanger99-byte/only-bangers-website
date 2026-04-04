/**
 * GET /api/admin/test
 * Test endpoint to verify role-based access is working.
 * Requires 'owner' or 'admin' role.
 * Phase 4: Works alongside temporary ADMIN_SECRET cookie check.
 * Phase 5: Will use pure RBAC.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth/require-role';
import { getUserRole } from '@/lib/auth/get-user-role';

export async function GET(request: NextRequest) {
  // Check if user has admin/owner role
  const roleError = await requireRole(request, ['owner', 'admin']);
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
