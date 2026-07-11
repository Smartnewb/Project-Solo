# Project-Solo

Internal **admin dashboard** for the Sometime university student matching platform.

This is a Next.js 14 (App Router) single-tenant admin console that runs on Vercel.
It talks to the backend (`sometimes-api`, deployed on AWS) exclusively through a
server-side **BFF proxy** — the browser never contacts the backend directly.

---

## Architecture

```
Browser
  │  (cookie-based admin session)
  ▼
Next.js 14 (Vercel)
  ├── /admin/*                          ~97 admin pages (AdminShell + cookie auth)
  ├── /api/admin/auth/*                 login, logout, refresh, session
  ├── /api/admin-proxy/[...path]        BFF proxy → backend
  └── /api/admin/session/country        country switch
        │
        ▼
sometimes-api (AWS backend — DO NOT MODIFY from this repo)
```

### BFF Proxy

All admin API calls flow through `/api/admin-proxy/[...path]`. The route handler:

1. Reads the admin access token from an httpOnly cookie.
2. Refreshes the token (via the refresh token) if it is about to expire.
3. Forwards the request to `sometimes-api` with the token injected as a Bearer header.
4. Applies path-prefix allow-listing and same-origin CSRF checks on mutations.

The backend URL comes from `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8044/api` in dev).

### Authentication

Admin sessions use **iron-session v8** to encrypt session metadata in httpOnly cookies:

| Cookie | Purpose |
|--------|---------|
| `admin_access_token` | JWT access token |
| `admin_refresh_token` | JWT refresh token |
| `admin_session_meta` | Encrypted session metadata (id, email, roles, country) |

`middleware.ts` checks `admin_session_meta` on every `/admin/*` route.

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 14.2.35 (App Router) |
| Language | TypeScript 5.3.3 |
| UI | Material-UI 6.4.8 + shadcn/ui + Tailwind CSS 3.4.17 |
| State | React Context + cookie-based admin session |
| Backend | sometimes-api (AWS) via BFF proxy |
| Auth | iron-session v8 (httpOnly cookies) |
| HTTP | Axios with interceptors + BFF proxy |
| Server State | TanStack React Query 5 |
| Payments | Portone + Toss Payments |
| Charts | Chart.js + Recharts |
| Testing | Jest 29 + Testing Library + Playwright |

> **Design system note:** the UI layer currently mixes MUI and shadcn/ui without a
> unified token system. See [DESIGN.md](./DESIGN.md) for details.

---

## Development

```bash
pnpm install            # install dependencies (pnpm is enforced via only-allow)

pnpm dev                # dev server on http://localhost:32211
pnpm build              # production build
pnpm start              # serve production build (after build)

pnpm test               # Jest unit tests
pnpm test:admin         # admin BFF / auth tests only
pnpm test:e2e           # Playwright E2E tests

pnpm quality:admin-v2   # typecheck → lint → test pipeline
                        #   targets: app/admin, components/admin, shared, app/api/admin
pnpm lint               # ESLint (next lint)
```

### Quality Pipeline

`pnpm quality:admin-v2` runs three stages and fails fast on the first error:

1. **typecheck** — `tsc --project tsconfig.admin-v2.json`
2. **lint** — `eslint --ext .ts,.tsx app/admin/ components/admin/ shared/ app/api/admin/`
3. **test** — `jest --testPathPattern='__tests__/app/api/admin|__tests__/shared/auth'`

---

## Environment Variables

Set these in `.env.local` (dev) or the Vercel project settings (prod):

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_API_URL` | **Yes** | Backend API URL (sometimes-api) |
| `ADMIN_SESSION_SECRET` | **Yes** (all environments) | iron-session encryption secret. The app throws at runtime if unset. |
| `SLACK_WEBHOOK_URL` | No | Slack incoming webhook for error notifications |
| `EDGE_CONFIG` | No | Vercel Edge Config ID (feature flags) |
| `NEXT_PUBLIC_SOCKET_URL` | No | WebSocket server URL for real-time features |

> `ADMIN_SESSION_SECRET` is enforced as **REQUIRED in all environments** (dev, preview,
> and production). If it is missing, `session-config.ts` throws
> `"ADMIN_SESSION_SECRET must be set"` on the first session operation.

---

## Project Structure

```
app/
├── admin/             # ~97 admin pages (dashboard, users, matching, revenue, …)
├── api/admin/         # BFF route handlers (auth, session)
├── api/admin-proxy/   # BFF proxy to sometimes-api
├── services/admin/    # API service layer (40+ domain modules)
├── types/             # TypeScript type definitions
└── utils/             # Utilities

shared/
├── auth/              # Cookie helpers, session config (iron-session)
├── ui/                # AdminShell, sidebar, error boundary
├── lib/               # HTTP client, admin logger, CSRF
├── contexts/          # AdminSessionContext (cookie-backed)
├── hooks/             # Shared React hooks
└── providers/         # React Query provider

contexts/              # React Context providers (CountryContext)
e2e/                   # Playwright E2E tests
__tests__/             # Jest unit tests
```

---

## Deployment

Deployed on **Vercel** via Git push. The build uses `pnpm` (see `.npmrc` and
`package.json` `packageManager` field). No server-side database — all data flows
through the BFF proxy to `sometimes-api`.

---

## Backend Boundary

**`sometimes-api` is a separate repository.** Do not modify backend code from this
repo. All backend interaction goes through the BFF proxy at
`/api/admin-proxy/[...path]`.
