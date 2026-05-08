# Requirements Spec: 커뮤니티 고스트 지연 좋아요 + 댓글 알림

**작성일**: 2026-05-06
**상태**: DRAFT
**관련 작업**: ghost scheduled comments (`community-scheduled-comment-timeline-plan.md`)

---

## 1. 배경 및 목표

현재 Admin Dashboard(`Project-Solo`)와 백엔드(`solo-nestjs-api`)에는 이미 **고스트 댓글 지연 발송** 기능이 구현되어 있다. 고스트가 커뮤니티 게시글에 댓글을 예약하면, BullMQ를 통해 지정된 시간에 발송되고, `community_automation_contents` 테이블에서 상태가 관리된다.

이번 기능은 여기에 **고스트 좋아요(게시글 좋아요 + 댓글 좋아요)의 지연 발송**을 추가하고, 이러한 고스트 액션(좋아요/댓글)이 실제 유저에게 **푸시 알림**이 가도록 하는 것이다.

### 핵심 요구사항

1. **배정 가능한 고스트**가 게시글에 **좋아요**를 **지연 발송**할 수 있어야 함
2. 같은 방식으로 **댓글 좋아요**도 지연 발송 가능해야 함
3. 고스트의 댓글 발송 + 좋아요 발송이 **상대방(게시글 작성자/댓글 작성자)에게 알림**으로 가야 함
4. 기존 댓글 발송 스케줄링 인프라(BullMQ + community_automation_contents)를 재사용

---

## 2. 기존 인프라 분석

### 2.1 이미 구현된 기능

| 기능 | 상태 | 위치 |
|------|------|------|
| 고스트 댓글 즉시 발송 | ✅ 완료 | `admin-ghost-comment.service.ts` |
| 고스트 댓글 지연 발송 (BullMQ) | ✅ 완료 | `admin-ghost-comment.service.ts` + `publish.processor.ts` |
| 예약 댓글 타임라인 조회 | ✅ 완료 | `target-posts.service.ts` |
| 예약 취소 / 재스케줄 | ✅ 완료 | `target-posts-v2.controller.ts` |
| 고스트 댓글 AI 제안 | ✅ 완료 | `live-comment-suggestion.service.ts` |
| 패시브 좋아요 (자동화) | ✅ 완료 | `passive-action.handler.ts` |
| 고스트 좋아요 (매칭 - dormant likes) | ✅ 완료 | `ghost-like-sender.service.ts` |
| 매칭 좋아요 알림 | ✅ 완료 | `GhostLikeSenderService` → `NotificationBuilderFactory.matchLike()` |

### 2.2 부족한 기능

| 기능 | 상태 | 비고 |
|------|------|------|
| **커뮤니티 게시글 고스트 좋아요 (지연 발송)** | ❌ 없음 | `likes` 테이블에는 insert 가능하나, 어드민 UI/API 없음 |
| **커뮤니티 댓글 고스트 좋아요 (지연 발송)** | ❌ 없음 | `likes` 테이블 commentId 컬럼 활용 가능 |
| **고스트 액션(댓글/좋아요) → 푸시 알림** | ❌ 없음 | `publish.processor.ts`가 댓글 발송 후 알림을 보내지 않음 |
| **게시글 좋아요 알림 템플릿** | ❌ 없음 | `notification-event-type.enum.ts`에 `COMMENT_LIKE`는 있으나 게시글 좋아요 이벤트 타입 없음 |
| **어드민 UI 고스트 좋아요 컨트롤** | ❌ 없음 | `CommunityPostAppDetailPanel.tsx`에 좋아요 탭/버튼 없음 |

### 2.3 관련 DB 스키마

#### `likes` 테이블 (`src/database/schema/likes.ts`)
```sql
- id: uuid
- user_id: uuid (좋아요 누른 유저)
- article_id: uuid (게시글)
- comment_id: uuid? (댓글 — optional)
- up: boolean (true=좋아요, false=취소)
- created_at: timestamp
```

#### `community_automation_contents` 테이블
```sql
- id: uuid
- ghost_account_id: uuid
- target_type: 'COMMENT' | 'POST' | 'REPLY'
- target_parent_id: uuid (게시글이나 댓글의 부모)
- target_article_id: uuid
- target_comment_id: uuid?
- status: 'scheduled' | 'published' | 'withdrawn' | 'quality_failed'
- scheduled_at: timestamp
- published_at: timestamp?
- quality_scores: jsonb (메타데이터)
```

#### 알림 관련 스키마
- `user_notifications`: 유저 알림 저장
- `NOTIFICATION_EVENT_TYPE`: `COMMENT`, `REPLY`, `COMMENT_LIKE`, `LIKE` (매칭 좋아요)

