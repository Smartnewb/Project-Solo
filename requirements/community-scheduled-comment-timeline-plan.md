# Plan: Community Scheduled Comment Timeline
Date: 2026-05-06
Design: Brainstorming decisions locked in chat, 2026-05-06
Branch: main
Status: DRAFT

## Goal

커뮤니티 자동화 `target-posts` Drawer에서 선택한 게시글의 예약 고스트 댓글을 별도 타임라인으로 보고, 예약 댓글을 취소하거나 발송 시간을 변경할 수 있게 한다. v1은 게시글 상세별 타임라인만 제공하고, source of truth는 `community_automation_contents` DB 상태로 둔다.

## Decisions

- Scope: 게시글 상세별 타임라인 only
- Status model: DB 상태 + UI 보조 배지
- Actions: 예약 취소 + 시간 변경
- UI: `CommunityPostAppDetailPanel` 오른쪽 운영 패널을 `댓글 작성` / `예약 타임라인` 2탭으로 분리
- Source of truth: DB 중심 + health flag, BullMQ 상태 직접 조회는 v1 제외
- Audit: 기본 `community_automation_audit_events` 기록만

## Executor Context

- **Frontend repo**: `/Volumes/eungu/projects/Project-Solo`
- **Backend repo**: `/Volumes/eungu/projects/solo-nestjs-api`
- **Frontend stack**: Next.js 14, TypeScript, MUI, BFF `/api/admin-proxy`
- **Backend stack**: NestJS, Drizzle, BullMQ, `kr`/`jp` schema context
- **Branch**: `main`
- **Primary frontend files**:
  - `app/admin/community/components/CommunityPostAppDetailPanel.tsx`
  - `app/admin/community-automation/target-posts/page.tsx`
  - `app/services/admin/community-automation.ts`
  - `app/services/community.ts`
- **Primary backend files**:
  - `src/admin/v2/community-automation/target-posts-v2.controller.ts`
  - `src/community-automation/services/target-posts.service.ts`
  - `src/community-automation/repository/content.repository.ts`
  - `src/community-automation/queue/publish.queue.ts`
  - `src/community-automation/repository/audit-event.repository.ts`
- **Reference patterns**:
  - Backend queue enqueue: `src/admin/v2/community/admin-ghost-comment.service.ts`
  - Backend publish job handling: `src/community-automation/queue/publish.processor.ts`
  - Frontend target post detail loading: `app/admin/community-automation/target-posts/page.tsx`
  - Frontend admin service calls: `app/services/admin/community-automation.ts`
- **Conventions quoted**:
  > Admin API calls in Project-Solo must use service layer functions, not direct axios/fetch in components.
  > All admin API calls go through `/api/admin-proxy/[...path]`.
  > Preserve unrelated dirty worktree changes.
  > For solo-nestjs-api, respect schema context; `schema === 'jp' ? 'jp' : 'kr'`.
  > Use existing `community_automation_contents` and `community_automation_audit_events` patterns before adding new tables.
- **Verify stack**:
  - Backend: `pnpm exec tsc --noEmit --pretty false`
  - Backend targeted tests: `pnpm test -- community-automation --runInBand`
  - Frontend: `pnpm exec tsc --noEmit --pretty false`
  - Frontend admin tests: `pnpm test:admin -- --runInBand`

## API Contract

### List Scheduled Comments

`GET /admin/v2/community-automation/target-posts/:articleId/scheduled-comments`

Response data:

```ts
type ScheduledCommentTimelineItem = {
  contentId: string;
  articleId: string;
  ghostAccountId: string | null;
  ghostName: string | null;
  ghostUserId: string | null;
  content: string;
  status: 'scheduled' | 'published' | 'quality_failed' | 'withdrawn';
  scheduledAt: string | null;
  publishedAt: string | null;
  commentId: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string | null;
  healthFlags: Array<'due_soon' | 'delayed' | 'revalidation_failed'>;
};
```

