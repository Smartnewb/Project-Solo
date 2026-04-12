# AI Ghost Profile Injection 어드민 — 구현 계획

**작성일**: 2026-04-11 (1차) / 2026-04-11 (BE 실구현 확인 후 2차 갱신)
**대상**: Project-Solo (Next.js 14 어드민)
**기반 스펙**: `requirements/ai-ghost-admin-ui-spec.md`
**연동 API**: solo-nestjs-api `/admin/ghost-injection/*` **24개** 엔드포인트 (17 mutation + 7 GET)
**백엔드 상태**: `feat/ghost-injection-mvp` 브랜치에 구현 완료 (uncommitted)

---

## 0. 최종 확정 사항 (2026-04-11 사용자 승인)

| # | 항목 | 결정 |
|---|---|---|
| 1 | 기존 `/admin/ghost-accounts` (탈퇴 여성 복제) | **Deprecate 및 삭제**. 관련 파일/타입/서비스/사이드바 엔트리 전부 제거 |
| 2 | 디자인 시스템 | **Shadcn/ui + Tailwind 유지** (`package.json` 확인: `shadcn-ui`, `@radix-ui/*`, `class-variance-authority`, `lucide-react`, `tailwind-merge` 모두 설치됨). 필요한 컴포넌트는 `npx shadcn add`로 점진 생성 |
| 3 | 사이드바 collapsible 서브메뉴 | **기능 신규 구현**. `shared/ui/admin/sidebar.tsx`에 접기/펼치기 지원 추가 |

### 0-1. 삭제 대상 파일 (Phase 0에서 제거)

```
app/admin/ghost-accounts/                        # 페이지 + components 전체
app/admin/hooks/use-ghost-account.ts
app/services/admin/ghost-account.ts
app/types/ghost-account.ts
```

수정 대상:
- `app/admin/hooks/index.ts` — `./use-ghost-account` export 제거
- `app/services/admin/index.ts` — `ghostAccount` export 제거 (2곳, 라인 35 + 117)
- `shared/ui/admin/sidebar.tsx` — 라인 89 `{ href: '/admin/ghost-accounts' ... }` 제거

---

## 1. 아키텍처 요약

```
Browser (/admin/ai-profiles/*)           ← FE 라우팅은 ai-profiles 유지 (기존 UX 용어)
  → Next.js App Router
  → app/services/admin/ghost-injection.ts (신규 서비스 모듈)
  → adminFetch → /api/admin-proxy/[...path] (기존 BFF)
  → sometimes-api /admin/ghost-injection/* (BE base path 이전 완료)
```

**네이밍 규칙**:
- FE 라우트: `/admin/ai-profiles/*` (운영팀이 읽기 쉬운 용어)
- BE API path: `/admin/ghost-injection/*` (BE 도메인 경계)
- 서비스 모듈명: `ghost-injection.ts` (BE와 일치)

**신규 파일 트리**:
```
app/
├── admin/
│   └── ai-profiles/
│       ├── layout.tsx                  # StatusBar 래퍼 (Flag/침투율/활성수)
│       ├── ghosts/
│       │   ├── page.tsx
│       │   └── components/
│       │       ├── ghost-table-view.tsx
│       │       ├── ghost-card-view.tsx
│       │       ├── ghost-create-dialog.tsx
│       │       └── ghost-detail-drawer.tsx
│       ├── candidates/
│       │   ├── page.tsx
│       │   └── components/
│       │       ├── candidate-list.tsx
│       │       ├── generate-weekly-dialog.tsx  # dryRun 2-step
│       │       └── candidate-bulk-actions.tsx
│       ├── policy/
│       │   ├── page.tsx
│       │   └── components/
│       │       ├── feature-flag-card.tsx
│       │       ├── ltv-cap-card.tsx
│       │       └── cooldown-card.tsx
│       ├── schools/
│       │   ├── page.tsx
│       │   └── components/
│       │       ├── blacklist-table.tsx
│       │       └── phase-schools-table.tsx
│       ├── archetypes/
│       │   ├── page.tsx
│       │   └── components/
│       │       └── archetype-form-dialog.tsx
│       ├── rollback/
│       │   ├── page.tsx
│       │   └── components/
│       │       └── rollback-gate.tsx       # reason+타이핑+카운트다운 3중
│       └── _shared/
│           ├── reason-input.tsx            # 모든 mutation에 embed
│           ├── status-bar.tsx
│           └── audit-trail-drawer.tsx
│
├── services/admin/
│   └── ai-profiles.ts                  # 17개 API 래퍼 (신규)
│
└── types/
    └── ai-profile.ts                   # DTO 타입 (신규)
```

