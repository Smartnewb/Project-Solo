# Phase 2 핸드오프 — Ghost 관리 구현

**대상**: `/Users/user/projects/Project-Solo` (Next.js 14 어드민)
**선행 Phase**: Phase 0 (스캐폴딩) + Phase 1 (아키타입/학교/정책) **모두 완료**
**이번 Phase 범위**: Ghost 관리 (A1~A5) — 6개 엔드포인트
**예상 작업 시간**: 2일 (Day 4-5)

---

## 1. 프로젝트 맥락 (새 세션에서 먼저 읽을 것)

### 제품 배경
남녀 성비 5:1로 남성 재매칭 시 후보 부재 43.8%. 이 이탈 문제를 해결하기 위해 AI 아키타입으로 합성한 "Ghost 프로필"을 특정 남성 유저에게 노출. 운영팀이 Ghost 라이프사이클을 관리하는 어드민 콘솔을 만드는 중.

### 문서 맵 (전부 읽지는 말고 필요 시 참조)

| 문서 | 역할 |
|---|---|
| `requirements/ai-ghost-admin-ui-spec.md` | UX 확정 스펙 (사용자 승인 완료) |
| `requirements/ai-ghost-admin-implementation-plan.md` | 전체 Phase 계획 + API 매핑 |
| `requirements/ai-ghost-injection-backend-prd.md` | 백엔드 PRD (RESOLVED — BE 이미 구현) |
| `requirements/ai-ghost-admin-phase2-handoff.md` | **이 파일 — Phase 2 작업 가이드** |

### 백엔드 상태
- 레포: `/Users/user/projects/solo-nestjs-api`, 브랜치 `feat/ghost-injection-mvp`
- **uncommitted working tree 상태** (커밋 대기 중)
- 24개 API 전부 `/admin/ghost-injection/*`에 구현 완료
- FE는 BE 머지 없이도 UI 스캐폴딩 가능 (mock/error 상태 렌더)

### Phase 0 + Phase 1 완료 상태

**완료된 것**:
- 기존 `ghost-accounts` (탈퇴 여성 복제) 전부 삭제
- Shadcn 컴포넌트 13개 추가 (button, card, popover는 기존)
- 사이드바 `🤖 AI Profiles` collapsible 그룹 + 6 서브메뉴
- `/admin/ai-profiles/layout.tsx` + `StatusBar` (Feature Flag/침투율/활성 Ghost/주간 발송 폴링)
- 타입: `app/types/ghost-injection.ts` (BE DTO 1:1 복제)
- 서비스: `app/services/admin/ghost-injection.ts` (24 API 래퍼)
- 공용: `_shared/reason-input.tsx`, `_shared/status-bar.tsx`, `_shared/query-keys.ts`
- **Phase 1 페이지 완성**: archetypes, schools, policy

**Phase 2에서 할 것**: Ghost 목록/생성/상세/상태 전환 UI — 현재 `/admin/ai-profiles/ghosts/page.tsx`는 placeholder

---

## 2. 이번 Phase 범위 — Ghost 관리 (A1~A5)

| ID | API | 역할 | UI |
|---|---|---|---|
| G1 | `GET /admin/ghost-injection/ghosts` | Ghost 목록 조회 | 테이블/카드 뷰 토글 + 필터 |
| G2 | `GET /admin/ghost-injection/ghosts/:id` | Ghost 상세 조회 | 우측 Sheet drawer |
| A1 | `POST /admin/ghost-injection/create` | 합성 Ghost 생성 | `+ 생성` 다이얼로그 |
| A2 | `PATCH /admin/ghost-injection/:ghostAccountId` | 프로필 필드 수정 | drawer 내 편집 폼 |
| A3 | `PUT /admin/ghost-injection/:ghostAccountId/photo/:slotIndex` | 사진 교체 | drawer 내 슬롯별 imageId 교체 |
| A4 | `PATCH /admin/ghost-injection/:ghostAccountId/status` | 활성/비활성 전환 | 인라인 토글 + 확인 모달 |
| A5 | `POST /admin/ghost-injection/bulk-inactivate/school/:schoolId` | 학교 일괄 비활성화 | 학교 필터 활성 시 벌크 액션 |

