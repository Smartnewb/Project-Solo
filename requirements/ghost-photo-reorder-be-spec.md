# BE 작업 명세 — Ghost Profile Photo Reorder

**대상 레포**: `solo-nestjs-api`
**작성일**: 2026-04-26
**우선순위**: Medium (운영 편의 기능, 데이터 정합성 영향 큼)
**Source**: `requirements/ghost-photo-reorder-spec.md` + /plan-eng-review + Codex outside voice

---

## 1. 배경

어드민이 Ghost (가상 프로필) 의 사진 3장 슬롯 순서를 재정의해야 하는 운영 요구. 대표이미지(slot 0) 가 매칭/검색에 노출되므로 잘못 배치된 ghost 의 첫번째 사진이 매력도가 낮으면 매칭률 저하 → 어드민이 수동 교정.

두 단계 지원:
1. **Preview 단계**: batch-preview 검수 중 사진 순서 변경 (confirm 전, root.items[].photos 만 갱신).
2. **Confirmed 단계**: 이미 DB 에 저장된 ghost 의 사진 순서 변경 (`profile_images.slot_index` UPDATE).

이미지 자체는 변경하지 않음 (= 슬롯 위치만 swap). 사진 추가/삭제는 기존 `replace-photo` / `remove-photo` 액션 유지.

---

## 2. 현재 BE 상태

### 이미 구현된 관련 부분
- `BatchPreviewItem.photos[].slotIndex: 0 | 1 | 2`
- `PatchBatchPreviewItemBody` 의 `replace-photo` variant
- `profile_images` schema with `slotIndex`, `imageOrder`, `isMain`, `userPreferredMain` columns
- `AuditedCommandBus` + `GhostAdminCommand` 패턴 (a11/a12)
- `BatchPreviewService.patchItem` 분기 구조

### 미구현 (본 작업)
- preview 단계 reorder 액션
- confirmed 단계 reorder 라우트/커맨드/핸들러/서비스
- cache invalidation listener
- audit target_type 필터 확장

### 발견된 제약 (Codex 검증)
- `unique_profile_slot_index_active` 와 `unique_profile_image_order_active` **두 partial unique constraint 존재** → swap 시 둘 다 회피 필요.
- `loadRecentAuditEvents` 가 `target_type='ghost_accounts'` 만 읽음 → photo 관련 audit row 가 ghost 상세에 표시 안됨 (현재도 a11/a12 의 photo audit 누락).
- `RemoveGhostPhotoHandler` 가 slot 0 제거 시 isMain 승계 안함 → broken state 가진 ghost 존재 가능.
- `candidateCount = 2 + Math.random()` 으로 일부 ghost 는 사진 2장만 보유.
- `ProfileCacheInvalidationListener`, `ProfilePhotoCacheListener` 모두 `profile-photo.main-changed` 미수신.

---

## 3. 결정 사항 요약 (locked)

| Decision | Value |
|----------|-------|
| 적용 범위 | Preview + Confirmed 둘 다 |
| 액션 타입 | Reorder (전체 재정의, swap 아님) |
| order semantic | `order[k]` = 새 슬롯 k 에 올 기존 슬롯 인덱스 |
| order 검증 | length === 3, [0,1,2] permutation |
| Photos count | 3장 고정. active count !== 3 → 400. UI 가 reorder 버튼 disable. |
| isMain 정책 | Slot 0 = isMain 자동 동기화. userPreferredMain 보존. |
| imageOrder | slot_index 와 동일 값 유지 (현재 데이터 패턴 + 두 unique constraint 회피) |
| UNIQUE 회피 | 트랜잭션 + 임시 음수 정수 (-1/-2/-3) 양 컬럼 모두 |
| Concurrency | 트랜잭션 시작 시 `SELECT ... FOR UPDATE` on active approved photos |
| Pending replacement | 활성 `pending_replacement_for` row 존재 시 409 ConflictException |
| Ghost ownership 가드 | Service 레이어에서 명시 검증 (ghost_accounts 존재 확인) |
| Audit 패턴 | `ReorderGhostPhotosCommand` + `AuditedCommandBus` |
| Audit payload | `{ before: [{slotIndex, imageId}], after: [{slotIndex, imageId}] }` (full URL 저장 X) |
| target_type 필터 | `loadRecentAuditEvents` 가 `profile_images` 도 노출하도록 확장 |
| Cache invalidation | `profile-photo.main-changed` 이벤트 emit + 양 listener 가 수신 |
| Endpoint | `PATCH /admin/ghost-injection/ghosts/:ghostAccountId/photos/reorder` |
| SSE 이벤트 | 기존 `update` 재사용 (item 단위 broadcast) |