---

## 2. 서비스 레이어 (`app/services/admin/ghost-injection.ts`)

기존 `_shared.ts` 패턴(`adminGet/Post/Patch/Put/Delete`) 사용. BE DTO(`dto/admin-query.dto.ts`)와 1:1 매칭.

```typescript
import type {
  GhostListItem, GhostDetail, CandidateListItem, PhaseSchoolItem,
  BlacklistEntryItem, ArchetypeListItem, GhostInjectionStatus,
  GhostListQuery, CandidateListQuery, PhaseSchoolListQuery,
} from '@/types/ghost-injection';
import type { PaginatedResponse } from '@/types/common';

const BASE = '/admin/ghost-injection';

export const ghostInjection = {
  // ── 조회 (G1~G7) ──────────────────────────────────
  listGhosts: (q: GhostListQuery) =>
    adminGet<PaginatedResponse<GhostListItem>>(`${BASE}/ghosts`, toQueryString(q)),

  getGhost: (ghostAccountId: string) =>
    adminGet<GhostDetail>(`${BASE}/ghosts/${ghostAccountId}`),

  listCandidates: (q: CandidateListQuery) =>
    adminGet<PaginatedResponse<CandidateListItem>>(`${BASE}/candidates`, toQueryString(q)),

  listPhaseSchools: (q: PhaseSchoolListQuery) =>
    adminGet<{ items: PhaseSchoolItem[] }>(`${BASE}/phase-schools`, toQueryString(q)),

  listBlacklist: () =>
    adminGet<{ items: BlacklistEntryItem[] }>(`${BASE}/blacklist`),

  listArchetypes: () =>
    adminGet<{ items: ArchetypeListItem[] }>(`${BASE}/archetypes`),

  getStatus: () =>
    adminGet<GhostInjectionStatus>(`${BASE}/status`),

  // ── Ghost 관리 (A1~A5) ────────────────────────────
  createGhost: (body: {
    personaArchetypeId: string;
    phaseSchoolIds: string[];
    universityId: string;
    departmentId: string;
    reason: string;
  }) => adminPost(`${BASE}/create`, body),

  updateGhost: (ghostAccountId: string, body: {
    fieldsToUpdate: { name?: string; age?: number; mbti?: string; introduction?: string };
    reason: string;
  }) => adminPatch(`${BASE}/${ghostAccountId}`, body),

  replaceGhostPhoto: (ghostAccountId: string, slotIndex: number, body: {
    newImageId: string; reason: string;
  }) => adminPut(`${BASE}/${ghostAccountId}/photo/${slotIndex}`, body),

  toggleGhostStatus: (ghostAccountId: string, body: {
    targetStatus: 'ACTIVE' | 'INACTIVE'; reason: string;
  }) => adminPatch(`${BASE}/${ghostAccountId}/status`, body),

  bulkInactivateSchool: (schoolId: string, body: { reason: string }) =>
    adminPost(`${BASE}/bulk-inactivate/school/${schoolId}`, body),

  // ── 정책 (B1~B2, C2) ──────────────────────────────
  setLtvCap: (body: { newCap: number; reason: string; effectiveAt?: string }) =>
    adminPut(`${BASE}/ltv-cap`, body),

  setCooldown: (body: { cooldownCount: number; reason: string }) =>
    adminPut(`${BASE}/cooldown-policy`, body),

  setFeatureFlag: (body: { value: boolean; reason: string }) =>
    adminPut(`${BASE}/feature-flag`, body),

  // ── 롤백 (C1) ─────────────────────────────────────
  rollback: (body: { reason: string }) =>
    adminPost(`${BASE}/rollback`, body),

  // ── 후보 (D1~D3) ──────────────────────────────────
  generateWeekly: (body: { weekYear: string; dryRun?: boolean; reason: string }) =>
    adminPost<{ count: number; dryRun: boolean }>(`${BASE}/candidates/generate-weekly`, body),

  approveCandidates: (body: { candidateIds: string[]; reason: string }) =>
    adminPost(`${BASE}/candidates/approve`, body),

  cancelCandidates: (body: { candidateIds: string[]; reason: string }) =>
    adminPost(`${BASE}/candidates/cancel`, body),

  // ── 학교 (E1, E2, E4) ─────────────────────────────
  addBlacklist: (body: { schoolId: string; schoolName: string; reason: string }) =>
    adminPost(`${BASE}/blacklist`, body),

  removeBlacklist: (schoolId: string, body: { reason: string }) =>
    adminDelete(`${BASE}/blacklist/${schoolId}`, body),

  setPhaseSchool: (schoolId: string, body: {
    schoolName: string; bucket: 'TREATMENT' | 'CONTROL'; phase: number; reason: string;
  }) => adminPut(`${BASE}/phase-schools/${schoolId}`, body),

  // ── 아키타입 (E3) ─────────────────────────────────
  createArchetype: (body: { archetypeFields: ArchetypeFields; reason: string }) =>
    adminPost(`${BASE}/archetypes`, body),

  updateArchetype: (archetypeId: string, body: { archetypeFields: ArchetypeFields; reason: string }) =>
    adminPut(`${BASE}/archetypes/${archetypeId}`, body),
};
```