### 확정 UX 결정 (변경 불요)
- Ghost 목록 뷰: **테이블 + 카드 토글** (spec 확정)
- 뷰 선택은 `localStorage.ghost-view` + URL `?view=table|card` 동기화
- 필터: 상태(ACTIVE/INACTIVE), 학교, 아키타입, 이름/자기소개 검색(`q`)
- Ghost 상세는 **우측 Sheet drawer** (기존 `shared/ui/sheet.tsx` 사용)
- 사진 교체는 **raw imageId 입력** (BE에 이미지 검색 API 없음 — spec 확정사항)
- Ghost 생성: 아키타입 선택 + 대학/학과 선택 + phaseSchoolIds + reason

---

## 3. 구현 전 반드시 읽을 코드

### 타입 (이미 완성)
`app/types/ghost-injection.ts`
- `GhostListItem`, `GhostDetail`, `GhostListQuery`, `CreateGhostBody`, `UpdateGhostBody`, `UpdateGhostFields`, `ReplaceGhostPhotoBody`, `ToggleGhostStatusBody`, `BulkInactivateBody`, `GhostInjectionPaginated<T>`
- `GhostPhotoItem`, `GhostExposureStats`, `GhostAuditEventItem`
- **주의**: `GhostListItem.university`, `department`, `archetype`, `mbti`, `primaryPhotoUrl` 전부 nullable

### 서비스 (이미 완성)
`app/services/admin/ghost-injection.ts`의 다음 메서드 사용:
```ts
ghostInjection.listGhosts(query)       // G1
ghostInjection.getGhost(ghostAccountId) // G2
ghostInjection.createGhost(body)        // A1
ghostInjection.updateGhost(id, body)    // A2
ghostInjection.replaceGhostPhoto(id, slotIndex, body) // A3
ghostInjection.toggleGhostStatus(id, body) // A4
ghostInjection.bulkInactivateSchool(schoolId, body)   // A5
```

### 재사용 공용 컴포넌트
- `_shared/reason-input.tsx` — `<ReasonInput value onChange minLength={10} />` + `isReasonValid()` helper
- `_shared/query-keys.ts` — `ghostInjectionKeys.ghosts()`, `.ghostList(query)`, `.ghostDetail(id)`, `.archetypes()`, `.phaseSchools()`

### Phase 1에서 확립된 패턴 (이미 잘 동작 — 그대로 따를 것)
Phase 1 페이지를 참고해서 동일 패턴으로 구현:

| 참고 파일 | 패턴 |
|---|---|
| `app/admin/ai-profiles/archetypes/archetypes-client.tsx` | 테이블 + 생성/수정 버튼 + Dialog 오픈 |
| `app/admin/ai-profiles/archetypes/archetype-form-dialog.tsx` | `useMutation` + `useQueryClient` + `AdminApiError` 메시지 파싱 + reason 강제 |
| `app/admin/ai-profiles/schools/schools-client.tsx` | Tabs + 2개 패널 분리 + `useConfirm` 사용 예시 |
| `app/admin/ai-profiles/policy/feature-flag-card.tsx` | 토글 + 확인 모달 (`useConfirm`) + reason |

### 외부 유틸 (이미 다른 페이지에서 사용 중)
- `useToast()` from `@/shared/ui/admin/toast` — `toast.success()`, `toast.error()`
- `useConfirm()` from `@/shared/ui/admin/confirm-dialog` — `await confirm({ title, message, severity })`
- `AdminApiError` from `@/shared/lib/http/admin-fetch` — 서버 에러 메시지 파싱
- `cn()` from `@/shared/utils` — className merge

### 대학/학과 선택용 기존 서비스
Ghost 생성 시 universityId + departmentId 필수 — 기존 `app/services/admin/system.ts`의 `universities` 사용:
```ts
import { universities } from '@/app/services/admin';

// 대학 목록 (페이지네이션, 검색 지원)
universities.list({ page: 1, limit: 50, q: searchTerm })
// → { data: { items, totalCount, ... } }

// 특정 대학의 학과 목록
universities.departments.list(universityId, { page: 1, limit: 100 })
```

