# Project-Solo - Development Guidelines

## Project Overview
University student matching platform Admin Dashboard (Next.js 14 + AWS Backend)

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14.1.3 (App Router) |
| Language | TypeScript 4.9.5 |
| UI | Material-UI 6.4.8 + Tailwind CSS 3.4.17 + Shadcn/ui |
| State | React Context + cookie-based admin session |
| Backend | AWS (sometimes-api) via BFF proxy |
| Auth | iron-session v8 (httpOnly cookies) |
| HTTP | Axios with interceptors + BFF proxy |
| Payments | Portone + Toss Payments |
| Charts | Chart.js + Recharts |
| Testing | Jest 29 + RTL + Playwright |

---

## Architecture

```
Browser → Next.js (Vercel)
           ├── /admin/* pages (AdminShell + cookie auth)
           ├── /api/admin/auth/* (login, logout, refresh, session)
           ├── /api/admin-proxy/* (BFF proxy to backend)
           └── /api/admin/session/country (country switch)
                    ↓
              sometimes-api (AWS backend, DO NOT MODIFY)
```

- **BFF Proxy**: All admin API calls go through `/api/admin-proxy/[...path]`
- **Auth**: httpOnly cookies (`admin_access_token`, `admin_refresh_token`, `admin_session_meta`)
- **Middleware**: Checks `admin_session_meta` cookie for `/admin/*` routes
- **Session**: iron-session v8 encrypts session metadata in cookies

---

## Project Structure

```
app/
├── admin/           # 30+ admin pages (v2 only, no legacy)
│   ├── dashboard/   # Admin home
│   ├── users/       # User management
│   ├── matching/    # Matching management
│   └── ...
├── api/admin/       # BFF route handlers (auth, session, proxy)
├── home/            # User pages
├── services/admin/  # API service layer (9 domain modules)
├── types/           # TypeScript types
├── utils/           # Utilities
└── components/      # Shared components

shared/
├── auth/            # Cookie helpers, session config
├── ui/admin/        # AdminShell, sidebar, error boundary
├── lib/             # HTTP client, admin logger
├── contexts/        # Admin session context
└── providers/       # React Query provider

contexts/            # React Context providers (Auth, Country)
e2e/                 # Playwright E2E tests
__tests__/           # Jest unit tests
```

---

## Key Files

| File | Purpose |
|------|---------|
| `app/services/admin/index.ts` | Admin API barrel export (9 domain modules) |
| `shared/auth/cookies.ts` | httpOnly cookie CRUD |
| `shared/auth/session-config.ts` | iron-session config |
| `shared/ui/admin/admin-shell.tsx` | Admin layout (session, sidebar, error boundary) |
| `contexts/AuthContext.tsx` | User auth state + admin session bridging |
| `middleware.ts` | Route protection (cookie check) |
| `shared/lib/admin-logger.ts` | Structured JSON logging for BFF |

---

## Coding Conventions

### API Calls
Use the service layer for all API calls:

```typescript
// ✅ Correct - use service functions
import { getUsers } from '@/app/services/admin';
const users = await getUsers();

// ❌ Wrong - direct axios calls in components
const response = await axios.get('/api/users');
```

### Admin Service Modules

| Module | Domain |
|--------|--------|
| `dashboard.ts` | Stats, KPI reports |
| `users.ts` | User management, appearance |
| `matching.ts` | Matching, force matching |
| `messaging.ts` | Push notifications, SMS, chat |
| `content.ts` | Card news, banners, articles |
| `moderation.ts` | Reports, profile review |
| `revenue.ts` | Gems, pricing, refunds |
| `system.ts` | FCM, universities, settings |
| `auth.ts` | Auth cleanup |

### Authentication
```typescript
// Admin auth uses httpOnly cookies (set by BFF)
// Middleware checks admin_session_meta cookie
// AdminShell validates session via /api/admin/session
// patchAdminAxios injects auth headers for API calls
```

---

## Route Protection

| Route Type | Examples | Auth Required |
|------------|----------|---------------|
| Public | `/`, `/signup` | No |
| Protected | `/home`, `/admin/*` | Yes (cookie) |
| Static | `/_next`, `/api` | No |

---

## Development Commands

```bash
# Development
pnpm dev              # Start dev server

# Build
pnpm build            # Production build

# Testing
pnpm test             # Run all Jest tests
pnpm test:admin       # Run admin BFF/auth tests only
pnpm test:e2e         # Run Playwright E2E tests

# Quality
pnpm quality:admin-v2 # typecheck → lint → test pipeline

# Lint
pnpm lint             # ESLint check
```

---

## Environment Variables

```env
NEXT_PUBLIC_API_URL=           # Backend API URL (sometimes-api)
ADMIN_SESSION_SECRET=          # iron-session encryption secret
SLACK_WEBHOOK_URL=             # Slack error notifications
EDGE_CONFIG=                   # Vercel Edge Config (feature flags)
```

---

## Quick Reference

### Adding New Admin Page

1. Create page in `app/admin/{feature}/page.tsx`
2. Add API functions to `app/services/admin/{domain}.ts`
3. Re-export from `app/services/admin/index.ts`
4. Use existing components from `app/admin/components/`
5. Add route to sidebar in `shared/ui/admin/sidebar.tsx`

### State Management

- Admin Session → `AdminSessionContext` (cookie-based)
- Auth → `AuthContext` (login flow)
- Country → `CountryContext`
- Server State → React Query (via `AdminQueryProvider`)
- Local → `useState`