---

## 4. API 설계

### 4.1 Preview reorder (기존 라우트 확장)

**Route**: `PATCH /admin/ghost-injection/batch-preview/:previewId/items/:itemId`

**Body** (신규 variant 추가):
```ts
| { action: 'reorder-photos'; order: [number, number, number] }
```

**검증**:
- order.length === 3
- order = [0,1,2] 의 permutation (set 검사)
- root.items[itemId].photos.length === 3 (= 항상 그러함이지만 방어)
- root.imageSource ∈ {'generate', 'reference-pool', 'manual-upload'} (모든 mode 지원)

**처리**:
- root.items[itemId].photos 를 `order` 에 따라 재구성:
  ```ts
  newPhotos = order.map((sourceSlot, newSlot) => ({
    ...currentPhotos[sourceSlot],
    slotIndex: newSlot as 0 | 1 | 2,
  }));
  ```
- `store.patchItem(previewId, itemId, { photos: newPhotos })`
- `emit(subject, { type: 'update', data: updatedItem })`

**응답**: 200 + 업데이트된 BatchPreviewItem.

**에러**:
- 400 `reorder-photos:order-length-must-be-3`
- 400 `reorder-photos:order-not-permutation`
- 400 `reorder-photos:photos-count-mismatch:${actual}`
- 404 preview/item 없음 (기존 패턴)

---

### 4.2 Confirmed reorder (신규 라우트)

**Route**: `PATCH /admin/ghost-injection/ghosts/:ghostAccountId/photos/reorder`

**Auth**: `JwtAuthGuard` + admin role (컨트롤러 수준 가드 재사용)

**Body**:
```ts
{
  order: [number, number, number]; // permutation of [0,1,2]
  reason: string;                   // min 10 chars (audit 용)
}
```

**검증**:
- ghostAccountId UUID
- order = [0,1,2] permutation
- reason.length >= 10 (기존 confirm 패턴)

**응답**: 200 + `{ ghostAccountId, before: SlotMap, after: SlotMap, audit: { id } }`

**에러**:
- 400 `reorder-photos:order-not-permutation`
- 400 `reorder-photos:photos-count-mismatch:${actual}` (active != 3)
- 403 `reorder-photos:not-a-ghost` (ghost_accounts 에 없음)
- 404 `reorder-photos:ghost-not-found`
- 409 `reorder-photos:pending-replacement-exists`

---

## 5. Module / 의존성

### 신규 파일
- `src/ghost-injection/commands/a13-reorder-ghost-photos/reorder-ghost-photos.command.ts`
- `src/ghost-injection/commands/a13-reorder-ghost-photos/reorder-ghost-photos.handler.ts`
- `src/ghost-injection/commands/a13-reorder-ghost-photos/reorder-ghost-photos.dto.ts`
- `src/ghost-injection/services/ghost-photo-reorder.service.ts`
- `src/ghost-injection/listeners/profile-photo-main-changed.listener.ts` (신규 — cache invalidation 통합)
- `src/ghost-injection/__tests__/ghost-photo-reorder.service.spec.ts`
- `src/ghost-injection/__tests__/ghost-photo-reorder.integration.spec.ts` (실제 DB 트랜잭션)
- `src/ghost-injection/__tests__/batch-preview.service.spec.ts` (기존 파일에 reorder 케이스 추가)

### 수정 파일
- `src/ghost-injection/dto/batch-preview.dto.ts` — `PatchBatchPreviewItemBody` variant 추가
- `src/ghost-injection/services/batch-preview.service.ts` — patchItem reorder-photos 분기
- `src/ghost-injection/controllers/ghost-injection-admin.controller.ts` — 신규 라우트
- `src/ghost-injection/ghost-injection.module.ts` — providers 등록
- `src/ghost-injection/services/ghost-injection-admin-query.service.ts` — `loadRecentAuditEvents` target_type 필터 확장 (or 신규 메서드)

### 의존성
- 신규 npm 패키지 없음 (CommandBus, Drizzle, Nest 모두 기존)

---

## 6. Service 설계

### 6.1 `BatchPreviewService.patchItem` 확장

