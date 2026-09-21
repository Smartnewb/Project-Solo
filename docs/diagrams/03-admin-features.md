# Project-Solo - Admin Features

## Overview
30+ admin pages for platform management.

## Admin Feature Map

```mermaid
flowchart TB
    subgraph Dashboard["Dashboard & Analytics"]
        dash["dashboard/"]
        analytics["analytics/"]
        sales["sales/"]
    end
    
    subgraph UserMgmt["User Management"]
        users["users/"]
        profileReview["profile-review/"]
        reports["reports/"]
        deletedFemales["deleted-females/"]
        femaleRetention["female-retention/"]
    end
    
    subgraph MatchingMgmt["Matching Management"]
        matching["matching/"]
        matchingMgmt["matching-management/"]
        scheduledMatching["scheduled-matching/"]
        rematch["rematch/"]
        likes["likes/"]
        dormantLikes["dormant-likes/"]
    end
    
    subgraph Communication["Communication"]
        chat["chat/"]
        supportChat["support-chat/"]
        pushNotif["push-notifications/"]
        sms["sms/"]
    end
    
    subgraph Content["Content Management"]
        community["community/"]
        moment["moment/"]
        cardNews["card-news/"]
        banners["banners/"]
    end
    
    subgraph Commerce["Commerce"]
        gems["gems/"]
        iosRefund["ios-refund/"]
    end
    
    subgraph System["System"]
        universities["universities/"]
        versionMgmt["version-management/"]
        aiChat["ai-chat/"]
        lab["lab/"]
    end
```

## Admin Page Details

### Dashboard & Analytics

| Page | Purpose | Key Features |
|------|---------|--------------|
| `dashboard` | Overview KPIs | User stats, match rates, revenue |
| `analytics` | Detailed metrics | Demographics, funnels, cohorts |
| `sales` | Revenue tracking | Transactions, refunds, projections |

### User Management

| Page | Purpose | Key Features |
|------|---------|--------------|
| `users` | User CRUD | Search, filter, edit, ban |
| `profile-review` | Approve profiles | Photo review, verification |
| `reports` | Handle violations | Review reports, take action |
| `deleted-females` | Track deletions | Analyze churn |
| `female-retention` | Retention metrics | Re-engagement tools |

### Matching Management

| Page | Purpose | Key Features |
|------|---------|--------------|
| `matching` | Monitor matches | Live matching, manual override |
| `matching-management` | Advanced controls | Algorithm tuning |
| `scheduled-matching` | Scheduled jobs | Time-based matching |
| `rematch` | Rematch requests | Process rematch tickets |
| `likes` | Like analytics | Like patterns, conversions |
| `dormant-likes` | Inactive likes | Re-activation campaigns |

### Communication

| Page | Purpose | Key Features |
|------|---------|--------------|
| `chat` | Chat management | Monitor, moderate |
| `support-chat` | Customer support | Respond to inquiries |
| `push-notifications` | Push campaigns | Segment, schedule, send |
| `sms` | SMS messaging | Bulk SMS, templates |

### Content Management

| Page | Purpose | Key Features |
|------|---------|--------------|
| `community` | Forum moderation | Posts, comments, reports |
| `moment` | Moment questions | Create, schedule, analyze |
| `card-news` | News cards | Create, publish, archive |
| `banners` | Promotional banners | Create, schedule, target |

### Commerce

| Page | Purpose | Key Features |
|------|---------|--------------|
| `gems` | Currency management | Balance, transactions |
| `ios-refund` | Apple refunds | Process IAP refunds |

### System

| Page | Purpose | Key Features |
|------|---------|--------------|
| `universities` | University list | Add, edit, verify |
| `version-management` | App versions | Force update, deprecate |
| `ai-chat` | AI assistant | Test AI responses |
| `lab` | Experimental | Feature flags, A/B tests |

## Admin Service API (123KB)

```mermaid
flowchart LR
    subgraph AdminService["app/services/admin.ts"]
        Users["User APIs"]
        Matching["Matching APIs"]
        Analytics["Analytics APIs"]
        Community["Community APIs"]
        Push["Push APIs"]
        SMS["SMS APIs"]
        Gems["Gem APIs"]
        Banners["Banner APIs"]
    end
    
    AdminService --> API[(Sometimes API)]
```

### Key API Endpoints

| Category | Endpoint | Method | Purpose |
|----------|----------|--------|---------|
| Users | `/admin/users` | GET | List users |
| Users | `/admin/users/:id` | PUT | Update user |
| Users | `/admin/users/:id/ban` | POST | Ban user |
| Matching | `/admin/matching` | GET | List matches |
| Matching | `/admin/matching/force` | POST | Force match |
| Analytics | `/admin/analytics/daily` | GET | Daily stats |
| Analytics | `/admin/analytics/cohort` | GET | Cohort analysis |
| Push | `/admin/push/send` | POST | Send push |
| Push | `/admin/push/segment` | POST | Send to segment |
| SMS | `/admin/sms/send` | POST | Send SMS |
| Gems | `/admin/gems/adjust` | POST | Adjust balance |
| Community | `/admin/posts` | GET | List posts |
| Community | `/admin/posts/:id` | DELETE | Delete post |

## Admin UI Components

```mermaid
flowchart TB
    subgraph AdminComponents["Admin Component Library"]
        subgraph Tables["Data Tables"]
            UserTable["UserManagementTable"]
            MatchTable["MatchingTable"]
            ReportTable["ReportTable"]
        end
        
        subgraph Charts["Analytics Charts"]
            LineChart["DailyStatsChart"]
            BarChart["CohortChart"]
            PieChart["DistributionChart"]
        end
        
        subgraph Forms["Admin Forms"]
            PushForm["PushNotificationForm"]
            BannerForm["BannerCreator"]
            SMSForm["SMSComposer"]
        end
        
        subgraph Panels["Control Panels"]
            MatchingPanel["MatchingControlPanel"]
            ModPanel["ModerationPanel"]
            SettingsPanel["SystemSettings"]
        end
    end
```

## Admin Workflow: Profile Review

```mermaid
sequenceDiagram
    participant Admin
    participant Dashboard
    participant API
    participant DB
    participant User
    
    Admin->>Dashboard: Open Profile Review
    Dashboard->>API: GET /admin/profiles/pending
    API->>DB: SELECT * FROM profiles WHERE status='pending'
    DB-->>API: Pending profiles
    API-->>Dashboard: Profile list
    
    Admin->>Dashboard: Approve profile
    Dashboard->>API: PUT /admin/profiles/:id/approve
    API->>DB: UPDATE profiles SET status='approved'
    API->>User: Send push notification
    API-->>Dashboard: Success
```

## Admin Workflow: Push Notification Campaign

```mermaid
sequenceDiagram
    participant Admin
    participant Dashboard
    participant API
    participant FCM
    participant Users
    
    Admin->>Dashboard: Create campaign
    Admin->>Dashboard: Select segment
    Admin->>Dashboard: Write message
    Admin->>Dashboard: Schedule or send now
    
    Dashboard->>API: POST /admin/push/campaign
    API->>API: Build recipient list
    API->>FCM: Send batch notifications
    FCM-->>Users: Push notifications
    FCM-->>API: Delivery report
    API-->>Dashboard: Campaign stats
```

## Role-Based Access

| Role | Dashboard | Users | Matching | Analytics | System |
|------|-----------|-------|----------|-----------|--------|
| `super_admin` | Full | Full | Full | Full | Full |
| `admin` | Full | Read/Write | Read/Write | Read | Limited |
| `moderator` | View | Read | Read | - | - |
| `support` | View | Read | - | - | - |
