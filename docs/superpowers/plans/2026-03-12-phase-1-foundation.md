# Phase 1: Foundation Implementation Plan (Revised)

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** New AdminShell + cookie-based auth + BFF + all 41 legacy pages running inside the new shell via LegacyPageAdapter.

**Architecture:** Server Component root layout → AdminShell (client) with cookie-based session → BFF route handlers proxy to backend with httpOnly cookies → LegacyPageAdapter bridges cookie session to localStorage for legacy pages. Feature flags via Vercel Edge Config for instant rollback.

**Tech Stack:** Next.js 14.1.3, TypeScript 5.3, iron-session, @tanstack/react-query, react-hook-form, zod, @vercel/edge-config, Jest/RTL

**Parallelization:**
```
Chunk 1 (Setup)
    ├──→ Chunk 2 (Auth/BFF)  ──┐
    └──→ Chunk 3 (Infra)      ──┼──→ Chunk 4 (Shell/UI) ──→ Chunk 5 (Legacy Bridge)
```
Chunks 2+3 run **in parallel** after Chunk 1 completes.

**Review Fixes Applied (R1):**
- CRITICAL: Removed `/api/admin/session/token` (httpOnly leak). Added `/api/admin/auth/sync` instead.
- CRITICAL: Supabase not used in this project. Feature flags → Vercel Edge Config.
- CRITICAL: Auth race condition → permissive middleware + dual-auth in AdminShell.
- MAJOR: Page inventory corrected from 31 → 41 actual pages (filesystem glob).
- MAJOR: NAV_ITEMS copied from current `app/admin/layout.tsx` sidebar.
- MAJOR: Session context propagation (AdminShell → children, no duplicate fetch).
- MAJOR: CountryProvider race → `useLayoutEffect` in LegacyCountryBridgeProvider.
- MAJOR: admin-proxy forwards original Content-Type header (multipart support).
- MINOR: `reactStrictMode: false` kept during Phase 1 (legacy double-mount issues).
- MINOR: card-news path corrected to `edit/[id]` (not `[id]/edit`).
- MINOR: TS 5.3 verification includes full `next build` check.

**Review Fixes Applied (R2):**
- P1: Admin axios 인터셉터 추가 — legacy 페이지의 API 호출을 `/api/admin-proxy`로 라우팅. BFF가 실제로 동작하도록 변경.
- P1: `/api/admin/auth/refresh` BFF 엔드포인트 추가 — 토큰 갱신 시 httpOnly 쿠키도 함께 갱신.
- P1: `AdminCountrySelectorModal` 추가 — `useAdminSession().changeCountry()`를 호출하여 쿠키 세션과 localStorage를 동기화.
- P2: 국가 코드 대소문자 통일 — 세션 메타 기본값 `'KR'` → `'kr'`로 수정 (기존 코드와 일치).
- P2: 라우트별 롤백 테이블 수정 — `getRouteMode()` 미소비 인정, per-page rollback 행 제거.

---

## Chunk 1: Setup & Configuration

> **Dependencies:** None (first chunk)
> **Parallelizable with:** Nothing — must complete before Chunks 2+3

### Step 1.1: Install new dependencies

- [ ] Install production and dev dependencies

```bash
pnpm add iron-session@^8 @tanstack/react-query@^5 react-hook-form@^7 zod@^3 @hookform/resolvers@^3 @vercel/edge-config@^1
pnpm add -D @testing-library/react@^14 @testing-library/jest-dom@^6 @testing-library/user-event@^14
```

**Verify:**
```bash
node -e "require('iron-session'); console.log('iron-session OK')"
node -e "require('@tanstack/react-query'); console.log('react-query OK')"
node -e "require('zod'); console.log('zod OK')"
node -e "require('@vercel/edge-config'); console.log('edge-config OK')"
```

### Step 1.2: Upgrade TypeScript to 5.3

- [ ] Update TypeScript version

```bash
pnpm add -D typescript@~5.3
```

**Verify:**
```bash
npx tsc --version  # Should show 5.3.x
pnpm quality:admin-v2  # Must pass (0 errors on admin-v2 scope)
npx next build 2>&1 | tail -5  # Full build must still compile (ignoreBuildErrors: true protects legacy)
```

**Why:** zod and @tanstack/react-query use TS 5.x features. `ignoreBuildErrors: true` protects legacy code.

### Step 1.3: Clean up next.config.js

- [ ] Remove `/api/admin/:path*` catch-all rewrite (line 15) — conflicts with BFF route handlers
- [ ] Keep `/api/admin/rematch-request` specific rewrite (line 7) — maps to different backend path
- [ ] Remove dev webpack hack (lines 36-46) — manual `react-refresh/runtime` injection
- [ ] Remove cache invalidation hacks: `CACHE_INVALIDATION` env (lines 60-63), `generateBuildId` (lines 65-68)
- [ ] Keep `reactStrictMode: false` (line 71) — legacy pages have side-effectful useEffects that break with double-mount

