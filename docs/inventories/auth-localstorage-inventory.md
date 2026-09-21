# Admin Auth & localStorage Inventory

**Generated:** 2026-03-12
**Spec reference:** `docs/superpowers/specs/2026-03-12-admin-hybrid-rewrite-design.md`

---

## localStorage Keys Used by Admin

### Auth Keys (LegacyPageAdapter bridge must sync these)

| Key | Type | Read By | Written By | Bridge Action |
|-----|------|---------|------------|---------------|
| `accessToken` | string (JWT) | `utils/axios.ts` (interceptor), `utils/api.ts`, `app/services/admin.ts` (7 call sites), `app/admin/support-chat/hooks/useSupportChatSocket.ts`, `app/admin/dashboard/page.tsx`, `app/admin/dashboard/member-stats/page.tsx`, `app/admin/push-notifications/page.tsx`, `app/admin/kpi-report/page.tsx` | `contexts/AuthContext.tsx` (login), `utils/axios.ts` (token refresh) | Sync from httpOnly cookie on mount; clear on logout |
| `isAdmin` | `"true"` / `"false"` | `utils/axios.ts` (token refresh), `utils/api.ts`, `app/admin/dashboard/page.tsx`, `app/admin/dashboard/member-stats/page.tsx`, `app/admin/push-notifications/page.tsx`, `app/admin/kpi-report/page.tsx` | `contexts/AuthContext.tsx` (login), `utils/axios.ts` (token refresh) | Sync from session meta cookie on mount; clear on logout |
| `user` | JSON string (`UserInfo`) | `contexts/AuthContext.tsx` (session restore) | `contexts/AuthContext.tsx` (login) | Sync from session meta cookie on mount; clear on logout |
| `admin_status` | JSON string `{ verified, timestamp, email }` | _(written only; no reads found outside axios.ts itself)_ | `utils/axios.ts` (token refresh success path) | Sync from session meta on mount; clear on logout |
| `admin_selected_country` | `"kr"` \| `"jp"` | `contexts/CountryContext.tsx`, `utils/axios.ts` (X-Country header), `utils/api.ts`, `app/services/admin.ts` | `contexts/CountryContext.tsx` (country change) | Sync from cookie bidirectionally; persist country change back to cookie |

### Non-Auth Keys (page-local state, no bridge required)

| Key | Type | Read By | Written By | Bridge Action |
|-----|------|---------|------------|---------------|
| `skippedReviewUsers` | JSON array (string[]) | `app/admin/profile-review/page.tsx` | `app/admin/profile-review/page.tsx` | None — page-local UI state |
| `sms_draft` | JSON string (draft payload) | `app/admin/sms/components/MessageComposer.tsx` | `app/admin/sms/components/MessageComposer.tsx` | None — ephemeral draft, cleared after send |

---

## Scan Coverage

The following paths were scanned for `localStorage.getItem`, `localStorage.setItem`, `localStorage.removeItem`, bracket-notation `localStorage[...]`, and `sessionStorage`:

- `app/admin/**/*.{ts,tsx}`
- `contexts/**/*.{ts,tsx}`
- `app/services/**/*.{ts,tsx}`
- `utils/**/*.{ts,tsx}`

**No sessionStorage usage found.**
**No bracket-notation `localStorage[key]` usage found.**

The `LocalStorageHelper` class in `app/services/sms.ts` is a generic wrapper used only by `app/admin/sms/components/MessageComposer.tsx` (key: `sms_draft`). It is already captured in the Non-Auth Keys table above.

---

## Auth Flow Analysis

### Current Flow (Legacy)

1. User submits credentials on the login page.
2. Frontend POSTs to backend `/auth/login` directly via axios.
3. On success, `contexts/AuthContext.tsx` writes:
   - `accessToken` — raw JWT string
   - `user` — JSON-serialised user info object
   - `isAdmin` — `"true"` or `"false"` string
4. `utils/axios.ts` interceptor reads `accessToken` from localStorage and injects `Authorization: Bearer <token>` into every request.
5. `utils/axios.ts` interceptor reads `admin_selected_country` and injects `X-Country` header.
6. Admin pages (`dashboard`, `kpi-report`, `push-notifications`, etc.) perform their own `localStorage.getItem('accessToken')` / `getItem('isAdmin')` guards before fetching data.
7. On token expiry (HTTP 401), `utils/axios.ts` auto-refreshes via `/auth/refresh`, then:
   - Writes new `accessToken` to localStorage.
   - Writes new `accessToken` to a plain `document.cookie` (not httpOnly).
   - Conditionally writes `admin_status` JSON to localStorage.