---

## 3. 설계 방향

### 3.1 핵심 원칙

1. **기존 인프라 최대한 재사용**: BullMQ 기반 `publish.queue`/`publish.processor`, `community_automation_contents` 테이블, `admin-ghost-comment.service.ts` 패턴을 그대로 확장
2. **targetType 확장**: 기존 `'COMMENT'`, `'REPLY'`, `'POST'`에 `'ARTICLE_LIKE'`, `'COMMENT_LIKE'` 추가
3. **알림은 publish 직후 발송**: `publish.processor.ts`에서 좋아요/댓글 액션 완료 후 알림 전송
4. **UI는 기존 컴포넌트 확장**: `CommunityPostAppDetailPanel`에 좋아요 탭 추가

### 3.2 변경 범위

#### 백엔드 (solo-nestjs-api)

| 파일 | 변경 내용 |
|------|-----------|
| `src/admin/v2/community/admin-ghost-comment.service.ts` | 좋아요 스케줄링 메서드 추가 (`scheduleArticleLike`, `scheduleCommentLike`) |
| `src/admin/v2/community/community-v2.controller.ts` | 좋아요 API 엔드포인트 추가 |
| `src/community-automation/queue/publish.processor.ts` | `ARTICLE_LIKE`, `COMMENT_LIKE` 처리 + 알림 발송 로직 추가 |
| `src/push-notification/types/notification-event-type.enum.ts` | `ARTICLE_LIKE` 이벤트 타입 추가 |
| `src/push-notification/i18n/notification-messages.ts` | 게시글 좋아요 메시지 템플릿 추가 |
| `src/push-notification/domains/templates/` | `article-like-template.service.ts` 추가 |
| `src/push-notification/push-notification.module.ts` | 새 템플릿 등록 |
| `src/community-automation/services/target-posts.service.ts` | 좋아요 타임라인 아이템 조회 확장 |

#### 프론트엔드 (Project-Solo)

| 파일 | 변경 내용 |
|------|-----------|
| `app/services/community.ts` | `GhostLikeBody`, `GhostLikeResult` 타입 및 API 함수 추가 |
| `app/services/admin/community-automation.ts` | 좋아요 API 함수 추가 |
| `app/admin/community/components/CommunityPostAppDetailPanel.tsx` | 좋아요 탭 추가 (게시글 좋아요 + 댓글 좋아요) |
| `app/admin/community-automation/target-posts/page.tsx` | 좋아요 액션 연동 |
| `types/ghost-account.ts` | `GhostLikeCandidate` → 커뮤니티 좋아요 용도 확장 또는 신규 타입 |

---

## 4. 상세 기능 명세

### 4.1 백엔드: 좋아요 스케줄링 API

#### 4.1.1 게시글 좋아요 예약

```
POST /admin/v2/community/posts/:articleId/ghost-likes
```

**Request Body** (`GhostLikeBody`):
```json
{
  "ghostAccountId": "string | null (null = auto)",
  "delayMinutes": "number | undefined (5~180)",
  "targetCommentId": "string | null (null = 게시글 좋아요, not null = 댓글 좋아요)"
}
```

**Response** (`GhostLikeResult`):
```json
{
  "like": { "id": "...", "articleId": "...", "userId": "..." } | null,
  "scheduledLike": {
    "contentId": "string",
    "articleId": "string",
    "targetCommentId": "string | null",
    "delayMinutes": "number",
    "scheduledAt": "ISO8601",
    "status": "scheduled"
  } | null,
  "ghost": { ...GhostCandidate },
  "selectionMode": "auto" | "manual",
  "ghostCandidateCount": "number"
}
```

#### 4.1.2 로직 (admin-ghost-comment.service.ts 확장)

`scheduleLike()`:
1. `create()`와 동일한 고스트 선정 로직 (`selectAutoGhost` / `selectManualGhost`)
2. `delayMinutes`가 있으면 → `community_automation_contents`에 `targetType: 'ARTICLE_LIKE'`(또는 `'COMMENT_LIKE'`)로 insert
3. BullMQ에 `publish` job 등록 (jobId: `scheduled-ghost-like:{schema}:{contentId}`)
4. `delayMinutes`가 없으면 → 즉시 likes 테이블에 insert + 알림 발송
5. Audit 이벤트 기록

### 4.2 백엔드: Publish Processor 확장

`publish.processor.ts`의 `process()` 메서드에서 `targetType` 분기 확장:

```typescript
if (targetType === 'ARTICLE_LIKE') {
  await this.publishArticleLike(contentId, ghostAccountId, content, schema);
} else if (targetType === 'COMMENT_LIKE') {
  await this.publishCommentLike(contentId, ghostAccountId, content, schema);
}
```

#### 4.2.1 게시글 좋아요 발송

`publishArticleLike()`:
1. ghostUserId 조회
2. `likes` 테이블에 insert (`articleId = targetArticleId`, `up = true`)
3. `community_automation_contents` 상태 → `published`
4. 게시글 작성자에게 푸시 알림 전송

#### 4.2.2 댓글 좋아요 발송

`publishCommentLike()`:
1. ghostUserId 조회
2. `likes` 테이블에 insert (`commentId = targetCommentId`, `articleId = targetArticleId`, `up = true`)
3. `community_automation_contents` 상태 → `published`
4. 댓글 작성자에게 푸시 알림 전송

### 4.3 백엔드: 알림 시스템

#### 4.3.1 새 이벤트 타입

`notification-event-type.enum.ts`에 추가:
```typescript
ARTICLE_LIKE = 'article_like',  // 게시글 좋아요
```

`COMMENT_LIKE`는 이미 존재함.

#### 4.3.2 알림 메시지 템플릿

**게시글 좋아요 (ko)**:
```
title: "게시글 좋아요"
body: "누군가가 회원님의 게시글 "{truncateText(params.articleTitle, 30)}"을 좋아합니다."
```

**게시글 좋아요 (ja)**:
```
title: "投稿にいいね"
body: "誰かがあなたの投稿「{truncateText(params.articleTitle, 30)}」にいいねしました。"
```

#### 4.3.3 알림 발송 위치

- **즉시 좋아요**: `AdminGhostCommentService`에서 `likes` insert 후 `NotificationBuilderFactory`로 발송
- **지연 좋아요**: `PublishProcessor.publishArticleLike()` / `publishCommentLike()`에서 발송
- **지연 댓글**: `PublishProcessor.publishComment()`에서 발송 (현재는 알림 없음 → **추가 필요**)

### 4.4 프론트엔드: UI

#### 4.4.1 CommunityPostAppDetailPanel 확장

현재 `댓글 작성` / `예약 타임라인` 2탭 → **3탭으로 확장**:
1. **댓글 작성** (기존)
2. **좋아요** (신규)
3. **예약 타임라인** (기존)

#### 4.4.2 좋아요 탭 구성

- **액션 선택**: 게시글 좋아요 / 댓글 좋아요 (댓글 선택 시 대상 댓글 드롭다운)
- **고스트 선택**: auto/manual 모드 (댓글 작성과 동일한 로직)
- **발송 모드**: 지금 / 지연 (delayMinutes: 5~180)
- **실행 버튼**: "좋아요 발송" / "좋아요 예약"

#### 4.4.3 타임라인 확장

기존 예약 타임라인에 좋아요 아이템도 표시:
- 아이콘 구분: 💬 댓글 / ❤️ 게시글 좋아요 / 💬❤️ 댓글 좋아요
- 동일한 취소/재스케줄 기능

### 4.5 프론트엔드: 서비스 레이어

#### community.ts 확장
```typescript
export interface GhostLikeBody {
  ghostAccountId?: string;
  delayMinutes?: number;
  targetCommentId?: string | null;  // null = 게시글 좋아요, string = 댓글 좋아요
}

export interface GhostLikeResult {
  like?: { id: string; articleId: string; userId: string; commentId?: string };
  scheduledLike?: { ... };
  ghost: GhostCandidate;
  selectionMode: 'auto' | 'manual';
  ghostCandidateCount: number;
  warning?: string;
}
```

#### community-automation.ts 확장
```typescript
targetPosts.createLiveGhostLike(articleId: string, body: GhostLikeBody): Promise<GhostLikeResult>
targetPosts.listScheduledLikes(articleId: string): Promise<ScheduledLikeTimelineItem[]>
targetPosts.cancelScheduledLike(articleId: string, contentId: string): Promise<void>
targetPosts.rescheduleScheduledLike(articleId: string, contentId: string, body: { delayMinutes: number }): Promise<void>
```

---

## 5. 데이터 흐름

### 5.1 지연 좋아요 Flow

```
Admin UI
  → POST /admin-proxy/.../ghost-likes { delayMinutes: 30 }
  → AdminGhostCommentService.scheduleLike()
    → community_automation_contents INSERT (targetType='ARTICLE_LIKE', status='scheduled')
    → audit_event INSERT
    → BullMQ publish queue ADD (delay: 30min)
    
[30분 후]
  → PublishProcessor.process()
    → likes INSERT (userId=ghostUserId, articleId=targetArticleId, up=true)
    → content status → 'published'
    → NotificationBuilderFactory.create()
        .for(articleAuthorId)
        .articleLike()
        .send()
      → FCM push → 작성자에게 알림
```