**타입은 BE DTO 파일 복사**: `solo-nestjs-api/src/ghost-injection/dto/admin-query.dto.ts`의 interface들을 `app/types/ghost-injection.ts`에 그대로 복제 (GhostListItem, GhostDetail, CandidateListItem, PhaseSchoolItem, BlacklistEntryItem, ArchetypeListItem, GhostInjectionStatus 등).

**감사 로그 조회(G8)는 BE 미구현** — Phase 3에서 BE 추가 요청 예정.

---

## 3. React Query 키 컨벤션

```typescript
export const aiProfilesKeys = {
  all: ['ai-profiles'] as const,
  status: () => [...aiProfilesKeys.all, 'status'] as const,
  ghosts: (params: GhostListParams) => [...aiProfilesKeys.all, 'ghosts', params] as const,
  ghostDetail: (id: string) => [...aiProfilesKeys.all, 'ghost', id] as const,
  candidates: (params: CandidateListParams) => [...aiProfilesKeys.all, 'candidates', params] as const,
  archetypes: () => [...aiProfilesKeys.all, 'archetypes'] as const,
  phaseSchools: () => [...aiProfilesKeys.all, 'phase-schools'] as const,
  blacklist: () => [...aiProfilesKeys.all, 'blacklist'] as const,
  audit: (params: AuditLogParams) => [...aiProfilesKeys.all, 'audit', params] as const,
};
```

Mutation 성공 시 무효화:
- Ghost 생성/수정/상태 → `['ai-profiles', 'ghosts', ...]` + `status`
- 후보 승인/취소 → `['ai-profiles', 'candidates', ...]`
- Flag/Cap/Cooldown → `status`
- 롤백 → `all` 전체 무효화

---

## 4. 공통 컴포넌트 상세

### 4-1. `<ReasonInput />`
```tsx
interface ReasonInputProps {
  value: string;
  onChange: (v: string) => void;
  minLength?: number; // default 10
  placeholder?: string;
}
```
- `value.length < minLength`일 때 submit 버튼 disabled
- 실시간 글자 수 표시 (`{value.length}/{minLength}+`)
- 서버 400 응답 시 하단 에러 메시지 표시

### 4-2. `<StatusBar />` (layout.tsx에서 사용)
- React Query 5초 폴링 `aiProfilesKeys.status()`
- 4개 지표 가로 배치:
  - Feature Flag 배지 (ON=green / OFF=grey)
  - LTV 침투율 (% / % cap) — 80% 이상 주황, 초과 빨강
  - 활성 Ghost 수
  - 이번 주 승인 후보 수