```ts
if (body.action === 'reorder-photos') {
  this.validateReorderOrder(body.order);
  const photos = current.photos ?? [];
  if (photos.length !== 3) {
    throw new BadRequestException(`reorder-photos:photos-count-mismatch:${photos.length}`);
  }
  const newPhotos = body.order.map((sourceSlot, newSlot) => {
    const src = photos.find((p) => p.slotIndex === (sourceSlot as 0 | 1 | 2));
    if (!src) throw new BadRequestException(`reorder-photos:source-slot-missing:${sourceSlot}`);
    return { ...src, slotIndex: newSlot as 0 | 1 | 2 };
  });
  const merged: BatchPreviewItem = { ...current, photos: newPhotos };
  const saved = await this.store.patchItem(previewId, itemId, merged);
  if (!saved) throw new NotFoundException('patch target missing');
  // SSE
  this.emit(subject, { type: 'update', data: merged });
  return merged;
}

private validateReorderOrder(order: number[]): asserts order is [number, number, number] {
  if (!Array.isArray(order) || order.length !== 3) {
    throw new BadRequestException('reorder-photos:order-length-must-be-3');
  }
  const set = new Set(order);
  if (set.size !== 3 || !set.has(0) || !set.has(1) || !set.has(2)) {
    throw new BadRequestException('reorder-photos:order-not-permutation');
  }
}
```

### 6.2 `GhostPhotoReorderService` (신규)

```ts
@Injectable()
export class GhostPhotoReorderService {
  constructor(
    private readonly db: DrizzleService,
    private readonly schemaContext: SchemaContextStore,
    private readonly eventEmitter: SchemaEventEmitter,
  ) {}

  async reorder(params: { ghostAccountId: string; order: [number, number, number]; actor: string }):
    Promise<{ ghostAccountId: string; before: SlotMap; after: SlotMap }> {
    return this.db.transaction(async (tx) => {
      // 1. ghost_accounts 존재 확인 (ghost ownership 가드)
      const ghost = await tx.select().from(ghostAccounts)
        .where(eq(ghostAccounts.id, params.ghostAccountId))
        .limit(1).then((r) => r[0]);
      if (!ghost) throw new NotFoundException('reorder-photos:ghost-not-found');

      // 2. profile.userId = ghost.ghostUserId 확인 (real user 침범 방지)
      const profile = await tx.select().from(profiles)
        .where(eq(profiles.userId, ghost.ghostUserId))
        .limit(1).then((r) => r[0]);
      if (!profile) throw new NotFoundException('reorder-photos:profile-not-found');

      // 3. SELECT FOR UPDATE on active approved photos (concurrency lock)
      const activePhotos = await tx.select()
        .from(profileImages)
        .where(and(
          eq(profileImages.profileId, profile.id),
          isNull(profileImages.deletedAt),
          eq(profileImages.reviewStatus, 'approved'),
        ))
        .orderBy(profileImages.slotIndex)
        .for('update');

      if (activePhotos.length !== 3) {
        throw new BadRequestException(`reorder-photos:photos-count-mismatch:${activePhotos.length}`);
      }

      // 4. pending_replacement_for 활성 row 검사 → 409
      const pending = await tx.select({ id: profileImages.id })
        .from(profileImages)
        .where(and(
          eq(profileImages.profileId, profile.id),
          isNotNull(profileImages.pendingReplacementFor),
          isNull(profileImages.deletedAt),
        ))
        .limit(1);
      if (pending.length > 0) {
        throw new ConflictException('reorder-photos:pending-replacement-exists');
      }

      // 5. before snapshot
      const before: SlotMap = activePhotos.map((p) => ({ slotIndex: p.slotIndex, imageId: p.imageId }));

      // 6. Phase 1: 임시 음수 정수로 모두 SET (UNIQUE 회피)
      //    - slot_index, image_order 모두 음수로 (둘 다 unique partial 있음)
      for (let i = 0; i < activePhotos.length; i++) {
        await tx.update(profileImages)
          .set({ slotIndex: -(i + 1), imageOrder: -(i + 1) })
          .where(eq(profileImages.id, activePhotos[i].id));
      }

      // 7. Phase 2: 실제 새 slot 값으로 SET + isMain 동기화
      for (let newSlot = 0; newSlot < 3; newSlot++) {
        const sourceSlot = params.order[newSlot];
        const target = activePhotos.find((p) => p.slotIndex === sourceSlot);
        if (!target) throw new BadRequestException(`reorder-photos:source-slot-missing:${sourceSlot}`);
        await tx.update(profileImages)
          .set({
            slotIndex: newSlot,
            imageOrder: newSlot,
            isMain: newSlot === 0,
            // userPreferredMain 보존 (set 안 함)
          })
          .where(eq(profileImages.id, target.id));
      }

      // 8. after snapshot
      const after: SlotMap = params.order.map((sourceSlot, newSlot) => ({
        slotIndex: newSlot,
        imageId: activePhotos.find((p) => p.slotIndex === sourceSlot)!.imageId,
      }));

      // 9. cache invalidation 이벤트 emit
      this.eventEmitter.emit('profile-photo.main-changed', {
        profileId: profile.id,
        ghostAccountId: params.ghostAccountId,
        previousMainImageId: before.find((b) => b.slotIndex === 0)?.imageId,
        newMainImageId: after.find((a) => a.slotIndex === 0)?.imageId,
      });

      return { ghostAccountId: params.ghostAccountId, before, after };
    });
  }
}

type SlotMap = Array<{ slotIndex: number; imageId: string }>;
```

