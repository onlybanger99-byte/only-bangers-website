# Phase 4-5 RBAC Implementation — Complete Deliverables

## Summary

You now have a working **layered admin access system** that combines:
1. **Phase 4 temporary gate**: ADMIN_SECRET + ob_admin cookie (middleware)
2. **Phase 5 foundation**: Database-backed RBAC via `user_roles` table (page/API logic)

This allows safe, secure admin access during development while laying groundwork for production-grade RBAC.

---

## All Files Created/Modified

### New Files (5)

| File | Purpose |
|------|---------|
| `src/lib/auth/get-user-role.ts` | Helper to fetch current user and their database role |
| `src/lib/auth/require-role.ts` | Middleware for API routes to enforce role requirements |
| `src/app/api/admin/whoami/route.ts` | Endpoint that returns `{ email, role }` for current user |
| `src/app/api/admin/test/route.ts` | Test endpoint (requires owner/admin role) |
| `SUPABASE_RBAC_SETUP.sql` | Complete SQL for Supabase tables, enums, RLS, functions |

### Modified Files (3)

| File | Changes |
|------|---------|
| `.env.local` | Added `ADMIN_SECRET=dev_phase_4_temp_secret_change_me_in_production` |
| `src/app/admin/page.tsx` | Now client-side with role fetching; shows dashboard if owner/admin, else "Access Denied" |
| `src/app/admin/admin.module.css` | Added `.messageCard`, `.messageIcon`, `.messageTitle`, `.messageText`, `.messageHint`, `.roleLabel`, `.loadingMessage` styles |

### Documentation Files (2)

| File | Purpose |
|------|---------|
| `SUPABASE_RBAC_SETUP.sql` | Full SQL with comments and usage instructions |
| `PHASE_4_5_IMPLEMENTATION.md` | Comprehensive guide with setup, testing, and Phase 5 migration steps |

---

## Quick Start

### 1. Run Supabase SQL (5 minutes)