Filtering rules:
- `target_article_id = :articleId`
- `target_type = 'COMMENT'`
- `quality_scores->>'source' = 'admin_live_ghost_comment'`
- include statuses: `scheduled`, `published`, `quality_failed`, `withdrawn`
- order: `scheduled_at DESC NULLS LAST, created_at DESC`

### Cancel Scheduled Comment

`PATCH /admin/v2/community-automation/target-posts/:articleId/scheduled-comments/:contentId/cancel`

Rules:
- only `scheduled` can be cancelled
- verify item belongs to `articleId`
- update status to `withdrawn`, `rejectionReason = 'cancelled by admin'`
- remove BullMQ delayed job with `jobId = scheduled-ghost-comment:{schema}:{contentId}` if present
- audit action: `cancel_scheduled_live_comment`

### Reschedule Scheduled Comment

`PATCH /admin/v2/community-automation/target-posts/:articleId/scheduled-comments/:contentId/reschedule`

Body:

```ts
type RescheduleScheduledCommentBody = {
  delayMinutes: number; // 5-180
};
```

Rules:
- only `scheduled` can be rescheduled
- verify item belongs to `articleId`
- compute `scheduledAt = now() + delayMinutes`
- remove existing BullMQ delayed job
- re-add publish job with same jobId `scheduled-ghost-comment:{schema}:{contentId}`
- audit action: `reschedule_scheduled_live_comment`

## Commit Group 1: Backend Timeline API

### Task 1: Add queue job removal support

**Files:** `/Volumes/eungu/projects/solo-nestjs-api/src/community-automation/queue/publish.queue.ts`
**Depends on:** none

**Steps:**
1. Add method:

```ts
async remove(jobId: string): Promise<boolean> {
  const job = await this.queue.getJob(jobId);
  if (!job) return false;
  await job.remove();
  this.logger.log(`Publish job removed: jobId=${jobId}`);
  return true;
}
```

2. Keep existing `add()` behavior unchanged.
3. Verify: `pnpm exec tsc --noEmit --pretty false` in backend repo. Expect no new type errors.

**Commit:** `feat(admin): add scheduled comment timeline api`

**Subagent Prompt:**
> Repo: `/Volumes/eungu/projects/solo-nestjs-api`. Edit `src/community-automation/queue/publish.queue.ts`. Add a `remove(jobId: string): Promise<boolean>` method that gets the BullMQ job by id, removes it if present, logs removal, and returns whether a job was removed. Do not change `add()`. Verify with `pnpm exec tsc --noEmit --pretty false`.

### Task 2: Add repository methods for scheduled comments

**Files:** `/Volumes/eungu/projects/solo-nestjs-api/src/community-automation/repository/content.repository.ts`
**Depends on:** Task 1

**Steps:**
1. Import `and`, `desc`, `eq`, `inArray`, `isNotNull`, `or`, `sql` as needed from `drizzle-orm`.
2. Add `findScheduledCommentsByArticle(articleId: string, schema: string)` that returns relevant `community_automation_contents` rows.
3. Add `findScheduledCommentForArticle(contentId: string, articleId: string, schema: string)` that returns one row and enforces `targetArticleId`.
4. Use existing `getTable(schema)` helper.
5. Filter by:

```ts
eq(table.targetArticleId, articleId)
eq(table.targetType, 'COMMENT')
inArray(table.status, ['scheduled', 'published', 'quality_failed', 'withdrawn'])
sql`${table.qualityScores}->>'source' = 'admin_live_ghost_comment'`
```

6. Verify: `pnpm exec tsc --noEmit --pretty false`.

**Commit:** `feat(admin): add scheduled comment timeline api`

**Subagent Prompt:**
> Repo: `/Volumes/eungu/projects/solo-nestjs-api`. Edit `src/community-automation/repository/content.repository.ts`. Add methods to list and find live scheduled ghost comment content by article using `targetArticleId`, `targetType='COMMENT'`, status in scheduled/published/quality_failed/withdrawn, and `qualityScores->>'source'='admin_live_ghost_comment'`. Follow the existing `findById` and `findPendingReview` style. Verify with `pnpm exec tsc --noEmit --pretty false`.

