/**
 * Helper to get the current authenticated user and their role.
 * This is the shared source of truth for app-level role checks.
 */

import { createClient } from '@/lib/supabase/server';
import { hasRequiredRole, normalizeRole, type AppRole, type UserRole } from './roles';

export type { AppRole, UserRole } from './roles';

export interface UserWithRole {
  user: {
    id: string;
    email?: string;
  } | null;
  role: UserRole;
}

/**
 * Get the current authenticated user and their role from user_roles table.
 * Returns the role as null if no role record exists yet.
 */
export async function getUserRole(): Promise<UserWithRole> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { user: null, role: null };
    }

    // Query user_roles table
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is expected for new users
      console.error('[getUserRole] Query error:', error);
      return { user, role: null };
    }

    const role = normalizeRole(data?.role);

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      role,
    };
  } catch (error) {
    console.error('[getUserRole] Unexpected error:', error);
    return { user: null, role: null };
  }
}

/**
 * Check if a user has any of the allowed roles.
 * Useful for page-level access checks.
 */
export async function hasRole(allowedRoles: readonly AppRole[]): Promise<boolean> {
  const { role } = await getUserRole();
  return hasRequiredRole(role, allowedRoles);
}
