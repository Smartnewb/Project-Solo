# System Patterns

## Authentication Pattern
- Using @supabase/ssr for SSR support (NOT @supabase/auth-helpers-nextjs)
- Cookie-based session management with getAll/setAll pattern
- Middleware protection for routes with session verification
- Important cookie handling principles:
  - Always use getAll() and setAll() methods
  - Preserve the response object from createServerClient
  - Ensure middleware returns the supabaseResponse

## Data Management
1. Tables Structure:
   - profiles: User profile information
   - user_preferences: Ideal type preferences
   - system_settings: System configuration

2. State Management
   - AuthContext for user state
   - Server-side session validation
   - Client-side state updates

## Code Organization
- /app: Next.js app directory
- /components: Reusable components
- /contexts: Context providers
- /utils: Utility functions including:
  - utils/supabase/client.ts: Browser client
  - utils/supabase/server.ts: Server client
  - middleware.ts: Authentication verification 