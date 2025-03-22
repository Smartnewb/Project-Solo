# System Patterns

## Authentication Pattern
- Using @supabase/ssr for SSR support
- Cookie-based session management
- Middleware protection for routes

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
- /utils: Utility functions 