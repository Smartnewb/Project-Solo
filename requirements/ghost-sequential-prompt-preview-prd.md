# Ghost Sequential Prompt Preview & Confirm — PRD

- **Status**: Reviewed (plan-eng-review complete)
- **Author**: Claude + galaxy4276
- **Target**: solo-nestjs-api (sometimes-api) + Project-Solo admin
- **Scope**: Ghost 계정 일괄 생성 플로우를 **"프롬프트 순차 설계 → 미리보기 → 확정 생성"** 의 2단계 파이프라인으로 전환
- **Depends on**: `ghost-injection` 모듈, `ai-profile` 이미지 벤더 레지스트리, Redis (BullMQ 인프라 재활용)

---

## 1. 배경 & 문제

### 현재 구조
- `POST /admin/ghost-injection/create-batch` 한 번에 프로필(이름/대학/MBTI) + 사진 3장을 **동시 생성**.
- 각 슬롯이 독립 프롬프트로 호출됨 (`resolveVariants` → `generateAndUploadSlot`).
- 결과: 같은 Ghost 내 3장의 사진이 **다른 사람처럼 보이는 경우 빈번** (헤어/체형/복장 불일치).
- 어드민이 결과를 보고 불만족 시 슬롯 단위 재생성만 가능 — 초반부터 다시 찍는 비용(시간·돈) 낭비.

### 배경 제약
- **Vendor rate-limit**: OpenAI gpt-image-2 / Seedream 모두 분당 요청 상한. 배치 6명 × 3장 = 18 동시 호출 시 일부 스로틀.
- **시각적 일관성**: 같은 사람의 3장은 **헤어스타일 · 피부톤 · 체형 · 복장 스타일**이 이어져야 함. 독립 프롬프트로는 재현 불가.
- **어드민 승인 프로세스 부재**: 프로필(이름/대학) 은 임시 저장되지만 사진은 즉시 생성·과금. 미승인 자원 낭비.

### 해결 방향
**단계 1**: 배치 요청 시, 각 고스트의 프로필 + 3개 슬롯 프롬프트를 **순차적으로** 설계. 프롬프트 2번은 1번의 텍스트를, 프롬프트 3번은 1+2번의 텍스트를 context 로 포함 → 일관된 페르소나 기술.
**단계 2**: 어드민에게 프롬프트 목록 표시 (+ 프로필 메타). 프롬프트 편집 · 재샘플링 · 개별 채택 가능.
**단계 3**: 확정 버튼 → 선택된 고스트의 프롬프트로 이미지 생성 + Ghost/User 레코드 생성 + DB persist.

---

## 2. 목표 (Goals)

| # | 목표 | 측정 기준 |
|---|---|---|
| G1 | 동일 고스트 3장 시각적 일관성 향상 | 내부 평가 50명 대상 "같은 사람으로 보임" 비율 ≥ 85% (현재 추정 50%) |
| G2 | 프롬프트 가시성 + 편집 가능성 | 어드민이 미생성 상태에서 프롬프트 100% 검토·수정 가능 |
| G3 | 저품질 사진으로 인한 재생성 비용 감소 | 사진 재생성 API 호출량 ≥ 30% 감소 |
| G4 | 벤더 rate-limit 대응 | 프롬프트 단계는 LLM 순차 호출, 이미지 단계는 설정 가능한 concurrency (기본 3) 로 안전 호출 |

### Non-Goals (이번 스코프 아님)
- 단일 고스트 생성(`/create`) 경로 변경 — 기존 유지
- 사진 재생성(`/regenerate-photos`) 플로우 변경
- 프롬프트 버전 관리 시스템 (ai-profile-generator 와 별개)
- 페르소나 archetype 기반 선택 UI (추후 확장)

---

## 3. 유저 스토리

### US-1. 어드민 — 배치 미리보기
> 어드민으로서, 6명의 고스트를 한 번에 생성하려 할 때, 각 고스트의 프로필과 3장의 사진 프롬프트를 **이미지 생성 전에** 확인하고 싶다. 마음에 들지 않는 프롬프트는 재샘플링하거나 직접 수정하고, 일부만 골라 확정하고 싶다.

### US-2. 어드민 — 일관성 검증
> 어드민으로서, 각 고스트의 3장 프롬프트가 **같은 사람 기술**로 이어지는지 prompt 텍스트에서 확인하고 싶다 (예: "검은 긴 단발 · 파스텔 블라우스 · 갸름한 턱선"이 세 슬롯 모두에 일관되게 포함).

