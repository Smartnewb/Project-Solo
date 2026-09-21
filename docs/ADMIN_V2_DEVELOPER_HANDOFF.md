# Admin V2 마이그레이션 - 개발자 핸드오프 가이드

**작성일**: 2026-03-13
**대상**: 다음 단계 작업을 이어받는 개발자
**현재 상태**: Phase 1 완료, Phase 2~4 진행 예정

---

## 1. 프로젝트 한 줄 요약

> 30+ 어드민 페이지를 레거시(localStorage 인증, 직접 API 호출)에서 v2(쿠키 인증, BFF 프록시, React Query)로 **페이지 단위로 점진 전환**하는 프로젝트.
> Feature flag로 즉시 롤백 가능.

---

## 2. 현재 완료된 것 (Phase 0~1)

### 이미 구축된 인프라

```
shared/
├── auth/                          # 쿠키 기반 인증 시스템
│   ├── session-config.ts          # iron-session 설정 (8시간 만료)
│   ├── cookies.ts                 # admin_access_token 쿠키 읽기/쓰기
│   ├── admin-auth-contract.ts     # 인증 타입 정의
│   ├── admin-session-user.ts      # 세션 유저 타입
│   └── index.ts                   # 모듈 exports
├── feature-flags/
│   └── index.ts                   # Vercel Edge Config 기반 feature flag
├── ui/admin/
│   ├── admin-shell.tsx            # v2 레이아웃 (사이드바, 헤더)
│   ├── sidebar.tsx                # 사이드바 네비게이션
│   ├── header.tsx                 # 상단 헤더
│   ├── legacy-page-adapter.tsx    # 레거시 페이지 래퍼
│   ├── legacy-auth-bridge.tsx     # 쿠키 → localStorage 단방향 동기화
│   ├── legacy-country-bridge.tsx  # 국가 설정 동기화
│   ├── admin-country-selector.tsx # 국가 선택 모달
│   └── loading.tsx                # 로딩 UI
└── lib/http/
    ├── admin-fetch.ts             # BFF용 fetch 클라이언트 (adminGet, adminPost 등)
    ├── admin-axios-interceptor.ts # patchAdminAxios() - axios를 BFF로 우회
    └── index.ts

app/api/
├── admin-proxy/[...path]/route.ts # BFF 프록시 (쿠키에서 토큰 읽어 백엔드 전달)
└── admin/auth/
    ├── login/route.ts             # 로그인 → 쿠키 세팅
    ├── logout/route.ts            # 로그아웃 → 쿠키 삭제
    ├── refresh/route.ts           # 토큰 갱신
    └── sync/route.ts              # 세션 동기화
```

### 이미 변환된 페이지 (6개)

| 페이지 | 파일 구조 |
|--------|----------|
| dashboard | `page.tsx` (라우터) + `dashboard-legacy.tsx` + `dashboard-v2.tsx` + `hooks.ts` |
| kpi-report | `page.tsx` (라우터) + `kpi-report-legacy.tsx` + `kpi-report-v2.tsx` |
| users | `page.tsx` (라우터) + `users-legacy.tsx` + `users-v2.tsx` |
| profile-review | `page.tsx` (라우터) + `profile-review-legacy.tsx` + `profile-review-v2.tsx` |
| push-notifications | `page.tsx` (라우터) + `push-notifications-legacy.tsx` + `push-notifications-v2.tsx` |
| matching-management | `page.tsx` (라우터) + `matching-management-legacy.tsx` + `matching-management-v2.tsx` |

---

## 3. 핵심 아키텍처

### 인증 흐름

```
[사용자 로그인]
    ↓
/api/admin/auth/login (BFF)
    ↓ 백엔드로 credentials 전달
    ↓ 응답 받으면:
    ├── admin_access_token 쿠키 세팅 (httpOnly)
    ├── admin_refresh_token 쿠키 세팅 (httpOnly)
    └── admin_session_meta 쿠키 세팅 (iron-session, 암호화)
    ↓
[v2 페이지 API 호출]
    ↓
/api/admin-proxy/[...path] (BFF 프록시)
    ↓ 쿠키에서 admin_access_token 읽기
    ↓ Authorization 헤더에 넣어서 백엔드 전달
    ↓
[백엔드 응답 → 클라이언트]
```

### 레거시 vs v2 비교

| 항목 | 레거시 (v1) | v2 |
|------|------------|-----|
| 인증 토큰 저장 | localStorage | httpOnly 쿠키 |
| API 호출 | 클라이언트 → 백엔드 직접 | 클라이언트 → BFF → 백엔드 |
| 데이터 페칭 | useState + useEffect + axios | React Query + adminFetch |
| CORS | 문제 발생 가능 | BFF가 서버에서 호출하므로 없음 |
| 레이아웃 | LegacyAdminLayout | AdminShell |