### 5.2 지연 댓글 Flow (알림 추가)

```
[현재]
  PublishProcessor.publishComment()
    → comments INSERT
    → content status → 'published'
    → ❌ 알림 없음

[변경 후]
  PublishProcessor.publishComment()
    → comments INSERT
    → content status → 'published'
    → ✅ NotificationBuilderFactory.create()
         .for(articleAuthorId)
         .comment()
         .metadata({ articleId, commentId })
         .send()
       → FCM push → 게시글 작성자에게 "새 댓글" 알림
```

---

## 6. 작업 순서

### Phase 1: 백엔드 - 좋아요 인프라 (solo-nestjs-api)

1. `ARTICLE_LIKE` 이벤트 타입 추가 (`notification-event-type.enum.ts`)
2. 게시글 좋아요 알림 템플릿 추가 (`notification-messages.ts` + `article-like-template.service.ts`)
3. `AdminGhostCommentService`에 `scheduleArticleLike()`, `scheduleCommentLike()` 메서드 추가
4. `CommunityV2Controller`에 `POST /:articleId/ghost-likes` 엔드포인트 추가
5. `PublishProcessor`에 `ARTICLE_LIKE`, `COMMENT_LIKE` 처리 + 알림 발송 추가
6. `PublishProcessor.publishComment()`에 댓글 알림 발송 추가
7. `TargetPostsService`에 좋아요 타임라인 조회 API 추가 (기존 `listScheduledComments` 확장)

### Phase 2: 프론트엔드 - UI & 서비스 (Project-Solo)

1. `community.ts`에 `GhostLikeBody`, `GhostLikeResult` 타입 및 API 함수 추가
2. `community-automation.ts`에 좋아요 API 함수 추가
3. `CommunityPostAppDetailPanel.tsx`에 좋아요 탭 추가
4. `target-posts/page.tsx`에 좋아요 액션 연동
5. 타임라인에 좋아요 아이템 표시

### Phase 3: 통합 테스트

1. 지연 좋아요 발송 + 알림 도착 확인
2. 지연 댓글 발송 + 알림 도착 확인
3. 즉시 좋아요 발송 + 알림 도착 확인
4. 타임라인 UI 정상 동작 확인

---

## 7. 검증 기준

- [ ] 어드민에서 고스트를 선택하여 게시글에 지연 좋아요 예약 가능
- [ ] 어드민에서 고스트를 선택하여 댓글에 지연 좋아요 예약 가능
- [ ] 예약된 좋아요가 지정된 시간에 발송됨
- [ ] 게시글 좋아요 발송 시 게시글 작성자에게 푸시 알림 전송됨
- [ ] 댓글 좋아요 발송 시 댓글 작성자에게 푸시 알림 전송됨
- [ ] 고스트 댓글 발송 시 게시글 작성자에게 푸시 알림 전송됨
- [ ] 예약 타임라인에서 좋아요 아이템 조회 가능
- [ ] 예약 좋아요 취소/재스케줄 가능
- [ ] 타임라인에서 좋아요/댓글 구분 가능

---

## 8. 참고 파일

### 프론트엔드
- `app/admin/community/components/CommunityPostAppDetailPanel.tsx` — 메인 UI 컴포넌트
- `app/services/community.ts` — 커뮤니티 API 서비스
- `app/services/admin/community-automation.ts` — 자동화 API 서비스
- `app/admin/community-automation/target-posts/page.tsx` — 타겟 포스트 대시보드
- `requirements/community-scheduled-comment-timeline-plan.md` — 기존 댓글 타임라인 설계서

### 백엔드
- `src/admin/v2/community/admin-ghost-comment.service.ts` — 고스트 댓글 서비스 (확장 대상)
- `src/admin/v2/community/community-v2.controller.ts` — 커뮤니티 컨트롤러 (확장 대상)
- `src/community-automation/queue/publish.processor.ts` — 발송 프로세서 (확장 대상)
- `src/push-notification/i18n/notification-messages.ts` — 알림 메시지 템플릿
- `src/push-notification/types/notification-event-type.enum.ts` — 알림 이벤트 타입
- `src/ghost-account/services/ghost-like-sender.service.ts` — 기존 고스트 좋아요 발송 (매칭)
- `src/community-automation/activity-simulator/passive-action.handler.ts` — 패시브 좋아요 (자동화)