### US-3. 시스템 — Rate-limit 안전 호출
> 시스템으로서, 배치 내 프롬프트 생성은 순차 LLM 호출, 이미지 생성은 제한된 동시성으로 벤더 API 를 호출하여 스로틀링 없이 안정적으로 완료되어야 한다.

---

## 4. 상위 레벨 플로우

```
어드민 UI                    BE API                         LLM / Vendor
────────                    ──────                         ────────────
[1개 생성] 다이얼로그 Open
설정: count=6, vendor=openai
  │
  ├─ POST /batch-preview ────►
  │    { count, vendor, schoolHintId? }
  │                           
  │                           ┌── 순차 루프 (i=0..5) ──┐
  │                           │ 1. 대학/학과/이름/나이 샘플
  │                           │ 2. archetype context 빌드
  │                           │ 3. prompt #1 생성 ──LLM──►
  │                           │ 4. prompt #2 생성 ──LLM──► (with #1 context)
  │                           │ 5. prompt #3 생성 ──LLM──► (with #1, #2 context)
  │                           │ 6. Redis 에 preview 저장 (TTL 15분)
  │                           └──────────────────────────┘
  │                           
  ◄─── 200 { previewId, items[] }
  
UI: 6개 preview 카드 표시 (프로필 + 3 프롬프트)
  │
  ├─ PATCH /batch-preview/:previewId/items/:itemId ────►
  │    { slotPrompts?, action: 'edit'|'regenerate' }
  ◄─── 200 (update Redis)
  
어드민: 일부 체크 → [확정 생성]
  │
  ├─ POST /batch-preview/:previewId/confirm ──────────►
  │    { itemIds[], reason }
  │                           
  │                           ┌── 확정 루프 (concurrency=3) ──┐
  │                           │ 1. Ghost/User/Profile 삽입 (tx)
  │                           │ 2. 슬롯별 이미지 생성 ──vendor──►
  │                           │ 3. S3 업로드 + profile_images 삽입
  │                           │ 4. Redis preview 삭제
  │                           └──────────────────────────────┘
  │                           
  ◄─── 200 BatchCreateResult
  
UI: 기존 "생성 결과" 화면 재사용 (생성된 고스트 + 사진 표시)
```

---

## 5. API 계약 (신규)

### 5.1 `POST /admin/ghost-injection/batch-preview`

**Request**
```ts
{
  count: number;            // 1-50
  vendor: 'seedream' | 'openai' | 'grok';
  schoolHintId?: string;    // 특정 학교 우선 샘플링 (optional)
  ageHint?: { min: number; max: number };  // 기본 20-27
  dryRun?: boolean;         // true 면 프롬프트만 생성, Redis persist 안 함
}
```

**Response 200**
```ts
{
  previewId: string;        // UUID v7, Redis key 참조
  vendor: ImageVendor;
  expiresAt: string;        // ISO, Redis TTL 종료 시각
  items: BatchPreviewItem[];
}

interface BatchPreviewItem {
  itemId: string;           // UUID v7, item 단위 편집 key
  profile: {
    name: string;
    age: number;
    mbti: string;
    rank: 'S' | 'A' | 'B' | 'C';
    introduction: string;
  };
  university: { id: string; name: string };
  department: { id: string; name: string };
  archetype: {
    id: string | null;
    name: string | null;    // e.g., "차분한 단발 블라우스"
    traits: string[];       // 핵심 외모 기술자 3-5개
  };
  slotPrompts: SlotPrompt[];  // length 3
}

interface SlotPrompt {
  slotIndex: 0 | 1 | 2;
  prompt: string;           // 완성된 이미지 프롬프트
  negativePrompt?: string;
  referenceUrls?: string[]; // seedream 의 pool ref 선택 결과 (optional)
  generationContext: {
    personaDescriptor: string;  // 공통 외모 기술자 (1장부터 2,3장까지 재사용)
    sceneDescriptor: string;    // 장면별 변주 (ex: '일상 셀카', '풍경 배경')
    priorSlotSummaries: string[];  // slotIndex < N 의 요약. 일관성 검증용
  };
}
```