8. On refresh failure, removes `accessToken`, `isAdmin`, and `admin_status` from localStorage and redirects to `/`.
9. On explicit logout, `contexts/AuthContext.tsx` removes `accessToken` and `isAdmin`; `app/services/admin.ts` additionally removes `user` and `isAdmin`.

### New Flow (Phase 1+)

1. User submits credentials on the login page.
2. Frontend POSTs to BFF route `/api/admin/auth/login`.
3. BFF calls backend `/auth/login`, then stores:
   - `admin_access_token` in an **httpOnly** cookie (inaccessible to JS).
   - `admin_session_meta` in an iron-session signed cookie (user info, isAdmin, country).
4. All admin API calls go through the admin-proxy BFF route; the proxy reads the httpOnly cookie server-side and forwards the `Authorization` header to the backend. No client-side token access.
5. Next.js middleware checks the iron-session cookie for authentication/authorisation on every request. No localStorage access.
6. On logout, BFF clears both cookies.

### Bridge Requirements (LegacyPageAdapter)

Legacy pages that have not yet been migrated to the BFF proxy pattern still read auth state directly from localStorage. The `LegacyPageAdapter` must bridge this gap:

| Trigger | Action |
|---------|--------|
| Component mount (legacy page load) | Call BFF `/api/admin/auth/session` to get `{ accessToken, user, isAdmin, country }` from session meta; write all five auth keys (`accessToken`, `user`, `isAdmin`, `admin_status`, `admin_selected_country`) to localStorage so legacy code can function. |
| Country change by user | Update `admin_selected_country` in localStorage (existing CountryContext behaviour); also call BFF to persist country into the iron-session cookie. |
| Logout | Call BFF `/api/admin/auth/logout` to clear cookies; then `localStorage.removeItem` on `accessToken`, `isAdmin`, `user`, `admin_status`. (`admin_selected_country` and page-local keys are non-auth and may be preserved.) |
| Token refresh (while legacy) | BFF issues a new httpOnly cookie; LegacyPageAdapter re-syncs `accessToken` to localStorage after refresh completes. |

---

## Files With Auth localStorage Access (complete reference)

| File | Keys Accessed |
|------|--------------|
| `contexts/AuthContext.tsx` | `accessToken` (r/w/d), `isAdmin` (w/d), `user` (r/w) |
| `contexts/CountryContext.tsx` | `admin_selected_country` (r/w) |
| `utils/axios.ts` | `accessToken` (r/w/d), `admin_selected_country` (r), `isAdmin` (r/w/d), `admin_status` (w/d) |
| `utils/api.ts` | `accessToken` (r/d), `admin_selected_country` (r), `user` (d), `isAdmin` (d) |
| `app/services/admin.ts` | `accessToken` (r ×7), `admin_selected_country` (r), `user` (d), `isAdmin` (d) |
| `app/admin/support-chat/hooks/useSupportChatSocket.ts` | `accessToken` (r) |
| `app/admin/dashboard/page.tsx` | `accessToken` (r), `isAdmin` (r) |
| `app/admin/dashboard/member-stats/page.tsx` | `accessToken` (r), `isAdmin` (r) |
| `app/admin/push-notifications/page.tsx` | `accessToken` (r ×2), `isAdmin` (r) |
| `app/admin/kpi-report/page.tsx` | `accessToken` (r), `isAdmin` (r) |
| `app/admin/components/CountrySelectorModal.tsx` | `admin_selected_country` (r — debug logging only; write delegated to CountryContext) |
| `app/admin/sms/components/MessageComposer.tsx` | `sms_draft` (r/w/d) |
| `app/admin/profile-review/page.tsx` | `skippedReviewUsers` (r/w/d) |

Legend: r = read, w = write, d = delete/removeItem

---

## Notes & Concerns

1. **`admin_status` is write-only in practice.** It is written during token refresh but never read by any code in the scanned paths. It may be dead code, or it is read by un-scanned paths (e.g. middleware or external scripts). The bridge should sync it defensively.

2. **Direct `accessToken` reads in pages.** Seven pages bypass `AuthContext` and call `localStorage.getItem('accessToken')` directly. These pages need individual attention during Phase 1 migration or must be wrapped by `LegacyPageAdapter` to ensure the token is present in localStorage.

3. **Plain-cookie write during token refresh.** `utils/axios.ts` writes `accessToken` to `document.cookie` (non-httpOnly) as a fallback. This is a security concern and should be removed when the BFF proxy handles token refresh.

4. **`utils/api.ts` is a separate axios factory** from `utils/axios.ts` and manages its own auth removal logic. Both must be updated or retired during Phase 1.

5. **`admin_selected_country` is bidirectional.** Country changes originate client-side and currently never reach the server. The bridge must propagate country changes to the iron-session cookie so the BFF proxy can read them.
