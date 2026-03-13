# Phase 4: Remaining 25 Admin Pages V2 Conversion

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert all 25 remaining admin pages to v2 using the established minimal v2 pattern (legacy extraction + server component router + patchAdminAxios).

**Architecture:** Each page undergoes an identical mechanical transformation: (1) extract current page.tsx content verbatim into a `-legacy.tsx` file wrapped with `LegacyPageAdapter`, (2) rewrite `page.tsx` as an async server component router using feature flags, (3) create a `-v2.tsx` file that is a copy of the legacy content but with `patchAdminAxios()` instead of `LegacyPageAdapter`, and auth checks removed if present. Hooks files are NOT created — they are optional and were only added in Phase 2-3 for future React Query adoption.

**Tech Stack:** Next.js 14 App Router, React Query (TanStack Query), MUI, TypeScript, Axios with BFF interceptor patching, Vercel Edge Config feature flags

---

## Critical Rules

1. **NO new API endpoints** — v2 pages use existing `AdminService.*` and `axiosServer.*` calls unchanged
2. **NO backend changes** — `sometimes-api` is production and cannot be modified
3. **Verbatim copy** — legacy and v2 files contain the EXACT same component body; only wrapper/auth differs
4. **patchAdminAxios replaces LegacyPageAdapter** — v2 files call `patchAdminAxios()` directly in useEffect instead of wrapping with `LegacyPageAdapter`
5. **Auth removal only for 2 pages** — Only `community` and `version-management` use `useAuth()`; all other 23 pages have NO auth checks to remove
6. **Sub-components untouched** — Files in `components/`, `hooks/`, `types.ts` subdirectories are NOT modified
7. **No hooks.ts** — Unlike Phase 2-3, Phase 4 does NOT create hooks.ts files (they were optional and unused by v2 pages)

---

## Universal Conversion Template

Every page follows this exact 4-step transformation:

### Step A: Create Legacy File (`{dir}/{name}-legacy.tsx`)

```tsx
// Copy the ENTIRE current page.tsx content verbatim
// Change: rename inner function if needed, keep LegacyPageAdapter wrapper
// The default export wraps the inner content function with LegacyPageAdapter

'use client';
// ... all existing imports from current page.tsx ...
import { LegacyPageAdapter } from '@/shared/ui/admin/legacy-page-adapter';

// ... all existing types, constants, helper functions ...

function {InnerFunctionName}() {
  // ... entire existing component body verbatim ...
}

export default function {ExportFunctionName}() {
  return (
    <LegacyPageAdapter>
      <{InnerFunctionName} />
    </LegacyPageAdapter>
  );
}
```

### Step B: Rewrite Page Router (`{dir}/page.tsx`)

```tsx
import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import {LegacyComponent} from './{name}-legacy';
import {V2Component} from './{name}-v2';

export default async function {PageFunctionName}() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('{route-name}');

  if (shellV2 && mode === 'v2') {
    return <{V2Component} />;
  }

  return <{LegacyComponent} />;
}
```

### Step C: Create V2 File (`{dir}/{name}-v2.tsx`)

```tsx
// Copy of legacy content with these surgical changes:
// 1. REMOVE: import { LegacyPageAdapter } from '@/shared/ui/admin/legacy-page-adapter';
// 2. ADD: import { useEffect } from 'react'; (if not already imported)
// 3. ADD: import { patchAdminAxios } from '@/shared/lib/http/admin-axios-interceptor';
// 4. ADD: useEffect as FIRST effect in component body:
//    useEffect(() => { const unpatch = patchAdminAxios(); return () => unpatch(); }, []);
// 5. REMOVE: LegacyPageAdapter wrapper from default export (return inner content directly)
// 6. IF useAuth page: REMOVE useAuth import, hook call, and any isAdmin guards

'use client';
// ... all imports EXCEPT LegacyPageAdapter, EXCEPT useAuth (if applicable) ...
import { patchAdminAxios } from '@/shared/lib/http/admin-axios-interceptor';

// ... all existing types, constants, helper functions ...

function {InnerFunctionName}() {
  // FIRST useEffect — patch axios for BFF proxy
  useEffect(() => {
    const unpatch = patchAdminAxios();
    return () => unpatch();
  }, []);

  // ... rest of existing component body verbatim ...
  // (minus any useAuth/isAdmin references if applicable)
}

export default function {ExportFunctionName}() {
  return <{InnerFunctionName} />;
}
```

### Step D: Verify Build

```bash
npm run build
```

---

## Page Registry (25 pages)