**Errors**
- 400 `BadRequestException` — count 범위 벗어남, vendor 미지원
- 403 `ForbiddenException` — public 스키마
- 429 `TooManyRequestsException` — LLM rate-limit 도달
- 500 `InternalServerErrorException` — LLM 응답 파싱 실패

### 5.2 `PATCH /admin/ghost-injection/batch-preview/:previewId/items/:itemId`

**Request — 프롬프트 수동 편집**
```ts
{ action: 'edit'; slotPrompts: Array<{ slotIndex: 0|1|2; prompt: string; negativePrompt?: string }> }
```

**Request — 단일 아이템 재샘플링 (전체 3 슬롯 순차 재생성)**
```ts
{ action: 'regenerate'; preserveProfile?: boolean }
// preserveProfile=true 면 name/age/학교 유지, 프롬프트만 다시 샘플
// false (기본) 면 프로필 포함 완전 재샘플
```

**Response 200**
```ts
BatchPreviewItem  // 업데이트된 단일 아이템
```

### 5.3 `POST /admin/ghost-injection/batch-preview/:previewId/confirm`

**Request**
```ts
{
  itemIds: string[];   // 확정할 itemId 부분집합 (빈 배열 불가)
  reason: string;      // ≥10자 (감사 로그)
  concurrency?: number; // 기본 3, 최대 5
}
```

**Response 200**
```ts
BatchCreateResult  // 기존 타입 재사용
{
  total: number;
  success: number;
  failed: number;
  vendor: ImageVendor;
  results: BatchCreateResultItem[];  // 기존 타입. ghostAccountId 포함
}
```

**에러**
- 404 preview expired
- 400 itemIds 중 일부가 preview 에 없음
- 500 이미지 생성 실패 → 부분 성공 응답 (기존과 동일)

### 5.4 `DELETE /admin/ghost-injection/batch-preview/:previewId` (optional)

어드민이 preview 명시적 취소. Redis key 삭제. 200 No Content.

### 5.5 `GET /admin/ghost-injection/batch-preview/:previewId` (optional)

페이지 새로고침 대비. 200 시 현재 Redis 상태 반환.

---

## 6. 데이터 설계

### 6.1 Redis (기존 BullMQ 인프라 재활용)

**Key pattern — 단일 JSON blob**
```
ghost-injection:preview:{previewId}   # STRING, TTL 15분
```

편집 시 read-modify-write + `SETEX` 로 TTL 재설정. 분산 key 피함 (race 방지).

**Value shape**
```ts
{
  previewId: string;
  actorUserId: string;
  schemaContext: string;     // kr|jp
  vendor: ImageVendor;
  count: number;
  createdAt: string;
  confirmedItemIds: string[];        // idempotency — 이미 확정된 item 재생성 방지
  items: Record<itemId, BatchPreviewItem & { seed: number }>;
}
```

TTL 전략: 15분 (어드민 검토 여유). confirm 성공 후에도 즉시 삭제 안 함 — 부분 실패 재시도 위해 TTL 만료까지 유지.

### 6.2 신규 테이블 — 필요 없음

이유: preview 는 persist 할 가치 낮음 (확정 안 되면 버림). 감사 필요시 `ghost_audit_events` 에 `GHOST_BATCH_PREVIEWED` / `GHOST_BATCH_CONFIRMED` action 만 기록.

### 6.3 ghost_audit_events 신규 actionType

| actionType | targetType | targetId | afterStateJson |
|---|---|---|---|
| `GHOST_BATCH_CONFIRMED` | `batch_preview` | previewId | `{ confirmedItemIds, createdGhostAccountIds, reason, actorUserId }` |

Preview 생성/편집 이벤트는 로깅하지 않는다 — 15분 TTL 임시 데이터이며 사용자 영향 없음. 실제 Ghost 가 생성된 시점만 감사 대상.

### 6.4 persona_archetypes 활성화 (Phase 1 포함)

현재 `ghost_accounts.personaArchetypeId` 는 nullable + 미사용. 이번 Phase 1 에 활성화:
- Preview 단계에서 `ghost_persona_archetypes` 중 `isActive = true` 로 랜덤 선정
- Preview item 에 archetype 포함 반환 (어드민이 다른 archetype 선택 가능 — 편집 API 확장)
- Confirm 시 `ghost_accounts.personaArchetypeId` 에 FK 저장
- 후속 ML/분석 트레이드오프 추적 기반 마련.

