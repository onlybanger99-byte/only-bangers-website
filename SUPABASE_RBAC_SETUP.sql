/**
 * Supabase RBAC Setup for Only Bangers
 * Phase 4-5: Role-Based Access Control Foundation
 * 
 * Instructions:
 * 1. Go to Supabase Dashboard → SQL Editor
 * 2. Create a new query
 * 3. Copy and paste the entire SQL script below
 * 4. Run it (Select all, then Execute)
 * 
 * This creates:
 * - user_role enum type
 * - user_roles table with RLS policies
 * - SQL function to get current user's role
 * - Bootstrap function to assign first owner
 */

-- 1. Create the user_role enum type
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'barber', 'client');

-- 2. Create the user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'client',
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add RLS (Row Level Security) to user_roles table
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy: Users can only read their own role
CREATE POLICY "Users can read only their own role"
  ON user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- 5. RLS Policy: Only authenticated users can insert (for signup), or service role
CREATE POLICY "Service role can manage roles"
  ON user_roles
  FOR ALL
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 6. Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- 7. SQL function to get current user's role (easy to call from app)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM user_roles WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE;

-- 8. Bootstrap function: Assign owner role to first admin by email
-- Usage: SELECT assign_owner_by_email('your-email@example.com');
CREATE OR REPLACE FUNCTION assign_owner_by_email(email TEXT)
RETURNS TABLE(user_id UUID, email TEXT, role user_role, assigned BOOLEAN) AS $$
DECLARE
  target_user UUID;
BEGIN
  -- Find user by email
  SELECT id INTO target_user FROM auth.users WHERE email = $1;
  
  IF target_user IS NULL THEN
    RAISE EXCEPTION 'User not found with email: %', $1;
  END IF;
  
  -- Upsert role
  INSERT INTO user_roles (user_id, role, assigned_at)
  VALUES (target_user, 'owner'::user_role, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET 
    role = 'owner'::user_role,
    updated_at = NOW();
  
  -- Return confirmation
  RETURN QUERY
    SELECT target_user, $1::TEXT, 'owner'::user_role, TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create function to check if user has a specific role
-- Usage: SELECT user_has_role(auth.uid(), 'owner');
CREATE OR REPLACE FUNCTION user_has_role(check_user_id UUID, check_role user_role)
RETURNS BOOLEAN AS $$
DECLARE
  user_actual_role user_role;
BEGIN
  SELECT role INTO user_actual_role FROM user_roles WHERE user_id = check_user_id;
  RETURN user_actual_role = check_role;
END;
$$ LANGUAGE plpgsql STABLE;

-- 10. Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_role(UUID, user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_owner_by_email(TEXT) TO authenticated;

-- ============================================================================
-- HOW TO USE:
-- ============================================================================
--
-- A. Assign the first owner (run this once):
--    SELECT assign_owner_by_email('your-email@example.com');
--
-- B. Check a user's role (from SQL):
--    SELECT get_my_role();
--
-- C. To manually assign roles:
--    INSERT INTO user_roles (user_id, role) 
--    VALUES ('some-uuid-here', 'admin'::user_role)
--    ON CONFLICT (user_id) DO UPDATE SET role = 'admin'::user_role;
--
-- D. To view all roles (admin only):
--    SELECT u.email, ur.role, ur.assigned_at 
--    FROM user_roles ur
--    JOIN auth.users u ON ur.user_id = u.id;
--
-- ============================================================================