**After (full file):**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8044/api';
    return [
      { source: '/api/admin/rematch-request', destination: `${backendUrl}/admin/matching/rematch-request` },
      { source: '/api/notifications/:path*', destination: `${backendUrl}/notifications/:path*` },
      { source: '/api/notifications', destination: `${backendUrl}/notifications` },
      { source: '/api/matchings/:path*', destination: `${backendUrl}/matchings/:path*` },
      { source: '/api/offline-meetings/:path*', destination: `${backendUrl}/offline-meetings/:path*` },
      { source: '/api/offline-meetings', destination: `${backendUrl}/offline-meetings` },
      { source: '/api/user-preferences', destination: `${backendUrl}/user-preferences` },
      { source: '/api/profile', destination: `${backendUrl}/profile` },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sometimes-resources.s3.ap-northeast-2.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  experimental: {
    serverComponentsExternalPackages: ['react-dom'],
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
```

**Verify:**
```bash
npx next build 2>&1 | tail -10  # Must compile
curl -s http://localhost:3000/api/admin/rematch-request 2>&1 || echo "rewrite check needs running dev server"
```

### Step 1.4: Add environment variables template

- [ ] Add new env vars to `.env.example` (create if not exists)

```env
# Phase 1: Admin v2 Auth
ADMIN_SESSION_SECRET=         # iron-session signing secret (min 32 chars)
EDGE_CONFIG=                  # Vercel Edge Config connection string
```

**Note:** `ADMIN_SESSION_SECRET` must be a random 32+ character string. Generate with `openssl rand -base64 32`.

---

## Chunk 2: Auth & Session (BFF)

> **Dependencies:** Chunk 1 complete
> **Parallelizable with:** Chunk 3

### Step 2.1: Create shared auth utilities

- [ ] Create `shared/auth/session-config.ts` — iron-session configuration

```typescript
// shared/auth/session-config.ts
import type { SessionOptions } from 'iron-session';

export const ADMIN_COOKIE_NAME = 'admin_access_token';
export const ADMIN_META_COOKIE = 'admin_session_meta';

export interface AdminSessionMeta {
  id: string;
  email: string;
  roles: string[];
  issuedAt: number;
  selectedCountry: string;
}

export interface AdminSessionData {
  accessToken: string;
  meta: AdminSessionMeta;
}

export const sessionOptions: SessionOptions = {
  password: process.env.ADMIN_SESSION_SECRET || 'DEVELOPMENT_SECRET_MUST_BE_32_CHARS_LONG!!',
  cookieName: ADMIN_META_COOKIE,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 8, // 8 hours
  },
};
```

- [ ] Create `shared/auth/cookies.ts` — cookie read/write helpers

```typescript
// shared/auth/cookies.ts
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import {
  ADMIN_COOKIE_NAME,
  sessionOptions,
  type AdminSessionMeta,
} from './session-config';

export async function getAdminAccessToken(): Promise<string | null> {
  const cookieStore = cookies();
  return cookieStore.get(ADMIN_COOKIE_NAME)?.value ?? null;
}

export async function setAdminAccessToken(token: string): Promise<void> {
  const cookieStore = cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  });
}

export async function clearAdminCookies(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  cookieStore.delete(sessionOptions.cookieName);
}

export async function getSessionMeta(): Promise<AdminSessionMeta | null> {
  try {
    const cookieStore = cookies();
    const session = await getIronSession<AdminSessionMeta>(cookieStore, sessionOptions);
    if (!session.id) return null;
    return {
      id: session.id,
      email: session.email,
      roles: session.roles,
      issuedAt: session.issuedAt,
      selectedCountry: session.selectedCountry,
    };
  } catch {
    return null;
  }
}

