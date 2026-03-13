# Phase 0: Baseline and Freeze — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the project baseline — lock down legacy code, create comprehensive inventories of every admin page/API/broken pattern/auth dependency, set up scoped quality gates for new code, and finalize pnpm as the sole package manager.

**Architecture:** Phase 0 is configuration + documentation only. No runtime code changes. We create 4 inventory documents, 1 freeze policy, scoped TypeScript/ESLint configs for future new code, and finalize pnpm setup. All outputs live in `docs/` and project root config files.

**Tech Stack:** pnpm, TypeScript 4.9.5 (existing), ESLint (existing next config), shell scripts for inventory generation

---

## Chunk 1: pnpm Finalization and Freeze Policy

### Task 1: Finalize pnpm as sole package manager

**Files:**
- Create: `.npmrc`
- Verify: `pnpm-lock.yaml` (already exists)
- Verify: no `package-lock.json` (already removed)

**Context:** `pnpm-lock.yaml` already exists and `package-lock.json` is already removed. We need `.npmrc` with hoisting config for MUI/Emotion compatibility, and verification that everything resolves.

- [ ] **Step 1: Create `.npmrc` with shamefully-hoist**

```ini
shamefully-hoist=true
```

Why: MUI and Emotion packages require hoisting to work correctly with pnpm's strict node_modules structure.

- [ ] **Step 2: Verify pnpm install works cleanly**

Run: `pnpm install`
Expected: All dependencies resolve without errors. `node_modules` populated correctly.

- [ ] **Step 3: Verify dev server starts**

Run: `pnpm dev`
Expected: Dev server starts on port 3001 without module resolution errors. Kill after confirming startup.

- [ ] **Step 4: Verify build completes**

Run: `pnpm build`
Expected: Build completes (with existing type errors tolerated via `ignoreBuildErrors: true`).

- [ ] **Step 5: Add pnpm-only enforcement to package.json**

Modify: `package.json`

Add to the `scripts` section:
```json
"preinstall": "npx only-allow pnpm"
```

This prevents accidental `npm install` or `yarn install` from corrupting the lockfile.

Note: `npx only-allow pnpm` downloads the `only-allow` package on first run. An alternative is adding `"packageManager": "pnpm@9.x.x"` to `package.json` and enabling corepack (`corepack enable`), which is the modern Node.js standard. Both approaches work — `only-allow` is simpler to set up, corepack is more robust.

- [ ] **Step 6: Document Vercel build settings**

Create: `docs/vercel-pnpm-setup.md`

```markdown
# Vercel pnpm Build Settings

## Required Vercel Project Settings

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Build Command | `pnpm build` |
| Install Command | `pnpm install` |
| Node.js Version | 18.x |

## Notes

- `.npmrc` with `shamefully-hoist=true` is required for MUI/Emotion compatibility.
- `package-lock.json` has been removed. Only `pnpm-lock.yaml` is used.
- `preinstall` script enforces pnpm-only via `only-allow`.
```

- [ ] **Step 7: Commit**

```bash
git add .npmrc package.json pnpm-lock.yaml docs/vercel-pnpm-setup.md
git commit -m "chore(phase-0): finalize pnpm as sole package manager

- Add .npmrc with shamefully-hoist=true for MUI/Emotion compat
- Add preinstall script to enforce pnpm-only
- Document Vercel build settings for pnpm"
```

---

### Task 2: Document freeze policy for legacy admin code

**Files:**
- Create: `docs/admin-freeze-policy.md`

**Context:** During the hybrid rewrite, legacy admin code must be frozen except for critical production fixes. This prevents the rewrite target from moving while we work.

- [ ] **Step 1: Create freeze policy document**

Create: `docs/admin-freeze-policy.md`

