# Latecomers Project — Copilot Fix Prompt

This file describes every bug, security issue, and improvement needed in this codebase.
For each issue the exact file, the problem, and the exact code change required is provided.
Apply all changes as described.

---

## Fix 1 — Authentication Hang & Role Flicker
**File:** `src/hooks/useAuth.tsx`

**Problems:**
- `supabase.auth.getSession()` has no timeout. If Supabase is slow or a free-tier instance is cold-starting, the app hangs on "Checking authentication..." indefinitely.
- `fetchUserDetails` is fired as a floating `.then()` promise, so `setLoading(false)` runs before the user's role is available. This causes role-dependent UI (admin controls, floor staff buttons) to flicker on load.
- `fetchUserDetails` is called twice on load — once in `initializeAuth` and once in the `onAuthStateChange` listener.

**Replace the entire `useEffect` block and `fetchUserDetails` function with this:**

```typescript
const fetchUserDetails = async (userId: string): Promise<UserDetails | null> => {
  try {
    const { data, error } = await supabase
      .from('user_details')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user details:', error);
      return null;
    }
    return data as UserDetails;
  } catch (error) {
    console.error('Error fetching user details:', error);
    return null;
  }
};

useEffect(() => {
  let isMounted = true;

  const initializeAuth = async () => {
    try {
      // Race getSession against a 5s timeout to prevent indefinite hang
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
        setTimeout(() => resolve({ data: { session: null } }), 5000)
      );

      const { data: { session: currentSession } } = await Promise.race([
        sessionPromise,
        timeoutPromise,
      ]);

      if (isMounted && currentSession?.user) {
        setSession(currentSession);
        setUser({
          id: currentSession.user.id,
          email: currentSession.user.email || '',
          user_metadata: currentSession.user.user_metadata as AuthUser['user_metadata'],
        });
        // Await details so loading only clears once role is known — prevents flicker
        const details = await fetchUserDetails(currentSession.user.id);
        if (isMounted) setUserDetails(details);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  initializeAuth();

  // onAuthStateChange handles all subsequent session changes (login, logout, token refresh)
  // It does NOT need to call fetchUserDetails on INITIAL_SESSION since initializeAuth handles that
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, currentSession) => {
      if (event === 'INITIAL_SESSION') return; // Already handled above

      if (currentSession?.user) {
        setSession(currentSession);
        setUser({
          id: currentSession.user.id,
          email: currentSession.user.email || '',
          user_metadata: currentSession.user.user_metadata as AuthUser['user_metadata'],
        });
        const details = await fetchUserDetails(currentSession.user.id);
        if (isMounted) setUserDetails(details);
      } else {
        setSession(null);
        setUser(null);
        setUserDetails(null);
      }
    }
  );

  return () => {
    isMounted = false;
    subscription.unsubscribe();
  };
}, []);
```

---

## Fix 2 — Staff Creation Uses Insecure Client-Side signUp (Session Hijack Risk)
**File:** `src/hooks/useAdmin.ts` → `useCreateStaffUser()`

**Problem:** The current code calls `supabase.auth.signUp()` from the client, which overwrites the admin's active session with the new user's session. It then tries to restore it with `setSession()`. This is a race condition — any in-flight React Query refetch during that window runs with wrong credentials. If `setSession` fails, the admin is silently logged out.

The Edge Function at `supabase/functions/create-staff-user/index.ts` already exists and handles this correctly using the service role key. The frontend must call it instead.

**Replace the entire `useCreateStaffUser` function with:**

```typescript
export function useCreateStaffUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: StaffUserInput) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-staff-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(input),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create staff user');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffUsers'] });
      toast.success('Staff user created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create staff user: ${error.message}`);
    },
  });
}
```

---

## Fix 3 — Staff Deletion Only Removes `user_details`, Not `auth.users`
**File:** `src/hooks/useAdmin.ts` → `useDeleteStaffUser()`

**Problem:** The current code only deletes from `public.user_details`. The deleted user's login credentials remain active in `auth.users` — they can still sign in. The comment in the code even acknowledges this: `// Note: Actually deleting auth user requires admin API`.

The Edge Function has been updated to handle `DELETE` requests and removes the user from both `user_details` and `auth.users` using the service role key.

**Replace the entire `useDeleteStaffUser` function with:**