export async function setSessionMeta(meta: AdminSessionMeta): Promise<void> {
  const cookieStore = cookies();
  const session = await getIronSession<AdminSessionMeta>(cookieStore, sessionOptions);
  session.id = meta.id;
  session.email = meta.email;
  session.roles = meta.roles;
  session.issuedAt = meta.issuedAt;
  session.selectedCountry = meta.selectedCountry;
  await session.save();
}
```

- [ ] Create `shared/auth/index.ts` — barrel export

```typescript
export { sessionOptions, ADMIN_COOKIE_NAME, ADMIN_META_COOKIE } from './session-config';
export type { AdminSessionMeta, AdminSessionData } from './session-config';
export {
  getAdminAccessToken,
  setAdminAccessToken,
  clearAdminCookies,
  getSessionMeta,
  setSessionMeta,
} from './cookies';
```

### Step 2.2: Create BFF route handlers

5 route handlers per spec + 1 sync endpoint for migration:

#### 2.2.1: `/api/admin/auth/login` (POST)

- [ ] Create `app/api/admin/auth/login/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { setAdminAccessToken, setSessionMeta } from '@/shared/auth';
import type { AdminSessionMeta } from '@/shared/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8044/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Proxy to backend login
    const backendRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!backendRes.ok) {
      const error = await backendRes.json().catch(() => ({ message: 'Login failed' }));
      return NextResponse.json(error, { status: backendRes.status });
    }

    const data = await backendRes.json();

    // Verify admin role
    const roles: string[] = data.user?.roles || [];
    if (!roles.includes('admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Set httpOnly cookie with access token
    await setAdminAccessToken(data.accessToken);

    // Set signed session meta cookie
    const meta: AdminSessionMeta = {
      id: data.user.id,
      email: data.user.email,
      roles,
      issuedAt: Date.now(),
      selectedCountry: 'kr',
    };
    await setSessionMeta(meta);

    // Return accessToken + user for legacy localStorage storage
    // (LegacyPageAdapter needs this for backward compat)
    return NextResponse.json({
      accessToken: data.accessToken,
      user: data.user,
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Security note:** The response includes `accessToken` so the client can store it in localStorage for legacy page compatibility. This is the same security level as the current flow (token already exposed to JS). The cookie provides the NEW secure path.

#### 2.2.2: `/api/admin/auth/logout` (POST)

- [ ] Create `app/api/admin/auth/logout/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { clearAdminCookies } from '@/shared/auth';

export async function POST() {
  await clearAdminCookies();
  return NextResponse.json({ success: true });
}
```

#### 2.2.3: `/api/admin/session` (GET)

- [ ] Create `app/api/admin/session/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getAdminAccessToken, getSessionMeta, clearAdminCookies } from '@/shared/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8044/api';

export async function GET() {
  const token = await getAdminAccessToken();
  const meta = await getSessionMeta();

  if (!token || !meta) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Validate token against backend
    const profileRes = await fetch(`${BACKEND_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!profileRes.ok) {
      await clearAdminCookies();
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Return session DTO (meta from signed cookie, validated by backend)
    return NextResponse.json({
      user: {
        id: meta.id,
        email: meta.email,
        roles: meta.roles,
      },
      selectedCountry: meta.selectedCountry,
      issuedAt: meta.issuedAt,
    });
  } catch (error) {
    console.error('Session check error:', error);
    await clearAdminCookies();
    return NextResponse.json({ error: 'Session validation failed' }, { status: 401 });
  }
}
```

#### 2.2.4: `/api/admin/session/country` (POST)

- [ ] Create `app/api/admin/session/country/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSessionMeta, setSessionMeta } from '@/shared/auth';

export async function POST(request: NextRequest) {
  const meta = await getSessionMeta();
  if (!meta) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { country } = await request.json();
  if (!country || typeof country !== 'string') {
    return NextResponse.json({ error: 'Invalid country' }, { status: 400 });
  }

  await setSessionMeta({ ...meta, selectedCountry: country });
  return NextResponse.json({ selectedCountry: country });
}
```

#### 2.2.5: `/api/admin-proxy/[...path]` (ALL methods)

- [ ] Create `app/api/admin-proxy/[...path]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAccessToken, getSessionMeta } from '@/shared/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8044/api';

async function proxyRequest(request: NextRequest, { params }: { params: { path: string[] } }) {
  const token = await getAdminAccessToken();
  const meta = await getSessionMeta();

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const targetPath = params.path.join('/');
  // Do NOT prepend /admin/ — legacy axios paths already include it
  // e.g. axiosServer.get('/admin/users') → /api/admin-proxy/admin/users → BACKEND_URL/admin/users
  const url = new URL(`${BACKEND_URL}/${targetPath}`);

  // Preserve query params
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  // Forward headers — preserve original Content-Type for multipart support
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  if (meta?.selectedCountry) {
    headers['x-country'] = meta.selectedCountry;
  }

  // Forward body for non-GET requests
  let body: BodyInit | null = null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    // Use arrayBuffer to handle both JSON and multipart/form-data
    body = await request.arrayBuffer();
  }

  const backendRes = await fetch(url.toString(), {
    method: request.method,
    headers,
    body,
  });

  // Forward response
  const responseBody = await backendRes.arrayBuffer();
  return new NextResponse(responseBody, {
    status: backendRes.status,
    headers: {
      'Content-Type': backendRes.headers.get('Content-Type') || 'application/json',
    },
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
```

**Key fix (review finding):** Uses `arrayBuffer()` for body forwarding and preserves original `Content-Type` header. This correctly handles multipart form uploads (file attachments, image uploads).

#### 2.2.6: `/api/admin/auth/sync` (POST) — Migration endpoint

- [ ] Create `app/api/admin/auth/sync/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { setAdminAccessToken, setSessionMeta } from '@/shared/auth';
import type { AdminSessionMeta } from '@/shared/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8044/api';

/**
 * Sync endpoint: Client sends its existing localStorage token,
 * server validates it and sets httpOnly cookies.
 *
 * This handles the transition case where a user has a valid
 * localStorage session but no cookie yet.
 *
 * Security: The client is sending a token it ALREADY has access to
 * (from localStorage). We're establishing cookies from it, not
 * exposing any new data.
 */
export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();
    if (!accessToken || typeof accessToken !== 'string') {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    // Validate token against backend
    const profileRes = await fetch(`${BACKEND_URL}/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileRes.ok) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const profile = await profileRes.json();
    const roles: string[] = profile.roles || [];

    if (!roles.includes('admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Set cookies
    await setAdminAccessToken(accessToken);

    const meta: AdminSessionMeta = {
      id: profile.id,
      email: profile.email,
      roles,
      issuedAt: Date.now(),
      selectedCountry: 'kr',
    };
    await setSessionMeta(meta);

    return NextResponse.json({ success: true, user: profile });
  } catch (error) {
    console.error('Auth sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
```

#### 2.2.7: `/api/admin/auth/refresh` (POST) — Token renewal

- [ ] Create `app/api/admin/auth/refresh/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getAdminAccessToken, setAdminAccessToken, getSessionMeta, setSessionMeta, clearAdminCookies } from '@/shared/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8044/api';

/**
 * Token refresh via BFF. Keeps httpOnly cookie in sync with backend token.
 *
 * Flow:
 * 1. Read current token from httpOnly cookie
 * 2. Call backend /auth/refresh with withCredentials (backend uses its own refresh cookie)
 * 3. Get new accessToken from backend
 * 4. Update httpOnly cookie with new token
 * 5. Update iron-session meta (issuedAt)
 * 6. Return new token for legacy localStorage update
 *
 * Without this endpoint, legacy 401 interceptor refreshes directly to backend,
 * updating localStorage but leaving httpOnly cookie stale.
 */
export async function POST() {
  const currentToken = await getAdminAccessToken();
  const meta = await getSessionMeta();

  if (!currentToken || !meta) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Call backend refresh endpoint
    // Backend uses its own httpOnly refresh token cookie (withCredentials)
    const backendRes = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-country': 'kr', // Auth endpoints always use kr schema
        Authorization: `Bearer ${currentToken}`,
      },
      // Note: server-side fetch does not forward browser cookies.
      // Backend refresh relies on the Authorization header, not browser cookies.
    });

    if (!backendRes.ok) {
      // Refresh failed — clear session
      await clearAdminCookies();
      return NextResponse.json({ error: 'Refresh failed' }, { status: 401 });
    }

    const data = await backendRes.json();
    const newToken = data.accessToken;

    if (!newToken) {
      await clearAdminCookies();
      return NextResponse.json({ error: 'No token in refresh response' }, { status: 401 });
    }

    // Update httpOnly cookie with new token
    await setAdminAccessToken(newToken);

    // Update session meta (refresh issuedAt)
    await setSessionMeta({ ...meta, issuedAt: Date.now() });

    // Return new token for legacy localStorage update
    return NextResponse.json({ accessToken: newToken });
  } catch (error) {
    console.error('Admin refresh error:', error);
    await clearAdminCookies();
    return NextResponse.json({ error: 'Refresh error' }, { status: 500 });
  }
}
```

**Why this is needed:** Without this, the 401 interceptor in `utils/axios.ts:124` refreshes directly to backend → new token saved in localStorage/JS cookie → but httpOnly `admin_access_token` cookie stays stale → BFF proxy uses stale token → next BFF call fails.

### Step 2.3: Write BFF tests

- [ ] Create `__tests__/api/admin/auth/login.test.ts`

```typescript
// Test: POST /api/admin/auth/login
// - Valid admin credentials → 200 + cookies set + accessToken in body
// - Non-admin user → 403
// - Invalid credentials → 401 (proxied from backend)
// - Backend down → 500
```

- [ ] Create `__tests__/api/admin/auth/sync.test.ts`

```typescript
// Test: POST /api/admin/auth/sync
// - Valid localStorage token → 200 + cookies set
// - Invalid token → 401
// - Non-admin token → 403
// - Missing token → 400
```

- [ ] Create `__tests__/api/admin/auth/refresh.test.ts`

```typescript
// Test: POST /api/admin/auth/refresh
// - Valid cookie token → backend refresh → 200 + new token + cookie updated
// - No cookie → 401
// - Backend refresh fails → 401 + cookies cleared
// - Expired session meta → 401
```

- [ ] Create `__tests__/api/admin/session.test.ts`

```typescript
// Test: GET /api/admin/session
// - Valid cookies → 200 + session DTO
// - No cookies → 401
// - Expired token → 401 + cookies cleared
```

- [ ] Create `__tests__/api/admin-proxy.test.ts`

```typescript
// Test: ALL methods /api/admin-proxy/[...path]
// - GET request → forwards with auth header + country header
// - POST with JSON → forwards body + correct Content-Type
// - POST with multipart → forwards body + preserves Content-Type boundary
// - No auth cookie → 401
```

**Verify:**
```bash
pnpm jest __tests__/api/admin/ --passWithNoTests
```

---

## Chunk 3: Infrastructure (Feature Flags, Middleware, Root Layout)

> **Dependencies:** Chunk 1 complete
> **Parallelizable with:** Chunk 2

### Step 3.1: Feature Flags via Vercel Edge Config

- [ ] Create `shared/feature-flags/index.ts`

```typescript
// shared/feature-flags/index.ts
import { createClient } from '@vercel/edge-config';

// Feature flag keys
export const FLAGS = {
  ADMIN_SHELL_V2: 'admin_shell_v2',
  ADMIN_ROUTE_PREFIX: 'admin_route_mode_',
} as const;

// Route modes
export type RouteMode = 'legacy' | 'legacy-adapted' | 'v2';

const edgeConfig = process.env.EDGE_CONFIG ? createClient(process.env.EDGE_CONFIG) : null;

/**
 * Get a feature flag value. Falls back to defaultValue if Edge Config
 * is not configured (local dev) or key doesn't exist.
 */
export async function getFlag<T>(key: string, defaultValue: T): Promise<T> {
  if (!edgeConfig) return defaultValue;
  try {
    const value = await edgeConfig.get<T>(key);
    return value ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Check if the new admin shell is enabled.
 * Default: true (Phase 1 ships with v2 enabled)
 */
export async function isAdminShellV2Enabled(): Promise<boolean> {
  return getFlag(FLAGS.ADMIN_SHELL_V2, true);
}

/**
 * Get route mode for a specific admin route.
 * Default: 'legacy-adapted' (all pages wrapped in LegacyPageAdapter)
 */
export async function getRouteMode(route: string): Promise<RouteMode> {
  return getFlag(`${FLAGS.ADMIN_ROUTE_PREFIX}${route}`, 'legacy-adapted');
}
```

**Local dev:** When `EDGE_CONFIG` env is not set, all flags return defaults. No external dependency needed for development.

**Rollback:** Set `admin_shell_v2=false` in Vercel Edge Config dashboard → instant effect, no redeploy.

### Step 3.2: Update middleware

- [ ] Rewrite `middleware.ts` — permissive for admin during Phase 1

```typescript
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public paths — always allow
  const publicPaths = ['/', '/signup', '/signup/test'];
  if (publicPaths.some((p) => pathname === p)) {
    return NextResponse.next();
  }

  // API routes — always allow (BFF handles its own auth)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Admin paths — allow through, AdminShell handles auth
  // Phase 1: Permissive. AdminShell validates session (cookie-first, localStorage-fallback).
  // Phase 6: Middleware will enforce cookie presence.
  if (pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // All other protected routes — check for legacy auth
  // (non-admin routes still use the old flow until later phases)
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

**Why permissive:** During Phase 1, the login page still uses the old AuthContext flow (stores token in localStorage, no cookie). If middleware required a cookie, logged-in users would get redirected. AdminShell handles dual-auth: cookie first, localStorage fallback + sync.

### Step 3.3: Convert root layout to Server Component

- [ ] Rewrite `app/layout.tsx` — separate Server/Client concerns

```typescript
// app/layout.tsx (Server Component — NO 'use client')
import './globals.css';
import type { Metadata } from 'next';
import { ClientProviders } from './client-providers';

export const metadata: Metadata = {
  title: 'Sometime',
  description: '나의 이상형을 찾아서',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <ClientProviders>
          <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
            {children}
          </main>
        </ClientProviders>
      </body>
    </html>
  );
}
```

- [ ] Create `app/client-providers.tsx`

```typescript
'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ModalProvider } from '@/shared/ui/modal/context';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ModalProvider>
        {children}
      </ModalProvider>
    </AuthProvider>
  );
}
```

**Verify:**
```bash
npx next build 2>&1 | tail -10  # Must compile
# Check existing user-facing pages still render correctly
```

---

## Chunk 4: Shell & Core UI

> **Dependencies:** Chunks 2+3 complete
> **Parallelizable with:** Nothing — depends on auth + infra

### Step 4.1: Set up React Query provider

- [ ] Create `shared/providers/query-provider.tsx`

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

export function AdminQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,      // 1 minute
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### Step 4.2: Create AdminSession context

- [ ] Create `shared/contexts/admin-session-context.tsx`

```typescript
'use client';

import { createContext, useContext, type ReactNode } from 'react';

export interface AdminSession {
  user: {
    id: string;
    email: string;
    roles: string[];
  };
  selectedCountry: string;
  issuedAt: number;
}

interface AdminSessionContextValue {
  session: AdminSession | null;
  isLoading: boolean;
  error: string | null;
  changeCountry: (country: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminSessionContext = createContext<AdminSessionContextValue | null>(null);

export function useAdminSession() {
  const ctx = useContext(AdminSessionContext);
  if (!ctx) throw new Error('useAdminSession must be used within AdminSessionProvider');
  return ctx;
}

export { AdminSessionContext };
```

**Key fix (review finding):** Session is fetched ONCE in AdminShell and passed via context. LegacyPageAdapter and child components consume this context — no duplicate `/api/admin/session` calls.

### Step 4.3: Create shared admin UI components

- [ ] Create `shared/ui/admin/sidebar.tsx` — Navigation sidebar

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
}

interface NavCategory {
  icon: string;
  label: string;
  items: NavItem[];
}

// Copied from current app/admin/layout.tsx sidebar
export const NAV_CATEGORIES: NavCategory[] = [
  {
    icon: '📊',
    label: '대시보드',
    items: [
      { href: '/admin/dashboard', label: '대시보드' },
      { href: '/admin/dashboard/member-stats', label: '회원 통계' },
      { href: '/admin/kpi-report', label: 'KPI 리포트' },
      { href: '/admin/app-reviews', label: '앱 리뷰 관리' },
    ],
  },
  {
    icon: '👥',
    label: '회원 관리',
    items: [
      { href: '/admin/users/appearance', label: '외모 관리' },
      { href: '/admin/profile-review', label: '프로필 심사' },
      { href: '/admin/reports', label: '신고 관리' },
      { href: '/admin/community', label: '커뮤니티' },
      { href: '/admin/support-chat', label: '고객 지원' },
      { href: '/admin/universities', label: '대학교 관리' },
      { href: '/admin/universities/clusters', label: '대학교 클러스터' },
      { href: '/admin/reset-password', label: '비밀번호 초기화' },
    ],
  },
  {
    icon: '💕',
    label: '매칭/채팅',
    items: [
      { href: '/admin/matching-management', label: '매칭 관리' },
      { href: '/admin/likes', label: '좋아요 관리' },
      { href: '/admin/scheduled-matching', label: '정기 매칭' },
      { href: '/admin/chat', label: '채팅 관리' },
      { href: '/admin/ai-chat', label: 'AI 채팅' },
      { href: '/admin/moment', label: '모먼트' },
    ],
  },
  {
    icon: '💰',
    label: '결제/매출',
    items: [
      { href: '/admin/sales', label: '매출 조회' },
      { href: '/admin/gems', label: '구슬 관리' },
      { href: '/admin/gems/pricing', label: '구슬 가격표' },
      { href: '/admin/ios-refund', label: 'iOS 환불 관리' },
    ],
  },
  {
    icon: '📢',
    label: '마케팅',
    items: [
      { href: '/admin/sms', label: 'SMS 관리' },
      { href: '/admin/push-notifications', label: '푸시 알림 관리' },
      { href: '/admin/fcm-tokens', label: 'FCM 토큰 현황' },
      { href: '/admin/card-news', label: '카드뉴스 관리' },
      { href: '/admin/banners', label: '배너 관리' },
      { href: '/admin/sometime-articles', label: '썸타임 이야기' },
    ],
  },
  {
    icon: '🔄',
    label: '리텐션',
    items: [
      { href: '/admin/female-retention', label: '여성 유저 리텐션' },
      { href: '/admin/deleted-females', label: '탈퇴 회원 복구' },
      { href: '/admin/dormant-likes', label: '파묘 좋아요' },
      { href: '/admin/dormant-likes/logs', label: '처리 이력' },
    ],
  },
  {
    icon: '⚙️',
    label: '설정',
    items: [
      { href: '/admin/version-management', label: '버전 관리' },
      { href: '/admin/lab', label: '실험실' },
    ],
  },
];

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto py-4">
      {NAV_CATEGORIES.map((category) => (
        <div key={category.label}>
          <div className="px-4 py-2 mt-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {category.icon} {category.label}
          </div>
          <ul>
            {category.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={`block px-4 py-2 transition-colors ${
                    pathname === item.href
                      ? 'bg-primary-DEFAULT text-white'
                      : 'text-gray-600 hover:bg-primary-DEFAULT hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
```

- [ ] Create `shared/ui/admin/header.tsx` — Top header bar
- [ ] Create `shared/ui/admin/loading.tsx` — Admin loading skeleton

### Step 4.4: Create AdminCountrySelectorModal

- [ ] Create `shared/ui/admin/admin-country-selector.tsx`

```typescript
'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
} from '@mui/material';
import { useAdminSession } from '@/shared/contexts/admin-session-context';

type Country = 'kr' | 'jp';

const countries: { code: Country; flag: string; name: string; description: string }[] = [
  { code: 'kr', flag: '🇰🇷', name: '대한민국', description: '한국 사용자 데이터' },
  { code: 'jp', flag: '🇯🇵', name: '日本', description: '일본 사용자 데이터' },
];

interface AdminCountrySelectorModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Country selector that updates BOTH the session cookie (via BFF)
 * AND localStorage (for legacy pages). Replaces legacy CountrySelectorModal
 * inside AdminShell.
 *
 * Key difference from legacy: calls useAdminSession().changeCountry()
 * which updates the server-side session cookie via /api/admin/session/country.
 * Legacy version only wrote to localStorage, causing desync after reload.
 */
export function AdminCountrySelectorModal({ open, onClose }: AdminCountrySelectorModalProps) {
  const { session, changeCountry } = useAdminSession();
  const currentCountry = (session?.selectedCountry || 'kr') as Country;

  const handleSelect = async (code: Country) => {
    if (code === currentCountry) {
      onClose();
      return;
    }

    // Update session cookie (BFF) + localStorage (legacy compat)
    await changeCountry(code);
    onClose();

    // Reload to apply country change across all data
    setTimeout(() => window.location.reload(), 300);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight={700}>운영 국가 선택</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          선택한 국가의 데이터만 조회/수정됩니다
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
          {countries.map((c) => {
            const isSelected = currentCountry === c.code;
            const borderColor = isSelected
              ? c.code === 'kr' ? '#3B82F6' : '#EF4444'
              : '#E5E7EB';
            const bgColor = isSelected
              ? c.code === 'kr' ? '#EFF6FF' : '#FEF2F2'
              : 'transparent';
            return (
              <Box
                key={c.code}
                onClick={() => handleSelect(c.code)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 2, p: 2,
                  border: `2px solid ${borderColor}`, borderRadius: 2,
                  backgroundColor: bgColor, cursor: 'pointer', transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: c.code === 'kr' ? '#3B82F6' : '#EF4444',
                    backgroundColor: c.code === 'kr' ? '#EFF6FF' : '#FEF2F2',
                  },
                }}
              >
                <Typography sx={{ fontSize: '2rem' }}>{c.flag}</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={600}>{c.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{c.description}</Typography>
                </Box>
                {isSelected && (
                  <Typography sx={{ color: c.code === 'kr' ? '#3B82F6' : '#EF4444', fontWeight: 700 }}>✓</Typography>
                )}
              </Box>
            );
          })}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">닫기</Button>
      </DialogActions>
    </Dialog>
  );
}
```

**Why this replaces the legacy modal:** The legacy `CountrySelectorModal` calls `useCountry().setCountry()` which only writes to localStorage. After page reload, AdminShell reads `selectedCountry` from the session cookie (old value) and the bridge overwrites localStorage → user's change is lost. This new modal calls `changeCountry()` which updates the cookie via BFF first.

### Step 4.5: Create AdminShell

- [ ] Create `shared/ui/admin/admin-shell.tsx`

```typescript
'use client';

import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSessionContext, type AdminSession } from '@/shared/contexts/admin-session-context';
import { AdminQueryProvider } from '@/shared/providers/query-provider';
import { AdminSidebar } from './sidebar';
import { AdminCountrySelectorModal } from './admin-country-selector';

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [countryModalOpen, setCountryModalOpen] = useState(false);

  // Dual auth: cookie-first, localStorage-fallback with sync
  useEffect(() => {
    async function initSession() {
      setIsLoading(true);

      // 1. Try cookie-based session
      try {
        const res = await fetch('/api/admin/session');
        if (res.ok) {
          const data = await res.json();
          setSession(data);
          setIsLoading(false);
          return;
        }
      } catch {
        // Cookie session failed, try fallback
      }

      // 2. Fallback: check localStorage for existing token
      const localToken = localStorage.getItem('accessToken');
      if (localToken) {
        try {
          // Sync localStorage token to cookies
          const syncRes = await fetch('/api/admin/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken: localToken }),
          });

          if (syncRes.ok) {
            // Now fetch session from newly set cookies
            const sessionRes = await fetch('/api/admin/session');
            if (sessionRes.ok) {
              const data = await sessionRes.json();
              setSession(data);
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // Sync failed
        }
      }

      // 3. No valid session — redirect to login
      setError('Authentication required');
      setIsLoading(false);
      router.push('/');
    }

    initSession();
  }, [router]);

  const changeCountry = useCallback(async (country: string) => {
    const res = await fetch('/api/admin/session/country', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country }),
    });
    if (res.ok) {
      setSession((prev) => prev ? { ...prev, selectedCountry: country } : null);
      // Also update localStorage for legacy pages
      localStorage.setItem('admin_selected_country', country);
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    // Clear legacy localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('admin_selected_country');
    setSession(null);
    router.push('/');
  }, [router]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (error || !session) {
    return null; // Redirecting to login
  }

  return (
    <AdminSessionContext.Provider value={{ session, isLoading, error, changeCountry, logout }}>
      <AdminQueryProvider>
          <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform md:relative md:translate-x-0 ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">관리자 대시보드</h2>
                <p className="text-sm text-gray-500">{session.user.email}</p>
              </div>
              <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
              <div className="px-4 pt-4 mt-3 border-t">
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  로그아웃
                </button>
              </div>
            </div>

            {/* Mobile overlay */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-auto">
              <div className="md:hidden flex items-center justify-between p-4 bg-white shadow-sm">
                <h1 className="text-lg font-semibold">관리자 대시보드</h1>
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-md hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
              <main className="p-6">{children}</main>
            </div>

            {/* Country Selector */}
            <AdminCountrySelectorModal
              open={countryModalOpen}
              onClose={() => setCountryModalOpen(false)}
            />
          </div>
      </AdminQueryProvider>
    </AdminSessionContext.Provider>
  );
}
```

### Step 4.5: Create new admin layout

- [ ] Replace `app/admin/layout.tsx` with new shell-based layout

```typescript
// app/admin/layout.tsx (Server Component)
import { AdminShell } from '@/shared/ui/admin/admin-shell';
import { isAdminShellV2Enabled } from '@/shared/feature-flags';

// Legacy layout import for rollback
import LegacyAdminLayout from './legacy-layout';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const shellV2 = await isAdminShellV2Enabled();

  if (!shellV2) {
    return <LegacyAdminLayout>{children}</LegacyAdminLayout>;
  }

  return <AdminShell>{children}</AdminShell>;
}
```

- [ ] Rename current `app/admin/layout.tsx` → `app/admin/legacy-layout.tsx` (backup for rollback)

**Verify:**
```bash
npx next build 2>&1 | tail -10
# Dev server: visit /admin/dashboard → should see new shell with sidebar
```

---

## Chunk 5: Legacy Bridge

> **Dependencies:** Chunk 4 complete
> **Parallelizable with:** Nothing — depends on AdminShell

### Step 5.1: Create LegacyAuthBridgeProvider

- [ ] Create `shared/ui/admin/legacy-auth-bridge.tsx`

```typescript
'use client';

import { useEffect, type ReactNode } from 'react';
import { useAdminSession } from '@/shared/contexts/admin-session-context';

/**
 * Syncs cookie-based session data to localStorage so legacy pages
 * that read from localStorage continue to work.
 *
 * Consumes AdminSession context (set by AdminShell).
 * Does NOT make its own /api/admin/session call (review fix).
 */
export function LegacyAuthBridgeProvider({ children }: { children: ReactNode }) {
  const { session } = useAdminSession();

  useEffect(() => {
    if (!session) return;

    // Sync session data to localStorage for legacy page compatibility
    // Legacy pages read: accessToken, user, isAdmin from localStorage
    const userData = {
      id: session.user.id,
      email: session.user.email,
      roles: session.user.roles,
    };
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('isAdmin', 'true');
    // Note: accessToken in localStorage is set during login or sync flow
    // We don't set it here because we don't have the raw token (it's in httpOnly cookie)
  }, [session]);

  return <>{children}</>;
}
```

### Step 5.2: Create LegacyCountryBridgeProvider

- [ ] Create `shared/ui/admin/legacy-country-bridge.tsx`

```typescript
'use client';

import { useLayoutEffect, type ReactNode } from 'react';
import { useAdminSession } from '@/shared/contexts/admin-session-context';

/**
 * Syncs cookie-based country selection to localStorage so legacy
 * CountryProvider reads the correct value on mount.
 *
 * Uses useLayoutEffect to sync BEFORE paint (review fix: race condition).
 */
export function LegacyCountryBridgeProvider({ children }: { children: ReactNode }) {
  const { session } = useAdminSession();

  useLayoutEffect(() => {
    if (!session?.selectedCountry) return;
    localStorage.setItem('admin_selected_country', session.selectedCountry);
  }, [session?.selectedCountry]);

  return <>{children}</>;
}
```

### Step 5.3: Create admin axios interceptor

- [ ] Create `shared/lib/http/admin-axios-interceptor.ts`

```typescript
// shared/lib/http/admin-axios-interceptor.ts
import axiosServer, { axiosMultipart, axiosNextGen } from '@/utils/axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

/**
 * Patches an axios instance to route requests through the BFF proxy.
 *
 * PROBLEM: Legacy admin pages use axios with baseURL = NEXT_PUBLIC_API_URL
 * which hits the backend directly. This bypasses the BFF and httpOnly cookies.
 *
 * SOLUTION: When inside AdminShell, add request interceptors that:
 * 1. Rewrite baseURL to /api/admin-proxy (BFF proxy)
 * 2. Remove Authorization header (BFF reads token from httpOnly cookie)
 * 3. Remove x-country header (BFF reads country from session cookie)
 *
 * The BFF proxy preserves the full path, so:
 *   axiosServer.get('/admin/users') → /api/admin-proxy/admin/users → BACKEND_URL/admin/users
 *
 * Returns an unpatch function to call on component unmount.
 */
function patchInstance(instance: AxiosInstance): () => void {
  const requestId = instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Rewrite to go through BFF proxy
      config.baseURL = '/api/admin-proxy';
      // BFF handles auth via httpOnly cookie — remove client-side token
      delete config.headers.Authorization;
      // BFF handles country via session cookie — remove client-side header
      delete config.headers['x-country'];
      return config;
    }
  );

  // Override 401 response interceptor: refresh through BFF instead of direct backend
  const responseId = instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401 && !error.config?._bffRetry) {
        error.config._bffRetry = true;

        try {
          // Refresh through BFF — updates httpOnly cookie
          const refreshRes = await fetch('/api/admin/auth/refresh', { method: 'POST' });

          if (refreshRes.ok) {
            const data = await refreshRes.json();
            // Update localStorage for legacy compatibility
            if (data.accessToken) {
              localStorage.setItem('accessToken', data.accessToken);
            }
            // Retry original request (will go through BFF proxy with new cookie)
            return instance(error.config);
          }
        } catch {
          // Refresh failed
        }

        // Refresh failed — redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
      return Promise.reject(error);
    }
  );

  return () => {
    instance.interceptors.request.eject(requestId);
    instance.interceptors.response.eject(responseId);
  };
}

