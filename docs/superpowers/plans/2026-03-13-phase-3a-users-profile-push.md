# Phase 3A: Users, Profile-Review, Push-Notifications V2 Rewrite

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite 3 admin pages (`users`, `profile-review`, `push-notifications`) as native v2 pages using React Query hooks and BFF proxy routing, with feature flag gating for safe rollback.

**Architecture:** Minimal v2 pattern — each v2 page calls `patchAdminAxios()` so ALL existing sub-components and service calls work unchanged through BFF proxy. React Query hooks are thin wrappers around existing `AdminService.*` / `axiosServer.*` calls. Server component `page.tsx` gates v2 behind `isAdminShellV2Enabled() && getRouteMode(route) === 'v2'`.

**Tech Stack:** Next.js 14 App Router, React Query (TanStack Query), MUI, TypeScript, Axios with BFF interceptor patching

**Critical Rule:** React Query hooks MUST call existing service functions verbatim (e.g., `AdminService.userReview.getPendingUsers()`). NO new API endpoints, NO new types, NO modified request/response shapes. This prevents backend API format mismatches that plagued Phase 2.

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `app/admin/users/page.tsx` | MODIFY | Server component: feature flag routing |
| `app/admin/users/users-legacy.tsx` | CREATE | Verbatim copy of current page.tsx content + LegacyPageAdapter wrapper |
| `app/admin/users/users-v2.tsx` | CREATE | V2 client component: patchAdminAxios + React Query for primary data |
| `app/admin/users/hooks.ts` | CREATE | React Query hooks wrapping axiosServer calls |
| `app/admin/profile-review/page.tsx` | MODIFY | Server component: feature flag routing |
| `app/admin/profile-review/profile-review-legacy.tsx` | CREATE | Verbatim copy of current page.tsx content + LegacyPageAdapter wrapper |
| `app/admin/profile-review/profile-review-v2.tsx` | CREATE | V2 client component: patchAdminAxios + React Query |
| `app/admin/profile-review/hooks.ts` | CREATE | React Query hooks wrapping AdminService.userReview calls |
| `app/admin/push-notifications/page.tsx` | MODIFY | Server component: feature flag routing |
| `app/admin/push-notifications/push-notifications-legacy.tsx` | CREATE | Verbatim copy of current page.tsx content + LegacyPageAdapter wrapper |
| `app/admin/push-notifications/push-notifications-v2.tsx` | CREATE | V2 client component: patchAdminAxios + React Query |
| `app/admin/push-notifications/hooks.ts` | CREATE | React Query hooks wrapping AdminService.pushNotifications calls |

---

## Chunk 1: Users Page

### Task 1: Extract users-legacy.tsx

**Files:**
- Create: `app/admin/users/users-legacy.tsx`
- Modify: `app/admin/users/page.tsx`

- [ ] **Step 1: Create users-legacy.tsx**

Copy the ENTIRE current content of `app/admin/users/page.tsx` into `users-legacy.tsx`. Wrap with `LegacyPageAdapter`. The file structure is:

```tsx
// app/admin/users/users-legacy.tsx
'use client';

// ... ALL imports from current page.tsx verbatim ...
import { LegacyPageAdapter } from '@/shared/ui/admin/legacy-page-adapter';

// ALL types from current page.tsx verbatim (User, ApiResponse, ProfileImage, etc.)

// Rename the default export function to UsersPageContent
function UsersPageContent() {
  // ... ENTIRE current page.tsx body verbatim ...
}

export default function UsersLegacy() {
  return (
    <LegacyPageAdapter>
      <UsersPageContent />
    </LegacyPageAdapter>
  );
}
```

**IMPORTANT:** The current `page.tsx` is 931 lines. Copy every line verbatim into the inner function. Do NOT modify any logic, imports, or types. Only rename the main function and add the LegacyPageAdapter wrapper.

- [ ] **Step 2: Rewrite page.tsx as server component router**

```tsx
// app/admin/users/page.tsx
import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import UsersLegacy from './users-legacy';
import UsersV2 from './users-v2';

export default async function UsersPage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('users');

  if (shellV2 && mode === 'v2') {
    return <UsersV2 />;
  }

  return <UsersLegacy />;
}
```

- [ ] **Step 3: Verify legacy path still works**

Run: `npm run build`
Expected: Zero build errors. The legacy path loads identically to before.

- [ ] **Step 4: Commit**