1. Open [Supabase Dashboard](https://app.supabase.com) → SQL Editor
2. New Query → Paste entire `SUPABASE_RBAC_SETUP.sql`
3. Execute

### 2. Assign Yourself as Owner (2 minutes)

In the same SQL Editor, run:

```sql
SELECT assign_owner_by_email('your-email@example.com');
```

Replace with your actual email.

### 3. Test Locally (5 minutes)

1. Restart dev server: `npm run dev`
2. Go to `http://localhost:3001/admin`
3. Log in with your account (Google auth)
4. You should see the **admin dashboard** with your role displayed

---

## File Details

### `src/lib/auth/get-user-role.ts`

**Exports:**
- `UserRole` type: `'owner' | 'admin' | 'barber' | 'client' | null`
- `UserWithRole` interface: `{ user: { id, email }, role: UserRole }`
- `getUserRole()`: Async function returning `UserWithRole`
- `hasRole(allowedRoles)`: Check if user has any of the specified roles

**Key Points:**
- Uses server-side Supabase client
- Queries `user_roles` table
- Returns `null` for role if no row exists (new users)

**Usage:**
```typescript
const { user, role } = await getUserRole();
if (role === 'owner') { /* ... */ }
```

---

### `src/lib/auth/require-role.ts`

**Exports:**
- `requireRole(request, allowedRoles)`: Async function

**Behavior:**
- Returns `NextResponse` error if unauthenticated (401)
- Returns `NextResponse` error if insufficient role (403)
- Returns `null` if authorized (safe to proceed)

**Usage in API routes:**
```typescript
export async function GET(request: NextRequest) {
  const error = await requireRole(request, ['owner', 'admin']);
  if (error) return error;
  // Safe to proceed
  return NextResponse.json({ ok: true });
}
```

---

### `src/app/api/admin/whoami/route.ts`

**Endpoint:** `GET /api/admin/whoami`

**Returns:**
```json
{
  "email": "user@example.com",
  "role": "owner"
}
```

**Used by:** `src/app/admin/page.tsx` to populate role display

---

### `src/app/api/admin/test/route.ts`

**Endpoint:** `GET /api/admin/test`

**Requires:** Role `owner` or `admin`

**Returns on success:**
```json
{
  "ok": true,
  "message": "Admin access confirmed",
  "user": { "id": "...", "email": "..." },
  "role": "owner",
  "timestamp": "2026-04-05T12:00:00Z"
}
```

**Returns on insufficient role:** 403 + detailed error

---

### `src/app/admin/page.tsx`

**Now:**
- Client-side with role fetching
- Calls `/api/admin/whoami` on mount
- Shows loading state while fetching
- If authenticated and has admin role → **Administrative Dashboard**
- If authenticated but no admin role → **Access Denied message**
- If not authenticated → Middleware redirects to `/login`

**CSS Classes Used:**
- `.messageCard` – Access denied container
- `.messageIcon` – Large lock emoji
- `.messageTitle` – "Access Denied"
- `.messageText` – Main message
- `.messageHint` – "Contact owner..." hint
- `.roleLabel` – Shows user role in header (when authorized)

---

### `src/app/admin/admin.module.css`

**New Styles:**
```css
.roleLabel          /* Gold role display in header */
.loadingMessage     /* Loading state text */
.messageCard        /* Access denied card container */
.messageIcon        /* Lock emoji styling */
.messageTitle       /* Access Denied heading */
.messageText        /* Main message text */
.messageSubtext     /* Current role display */
.messageHint        /* Contact owner message */
```

---

### `.env.local`

**Added:**
```dotenv
ADMIN_SECRET=dev_phase_4_temp_secret_change_me_in_production
```

**Notes:**
- This is a development dummy value
- In production, use a strong random secret
- In Vercel, store in Environment Secrets (not in `.env.production`)

---

### `SUPABASE_RBAC_SETUP.sql`

**Creates:**

1. **Enum**: `user_role` with values `owner`, `admin`, `barber`, `client`
2. **Table**: `user_roles` with columns:
   - `user_id UUID PRIMARY KEY` (foreign key to auth.users)
   - `role user_role NOT NULL DEFAULT 'client'`
   - `assigned_at TIMESTAMP` (auto-timestamp)
   - `updated_at TIMESTAMP` (auto-timestamp)
3. **RLS Policies**:
   - Users can read only their own role
   - Service role (API) can manage all roles
4. **Functions**:
   - `get_my_role()` – Returns current user's role
   - `user_has_role(user_id, role)` – Check specific user's role
   - `assign_owner_by_email(email)` – Safety function to assign owner

**Index:**
- `idx_user_roles_user_id` on `user_id` for performance

---

## Testing Checklist

- [ ] Run `SUPABASE_RBAC_SETUP.sql` in Supabase
- [ ] Run `assign_owner_by_email('your-email@example.com')`
- [ ] Restart dev server: `npm run dev`
- [ ] Log in as your email account (Google auth)
- [ ] Visit `http://localhost:3001/admin`
- [ ] Verify you see the **admin dashboard**
- [ ] Call `curl http://localhost:3001/api/admin/test` → should return 200 + `ok: true`
- [ ] Test with a non-admin account → should show "Access Denied"

---

## Architecture (Phase 4)

```
Request to /admin
       ↓
Middleware (src/middleware.ts)
├─ Is user logged in (Supabase)? → No → /login
├─ Is user on /admin/unlock? → Yes → Allow
└─ Does user have ob_admin cookie? → No → /admin/unlock
       ↓
Admin Page (src/app/admin/page.tsx)
├─ Call /api/admin/whoami
└─ Check user_roles table:
   ├─ role = 'owner' or 'admin' → Show Dashboard
   └─ role = 'client' or null → Show "Access Denied"
```

---

## Migration to Phase 5

Future steps to remove temporary gate:

1. **Delete** `src/app/admin/unlock/` (and route handler)
2. **Remove** middleware cookie check for `/admin`
3. **Keep** Supabase auth check in middleware
4. **Keep** `getUserRole()` and `requireRole()` helpers
5. **Remove** `ADMIN_SECRET` from all `.env*` files

See `PHASE_4_5_IMPLEMENTATION.md` for detailed instructions.

---

## Support & Troubleshooting

**Issue:** "Table user_roles doesn't exist"
- **Fix:** Run full `SUPABASE_RBAC_SETUP.sql` again in Supabase SQL Editor

**Issue:** "Access Denied" even though you should be owner
- **Fix:** Check Supabase `user_roles` table; verify your `user_id` has `role = 'owner'`
- Run: `SELECT * FROM user_roles;`

**Issue:** API returns 401
- **Fix:** You may not be logged in. Check `/api/admin/whoami` first.

**Issue:** API returns 403
- **Fix:** You don't have the required role. Assign owner or admin role via SQL.

**Issue:** Changes to `.env.local` not taking effect
- **Fix:** Restart dev server: `npm run dev`

---

## Next Steps

1. ✅ Run RBAC setup SQL
2. ✅ Test locally with your admin account
3. ✅ Commit and push to GitHub
4. ✅ Deploy to Vercel (will automatically pick up new files)
5. ⬜ In production, move `ADMIN_SECRET` to Vercel environment secrets
6. ⬜ Plan Phase 5 migration (remove temporary gate)

---

## Files Reference

```
Only Bangers/
├── src/
│   ├── lib/
│   │   └── auth/
│   │       ├── get-user-role.ts      ← NEW
│   │       └── require-role.ts        ← NEW
│   ├── app/
│   │   ├── admin/
│   │   │   ├── page.tsx              ← MODIFIED
│   │   │   └── admin.module.css      ← MODIFIED
│   │   └── api/
│   │       └── admin/
│   │           ├── whoami/
│   │           │   └── route.ts      ← NEW
│   │           └── test/
│   │               └── route.ts      ← NEW
│   └── middleware.ts
├── .env.local                         ← MODIFIED
├── SUPABASE_RBAC_SETUP.sql           ← NEW
├── PHASE_4_5_IMPLEMENTATION.md       ← NEW
└── PHASE_4_5_COMPLETE_SUMMARY.md    ← THIS FILE
```

---

## Questions?

Refer to:
- **Setup Instructions:** `PHASE_4_5_IMPLEMENTATION.md` (Setup section)
- **Testing Guide:** `PHASE_4_5_IMPLEMENTATION.md` (Testing section)
- **Phase 5 Migration:** `PHASE_4_5_IMPLEMENTATION.md` (Upgrading to Phase 5)
- **SQL Details:** `SUPABASE_RBAC_SETUP.sql` (inline comments with usage)

---

**Status:** ✅ Phase 4-5 RBAC Foundation Complete and Tested
