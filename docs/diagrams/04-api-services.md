# Project-Solo - API Services

## Overview
Centralized service layer for API communication.

## Service Architecture

```mermaid
flowchart TB
    subgraph Pages["Next.js Pages"]
        AdminPages["Admin Pages"]
        UserPages["User Pages"]
    end
    
    subgraph Services["app/services/"]
        admin["admin.ts<br/>(123KB)"]
        analytics["analytics.ts"]
        chat["chat.ts"]
        community["community.ts"]
        dashboard["dashboard.ts"]
        sales["sales.ts"]
        sms["sms.ts"]
        supportChat["support-chat.ts"]
        version["version.ts"]
    end
    
    subgraph Clients["HTTP Clients"]
        axiosServer["axiosServer<br/>JSON (15s)"]
        axiosMultipart["axiosMultipart<br/>Files (30s)"]
        axiosNextGen["axiosNextGen<br/>Direct (15s)"]
    end
    
    subgraph External["External APIs"]
        SometimesAPI["Sometimes API"]
        Supabase["Supabase"]
    end
    
    Pages --> Services
    Services --> Clients
    Clients --> External
```

## Axios Configuration

```mermaid
flowchart LR
    subgraph Request["Request Interceptor"]
        Token["Add JWT Token"]
        Country["Add X-Country Header"]
    end
    
    subgraph Response["Response Interceptor"]
        Success["Return data"]
        Error401["401 Unauthorized"]
        Refresh["Refresh Token"]
        Retry["Retry Request"]
        Logout["Redirect to Login"]
    end
    
    Request --> Token --> Country
    
    Error401 --> Refresh
    Refresh --> |"Success"| Retry
    Refresh --> |"Fail"| Logout
```

```typescript
// utils/axios.ts
const axiosServer = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

axiosServer.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  const country = localStorage.getItem('selectedCountry') || 'kr';
  
  config.headers.Authorization = `Bearer ${token}`;
  config.headers['x-country'] = country;
  
  return config;
});
```

## Service Functions

### Admin Service (admin.ts)

```mermaid
mindmap
    root((Admin Service))
        Users
            getUsers
            getUserById
            updateUser
            banUser
            unbanUser
            deleteUser
        Profiles
            getPendingProfiles
            approveProfile
            rejectProfile
            getProfilePhotos
        Matching
            getMatches
            forceMatch
            cancelMatch
            getMatchingRequests
        Analytics
            getDailyStats
            getWeeklyStats
            getCohortAnalysis
            getFunnelData
        Push
            sendPush
            sendToSegment
            getCampaigns
            getCampaignStats
        SMS
            sendSMS
            sendBulkSMS
            getTemplates
        Gems
            getBalance
            adjustBalance
            getTransactions
        Community
            getPosts
            deletePost
            getReports
            resolveReport
```

### Analytics Service (analytics.ts)

| Function | Params | Returns |
|----------|--------|---------|
| `getDailyMetrics` | startDate, endDate | DailyMetrics[] |
| `getUserGrowth` | period | GrowthData |
| `getMatchingStats` | period | MatchingStats |
| `getRevenueReport` | period | RevenueData |
| `getCohortRetention` | cohortDate | RetentionMatrix |

### Chat Service (chat.ts)

| Function | Params | Returns |
|----------|--------|---------|
| `getRooms` | userId | ChatRoom[] |
| `getMessages` | roomId, page | Message[] |
| `sendMessage` | roomId, content | Message |
| `markAsRead` | roomId | void |

### Community Service (community.ts)

| Function | Params | Returns |
|----------|--------|---------|
| `getPosts` | page, filter | Post[] |
| `getPost` | postId | Post |
| `createPost` | data | Post |
| `updatePost` | postId, data | Post |
| `deletePost` | postId | void |
| `getComments` | postId | Comment[] |
| `reportPost` | postId, reason | Report |

### Dashboard Service (dashboard.ts)

| Function | Params | Returns |
|----------|--------|---------|
| `getOverview` | - | DashboardData |
| `getActiveUsers` | - | number |
| `getTodayMatches` | - | number |
| `getTodayRevenue` | - | number |
| `getRecentActivity` | limit | Activity[] |

### Sales Service (sales.ts)

| Function | Params | Returns |
|----------|--------|---------|
| `getTransactions` | page, filter | Transaction[] |
| `getRevenue` | period | RevenueData |
| `getRefunds` | page | Refund[] |
| `processRefund` | transactionId | void |

### SMS Service (sms.ts)

| Function | Params | Returns |
|----------|--------|---------|
| `sendSMS` | phone, message | SMSResult |
| `sendBulk` | phones[], message | BulkResult |
| `getTemplates` | - | Template[] |
| `createTemplate` | data | Template |

### Version Service (version.ts)

| Function | Params | Returns |
|----------|--------|---------|
| `getVersions` | platform | Version[] |
| `createVersion` | data | Version |
| `setMinVersion` | version | void |
| `deprecateVersion` | version | void |

## API Rewrites (next.config.js)

```typescript
// API route rewrites
rewrites: async () => [
  {
    source: '/api/admin/rematch-request',
    destination: `${API_URL}/admin/matching/rematch-request`
  },
  {
    source: '/api/notifications/:path*',
    destination: `${API_URL}/notifications/:path*`
  },
  {
    source: '/api/matchings/:path*',
    destination: `${API_URL}/matchings/:path*`
  },
  {
    source: '/api/offline-meetings/:path*',
    destination: `${API_URL}/offline-meetings/:path*`
  },
  {
    source: '/api/user-preferences',
    destination: `${API_URL}/user-preferences`
  },
  {
    source: '/api/profile',
    destination: `${API_URL}/profile`
  },
  {
    source: '/api/admin/:path*',
    destination: `${API_URL}/admin/:path*`
  }
]
```

## Error Handling

```mermaid
flowchart TB
    APICall["API Call"]
    Try["try block"]
    Catch["catch block"]
    
    subgraph Errors["Error Types"]
        E401["401 - Unauthorized"]
        E403["403 - Forbidden"]
        E404["404 - Not Found"]
        E422["422 - Validation"]
        E500["500 - Server Error"]
    end
    
    subgraph Handlers["Error Handlers"]
        H401["Refresh token or logout"]
        H403["Show permission error"]
        H404["Show not found"]
        H422["Show validation errors"]
        H500["Show generic error"]
    end
    
    APICall --> Try
    Try --> |"Error"| Catch
    Catch --> Errors
    E401 --> H401
    E403 --> H403
    E404 --> H404
    E422 --> H422
    E500 --> H500
```

## Type Definitions

```typescript
// app/types/matching.ts
interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  status: MatchStatus;
  match_date: string;
  match_time: string;
  created_at: string;
}

type MatchStatus = 
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'active'
  | 'completed'
  | 'cancelled';

// app/types/community.ts
interface Post {
  id: string;
  author_id: string;
  content: string;
  emoji: string;
  nickname: string;
  likes: string[];
  reports: string[];
  isDeleted: boolean;
  isEdited: boolean;
  timestamp: string;
}

// app/types/support-chat.ts
interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  messages: SupportMessage[];
  created_at: string;
}
```
