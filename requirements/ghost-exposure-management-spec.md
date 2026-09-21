# Ghost 노출 이력 관리 전용 페이지 — 요구사항 명세

## 목적

Ghost AI 계정별 노출 이력 전체를 관리자가 한 화면에서 조회하고 제어할 수 있는 전용 어드민 페이지 제공.

---

## 진입점

- URL: `/admin/ai-profiles/ghosts/exposures`
- 사이드바 "AI 프로필" > "Ghost 노출 관리" 항목으로 접근 (신규 메뉴 추가)

---

## 화면 구성 (2판 레이아웃)

### 좌측 패널 — Ghost 목록

| 표시 항목 | 설명 |
|-----------|------|
| 프로필 사진 | Ghost 대표 사진 (없으면 이니셜 폴백) |
| 이름 | Ghost 계정명 |
| 최근 노출일시 | 가장 최근 노출된 일시 (formatDateTimeKR) |
| 활성/비활성 토글 | 목록에서 직접 Ghost 활성 상태 제어 |

- 목록에서 Ghost 선택 시 우측 패널에 해당 Ghost의 노출 이력 표시
- 선택된 Ghost는 하이라이트 처리

### 우측 패널 — 선택된 Ghost의 노출 이력

기존 `GhostUserExposureContent`를 **ghost-centric 방향으로 유사하게** 구현:

| 표시 항목 | 설명 |
|-----------|------|
| 통계 요약 카드 | 총 노출수, 수락수, 전환율, 마지막 노출일시 |
| 경로별 분포 바 | v4_fallback / proactive_fill / scheduled_fill / like_cron |
| 노출 이력 리스트 | 노출된 유저명, 액션 타입(노출/수락), 경로, 일시 |
| 수락 → connectionId 링크 | 수락된 케이스에 matching-management 이동 버튼 |
| 필터 | 액션 타입 / 경로 / 기간(from~to) |
| 페이지네이션 | 20건씩 |

---

## 기능 범위

### 1. 노출 이력 조회
- 특정 Ghost에 노출된 유저 목록 조회
- 필터: actionType(GHOST_EXPOSED / GHOST_ACCEPTED), path, 기간

### 2. Ghost별 통계 요약
- 총 노출수, 수락수, 전환율 (수락/노출 × 100)
- 마지막 노출일시

### 3. 매칭 연결 이동
- GHOST_ACCEPTED 케이스에서 connectionId 존재 시 → matching-management 페이지로 이동

### 4. Ghost 활성/비활성 토글
- Ghost 목록에서 직접 토글
- 비활성화 시 해당 Ghost는 이후 인젝션 대상에서 제외

---

## 제외 범위

- Ghost 생성 / 삭제 (기존 Ghost 관리 페이지에서 담당)
- 개별 노출 건 삭제/수정
- 매칭 강제 종료 (matching-management에서 담당)

---

## API 의존성 (확인 필요)

| 기능 | 필요 API | 현황 |
|------|----------|------|
| Ghost 목록 조회 | GET /ghost-accounts (with stats) | 확인 필요 |
| Ghost별 노출 이력 | GET /ghost-accounts/:ghostAccountId/exposures | 확인 필요 — 현재는 user-centric API만 존재 |
| Ghost 활성/비활성 | PATCH /ghost-accounts/:ghostAccountId | 확인 필요 |

> **Note**: 현재 `ghostInjection.getUserExposures(userId)` 는 유저 기준 API.
> Ghost 기준(ghostAccountId) API가 없으면 백엔드 추가 필요.

---

## 재사용 컴포넌트

| 컴포넌트 | 재사용 방식 |
|----------|------------|
| `GhostUserExposureContent` | props 구조 변경(ghostAccountId 기준)하거나 유사 컴포넌트 신규 작성 |
| `SummaryCard` | 통계 요약 카드 재사용 |
| `PATH_LABELS`, `DEFAULT_LIMIT` | ghost-user-exposure-content에서 export된 상수 재사용 |

---

## 성공 기준

- Ghost 목록에서 Ghost 선택 시 해당 Ghost의 노출 이력이 즉시 표시됨
- 활성/비활성 토글 시 서버에 반영되고 목록 상태 즉시 업데이트
- 수락된 매칭 건에서 matching-management로 이동 가능
- 통계 요약 카드 정상 표시