- 배경 `bg-slate-50` 1행 sticky top

### 4-3. `<RollbackGate />`
상태 머신:
```
INPUT_REASON → TYPING_CONFIRM → COUNTDOWN(10s) → EXECUTING → DONE/ERROR
```
- Stage1: `reason.length >= 100` 이어야 다음
- Stage2: 사용자가 정확히 `ROLLBACK` 입력해야 버튼 활성
- Stage3: 10초 카운트다운, 중단 가능
- Stage4: API 호출 → 결과 토스트 + Flag OFF 확인 폴링
- 페이지 전체를 빨간 경계 카드로 감쌈

### 4-4. `<GhostViewToggle />`
- localStorage `ai-profiles.ghostView` = `'table' | 'card'`
- URL query `?view=table|card` 동기화 (공유 가능 링크)
- 필터/정렬/페이지 상태는 URL query로 보존

### 4-5. `<AuditTrailDrawer />`
- 각 페이지 우상단 버튼
- `aiProfilesKeys.audit` 조회 → 우측 슬라이드 drawer
- 리소스 ID 필터 지원

---

## 5. 페이지별 구현 세부

### 5-1. `/admin/ai-profiles/ghosts` (Ghost 관리)

- 상단: `[Table | Card]` 토글 + `+ Ghost 생성` 버튼
- 필터: 상태(Active/Inactive), 학교, 아키타입, 생성일
- 테이블 뷰: `@mui/x-data-grid` — 컬럼: photo / name / age / mbti / school / archetype / status / createdAt / actions
- 카드 뷰: 기존 `app/admin/ghost-accounts/components/PoolTab`의 카드 패턴 참고
- 행/카드 클릭 → 우측 `<GhostDetailDrawer />` (A2/A3 편집 폼)
- 벌크 액션: 학교 필터 활성 시 `학교 전체 비활성화(A5)` 버튼 노출

### 5-2. `/admin/ai-profiles/candidates` (후보 관리)

- 상단: `+ 주간 후보 생성` 버튼 → `<GenerateWeeklyDialog />` 2-step
  - Step1: weekYear + reason → dryRun=true 호출 → "예상 142건" 표시
  - Step2: "확인" 누르면 dryRun=false 호출
- 상태 탭: `PENDING | QUEUED | CANCELED` (MUI Tabs)
- 체크박스 다중 선택 → 하단 sticky bar: `[선택 승인]` `[선택 취소]` (+ reason 모달)

### 5-3. `/admin/ai-profiles/policy` (정책 설정)

3개 카드 수직 배치:
- **Feature Flag 카드**: 현재 상태 + 토글 + reason 입력. ON 전환 시 확인 모달
- **LTV Cap 카드**: 슬라이더(5~50%) + 현재 침투율 실시간 비교 + 경고 색상 + reason
- **Cooldown 카드**: 숫자 입력 + 현재 값 + reason

### 5-4. `/admin/ai-profiles/schools` (학교 관리)

2개 탭:
- **블랙리스트 탭**: 테이블 + `+ 추가` 다이얼로그(학교 검색)
- **Phase-School 탭**: 테이블 — 학교 이름, bucket(TREATMENT/CONTROL), phase, 배정 Ghost 수. 행 클릭 편집

### 5-5. `/admin/ai-profiles/archetypes` (아키타입)

- 테이블: 이름 / 설명 / ageRange / MBTI pool / keyword pool / 사용 중 Ghost 수 / actions
- `+ 생성` / 행 편집 → `<ArchetypeFormDialog />` (E3-C/E3-U)
- 폼 필드: name / description / ageRange min-max / mbtiPool (체크박스 16개) / keywordPool (tag input) / reason

### 5-6. `/admin/ai-profiles/rollback` (비상 롤백)

- 페이지 전체 빨간 경계
- 경고 문구 + 현재 활성 Ghost 수 표시
- `<RollbackGate />` 3중 게이트

---

## 6. Phase 분할 + 작업 순서

### Phase 0 — 사전 작업 + 정리 (Day 1-2)