---

## 7. 프롬프트 생성 로직 (핵심)

### 7.0 Persona descriptor 는 Deterministic (LLM 아님)

**결정**: `src/ghost-injection/domain/appearance-traits.ts` (635줄 curated pool) 을 sole source of truth 로 사용. LLM 으로 persona 를 생성하지 않는다.

이유:
- 풀에는 HAIR/EYE/FACE/SKIN/LIP/OUTFIT/SCENE/ANGLE/CAMERA 카테고리별 수십~수백 개 옵션이 이미 큐레이션됨.
- Seed 기반 random 샘플 조합 → 동일 seed = 동일 persona 보장. `regenerate` 시 seed 만 바꾸면 됨.
- LLM 의 비결정성이 persona 에 들어가면 slot 재생성 시 "다른 사람" 리스크.

### 7.1 입력 (고스트 한 명당)
```ts
{
  profile: { name, age, mbti, university.name, department.name },
  archetype: GhostPersonaArchetype,   // 이번 Phase 1 에 활성화
  vendor: ImageVendor,
  slotCount: 3,
  seed: number,  // persona 결정성 확보
}
```

### 7.2 생성 파이프라인

**Step A — Persona descriptor (deterministic, 0 LLM)**
```ts
const rng = seededRng(seed);
const persona = {
  hair: pickFromPool(HAIR_STYLES, rng),
  hairColor: pickFromPool(HAIR_COLORS, rng),
  eyeShape: pickFromPool(EYE_SHAPES, rng),
  faceShape: pickFromPool(FACE_SHAPES, rng),
  skinTone: pickFromPool(SKIN_TONES, rng),
  lipShape: pickFromPool(LIP_SHAPES, rng),
  noseShape: pickFromPool(NOSE_SHAPES, rng),
  makeup: pickFromPool(MAKEUP_STYLES, rng),
  outfitPreference: pickFromPool(OUTFITS, rng),
  archetypeTraits: archetype.traits,
};
// → 문자열화된 기술자. 이 값은 3 slot 모두에 동일하게 포함.
```

**Step B — Slot 순차 LLM 호출 (문맥 의존)**
```ts
const slotContexts = [
  { scene: pickFromPool(SCENES, rng), angle: pickFromPool(CAMERA_ANGLES, rng) },
  { scene: pickFromPool(SCENES, rng), angle: pickFromPool(CAMERA_ANGLES, rng) },
  { scene: pickFromPool(SCENES, rng), angle: pickFromPool(CAMERA_ANGLES, rng) },
];

const slotPrompts: SlotPrompt[] = [];
for (let i = 0; i < 3; i++) {
  const priorSummaries = slotPrompts.map((s) => s.generationContext.sceneDescriptor);
  const prompt = await llm.buildSlotPrompt({
    persona,               // ← 고정 (문자열)
    sceneDescriptor: slotContexts[i].scene,
    angle: slotContexts[i].angle,
    vendor,
    priorSummaries,         // ← slot i=1,2 에서 이전 slot 장면 문맥 전달
  });
  slotPrompts.push({ slotIndex: i, prompt, negativePrompt: GHOST_NEGATIVE_PROMPT, ... });
}
```

### 7.3 LLM 호출 특성
- **모델**: 기존 `GeminiVertexService` 재사용 (OpenAI 별도 클라이언트 추가 금지)
- **타임아웃**: 슬롯당 10초
- **retry**: 지수 백오프 3회
- **동시성**:
  - 고스트 간 — **concurrency = 3 (기본), 설정 가능 (max 5)**
  - 고스트 내 — slot 간 순차 (문맥 의존)
- **프롬프트 템플릿**: `src/ghost-injection/prompts/` 신규 폴더에 system/user 프롬프트 관리

### 7.4 예상 응답 시간
- 고스트 1명 = 3 slot LLM 호출 (persona 는 0 호출) ≈ 6-9초
- 6명 배치 = concurrency 3 병렬 = ~18-27초
- → SSE 로 progress 스트리밍 **필수**

---

## 8. 진행 상태 피드백 — SSE (필수)

NestJS `@Sse` 데코레이터 네이티브 지원. 구현 간단.

