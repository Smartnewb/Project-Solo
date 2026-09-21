# [Backend PRD] Ghost Injection Admin API 재정비

> **상태: ✅ RESOLVED (2026-04-11)**
>
> 본 PRD 작성 시점에 이미 `solo-nestjs-api` `feat/ghost-injection-mvp` 브랜치에서
> 요구사항 전부 구현 완료 확인 (uncommitted working tree 상태). 아래 원안은 참고용으로만 유지.
>
> - ✅ `/admin/ghost-injection/*` base path 이전 완료
> - ✅ `GhostInjectionAdminController` rename 완료
> - ✅ G1~G7 GET 엔드포인트 7개 전부 구현
> - ✅ `GhostInjectionAdminQueryService` 구현
> - ✅ `dto/admin-query.dto.ts` 정의 완료
> - ⚠️ 커밋/머지 대기 — FE Phase 0는 BE 커밋 직후 착수 가능

**작성일**: 2026-04-11
**요청자**: Admin FE 팀
**대상 레포**: `solo-nestjs-api`
**관련 모듈**: `src/ghost-injection/`, `src/ai-profile/`
**우선순위**: P0 (Admin UI 구현 블로커)
**예상 공수**: 2-3일

---

## 1. 배경

Project-Solo 어드민에 **AI Ghost Profile Injection 운영 콘솔**을 구현하려는데, FE에서 백엔드 코드 점검 중 두 가지 이슈를 발견했습니다.

### 1-1. Base path 충돌

두 컨트롤러가 동일한 `@Controller('admin/ai-profiles')` prefix를 사용 중:

| 컨트롤러 | 파일 | 도메인 | 테이블 |
|---|---|---|---|
| `AdminAiProfileController` | `src/ai-profile/controllers/admin-ai-profile.controller.ts` | AI 생성 프로필 + 이미지 잡 파이프라인 | `ai_profiles` |
| `AiProfileController` | `src/ghost-injection/controllers/ai-profile.controller.ts` | Ghost Injection (17 mutation) | `ghost_accounts`, `ghost_like_candidates`, `ghost_persona_archetypes`, … |

현재는 HTTP verb + path suffix 차이로 간신히 충돌 회피 중이지만, 같은 도메인처럼 보이는 두 시스템이 같은 prefix를 공유하고 있어 **혼동·회귀 위험**이 상시 존재합니다. 특히:

- `GET /admin/ai-profiles` → 구 `ai_profiles` 테이블 목록 반환 (Ghost 아님)
- `GET /admin/ai-profiles/:id` → 구 `ai_profiles` 상세
- `PUT /admin/ai-profiles/:id` → 구 시스템 업데이트
- `DELETE /admin/ai-profiles/:id` → 구 시스템 삭제

→ FE에서 "Ghost 목록 줘" 하려고 `GET /admin/ai-profiles`를 호출하면 **엉뚱한 테이블** 데이터를 받게 됩니다.

### 1-2. GET 엔드포인트 부재

`AiProfileController` (ghost-injection)는 **17개 mutation만** 존재하고 조회용 GET이 **0개**. 어드민 UI는 목록/상세/상태 조회가 필수인데 쿼리 경로가 없어 FE 구현이 블록됩니다.

---

## 2. 문제 정의

> Ghost Injection 시스템의 어드민 API는 **라우팅 prefix가 다른 도메인과 섞여 있고**, **읽기 경로가 전무**하여 어드민 UI를 만들 수 없다.

---

## 3. 목표 / 비목표

### 목표
1. Ghost Injection 어드민 API를 독립된 base path로 분리하여 도메인 경계 명확화
2. Ghost Injection 어드민 UI에 필요한 7개 GET 엔드포인트 신규 추가
3. 기존 17개 mutation의 기능·DTO·감사 로그 동작은 **완전히 동일하게 유지**
4. 구 `AdminAiProfileController`와 신 `AiProfileController`가 서로 간섭하지 않도록 분리

### 비목표
- `AdminAiProfileController`(구 시스템) 리팩터·폐기
- Ghost Injection 비즈니스 로직 변경
- 신규 Command 추가 (B3 세그먼트 Cap 등)
- 감사 로그 스키마 변경

---

## 4. 제안

### 4-1. Ghost Injection 컨트롤러 base path 이전

