# Phase 3B: Matching-Management V2 Rewrite

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the `matching-management` admin page (1265 lines, 13 tabs) as a native v2 page using BFF proxy routing and feature flag gating.

**Architecture:** Minimal v2 pattern — the v2 page calls `patchAdminAxios()` so ALL existing sub-components, direct axios calls, and AdminService calls work unchanged through BFF proxy. This page is the most complex admin page (13 tabs, mix of direct `axiosServer` and `AdminService.matching.*` calls). The v2 transformation is surgical: remove auth checks, add BFF patching, keep everything else verbatim.

**Tech Stack:** Next.js 14 App Router, React Query (TanStack Query), MUI, TypeScript, Axios with BFF interceptor patching

**Critical Rule:** NO new API endpoints, NO new types, NO modified request/response shapes. All existing service functions and direct axios calls remain exactly as-is. `patchAdminAxios()` handles BFF routing for ALL axios instances (`axiosServer`, `axiosMultipart`, `axiosNextGen`).

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `app/admin/matching-management/page.tsx` | MODIFY | Server component: feature flag routing |
| `app/admin/matching-management/matching-management-legacy.tsx` | CREATE | Verbatim copy of current page.tsx content + LegacyPageAdapter wrapper |
| `app/admin/matching-management/matching-management-v2.tsx` | CREATE | V2 client component: patchAdminAxios, no auth checks |
| `app/admin/matching-management/hooks.ts` | CREATE | React Query hooks wrapping existing service/axios calls |

### Why no sub-component changes?

The matching-management page has many sub-components in `components/` directory (`UserSearch`, `SingleMatching`, `MatchingSimulation`, `UnmatchedUsers`, `MatcherHistory`, `TicketManagement`, `GemsManagement`, `LikeHistory`, `ForceMatchingTab`, `UserDetailModal`). These all use `axiosServer` or `AdminService.*` internally — `patchAdminAxios()` in the v2 parent routes ALL these calls through BFF proxy. No sub-component modification needed.

---

## Chunk 1: Legacy Extraction & Router

### Task 1: Extract matching-management-legacy.tsx

**Files:**
- Create: `app/admin/matching-management/matching-management-legacy.tsx`
- Modify: `app/admin/matching-management/page.tsx`

- [ ] **Step 1: Create matching-management-legacy.tsx**

Copy the ENTIRE current content of `app/admin/matching-management/page.tsx` (1265 lines) into the legacy file. Wrap with `LegacyPageAdapter`:

```tsx
// app/admin/matching-management/matching-management-legacy.tsx
'use client';

// ... ALL imports from current page.tsx verbatim ...
import { LegacyPageAdapter } from '@/shared/ui/admin/legacy-page-adapter';

// ALL types defined in current page.tsx verbatim (if any inline types exist)

// Rename main function
function MatchingManagementPageContent() {
  // ... ENTIRE current page.tsx body verbatim (1265 lines) ...
}

export default function MatchingManagementLegacy() {
  return (
    <LegacyPageAdapter>
      <MatchingManagementPageContent />
    </LegacyPageAdapter>
  );
}
```

**IMPORTANT:** This is the largest page (1265 lines). Copy every single line verbatim. Do NOT modify any logic, imports, types, or sub-component references. Only:
1. Rename the default export function to `MatchingManagementPageContent`
2. Add `LegacyPageAdapter` import and wrapper
3. Export the wrapper as default

- [ ] **Step 2: Rewrite page.tsx as server component router**

```tsx
// app/admin/matching-management/page.tsx
import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import MatchingManagementLegacy from './matching-management-legacy';
import MatchingManagementV2 from './matching-management-v2';

export default async function MatchingManagementPage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('matching-management');

  if (shellV2 && mode === 'v2') {
    return <MatchingManagementV2 />;
  }

  return <MatchingManagementLegacy />;
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Zero build errors. Legacy path loads identically.

- [ ] **Step 4: Commit**

```bash
git add app/admin/matching-management/matching-management-legacy.tsx app/admin/matching-management/page.tsx
git commit -m "refactor(matching-management): extract legacy page and add feature flag routing"
```

---

## Chunk 2: Hooks & V2 Page

### Task 2: Create matching-management React Query hooks

**Files:**
- Create: `app/admin/matching-management/hooks.ts`

The matching-management page uses a MIX of direct axios calls and AdminService calls. The hooks wrap the most common data-fetching patterns. Sub-components that self-fetch internally don't need hooks — `patchAdminAxios()` handles their routing.

**Direct axios calls in current page.tsx:**
- `axiosServer.get('/admin/matching/rest-members')` — rest members list
- `axiosServer.post('/admin/matching/vector', ...)` — vector matching
- `axiosServer.get('/admin/users/appearance/...')` — user appearance
- `axiosServer.post('/admin/matching/user', ...)` — user matching
- `axiosServer.post('/admin/matching/user/read', ...)` — find matches
- `axiosServer.get('/admin/matching/unmatched-users')` — unmatched users

**AdminService calls in current page.tsx:**
- `AdminService.matching.getMatchHistory(...)` — match history
- `AdminService.matching.getUserMatchCount(...)` — user match count
- `AdminService.matching.getFailureLogs(...)` — failure logs
- `AdminService.userAppearance.getUserDetails(...)` — user details

- [ ] **Step 1: Create hooks.ts**

```tsx
// app/admin/matching-management/hooks.ts
'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import axiosServer from '@/utils/axios';
import AdminService from '@/app/services/admin';
import { useAdminSession } from '@/shared/contexts/admin-session-context';