| # | Directory | Route Name | Lines | Inner Function | Export Function | useAuth | Sub-dirs |
|---|-----------|------------|-------|----------------|----------------|---------|----------|
| 1 | community | community | 1864 | AdminCommunityContent | AdminCommunity | YES | NONE |
| 2 | reports | reports | 1120 | ReportsManagementContent | ReportsManagement | NO | NONE |
| 3 | gems | gems | 698 | GemsManagementPageContent | GemsManagementPage | NO | NONE |
| 4 | ai-chat | ai-chat | 444 | AIChatManagementPageContent | AIChatManagementPage | NO | components/, types.ts |
| 5 | likes | likes | 431 | LikesManagementPageContent | LikesManagementPage | NO | NONE |
| 6 | version-management | version-management | 427 | VersionManagementContent | VersionManagement | YES | NONE |
| 7 | female-retention | female-retention | 374 | FemaleRetentionPageContent | FemaleRetentionPage | NO | NONE |
| 8 | sometime-articles | sometime-articles | 371 | SometimeArticlesPageContent | SometimeArticlesPage | NO | components/ |
| 9 | ios-refund | ios-refund | 346 | IOSRefundPageContent | IOSRefundPage | NO | NONE |
| 10 | card-news | card-news | 355 | CardNewsPageContent | CardNewsPage | NO | components/ |
| 11 | dormant-likes | dormant-likes | 352 | DormantLikesPageContent | DormantLikesPage | NO | components/ |
| 12 | deleted-females | deleted-females | 316 | DeletedFemalesPageContent | DeletedFemalesPage | NO | NONE |
| 13 | reset-password | reset-password | 320 | ResetPasswordPageContent | ResetPasswordPage | NO | NONE |
| 14 | fcm-tokens | fcm-tokens | 294 | FcmTokensPageContent | FcmTokensPage | NO | NONE |
| 15 | universities | universities | 302 | UniversitiesPageContent | UniversitiesPage | NO | components/ |
| 16 | banners | banners | 266 | BannersPageContent | BannersPage | NO | components/ |
| 17 | sales | sales | 266 | SalesPageContent | SalesPage | NO | components/, types.ts |
| 18 | app-reviews | app-reviews | 119 | AppReviewsPageContent | AppReviewsPage | NO | components/ |
| 19 | support-chat | support-chat | 185 | SupportChatPageContent | SupportChatPage | NO | components/, hooks/ |
| 20 | chat | chat | 103 | ChatPageContent | ChatPage | NO | components/ |
| 21 | sms | sms | 57 | SmspageContent | Smspage | NO | components/, types.ts |
| 22 | scheduled-matching | scheduled-matching | 76 | ScheduledMatchingPageContent | ScheduledMatchingPage | NO | components/, types.ts |
| 23 | lab | lab | 78 | LabPageContent | LabPage | NO | components/ |
| 24 | moment | moment | 49 | MomentManagementPageContent | MomentManagementPage | NO | components/ |
| 25 | force-matching | force-matching | 28 | ForceMatchingPageContent | ForceMatchingPage | NO | NONE |

---

## Parallel Execution Batches

### Batch A: Large Pages (3 pages, ~3,682 lines)

Pages: `community` (1864), `reports` (1120), `gems` (698)

**Special handling:**
- `community`: Remove `useAuth` import, `const { isAdmin } = useAuth()` call, and any `isAdmin` guard conditions in the v2 file
- `reports`, `gems`: Standard conversion, no auth removal needed

### Batch B: Medium Pages Group 1 (5 pages, ~2,047 lines)

Pages: `ai-chat` (444), `likes` (431), `version-management` (427), `female-retention` (374), `sometime-articles` (371)

**Special handling:**
- `version-management`: Remove `useAuth` import, hook call, and any `isAdmin` guards in the v2 file
- All others: Standard conversion

### Batch C: Medium Pages Group 2 (5 pages, ~1,689 lines)

Pages: `ios-refund` (346), `card-news` (355), `dormant-likes` (352), `deleted-females` (316), `reset-password` (320)

No special handling needed — all standard conversions.

### Batch D: Medium-Small Pages (5 pages, ~1,247 lines)

Pages: `fcm-tokens` (294), `universities` (302), `banners` (266), `sales` (266), `app-reviews` (119)

No special handling needed — all standard conversions.

### Batch E: Small Pages (7 pages, ~576 lines)

Pages: `support-chat` (185), `chat` (103), `sms` (57), `scheduled-matching` (76), `lab` (78), `moment` (49), `force-matching` (28)

No special handling needed — all standard conversions.

---

## Task Breakdown Per Batch

Each batch follows this task sequence. Repeat for every page in the batch:

### Task N.1: Extract Legacy File

**Files:**
- Create: `app/admin/{dir}/{name}-legacy.tsx`

