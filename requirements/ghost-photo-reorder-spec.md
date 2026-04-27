# Ghost Profile Photo Reorder — Requirement Spec

Date: 2026-04-26
Status: ENG_REVIEWED (decisions locked, ready for PRD)
Source: /clarify session + /plan-eng-review + Codex outside voice

---

## Original Requirement

> "ai injection admin api 중에 가상 프로필 사진 3장을 볼수잇는데 여기서, 각 프로필사진의 위치 (대표이미지는 첫번재 슬롯) 를 변경할 수 있는 기능을 추가하고싶어. 백엔드에 PRD 를 작성하고 ui 를 작업하자"

---

## Goal

Ghost 프로필 사진 3장의 슬롯 순서를 어드민이 재정의할 수 있게 한다. slot 0 = 대표이미지. preview 단계 (검수 전) 와 confirmed 단계 (DB 저장 후) 모두 지원.

## Scope

### In scope
- **BE preview**: `PatchBatchPreviewItemBody` 에 `{ action: 'reorder-photos', order: [number, number, number] }` variant 추가. `BatchPreviewService.patchItem` 분기.
- **BE confirmed**: 신규 라우트 `PATCH /admin/ghost-injection/ghosts/:ghostId/photos/reorder`. body `{ order: [number, number, number] }`. `ghost_profile_images.slot_index` 갱신.
- **FE**: 사진 카드 drag-and-drop (dnd-kit). preview 다이얼로그 + ghost 상세 페이지 두 곳.
- **Audit**: 기존 `AuditedCommandBus` afterStateJson 자동 기록 (before/after slot order).

### Out of scope
- 사진 추가/삭제 (`replace-photo` 별도 유지)
- 모바일 drag-and-drop (어드민 desktop only)
- mixed reorder + replace 한번에 처리
- 슬롯 빈자리 허용 (3장 항상 채움 가정 유지)

---

## Constraints

- `order` = `[number, number, number]`. [0,1,2] permutation 만 허용.
  - 현재 슬롯 i 의 사진을 새 슬롯 `order[i]` 로 이동.
  - 또는: `order[k]` = "새 슬롯 k 에 들어갈 기존 슬롯 인덱스". 둘 중 하나로 명확화 필요 (PRD 단계 결정).
- 항상 3장 채워진 상태 가정 (BatchPreviewItem.photos.length === 3, ghost_profile_images active row 3개).
- `BatchPreviewRoot.imageSource` = `generate` / `reference-pool` / `manual-upload` 모두 지원.
- confirmed 라우트는 active 사진만 reorder (`deleted_at IS NULL`).
- 어드민 가드: 기존 `JwtAuthGuard` + `assertBatchPreviewEnabled()` 패턴 따름.

## Success Criteria

### Preview 단계
1. 어드민이 batch-preview 다이얼로그에서 사진 카드 drag → drop.
2. `PATCH /admin/ghost-injection/batch-preview/:id/items/:itemId` body `{ action: 'reorder-photos', order: [...] }` 호출.
3. `BatchPreviewService.patchItem` 가 `root.items[itemId].photos[].slotIndex` 갱신 후 store 저장.
4. SSE stream 에 `update` 이벤트 emit.
5. UI 가 새 순서 반영.

### Confirmed 단계
1. 어드민이 ghost 상세 페이지에서 사진 카드 drag → drop.
2. `PATCH /admin/ghost-injection/ghosts/:ghostId/photos/reorder` body `{ order: [...] }` 호출.
3. 트랜잭션 내에서 `ghost_profile_images.slot_index` 3개 row UPDATE.
4. AuditedCommandBus 가 before/after slot map 기록.
5. slot 0 변경 시 downstream 썸네일 캐시 invalidate (ghost_account 의 `representative_image_url` 갱신 필요 여부 확인).

---

## Decisions Made

### Phase 1: /clarify 결정
| Question | Decision |
|----------|----------|
| 적용 범위 | Preview + Confirmed 둘 다 |
| 액션 타입 | Reorder (전체 재정의) |
| UI 인터랙션 | Drag-and-drop (dnd-kit) |
| API 표면 | 별도 액션 (`reorder-photos`) |
| 검증 | order = [0,1,2] permutation |
| 모바일 | 미지원 (desktop only) |
| 빈 슬롯 | 미허용 (3장 가정) |

