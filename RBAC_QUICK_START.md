# Phase 4-5 RBAC Setup — Quick Start

## ✅ What Was Just Created

**5 TypeScript Files:**
- `src/lib/auth/get-user-role.ts` – Fetch user + database role
- `src/lib/auth/require-role.ts` – Enforce roles in API routes
- `src/app/api/admin/whoami/route.ts` – Get current user's role
- `src/app/api/admin/test/route.ts` – Test admin access
- `src/app/admin/page.tsx` – UPDATED to show role-aware dashboard

**3 Documentation Files:**
- `SUPABASE_RBAC_SETUP.sql` – Complete SQL for database
- `PHASE_4_5_IMPLEMENTATION.md` – Full guide with testing steps
- `PHASE_4_5_COMPLETE_SUMMARY.md` – Detailed file reference

**2 Config Updates:**
- `.env.local` – Added `ADMIN_SECRET` for Phase 4 gate
- `src/app/admin/admin.module.css` – Added message card styles

---

## 🚀 Next Steps (Do This Now)

### Step 1: Run SQL in Supabase (5 min)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. **SQL Editor** → **New Query**
3. Copy **entire** contents of `SUPABASE_RBAC_SETUP.sql`
4. Paste and **Execute**

### Step 2: Assign Yourself as Owner (2 min)

In the same SQL tab, run:

```sql
SELECT assign_owner_by_email('your-email@example.com');
```

### Step 3: Restart Dev Server (2 min)

```bash
npm run dev
```

### Step 4: Test (5 min)

1. Go to `http://localhost:3001/admin`
2. Log in with Google (your email)
3. You should see the **admin dashboard** with your role

✅ **You're done!**

---

## 🔑 How It Works

```
/admin route
   ↓
Middleware (checks: logged in? + admin cookie? ✓)
   ↓
Page (calls /api/admin/whoami)
   ↓
Database (checks: user_roles table)
   ↓
If role = 'owner' or 'admin' → Dashboard
If role = 'client' or null → Access Denied
```

---

## 📞 Troubleshooting

| Problem | Solution |
|---------|----------|
| Table doesn't exist | Run full SQL again in Supabase |
| Still get "Access Denied" | Verify in Supabase: `SELECT * FROM user_roles;` |
| Changes not working | Restart: `npm run dev` |
| Need to test API | Call `http://localhost:3001/api/admin/test` |

---

## 📚 Full Guides

- **Setup Details:** `PHASE_4_5_IMPLEMENTATION.md`
- **File Reference:** `PHASE_4_5_COMPLETE_SUMMARY.md`
- **SQL Details:** Comments in `SUPABASE_RBAC_SETUP.sql`

---

## 🎯 What You Have Now

✅ **Database-backed roles** (owner, admin, barber, client)  
✅ **Temporary Phase 4 gate** (ADMIN_SECRET cookie)  
✅ **Role-aware admin page** (shows dashboard or denied)  
✅ **API route protection** (enforce roles on endpoints)  
✅ **Clean code** (ready for Phase 5 upgrade)  

---

## 🔄 Upgrading to Phase 5 Later

When ready to remove temporary gate:
1. Delete `/admin/unlock` route
2. Remove middleware cookie check
3. Remove `ADMIN_SECRET` from `.env.*`
4. Keep database roles and helpers

See `PHASE_4_5_IMPLEMENTATION.md` → "Upgrading to Phase 5" for full steps.

---

**Questions?** Check the docs files. Everything is well-commented.
