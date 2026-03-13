# Admin Hybrid Rewrite Design Spec

## 1. Overview

Project-Solo 어드민 대시보드(31개 페이지, 157개 파일)를 하이브리드 점진 전환 방식으로 재구축한다.
한 번에 전부 바꾸지 않고, 새 껍데기(Shell)를 먼저 세운 뒤 페이지를 하나씩 새 버전으로 교체한다.

### Decision Record

- **전환 방식**: 하이브리드 점진 전환 (big-bang 거부)
- **UI**: MUI 중심 + Tailwind 보조 (MUI는 shared component layer 뒤에 숨김)
- **런타임**: Next.js 14 / React 18 유지 (리팩토링 완료 후 별도 업그레이드)
- **데이터**: React Query (신규 설치)
- **폼**: react-hook-form + zod (신규 설치)
- **운영 정책**: 기존 어드민은 긴급 수정만 허용
- **리소스**: 사실상 1인

### Why

- 로그인 보안이 무력화됨 (middleware.ts line 17에서 `NextResponse.next()` 즉시 반환)
- 코드 유지보수 불가 상태 (`admin.ts` 4,756줄, console.log 83개 파일)
- 유지보수/리팩토링 없이 코드만 추가해와서 자주 고장나고 고치기 어려움
- 새 기능 추가 시 버그 위험 높음

### Constraints

- **백엔드(sometimes-api) 수정 금지**: 프로덕션 앱과 공유하는 서버이므로 수정 시 앱 전체가 터질 위험
- **별도 중간 프로젝트 금지**: 과거 별도 middle-layer 프로젝트를 두었다가 라우팅 혼란으로 프로덕션 터진 경험 있음. BFF는 반드시 Project-Solo 내부 route handler로만 구현
- **배포 단위는 Project-Solo 하나만 유지**

### Scope

- **포함**: 어드민 대시보드 31개 페이지 전체
- **제외**: 일반 사용자 페이지, 백엔드 API 계약 변경, 런타임 업그레이드

---

## 2. Current Baseline (코드베이스 탐색 결과)

| 항목 | 현재 상태 |
|------|-----------|
| Admin 디렉토리 | 31개 |
| Admin 파일 수 | 157개 |
| `app/services/admin.ts` | 4,756줄 |
| `'use client'` in admin | 103개 파일 |
| middleware 보호 | 우회됨 (line 17 즉시 반환) |
| `app/layout.tsx` | Client Component (anti-pattern) |
| `app/admin/layout.tsx` | Client Component, client-side admin 체크 |
| react-query | 미설치 |
| react-hook-form | 미설치 |
| zod | 미설치 |
| `features/admin` | 미존재 |
| `shared/auth` | 미존재 |
| `shared/ui/admin` | 미존재 |
| `shared/lib/http` | 미존재 |
| BFF routes (`app/api/admin/`) | 미존재 |
| 기존 문서 | `docs/ADMIN_MIGRATION_INVENTORY.md` 존재 (참고용) |

---

## 3. Transitional Architecture

### 3.1 BFF / Session Mechanism

백엔드 변경 없이 프론트엔드 내부에 보안 경계를 세운다.
Project-Solo 내부 route handler(`app/api/admin/`)로만 구현한다. 별도 프로젝트/서버 금지.

**CRITICAL: next.config.js rewrite 충돌 해결**

현재 `next.config.js`에 `{ source: '/api/admin/:path*', destination: '${backendUrl}/admin/:path*' }` rewrite 규칙이 있다. 이 규칙이 BFF route handler보다 먼저 실행되어 모든 `/api/admin/*` 요청을 백엔드로 프록시해버린다. Phase 1에서 반드시 해결해야 한다.

**해결 방식:** 기존 catch-all rewrite를 제거하고, BFF route handler가 처리하지 않는 레거시 엔드포인트만 개별 rewrite로 전환한다. `admin-proxy`가 이 역할을 대체하므로 기존 rewrite는 최종적으로 불필요해진다.

**신규 route handlers:**

| Route | Method | 역할 |
|-------|--------|------|
| `/api/admin/auth/login` | POST | 백엔드 `/auth/login` 프록시 → admin 확인 → httpOnly cookie 발급 |
| `/api/admin/auth/logout` | POST | cookie 정리 |
| `/api/admin/session` | GET | cookie 기반 토큰 유효성 검증, session DTO 반환 |
| `/api/admin/session/country` | POST | selectedCountry 변경 → meta cookie 재서명 |
| `/api/admin-proxy/[...path]` | ALL | cookie에서 token 읽어 백엔드로 Authorization + x-country 헤더 전달 |

**동작 규약:**