### Task 3: Implement service methods for list, cancel, reschedule

**Files:** `/Volumes/eungu/projects/solo-nestjs-api/src/community-automation/services/target-posts.service.ts`
**Depends on:** Task 1, Task 2

**Steps:**
1. Inject `PublishQueueService` if not already injected.
2. Add DTO-like return mapping inside service:
   - `contentId = row.id`
   - `articleId = row.targetArticleId ?? row.targetParentId`
   - `content = row.finalText ?? row.generatedText ?? ''`
   - status fields from row
3. Enrich ghost info by joining or querying `ghost_accounts` + `users` for `ghostAccountId`. If a full join is too large, return `ghostAccountId` and `ghostName: null`, then add enrichment in a follow-up task.
4. Add health flags:
   - `due_soon`: `status === 'scheduled'` and scheduledAt is within 5 minutes from now and not past
   - `delayed`: `status === 'scheduled'` and scheduledAt <= now
   - `revalidation_failed`: `status === 'quality_failed'` and `rejectionReason` exists
5. Add `cancelScheduledComment(articleId, contentId, actorId, schema)`:
   - load row with repository method
   - throw `NotFoundException` if missing
   - throw `BadRequestException` unless status is `scheduled`
   - `updateStatus(contentId, 'withdrawn', { rejectionReason: 'cancelled by admin' }, schema)`
   - call `publishQueueService.remove(jobId)`
   - audit `cancel_scheduled_live_comment`
6. Add `rescheduleScheduledComment(articleId, contentId, delayMinutes, actorId, schema)`:
   - validate `delayMinutes` integer 5-180
   - load row and require `scheduled`
   - compute new Date using existing datetime utility or `new Date(Date.now() + delayMinutes * 60_000)`
   - remove old job
   - update status still `scheduled` with `scheduledAt`
   - re-add publish job with same job id
   - audit `reschedule_scheduled_live_comment`
7. Verify: `pnpm exec tsc --noEmit --pretty false`.

**Commit:** `feat(admin): add scheduled comment timeline api`

**Subagent Prompt:**
> Repo: `/Volumes/eungu/projects/solo-nestjs-api`. Edit `src/community-automation/services/target-posts.service.ts`. Add list/cancel/reschedule service methods for live ghost scheduled comments. Use `ContentRepository`, `AuditEventRepository`, and `PublishQueueService`. Only allow cancel/reschedule when status is `scheduled`. Use jobId `scheduled-ghost-comment:${schema}:${contentId}`. Verify with `pnpm exec tsc --noEmit --pretty false`.

### Task 4: Add controller endpoints and DTO

**Files:**
- `/Volumes/eungu/projects/solo-nestjs-api/src/admin/v2/community-automation/target-posts-v2.controller.ts`
- `/Volumes/eungu/projects/solo-nestjs-api/src/admin/v2/community-automation/dto/target-posts.dto.ts`

**Depends on:** Task 3

**Steps:**
1. Add `RescheduleScheduledCommentBodyDto`:

```ts
export class RescheduleScheduledCommentBodyDto {
  @ApiProperty({ example: 30, minimum: 5, maximum: 180 })
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(180)
  delayMinutes: number;
}
```

2. Add controller methods:
   - `GET ':articleId/scheduled-comments'`
   - `PATCH ':articleId/scheduled-comments/:contentId/cancel'`
   - `PATCH ':articleId/scheduled-comments/:contentId/reschedule'`
3. Use `schemaContextStore.getSchema()` and `req.user?.id ?? 'admin'`.
4. Verify: `pnpm exec tsc --noEmit --pretty false`.

**Commit:** `feat(admin): add scheduled comment timeline api`

