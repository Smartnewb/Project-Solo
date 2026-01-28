# Project-Solo - AI Context Diagrams

Architecture diagrams for AI assistants to quickly understand the admin dashboard codebase.

## Diagram Index

| File | Description | When to Reference |
|------|-------------|-------------------|
| `01-system-architecture.md` | Tech stack, providers, auth flow | Architecture questions, setup |
| `02-database-erd.md` | Supabase PostgreSQL schema | Database queries, data models |
| `03-admin-features.md` | 30+ admin pages, workflows | Admin feature development |
| `04-api-services.md` | Service layer, API integration | API calls, data fetching |

## Quick Reference

### Tech Stack
- **Framework**: Next.js 14.1.3, React 18.3.1, TypeScript 4.9.5
- **UI**: Material-UI 6.4.8 + Tailwind CSS 3.4.17 + Shadcn/ui
- **State**: React Context + localStorage
- **Backend**: Supabase PostgreSQL + Sometimes API
- **Payments**: Portone + Toss Payments

### Project Structure
```
app/
├── admin/          # 30+ admin pages
├── home/           # User home
├── profile/        # User profile
├── settings/       # User settings
├── payment/        # Payment flows
├── services/       # API service layer
├── types/          # TypeScript types
├── utils/          # Utilities (axios, formatters)
├── lib/            # Supabase client
└── components/     # Shared components

features/           # Feature modules (payment, matching)
shared/             # Shared UI and hooks
contexts/           # React Context providers
```

### Key Files
| File | Purpose |
|------|---------|
| `app/services/admin.ts` | Admin API (123KB, main service) |
| `database.types.ts` | Supabase auto-generated types |
| `contexts/AuthContext.tsx` | Authentication state |
| `utils/axios.ts` | HTTP client configuration |
| `middleware.ts` | Route protection |

### Authentication
- JWT tokens stored in localStorage + cookie
- 8-hour token expiry
- Auto-refresh on 401
- X-Country header for multi-region

## Usage Guide

### Adding Admin Feature
1. Check `03-admin-features.md` for similar pages
2. Create page in `app/admin/{feature}/`
3. Add API functions to `app/services/admin.ts`
4. Use existing components from `app/admin/components/`

### Database Queries
→ Reference `02-database-erd.md` for schema
→ Use `database.types.ts` for TypeScript types

### API Integration
→ Reference `04-api-services.md`
→ Use appropriate axios instance (server/multipart/nextgen)

### State Management
- Auth state → `AuthContext`
- Country → `CountryContext`  
- Modals → `ModalProvider`
- Other → React useState or localStorage
