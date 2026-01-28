# Project-Solo - Development Guidelines

## Project Overview
University student matching platform Admin Dashboard (Next.js 14 + Supabase)

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14.1.3 (App Router) |
| Language | TypeScript 4.9.5 |
| UI | Material-UI 6.4.8 + Tailwind CSS 3.4.17 + Shadcn/ui |
| State | React Context + localStorage |
| Database | Supabase PostgreSQL |
| HTTP | Axios with interceptors |
| Payments | Portone + Toss Payments |
| Charts | Chart.js + Recharts |

---

## Project Structure

```
app/
├── admin/           # 30+ admin pages
│   ├── dashboard/   # Admin home
│   ├── users/       # User management
│   ├── matching/    # Matching management
│   ├── analytics/   # Analytics
│   └── ...
├── home/            # User pages
├── services/        # API service layer
├── types/           # TypeScript types
├── utils/           # Utilities
├── lib/             # Supabase client
└── components/      # Shared components

features/            # Feature modules
shared/              # Shared UI and hooks
contexts/            # React Context providers
```

---

## Key Files

| File | Purpose |
|------|---------|
| `app/services/admin.ts` | Admin API service (123KB) |
| `database.types.ts` | Supabase auto-generated types |
| `contexts/AuthContext.tsx` | Authentication state |
| `utils/axios.ts` | HTTP client with interceptors |
| `middleware.ts` | Route protection |
| `app/routes.ts` | Route configuration |

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

### Axios Instances

| Instance | Use Case | Timeout |
|----------|----------|---------|
| `axiosServer` | JSON requests | 15s |
| `axiosMultipart` | File uploads | 30s |
| `axiosNextGen` | Direct backend | 15s |

### Authentication
```typescript
// Tokens auto-injected by interceptor
// X-Country header auto-added from localStorage
```

### Types
Always use types from `database.types.ts` for Supabase entities:

```typescript
import { Database } from '@/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
```

---

## Route Protection

| Route Type | Examples | Auth Required |
|------------|----------|---------------|
| Public | `/`, `/signup` | No |
| Protected | `/home`, `/admin/*` | Yes |
| Static | `/_next`, `/api` | No |

---

## Admin Pages (30+)

### Dashboard & Analytics
- `dashboard` - Overview KPIs
- `analytics` - Detailed metrics
- `sales` - Revenue tracking

### User Management
- `users` - User CRUD
- `profile-review` - Profile approval
- `reports` - Violation handling

### Matching
- `matching` - Match monitoring
- `scheduled-matching` - Scheduled jobs
- `rematch` - Rematch requests

### Communication
- `push-notifications` - Push campaigns
- `sms` - SMS messaging
- `support-chat` - Customer support

### Content
- `community` - Forum moderation
- `card-news` - News management
- `banners` - Promotional banners

---

## Development Commands

```bash
# Development
npm run dev          # Start dev server

# Build
npm run build        # Production build

# Lint
npm run lint         # ESLint check
```

---

## Environment Variables

```env
NEXT_PUBLIC_API_URL=           # Backend API URL
NEXT_PUBLIC_SUPABASE_URL=      # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=     # Supabase admin key
SLACK_WEBHOOK_URL=             # Slack notifications
```

---

## AI Context Diagrams

AI가 코드베이스를 빠르게 이해할 수 있도록 Mermaid 다이어그램을 제공합니다.

### Location
`memory/AI/diagrams/` 디렉토리에 다음 다이어그램이 있습니다:

| File | Description |
|------|-------------|
| `01-system-architecture.md` | Tech stack, providers, auth flow |
| `02-database-erd.md` | Supabase PostgreSQL schema, relationships |
| `03-admin-features.md` | 30+ admin pages, workflows |
| `04-api-services.md` | Service layer, API integration |

### Usage
아키텍처 관련 질문 시 해당 다이어그램을 참조하세요:
- 새 Admin 페이지 추가 → `03-admin-features.md`
- 데이터베이스 스키마 → `02-database-erd.md`
- API 통합 → `04-api-services.md`
- 전체 구조 → `01-system-architecture.md`

---

## Quick Reference

### Adding New Admin Page

1. Create page in `app/admin/{feature}/page.tsx`
2. Add API functions to `app/services/admin.ts`
3. Use existing components from `app/admin/components/`
4. Add route to `app/routes.ts` if needed

### Database Queries

```typescript
import { createClient } from '@/app/lib/supabase/client';

const supabase = createClient();
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('status', 'active');
```

### State Management

- Auth → `AuthContext`
- Country → `CountryContext`
- Modals → `ModalProvider`
- Local → `useState` or `localStorage`