### Feature Flag 시스템

```typescript
// shared/feature-flags/index.ts
// Vercel Edge Config에서 값을 읽음

// 1. 전체 v2 셸 활성화 여부
await isAdminShellV2Enabled()  // Edge Config key: "admin_shell_v2"

// 2. 페이지별 모드 제어
await getRouteMode('dashboard')  // Edge Config key: "admin_route_mode_dashboard"
// 반환값: 'legacy' | 'legacy-adapted' | 'v2'
```

### 페이지 라우팅 패턴

```typescript
// app/admin/{페이지}/page.tsx (서버 컴포넌트)
import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';

export default async function DashboardPage() {
  const isV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('dashboard');

  if (isV2 && mode === 'v2') {
    return <DashboardV2 />;
  }
  return <DashboardLegacy />;
}
```

---

## 4. Feature Flag 설정 방법

### Edge Config 접속

1. [Vercel Dashboard](https://vercel.com) → Storage → `project-solo-flags`
2. Items 탭에서 JSON 편집

### 전체 플래그 목록

```json
{
  "admin_shell_v2": true,
  "admin_route_mode_dashboard": "v2",
  "admin_route_mode_users": "v2",
  "admin_route_mode_community": "v2",
  "admin_route_mode_push-notifications": "v2",
  "admin_route_mode_profile-review": "v2",
  "admin_route_mode_sales": "v2",
  "admin_route_mode_matching-management": "v2",
  "admin_route_mode_scheduled-matching": "v2",
  "admin_route_mode_force-matching": "v2",
  "admin_route_mode_chat": "v2",
  "admin_route_mode_support-chat": "v2",
  "admin_route_mode_sms": "v2",
  "admin_route_mode_reports": "v2",
  "admin_route_mode_banners": "v2",
  "admin_route_mode_card-news": "v2",
  "admin_route_mode_sometime-articles": "v2",
  "admin_route_mode_gems": "v2",
  "admin_route_mode_likes": "v2",
  "admin_route_mode_dormant-likes": "v2",
  "admin_route_mode_moment": "v2",
  "admin_route_mode_fcm-tokens": "v2",
  "admin_route_mode_version-management": "v2",
  "admin_route_mode_universities": "v2",
  "admin_route_mode_reset-password": "v2",
  "admin_route_mode_ios-refund": "v2",
  "admin_route_mode_female-retention": "v2",
  "admin_route_mode_deleted-females": "v2",
  "admin_route_mode_kpi-report": "v2",
  "admin_route_mode_app-reviews": "v2",
  "admin_route_mode_ai-chat": "v2",
  "admin_route_mode_lab": "v2"
}
```

### 주의: Flag 켜기 전에 반드시 다시 로그인!

v2는 쿠키 기반 인증을 사용합니다. 기존 세션(localStorage만 있는 상태)에서 flag를 켜면 **401 에러**가 발생합니다.

**해결**: 로그아웃 → 다시 로그인하면 v2 로그인 플로우가 쿠키를 세팅합니다.

### 롤백 방법

문제 발생 시 Edge Config에서 해당 키를 `"legacy-adapted"` 또는 삭제 → **즉시 레거시로 복구** (배포 불필요, ~1분)

---

## 5. 남은 작업: 25개 페이지 v2 변환

### 변환 대상 페이지 (우선순위 순)

#### Phase 1: Quick Wins (8개, 약 3시간)

| # | 페이지 | 코드량 | 예상 시간 |
|---|--------|-------|----------|
| 1 | force-matching | 28줄 | 10분 |
| 2 | moment | 49줄 | 15분 |
| 3 | sms | 57줄 | 20분 |
| 4 | scheduled-matching | 76줄 | 20분 |
| 5 | lab | 78줄 | 20분 |
| 6 | chat | 103줄 | 25분 |
| 7 | app-reviews | 119줄 | 30분 |
| 8 | support-chat | 185줄 | 40분 |

#### Phase 2: Standard Pages (14개, 약 15시간)

| # | 페이지 | 코드량 | 예상 시간 | 특이사항 |
|---|--------|-------|----------|---------|
| 9 | banners | 266줄 | 45분 | admin service 사용 |
| 10 | sales | 266줄 | 45분 | |
| 11 | fcm-tokens | 294줄 | 60분 | admin service 사용 |
| 12 | universities | 302줄 | 60분 | admin service 사용, 서브라우트(clusters) |
| 13 | deleted-females | 316줄 | 60분 | admin service 사용 |
| 14 | reset-password | 320줄 | 60분 | admin service 사용 |
| 15 | ios-refund | 346줄 | 60분 | admin service 사용 |
| 16 | dormant-likes | 352줄 | 75분 | admin service 사용, 모달 |
| 17 | card-news | 355줄 | 60분 | admin service 사용, 서브라우트(edit, create) |
| 18 | sometime-articles | 371줄 | 60분 | admin service 사용 |
| 19 | female-retention | 374줄 | 60분 | admin service 사용 |
| 20 | version-management | 427줄 | 60분 | **useAuth() 사용 - 주의** |
| 21 | likes | 431줄 | 75분 | admin service 사용 |
| 22 | ai-chat | 445줄 | 75분 | admin service 사용 |

#### Phase 3: Complex Pages (3개, 약 12시간)

| # | 페이지 | 코드량 | 예상 시간 | 주의사항 |
|---|--------|-------|----------|---------|
| 23 | gems | 698줄 | 90분 | pricing 서브모듈 |
| 24 | reports | 1,120줄 | 120분 | 복잡한 필터링/내보내기 |
| 25 | community | 1,864줄 | 150분 | **최대 페이지, useAuth() 사용, 분해 필요** |

---

## 6. 페이지 변환 방법 (Step-by-Step)

### Step 1: 레거시 코드 추출

현재 `page.tsx`의 내용을 `{page-name}-legacy.tsx`로 이동합니다.

```typescript
// app/admin/force-matching/force-matching-legacy.tsx
'use client';

import { LegacyPageAdapter } from '@/shared/ui/admin/legacy-page-adapter';

export default function ForceMatchingLegacy() {
  // 기존 page.tsx의 전체 코드를 여기로 이동
  return <LegacyPageAdapter>{/* 기존 내용 */}</LegacyPageAdapter>;
}
```

### Step 2: v2 컴포넌트 생성

레거시를 복사한 뒤 `LegacyPageAdapter` → `patchAdminAxios()` 호출로 변경합니다.

```typescript
// app/admin/force-matching/force-matching-v2.tsx
'use client';

import { useEffect } from 'react';
import { patchAdminAxios } from '@/shared/lib/http/admin-axios-interceptor';

export default function ForceMatchingV2() {
  useEffect(() => { patchAdminAxios(); }, []);

  // 기존 내용 (LegacyPageAdapter 제거, 나머지 동일)
  return <>{/* 기존 내용 */}</>;
}
```

### Step 3: page.tsx를 라우터로 변경

```typescript
// app/admin/force-matching/page.tsx
import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import ForceMatchingLegacy from './force-matching-legacy';
import ForceMatchingV2 from './force-matching-v2';

export default async function ForceMatchingPage() {
  const isV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('force-matching');

  if (isV2 && mode === 'v2') {
    return <ForceMatchingV2 />;
  }
  return <ForceMatchingLegacy />;
}
```

### Step 4 (선택): React Query 훅 추가

API 호출이 많은 페이지라면 `hooks.ts`를 만들어 React Query로 전환합니다.

```typescript
// app/admin/force-matching/hooks.ts
import { useQuery } from '@tanstack/react-query';
import { adminGet } from '@/shared/lib/http/admin-fetch';

export function useForceMatchingData() {
  return useQuery({
    queryKey: ['force-matching'],
    queryFn: () => adminGet('/api/admin/force-matching'),
  });
}
```

### Step 5: 검증

```bash
pnpm quality:admin-v2   # 타입체크 + 린트
pnpm build              # 빌드 확인
# Edge Config에서 해당 페이지 flag를 "v2"로 → 동작 확인
# Edge Config에서 해당 페이지 flag를 "legacy-adapted"로 → 레거시 동작 확인
```

---

## 7. 참고할 패턴 (이미 구현된 예시)

변환 시 아래 파일들을 참고하세요:

| 참고 대상 | 파일 경로 |
|----------|----------|
| 가장 단순한 라우터 | `app/admin/dashboard/page.tsx` (14줄) |
| 레거시 분리 | `app/admin/dashboard/dashboard-legacy.tsx` |
| v2 컴포넌트 | `app/admin/dashboard/dashboard-v2.tsx` |
| React Query 훅 | `app/admin/dashboard/hooks.ts` |
| BFF fetch 클라이언트 | `shared/lib/http/admin-fetch.ts` |
| BFF 프록시 | `app/api/admin-proxy/[...path]/route.ts` |
| Feature flag | `shared/feature-flags/index.ts` |

---

## 8. 절대 하면 안 되는 것

1. **새 API 엔드포인트 만들지 않기** — 기존 `app/services/admin.ts` 함수 재사용
2. **기존 서비스 레이어 수정하지 않기** — `admin.ts`는 레거시+v2 공용
3. **기존 서브 컴포넌트 수정하지 않기** — `components/` 안의 파일은 양쪽에서 공유
4. **request/response 형태 바꾸지 않기** — BFF는 투명 프록시
5. **백엔드 수정하지 않기** — 프로덕션 백엔드(sometimes-api)는 수정 금지

---

## 9. QA 테스트 방법

### 테스트 전 준비

1. Vercel Edge Config에서 테스트할 페이지의 flag를 `"v2"`로 설정
2. **반드시 다시 로그인** (기존 세션은 쿠키가 없어서 401 에러 발생)

### 각 페이지 체크리스트

- [ ] 페이지가 정상 로딩되는가 (흰 화면, 에러 없음)
- [ ] 데이터가 표시되는가 (401 에러 없음)
- [ ] 사이드바 네비게이션이 작동하는가
- [ ] 기존 기능(검색, 필터, 페이지네이션)이 동작하는가
- [ ] CRUD 작업이 정상 동작하는가 (해당되는 경우)
- [ ] 모달/다이얼로그가 열리고 닫히는가 (해당되는 경우)

### 롤백 테스트

- [ ] Edge Config에서 flag를 `"legacy-adapted"`로 변경
- [ ] 페이지가 레거시 모드로 즉시 돌아가는가

---

## 10. 알려진 이슈

| 이슈 | 상태 | 영향 |
|------|------|------|
| `/admin/users` v2 모드에서 로딩 에러 발생 가능 | 미조사 | users 페이지 v2 전환 시 확인 필요 |
| 레거시 로그인 상태에서 v2 flag 켜면 401 | 의도된 동작 | 다시 로그인하면 해결 |
| 배너 관리 페이지 빈 상태 | 백엔드 이슈 | v2와 무관, 데이터 없음 |
| 대시보드 인사이트 API 오류 | 백엔드 이슈 | v2와 무관, 기존에도 동일 |

---

## 11. 환경 변수

```env
# 기존 (변경 없음)
NEXT_PUBLIC_API_URL=           # 백엔드 API URL
NEXT_PUBLIC_SUPABASE_URL=      # Supabase URL (레거시)
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Supabase anon key (레거시)

# v2에서 추가된 것
EDGE_CONFIG=                   # Vercel Edge Config 연결 문자열 (자동 세팅됨)
ADMIN_SESSION_SECRET=          # iron-session 암호화 키 (32자 이상)
```

---

## 12. 품질 게이트 명령어

```bash
pnpm quality:admin-v2    # TypeScript 타입체크 + ESLint (v2 스코프만)
pnpm typecheck:admin-v2  # TypeScript만
pnpm lint:admin-v2       # ESLint만
pnpm build               # 전체 빌드
pnpm dev                 # 개발 서버
```

---

## 13. 타임라인 추정

| 단계 | 페이지 수 | 예상 소요 | 비고 |
|------|----------|----------|------|
| Quick Wins | 8개 | 3시간 | 병렬 작업 가능 |
| Standard Pages | 14개 | 15시간 | 배치 단위 처리 권장 |
| Complex Pages | 3개 | 12시간 | 개별 처리, 분해 검토 필요 |
| **합계** | **25개** | **~30시간** | 2~3주 집중 작업 |

---

## 14. 관련 문서 목록

| 문서 | 위치 | 내용 |
|------|------|------|
| 이 핸드오프 가이드 | `docs/ADMIN_V2_DEVELOPER_HANDOFF.md` | 개발자 온보딩 |
| Executive Summary | `ADMIN_V2_CONVERSION_EXECUTIVE_SUMMARY.md` | 전체 현황 요약 |
| Phase별 체크리스트 | `ADMIN_V2_PHASES_DELIVERABLES.md` | 상세 deliverables |
| Quick Reference | `ADMIN_V2_QUICK_REFERENCE.md` | 빠른 참조 |
| Quick Lookup | `ADMIN_V2_QUICK_LOOKUP.txt` | 페이지별 코드량/시간 |
| 상세 감사 보고서 | `admin-pages-v2-audit.md` | 25개 페이지 상세 분석 |
| QA 검증 보고서 | `ADMIN_V2_QA_REPORT.md` | 34페이지 전수 QA 결과 |
| 아키텍처 다이어그램 | `memory/AI/diagrams/` | 시스템 구조, ERD, API |