/**
 * Fetches rest members list.
 * Wraps axiosServer.get('/admin/matching/rest-members') exactly.
 */
export function useRestMembers(params: {
  date?: string;
  gender?: string;
  page?: number;
  limit?: number;
}, options?: { enabled?: boolean }) {
  const { session } = useAdminSession();

  return useQuery({
    queryKey: ['matching', 'rest-members', params, session?.selectedCountry],
    queryFn: async () => {
      const response = await axiosServer.get('/admin/matching/rest-members', { params });
      return response.data;
    },
    enabled: options?.enabled ?? true,
    placeholderData: (prev) => prev,
  });
}

/**
 * Fetches match history.
 * Wraps AdminService.matching.getMatchHistory() exactly.
 */
export function useMatchHistory(
  startDate: string,
  endDate: string,
  page: number,
  limit: number,
  name?: string,
  type?: string,
  options?: { enabled?: boolean },
) {
  const { session } = useAdminSession();

  return useQuery({
    queryKey: ['matching', 'history', startDate, endDate, page, limit, name, type, session?.selectedCountry],
    queryFn: () => AdminService.matching.getMatchHistory(startDate, endDate, page, limit, name, type),
    enabled: options?.enabled ?? true,
    placeholderData: (prev) => prev,
  });
}

/**
 * Fetches failure logs.
 * Wraps AdminService.matching.getFailureLogs() exactly.
 */
export function useFailureLogs(
  date: string,
  page: number,
  limit: number,
  name?: string,
  options?: { enabled?: boolean },
) {
  const { session } = useAdminSession();

  return useQuery({
    queryKey: ['matching', 'failure-logs', date, page, limit, name, session?.selectedCountry],
    queryFn: () => AdminService.matching.getFailureLogs(date, page, limit, name),
    enabled: options?.enabled ?? true,
    placeholderData: (prev) => prev,
  });
}

/**
 * Fetches unmatched users.
 * Wraps axiosServer.get('/admin/matching/unmatched-users') exactly.
 */
export function useUnmatchedUsers(params: {
  date?: string;
  gender?: string;
  page?: number;
  limit?: number;
}, options?: { enabled?: boolean }) {
  const { session } = useAdminSession();

  return useQuery({
    queryKey: ['matching', 'unmatched-users', params, session?.selectedCountry],
    queryFn: async () => {
      const response = await axiosServer.get('/admin/matching/unmatched-users', { params });
      return response.data;
    },
    enabled: options?.enabled ?? true,
    placeholderData: (prev) => prev,
  });
}

/**
 * Direct match creation mutation.
 * Wraps AdminService.matching.createDirectMatch() exactly.
 */
export function useCreateDirectMatch() {
  return useMutation({
    mutationFn: ({ requesterId, targetId, type }: {
      requesterId: string;
      targetId: string;
      type: 'rematching' | 'scheduled';
    }) => AdminService.matching.createDirectMatch(requesterId, targetId, type),
  });
}

/**
 * Find matches for a user.
 * Wraps axiosServer.post('/admin/matching/user/read') exactly.
 */