**주의**: 응답 구조 `{ data: ... }` 감싸짐 — 실제 호출 전 `app/services/admin/system.ts`를 읽어 정확한 shape 확인 필요.

---

## 4. 생성/수정할 파일

### 메인 페이지
- `app/admin/ai-profiles/ghosts/page.tsx` — 현재 placeholder, `<GhostsClient />` import로 교체

### 클라이언트 컴포넌트 (신규)
- `app/admin/ai-profiles/ghosts/ghosts-client.tsx` — URL 쿼리 파싱 + 필터 상태 + 뷰 토글 + 테이블/카드 렌더 + 벌크 액션 + 생성 버튼
- `app/admin/ai-profiles/ghosts/ghost-table-view.tsx` — MUI DataGrid 대신 shadcn Table 사용. 컬럼: photo / name / age / mbti / university / archetype / status toggle / 수정일 / actions
- `app/admin/ai-profiles/ghosts/ghost-card-view.tsx` — 카드 그리드 (3-4 col responsive). `primaryPhotoUrl` 또는 placeholder, 이름/나이/MBTI/대학/학과/상태 배지
- `app/admin/ai-profiles/ghosts/ghost-filters.tsx` — 상태 Select, 학교 검색 조합박스, 아키타입 Select, 검색어 입력
- `app/admin/ai-profiles/ghosts/ghost-view-toggle.tsx` — 간단한 2-버튼 토글 + localStorage + URL query 동기화
- `app/admin/ai-profiles/ghosts/ghost-create-dialog.tsx` — 아키타입 Select(쿼리로 로드) + 대학 선택 + 학과 선택(대학 의존) + phaseSchoolIds 멀티 + reason
- `app/admin/ai-profiles/ghosts/ghost-detail-drawer.tsx` — 우측 Sheet drawer. 상세 정보 + 편집 폼 + 사진 슬롯 리스트 + 액션 버튼 + 최근 감사 로그
- `app/admin/ai-profiles/ghosts/ghost-photo-slot.tsx` — 슬롯 한 칸: 현재 사진 미리보기 + `imageId 교체` 버튼 → 입력 팝오버 → A3 호출
- `app/admin/ai-profiles/ghosts/ghost-bulk-actions.tsx` — 학교 필터 활성 시만 노출. "이 학교 Ghost 전부 비활성화" 버튼 + 3단계 확인

### 필요 시 Shadcn 추가 (현재 미설치)
현재 프로젝트에 이미 있는 것: button, card, dialog, sheet, tabs, input, textarea, badge, alert, table, collapsible, select, switch, slider, label, popover
추가로 필요할 수 있는 것:
- `avatar` — Ghost 사진 표시 (없으면 직접 `<img>` + Tailwind로 가능)
- `separator` — drawer 내부 섹션 분리 (없으면 `<hr />` + Tailwind)
- `skeleton` — 로딩 상태 (없으면 빈 div + animate-pulse)

**설치 명령**: `npx shadcn@latest add avatar separator skeleton --yes`
(pnpm home dir 이슈가 있었으나 Phase 0에서 해결됨. `~/Library/pnpm`이 실제 디렉토리로 존재하는지 확인 후 진행)

---

## 5. 작업 순서 (권장)

1. **생성 다이얼로그 선행 작업** — 대학/학과 선택 UX가 가장 어려움
   - `app/services/admin/system.ts` 읽어서 `universities.list` / `universities.departments.list` 응답 구조 확인
   - `ghost-create-dialog.tsx` 스캐폴딩 + Select 의존성(대학 → 학과) 동작 확인
2. **테이블 뷰 + URL 쿼리 필터 구조** — 이게 중심. 나머지는 주위 장식
   - `ghosts-client.tsx` + `ghost-table-view.tsx` + `ghost-filters.tsx`
   - `useSearchParams` + `useRouter.replace` 로 URL 동기화
   - React Query key: `ghostInjectionKeys.ghostList(query)` 변화 시 자동 refetch