```markdown
# Admin Legacy Code Freeze Policy

**Effective:** Phase 0 start ~ Phase 6 completion
**Scope:** All files under `app/admin/`, `app/services/admin.ts`, admin-related contexts

## Rules

### Allowed Changes (긴급 수정만)

1. **Production bug fixes** that cause data loss or user-facing errors
2. **Security patches** for critical vulnerabilities
3. **Backend API contract changes** that break existing functionality (forced by backend team)

### Forbidden Changes

1. New features in legacy admin pages
2. Refactoring or "cleanup" of legacy code
3. Adding new dependencies for legacy pages
4. Changing admin routing structure outside the rewrite plan
5. Modifying `app/services/admin.ts` except for bug fixes

### Process for Allowed Changes

1. Describe the issue and why it cannot wait for the rewrite
2. Make the minimal change needed
3. Tag the commit with `fix(admin-legacy):` prefix
4. Document the change in this file's changelog below

### Changelog

| Date | Description | Commit |
|------|-------------|--------|
| (template — add entries as needed) | | |

## Rationale

The hybrid rewrite replaces pages one by one under a new Shell. If legacy code keeps changing,
the rewrite target moves and adapter/bridge assumptions break. Freezing legacy code ensures
stability during the transition.
```

- [ ] **Step 2: Commit**

```bash
git add docs/admin-freeze-policy.md
git commit -m "docs(phase-0): add admin legacy code freeze policy

Defines what changes are allowed during the hybrid rewrite period.
Only critical production fixes permitted in legacy admin code."
```

---

## Chunk 2: Route Inventory and API Inventory

### Task 3: Create route inventory

**Files:**
- Create: `docs/inventories/route-inventory.md`

**Context:** We have 31 admin page directories confirmed via `app/admin/*/page.tsx`. Each needs to be cataloged with its current state, phase assignment, and key characteristics.

- [ ] **Step 0: Create inventories directory**

Run: `mkdir -p docs/inventories`

- [ ] **Step 1: Scan all admin routes and create inventory**

For each of the 31 admin routes, record:
- Route path
- File path
- `'use client'` status
- Assigned phase (from design spec)
- Component count (files in that directory)
- Key dependencies (charts, tables, modals, etc.)

Create: `docs/inventories/route-inventory.md`

```markdown
# Admin Route Inventory

**Generated:** 2026-03-12
**Total routes:** 31
**Spec reference:** `docs/superpowers/specs/2026-03-12-admin-hybrid-rewrite-design.md`

## Summary by Phase

| Phase | Routes | Count |
|-------|--------|-------|
| Phase 2 | dashboard, kpi-report | 2 |
| Phase 3A | users, profile-review, push-notifications | 3 |
| Phase 3B | matching-management | 1 |
| Phase 4 | reports, sms, support-chat, community | 4 |
| Phase 5 | (remaining) | 21 |
| **Total** | | **31** |

## Detailed Inventory

| # | Route | File Path | Phase | 'use client' | Sub-components | Notes |
|---|-------|-----------|-------|---------------|----------------|-------|
```

Populate all 31 rows using this script to generate the raw data:

```bash
# Generate route inventory data
for dir in app/admin/*/; do
  route=$(basename "$dir")
  page="$dir/page.tsx"
  if [ -f "$page" ]; then
    use_client=$(grep -l "'use client'" "$page" 2>/dev/null && echo "Yes" || echo "No")
    file_count=$(find "$dir" -name "*.tsx" -o -name "*.ts" | wc -l | tr -d ' ')
    has_axios=$(grep -rl "axios" "$dir" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
    has_localstorage=$(grep -rl "localStorage" "$dir" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
    has_alert=$(grep -rl "alert\|confirm(" "$dir" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
    echo "| $route | $page | $use_client | $file_count files | axios:$has_axios ls:$has_localstorage alert:$has_alert |"
  fi
done
```

Then manually add the Phase assignment column based on the spec (Phase 2/3A/3B/4/5).

- [ ] **Step 2: Verify inventory completeness**

Run: `ls -d app/admin/*/page.tsx | wc -l`
Expected: `31` — must match the inventory row count.

Run: Cross-check every directory in `app/admin/` against the inventory. No route should be missing.

- [ ] **Step 3: Commit**

```bash
git add docs/inventories/route-inventory.md
git commit -m "docs(phase-0): create admin route inventory (31 pages)

Catalogs all admin routes with phase assignments, client component
status, sub-component counts, and key patterns."
```

---

### Task 4: Create API inventory

**Files:**
- Create: `docs/inventories/api-inventory.md`
- Read: `app/services/admin.ts` (4,756 lines — the source of truth)

**Context:** `app/services/admin.ts` is a 4,756-line monolith containing all admin API calls. We need to catalog every exported function, the backend endpoint it calls, which pages use it, and which HTTP method/axios instance it uses.

