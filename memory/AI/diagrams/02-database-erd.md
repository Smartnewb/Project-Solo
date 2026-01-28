# Project-Solo - Database ERD

## Overview
Supabase PostgreSQL database with auto-generated TypeScript types.

## Core Entity Relationship Diagram

```mermaid
erDiagram
    profiles ||--o{ matches : "user1_id"
    profiles ||--o{ matches : "user2_id"
    profiles ||--o{ matching_requests : "user_id"
    profiles ||--o{ posts : "author_id"
    profiles ||--o{ comments : "author_id"
    profiles ||--o{ reports : "reporter_id"
    profiles ||--o{ user_preferences : "user_id"
    
    posts ||--o{ comments : "post_id"
    posts ||--o{ reports : "target_id"
    
    matches ||--o{ chat_rooms : "match_id"
    chat_rooms ||--o{ messages : "room_id"
    
    PROFILES {
        uuid id PK
        uuid user_id FK
        string name
        int age
        string gender
        string university
        string department
        string grade
        string avatar_url
        string instagram_id
        array personalities
        array dating_styles
        array lifestyles
        array interests
        string drinking
        string smoking
        string tattoo
        int height
        string mbti
        boolean is_admin
        string role
        timestamp created_at
        timestamp updated_at
    }
    
    MATCHES {
        uuid id PK
        uuid user1_id FK
        uuid user2_id FK
        string status
        date match_date
        time match_time
        timestamp created_at
        timestamp updated_at
    }
    
    MATCHING_REQUESTS {
        uuid id PK
        uuid user_id FK
        date preferred_date
        time preferred_time
        string status
        timestamp created_at
    }
    
    POSTS {
        uuid id PK
        uuid author_id FK
        string content
        string emoji
        string nickname
        array likes
        array reports
        boolean isDeleted
        boolean isEdited
        timestamp timestamp
    }
    
    COMMENTS {
        uuid id PK
        uuid post_id FK
        uuid author_id FK
        string content
        timestamp created_at
        timestamp updated_at
    }
    
    REPORTS {
        uuid id PK
        string target_type
        uuid target_id
        uuid reporter_id FK
        string reason
        string status
        timestamp created_at
    }
    
    USER_PREFERENCES {
        uuid id PK
        uuid user_id FK
        json preferred_age_range
        string preferred_location
        array preferred_personalities
        array preferred_interests
        timestamp updated_at
    }
    
    SYSTEM_SETTINGS {
        string key PK
        json value
        timestamp updated_at
    }
```

## Gender-Specific Profile Views

```mermaid
erDiagram
    female_profiles {
        uuid id PK
        uuid user_id FK
        string name
        int age
        string gender
        string classification
        string instagramid
    }
    
    male_profiles {
        uuid id PK
        uuid user_id FK
        string name
        int age
        string gender
        string classification
        string instagramid
    }
```

## Match Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Pending: Match Created
    Pending --> Accepted: Both Accept
    Pending --> Rejected: One Rejects
    Pending --> Expired: Timeout
    Accepted --> Active: Chat Opened
    Active --> Completed: Meeting Done
    Active --> Cancelled: User Cancels
    Rejected --> [*]
    Expired --> [*]
    Completed --> [*]
    Cancelled --> [*]
```

## Matching Request Flow

```mermaid
stateDiagram-v2
    [*] --> Submitted: User Submits
    Submitted --> Processing: Algorithm Runs
    Processing --> Matched: Partner Found
    Processing --> NoMatch: No Suitable Partner
    Matched --> Notified: Push Sent
    NoMatch --> Queued: Try Later
    Queued --> Processing: Retry
    Notified --> [*]
```

## Profile Data Structure

```typescript
interface Profile {
  // Identity
  id: string;
  user_id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  
  // Education
  university: string;
  department: string;
  grade: string;
  
  // Appearance
  avatar_url: string;
  height: number;
  
  // Personality
  personalities: string[];
  dating_styles: string[];
  lifestyles: string[];
  interests: string[];
  mbti: string;
  
  // Habits
  drinking: 'none' | 'sometimes' | 'often';
  smoking: 'none' | 'sometimes' | 'often';
  tattoo: 'none' | 'small' | 'large';
  
  // Social
  instagram_id: string;
  
  // Admin
  is_admin: boolean;
  role: 'user' | 'admin' | 'super_admin';
  
  // Timestamps
  created_at: string;
  updated_at: string;
}
```

## Key Relationships

| Parent | Child | Relationship | On Delete |
|--------|-------|--------------|-----------|
| profiles | matches | One-to-Many | Cascade |
| profiles | matching_requests | One-to-Many | Cascade |
| profiles | posts | One-to-Many | Set Null |
| profiles | comments | One-to-Many | Cascade |
| posts | comments | One-to-Many | Cascade |
| posts | reports | One-to-Many | Cascade |
| matches | chat_rooms | One-to-One | Cascade |
| chat_rooms | messages | One-to-Many | Cascade |

## Indexes

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| profiles | idx_profiles_user_id | user_id | Auth lookup |
| profiles | idx_profiles_gender | gender | Matching filter |
| profiles | idx_profiles_university | university | Matching filter |
| matches | idx_matches_users | user1_id, user2_id | Match lookup |
| matches | idx_matches_status | status | Status filter |
| matching_requests | idx_requests_date | preferred_date | Scheduling |
| posts | idx_posts_author | author_id | User posts |
| posts | idx_posts_timestamp | timestamp | Feed ordering |

## Database Types Location

```
/Users/smartnewbie/Desktop/Project-Solo/database.types.ts
```

Auto-generated by Supabase CLI, contains:
- All table types
- Insert/Update types
- Enum types
- Function return types