/**
 * Patch all admin axios instances to route through BFF.
 * Call in LegacyPageAdapter useEffect, cleanup on unmount.
 */
export function patchAdminAxios(): () => void {
  const unpatchServer = patchInstance(axiosServer);
  const unpatchMultipart = patchInstance(axiosMultipart);
  const unpatchNextGen = patchInstance(axiosNextGen);

  return () => {
    unpatchServer();
    unpatchMultipart();
    unpatchNextGen();
  };
}
```

**Why this is critical:** Without this, the BFF proxy is dead code. Legacy pages call `axiosServer.get('/admin/users')` which goes to `NEXT_PUBLIC_API_URL/admin/users` (direct backend) with localStorage token. The BFF's httpOnly cookie auth is never used. This interceptor redirects all admin API traffic through `/api/admin-proxy`, making cookie-based auth actually work.

### Step 5.4: Create LegacyPageAdapter

- [ ] Create `shared/ui/admin/legacy-page-adapter.tsx`

```typescript
'use client';

import { useEffect, type ReactNode } from 'react';
import { LegacyAuthBridgeProvider } from './legacy-auth-bridge';
import { LegacyCountryBridgeProvider } from './legacy-country-bridge';
import { ErrorBoundary } from '@/shared/ui/error-boundary';
import { patchAdminAxios } from '@/shared/lib/http/admin-axios-interceptor';