export function useFindMatches() {
  return useMutation({
    mutationFn: async (data: { userId: string; options?: any }) => {
      const response = await axiosServer.post('/admin/matching/user/read', data);
      return response.data;
    },
  });
}
```

**NOTE:** These hooks are OPTIONAL for the v2 page. The v2 page can keep using the existing inline fetch patterns (they all work via `patchAdminAxios()`). The hooks are provided for future incremental adoption — sub-components can migrate to them one at a time without breaking anything.

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to hooks.ts

- [ ] **Step 3: Commit**

```bash
git add app/admin/matching-management/hooks.ts
git commit -m "feat(matching-management): add React Query hooks for matching operations"
```

---

### Task 3: Create matching-management-v2.tsx

**Files:**
- Create: `app/admin/matching-management/matching-management-v2.tsx`

This is the largest and most complex page. The v2 transformation is purely mechanical:

1. Add `patchAdminAxios()` in useEffect
2. Remove auth checks
3. Keep ALL 13 tabs, ALL sub-component references, ALL state, ALL fetch logic verbatim

- [ ] **Step 1: Create matching-management-v2.tsx**

Start from a copy of the legacy page content (1265 lines). Apply these surgical changes:

1. **Add import at top:**
```tsx
import { patchAdminAxios } from '@/shared/lib/http/admin-axios-interceptor';
```

2. **Add patchAdminAxios useEffect** (first useEffect in component):
```tsx
useEffect(() => {
  const unpatch = patchAdminAxios();
  return unpatch;
}, []);
```

3. **Verify**: This page has NO `useAuth()`, NO `localStorage` auth checks, NO `authChecking`/`authError` state. No auth-related removals needed — the page already relies on external auth handling.

4. **Keep EVERYTHING else verbatim:**
   - All 13 tab definitions and tab state
   - All sub-component imports (`UserSearch`, `SingleMatching`, `MatchingSimulation`, etc.)
   - All direct `axiosServer` calls (they route through BFF via patchAdminAxios)
   - All `AdminService.matching.*` calls (same)
   - The existing `useBatchStatus` hook import and usage
   - All modal state, pagination state, date state
   - The entire 1200+ line render tree

**Why keep everything?** All existing axios/AdminService calls use `axiosServer`/`axiosMultipart`/`axiosNextGen` which `patchAdminAxios()` patches to route through `/api/admin-proxy`. Auth is handled by httpOnly cookies in BFF. Country header is handled by BFF session cookie. So every existing API call "just works" without modification.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Zero build errors

- [ ] **Step 3: Commit**

```bash
git add app/admin/matching-management/matching-management-v2.tsx
git commit -m "feat(matching-management): add v2 page with BFF proxy"
```

---

## Chunk 3: Verification

### Task 4: Build & integrity verification

- [ ] **Step 1: Full build check**

Run: `npm run build`
Expected: Zero errors

- [ ] **Step 2: Verify feature flag gating pattern**

Check page.tsx follows the exact pattern:
```tsx
const shellV2 = await isAdminShellV2Enabled();
const mode = await getRouteMode('matching-management');
if (shellV2 && mode === 'v2') { return <MatchingManagementV2 />; }
return <MatchingManagementLegacy />;
```

- [ ] **Step 3: Verify patchAdminAxios in v2 file**

```bash
grep -n "patchAdminAxios" app/admin/matching-management/matching-management-v2.tsx
```
Expected: import line + useEffect call

- [ ] **Step 4: Verify no auth checks in v2 file**

```bash
grep -n "localStorage\|authChecking\|authError\|useAuth" app/admin/matching-management/matching-management-v2.tsx
```
Expected: No matches

- [ ] **Step 5: Verify existing sub-components untouched**

```bash
git diff --name-only app/admin/matching-management/components/
```
Expected: No files listed (no sub-component changes)

- [ ] **Step 6: Push to branch**

```bash
git push origin claude/sharp-jepsen
```

---

## Task Dependencies

```
Task 1 (legacy extraction + router) → Task 2 (hooks) → Task 3 (v2 page)
                                                              ↓
                                                     Task 4 (verification)
```

Tasks are sequential within this plan. Phase 3B is independent from Phase 3A and can run in parallel.

## Critical Files (Reference Only — Do NOT Modify)

| File | Why |
|------|-----|
| `app/services/admin.ts` | `AdminService.matching.*` functions called by hooks — DO NOT MODIFY |
| `utils/axios.ts` | `axiosServer` instance patched by patchAdminAxios |
| `shared/lib/http/admin-axios-interceptor.ts` | `patchAdminAxios()` function |
| `shared/feature-flags/index.ts` | `getRouteMode()`, `isAdminShellV2Enabled()` |
| `shared/contexts/admin-session-context.tsx` | `useAdminSession()` hook |
| `shared/ui/admin/legacy-page-adapter.tsx` | `LegacyPageAdapter` wrapper |
| `app/admin/matching-management/types.ts` | Existing types — keep as-is |
| `app/admin/matching-management/useBatchStatus.ts` | Existing hook — keep as-is |
| `app/admin/matching-management/components/*` | All sub-components — NO changes needed |

## Files NOT Changed

- `app/services/admin.ts` — kept for all consumers
- `app/admin/matching-management/types.ts` — kept as-is
- `app/admin/matching-management/useBatchStatus.ts` — kept as-is
- ALL files in `app/admin/matching-management/components/` — no changes needed
- `AdminShell`, `AdminSessionContext`, `AdminQueryProvider` — no changes
- `LegacyPageAdapter` — kept for other legacy pages

## API Endpoints Used (from sometimes-api — DO NOT MODIFY)

| Endpoint | Method | Used By |
|----------|--------|---------|
| `/admin/matching/rest-members` | GET | Direct axiosServer call |
| `/admin/matching/vector` | POST | Direct axiosServer call |
| `/admin/users/appearance/{userId}` | GET | Direct axiosServer call |
| `/admin/matching/user` | POST | Direct axiosServer call |
| `/admin/matching/user/read` | POST | Direct axiosServer call / AdminService.matching.findMatches |
| `/admin/matching/unmatched-users` | GET | Direct axiosServer call |
| `/admin/matching/match-history` | GET | AdminService.matching.getMatchHistory |
| `/admin/matching/match-count` | GET | AdminService.matching.getUserMatchCount |
| `/admin/matching/failure-logs` | GET | AdminService.matching.getFailureLogs |
| `/admin/matching/direct-match` | POST | AdminService.matching.createDirectMatch |