3. **카드 뷰 + 토글**
   - `ghost-card-view.tsx` + `ghost-view-toggle.tsx`
   - 토글 변경 시 필터/페이지 상태 보존
4. **상세 drawer + 편집 폼 (A2)**
   - 행/카드 클릭 → `selectedGhostId` 상태 → drawer open
   - `ghostInjectionKeys.ghostDetail(id)` 조회
   - 편집 폼 저장 시 `updateGhost` → invalidate detail + list
5. **사진 슬롯 (A3)**
   - 각 슬롯에 교체 팝오버(shadcn popover 이미 있음)
   - imageId 입력 → `replaceGhostPhoto` → invalidate detail
6. **상태 토글 (A4)**
   - 테이블/카드에 인라인 스위치 또는 버튼
   - `useConfirm` + reason → `toggleGhostStatus`
7. **벌크 비활성화 (A5)**
   - 학교 필터가 활성일 때만 "이 학교 Ghost 전부 비활성화" 버튼 노출
   - reason + 재확인 → `bulkInactivateSchool`
8. **`pnpm build`** — 전체 통과 확인

---

## 6. 주의사항 / 함정

### URL 쿼리 상태 동기화
- `useSearchParams`는 read-only. 변경은 `router.replace(\`?${params.toString()}\`)`
- `scroll: false` 옵션 전달해서 스크롤 튐 방지
- 빈 값은 URL에서 제거 (`params.delete(key)`)
- localStorage는 뷰 모드(`view`)만, 필터는 URL만

### React Query
- `placeholderData: keepPreviousData`로 페이지 전환 시 깜빡임 방지
- Mutation 성공 후 `invalidateQueries({ queryKey: ghostInjectionKeys.ghosts() })` (부분 매칭)
- 상세 조회는 `enabled: Boolean(selectedGhostId)` 조건부

### Sheet drawer
- `shared/ui/sheet.tsx` 사용. `<Sheet open onOpenChange>` + `<SheetContent side="right">` 패턴
- 폭은 `className="sm:max-w-xl"` 정도 권장
- 내부에 `<ScrollArea>`는 없으므로 그냥 `<div className="overflow-y-auto max-h-screen">`

### reason 필드
- 모든 mutation에 필수. `isReasonValid(reason)` 체크 → disabled 상태
- 사진 교체, 상태 토글, 벌크 비활성화 전부 reason 입력 필요
- 편집 폼은 `fieldsToUpdate` + `reason` 둘 다

### Nullable 주의
- `GhostListItem.archetype`, `university`, `department`, `mbti`, `primaryPhotoUrl` 전부 null 가능
- 렌더 시 `?? '—'` fallback
- 이미지는 null이면 Tailwind placeholder 박스

### BE 머지 전 상태
- BE 커밋/머지 전이면 모든 GET은 404 반환 → 에러 상태 렌더 정상
- Feature Flag OFF가 기본 (BE 시드로 OFF 보장)
- 수동 검증은 BE 머지 후에 가능

---

## 7. 검증 체크리스트

### 자동
```bash
cd /Users/user/projects/Project-Solo
pnpm build                   # typecheck + lint + 라우트 빌드
pnpm quality:admin-v2        # 전체 파이프라인
```

기대 결과:
- `pnpm build` 성공
- `/admin/ai-profiles/ghosts` 번들 크기가 placeholder(152 B)에서 **최소 15 kB 이상**으로 증가
- 기존 페이지 회귀 없음 (kpi-report, users/appearance 등 크기 변동 없음)

### 수동 (BE 머지 후)
```bash
pnpm dev
```
1. `/admin/ai-profiles/ghosts` 접속 → 테이블 뷰 기본 렌더
2. 뷰 토글 → 카드 뷰 전환 + 필터 상태 보존 확인
3. 필터 변경 시 URL 쿼리 업데이트 확인
4. `+ Ghost 생성` → 아키타입/대학/학과 선택 → reason 입력 → 생성 성공
5. 행 클릭 → drawer open → 편집 폼 수정 → 저장 → 목록 자동 새로고침
6. 상태 토글 → 확인 모달 → reason 입력 → 전환 성공
7. 학교 필터 적용 → 벌크 비활성화 버튼 노출 → 3단계 확인 → 일괄 전환
8. 사진 슬롯 교체 → imageId 입력 → 교체 성공
9. StatusBar 폴링 중단 없이 정상 동작