```bash
git add app/admin/users/users-legacy.tsx app/admin/users/page.tsx
git commit -m "refactor(users): extract legacy page and add feature flag routing"
```

---

### Task 2: Create users React Query hooks

**Files:**
- Create: `app/admin/users/hooks.ts`

The current `users/page.tsx` uses `axiosServer.get('/admin/users?${params}')` directly (NOT AdminService). The hook wraps this exact call.

- [ ] **Step 1: Create hooks.ts**

```tsx
// app/admin/users/hooks.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import axiosServer from '@/utils/axios';
import { useAdminSession } from '@/shared/contexts/admin-session-context';

/**
 * Fetches paginated user list.
 * Wraps the existing axiosServer.get('/admin/users') call from users/page.tsx.
 * patchAdminAxios() in the parent component routes this through BFF proxy.
 */
export function useUserList(params: {
  page: number;
  limit: number;
  search?: string;
  gender?: string;
  status?: string;
  universityId?: string;
  sortBy?: string;
  sortOrder?: string;
}) {
  const { session } = useAdminSession();

  return useQuery({
    queryKey: ['users', 'list', params, session?.selectedCountry],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });

      const response = await axiosServer.get(`/admin/users?${searchParams.toString()}`);
      return response.data;
    },
    // Keep previous data while fetching next page
    placeholderData: (prev) => prev,
  });
}
```

**NOTE:** This hook wraps the EXACT same `axiosServer.get('/admin/users?...')` call that the current page uses (line ~233 of current page.tsx). `patchAdminAxios()` in the v2 parent rewrites the baseURL to BFF proxy.

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to `app/admin/users/hooks.ts`

- [ ] **Step 3: Commit**

```bash
git add app/admin/users/hooks.ts
git commit -m "feat(users): add React Query hook for user list"
```

---

### Task 3: Create users-v2.tsx

**Files:**
- Create: `app/admin/users/users-v2.tsx`

The v2 page is a transformation of the legacy page with these specific changes:
1. Add `patchAdminAxios()` in useEffect (replaces LegacyPageAdapter)
2. Remove localStorage auth check (`authChecking`/`authError` state + useEffect)
3. Replace manual `fetchUsers` useState+useCallback with `useUserList()` hook for primary list
4. Keep ALL other state (search, filters, modals, pagination) as-is
5. Keep ALL sub-component rendering as-is

- [ ] **Step 1: Create users-v2.tsx**

Start from a copy of the legacy page content. Apply these surgical changes:

1. **Add import** at top:
```tsx
import { patchAdminAxios } from '@/shared/lib/http/admin-axios-interceptor';
import { useUserList } from './hooks';
```

2. **Add patchAdminAxios useEffect** (first useEffect in component):
```tsx
useEffect(() => {
  const unpatch = patchAdminAxios();
  return unpatch;
}, []);
```

3. **Remove** the `useAuth()` import and call (line ~4, ~88 of original: `const { isAdmin } = useAuth();`)

4. **Remove ALL `isAdmin` guards**: The current page uses `isAdmin` as a guard condition in 3 separate useEffects (lines ~91, ~99, ~107). Remove these `isAdmin` conditions — in v2, auth is guaranteed by AdminShell's cookie session. For example:
   - `if (isAdmin) { fetchUsers(); }` → just call `fetchUsers()` directly
   - `if (isAdmin && page > 0) { ... }` → `if (page > 0) { ... }`

5. **Remove** the `useAuth` import from `@/contexts/AuthContext`

6. **Remove** any `authChecking`/`authError` state and render blocks if present

7. **Keep everything else verbatim**: All filter state, modal state, pagination state, user detail fetching, the entire render tree with all MUI components.

The v2 page still uses `axiosServer` directly for individual user detail fetches and other operations — `patchAdminAxios()` ensures these all route through BFF.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Zero build errors

- [ ] **Step 3: Commit**

```bash
git add app/admin/users/users-v2.tsx
git commit -m "feat(users): add v2 page with BFF proxy and React Query"
```

---

## Chunk 2: Profile-Review Page

### Task 4: Extract profile-review-legacy.tsx

**Files:**
- Create: `app/admin/profile-review/profile-review-legacy.tsx`
- Modify: `app/admin/profile-review/page.tsx`

- [ ] **Step 1: Create profile-review-legacy.tsx**

Copy the ENTIRE current content of `app/admin/profile-review/page.tsx` (992 lines) into `profile-review-legacy.tsx`. Wrap with `LegacyPageAdapter`:

```tsx
// app/admin/profile-review/profile-review-legacy.tsx
'use client';

// ... ALL imports from current page.tsx verbatim ...
import { LegacyPageAdapter } from '@/shared/ui/admin/legacy-page-adapter';

// ALL types from current page.tsx verbatim
// (PendingProfileImage, PendingImage, CurrentProfileImage, RejectionHistory, etc.)

// Rename main function
function ProfileReviewPageContent() {
  // ... ENTIRE current page.tsx body verbatim ...
}

export default function ProfileReviewLegacy() {
  return (
    <LegacyPageAdapter>
      <ProfileReviewPageContent />
    </LegacyPageAdapter>
  );
}
```

- [ ] **Step 2: Rewrite page.tsx as server component router**

```tsx
// app/admin/profile-review/page.tsx
import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import ProfileReviewLegacy from './profile-review-legacy';
import ProfileReviewV2 from './profile-review-v2';

export default async function ProfileReviewPage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('profile-review');

  if (shellV2 && mode === 'v2') {
    return <ProfileReviewV2 />;
  }

  return <ProfileReviewLegacy />;
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Zero build errors

- [ ] **Step 4: Commit**

```bash
git add app/admin/profile-review/profile-review-legacy.tsx app/admin/profile-review/page.tsx
git commit -m "refactor(profile-review): extract legacy page and add feature flag routing"
```

---

### Task 5: Create profile-review React Query hooks

**Files:**
- Create: `app/admin/profile-review/hooks.ts`

The current page uses `AdminService.userReview.*` calls. Hooks wrap these exactly.

- [ ] **Step 1: Create hooks.ts**

```tsx
// app/admin/profile-review/hooks.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminService, { type PendingUsersFilter } from '@/app/services/admin';
import { useAdminSession } from '@/shared/contexts/admin-session-context';

/**
 * Fetches pending users for profile review.
 * Wraps AdminService.userReview.getPendingUsers() exactly.
 */
export function usePendingUsers(
  page: number,
  limit: number,
  search?: string,
  filters?: PendingUsersFilter,
  excludeUserIds?: string[],
) {
  const { session } = useAdminSession();

  return useQuery({
    queryKey: ['profile-review', 'pending', page, limit, search, filters, excludeUserIds, session?.selectedCountry],
    queryFn: () => AdminService.userReview.getPendingUsers(page, limit, search, filters, excludeUserIds),
    placeholderData: (prev) => prev,
  });
}

/**
 * Approve user mutation.
 * Wraps AdminService.userReview.approveUser() exactly.
 */
export function useApproveUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => AdminService.userReview.approveUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-review'] });
    },
  });
}

/**
 * Reject user mutation.
 * Wraps AdminService.userReview.rejectUser() exactly.
 */
export function useRejectUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, category, reason }: { userId: string; category: string; reason: string }) =>
      AdminService.userReview.rejectUser(userId, category, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-review'] });
    },
  });
}
```

**API Endpoints (from AdminService.userReview):**
- `getPendingUsers()` → `GET /admin/profile-images/pending`
- `getUserDetail()` → `GET /admin/user-review/{userId}`
- `approveUser()` → `POST /admin/profile-images/users/{userId}/approve`
- `rejectUser()` → `POST /admin/user-review/{userId}/reject`

All calls go through `axiosServer` which `patchAdminAxios()` routes through BFF.

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to hooks.ts. Check that `PendingUsersFilter` is exported from `admin.ts`.

- [ ] **Step 3: Commit**

```bash
git add app/admin/profile-review/hooks.ts
git commit -m "feat(profile-review): add React Query hooks for user review"
```

---

### Task 6: Create profile-review-v2.tsx

**Files:**
- Create: `app/admin/profile-review/profile-review-v2.tsx`

Transformation from legacy content:
1. Add `patchAdminAxios()` in useEffect
2. Remove localStorage auth check (if present — current page may not have one since it relies on LegacyPageAdapter)
3. Keep ALL AdminService calls in sub-components — they work via patchAdminAxios
4. Optionally use `usePendingUsers()` hook for the primary pending users list fetch

- [ ] **Step 1: Create profile-review-v2.tsx**

Start from a copy of the legacy page content. Apply these changes:

1. **Add imports:**
```tsx
import { patchAdminAxios } from '@/shared/lib/http/admin-axios-interceptor';
```

2. **Add patchAdminAxios useEffect** (first useEffect):
```tsx
useEffect(() => {
  const unpatch = patchAdminAxios();
  return unpatch;
}, []);
```

3. **Remove** any `useAuth()` import/call if present

4. **Remove** any localStorage auth check useEffect

5. **Remove** `authChecking`/`authError` state and related render blocks

6. **Keep everything else verbatim:** Tab state, pending users fetch, review panel, reject modal, history tab — all unchanged.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Zero build errors

- [ ] **Step 3: Commit**

```bash
git add app/admin/profile-review/profile-review-v2.tsx
git commit -m "feat(profile-review): add v2 page with BFF proxy"
```

---

## Chunk 3: Push-Notifications Page

### Task 7: Extract push-notifications-legacy.tsx

**Files:**
- Create: `app/admin/push-notifications/push-notifications-legacy.tsx`
- Modify: `app/admin/push-notifications/page.tsx`

- [ ] **Step 1: Create push-notifications-legacy.tsx**

Copy ENTIRE current content of `app/admin/push-notifications/page.tsx` (883 lines) into legacy file:

```tsx
// app/admin/push-notifications/push-notifications-legacy.tsx
'use client';