### 6.3 `ReorderGhostPhotosCommand` + Handler

```ts
// command
export class ReorderGhostPhotosCommand implements GhostAdminCommand<ReorderResult> {
  readonly targetType = 'profile_images' as const;
  readonly actionType = 'reorder_photos' as const;
  constructor(
    public readonly ghostAccountId: string,
    public readonly order: [number, number, number],
    public readonly reason: string,
    public readonly actor: string,
  ) {}
  get targetId() { return this.ghostAccountId; }
}

// handler
@CommandHandler(ReorderGhostPhotosCommand)
export class ReorderGhostPhotosHandler implements ICommandHandler<ReorderGhostPhotosCommand, ReorderResult> {
  constructor(private readonly service: GhostPhotoReorderService) {}
  async execute(cmd: ReorderGhostPhotosCommand): Promise<ReorderResult> {
    return this.service.reorder({
      ghostAccountId: cmd.ghostAccountId,
      order: cmd.order,
      actor: cmd.actor,
    });
  }
}

// AuditedCommandBus.dispatch 가 자동으로 afterStateJson 에 result 저장
// → audit row 에 { ghostAccountId, before, after } 기록
```

### 6.4 Cache Invalidation Listener

`profile-photo.main-changed` 이벤트 신규 emit. 두 listener 에 수신 핸들러 추가:

- `ProfileCacheInvalidationListener` — 매칭 캐시 evict
- `ProfilePhotoCacheListener` — 사진 캐시 evict

기존 `setMainImage` 도 같은 이벤트 emit 하도록 정리 (선택 — 본 작업 우선순위 외).

---

## 7. Audit & Query 변경

### 7.1 `loadRecentAuditEvents` 필터 확장

기존 (`ghost-injection-admin-query.service.ts`):
```ts
where(eq(ghostAuditEvents.targetType, 'ghost_accounts'))
```

변경:
```ts
where(or(
  eq(ghostAuditEvents.targetType, 'ghost_accounts'),
  and(
    eq(ghostAuditEvents.targetType, 'profile_images'),
    inArray(ghostAuditEvents.targetId, profileImageIdsForGhost(ghostAccountId)),
  ),
))
```

또는 더 단순하게: ghost_account 의 `ghostUserId` → `profile.id` → 그 profile 의 photo 관련 audit 도 같은 ghost 상세 화면에 노출.

구현 옵션:
- A. join 강제 (위 SQL)
- B. ghost_account 의 audit 에 추가 metadata (`relatedProfileImageIds: string[]`) 기록 — 신규 구조
- C. 신규 메서드 `loadGhostPhotoAuditEvents(ghostAccountId)` 별도 노출

**권장: A** (단일 SQL, 기존 메서드 확장).

### 7.2 Audit afterStateJson 형식

```json
{
  "ghostAccountId": "uuid",
  "before": [
    { "slotIndex": 0, "imageId": "img-uuid-A" },
    { "slotIndex": 1, "imageId": "img-uuid-B" },
    { "slotIndex": 2, "imageId": "img-uuid-C" }
  ],
  "after": [
    { "slotIndex": 0, "imageId": "img-uuid-C" },
    { "slotIndex": 1, "imageId": "img-uuid-A" },
    { "slotIndex": 2, "imageId": "img-uuid-B" }
  ],
  "reason": "..."
}
```

S3 URL, 프로필 텍스트 등 큰 payload 미포함.

---

## 8. Schema 변경

### 8.1 마이그레이션 필요?

**없음**. 기존 `profile_images.slotIndex`, `imageOrder`, `isMain` 모두 활용. 컬럼 추가/변경 없음.

