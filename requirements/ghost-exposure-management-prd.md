# PRD: Ghost 노출 이력 관리 페이지

**작성일**: 2026-04-28
**상태**: DRAFT

---

## 목적

어드민에서 Ghost 계정별 노출 이력 전체를 조회·통계·관리하는 전용 페이지 제공.
현재는 유저 기준 노출 이력만 조회 가능하고, Ghost 기준 조회 수단이 없음.

---

## 화면 구성

**진입점**: `/admin/ai-profiles/ghosts/exposures` (신규)
**레이아웃**: 좌우 2판

### 좌측 — Ghost 목록 패널

| 항목 | 설명 |
|------|------|
| 프로필 사진 | 대표 사진, 없으면 이니셜 폴백 |
| 이름 | Ghost 계정명 |
| 최근 노출일시 | `lastExposedAt` (포맷: formatDateTimeKR) |
| 활성/비활성 토글 | 즉시 반영, 낙관적 업데이트 |
| 상태 배지 | ACTIVE / INACTIVE |

- Ghost 선택 시 우측 패널 갱신
- 선택된 Ghost 하이라이트

### 우측 — Ghost 노출 이력 패널

| 항목 | 설명 |
|------|------|
| 통계 요약 카드 | 총 노출수, 수락수, 전환율, 마지막 노출일시 |
| 경로별 분포 바 | v4_fallback / proactive_fill / scheduled_fill / like_cron |
| 이력 리스트 | 노출된 유저명, 액션 타입(노출/수락), 경로, 일시 |
| connectionId 링크 | GHOST_ACCEPTED 케이스 → `/admin/matching-management?connectionId=…` |
| 필터 | actionType / path / 기간(from~to) |
| 페이지네이션 | 20건씩 |

---

## 범위 외

- Ghost 생성·삭제 (기존 Ghost 관리 페이지 담당)
- 개별 노출 건 삭제·수정
- 매칭 강제 종료 (matching-management 담당)

---

## 백엔드 변경 사항

### 현황 분석 결과

| 기능 | 현황 | 비고 |
|------|------|------|
| Ghost 목록 조회 | 존재 — `GET /admin/ghost-injection/ghosts` | exposure 통계 컬럼 없음 |
| Ghost 상세 조회 | 존재 — `GET /admin/ghost-injection/ghosts/:id` | 집계 stats 포함 |
| Ghost 활성/비활성 토글 | **존재** — `PATCH /admin/ghost-injection/:id/status` | 바디: `{ targetStatus, reason }` |
| **Ghost 기준 노출 이력** | **없음** | 신규 구현 필요 |
| Ghost 목록에 노출 통계 | 없음 | `ghost_user_exposure_counter` 조인으로 추가 가능 |

---

### API 1 (신규): Ghost 기준 노출 이력 조회

```
GET /admin/ghost-injection/ghosts/:ghostAccountId/exposures
```

**Query Params** (기존 user-centric API와 동일 구조):

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `page` | number | 기본 1 |
| `limit` | number | 기본 20, 최대 100 |
| `actionType` | `GHOST_EXPOSED \| GHOST_ACCEPTED` | 필터 |
| `path` | `v4_fallback \| proactive_fill \| scheduled_fill \| like_cron` | 필터 |
| `from` | ISO datetime string | 기간 시작 |
| `to` | ISO datetime string | 기간 종료 |

**Response**:

```typescript
{
  ghostAccountId: string;
  summary: {
    totalExposures: number;        // actionType = GHOST_EXPOSED 건수
    totalAccepted: number;         // actionType = GHOST_ACCEPTED 건수
    lastExposedAt: string | null;  // 가장 최근 노출 createdAt
    byPath: Partial<Record<GhostExposedPath, number>>;
  };
  items: Array<{
    id: string;
    actionType: 'GHOST_EXPOSED' | 'GHOST_ACCEPTED';
    userId: string;               // 노출 대상 유저
    userName: string | null;      // users 테이블 JOIN
    userPhotoUrl: string | null;  // 유저 대표 사진
    path: GhostExposedPath | null;
    schoolId: string | null;
    connectionId: string | null;
    createdAt: string;
  }>;
  page: number;
  limit: number;
  total: number;
}
```

**DB 쿼리 전략**:

```sql
-- ghost_audit_events 테이블에서 ghost 기준으로 조회
-- WHERE target_type = 'ghost_accounts' AND target_id = :ghostAccountId
-- idx_ghost_audit_events_target_time 인덱스 (target_type, target_id, created_at) 이미 존재 → 추가 인덱스 불필요
-- after_state_json->>'userId' 로 userId 추출 후 users 테이블 LEFT JOIN
```

**구현 위치**:
- Service: `src/ghost-injection/services/ghost-injection-admin-query.service.ts`
  - `getGhostExposures(ghostAccountId: string, query: GhostExposureQueryDto)` 메서드 추가
- Controller: `src/ghost-injection/controllers/ghost-injection-admin.controller.ts`
  - `@Get('ghosts/:ghostAccountId/exposures')` 핸들러 추가