**변경 전**:
```typescript
@Controller('admin/ai-profiles')
export class AiProfileController { /* 17 mutations */ }
```

**변경 후**:
```typescript
@Controller('admin/ghost-injection')
export class GhostInjectionAdminController { /* 17 mutations + 7 GETs */ }
```

- 클래스명도 `GhostInjectionAdminController`로 rename (의미 명확화)
- 파일 경로: `src/ghost-injection/controllers/ghost-injection-admin.controller.ts`
- 모듈 등록(`ghost-injection.module.ts`) 수정
- Swagger `@ApiTags('Admin - Ghost Injection')` 갱신
- 17개 라우트는 path suffix를 **그대로 유지**하여 핸들러 로직 변경 불필요:
  - `POST /admin/ghost-injection/create`
  - `PATCH /admin/ghost-injection/:ghostAccountId`
  - `PUT /admin/ghost-injection/:ghostAccountId/photo/:slotIndex`
  - …(나머지 동일)

### 4-2. 신규 GET 엔드포인트 7개

모두 `@UseGuards(JwtAuthGuard)` + `@Roles(Role.ADMIN)` 필수. Public 스키마에서 호출 금지(기존 create와 동일 정책).

응답은 기존 프로젝트 공용 `PaginatedResponse<T>` 규격을 따릅니다.

#### G1. Ghost 계정 목록
```
GET /admin/ghost-injection/ghosts
```
**Query**:
| 파라미터 | 타입 | 기본 | 설명 |
|---|---|---|---|
| `status` | `'ACTIVE' \| 'INACTIVE'` | (없음=전체) | Ghost 활성 상태 필터 |
| `schoolId` | `string` | — | 특정 Phase-School 소속 Ghost만 |
| `archetypeId` | `string` | — | 특정 아키타입으로 생성된 Ghost만 |
| `q` | `string` | — | 이름·자기소개 부분 일치 검색 |
| `page` | `number` | 1 | — |
| `limit` | `number` | 20 | 최대 100 |
| `sort` | `'createdAt'\|'updatedAt'` | `createdAt` | — |
| `order` | `'asc'\|'desc'` | `desc` | — |

**Response**: `PaginatedResponse<GhostListItem>`
```ts
interface GhostListItem {
  ghostAccountId: string;
  ghostUserId: string;
  name: string;
  age: number;
  mbti: string;
  gender: 'FEMALE';
  status: 'ACTIVE' | 'INACTIVE';
  archetype: { id: string; name: string };
  phaseSchools: { id: string; name: string }[];
  primaryPhotoUrl: string | null;
  photoCount: number;
  createdAt: string;   // ISO 8601
  updatedAt: string;
}
```

#### G2. Ghost 계정 상세
```
GET /admin/ghost-injection/ghosts/:ghostAccountId
```
**Response**:
```ts
interface GhostDetail extends GhostListItem {
  introduction: string | null;
  photos: { slotIndex: number; imageId: string; url: string }[];
  exposureStats: {
    totalShown: number;
    totalAccepted: number;
    totalReported: number;
    lastShownAt: string | null;
  };
  recentAuditEvents: GhostAuditEvent[];   // 최근 10건
}

interface GhostAuditEvent {
  id: string;
  actionName: string;   // 'A2_UPDATE_GHOST_PROFILE' 등
  actor: string;        // adminUserId
  reason: string;
  createdAt: string;
  payload?: Record<string, unknown>;
}
```

#### G3. Ghost 후보 목록
```
GET /admin/ghost-injection/candidates
```
**Query**:
| 파라미터 | 타입 | 설명 |
|---|---|---|
| `status` | `'PENDING' \| 'QUEUED' \| 'CANCELED' \| 'SENT'` | 후보 상태 |
| `weekYear` | `string` (ISO 주차) | 특정 주차만 조회 |
| `page/limit/sort/order` | — | G1과 동일 규칙 |

**Response**: `PaginatedResponse<CandidateListItem>`
```ts
interface CandidateListItem {
  candidateId: string;
  status: 'PENDING' | 'QUEUED' | 'CANCELED' | 'SENT';
  weekYear: string;
  targetUser: { id: string; name: string; schoolName: string };
  ghost: { id: string; name: string; primaryPhotoUrl: string | null };
  createdAt: string;
  scheduledAt: string | null;
  sentAt: string | null;
}
```