- `login`: 백엔드 `/auth/login` 프록시 → 응답의 `user/roles`에서 admin 확인 → admin이 아니면 403 → admin이면 `admin_access_token`을 `httpOnly`, `secure`, `sameSite=lax` cookie로 저장 + `admin_session_meta`를 서버 서명 cookie로 저장 (id, email, roles, issuedAt, selectedCountry만 포함)
- `session`: cookie 읽고 → `admin_access_token`으로 기존 `/profile` 호출 → 성공 시 session DTO 반환, 실패 시 cookie 정리 + 401
- `admin-proxy`: cookie에서 access token 읽어 → `Authorization` 헤더 붙여 전달. `admin_session_meta`에서 `selectedCountry`를 읽어 `x-country` 헤더로 전달. v2 페이지는 이 proxy를 통해 country context를 자동 전달받음.
- `session/country`: 클라이언트에서 country 변경 시 호출. `admin_session_meta` cookie를 재서명하여 `selectedCountry` 갱신. LegacyPageAdapter의 bridge도 localStorage를 동시 갱신.

**Cookie 서명 방식:**

- `iron-session` 라이브러리 사용 (Next.js route handler 전용, 경량)
- `admin_access_token`: httpOnly, secure, sameSite=lax cookie에 그대로 저장
- `admin_session_meta`: iron-session으로 암호화/서명 (id, email, roles, issuedAt, selectedCountry)
- 서명 secret: 환경변수 `ADMIN_SESSION_SECRET`에 저장
- middleware에서는 `admin_session_meta` cookie 존재 여부만 확인 (서명 검증은 route handler에서)

**명시적 제한:**

- Phase 1에서 silent refresh 미지원
- 세션 TTL: 8시간 (현재 프론트 기준)
- 토큰 만료 시 재로그인 요구
- 백엔드가 추후 refresh endpoint 제공 시 BFF 내부만 교체 (page contract 유지)

### 3.2 LegacyPageAdapter

새 Shell 안에서 기존 페이지를 임시 운영하는 과도기 컴포넌트.
단위는 페이지 전체. 개별 레거시 child component를 새 feature tree에 섞지 않음.

**각 레거시 route 구조:**
```
AdminShell
  └─ LegacyAuthBridgeProvider
       └─ LegacyCountryBridgeProvider
            └─ Error Boundary + Toast + Page Frame
                 └─ 기존 페이지 컴포넌트
```

**Bridge 규약:**

- 새 server-owned session 기준으로 레거시 localStorage 키를 mount 시 동기화:
  - `accessToken`, `user`, `isAdmin`, `admin_selected_country`
- country 변경 시 cookie와 legacy localStorage 동시 갱신
- logout 시 cookie와 legacy localStorage 모두 정리

**종료 조건:** 각 route가 새 feature 구현으로 승격되면 adapter 제거. 최종 단계에서 adapter 0개.

### 3.3 Feature Flags / Rollback

| Flag | 범위 | 용도 |
|------|------|------|
| `admin_shell_v2` | 전체 Shell | Shell 문제 시 false로 즉시 복귀 |
| `admin_route_mode.<route>` | 개별 페이지 | `legacy` → `legacy-adapted` → `v2` 전환 |

**Feature Flag 구현:**

- **저장소:** Supabase `admin_feature_flags` 테이블 (key text, value text, updated_at timestamp)
- **읽기:** 서버 측에서 middleware/layout에서 읽음. 클라이언트에는 layout에서 props로 전달.
- **변경:** Supabase 테이블 직접 수정 (배포 불필요, 즉시 반영)
- **캐시:** 서버 측에서 요청당 1회 조회, 1분 캐시. 긴급 rollback 시 최대 1분 이내 반영.
- **이유:** 환경변수 방식은 Vercel 재배포(2~3분)가 필요하므로 "5분 내 rollback" 불가. DB 기반은 배포 없이 즉시 가능.

**Rollback 규칙:**
- Shell 문제 → `admin_shell_v2=false` (DB에서 변경, 1분 내 반영)
- 개별 route 문제 → 해당 route만 `legacy-adapted` 또는 `legacy`로 즉시 복귀
- `matching-management` 같이 구조가 크게 바뀌는 route는 최소 1 wave 동안 legacy fallback 유지
- rollback은 DB flag 변경만으로 1분 내 완료

---

## 4. Phased Plan

### Phase 0: Baseline and Freeze (1~2주)

**목표:** 현황 파악, 작업 규칙 확립

- pnpm 단일화:
  - `package-lock.json` 제거, `pnpm-lock.yaml` 생성
  - `.npmrc`에 `shamefully-hoist=true` 설정 (MUI/Emotion hoisting 호환)
  - Vercel build 설정에서 install command를 `pnpm install`로 변경
  - 모든 의존성 정상 resolve 확인