// ... ALL imports from current page.tsx verbatim ...
import { LegacyPageAdapter } from '@/shared/ui/admin/legacy-page-adapter';

// ALL types if any

function PushNotificationsPageContent() {
  // ... ENTIRE current page.tsx body verbatim ...
}

export default function PushNotificationsLegacy() {
  return (
    <LegacyPageAdapter>
      <PushNotificationsPageContent />
    </LegacyPageAdapter>
  );
}
```

- [ ] **Step 2: Rewrite page.tsx as server component router**

```tsx
// app/admin/push-notifications/page.tsx
import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import PushNotificationsLegacy from './push-notifications-legacy';
import PushNotificationsV2 from './push-notifications-v2';

export default async function PushNotificationsPage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('push-notifications');

  if (shellV2 && mode === 'v2') {
    return <PushNotificationsV2 />;
  }

  return <PushNotificationsLegacy />;
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Zero build errors

- [ ] **Step 4: Commit**

```bash
git add app/admin/push-notifications/push-notifications-legacy.tsx app/admin/push-notifications/page.tsx
git commit -m "refactor(push-notifications): extract legacy page and add feature flag routing"
```

---

### Task 8: Create push-notifications React Query hooks

**Files:**
- Create: `app/admin/push-notifications/hooks.ts`

The current page uses `AdminService.pushNotifications.filterUsers()` and `AdminService.pushNotifications.sendBulkNotification()`.

- [ ] **Step 1: Create hooks.ts**

```tsx
// app/admin/push-notifications/hooks.ts
'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import AdminService from '@/app/services/admin';
import { useAdminSession } from '@/shared/contexts/admin-session-context';

/**
 * Fetches filtered users for push notification targeting.
 * Wraps AdminService.pushNotifications.filterUsers() exactly.
 */
export function useFilteredUsers(
  filters: {
    isDormant?: boolean;
    gender?: string;
    universities?: string[];
    regions?: string[];
    ranks?: string[];
    phoneNumber?: string;
    hasPreferences?: boolean;
  },
  page: number,
  limit: number,
  options?: { enabled?: boolean },
) {
  const { session } = useAdminSession();

  return useQuery({
    queryKey: ['push-notifications', 'filtered-users', filters, page, limit, session?.selectedCountry],
    queryFn: () => AdminService.pushNotifications.filterUsers(filters, page, limit),
    enabled: options?.enabled ?? true,
    placeholderData: (prev) => prev,
  });
}

/**
 * Send bulk push notification mutation.
 * Wraps AdminService.pushNotifications.sendBulkNotification() exactly.
 */
export function useSendBulkNotification() {
  return useMutation({
    mutationFn: (data: { userIds: string[]; title: string; message: string }) =>
      AdminService.pushNotifications.sendBulkNotification(data),
  });
}

/**
 * Fetches university list for filter dropdown.
 * Wraps AdminService.universities.getUniversities() exactly.
 */
export function useUniversities() {
  return useQuery({
    queryKey: ['universities'],
    queryFn: () => AdminService.universities.getUniversities(),
    staleTime: 5 * 60 * 1000, // Universities rarely change
  });
}
```