### Phase 2: /plan-eng-review 결정
| Question | Decision |
|----------|----------|
| isMain 정책 | Slot 0 = isMain 자동 동기화. userPreferredMain 보존. |
| UNIQUE 회피 | 트랜잭션 + 임시 음수값 (deterministic -1/-2/-3, 단 image_order 도 함께 swap) |
| order semantic | order[k] = 새 슬롯 k 에 올 기존 슬롯 인덱스 |
| ghost ownership 가드 | Service 레이어에서 명시 검증 (ghost_accounts 존재 확인) |

### Phase 3: Codex outside voice 결정
| Question | Decision |
|----------|----------|
| Photos count | 3장 고정. active count !=3 → 400. UI 에서 reorder 버튼 disable. |
| Audit 패턴 | `ReorderGhostPhotosCommand` + `AuditedCommandBus` (기존 a11/a12 패턴). + `loadRecentAuditEvents` target_type 필터 확장 (profile_images OR ghost_accounts). |
| Endpoint | `PATCH /admin/ghost-injection/ghosts/:ghostAccountId/photos/reorder` |

## Codex Non-tension Findings (PRD 자동 반영)

- **P0**: image_order 도 같은 swap 로직 필요 (`unique_profile_image_order_active` 도 conflict).
- **P0**: 임시 음수값 = -1/-2/-3 (UUID 가 아닌 정수 도메인).
- **P0**: `SELECT ... FOR UPDATE` on active approved profile_images for the profile, BEFORE resolving order. 동시 reorder race 방지.
- **P1**: Reorder service 는 broken state (slot 0 missing isMain 등) 도 repair. clean state 가정 X.
- **P1**: Cache invalidation — `profile-photo.main-changed` 이벤트 발행 + `ProfileCacheInvalidationListener` / `ProfilePhotoCacheListener` 양쪽 listener 추가.
- **P1**: `slot_index`, `image_order`, `isMain` 셋 다 동기 갱신. (admin/user/chat consumer 분기 통일.)
- **P2**: FE 는 `X-Country` header 명시 송신 (admin kr default 의존 X).
- **P2**: Audit afterStateJson = `{ before: [{slotIndex, imageId}, ...], after: [{slotIndex, imageId}, ...] }` 만. full S3 URL 저장 X.
- **P2**: `pending_replacement_for` 활성 row 존재 시 reorder block (409 ConflictException). MVP 정책. 추후 sync 로직 검토.

---

## Open Questions Resolved

1. ✅ `order` semantic: order[k] = 새 슬롯 k 에 올 기존 슬롯 인덱스.
2. ✅ `representative_image_url` 별도 컬럼 없음. `profile_images.isMain` boolean 동기화 + cache invalidation event 로 처리.
3. ✅ UNIQUE constraint 2개 (slot_index AND image_order) 존재 확인. 트랜잭션 + 임시 음수 정수 (-1/-2/-3) 양 컬럼 모두 적용.
4. ✅ SSE 이벤트 = 기존 `update` 재사용 (item 단위 broadcast).
5. ✅ dnd-kit 미설치 확인. PRD 에 `pnpm add @dnd-kit/core @dnd-kit/sortable` 명시.

---

## Related Files (to investigate during PRD)

### Backend (`/Users/user/projects/solo-nestjs-api`)
- `src/ghost-injection/dto/batch-preview.dto.ts` — `PatchBatchPreviewItemBody` variant 추가
- `src/ghost-injection/services/batch-preview.service.ts` — `patchItem` 분기
- `src/ghost-injection/controllers/ghost-injection-admin.controller.ts` — confirmed reorder 라우트
- `src/database/schema/` — `ghost_profile_images` schema (slot_index 컬럼, UNIQUE constraint 확인)
- `src/ghost-account/` — `ghost_accounts.representative_image_url` 또는 유사 컬럼 확인

### Frontend (`/Users/user/projects/Project-Solo`)
- `app/admin/` — ghost-injection batch-preview 다이얼로그 위치
- `app/admin/ghosts/` 또는 `app/admin/ghost-accounts/` — confirmed ghost 상세 페이지 위치
- `package.json` — `@dnd-kit/core` 설치 여부

---

## Next Step

`/autoplan` 또는 직접 PRD 작성. 본 spec → BE PRD (`requirements/ghost-photo-reorder-be-spec.md`) → FE plan.