**Subagent Prompt:**
> Repo: `/Volumes/eungu/projects/solo-nestjs-api`. Edit `src/admin/v2/community-automation/dto/target-posts.dto.ts` and `src/admin/v2/community-automation/target-posts-v2.controller.ts`. Add a reschedule DTO with delayMinutes 5-180 and three endpoints under `:articleId/scheduled-comments`. Wire them to `TargetPostsService`. Verify with `pnpm exec tsc --noEmit --pretty false`.

### Task 5: Add backend tests

**Files:** choose existing community automation test location under `/Volumes/eungu/projects/solo-nestjs-api/test` or `src/community-automation/**/*.spec.ts`
**Depends on:** Task 4

**Steps:**
1. Add targeted tests for:
   - list returns only live ghost scheduled comments for the article
   - cancel changes `scheduled` to `withdrawn` and logs audit
   - cancel rejects `published`
   - reschedule updates `scheduledAt`, removes old job, re-adds job
   - reschedule rejects delay outside 5-180
2. Mock `PublishQueueService.remove/add` if using unit tests.
3. Verify: `pnpm test -- community-automation --runInBand`.

**Commit:** `feat(admin): add scheduled comment timeline api`

**Subagent Prompt:**
> Repo: `/Volumes/eungu/projects/solo-nestjs-api`. Add targeted tests for scheduled comment list/cancel/reschedule. Prefer existing community automation spec patterns. Mock BullMQ queue service if needed. Verify with `pnpm test -- community-automation --runInBand`.

## Commit Group 2: Frontend Service Contract

### Task 6: Add scheduled comment timeline types and service calls

**Files:** `/Volumes/eungu/projects/Project-Solo/app/services/admin/community-automation.ts`
**Depends on:** Backend API contract

**Steps:**
1. Add types:

```ts
export type ScheduledCommentStatus = 'scheduled' | 'published' | 'quality_failed' | 'withdrawn';
export type ScheduledCommentHealthFlag = 'due_soon' | 'delayed' | 'revalidation_failed';

export interface ScheduledCommentTimelineItem {
  contentId: string;
  articleId: string;
  ghostAccountId: string | null;
  ghostName: string | null;
  ghostUserId: string | null;
  content: string;
  status: ScheduledCommentStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  commentId: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string | null;
  healthFlags: ScheduledCommentHealthFlag[];
}
```

2. Add `targetPosts.listScheduledComments(articleId)`.
3. Add `targetPosts.cancelScheduledComment(articleId, contentId)`.
4. Add `targetPosts.rescheduleScheduledComment(articleId, contentId, body: { delayMinutes: number })`.
5. Verify: `pnpm exec tsc --noEmit --pretty false`.

**Commit:** `feat(admin): show scheduled comment timeline`

**Subagent Prompt:**
> Repo: `/Volumes/eungu/projects/Project-Solo`. Edit `app/services/admin/community-automation.ts`. Add scheduled comment timeline types and three service methods under `targetPosts` for list/cancel/reschedule. Use existing `adminGet` and `adminPatch` helpers. Verify with `pnpm exec tsc --noEmit --pretty false`.

### Task 7: Extend panel props for timeline data and actions

**Files:** `/Volumes/eungu/projects/Project-Solo/app/admin/community/components/CommunityPostAppDetailPanel.tsx`
**Depends on:** Task 6

**Steps:**
1. Import `Tabs`, `Tab`, and any needed MUI components.
2. Add local type or import service type for `ScheduledCommentTimelineItem`.
3. Extend props:

```ts
scheduledComments?: ScheduledCommentTimelineItem[];
scheduledCommentsLoading?: boolean;
onReloadScheduledComments?: () => Promise<void>;
onCancelScheduledComment?: (contentId: string) => Promise<void>;
onRescheduleScheduledComment?: (contentId: string, delayMinutes: number) => Promise<void>;
```