```
GET /admin/ghost-injection/batch-preview/:previewId/stream
  Content-Type: text/event-stream

event: progress
data: { completed: 2, total: 6, currentItemId: "...", stage: "slot-prompt-1|slot-prompt-2|slot-prompt-3" }

event: item-ready
data: { itemId: "...", item: BatchPreviewItem }

event: complete
data: { previewId, elapsedMs }

event: error
data: { itemId?, message, retryable: boolean }
```

Confirm 단계도 동일한 SSE 패턴으로 이미지 생성 진행률 스트리밍.

### FE 경험
- 확인 다이얼로그 헤더: "6명 × 3장 프롬프트 생성 중 (2/6 완료, 예상 20초)"
- 완료된 아이템부터 순차적으로 카드 노출 (점진적 렌더)
- Polling fallback 없음 — SSE 실패 시 에러 배너 표시

---

## 9. 이미지 확정 생성 단계

### 9.1 플로우
```
confirm 요청 수신
  ↓
for itemId of confirmedItemIds (concurrency=3):
  ├─ Ghost user / profile / account 레코드 insert (기존 insertGhostRecords 재활용)
  ├─ slotPrompts 순회 — 각 프롬프트로 generateAndUploadSlot 호출
  ├─ profile_images / images 삽입 (기존 경로 재활용)
  └─ result push
  ↓
Redis preview 삭제
  ↓
ghost_audit_events GHOST_BATCH_CONFIRMED 기록
  ↓
BatchCreateResult 반환
```

### 9.2 기존 `generateAndUploadSlot` 재사용
- 프롬프트는 preview 에서 확정된 텍스트 그대로 주입
- `resolveVariants` 경로는 이 플로우에서 우회 (override prompt)
- seedream 의 pool reference 선택 결과 역시 preview 단계에서 이미 결정됨 — confirm 시 동일 ref 사용

### 9.3 부분 실패 처리
- 이미지 생성 실패한 item → 기존과 동일하게 `status: 'failed'` 반환 (직전 hotfix 적용 후)
- 성공한 item 은 정상 persist
- UI 는 실패 목록 표시 후 "실패 항목 재시도" 버튼 제공 — **preview 가 소모되지 않고 재시도 가능해야 함**
  → Redis key 에 `confirmedItemIds` 플래그로 멱등성 보장

---

## 10. 구현 범위 (Phase 분할)

### Phase 1 — BE Preview API + SSE (2-3일)
- [ ] 신규 엔드포인트 4개: POST batch-preview, PATCH items, POST confirm, GET stream (SSE)
- [ ] `BatchPreviewStore` — Redis 단일 JSON blob + idempotency (confirmedItemIds)
- [ ] `PromptBuilderService` — deterministic persona + seeded slot 프롬프트 순차 생성
- [ ] `GhostProfileGeneratorService#generate` 에 `dryRun` 옵션 추가 (DB insert 보류)
- [ ] 프롬프트 템플릿 (`src/ghost-injection/prompts/`) — system + slot-variation
- [ ] `ghost_persona_archetypes` 활성화 (Phase 1 포함)
- [ ] 감사 이벤트 1종: `GHOST_BATCH_CONFIRMED`
- [ ] 고스트 간 concurrency=3 병렬 실행 + slot 간 순차
- [ ] 테스트 커버리지 (§11 Test Plan 전체)

### Phase 2 — Confirm + 이미지 생성 연결 (1일)
- [ ] 기존 `generateAndSavePhotos` 를 preview prompt override 로 확장
- [ ] 부분 실패 idempotent 재시도 (confirmedItemIds 기반)
- [ ] Confirm SSE 진행률 스트리밍
- [ ] `ghost.batch_confirmed` 이벤트 emit

### Phase 3 — FE 대응 (2-3일)
- [ ] 배치 생성 다이얼로그 2단계 구조 리팩터 (Preview → Confirm)
- [ ] Preview 카드 UI (프롬프트 편집/재샘플/체크박스)
- [ ] SSE EventSource 연결 + 점진 렌더
- [ ] 확정 후 결과 화면 연결 (기존 재사용)

### Phase 4 — 검증 + 롤아웃 (1일)
- [ ] E2E: preview → edit → confirm + 부분 실패 재시도 경로
- [ ] 일관성 평가: Google Sheet 템플릿 + 50건 샘플 스크립트 (LGTM/NOT 태깅)
- [ ] Feature flag `ADMIN_GHOST_PREVIEW_FLOW` (기존 `ghost-feature-flag` 시스템 재사용)
- [ ] 롤백 시 구 경로(`create-batch`) 유지