- 기존 어드민 freeze 정책 문서화
- 신규 inventory 작성 (기존 ADMIN_MIGRATION_INVENTORY.md는 참고만):
  - route inventory (31개 페이지 전수조사)
  - API inventory (admin.ts 4,756줄 분석)
  - broken-control inventory (무법 코드 목록)
  - auth/localStorage inventory
- 품질 게이트 정의:
  - `typecheck:admin-v2` (범위: `app/admin`, `features/admin`, `shared/auth`, `shared/ui/admin`, `shared/lib/http`)
  - `lint:admin-v2`
- `ignoreBuildErrors`는 Phase 0 동안만 유지 (레거시 오류 때문에 foundation 착수 불가 방지)
- 신규 코드 범위에는 오류 0 강제

### Phase 1: Foundation (2~3주)

**목표:** 새 Shell + 보안 + 모든 기존 페이지가 새 Shell 안에서 동작

- `app/layout.tsx` → Server Component로 복귀
- `app/admin/layout.tsx` → 새 `AdminShell`로 교체
- `middleware.ts` → cookie 기반 보호 로직을 처음부터 새로 작성 (기존 주석 처리된 코드는 header 기반이라 재사용 불가)
- `shared/auth`, `shared/lib/http`, `shared/ui/admin` 생성
- BFF route handlers 도입 (`app/api/admin/`)
- `next.config.js` rewrite 규칙 마이그레이션: `/api/admin/:path*` catch-all 제거 → BFF route handler가 처리
- `LegacyPageAdapter` 도입
- `next.config.js` 정리 (dev hack 제거, reactStrictMode 활성화)
- 신규 의존성 설치:
  - `@tanstack/react-query` (서버 상태 관리)
  - `react-hook-form` + `zod` + `@hookform/resolvers` (폼/검증)
  - `iron-session` (cookie 서명)
  - `@testing-library/react` + `@testing-library/jest-dom` (테스트)
  - `playwright` (E2E 테스트, Phase 2부터 사용)
- TypeScript 5.3으로 마이너 업그레이드 (zod, react-query가 TS 5.x 기능 필요. 컴파일 전용, 런타임 변경 없음)

**완료 조건:**
- `/admin/*` 전체가 새 Shell 아래서 동작
- 레거시 페이지도 adapter를 통해 새 Shell에서 열림
- 신규 foundation 코드의 lint/typecheck 0

### Phase 2: Prove the Foundation (1~2주)

**목표:** 새 패턴이 실제로 동작함을 증명

**대상:** `dashboard`, `kpi-report`

- server session + BFF + React Query + 공통 page template 패턴 검증
- chart/table/filter/status UI 규약 검증

**완료 조건:**
- 두 route가 `v2`로 승격
- route flag로 legacy/v2 전환 가능
- 공통 shell과 feedback contract 안정화

### Phase 3A: High-Risk Operational Pages (3~4주)

**목표:** 가장 자주 쓰는 운영 페이지 전환

**대상:** `users`, `profile-review`, `push-notifications`

**특별 규칙:**
- fake filter 금지
- `alert/confirm/window.location.href` 금지
- browser-local 운영 상태 금지
- page 파일에서 fetch/pagination/filter/modal/mutation 동시 구현 금지

**완료 조건:**
- 각 route에 integration test 존재
- route flags로 즉시 rollback 가능

### Phase 3B: Matching Management Rewrite (3~4주)

**목표:** 가장 복잡한 페이지를 안전하게 분해

**대상:** `matching-management`

- 거대 단일 페이지를 작업별 sub-route 또는 workflow page로 분해
- 최소 1 wave 동안 legacy fallback 유지
- Phase 3A에서 패턴이 안정된 뒤 착수

### Phase 4: Messaging and Moderation (3~4주)

**대상:** `reports`, `sms`, `support-chat`, `community`

- moderation, queue, bulk action, messaging UX 표준화
- reusable split-pane / queue / compose patterns 정립

### Phase 5: Remaining Domains (3~5주)

**대상 (21개 페이지):**

| Route | 카테고리 |
|-------|----------|
| `sales` | 수익 |
| `scheduled-matching` | 매칭 |
| `force-matching` | 매칭 |
| `universities` | 데이터 |
| `card-news` | 콘텐츠 |
| `banners` | 콘텐츠 |
| `sometime-articles` | 콘텐츠 |
| `ai-chat` | 기능 |
| `moment` | 기능 |
| `chat` | 소통 |
| `likes` | 데이터 |
| `dormant-likes` | 데이터 |
| `deleted-females` | 데이터 |
| `female-retention` | 데이터 |
| `fcm-tokens` | 시스템 |
| `gems` | 수익 |
| `ios-refund` | 수익 |
| `reset-password` | 시스템 |
| `app-reviews` | 콘텐츠 |
| `version-management` | 시스템 |
| `lab` | 실험 |

