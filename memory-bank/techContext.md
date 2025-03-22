# Technical Context

## Core Technologies
1. Frontend
   - Next.js with App Router
   - TypeScript
   - React Context API

2. Backend
   - Supabase
   - PostgreSQL database
   - Row Level Security (RLS)

## Development Setup
- Environment variables for Supabase configuration
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
- SSR implementation with @supabase/ssr package
- Middleware for authentication and route protection
- Browser and server client separation

## Authentication Implementation
- Browser client: createBrowserClient from @supabase/ssr
- Server client: createServerClient from @supabase/ssr
- Middleware session verification with getUser()
- Cookie handling with getAll() and setAll() methods

## Technical Constraints
- Cookie handling limitations in SSR environment
- Session token refresh requirements 
- Consistent response object handling in middleware
- Authentication state persistence across routes
- Multiple server instances causing port conflicts 