### 8.2 (선택) audit metadata index

`ghost_audit_events` 에 `(target_type, target_id)` composite index 가 있다면 7.1 의 OR 쿼리 효율 OK. 없으면 추가 검토 (별도 작업).

---

## 9. Multi-country (kr/jp)

### 9.1 BE
- `SchemaMiddleware` + `X-Country` header 자동 처리. 신규 코드는 `db.transaction` 안에서 `schemaContext` 자동 적용 (기존 패턴).

### 9.2 FE
- 모든 reorder API 호출에 `X-Country` header 명시 송신. `axiosClient` interceptor 가 admin session country 자동 첨부 (확인 필요).

---

## 10. 테스트 계획 (29 케이스)

### 10.1 `batch-preview.service.spec.ts` (preview reorder)

1. happy: 3-photo item, order=[2,0,1] → photos 재정렬, slotIndex 갱신
2. order length !== 3 → BadRequest `order-length-must-be-3`
3. order=[0,0,1] (중복) → BadRequest `order-not-permutation`
4. order=[3,0,1] (out-of-range) → BadRequest
5. photos.length !== 3 (방어) → BadRequest `photos-count-mismatch`
6. SSE update emit 확인 (mock subject)
7. preview imageSource 가 manual-upload/reference-pool/generate 모두 동작

### 10.2 `ghost-photo-reorder.service.spec.ts` (unit)

8. ghost 미존재 → NotFoundException
9. profile 미존재 → NotFoundException
10. active photo count !== 3 → BadRequest `photos-count-mismatch`
11. pending_replacement_for 존재 → ConflictException `pending-replacement-exists`
12. order permutation invalid → BadRequest
13. happy: order=[2,0,1] → before/after 반환, isMain (slot 0 = true, 나머지 false), userPreferredMain 보존

### 10.3 `ghost-photo-reorder.integration.spec.ts` (실제 DB)

14. **REGRESSION CRITICAL**: 트랜잭션 도중 강제 throw → rollback, slot_index 원본 유지
15. 음수값 phase 도중 다른 트랜잭션 SELECT (FOR UPDATE 검증) → blocked until commit
16. 두 어드민 동시 reorder → 두번째는 첫번째 완료 후 실행 (lock 검증)
17. UNIQUE constraint 회피 검증 — slot_index AND image_order 둘 다 conflict 안 남
18. real user profileId 의 ghost_account 시도 → ForbiddenException (ghost_accounts 미발견)
19. 정상 reorder 후 ghost_audit_events 에 after_state_json 저장 + 형식 검증

### 10.4 Controller / e2e

20. POST without auth → 401
21. POST without admin role → 403
22. body order 누락 → 400
23. body reason < 10 chars → 400
24. happy → 200 + before/after JSON
25. 미존재 ghostAccountId → 404
26. real user ghostAccountId (not in ghost_accounts) → 403
27. X-Country: kr 와 jp 양쪽 동작 검증

### 10.5 Listener

28. `profile-photo.main-changed` emit 시 `ProfileCacheInvalidationListener` 가 evict 수행 (mock cache)
29. `ProfilePhotoCacheListener` 도 동일

---

## 11. 출시 / 롤백

### 11.1 Feature flag
- `assertBatchPreviewEnabled()` 가드 재사용 (preview reorder 만 적용).
- Confirmed reorder 는 별도 flag 불필요 (admin only, low risk).

### 11.2 롤백 시퀀스
1. Controller 라우트 제거 → confirmed reorder 만 차단.
2. `BatchPreviewService.patchItem` 의 reorder-photos branch 제거 → preview reorder 차단.
3. CommandBus handler 제거.
4. cache listener 핸들러 제거 (이벤트 emit 자체는 무해).
5. audit query 필터 확장 revert (별도 PR 권장 — UI 가 의존하면 깨짐).

DB schema 변경 없음 → migration revert 불필요.

### 11.3 검증 SQL
```sql
-- reorder 후 정합성
SELECT slot_index, image_order, is_main, image_id
FROM kr.profile_images
WHERE profile_id = '<profile_id>' AND deleted_at IS NULL
ORDER BY slot_index;
-- 기대: slot_index=0/1/2, image_order = slot_index, slot_index=0 row 의 is_main=true, 나머지 false

-- audit
SELECT action_type, after_state_json
FROM kr.ghost_audit_events
WHERE target_id = '<ghostAccountId>' AND action_type = 'reorder_photos'
ORDER BY created_at DESC LIMIT 5;
```