| # | 작업 | 담당 | 산출물 |
|---|---|---|---|
| 0.1 | **BE 브랜치 머지 대기** (`feat/ghost-injection-mvp` uncommitted → commit → merge) | BE | BE PR 머지 |
| 0.2 | **기존 `ghost-accounts` 삭제** (섹션 0-1 파일 리스트) | FE | 커밋: "chore: remove deprecated ghost-accounts (탈퇴 여성 복제)" |
| 0.3 | **사이드바 collapsible 서브메뉴 기능** 구현 | FE | `sidebar.tsx` — `items[]` 내부에 `children[]` 허용 |
| 0.4 | 사이드바에 `AI Profiles` 확장 그룹 + 서브 6항목 추가 | FE | sidebar.tsx |
| 0.5 | DTO 타입 정의 `app/types/ghost-injection.ts` (BE dto 복제) | FE | 타입 파일 |
| 0.6 | 서비스 모듈 `app/services/admin/ghost-injection.ts` | FE | 모듈 파일 |
| 0.7 | Shadcn 컴포넌트 추가 (`npx shadcn add button dialog sheet tabs input textarea badge card alert table collapsible`) | FE | `components/ui/*.tsx` |
| 0.8 | `/admin/ai-profiles/layout.tsx` + StatusBar 컴포넌트 | FE | layout + 컴포넌트 |
| 0.9 | 공통 `<ReasonInput />` (shadcn Textarea 기반) | FE | 컴포넌트 |
| 0.10 | 빈 `page.tsx` 6개 (각 섹션 placeholder) | FE | 라우팅 점검 |
| 0.11 | `pnpm build` + `pnpm quality:admin-v2` 통과 확인 | FE | 녹색 |

**Phase 0 완료 조건**: 사이드바에서 6개 서브메뉴 클릭 시 placeholder 페이지 라우팅 + StatusBar에 Feature Flag OFF 표시 + BE `/admin/ghost-injection/status` 호출 성공.

**사이드바 collapsible 사양**:
```typescript
// 기존 타입 확장
type SidebarItem =
  | { href: string; label: string }
  | { label: string; children: { href: string; label: string }[]; defaultOpen?: boolean };
```
- 서브메뉴 토글 상태는 `localStorage` 저장
- 현재 라우트가 자식에 포함되면 자동 펼침
- shadcn `@radix-ui/react-collapsible` 사용 권장 (`npx shadcn add collapsible`)

### Phase 1 — 선행 데이터 관리 (Day 2-3)

| # | 작업 | 연동 API |
|---|---|---|
| 1.1 | 아키타입 페이지 목록/생성/수정 | listArchetypes, createArchetype, updateArchetype |
| 1.2 | 학교 관리 페이지 (블랙리스트 탭) | listBlacklist, addBlacklist, removeBlacklist |
| 1.3 | 학교 관리 페이지 (Phase-School 탭) | listPhaseSchools, setPhaseSchool |
| 1.4 | 정책 설정 페이지 3개 카드 | setFeatureFlag, setLtvCap, setCooldown, getStatus |

**Phase 1 완료 조건**: 운영자가 아키타입 등록 → Phase-School 배정 → Feature Flag OFF 상태로 정책 확인까지 가능.

### Phase 2 — Ghost 관리 (Day 4-5)

| # | 작업 | 연동 API |
|---|---|---|
| 2.1 | Ghost 목록 테이블 뷰 + 필터 | listGhosts |
| 2.2 | Ghost 목록 카드 뷰 + 토글 | (상동) |
| 2.3 | Ghost 생성 다이얼로그 | create |
| 2.4 | Ghost 상세 drawer — 프로필 편집 | update |
| 2.5 | Ghost 상세 drawer — 사진 교체 (이미지 ID 검색) | updatePhoto |
| 2.6 | Ghost 상태 토글 | updateStatus |
| 2.7 | 학교별 일괄 비활성화 벌크 액션 | bulkInactivateSchool |

**Phase 2 완료 조건**: Phase 1에서 등록한 아키타입으로 Ghost 생성 → 목록에서 확인 → 수정/비활성 가능.

### Phase 3 — 후보 관리 + 비상 롤백 (Day 6-7)