#### G4. Phase-School 버킷 목록
```
GET /admin/ghost-injection/phase-schools
```
**Query**:
| 파라미터 | 타입 | 설명 |
|---|---|---|
| `bucket` | `'TREATMENT' \| 'CONTROL'` | — |
| `phase` | `number` | — |
| `q` | `string` | 학교명 부분 일치 |

**Response**: (비페이지네이션, 전체 반환 — 통상 수십~수백건)
```ts
interface PhaseSchool {
  schoolId: string;
  schoolName: string;
  bucket: 'TREATMENT' | 'CONTROL';
  phase: number;
  assignedGhostCount: number;   // 해당 학교에 배정된 활성 Ghost 수
  updatedAt: string;
}

type PhaseSchoolsResponse = { items: PhaseSchool[] };
```

#### G5. 학교 블랙리스트 목록
```
GET /admin/ghost-injection/blacklist
```
**Response**:
```ts
interface BlacklistEntry {
  schoolId: string;
  schoolName: string;
  reason: string;
  addedBy: string;   // adminUserId
  addedAt: string;
}

type BlacklistResponse = { items: BlacklistEntry[] };
```

#### G6. 아키타입 목록
```
GET /admin/ghost-injection/archetypes
```
**Response**:
```ts
interface ArchetypeListItem {
  archetypeId: string;
  name: string;
  description: string;
  traits: {
    ageRange: { min: number; max: number };
    mbtiPool: string[];
    keywordPool: string[];
  };
  activeGhostCount: number;
  createdAt: string;
  updatedAt: string;
}

type ArchetypesResponse = { items: ArchetypeListItem[] };
```

#### G7. Ghost Injection 상태 요약 (대시보드용)
```
GET /admin/ghost-injection/status
```
**목적**: AI Profiles 페이지 상단 StatusBar 폴링 (5초 간격). 가볍게 유지.

**Response**:
```ts
interface GhostInjectionStatus {
  featureFlag: {
    value: boolean;
    updatedAt: string;
    updatedBy: string;
  };
  ltvCap: {
    value: number;           // 0.05~0.50
    effectiveAt: string | null;
  };
  cooldown: {
    cooldownCount: number;
  };
  currentMetrics: {
    activeGhostCount: number;
    currentInjectionRate: number;   // 0~1, 실제 침투율
    thisWeekCandidatesGenerated: number;
    thisWeekCandidatesApproved: number;
    thisWeekCandidatesSent: number;
  };
}
```

**성능 요구**: p95 < 100ms. 필요 시 Redis 캐싱 60초 TTL.

### 4-3. 감사 로그 조회 (Optional — nice-to-have)

```
GET /admin/ghost-injection/audit
```
FE의 Audit Trail Drawer용. Phase 3에 추가해도 무방.

**Query**:
| 파라미터 | 타입 | 설명 |
|---|---|---|
| `resourceType` | `'GHOST' \| 'CANDIDATE' \| 'POLICY' \| 'SCHOOL' \| 'ARCHETYPE'` | — |
| `resourceId` | `string` | — |
| `actionName` | `string` | 부분 일치 |
| `fromDate/toDate` | `ISO date` | — |
| `page/limit` | — | — |

**Response**: `PaginatedResponse<GhostAuditEvent>`

---

## 5. 구현 체크리스트

### 5-1. 컨트롤러 이전
- [ ] `src/ghost-injection/controllers/ai-profile.controller.ts` → `ghost-injection-admin.controller.ts`로 rename
- [ ] 클래스명 `AiProfileController` → `GhostInjectionAdminController`
- [ ] `@Controller('admin/ghost-injection')`으로 변경
- [ ] `@ApiTags('Admin - Ghost Injection')` 갱신
- [ ] `src/ghost-injection/ghost-injection.module.ts` providers/controllers 갱신
- [ ] 17개 기존 라우트 동작 검증 (e2e 또는 수동)

### 5-2. 신규 GET 엔드포인트 구현
각각 Query handler + DTO + response schema:
- [ ] G1. `GET /admin/ghost-injection/ghosts`
- [ ] G2. `GET /admin/ghost-injection/ghosts/:ghostAccountId`
- [ ] G3. `GET /admin/ghost-injection/candidates`
- [ ] G4. `GET /admin/ghost-injection/phase-schools`
- [ ] G5. `GET /admin/ghost-injection/blacklist`
- [ ] G6. `GET /admin/ghost-injection/archetypes`
- [ ] G7. `GET /admin/ghost-injection/status`
- [ ] (선택) G8. `GET /admin/ghost-injection/audit`

