# Phase 4-5 RBAC Implementation Guide

## Overview

This document explains the layered admin access system for Only Bangers, which combines a temporary Phase 4 admin gate with groundwork for Phase 5 database-backed RBAC.

**Architecture:**
1. **Middleware** – Validates Supabase auth + `ob_admin` cookie
2. **Page Logic** – Checks database role (`user_roles` table)
3. **API Routes** – Enforce fine-grained role requirements

---

## Files Created/Modified

### New Files

```
src/lib/auth/get-user-role.ts       # Helper to fetch user + role
src/lib/auth/require-role.ts        # Middleware for API routes
src/app/api/admin/whoami/route.ts   # Get current user + role
src/app/api/admin/test/route.ts     # Test RBAC endpoint
SUPABASE_RBAC_SETUP.sql             # Database setup script
PHASE_4_5_IMPLEMENTATION.md         # This file
```

### Modified Files

```
.env.local                          # Added ADMIN_SECRET
src/middleware.ts                   # Already has Phase 4 gate (unchanged)
src/app/admin/page.tsx              # Now role-aware, shows access messages
src/app/admin/admin.module.css      # Added message card styles
```

---

## Setup Instructions

### 1. Supabase Database Setup

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Go to **SQL Editor** → **New Query**
3. Copy the entire contents of `SUPABASE_RBAC_SETUP.sql`
4. Paste into the SQL editor
5. Click **Execute**

✅ This creates:
- `user_role` enum
- `user_roles` table with RLS
- SQL functions (`get_my_role()`, `user_has_role()`, `assign_owner_by_email()`)

### 2. Assign First Owner

After setup, assign your email as owner by running:

```sql
SELECT assign_owner_by_email('your-email@example.com');
```

Example:
```sql
SELECT assign_owner_by_email('dev@onlybangers.co.za');
```

This creates a row in `user_roles` with your user_id and role = 'owner'.

### 3. Environment Variables

Your `.env.local` already has:

```dotenv
ADMIN_SECRET=dev_phase_4_temp_secret_change_me_in_production
```

For local development, this is fine. In production, use a strong random secret.

---

## How It Works

### Access Flow

