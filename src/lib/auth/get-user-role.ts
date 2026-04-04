/**
 * Helper to get the current authenticated user and their role.
 * Phase 5: This will be the single source for role-based access control.
 * Phase 4: Works alongside temporary ADMIN_SECRET cookie check.
 */

import { createClient } from '@/lib/supabase/server';

export type UserRole = 'owner' | 'admin' | 'barber' | 'client' | null;

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

    const role = (data?.role as UserRole) || null;

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
export async function hasRole(allowedRoles: UserRole[]): Promise<boolean> {
  const { role } = await getUserRole();
  return allowedRoles.includes(role);
}