### 5-3. 보안·감사
- [ ] 모든 신규 GET에 `JwtAuthGuard + @Roles(Role.ADMIN)`
- [ ] `public` 스키마에서 호출 차단 (기존 create와 동일)
- [ ] Read-only라 감사 로그 기록 불필요 (확인)

### 5-4. 검증
- [ ] Swagger 문서 정상 노출 (`/api/docs` 확인)
- [ ] 기존 `AdminAiProfileController` 경로는 모두 그대로 동작하는지 회귀 확인
- [ ] `GET /admin/ghost-injection/status` p95 < 100ms (K6 또는 autocannon)
- [ ] e2e 테스트 추가 (최소 happy path 각 엔드포인트 1개씩)

---

## 6. 마이그레이션 / 배포

- **Breaking change**: 기존 17개 경로(`/admin/ai-profiles/*`)는 **아직 프로덕션 어드민 UI에서 사용되지 않고 있음** (FE 아직 미구현). 따라서 구 경로 하위 호환 유지 불필요.
- 만약 스테이징/QA 도구에서 이미 호출 중이라면 구 경로를 **1 릴리즈만** alias로 유지하고 deprecation 로그 출력 후 제거.
- FE와 **동일 릴리즈 사이클**로 배포 권장 (FE PR과 BE PR을 같은 날 머지).

---

## 7. 수용 기준 (Acceptance Criteria)

1. `curl -H "Authorization: Bearer <admin>" /admin/ghost-injection/status` 호출 시 위 스키마대로 응답
2. `AdminAiProfileController` (`/admin/ai-profiles/*`)는 모든 기존 경로가 변경 없이 동작
3. Ghost Injection 17개 mutation은 경로만 변경, 요청·응답·감사 로그 동작 완전 동일
4. Swagger UI에서 `Admin - Ghost Injection` 태그 하위에 24개 엔드포인트(17 mutation + 7 GET) 노출
5. 존재하지 않는 `ghostAccountId`로 G2 호출 시 404
6. `Role.USER` 토큰으로 G1~G7 호출 시 403

---

## 8. 일정 제안

| Day | 작업 |
|---|---|
| D1 | 컨트롤러 이전 + 모듈 갱신 + 기존 17 mutation 회귀 확인 |
| D2 | G1~G7 구현 (Query/DTO/Service) |
| D3 | G2 상세 + e2e 테스트 + 성능 점검 + 스테이징 배포 |

FE는 D3 이후 Phase 0 착수 가능.

---

## 9. 질문 / 결정 필요 사항 (FE → BE)

1. **구 `AdminAiProfileController` 현재 사용처** — 여전히 운영 중인 AI 프로필 이미지 생성 시스템이 맞는지? 맞다면 유지, 아니면 별도 PRD로 정리 가능.
2. **감사 로그 조회 엔드포인트 (G8)** — 본 PRD에 포함할지, Phase 3로 미룰지?
3. **`GET /status` 캐싱 전략** — Redis 60초 TTL 허용 가능? 아니면 실시간 DB 조회?
4. **`ghost_like_sent_history` 노출 여부** — 후보가 `SENT` 상태로 넘어가면 G3에서 해당 이력도 보여주는 게 맞는지?

---

## 10. 참고 파일

- 17 mutation 원본: `src/ghost-injection/controllers/ai-profile.controller.ts`
- 구 컨트롤러 (충돌 대상): `src/ai-profile/controllers/admin-ai-profile.controller.ts`
- 관련 스키마:
  - `src/database/schema/ghost-accounts.ts`
  - `src/database/schema/ghost-like-candidates.ts`
  - `src/database/schema/ghost-persona-archetypes.ts`
  - `src/database/schema/ghost-phase-schools.ts`
  - `src/database/schema/ghost-school-blacklist.ts`
  - `src/database/schema/ghost-exposure-limits.ts`
  - `src/database/schema/ghost-audit-events.ts`
- FE 스펙: `Project-Solo/requirements/ai-ghost-admin-ui-spec.md`
- FE 구현 계획: `Project-Solo/requirements/ai-ghost-admin-implementation-plan.md`