4. Add `operationTab` state: `'compose' | 'timeline'`.
5. Do not change left app preview behavior.
6. Verify: `pnpm exec tsc --noEmit --pretty false`.

**Commit:** `feat(admin): show scheduled comment timeline`

**Subagent Prompt:**
> Repo: `/Volumes/eungu/projects/Project-Solo`. Edit `app/admin/community/components/CommunityPostAppDetailPanel.tsx`. Extend props to accept scheduled comment timeline data and actions, add operation tab state, and import MUI tabs. Do not implement full UI yet. Verify with `pnpm exec tsc --noEmit --pretty false`.

### Task 8: Split right panel into compose and timeline tabs

**Files:** `/Volumes/eungu/projects/Project-Solo/app/admin/community/components/CommunityPostAppDetailPanel.tsx`
**Depends on:** Task 7

**Steps:**
1. Wrap the current ghost comment composer in tab panel `compose`.
2. Add tab header labels: `댓글 작성`, `예약 타임라인`.
3. Add timeline tab content:
   - loading state
   - empty state: `예약된 댓글이 없습니다.`
   - card list showing content, ghost, status label, scheduledAt, publishedAt, rejectionReason
   - status labels:
     - `scheduled`: 예약됨
     - `published`: 발화됨
     - `quality_failed`: 실패
     - `withdrawn`: 취소됨
   - health flag chips:
     - `due_soon`: 5분 이내
     - `delayed`: 지연됨
     - `revalidation_failed`: 재검증 실패
4. For `scheduled` items only, show:
   - `취소` button
   - delay select 5-180 min and `시간 변경` button
5. On scheduled comment creation success, call `onReloadScheduledComments?.()` and switch to timeline tab.
6. Verify: `pnpm exec tsc --noEmit --pretty false`.

**Commit:** `feat(admin): show scheduled comment timeline`

**Subagent Prompt:**
> Repo: `/Volumes/eungu/projects/Project-Solo`. Edit `app/admin/community/components/CommunityPostAppDetailPanel.tsx`. Split the right operation panel into MUI tabs. Put existing composer in `댓글 작성`; add `예약 타임라인` list with status/health chips and cancel/reschedule controls for scheduled items. On scheduled creation success, reload scheduled comments and switch to timeline. Verify with `pnpm exec tsc --noEmit --pretty false`.

### Task 9: Wire timeline state in target-posts Drawer

**Files:** `/Volumes/eungu/projects/Project-Solo/app/admin/community-automation/target-posts/page.tsx`
**Depends on:** Task 6, Task 8

**Steps:**
1. Add state:

```ts
const [scheduledComments, setScheduledComments] = useState<ScheduledCommentTimelineItem[]>([]);
const [scheduledCommentsLoading, setScheduledCommentsLoading] = useState(false);
```

2. Add `loadScheduledComments(articleId = selectedPost?.id)` function.
3. After `openDetail` and `refreshDetail`, load scheduled comments.
4. When Drawer closes, clear scheduled comments.
5. Add handlers:
   - `cancelScheduledComment(contentId)`
   - `rescheduleScheduledComment(contentId, delayMinutes)`
6. Pass props to `CommunityPostAppDetailPanel`.
7. After `createLiveGhostComment` returns `scheduledComment`, call `loadScheduledComments(articleId)` and do not append to comments.
8. Verify: `pnpm exec tsc --noEmit --pretty false`.

**Commit:** `feat(admin): show scheduled comment timeline`

**Subagent Prompt:**
> Repo: `/Volumes/eungu/projects/Project-Solo`. Edit `app/admin/community-automation/target-posts/page.tsx`. Add scheduled comment timeline state, load it when a post detail opens/reloads, wire cancel/reschedule handlers, and pass everything to `CommunityPostAppDetailPanel`. Keep existing LLM draft and manual review queue actions unchanged. Verify with `pnpm exec tsc --noEmit --pretty false`.

### Task 10: Keep community-v2 usage backward compatible