- [ ] **Step 1: Copy current page.tsx verbatim to legacy file**

  Copy the ENTIRE content of `app/admin/{dir}/page.tsx` into `app/admin/{dir}/{name}-legacy.tsx`. The file must be a byte-for-byte copy of the original with these changes only:
  - Ensure `LegacyPageAdapter` import exists (it should already)
  - Ensure the default export wraps the inner content function with `<LegacyPageAdapter>`

- [ ] **Step 2: Verify legacy file compiles**

  Run: `npx tsc --noEmit app/admin/{dir}/{name}-legacy.tsx` or check with `npm run build`

- [ ] **Step 3: Commit**

  ```bash
  git add app/admin/{dir}/{name}-legacy.tsx
  git commit -m "refactor({dir}): extract legacy page for v2 routing"
  ```

### Task N.2: Rewrite Page Router + Create V2 File

**Files:**
- Modify: `app/admin/{dir}/page.tsx`
- Create: `app/admin/{dir}/{name}-v2.tsx`

- [ ] **Step 1: Rewrite page.tsx as server component router**

  Replace `app/admin/{dir}/page.tsx` entirely with the server component router template (see Universal Template Step B). Use the exact import names, route name, and function names from the Page Registry table.

- [ ] **Step 2: Create v2 file from legacy content**

  Copy `{name}-legacy.tsx` to `{name}-v2.tsx`, then apply surgical changes:
  1. Remove `LegacyPageAdapter` import
  2. Add `patchAdminAxios` import from `@/shared/lib/http/admin-axios-interceptor`
  3. Ensure `useEffect` is imported from `react`
  4. Add `useEffect(() => { const unpatch = patchAdminAxios(); return () => unpatch(); }, []);` as FIRST effect in the inner component function
  5. Change default export to return inner content directly WITHOUT `LegacyPageAdapter` wrapper
  6. IF useAuth page (community, version-management only): Remove `useAuth` import, hook call, and all `isAdmin` guard conditions

- [ ] **Step 3: Verify build passes**

  Run: `npm run build`
  Expected: Exit code 0, no TypeScript errors

- [ ] **Step 4: Verify no changes to sub-components**

  Run: `git diff --name-only | grep -v page.tsx | grep -v legacy.tsx | grep -v v2.tsx`
  Expected: No output (only page.tsx, legacy.tsx, v2.tsx should be changed/created)

- [ ] **Step 5: Commit**

  ```bash
  git add app/admin/{dir}/page.tsx app/admin/{dir}/{name}-v2.tsx
  git commit -m "feat({dir}): add v2 page with BFF proxy and feature flag routing"
  ```

---

## Verification Criteria

After all 25 pages are converted:

- [ ] `npm run build` passes with exit code 0
- [ ] All 25 directories have exactly 3 new/modified files: `page.tsx`, `{name}-legacy.tsx`, `{name}-v2.tsx`
- [ ] No files in `components/`, `hooks/`, `types.ts` subdirectories were modified
- [ ] No changes to `app/services/admin.ts`
- [ ] `grep -r "useAuth" app/admin/*/page.tsx` returns NO matches (all auth removed from routers)
- [ ] `grep -r "patchAdminAxios" app/admin/*-v2.tsx` returns 25 matches (one per v2 file)
- [ ] `grep -r "LegacyPageAdapter" app/admin/*-legacy.tsx` returns 25 matches (one per legacy file)
- [ ] `grep -r "getRouteMode" app/admin/*/page.tsx` returns 25+ matches (including Phase 2-3 pages)
- [ ] All existing pages still work (legacy path is default when feature flags are off)

---

## Files NOT Changed

These files must NOT be modified during Phase 4:
- `app/services/admin.ts` — Admin API service layer
- `shared/lib/http/admin-axios-interceptor.ts` — patchAdminAxios function
- `shared/feature-flags/index.ts` — Feature flag functions
- `shared/ui/admin/legacy-page-adapter.tsx` — LegacyPageAdapter wrapper
- `shared/contexts/admin-session-context.tsx` — AdminSession context
- `utils/axios.ts` — Axios instances
- Any file in `app/admin/*/components/` directories
- Any file in `app/admin/*/hooks/` directories
- Any `types.ts` file in admin subdirectories

---

## Commit Strategy

Each batch produces 2 commits per page (legacy extraction + v2 creation), totaling 50 commits across 5 parallel batches. Alternatively, batches may consolidate into fewer commits per batch if the executor prefers (e.g., 1 commit for all legacy extractions in a batch + 1 commit for all v2 files in a batch).

**Push target:** `claude/sharp-jepsen` branch only. NO PR until all phases complete.