---

## 11. Test Plan

### E2E + 통합 테스트 커버리지 (Phase 1 필수)

```
CODE PATHS                                                    USER FLOWS
[+] POST /batch-preview                                       [+] 어드민 배치 preview
  ├── [ ] happy path 6명 생성 + meta return                    ├── [ ] [→E2E] 생성→편집→확정 전체 경로
  ├── [ ] count > 50 rejection                                ├── [ ] [→E2E] 일부 선택 confirm (3/6)
  ├── [ ] vendor 미지원 → 400                                 ├── [ ] [→E2E] preview 만료 후 confirm → 404
  ├── [ ] LLM 부분 실패 → 재시도 후 성공                      └── [ ] [→E2E] SSE 연결 중단 → 재연결
  └── [ ] Redis 저장 실패 → 즉시 400                          
[+] PATCH /batch-preview/:id/items/:itemId                    [+] 일관성 검증 (수동)
  ├── [ ] edit — slotPrompts 부분 업데이트                     └── [ ] 50건 샘플 "같은 사람" ≥ 85%
  ├── [ ] regenerate — preserveProfile true/false              
  └── [ ] 존재하지 않는 itemId → 404                          
[+] POST /batch-preview/:id/confirm
  ├── [ ] 전체 confirm — 6/6 성공
  ├── [ ] 부분 confirm — itemIds subset
  ├── [ ] 이미지 생성 일부 실패 — 부분 성공 + failed status
  ├── [ ] idempotent 재시도 — 성공 item 중복 생성 X
  └── [ ] persona_archetypeId FK 저장 검증
[+] PromptBuilderService (unit)
  ├── [REGRESSION] persona descriptor deterministic (seed 동일 → 출력 동일)
  ├── [ ] slot i 프롬프트에 slot <i sceneDescriptor 포함
  └── [ ] LLM timeout 10초 + retry 3회 동작
[+] GET /batch-preview/:id/stream (SSE)
  ├── [ ] progress 이벤트 발사 순서 (item-ready → complete)
  └── [ ] LLM 에러 → error 이벤트 + retryable 플래그
```

테스트 파일 제안:
- `src/ghost-injection/services/prompt-builder.service.spec.ts`
- `src/ghost-injection/services/batch-preview-store.spec.ts`
- `e2e/admin-ghost-preview.spec.ts` (Project-Solo 쪽 Playwright)
- `test/ghost-batch-preview.e2e-spec.ts` (solo-nestjs-api)

## 12. 성능 · 비용 · 리스크

### 비용
| 항목 | 단가 | 1 배치(6명) | 월 100 배치 |
|---|---|---|---|
| LLM 프롬프트 (Gemini 재사용) | ~$0.001/req × 18 | $0.018 | $1.8 |
| 이미지 gpt-image-2 | $0.04/img × 18 | $0.72 | $72 |
| 이미지 seedream | $0.005/img × 18 | $0.09 | $9 |

→ 추가 비용 $1.8/월. 어드민 재생성 호출 30% 감소 시 **순 비용 절감**.

### 응답 시간
- Preview: **18-27초** (concurrency 3 병렬, Gemini 재사용)
- Confirm: 기존 이미지 생성 bulk (~30-60초, concurrency 3)

### 리스크
| 리스크 | 완화 |
|---|---|
| LLM 응답 JSON 파싱 실패 | strict JSON schema + 1회 재시도 |
| Redis 다운 시 preview 소실 | 생성 시점 에러 노출, 저장 실패면 즉시 400 |
| 프롬프트 injection (어드민이 악성 입력) | 어드민 전용 경로. XSS 필터만 적용 |
| 벤더 rate-limit 초과 | concurrency 설정 가능 + 지수 백오프 |
| 기존 `create-batch` 호출 FE 가 많아 breaking | 신규 엔드포인트 별도 path, 기존 유지 |

---

## 13. 감사 · 관찰

### 로깅 (structured)
```
[batch-preview:create] previewId=... actorId=... count=6 vendor=openai elapsedMs=52000
[batch-preview:item-generated] previewId=... itemId=... slotPrompts=3 llmTokens=1234
[batch-preview:confirm] previewId=... confirmedCount=4 failedCount=0 reason="..."
```

