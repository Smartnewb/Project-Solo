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
- SSR implementation with @supabase/ssr
- Middleware for route protection

## Technical Constraints
- Cookie handling limitations in SSR
- Session management requirements
- Base64 cookie parsing considerations 