---

## 8. Phase 2 완료 기준

- [ ] 7개 파일 생성 (ghosts-client + 6 sub-components)
- [ ] `ghosts/page.tsx`가 `<GhostsClient />` 렌더
- [ ] 테이블/카드 뷰 토글 + 상태 보존
- [ ] 4개 필터 (status/school/archetype/q) 전부 동작
- [ ] 생성 다이얼로그 — 아키타입/대학/학과 동적 로드 + reason
- [ ] 상세 drawer — 정보 표시 + 편집 + 사진 슬롯 + 감사 로그
- [ ] 상태 토글 (A4) — 확인 모달 + reason
- [ ] 학교 필터 활성 시 벌크 비활성화 (A5)
- [ ] 모든 mutation에 reason 10자+ 강제
- [ ] `pnpm build` 통과
- [ ] 기존 페이지 회귀 없음

---

## 9. 다음 세션 시작 프롬프트 (그대로 붙여넣기)

새 Claude Code 세션에서 아래 텍스트를 복사해 붙여넣으면 됩니다:

---

```
Phase 2 작업 진행해줘. Ghost 관리 (A1~A5) UI 구현.

작업 디렉토리: /Users/user/projects/Project-Solo

먼저 이 핸드오프 문서를 읽고 맥락 파악해:
requirements/ai-ghost-admin-phase2-handoff.md

핸드오프 문서에 맥락·패턴·작업 순서·검증 체크리스트가 전부 들어있음.
Phase 0, Phase 1은 이미 완료됨. 이번 세션은 Phase 2만 수행.

TaskCreate로 작업 분해한 뒤 핸드오프 § 5 "작업 순서"대로 진행하고,
완료 시 `pnpm build` 통과까지 확인해줘.
```

---

## 10. 현재 uncommitted 변경사항 요약 (새 세션이 바로 파악할 수 있게)

**Phase 0 + Phase 1 누적 변경**:

삭제:
- `app/admin/ghost-accounts/` (디렉토리)
- `app/admin/hooks/use-ghost-account.ts`
- `app/services/admin/ghost-account.ts`
- `app/types/ghost-account.ts`

생성:
- `app/types/ghost-injection.ts`
- `app/services/admin/ghost-injection.ts`
- `app/admin/ai-profiles/layout.tsx`
- `app/admin/ai-profiles/_shared/{status-bar,reason-input,query-keys}.tsx`
- `app/admin/ai-profiles/ghosts/page.tsx` (placeholder)
- `app/admin/ai-profiles/candidates/page.tsx` (placeholder)
- `app/admin/ai-profiles/policy/{page,policy-client,feature-flag-card,ltv-cap-card,cooldown-card}.tsx`
- `app/admin/ai-profiles/schools/{page,schools-client,blacklist-add-dialog,phase-school-edit-dialog}.tsx`
- `app/admin/ai-profiles/archetypes/{page,archetypes-client,archetype-form-dialog}.tsx`
- `app/admin/ai-profiles/rollback/page.tsx` (placeholder)
- `shared/ui/{alert,badge,collapsible,dialog,input,label,select,sheet,slider,switch,table,tabs,textarea}.tsx` (shadcn)

수정:
- `shared/lib/http/admin-fetch.ts` (adminDelete body 파라미터 추가)
- `shared/ui/admin/sidebar.tsx` (collapsible + AI Profiles 그룹)
- `shared/ui/admin/command-search.tsx` (flattenNav 재귀)
- `app/admin/hooks/index.ts` (use-ghost-account export 제거)
- `app/services/admin/index.ts` (ghostAccount 제거 + ghostInjection 추가)

**Phase 2 시작 전 권장**: Phase 0+1 변경을 먼저 커밋하거나, 새 세션에서 `git status`로 현재 상태 파악 후 진행.
