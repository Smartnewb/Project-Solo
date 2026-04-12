# AI Ghost Profile Injection — 어드민 UI/UX 스펙

**작성일**: 2026-04-11
**대상 프로젝트**: Project-Solo (Next.js 14 어드민 대시보드)
**연동 API**: solo-nestjs-api `/admin/ai-profiles/*` (17개 엔드포인트)
**배포 전제**: Feature Flag OFF 상태로 최초 릴리즈

---

## Before (Original Requirement)

> "AI Ghost Profile Injection 어드민 UI/UX 및 기능 설계 — 17개 API, 6개 섹션을 Project-Solo 어드민 대시보드에 추가"

원본 스펙은 API 레벨까지 확정되어 있었으나, 프런트 네비게이션·뷰 스타일·워크플로우 UI·안전장치·디자인 시스템 선택이 결정되지 않은 상태였다.

---

## After (Clarified Requirement)

### Goal

Project-Solo 어드민에 **AI Ghost Profile Injection 운영 콘솔**을 추가하여, 운영팀이 Ghost 계정·후보·정책·학교·아키타입·비상 롤백을 **감사 로그 기반**으로 안전하게 제어할 수 있게 한다.

### Scope — 포함

- 사이드바 `AI Profiles` 확장 그룹 + 6개 서브메뉴
  - Ghost 관리 / 후보 관리 / 정책 설정 / 학교 관리 / 아키타입 / 비상 롤백
- 17개 어드민 API 전부 연동 (B3 세그먼트 Cap 제외)
- 각 AI Profiles 페이지 전용 상단 고정 상태 배지
  - Feature Flag ON/OFF · 현재 LTV 침투율 · 활성 Ghost 수 · 이번 주 발송 수
- 공통 `reason` 입력 컴포넌트 (모든 mutation에 강제)
- `/api/admin-proxy/*` BFF 경유 호출
- Shadcn/ui + Tailwind 중심 디자인

### Scope — 제외 (Phase 2 이후)

- B3 세그먼트 Cap 조정 (서버도 미구현)
- 글로벌 AdminShell 헤더 수정 (AI Profiles 영역 내에서만 배지 표시)
- Ghost 사진 직접 업로드 (기존 image ID 선택만 지원)
- Mixpanel 실측 차트 (숫자 표시까지만, 차트 시각화는 후속)
- Slack 알람 자동 발송 (백엔드 리스너 미구현)

### Constraints

| 항목 | 제약 |
|---|---|
| 디자인 시스템 | Shadcn/ui + Tailwind 중심 (신규 AI Profiles 영역 한정, 기존 MUI 페이지는 그대로) |
| 레이아웃 | 기존 `AdminShell` + 사이드바 확장 그룹 패턴 재사용 |
| 인증 | `patchAdminAxios` → `/api/admin-proxy/*` BFF 프록시 경유 |
| reason 필드 | 모든 mutation 요청에 필수 — UI validation + 서버 이중 강제 |
| Ghost 목록 뷰 | 테이블 ↔ 카드 토글 제공 (운영 = 테이블 / 큐레이션 = 카드) |
| 후보 관리 | 단일 페이지 + `PENDING/QUEUED/CANCELED` 상태 필터 탭 |
| Feature Flag ON | 확인 모달 강제 |
| LTV Cap 입력 | 현재 침투율 비교 색상 경고 (현재/신규 비율 80%+ 주황, 초과 빨강) |
| 후보 생성 D1 | `dryRun=true` 미리보기 → 실제 생성 2-step |
| 비상 롤백 | reason(100자+) → `ROLLBACK` 타이핑 → 10초 카운트다운 버튼 3중 게이트 |

### Success Criteria

1. 운영자가 UI만으로 다음 플로우 완주 가능
   - 아키타입 등록 → Phase-School 버킷 설정 → Ghost 생성 → 주간 후보 생성/승인 → 정책 조정
2. Feature Flag OFF 상태로 안전하게 최초 배포 가능
3. 비상 상황에서 **3클릭 이내** 롤백 버튼 도달
4. 모든 mutation에 `reason` 누락 시 UI·서버 양쪽 차단
5. Ghost 목록 뷰 토글 시 상태(필터/정렬/페이지) 유지
6. BFF 프록시 실패 시 에러 바운더리에서 복구 가능한 UI 제공

---

## Decisions Made

| Question | Decision |
|---|---|
| 기획 범위 | 6개 섹션 전체 한 번에 |
| 네비게이션 구조 | 사이드바 `AI Profiles` 확장 그룹 + 서브메뉴 6개 |
| Ghost 계정 목록 뷰 | 테이블 + 카드 토글 |
| 후보 관리 UI | 단일 페이지 + 상태 필터 탭 |
| 글로벌 상태 배지 위치 | AI Profiles 페이지 내 고정 상단 (글로벌 헤더 미수정) |
| 비상 롤백 UX | `ROLLBACK` 타이핑 + 10초 카운트다운 |
| Ghost 사진 교체 소스 | 기존 업로드된 image ID 선택/검색 |
| 디자인 시스템 | Shadcn/ui + Tailwind 중심 |

---

## 페이지 구조 (6 서브메뉴)