- DTO: `src/ghost-injection/dto/ghost-exposure-query.dto.ts` (신규) — user exposure query DTO와 동일 구조
- Response Type: `GhostExposureResponse` (신규 interface)

---

### API 2 (기존 확장): Ghost 목록에 노출 통계 추가

```
GET /admin/ghost-injection/ghosts
```

기존 응답의 각 Ghost 항목에 아래 필드 추가:

```typescript
{
  // 기존 필드 유지 ...
  exposureStats?: {
    totalShown: number;       // ghost_user_exposure_counter.total_shown
    totalAccepted: number;    // ghost_user_exposure_counter.total_accepted
    lastExposedAt: string | null;  // ghost_audit_events 최근 노출일시
  };
}
```

**구현 전략**:
- `ghost_user_exposure_counter` 테이블 LEFT JOIN (ghostUserId 기준)
- `lastExposedAt`은 별도 서브쿼리 또는 ghost_audit_events MAX(created_at) 쿼리
- 기존 목록 API 응답 크기 증가 최소화: `exposureStats` 필드는 쿼리 파라미터 `includeStats=true` 일 때만 포함 (선택)

---

### API 3 (기존): Ghost 활성/비활성 토글

```
PATCH /admin/ghost-injection/:ghostAccountId/status
Body: { targetStatus: 'ACTIVE' | 'INACTIVE', reason?: string }
```

**이미 구현 완료** — 프론트엔드에서 바로 사용 가능.

---

## 프론트엔드 구현 사항

### 신규 파일

| 파일 | 역할 |
|------|------|
| `app/admin/ai-profiles/ghosts/exposures/page.tsx` | Server Component wrapper |
| `app/admin/ai-profiles/ghosts/exposures/ghost-exposures-client.tsx` | Client Component (2판 레이아웃) |
| `app/admin/ai-profiles/ghosts/exposures/ghost-exposure-history.tsx` | 우측 패널 — Ghost 기준 이력 컴포넌트 |

### 재사용 컴포넌트

| 컴포넌트 | 재사용 방식 |
|----------|------------|
| `GhostUserExposureContent` | ghost-centric props로 유사 컴포넌트 신규 작성 또는 props 확장 |
| `PATH_LABELS`, `DEFAULT_LIMIT`, `GHOST_NOT_TRACKABLE` | `ghost-user-exposure-content.tsx`에서 import |
| `SummaryCard` (현재 내부 함수) | `_shared/`로 추출 후 공유 |

### 서비스 레이어 추가

```typescript
// app/services/admin/ghost-injection.ts 에 추가
getGhostExposures(ghostAccountId: string, query: GhostExposureQuery): Promise<GhostExposureResponse>
```

### 사이드바 메뉴 추가

```typescript
// shared/ui/admin/sidebar.tsx
// "AI 프로필" 그룹에 "Ghost 노출 관리" 항목 추가
// href: /admin/ai-profiles/ghosts/exposures
```

---

## 타입 정의 추가 (`app/types/ghost-injection.ts`)

```typescript
export interface GhostExposureItem {
  id: string;
  actionType: UserGhostExposureActionType;
  userId: string;
  userName: string | null;
  userPhotoUrl: string | null;
  path: UserGhostExposurePath | null;
  schoolId: string | null;
  connectionId: string | null;
  createdAt: string;
}

export interface GhostExposureQuery {
  page?: number;
  limit?: number;
  actionType?: UserGhostExposureActionType;
  path?: UserGhostExposurePath;
  from?: string;
  to?: string;
}

export interface GhostExposureResponse {
  ghostAccountId: string;
  summary: UserGhostExposureSummary; // 기존 타입 재사용
  items: GhostExposureItem[];
  page: number;
  limit: number;
  total: number;
}
```

---

## 구현 순서

1. **BE**: `GhostExposureQueryDto` + `GhostExposureResponse` 타입 정의
2. **BE**: `getGhostExposures()` 서비스 메서드 구현
3. **BE**: `GET /ghosts/:ghostAccountId/exposures` 핸들러 추가
4. **BE**: Ghost 목록 API에 `lastExposedAt` 필드 추가 (exposureStats 전체는 선택)
5. **FE**: 타입 정의 추가 (`app/types/ghost-injection.ts`)
6. **FE**: 서비스 레이어 메서드 추가
7. **FE**: 2판 레이아웃 페이지 구현
8. **FE**: 사이드바 메뉴 추가

---

## 성공 기준

- [ ] Ghost 목록에서 Ghost 선택 시 해당 Ghost의 노출 이력 즉시 표시
- [ ] Ghost 기준 통계 요약 카드 정상 표시 (노출수, 수락수, 전환율, 마지막 노출일시)
- [ ] 경로 / 액션 타입 / 기간 필터 동작
- [ ] 수락 케이스에서 matching-management 연결 이동 가능
- [ ] 활성/비활성 토글 즉시 반영
- [ ] 페이지네이션 정상 동작