/**
 * Wraps legacy admin pages to run inside the new AdminShell.
 *
 * Structure:
 *   AdminShell (session context)
 *     └─ LegacyPageAdapter
 *          └─ Axios interceptor (routes API calls through BFF)
 *          └─ LegacyAuthBridgeProvider (syncs session → localStorage)
 *               └─ LegacyCountryBridgeProvider (syncs country → localStorage)
 *                    └─ ErrorBoundary
 *                         └─ Legacy page component
 *
 * The axios interceptor is critical: it rewrites all admin API calls
 * from direct backend access to /api/admin-proxy, making cookie-based
 * auth actually work for legacy pages.
 */
export function LegacyPageAdapter({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Patch axios to route through BFF proxy
    const unpatch = patchAdminAxios();
    return () => unpatch();
  }, []);

  return (
    <LegacyAuthBridgeProvider>
      <LegacyCountryBridgeProvider>
        <ErrorBoundary fallback={<div className="p-4 text-red-500">페이지 로딩 오류</div>}>
          {children}
        </ErrorBoundary>
      </LegacyCountryBridgeProvider>
    </LegacyAuthBridgeProvider>
  );
}
```

- [ ] Create `shared/ui/error-boundary.tsx` (if not exists)

```typescript
'use client';

import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('LegacyPageAdapter error:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
```

### Step 5.4: Wrap all 41 legacy pages

Each existing `page.tsx` gets wrapped in `LegacyPageAdapter`. The pattern:

```typescript
// Before:
export default function SomePage() { ... }

// After:
import { LegacyPageAdapter } from '@/shared/ui/admin/legacy-page-adapter';

function SomePageContent() { ... }  // renamed from default

export default function SomePage() {
  return (
    <LegacyPageAdapter>
      <SomePageContent />
    </LegacyPageAdapter>
  );
}
```

**Complete list of 41 pages to wrap** (from filesystem glob):

| # | Page path | Notes |
|---|-----------|-------|
| 1 | `app/admin/page.tsx` | Root admin page |
| 2 | `app/admin/ai-chat/page.tsx` | |
| 3 | `app/admin/app-reviews/page.tsx` | |
| 4 | `app/admin/banners/page.tsx` | |
| 5 | `app/admin/card-news/page.tsx` | |
| 6 | `app/admin/card-news/create/page.tsx` | |
| 7 | `app/admin/card-news/edit/[id]/page.tsx` | Note: `edit/[id]` not `[id]/edit` |
| 8 | `app/admin/chat/page.tsx` | |
| 9 | `app/admin/community/page.tsx` | |
| 10 | `app/admin/dashboard/page.tsx` | |
| 11 | `app/admin/dashboard/member-stats/page.tsx` | |
| 12 | `app/admin/deleted-females/page.tsx` | |
| 13 | `app/admin/dormant-likes/page.tsx` | |
| 14 | `app/admin/dormant-likes/logs/page.tsx` | |
| 15 | `app/admin/fcm-tokens/page.tsx` | |
| 16 | `app/admin/female-retention/page.tsx` | |
| 17 | `app/admin/force-matching/page.tsx` | Not in sidebar |
| 18 | `app/admin/gems/page.tsx` | |
| 19 | `app/admin/gems/pricing/page.tsx` | |
| 20 | `app/admin/ios-refund/page.tsx` | |
| 21 | `app/admin/kpi-report/page.tsx` | |
| 22 | `app/admin/lab/page.tsx` | |
| 23 | `app/admin/likes/page.tsx` | |
| 24 | `app/admin/matching-management/page.tsx` | |
| 25 | `app/admin/moment/page.tsx` | |
| 26 | `app/admin/profile-review/page.tsx` | |
| 27 | `app/admin/push-notifications/page.tsx` | |
| 28 | `app/admin/reports/page.tsx` | |
| 29 | `app/admin/reset-password/page.tsx` | |
| 30 | `app/admin/sales/page.tsx` | |
| 31 | `app/admin/scheduled-matching/page.tsx` | |
| 32 | `app/admin/sms/page.tsx` | |
| 33 | `app/admin/sometime-articles/page.tsx` | |
| 34 | `app/admin/sometime-articles/create/page.tsx` | |
| 35 | `app/admin/sometime-articles/edit/[id]/page.tsx` | |
| 36 | `app/admin/support-chat/page.tsx` | |
| 37 | `app/admin/universities/page.tsx` | |
| 38 | `app/admin/universities/clusters/page.tsx` | |
| 39 | `app/admin/users/page.tsx` | Not in sidebar |
| 40 | `app/admin/users/appearance/page.tsx` | |
| 41 | `app/admin/version-management/page.tsx` | |

**Strategy:** This is highly parallelizable — each page wrap is independent. Split into batches of ~10 pages per agent.

### Step 5.5: Write integration tests

- [ ] Create `__tests__/integration/admin-shell.test.tsx`

```typescript
// Test: AdminShell renders with session
// Test: AdminShell redirects when no session
// Test: AdminShell syncs localStorage token when no cookie
// Test: Country change updates both cookie and localStorage
// Test: Logout clears both cookie and localStorage
```

- [ ] Create `__tests__/integration/legacy-page-adapter.test.tsx`

```typescript
// Test: LegacyPageAdapter syncs session to localStorage
// Test: LegacyCountryBridgeProvider syncs before paint (useLayoutEffect)
// Test: ErrorBoundary catches errors and shows fallback
```

### Step 5.6: Verify full build

- [ ] Run complete verification

```bash
# TypeScript
pnpm quality:admin-v2

# Full build
npx next build

# Tests
pnpm jest --passWithNoTests

# Dev server smoke test
# 1. Start dev server
# 2. Visit /admin/dashboard
# 3. Verify: new shell renders, sidebar navigation works
# 4. Verify: legacy page content displays inside shell
# 5. Verify: country selector works
# 6. Verify: logout works
```

---

## Appendix A: File Creation Summary

### New files (Chunk 2 — Auth)
```
shared/auth/session-config.ts
shared/auth/cookies.ts
shared/auth/index.ts
app/api/admin/auth/login/route.ts
app/api/admin/auth/logout/route.ts
app/api/admin/auth/sync/route.ts
app/api/admin/auth/refresh/route.ts
app/api/admin/session/route.ts
app/api/admin/session/country/route.ts
app/api/admin-proxy/[...path]/route.ts
```

### New files (Chunk 3 — Infra)
```
shared/feature-flags/index.ts
app/client-providers.tsx
```

### New files (Chunk 4 — Shell)
```
shared/providers/query-provider.tsx
shared/contexts/admin-session-context.tsx
shared/ui/admin/sidebar.tsx
shared/ui/admin/header.tsx
shared/ui/admin/loading.tsx
shared/ui/admin/admin-shell.tsx
shared/ui/admin/admin-country-selector.tsx
app/admin/legacy-layout.tsx  (renamed from current layout.tsx)
```

### New files (Chunk 5 — Bridge)
```
shared/lib/http/admin-axios-interceptor.ts
shared/ui/admin/legacy-auth-bridge.tsx
shared/ui/admin/legacy-country-bridge.tsx
shared/ui/admin/legacy-page-adapter.tsx
shared/ui/error-boundary.tsx
```

### Modified files
```
package.json                    (new deps)
next.config.js                  (cleanup)
middleware.ts                   (permissive admin)
app/layout.tsx                  (Server Component)
app/admin/layout.tsx            (new shell-based)
app/admin/*/page.tsx            (41 pages wrapped)
.env.example                   (new env vars)
```

### Test files
```
__tests__/api/admin/auth/login.test.ts
__tests__/api/admin/auth/sync.test.ts
__tests__/api/admin/auth/refresh.test.ts
__tests__/api/admin/session.test.ts
__tests__/api/admin-proxy.test.ts
__tests__/integration/admin-shell.test.tsx
__tests__/integration/legacy-page-adapter.test.tsx
__tests__/integration/admin-axios-interceptor.test.ts
```

## Appendix B: Env Variables Required

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ADMIN_SESSION_SECRET` | Yes (prod) | Dev fallback string | iron-session signing key (32+ chars) |
| `EDGE_CONFIG` | No (local dev) | null | Vercel Edge Config connection string |
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:8044/api` | Backend API URL |

## Appendix C: Rollback Procedures

| Issue | Action | Time to effect |
|-------|--------|----------------|
| New shell broken | Set `admin_shell_v2=false` in Edge Config | Instant |
| Auth BFF broken | Revert `middleware.ts` to pass-all + revert `app/admin/layout.tsx` to legacy | ~2 min deploy |
| Axios interceptor broken | Remove `patchAdminAxios()` call from LegacyPageAdapter → legacy direct-backend traffic resumes | ~2 min deploy |
| Full rollback | Revert git branch | ~2 min deploy |
