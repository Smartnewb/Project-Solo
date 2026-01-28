# Project-Solo - System Architecture

## Overview
Next.js 14 Admin Dashboard for university student matching platform management.

## C4 Context Diagram

```mermaid
C4Context
    title Project-Solo - System Context
    
    Person(admin, "Admin User", "Platform administrator")
    Person(user, "End User", "University student")
    
    System(dashboard, "Project-Solo", "Next.js Admin Dashboard")
    
    System_Ext(api, "Sometimes API", "NestJS backend server")
    System_Ext(supabase, "Supabase", "PostgreSQL + Auth")
    System_Ext(portone, "Portone", "Payment processing")
    System_Ext(toss, "Toss Payments", "Payment processing")
    System_Ext(slack, "Slack", "Notifications")
    
    Rel(admin, dashboard, "Manages platform")
    Rel(user, dashboard, "Views profile, settings")
    Rel(dashboard, api, "REST API", "HTTPS")
    Rel(dashboard, supabase, "Direct DB", "PostgreSQL")
    Rel(dashboard, portone, "Payments", "SDK")
    Rel(dashboard, toss, "Payments", "SDK")
    Rel(dashboard, slack, "Alerts", "Webhook")
```

## Tech Stack

```mermaid
mindmap
    root((Project-Solo))
        Framework
            Next.js 14.1.3
            React 18.3.1
            TypeScript 4.9.5
        UI Libraries
            Material-UI 6.4.8
            Tailwind CSS 3.4.17
            Shadcn/ui 0.9.5
            Radix UI
            Headless UI
        State Management
            React Context
            localStorage
        Data & Backend
            Supabase
            Axios
            Socket.io Client
        Payment
            Portone 0.0.17
            Toss Payments SDK
        Visualization
            Chart.js 4.4.8
            Recharts 2.15.1
        Maps
            Leaflet 1.9.4
            React-Leaflet
        Rich Text
            React-Quill 2.0.0
        Animation
            Framer Motion 12.5.0
```

## App Router Structure

```mermaid
flowchart TB
    subgraph Root["app/"]
        layout["layout.tsx"]
        page["page.tsx (Login)"]
        providers["providers.tsx"]
        routes["routes.ts"]
        middleware["middleware.ts"]
    end
    
    subgraph Admin["app/admin/"]
        dashboard["dashboard/"]
        users["users/"]
        matching["matching/"]
        analytics["analytics/"]
        sales["sales/"]
        community["community/"]
        chat["chat/"]
        notifications["push-notifications/"]
        sms["sms/"]
        reports["reports/"]
        gems["gems/"]
        banners["banners/"]
        more["... 20+ more"]
    end
    
    subgraph User["User Routes"]
        home["home/"]
        profile["profile/"]
        settings["settings/"]
        payment["payment/"]
        community2["community/"]
    end
    
    subgraph Services["app/services/"]
        adminService["admin.ts (123KB)"]
        analyticsService["analytics.ts"]
        chatService["chat.ts"]
        communityService["community.ts"]
        dashboardService["dashboard.ts"]
        salesService["sales.ts"]
        smsService["sms.ts"]
    end
    
    Root --> Admin
    Root --> User
    Root --> Services
```

## Provider Stack

```mermaid
flowchart TB
    subgraph RootLayout["Root Layout"]
        AuthProvider["AuthProvider"]
        ModalProvider["ModalProvider"]
        CountryContext["CountryContext"]
        
        subgraph Children["Page Content"]
            Header["Header"]
            Main["Main Content"]
            Footer["Footer"]
        end
    end
    
    AuthProvider --> ModalProvider --> CountryContext --> Children
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Dashboard
    participant API as Sometimes API
    participant Storage as localStorage
    
    User->>Dashboard: Login (email, password)
    Dashboard->>API: POST /auth/login
    API-->>Dashboard: { accessToken, refreshToken }
    Dashboard->>Storage: Store tokens + cookie
    Dashboard-->>User: Redirect to /admin/dashboard
    
    Note over Dashboard: Token expires in 8 hours
    
    User->>Dashboard: Make API request
    Dashboard->>API: Request with Bearer token
    API-->>Dashboard: 401 Unauthorized
    Dashboard->>API: POST /auth/refresh
    API-->>Dashboard: { newAccessToken }
    Dashboard->>Storage: Update token
    Dashboard->>API: Retry original request
    API-->>Dashboard: Success
```

## API Integration

```mermaid
flowchart LR
    subgraph Dashboard["Dashboard"]
        Services["Service Layer"]
        AxiosClient["Axios Client"]
        Interceptors["Interceptors"]
    end
    
    subgraph External["External APIs"]
        SometimesAPI["Sometimes API<br/>api.some-in-univ.com"]
        Supabase["Supabase<br/>Direct DB"]
    end
    
    Services --> AxiosClient
    AxiosClient --> Interceptors
    Interceptors --> |"JWT + X-Country"| SometimesAPI
    Services --> Supabase
```

### Axios Configuration

```typescript
// Three axios instances
axiosServer     // JSON requests (15s timeout)
axiosMultipart  // File uploads (30s timeout)
axiosNextGen    // Direct backend (15s timeout)

// Request interceptor
- Add JWT Authorization header
- Add X-Country header

// Response interceptor
- Auto-refresh token on 401
- Redirect to login on refresh failure
```

## Route Protection

```mermaid
flowchart TB
    Request["Incoming Request"]
    Middleware["middleware.ts"]
    
    subgraph Routes["Route Categories"]
        Public["Public Routes<br/>/login, /signup"]
        Protected["Protected Routes<br/>/home, /admin/*"]
        Static["Static Routes<br/>/_next, /api"]
    end
    
    Decision{Has Token?}
    Allow["Allow Access"]
    Redirect["Redirect to /"]
    
    Request --> Middleware
    Middleware --> |"Check route type"| Routes
    Protected --> Decision
    Decision --> |"Yes"| Allow
    Decision --> |"No"| Redirect
    Public --> Allow
    Static --> Allow
```

## Key Components

| Layer | Components |
|-------|------------|
| Layout | Header, Navigation, Sidebar, Footer |
| Admin | DashboardAnalytics, UserManagement, MatchingPanel |
| User | ProfileSection, PreferencesSection, MeetingForm |
| Shared | Button, Card, Modal, Calendar, Counter |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key |
| `SLACK_WEBHOOK_URL` | Slack notifications |