| # | 작업 | 연동 API |
|---|---|---|
| 3.1 | 후보 목록 + 상태 탭 | listCandidates |
| 3.2 | 주간 후보 생성 다이얼로그 (dryRun 2-step) | generateWeekly |
| 3.3 | 후보 승인/취소 벌크 액션 | approveCandidates, cancelCandidates |
| 3.4 | 비상 롤백 페이지 + `<RollbackGate />` | rollback |
| 3.5 | 감사 로그 drawer (모든 페이지 연결) | getAuditLog |

**Phase 3 완료 조건**: Feature Flag OFF 상태에서 후보 생성 → dryRun 미리보기 → 실제 생성 → 승인 큐잉 가능. 롤백 3중 게이트 동작 확인.

### Phase 4 — QA + 배포 (Day 8)

- `/admin/ai-profiles/*` 전체 페이지 수동 QA
- Feature Flag OFF 확인 후 프로덕션 배포
- 운영 가이드 문서 공유 (Linear + Slack)
- Day 9+부터 단계적 활성화 (운영 가이드 섹션 6 참고)

---

## 7. 리스크 + 미결 이슈

| 리스크 | 영향 | 완화 |
|---|---|---|
| ~~백엔드 GET API 부재~~ | ~~Phase 0 지연~~ | **✅ 해결됨** — BE `feat/ghost-injection-mvp`에 G1~G7 전부 구현 확인 (2026-04-11) |
| BE 브랜치 미머지 | FE Phase 0 시작 블록 | BE 커밋/머지 확인 후 착수. FE 작업 내부(0.2~0.11)는 BE 없이 선행 가능 |
| Shadcn + 기존 MUI 어드민 이질감 | 시각적 일관성 저하 | AI Profiles 영역은 shadcn 전용. 색상/간격 토큰을 기존 어드민과 맞춤 (tailwind config 확인) |
| 기존 `ghost-accounts` 삭제 시 참조 누락 | 빌드 실패 | Phase 0.1 완료 후 `pnpm build` + `pnpm quality:admin-v2` 로 검증 |
| 사이드바 collapsible 리팩터 회귀 | 다른 메뉴 동작 영향 | 기존 플랫 `items[]`와 신규 `children[]` 타입 유니온으로 공존. 기존 그룹 전부 플랫 유지 |
| 사진 ID 검색 UX | 이미지 라이브러리 API 미확인 | Phase 2.5 직전 이미지 ID 검색/미리보기 API 확인 필요 |
| 감사 로그 drawer 성능 | 대량 로그 시 렌더링 | 페이지네이션 + 최근 50건만 기본 로드 |
| BFF 프록시 실패 | 모든 API 차단 | ErrorBoundary + retry + Sentry 로깅 (기존 패턴 재사용) |

---

## 8. 완료 기준 (DoD)

- [ ] 17개 mutation API 전부 UI에서 호출 가능
- [ ] 모든 mutation에 `reason` UI + 서버 이중 검증
- [ ] `/admin/ai-profiles/*` 6개 페이지 전부 라우팅 + 렌더
- [ ] StatusBar 실시간 폴링 동작
- [ ] 롤백 3중 게이트 (reason 100+ / ROLLBACK 타이핑 / 10초 카운트다운) 동작
- [ ] 후보 생성 dryRun 2-step 동작
- [ ] Ghost 목록 테이블/카드 토글 + 상태 보존
- [ ] 감사 로그 drawer 모든 페이지에서 접근 가능
- [ ] 사이드바에 `AI Profiles` 그룹 6항목 추가
- [ ] Feature Flag **OFF 상태로** 프로덕션 배포 (실제 주입 0건)
- [ ] `pnpm test:admin` 및 `pnpm quality:admin-v2` 통과

---

## 9. 다음 단계 제안

1. **사용자 재승인**: 섹션 0의 3가지 조정(병존/MUI 전환/플랫 사이드바) 확정
2. **백엔드 GAP 확인**: 섹션 2의 7개 GET API 존재 여부
3. Phase 0 작업 착수
4. (선택) 이 계획서를 `/plan-eng-review` 또는 `/codex review`로 독립 검증