- legacy adapter 의존 빠르게 축소

### Phase 6: Legacy Removal and Global Gate Restoration (1~2주)

- `app/services/admin.ts` 제거
- old auth/session/localStorage trust 제거
- old adapters 제거
- production admin 코드 `console.log` 제거
- 전역 `ignoreBuildErrors` 제거
- 최종 보안 점검

---

## 5. New Directory Structure

```
app/
├── api/admin/                    # BFF route handlers (NEW)
│   ├── auth/login/route.ts
│   ├── auth/logout/route.ts
│   ├── session/route.ts
│   ├── session/country/route.ts
│   └── admin-proxy/[...path]/route.ts
├── admin/
│   ├── layout.tsx                # AdminShell (REWRITE)
│   ├── dashboard/page.tsx        # Phase 2 rewrite
│   ├── kpi-report/page.tsx       # Phase 2 rewrite
│   └── ...                       # Other pages (phased rewrite)
├── layout.tsx                    # Server Component (REWRITE)
└── ...

features/admin/                   # Feature modules (NEW)
├── dashboard/
├── kpi-report/
├── users/
└── ...

shared/                           # Shared modules (NEW)
├── auth/                         # Session, auth hooks
├── lib/http/                     # HTTP client, React Query setup
└── ui/admin/                     # Admin shared components (MUI wrapped)
```

---

## 6. Tech Stack Changes

| Category | Before | After |
|----------|--------|-------|
| Server State | Direct axios in components | React Query hooks |
| Forms | Raw controlled inputs | react-hook-form + zod |
| Auth | localStorage + client-side check | httpOnly cookie + BFF + middleware |
| Layout | Client Component root | Server Component root + client Shell |
| Error Handling | console.log + alert() | Error boundary + toast |
| API Layer | `admin.ts` 4,756줄 monolith | Feature-scoped query/mutation hooks |

---

## 7. Test Plan

**기본 게이트:**
- `pnpm lint`
- `pnpm typecheck:admin-v2`
- `pnpm test`
- rewritten routes 기준 `pnpm build`

**Unit/Integration (Jest/RTL):**
- `shared/auth` (session, hooks)
- BFF handlers (login, logout, session, proxy)
- React Query hooks
- shared admin components
- `LegacyPageAdapter` bridge 동기화

**E2E (Playwright):**
- admin login/logout
- 비관리자 접근 차단
- dashboard / kpi-report
- users filter
- profile-review actions
- push-notification dry-run/send
- matching-management 핵심 작업

---

## 8. Monitoring

**최소 수집 항목:**
- `/api/admin/session` 401 비율
- `/api/admin-proxy/*` 5xx 비율
- route-level render error 수
- mutation failure rate
- route flag별 traffic 비율
- fallback-to-legacy 횟수

**구현:** server route structured logs + client error boundary reporting

**목표:** 새 route가 legacy보다 에러율이 높으면 즉시 rollback 판단 가능

---

## 9. Rollout / Rollback

- rollout은 route 단위로만 진행
- 한 번에 1~2개 route만 승격
- rollback은 flag 전환만으로 5분 내 완료
- route structure 변경 시에도 legacy fallback URL은 1 wave 유지

---

## 10. Timeline

모든 phase는 **순차 진행** (1인 팀이므로 병렬 불가).

| Phase | Duration | Cumulative (min) | Cumulative (max) |
|-------|----------|-------------------|-------------------|
| Phase 0 | 1~2주 | 1주 | 2주 |
| Phase 1 | 2~3주 | 3주 | 5주 |
| Phase 2 | 1~2주 | 4주 | 7주 |
| Phase 3A | 3~4주 | 7주 | 11주 |
| Phase 3B | 3~4주 | 10주 | 15주 |
| Phase 4 | 3~4주 | 13주 | 19주 |
| Phase 5 | 3~5주 | 16주 | 24주 |
| Phase 6 | 1~2주 | 17주 | 26주 |

**총 예상: 17~26주 (약 4~6개월)**

Phase 5의 페이지가 21개로 확대되었으므로 상한(5주)에 가까울 가능성이 높음.

### Assumptions

- 사실상 1인 진행
- 기존 어드민은 긴급 수정만
- 백엔드 API 계약 변경은 범위 밖
- silent refresh는 후순위
- MUI는 shared component layer 뒤에 숨겨서 vendor coupling 축소