---

## 12. Out of scope (참고)

- 4+ 슬롯 ghost 지원 (현재 max 3 가정)
- 2-slot ghost reorder 지원 (별도 add-photo flow 안내)
- mixed reorder + replace 한 번에 처리
- 모바일 drag-and-drop (어드민 desktop only)
- presigned URL 직접 swap (slot 메타만 변경, 이미지 자체 미변경)
- ghost_account state machine (예: "reviewing" 상태에서 reorder 차단) — 운영 정책 미정
- isMain / userPreferredMain 의미론 정리 (기존 setMainImage 와 통합 — 별도 PR)
- `loadRecentAuditEvents` 가 `setMainImage` audit 도 누락하는 기존 버그 — 별도 fix
- representative_image_url 등 denormalized 컬럼 동기화 (현재 schema 에 없음)

---

## 13. 의존성 / 작업 순서

### G1 (DTO + preview service)
- batch-preview.dto.ts 확장
- BatchPreviewService.patchItem reorder-photos branch
- batch-preview.service.spec.ts 확장 케이스
- Commit: `feat(ghost-injection): add reorder-photos action to batch-preview patchItem`

### G2 (Confirmed service + handler + command)
- GhostPhotoReorderService 신규
- ReorderGhostPhotosCommand + Handler
- ghost-photo-reorder.service.spec.ts unit
- Commit: `feat(ghost-injection): implement GhostPhotoReorderService with transaction-safe slot swap`

### G3 (Controller + integration test)
- ghost-injection-admin.controller.ts 신규 라우트
- ghost-photo-reorder.integration.spec.ts (실제 DB)
- Commit: `feat(ghost-injection): add PATCH /ghosts/:id/photos/reorder endpoint`

### G4 (Cache listener + audit query 확장)
- ProfilePhotoMainChangedListener (or 양 listener 핸들러 추가)
- ghost-injection-admin-query.service.ts loadRecentAuditEvents 필터 확장
- Commit: `feat(ghost-injection): wire profile-photo cache invalidation and surface photo audits on ghost detail`

### G5 (Module 등록)
- ghost-injection.module.ts providers
- Commit: `chore(ghost-injection): register reorder service, handler, and listener`

### G6 (E2E + 수동 검증)
- 수동 curl + DB 검증
- (코드 변경 없음)

**Lane 분리**: G1, G2 는 무관 → parallel worktree 가능. G3 는 G2 의존. G4, G5 는 모든 service 머지 후. G1+G2 = ~3h, G3+G4+G5 = ~2h, 합계 ~5h.

---

## 14. Open Risks

1. `loadRecentAuditEvents` 필터 확장 시 기존 a11/a12 (replace-photo, remove-photo) audit 도 갑자기 노출됨. 의도된 효과지만 UI 표시 형식 추가 작업 발생 가능 → FE 와 사전 합의 필요.
2. `setMainImage` 와 의미 충돌. 기존 setMainImage 는 isMain 만 변경 (slot_index 는 그대로). reorder 는 slot 0 = isMain 강제 동기화. 두 메서드의 isMain 정책 분기점 명확화 필요. **MVP 정책**: reorder 후 setMainImage 는 isMain 만 다시 변경 가능 (slot 0 != main 인 일관성 깨진 상태 허용). 추후 정리.
3. Pending replacement 동시 진행 시 reorder 차단 (409). 어드민이 replace 와 reorder 를 같은 ghost 에서 동시 수행할 빈도는 낮을 것으로 추정.
4. dnd-kit 추가 (FE) — 어드민 번들 크기 +50KB (~4% 증가 추정). 허용 범위.

---

## 15. 작업량 추정

| Group | Tasks | 시간 (CC+gstack) |
|-------|-------|------|
| G1 | DTO + preview service + spec | 1.5h |
| G2 | Confirmed service + handler + spec | 2h |
| G3 | Controller + integration spec | 1.5h |
| G4 | Listener + audit query | 1h |
| G5 | Module register | 0.3h |
| G6 | 수동 e2e | 0.7h |
| **합계** | **~7h** | (스펙의 5-7h 범위) |

FE 작업 (별도 PRD 권장):
- dnd-kit 설치 + PhotoReorderDnd 컴포넌트: 1.5h
- preview 다이얼로그 통합: 1h
- ghost 상세 페이지 통합: 1h
- e2e Playwright: 1h
- 합계 ~4.5h

전체 ~12h. 1.5일 작업.