- [ ] **Step 1: Extract all exported functions from admin.ts**

Run these commands to generate the raw data:

```bash
# List all exported functions with line numbers
grep -n "^export " app/services/admin.ts

# Count by HTTP method
echo "GET:"; grep -c "\.get(" app/services/admin.ts
echo "POST:"; grep -c "\.post(" app/services/admin.ts
echo "PUT:"; grep -c "\.put(" app/services/admin.ts
echo "PATCH:"; grep -c "\.patch(" app/services/admin.ts
echo "DELETE:"; grep -c "\.delete(" app/services/admin.ts

# Count by axios instance
echo "axiosServer:"; grep -c "axiosServer" app/services/admin.ts
echo "axiosMultipart:"; grep -c "axiosMultipart" app/services/admin.ts
echo "axiosNextGen:"; grep -c "axiosNextGen" app/services/admin.ts

# Find which pages import from admin.ts
grep -rn "from.*services/admin" app/admin/ --include="*.ts" --include="*.tsx" | cut -d: -f1 | sort -u
```

For each exported function, record:
- Function name
- HTTP method (GET/POST/PUT/PATCH/DELETE)
- Backend endpoint path
- Axios instance used (`axiosServer`, `axiosMultipart`, `axiosNextGen`, or direct `axios`)
- Which admin page(s) import and call it

- [ ] **Step 2: Create API inventory document**

Create: `docs/inventories/api-inventory.md`

```markdown
# Admin API Inventory

**Generated:** 2026-03-12
**Source file:** `app/services/admin.ts` (4,756 lines)
**Spec reference:** `docs/superpowers/specs/2026-03-12-admin-hybrid-rewrite-design.md`

## Summary

| Metric | Count |
|--------|-------|
| Total exported functions | (scan result) |
| GET endpoints | (scan result) |
| POST endpoints | (scan result) |
| PUT/PATCH endpoints | (scan result) |
| DELETE endpoints | (scan result) |
| Direct axios calls (not via service) | 44+ (in admin pages) |

## Axios Instance Usage

| Instance | Count | Purpose |
|----------|-------|---------|
| `axiosServer` | (scan) | JSON API calls, 15s timeout |
| `axiosMultipart` | (scan) | File uploads, 30s timeout |
| `axiosNextGen` | (scan) | Direct backend calls, 15s timeout |
| Direct `axios` | (scan) | Unmanaged calls (to be eliminated) |

## Function Inventory

| # | Function Name | Method | Endpoint | Axios Instance | Used By (Pages) |
|---|---------------|--------|----------|----------------|-----------------|
```

Populate all rows from the scan. Group by domain (dashboard, users, matching, etc.) for readability.

- [ ] **Step 3: Catalog direct axios calls in admin pages**

These are calls that bypass `admin.ts` and call axios directly from page/component files. Already identified 44+ occurrences across 8 files. List each one with file path and line number.

Add a section to the inventory:

```markdown
## Direct Axios Calls (Bypass Service Layer)

These calls do NOT go through `app/services/admin.ts` and must be migrated
to React Query hooks during their page's rewrite phase.

| File | Line | Method | Endpoint | Notes |
|------|------|--------|----------|-------|
```

- [ ] **Step 4: Commit**

```bash
git add docs/inventories/api-inventory.md
git commit -m "docs(phase-0): create admin API inventory

Catalogs all exported functions in admin.ts (4,756 lines),
their endpoints, axios instances, and consuming pages.
Also lists 44+ direct axios calls that bypass the service layer."
```

---

## Chunk 3: Broken-Control Inventory and Auth/localStorage Inventory

### Task 5: Create broken-control inventory

**Files:**
- Create: `docs/inventories/broken-control-inventory.md`

**Context:** The admin codebase has numerous anti-patterns that must be tracked for systematic elimination during rewrites. Key categories: `console.log/warn/error` (59+ in admin), `alert()/confirm()` (47+ occurrences), `window.location` usage, bypassed middleware, and `ignoreBuildErrors`.

- [ ] **Step 1: Scan for all broken control patterns**

Run these scans and record results:

```bash
# console usage (per-file counts)
grep -rcn "console\.\(log\|warn\|error\|debug\)" app/admin/ --include="*.ts" --include="*.tsx"

# alert/confirm (word-boundary to avoid false positives like alertMessage)
grep -rn "\balert\s*(" app/admin/ --include="*.ts" --include="*.tsx"
grep -rn "\bconfirm\s*(" app/admin/ --include="*.ts" --include="*.tsx"

# window.location (hard navigation instead of Next.js router)
grep -rn "window\.location" app/admin/ --include="*.ts" --include="*.tsx"

# Direct DOM manipulation
grep -rn "document\.\(getElementById\|querySelector\)" app/admin/ --include="*.ts" --include="*.tsx"

# try/catch with empty catch or console-only
grep -rn "catch.*{" app/admin/ --include="*.ts" --include="*.tsx"
```

Record both per-file breakdown AND total counts for each pattern.

- [ ] **Step 2: Create broken-control inventory document**

Create: `docs/inventories/broken-control-inventory.md`

```markdown
# Admin Broken-Control Inventory

**Generated:** 2026-03-12
**Spec reference:** `docs/superpowers/specs/2026-03-12-admin-hybrid-rewrite-design.md`

## Summary

| Pattern | Count | Severity | Resolution |
|---------|-------|----------|------------|
| `console.log/warn/error` | (scan) | Medium | Remove in page rewrite |
| `alert()` / `confirm()` | (scan) | High | Replace with MUI Dialog/toast |
| `window.location` (hard nav) | (scan) | High | Replace with Next.js router |
| Direct DOM manipulation | (scan) | Medium | Replace with React state |
| `ignoreBuildErrors: true` | 1 | Critical | Remove in Phase 6 |
| Middleware bypass | 1 | Critical | Rewrite in Phase 1 |
| `reactStrictMode: false` | 1 | Medium | Enable in Phase 1 |

## Global Issues

### middleware.ts (line 17)
- **Issue:** `return NextResponse.next()` bypasses all authentication
- **Impact:** Any user can access `/admin/*` without login
- **Resolution:** Phase 1 — rewrite with cookie-based auth

### next.config.js
- **Issue 1:** `ignoreBuildErrors: true` — TypeScript errors silently ignored in builds
- **Issue 2:** `reactStrictMode: false` — React double-render checks disabled
- **Issue 3:** Non-deterministic build ID (`Date.now()`) prevents caching
- **Issue 4:** `CACHE_INVALIDATION: Date.now()` as env var
- **Resolution:** Phase 1 (strict mode), Phase 6 (ignoreBuildErrors removal)

## Per-File Breakdown

| File | console | alert/confirm | window.location | Notes |
|------|---------|---------------|-----------------|-------|
```

Populate per-file data from scan results.

- [ ] **Step 3: Commit**

```bash
git add docs/inventories/broken-control-inventory.md
git commit -m "docs(phase-0): create broken-control inventory

Catalogs all anti-patterns: console usage (59+), alert/confirm (47+),
window.location, middleware bypass, ignoreBuildErrors, and more."
```

---

### Task 6: Create auth/localStorage inventory

**Files:**
- Create: `docs/inventories/auth-localstorage-inventory.md`

**Context:** Legacy admin pages rely on `localStorage` for auth tokens and state. The rewrite moves to httpOnly cookies via BFF. We need to catalog every localStorage key used, which pages read/write them, and how the LegacyPageAdapter bridge must sync them.

- [ ] **Step 1: Scan all localStorage usage in admin**

```bash
# All localStorage access in admin
grep -rn "localStorage\.\(getItem\|setItem\|removeItem\)" app/admin/ --include="*.ts" --include="*.tsx"

# Auth-related localStorage in contexts
grep -rn "localStorage\.\(getItem\|setItem\|removeItem\)" contexts/ --include="*.ts" --include="*.tsx"

# Auth-related localStorage in services
grep -rn "localStorage\.\(getItem\|setItem\|removeItem\)" app/services/ --include="*.ts" --include="*.tsx"

# Auth-related localStorage in utils
grep -rn "localStorage\.\(getItem\|setItem\|removeItem\)" utils/ --include="*.ts" --include="*.tsx"
```

- [ ] **Step 2: Create auth/localStorage inventory document**

Create: `docs/inventories/auth-localstorage-inventory.md`

```markdown
# Admin Auth & localStorage Inventory

**Generated:** 2026-03-12
**Spec reference:** `docs/superpowers/specs/2026-03-12-admin-hybrid-rewrite-design.md`

## localStorage Keys Used by Admin

### Auth Keys (LegacyPageAdapter bridge must sync these)

| Key | Type | Read By | Written By | Bridge Action |
|-----|------|---------|------------|---------------|
| `accessToken` | string | (verify: expected in push-notifications, dashboard, kpi-report, support-chat, member-stats) | AuthContext (login) | Sync from cookie on mount |
| `isAdmin` | string | (verify: expected in push-notifications, dashboard, member-stats) | AuthContext (login) | Sync from session meta on mount |
| `user` | JSON string | (verify during scan) | AuthContext (login) | Sync from session meta on mount |
| `admin_selected_country` | string | (verify: expected in CountrySelectorModal, various pages) | CountrySelectorModal | Sync from cookie, bidirectional |

**Note:** The "Read By" and "Written By" columns above are expected values based on preliminary scan. They MUST be verified by the Step 1 scan results. Update any inaccuracies found.

### Non-Auth Keys (page-local state)

| Key | Type | Read By | Written By | Bridge Action |
|-----|------|---------|------------|---------------|
| `sms_draft` | JSON string | (verify) sms/MessageComposer | sms/MessageComposer | None (page-local) |
| `SKIPPED_USERS_KEY` | JSON array | (verify) profile-review | profile-review | None (page-local) |

**Add all additional keys found during the Step 1 scan.** The rows above are preliminary — the scan is the source of truth.

## Auth Flow Analysis

### Current Flow (Legacy)
1. User logs in via frontend → backend `/auth/login`
2. Frontend stores `accessToken` in localStorage
3. Frontend stores `user`, `isAdmin` in localStorage
4. Axios interceptor reads `accessToken` from localStorage for API calls
5. Pages read `isAdmin` from localStorage for access control

### New Flow (Phase 1+)
1. User logs in via BFF `/api/admin/auth/login` → backend `/auth/login`
2. BFF stores `admin_access_token` in httpOnly cookie
3. BFF stores `admin_session_meta` in iron-session signed cookie
4. Admin-proxy reads cookie for API calls (no client-side token access)
5. Middleware checks cookie for access control

### Bridge Requirements (LegacyPageAdapter)
- On mount: read session from BFF, write auth keys to localStorage
- On country change: update both cookie (via BFF) and localStorage
- On logout: clear both cookies (via BFF) and localStorage
```

- [ ] **Step 3: Verify completeness**

Cross-check every `localStorage` reference found in the scan against the inventory. No key should be missing.

- [ ] **Step 4: Commit**

```bash
git add docs/inventories/auth-localstorage-inventory.md
git commit -m "docs(phase-0): create auth/localStorage inventory

Maps all localStorage keys used by admin, categorizes as auth
(bridge-required) vs page-local, documents current vs new auth flow."
```

---

## Chunk 4: Quality Gates

### Task 7: Create scoped TypeScript config for admin-v2

**Files:**
- Create: `tsconfig.admin-v2.json`

**Context:** We need a separate TypeScript config that checks ONLY the new code directories. This allows us to enforce zero errors on new code while `ignoreBuildErrors: true` keeps legacy code building. The target directories don't exist yet (created in Phase 1), so this config will initially pass trivially.

**Scope note:** The design spec lists `app/admin` in the typecheck scope. However, including `app/admin/**/*` in Phase 0 would pull in all 31 legacy pages with hundreds of type errors. Instead, Phase 0 includes only new directories (`features/admin`, `shared/*`, `app/api/admin`). Phase 1 will add `app/admin/layout.tsx` when it's rewritten. Each subsequent phase adds its rewritten page paths (e.g., `app/admin/dashboard/**`) by removing them from the exclude list. This way the scope grows incrementally as pages are rewritten.

**`app/api/admin` scope addition:** The spec doesn't list `app/api/admin` explicitly, but BFF route handlers are new code that must be type-checked. Added for completeness.

**Test file exclusion:** Test files (`*.test.ts`, `*.spec.ts`) are excluded because they are checked by `ts-jest` during `pnpm test`. This avoids duplicate error reporting. If a test has type errors, `pnpm test` will catch it.

- [ ] **Step 1: Write the failing test — verify no scoped config exists**

Run: `ls tsconfig.admin-v2.json 2>&1`
Expected: `No such file or directory`

- [ ] **Step 2: Create `tsconfig.admin-v2.json`**

Create: `tsconfig.admin-v2.json`

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": [
    "app/admin/layout.tsx",
    "features/admin/**/*.ts",
    "features/admin/**/*.tsx",
    "shared/auth/**/*.ts",
    "shared/auth/**/*.tsx",
    "shared/lib/http/**/*.ts",
    "shared/lib/http/**/*.tsx",
    "shared/ui/admin/**/*.ts",
    "shared/ui/admin/**/*.tsx",
    "app/api/admin/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.spec.ts",
    "**/*.spec.tsx"
  ]
}
```

**Phase 1+ update:** When rewriting a page (e.g., dashboard), add its path to `include`:
```json
"app/admin/dashboard/**/*.ts",
"app/admin/dashboard/**/*.tsx",
```
This is documented in the Phase 1 plan as a step per rewritten page.

- [ ] **Step 3: Run typecheck to verify config works**

Run: `pnpm tsc --project tsconfig.admin-v2.json`
Expected: Exits 0 (no files matched yet = no errors). If tsc errors on "no input files found", that's expected — we'll create a placeholder in Step 5.

- [ ] **Step 4: Create placeholder to make tsc happy**

Since none of the include directories exist yet, tsc may error with "No inputs were found". Create a minimal placeholder:

Create: `shared/lib/http/.gitkeep`

This is a standard placeholder — it will be replaced by real code in Phase 1.

If tsc still complains (`.gitkeep` is not a `.ts` file), create:

Create: `shared/lib/http/index.ts`

```typescript
// Phase 1: HTTP client and React Query setup
// This file is a placeholder created in Phase 0 to validate the quality gate config.
export {};
```

- [ ] **Step 5: Verify typecheck passes with placeholder**

Run: `pnpm tsc --project tsconfig.admin-v2.json`
Expected: Exit 0, no errors.

- [ ] **Step 6: Commit**

```bash
git add tsconfig.admin-v2.json shared/lib/http/index.ts
git commit -m "chore(phase-0): add scoped TypeScript config for admin-v2