**Files:** `/Volumes/eungu/projects/Project-Solo/app/admin/community/community-v2.tsx`
**Depends on:** Task 8

**Steps:**
1. Leave `CommunityPostAppDetailPanel` usage without timeline props.
2. Confirm optional props prevent type errors.
3. Optional: hide `예약 타임라인` tab if no timeline handlers are provided, or show disabled empty state. Prefer hiding the tab outside target-posts v1.
4. Verify: `pnpm exec tsc --noEmit --pretty false`.

**Commit:** `feat(admin): show scheduled comment timeline`

**Subagent Prompt:**
> Repo: `/Volumes/eungu/projects/Project-Solo`. Check `app/admin/community/community-v2.tsx` after panel prop changes. Ensure the existing community detail dialog still typechecks without timeline props. Prefer hiding the timeline tab when no timeline loader/actions are provided. Verify with `pnpm exec tsc --noEmit --pretty false`.

## Commit Group 3: End-to-End Verification And Polish

### Task 11: Add frontend tests or targeted smoke coverage

**Files:** existing admin test files under `/Volumes/eungu/projects/Project-Solo/__tests__` or component test location
**Depends on:** Task 10

**Steps:**
1. Add service-level tests for new targetPosts methods if admin service tests exist.
2. Add component-level test only if current setup already covers MUI component rendering.
3. Minimum assertions:
   - scheduled item status labels map correctly
   - scheduled item exposes cancel/reschedule controls
   - published/withdrawn items do not expose action buttons
4. Verify: `pnpm test:admin -- --runInBand`.

**Commit:** `test(admin): cover scheduled comment timeline`

**Subagent Prompt:**
> Repo: `/Volumes/eungu/projects/Project-Solo`. Add targeted admin tests for scheduled comment timeline service or component behavior using existing test patterns. Cover status labels and action button availability. Verify with `pnpm test:admin -- --runInBand`.

### Task 12: Run final quality checks

**Files:** no source edits expected
**Depends on:** Task 5, Task 11

**Steps:**
1. Backend repo:
   - `pnpm exec tsc --noEmit --pretty false`
   - `pnpm test -- community-automation --runInBand`
   - `git diff --check`
2. Frontend repo:
   - `pnpm exec tsc --noEmit --pretty false`
   - `pnpm test:admin -- --runInBand`
   - `git diff --check`
3. Verify that no unrelated dirty files are staged.

**Commit:** no commit unless checks require small test-only fixes

**Subagent Prompt:**
> Run final checks in both repos. Backend: `pnpm exec tsc --noEmit --pretty false`, `pnpm test -- community-automation --runInBand`, `git diff --check`. Frontend: `pnpm exec tsc --noEmit --pretty false`, `pnpm test:admin -- --runInBand`, `git diff --check`. Report failures with exact command and first actionable error. Do not stage unrelated files.

## Rollback Plan

- Backend rollback:
  - Revert controller endpoints, DTO, service methods, repository methods, and `PublishQueueService.remove`.
  - Existing delayed publish behavior remains intact if only new endpoints are reverted.
- Frontend rollback:
  - Revert panel tabs and target-posts scheduled timeline wiring.
  - Existing immediate/delayed comment creation remains usable.
- Data rollback:
  - No migration is planned.
  - Cancel/reschedule changes are auditable in `community_automation_audit_events`; do not delete audit rows.

## Deployment Notes

- The previously observed immediate-send bug was caused by ECS running image `sometimes-integration-api:8759345`, which predates backend delayed scheduling commit `3ae901cfe`.
- Before QA, deploy backend image at or after `3ae901cfe` plus this timeline work.
- After deployment, manually verify:
  1. Create delayed comment from target-posts Drawer.
  2. Confirm no immediate `comments` row appears.
  3. Confirm item appears in `예약 타임라인`.
  4. Reschedule it.
  5. Cancel it.
  6. Confirm BullMQ job does not later publish cancelled item.