**API Endpoints (from AdminService.pushNotifications):**
- `filterUsers()` → `POST /admin/push-notifications/filter-users`
- `sendBulkNotification()` → `POST /admin/notifications/bulk`
- `universities.getAll()` → `GET /admin/universities`

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/admin/push-notifications/hooks.ts
git commit -m "feat(push-notifications): add React Query hooks for notification targeting"
```

---

### Task 9: Create push-notifications-v2.tsx

**Files:**
- Create: `app/admin/push-notifications/push-notifications-v2.tsx`

Transformation from legacy:
1. Add `patchAdminAxios()` in useEffect
2. Remove localStorage auth check (lines ~108, ~211 in original)
3. Keep all filter/targeting/sending logic intact

- [ ] **Step 1: Create push-notifications-v2.tsx**

Start from copy of legacy page content. Apply:

1. **Add imports:**
```tsx
import { patchAdminAxios } from '@/shared/lib/http/admin-axios-interceptor';
```

2. **Add patchAdminAxios useEffect:**
```tsx
useEffect(() => {
  const unpatch = patchAdminAxios();
  return unpatch;
}, []);
```

3. **Remove** the `useAuth()` or `useRouter()` call if only used for auth redirect

4. **Remove** localStorage auth check useEffect blocks (lines ~108 and ~211 check `localStorage.getItem('accessToken')`)

5. **Remove** `authChecking`/`authError` state and early return render blocks

6. **Keep everything else verbatim**

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Zero build errors

- [ ] **Step 3: Commit**

```bash
git add app/admin/push-notifications/push-notifications-v2.tsx
git commit -m "feat(push-notifications): add v2 page with BFF proxy"
```

---

## Chunk 4: Verification

### Task 10: Build verification

- [ ] **Step 1: Full build check**

Run: `npm run build`
Expected: Zero errors. All 3 pages compile in both legacy and v2 paths.

- [ ] **Step 2: Verify feature flag gating**

Check that all 3 page.tsx files follow the exact same pattern:
```tsx
const shellV2 = await isAdminShellV2Enabled();
const mode = await getRouteMode('<route-name>');
if (shellV2 && mode === 'v2') { return <V2 />; }
return <Legacy />;
```

- [ ] **Step 3: Verify patchAdminAxios in all v2 files**

All 3 v2 files must have:
```tsx
useEffect(() => {
  const unpatch = patchAdminAxios();
  return unpatch;
}, []);
```

- [ ] **Step 4: Verify no auth checks in v2 files**

Grep for `localStorage`, `authChecking`, `authError`, `useAuth` in v2 files — must return zero results.

Run: `grep -rn "localStorage\|authChecking\|authError\|useAuth" app/admin/users/users-v2.tsx app/admin/profile-review/profile-review-v2.tsx app/admin/push-notifications/push-notifications-v2.tsx`
Expected: No matches

- [ ] **Step 5: Push to branch**

```bash
git push origin claude/sharp-jepsen
```

---

## Task Dependencies

```
Task 1 (users legacy) → Task 2 (users hooks) → Task 3 (users v2)
Task 4 (profile-review legacy) → Task 5 (profile-review hooks) → Task 6 (profile-review v2)
Task 7 (push-notifications legacy) → Task 8 (push-notifications hooks) → Task 9 (push-notifications v2)
Task 10 (verification) — after all above

Tasks 1-3, 4-6, 7-9 are independent chains and CAN run in parallel.
```

## Critical Files (Reference Only — Do NOT Modify)

| File | Why |
|------|-----|
| `app/services/admin.ts` | Service functions called by hooks — kept for all legacy pages |
| `utils/axios.ts` | axiosServer instance patched by patchAdminAxios |
| `shared/lib/http/admin-axios-interceptor.ts` | `patchAdminAxios()` function |
| `shared/feature-flags/index.ts` | `getRouteMode()`, `isAdminShellV2Enabled()` |
| `shared/contexts/admin-session-context.tsx` | `useAdminSession()` hook |
| `shared/ui/admin/legacy-page-adapter.tsx` | `LegacyPageAdapter` wrapper |

## Files NOT Changed

- `app/services/admin.ts` — kept for legacy pages and other consumers
- `app/services/dashboard.ts` — not relevant
- Sub-components within each page directory (e.g., `profile-review/components/*`) — no changes needed, they work via patchAdminAxios
- `AdminShell`, `AdminSessionContext`, `AdminQueryProvider` — no changes
- `LegacyPageAdapter` — kept for other legacy pages