```
1. User tries to access /admin
   ↓
2. Middleware checks:
   - Is user logged in with Supabase? NO → Redirect to /login
   - Does user have ob_admin cookie? NO → Redirect to /admin/unlock
   - ✓ Both pass → allow to page
   ↓
3. Page (`/admin/page.tsx`) calls `/api/admin/whoami`
   ↓
4. whoami fetches user_roles table:
   - Role = 'owner' or 'admin'? → Show dashboard
   - Role = 'client' or null? → Show "Access Denied" message
   ↓
5. Admin sections use `/api/admin/*` routes
   - Each route calls requireRole(['owner', 'admin'])
   - Returns 403 if user doesn't have required role
```

### Phase 4 vs Phase 5

**Phase 4 (Current):**
- `ADMIN_SECRET` cookie + `ob_admin` cookie check
- Page-level role display (info only)
- Temporary gate for development

**Phase 5 (Future):**
- Remove `ADMIN_SECRET` entirely
- Remove `ob_admin` cookie check
- Pure database-backed RBAC on all routes
- Comments in code (see below) show replacement points

---

## Testing Locally

### Test 1: Login and Get Access Denied

1. Go to `http://localhost:3001/login`
2. Sign in with Google (or your test account)
3. Go to `http://localhost:3001/admin`
4. You should see **"Access Denied"** message (you need admin role)

### Test 2: Unlock with Admin Secret

1. You're still on the "Access Denied" page
2. You won't see `/admin/unlock` until you use the secret
3. Actually, middleware will redirect you to `/admin/unlock` if you DON'T have the cookie
4. Submit the secret from `.env.local`
5. Cookie is set, page shows dashboard

### Test 3: Verify Role in Database

1. Go to Supabase → **Table Editor**
2. Open `user_roles` table
3. Confirm your user_id is in there with role = 'owner'

### Test 4: Call Test API

Once you're an owner in the database:

```bash
curl http://localhost:3001/api/admin/test
# Response: { ok: true, message: "Admin access confirmed", role: "owner", ... }
```

### Test 5: Non-Admin User

1. Create a second account or use a different email
2. Log in with that account
3. Go to `/admin`
4. Middleware will let you through (auth + cookie)
5. Page shows "Access Denied" because no role in database

---

## Upgrading to Phase 5

When ready to remove the temporary admin gate:

### Step 1: Update Middleware

**Find this in `src/middleware.ts`:**

```typescript
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
```

**Replace with:**

```typescript
// Phase 5: Pure RBAC - only check Supabase auth
// Role enforcement happens in page/API route logic
```

### Step 2: Delete Unlock Route

Remove `src/app/admin/unlock/` directory entirely.

### Step 3: Update Page

**In `src/app/admin/page.tsx`**, the role check already happens at page level via `getUserRole()`. No changes needed; it will work automatically once middleware allows access.

### Step 4: Remove Environment Variable

Delete `ADMIN_SECRET` from `.env.local` and `.env.production`.

---

## File Reference

### `src/lib/auth/get-user-role.ts`

Exports:
- `getUserRole()` – Returns `{ user, role }`
- `hasRole(allowedRoles)` – Check if user has any of the roles

Usage:
```typescript
const { user, role } = await getUserRole();
if (role === 'owner') {
  // Admin logic
}
```

### `src/lib/auth/require-role.ts`

Exports:
- `requireRole(request, allowedRoles)` – Returns error response or null

Usage in API routes:
```typescript
const error = await requireRole(request, ['owner', 'admin']);
if (error) return error;
// Safe to proceed
```

### `src/middleware.ts`

Already set up with:
- Supabase auth check
- `ob_admin` cookie check (Phase 4)
- Protects `/portal` and `/admin`

Comment at top says: "Phase 4: Temporary admin gate – check admin secret cookie"

### `src/app/admin/page.tsx`

Now client-side with role fetching:
- Calls `/api/admin/whoami` on mount
- Shows dashboard if role is 'owner' or 'admin'
- Shows "Access Denied" otherwise

Phase 5 note in banner.

### `SUPABASE_RBAC_SETUP.sql`

Full SQL script with:
- Enum, table, RLS, functions
- Line-by-line comments
- Usage examples

---

## Common Tasks

### Manually Check User Roles

In Supabase SQL Editor:

```sql
SELECT u.email, ur.role, ur.assigned_at, ur.updated_at
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
ORDER BY ur.assigned_at DESC;
```

### Change a User's Role

```sql
UPDATE user_roles
SET role = 'admin'::user_role, updated_at = NOW()
WHERE user_id = 'USER-UUID-HERE';
```

### Remove a User's Admin Role

```sql
UPDATE user_roles
SET role = 'client'::user_role, updated_at = NOW()
WHERE user_id = 'USER-UUID-HERE';
```

### Delete All Roles (Fresh Start)

```sql
DELETE FROM user_roles;
```

---

## Notes

- **Supabase RLS**: The `user_roles` table has RLS enabled. Clients can only read their own role.
- **Service Role**: In API routes, we use the `@supabase/ssr` client which respects RLS.
- **Cookies**: The `ob_admin` cookie is httpOnly (secure) by default.
- **Defaults**: New users default to 'client' role until assigned otherwise.
- **Enums**: The `user_role` enum is immutable in Postgres; to add roles, create a new enum and migrate.

---

## Support

If you run into issues:

1. Check Supabase SQL Editor for table setup errors
2. Verify `.env.local` has `ADMIN_SECRET` set
3. Check browser cookies for `ob_admin` value
4. Check Supabase logs for RLS policy errors
5. Restart dev server after `.env.local` changes

---

## Next Steps

- Deploy to Vercel
- Move `ADMIN_SECRET` to Vercel environment secrets (not .env.production)
- In Phase 5, remove temporary gate and go pure RBAC