### 메트릭 (Grafana 대시보드 항목 제안)
- `ghost_batch_preview_duration_seconds` histogram (count, vendor 라벨)
- `ghost_batch_preview_edits_total` counter (action 라벨: edit/regenerate)
- `ghost_batch_confirm_success_ratio` gauge

### 알람
- LLM 호출 실패율 10% 초과 5분 지속 → Slack 알람
- Preview expire 비율 50% 초과 (어드민이 확정 안 하는 비율 높음) → 제품 이슈 신호

---

## 14. 오픈 질문 (plan-eng-review 반영 후)

1. ~~**외모 도메인 정의**~~ → 해결. `appearance-traits.ts` pool + `ghost_persona_archetypes` 활성화.
2. ~~**SSE vs Polling**~~ → 해결. SSE 필수.
3. **프롬프트 미리보기 공개 범위** — raw prompt 텍스트를 admin 에게 그대로 노출? 혹은 요약 + "고급" 뷰?
4. **확정 단계 트랜잭션** — 이미지 생성 중 실패 시 DB 삽입된 Ghost 를 rollback? 사진 없는 Ghost 로 남김? (현재 구현 = 후자)
5. **Vendor 변경 허용** — Preview=openai, Confirm=seedream 가능? 추천: preview vendor 고정 (confirm 파라미터 제거).
6. **프롬프트 인젝션 방어** — admin 편집 프롬프트에 negative prompt bypass 방어 필요 여부.

---

## 15. 변경 영향 (기존 코드)

| 경로 | 변경 유형 |
|---|---|
| `src/ghost-injection/controllers/ghost-injection-admin.controller.ts` | 3~5 신규 라우트 추가 |
| `src/ghost-injection/services/synthetic-ghost-creation.service.ts` | `createBatch` 옵션 확장 (prompt override) |
| `src/ghost-injection/services/` (신규) | `PromptBuilderService`, `BatchPreviewStore` |
| `src/ghost-injection/dto/admin-query.dto.ts` | `BatchPreviewItem`, `SlotPrompt` 타입 추가 |
| `src/database/schema/ghost-audit-events.ts` | actionType enum 확장 (string 이면 무변경) |
| FE `app/admin/ai-profiles/ghosts/ghost-batch-create-dialog.tsx` | 2단계 구조 리팩터 |
| FE `app/services/admin/ghost-injection.ts` | 신규 서비스 함수 4~5 |
| FE `app/types/ghost-injection.ts` | preview 관련 타입 추가 |

---

## 16. 승인 체크리스트

- [ ] 프로덕트: 플로우/UX 합의
- [ ] 백엔드: Redis 저장 방식 + 프롬프트 템플릿 형식 합의
- [ ] FE: 2단계 다이얼로그 + SSE/polling 선택
- [ ] 데이터: archetype 재활용 범위 확정
- [ ] 인프라: feature flag 환경 변수 + Grafana 대시보드 추가

---

## 17. 참고

- 기존 엔드포인트: `POST /admin/ghost-injection/create-batch`
- 기존 서비스: `SyntheticGhostCreationService#createBatch` (`src/ghost-injection/services/synthetic-ghost-creation.service.ts:132`)
- 벤더 레지스트리: `src/ai-profile/services/image-vendor.registry.ts`
- 기존 audit 패턴: `src/ghost-injection/listeners/audit-event.listener.ts`

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR | 13 issues, 3 key decisions approved, scope reduced |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

**RESOLVED DECISIONS (plan-eng-review)**:
- Persona descriptor → **deterministic (appearance-traits pool + seed)** — LLM persona 제거
- 고스트 간 동시성 → **병렬 3 + SSE 필수**
- persona_archetypes → **Phase 1 에 활성화**

**KEY SCOPE REDUCTIONS**:
- 감사 이벤트 3종 → 1종 (`GHOST_BATCH_CONFIRMED` 만)
- LLM 호출 고스트당 4→3 (persona 생성 제거)
- 예상 응답 시간 48-72초 → 18-27초
- Polling fallback 제거

**UNRESOLVED (non-blocking)**:
- Raw prompt 전체 표시 vs 요약
- Ghost rollback 정책 (이미지 생성 중 실패)
- Vendor 변경 허용 (preview vs confirm)
- 프롬프트 인젝션 방어

**VERDICT**: ENG CLEARED — ready for /autoplan or direct implementation