tsconfig.admin-v2.json enforces strict checking on new code only:
features/admin, shared/auth, shared/lib/http, shared/ui/admin, app/api/admin.
Includes placeholder to validate the config works."
```

---

### Task 8: Create scoped ESLint config and npm scripts for quality gates

**Files:**
- Create: `.eslintrc.admin-v2.json`
- Modify: `package.json` (add scripts)

**Context:** ESLint for the project uses `eslint-config-next` (configured in `package.json` or implicit). We need a scoped config that runs only on new admin code directories with stricter rules.

- [ ] **Step 1: Install @typescript-eslint packages**

The `.eslintrc.admin-v2.json` uses `@typescript-eslint/*` rules which require dedicated packages. These are NOT currently installed.

Run: `pnpm add -D @typescript-eslint/eslint-plugin @typescript-eslint/parser`
Expected: Both packages install successfully and `pnpm-lock.yaml` updates.

- [ ] **Step 2: Check current ESLint configuration**

Run: `cat package.json | grep -A5 eslint`
Run: `ls .eslintrc* eslint.config* 2>&1`

Note: No `.eslintrc.json` was found. Next.js uses `eslint-config-next` by default.

- [ ] **Step 3: Create `.eslintrc.admin-v2.json`**

Create: `.eslintrc.admin-v2.json`

```json
{
  "extends": ["next/core-web-vitals"],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "no-console": "error",
    "no-alert": "error",
    "no-restricted-globals": [
      "error",
      {
        "name": "localStorage",
        "message": "Use session hooks from shared/auth instead of localStorage directly."
      },
      {
        "name": "confirm",
        "message": "Use MUI Dialog instead of window.confirm()."
      },
      {
        "name": "alert",
        "message": "Use toast/snackbar instead of window.alert()."
      }
    ],
    "no-restricted-properties": [
      "error",
      {
        "object": "window",
        "property": "location",
        "message": "Use Next.js router instead of window.location."
      }
    ],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

- [ ] **Step 4: Add quality gate scripts to package.json**

Modify: `package.json` — add to `scripts`:

```json
"typecheck:admin-v2": "tsc --project tsconfig.admin-v2.json",
"lint:admin-v2": "eslint --config .eslintrc.admin-v2.json --ext .ts,.tsx features/admin/ shared/auth/ shared/lib/http/ shared/ui/admin/ app/api/admin/ --no-error-on-unmatched-pattern",
"quality:admin-v2": "pnpm typecheck:admin-v2 && pnpm lint:admin-v2"
```

**Note on `app/admin/` scope:** The lint script intentionally excludes `app/admin/` legacy pages to avoid hundreds of existing violations. As pages are rewritten in Phase 2+, add them to the lint scope alongside the tsconfig include update.

- [ ] **Step 5: Run quality gates to verify they pass**

Run: `pnpm typecheck:admin-v2`
Expected: Exit 0 (placeholder file has no errors)

Run: `pnpm lint:admin-v2`
Expected: Exit 0 (placeholder file passes all rules, `--no-error-on-unmatched-pattern` handles missing dirs)

Run: `pnpm quality:admin-v2`
Expected: Exit 0 (both pass)

- [ ] **Step 6: Commit**

```bash
git add .eslintrc.admin-v2.json package.json pnpm-lock.yaml
git commit -m "chore(phase-0): add quality gate scripts for admin-v2

- Install @typescript-eslint/eslint-plugin and parser
- typecheck:admin-v2: strict TypeScript on new code only
- lint:admin-v2: no-console, no-alert, no-localStorage, no-window.location
- quality:admin-v2: runs both gates
All Phase 1+ code must pass these gates before merge."
```

---

### Task 9: Create Phase 0 completion checklist and verify all deliverables

**Files:**
- Create: `docs/phase-0-completion.md`

**Context:** Final verification that all Phase 0 deliverables are in place before Phase 1 can begin.

- [ ] **Step 1: Create completion checklist**

Create: `docs/phase-0-completion.md`

```markdown
# Phase 0: Baseline and Freeze — Completion Checklist

## Deliverables

- [ ] `.npmrc` with `shamefully-hoist=true`
- [ ] `pnpm install` works cleanly
- [ ] `pnpm build` completes
- [ ] `preinstall` script enforces pnpm-only
- [ ] `docs/vercel-pnpm-setup.md` — Vercel configuration documented
- [ ] `docs/admin-freeze-policy.md` — freeze rules documented
- [ ] `docs/inventories/route-inventory.md` — 31 routes cataloged
- [ ] `docs/inventories/api-inventory.md` — admin.ts functions cataloged
- [ ] `docs/inventories/broken-control-inventory.md` — anti-patterns cataloged
- [ ] `docs/inventories/auth-localstorage-inventory.md` — auth keys mapped
- [ ] `tsconfig.admin-v2.json` — scoped strict TypeScript
- [ ] `.eslintrc.admin-v2.json` — scoped strict ESLint
- [ ] `pnpm typecheck:admin-v2` passes
- [ ] `pnpm lint:admin-v2` passes
- [ ] `pnpm quality:admin-v2` passes
- [ ] All commits pushed to branch

## Quality Gate Status

```bash
pnpm quality:admin-v2  # Must exit 0
```

## Ready for Phase 1?

Phase 1 can begin when ALL items above are checked.
Phase 1 scope: AdminShell, BFF routes, middleware rewrite, LegacyPageAdapter.
```

- [ ] **Step 2: Run final verification**

```bash
# Verify all files exist
ls .npmrc
ls docs/admin-freeze-policy.md
ls docs/inventories/route-inventory.md
ls docs/inventories/api-inventory.md
ls docs/inventories/broken-control-inventory.md
ls docs/inventories/auth-localstorage-inventory.md
ls tsconfig.admin-v2.json
ls .eslintrc.admin-v2.json

# Run quality gates
pnpm quality:admin-v2
```

Expected: All files exist, quality gate exits 0.

- [ ] **Step 3: Commit**

```bash
git add docs/phase-0-completion.md
git commit -m "docs(phase-0): add completion checklist

Phase 0 is complete. All inventories, freeze policy, and quality
gates are in place. Ready for Phase 1: Foundation."
```