```
Sidebar
 └── AI Profiles ▼
      ├ /admin/ai-profiles/ghosts         Ghost 계정 관리 (테이블/카드 토글)
      ├ /admin/ai-profiles/candidates     주간 후보 관리 (상태 필터 탭)
      ├ /admin/ai-profiles/policy         정책 설정 (Flag / LTV / Cooldown)
      ├ /admin/ai-profiles/schools        학교 관리 (블랙리스트 + Phase-School)
      ├ /admin/ai-profiles/archetypes     아키타입 라이브러리
      └ /admin/ai-profiles/rollback       비상 롤백 (별도 위험 섹션)
```

모든 `/admin/ai-profiles/*` 페이지 상단에 공통 **Status Bar** 컴포넌트 고정:
- Feature Flag 배지 (ON=녹색 / OFF=회색)
- 현재 LTV 침투율 vs Cap (%)
- 활성 Ghost 수
- 이번 주 승인된 후보 수

---

## API ↔ 화면 매핑 (17개)

| API | 화면 위치 | UI 컴포넌트 |
|---|---|---|
| A1 create | Ghost 관리 → `+ Ghost 생성` | 다이얼로그 (아키타입 드롭다운 + Phase-School 멀티셀렉트 + reason) |
| A2 patch | Ghost 관리 → 행/카드 클릭 상세 | 사이드 시트 편집 폼 |
| A3 photo | Ghost 상세 → 사진 슬롯 | 이미지 ID 검색 팝오버 |
| A4 status | Ghost 목록 인라인 토글 | 확인 모달 + reason |
| A5 bulk-inactivate | Ghost 관리 → 학교 필터 → 벌크 액션 | 확인 모달 (위험) |
| B1 ltv-cap | 정책 설정 → LTV 카드 | 슬라이더 + 현재 침투율 비교 경고 |
| B2 cooldown | 정책 설정 → Cooldown 카드 | 숫자 입력 + reason |
| C2 feature-flag | 정책 설정 → Flag 카드 | 토글 + ON 확인 모달 |
| C1 rollback | 비상 롤백 (별도 페이지) | 3중 게이트 (reason 100자+ → 타이핑 → 10초 카운트다운) |
| D1 generate-weekly | 후보 관리 → `+ 주간 후보 생성` | 2-step (dryRun 미리보기 → 실제 생성) |
| D2 approve | 후보 관리 → 다중 선택 → `선택 승인` | 벌크 액션 바 + reason |
| D3 cancel | 후보 관리 → 다중 선택 → `선택 취소` | 벌크 액션 바 + reason |
| E1 blacklist add | 학교 관리 → `+ 블랙리스트 추가` | 학교 검색 다이얼로그 |
| E2 blacklist remove | 학교 관리 → 블랙리스트 행 제거 | 확인 모달 + reason |
| E3-C archetype | 아키타입 → `+ 아키타입 생성` | 폼 (이름/설명/ageRange/mbtiPool/keywordPool) |
| E3-U archetype update | 아키타입 → 행 편집 | 동일 폼 재사용 |
| E4 phase-school | 학교 관리 → Phase-School 탭 | 학교 행 편집 (bucket/phase) |

---

## 공통 컴포넌트

### `<ReasonInput />`
- 모든 mutation form에 embed
- minLength props (기본 10, 롤백은 100)
- 서버 검증 실패 시 에러 메시지 인라인 표시

### `<StatusBar />`
- React Query `useQuery('ai-profiles-status')` 5초 폴링
- Feature Flag / 침투율 / 활성 Ghost 수 실시간 표시

### `<RollbackGate />`
- 3단계: reason → typing confirm → countdown
- 10초 카운트다운 중 취소 가능
- 실행 후 결과 토스트 + 감사 로그 링크

### `<GhostListToggle />`
- `localStorage`에 뷰 모드 저장
- 테이블/카드 뷰 간 필터/정렬/페이지 상태 보존

### `<AuditTrailDrawer />`
- 각 리소스 우상단에 "감사 로그" 버튼
- `ghost_audit_events` 조회 (추후 API 추가 필요)

---

## 안전장치 요약

| 리스크 | 방어 |
|---|---|
| 실수로 Feature Flag ON | 확인 모달 + 상태 배지 상시 노출 |
| 실수로 전체 롤백 | reason 100자+ + 타이핑 + 10초 카운트다운 3중 게이트 |
| 침투율 Cap 과다 설정 | 슬라이더 경고 색상 + 현재 실측치 동시 표시 |
| reason 누락 | UI validation + 서버 400 응답 |
| 후보 대량 생성 오작동 | dryRun 미리보기 강제 2-step |
| 목록 뷰 토글 시 상태 손실 | URL query + localStorage 이중 보존 |

---

## Phase 분할 제안 (구현 시)

| Phase | 범위 | 근거 |
|---|---|---|
| **Phase 1** | 아키타입 관리(E3) + 학교 관리(E1/E2/E4) + 정책 설정(B1/B2/C2) | 선행 데이터 등록 및 Flag 관리가 먼저 필요 |
| **Phase 2** | Ghost 관리(A1~A5) | Phase 1 데이터 기반으로 동작 |
| **Phase 3** | 후보 관리(D1/D2/D3) + 비상 롤백(C1) | 실제 발송 경로 — 가장 마지막 |

배포 시 Phase 3까지 완료해야 실제 운영 가능.

---

## 다음 단계

1. 이 스펙을 기반으로 `/autoplan` 호출 → 구현 계획 수립
2. `/plan-eng-review`로 아키텍처 확정 (컴포넌트 트리 / React Query 키 / 에러 경계)
3. Phase 1부터 구현 착수