```typescript
export function useDeleteStaffUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-staff-user`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to delete user');
      }

      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffUsers'] });
      toast.success('Staff user deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete staff user: ${error.message}`);
    },
  });
}
```

---

## Fix 4 — Admin Route Has No Role Guard
**File:** `src/components/Auth/ProtectedRoute.tsx` and `src/App.tsx`

**Problem:** Any authenticated user (staff, floor_staff) can navigate directly to `/admin`. Role enforcement is done inside the panel itself, but the route is not protected. If `userDetails` fails to load, `isAdmin` is `false` and no guard triggers at all.

**Replace `ProtectedRoute.tsx` entirely with:**

```typescript
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { FullPageLoader } from '@/components/Shared';
import type { UserRole } from '@/types/database.types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, userRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FullPageLoader message="Checking authentication..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
```

**Then in `src/App.tsx`, find the admin route and update it to:**

```tsx
<Route
  path="/admin"
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminPanel />
    </ProtectedRoute>
  }
/>
```

---

## Fix 5 — `useDeleteStudent` Silently Ignores Failed Cascade Delete
**File:** `src/hooks/useAdmin.ts` → `useDeleteStudent()`

**Problem:** If deleting `late_comings` records fails, the code logs a `console.warn` and continues to delete the student anyway. This can leave orphaned rows in the database.

**Find this block:**

```typescript
if (lateComingsError) {
  console.warn('Error deleting late comings:', lateComingsError);
}
```

**Replace it with:**

```typescript
if (lateComingsError) {
  throw new Error(`Failed to delete late records: ${lateComingsError.message}`);
}
```

---

## Fix 6 — Duplicate Late Entries Are Not Prevented
**File:** `src/hooks/useLateComers.ts` → `useAddLateComing()`

**Problem:** Nothing prevents the same student from being recorded as late twice on the same date. If a unique constraint exists on `(register_number, date)`, the error surfaced will be a raw Postgres message. If no constraint exists, silent duplicates are created.

**Replace the `mutationFn` inside `useAddLateComing` with:**

```typescript
mutationFn: async (record: LateComingInsert) => {
  // Check for existing entry for this student on this date
  const { data: existing } = await supabase
    .from('late_comings')
    .select('register_number')
    .eq('register_number', record.register_number)
    .eq('date', record.date)
    .maybeSingle();

  if (existing) {
    throw new Error('This student already has a late entry for this date.');
  }

  const { data, error } = await supabase
    .from('late_comings')
    .insert(record as any)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
},
```

---

## Fix 7 — Remove `console.log` Left in Production Code
**File:** `src/hooks/useLateComers.ts` → `useDepartments()`

**Find and delete this line:**

```typescript
console.log('Departments fetched:', data);
```

---

## Fix 8 — Reduce Redundant Polling Interval
**File:** `src/hooks/useLateComers.ts` → `useLateComers()`

**Problem:** The hook both subscribes to real-time Postgres changes AND polls every 30 seconds. The real-time subscription already handles live updates. The poll is kept as a fallback for dropped WebSocket connections but 30s is too aggressive.

**Find:**

```typescript
refetchInterval: 30000, // Auto-refresh every 30 seconds
```

**Replace with:**

```typescript
// Polling as fallback only — real-time subscription handles live updates.
// 60s interval reduces noise while still recovering if the WebSocket drops.
refetchInterval: 60000,
```

---

## Summary of Files Changed

| File | Changes |
|------|---------|
| `src/hooks/useAuth.tsx` | Fix auth hang (5s timeout), fix role flicker (await details before clearing loading), deduplicate `fetchUserDetails` call, add `isMounted` guard |
| `src/hooks/useAdmin.ts` | `useCreateStaffUser` → call Edge Function via POST; `useDeleteStaffUser` → call Edge Function via DELETE (fixes ghost auth accounts); `useDeleteStudent` → throw on cascade error instead of silent warn |
| `src/hooks/useLateComers.ts` | Add duplicate entry check in `useAddLateComing`; remove `console.log`; increase poll interval to 60s |
| `src/components/Auth/ProtectedRoute.tsx` | Add optional `requiredRole` prop; redirect non-admins away from protected routes |
| `src/App.tsx` | Pass `requiredRole="admin"` to the `/admin` route |
