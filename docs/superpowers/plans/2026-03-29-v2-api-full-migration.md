# V2 API 전체 마이그레이션 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 프론트엔드(Project-Solo)의 모든 레거시 API 호출(axiosServer 250회, 18개 파일)을 V2 백엔드 엔드포인트 + BFF 프록시(adminRequest)로 전환

**Architecture:** 백엔드에 없는 10개 도메인의 V2 컨트롤러를 생성하고, 프론트엔드 18개 서비스를 adminRequest(BFF)로 통일. 모든 V2 응답은 `V2ResponseInterceptor`로 `{ data: T }` 래핑되므로 프론트에서 언래핑 필요.

**Tech Stack:** NestJS (backend V2 controllers), Next.js (frontend adminRequest/BFF proxy), PostgreSQL (kr schema verification)

**관련 설계 문서:** `docs/superpowers/specs/2026-03-27-project-solo-normalization-design.md`

---

## 사전 지식

### V2 응답 래핑 패턴

백엔드 `V2ResponseInterceptor`가 모든 V2 응답을 `{ data: T }`로 래핑:
```typescript
// 백엔드 반환: { totalRevenue: 123 }
// 클라이언트 수신: { data: { totalRevenue: 123 } }
```

프론트엔드에서 반드시 언래핑 필요:
```typescript
// ❌ 잘못됨
const result = await adminRequest<MyType>('/admin/v2/endpoint');

// ✅ 올바름
interface V2Response<T> { data: T; }
const res = await adminRequest<V2Response<MyType>>('/admin/v2/endpoint');
return res.data;
```

### BFF 프록시 경로

- 레거시: `axiosServer` → `/api-proxy/` (next.config.js rewrite) → 백엔드
- V2: `adminRequest` → `/api/admin-proxy/` (BFF route handler) → 백엔드
- BFF 프록시의 `ALLOWED_PATH_PREFIXES`에 새 경로 추가 필요

### 공통 파일 위치

| 항목 | 경로 |
|------|------|
| 프론트 BFF 클라이언트 | `shared/lib/http/admin-fetch.ts` |
| 프론트 BFF 프록시 | `app/api/admin-proxy/[...path]/route.ts` |
| 프론트 레거시 axios | `utils/axios.ts` |
| 프론트 서비스 배럴 | `app/services/admin/index.ts` |
| 백엔드 V2 모듈 | `src/admin/v2/admin-v2.module.ts` |
| 백엔드 V2 인터셉터 | `src/admin/v2/common/interceptors/v2-response.interceptor.ts` |
| 백엔드 V2 필터 | `src/admin/v2/common/filters/v2-exception.filter.ts` |

---

## Phase A: V2 백엔드가 이미 있는 8개 도메인 — 프론트엔드 전환

이미 V2 컨트롤러가 있으므로 프론트엔드 서비스만 전환.

### Task A1: revenue (프론트 전환)

**현재 상태:** revenue-v2.ts는 이미 V2 사용 중 (방금 수정). RevenueOverview에서 레거시 `getExtendedRevenue` 병행 표시.

**Files:**
- Modify: `repos/Project-Solo/app/admin/dashboard/components/RevenueOverview.tsx`
- Modify: `repos/Project-Solo/app/services/dashboard.ts` (getExtendedRevenue 제거)

- [ ] **Step 1:** RevenueOverview에서 레거시 `getExtendedRevenue` 호출 제거, V2 `useRevenueSummary`를 메인 수치로 승격
- [ ] **Step 2:** "V2 API (검증 중)" 섹션 제거, V2 데이터를 메인 매출 카드에 표시
- [ ] **Step 3:** `dashboard.ts`에서 `getExtendedRevenue`, `EXTENDED_REVENUE` 엔드포인트 제거
- [ ] **Step 4:** 빌드 확인: `pnpm build` 에러 없음
- [ ] **Step 5:** 커밋

### Task A2: dashboard (프론트 전환)

**V2 엔드포인트:**
- `GET /admin/v2/dashboard/summary` — 통합 요약
- `GET /admin/v2/dashboard/revenue` — 확장 매출
- `GET /admin/v2/dashboard/signups` — 시간별 가입자

**Files:**
- Modify: `repos/Project-Solo/app/services/dashboard.ts`
- Modify: `repos/Project-Solo/app/admin/dashboard/hooks.ts`
- Modify: `repos/Project-Solo/app/admin/dashboard/dashboard-v2.tsx`

- [ ] **Step 1:** `dashboard.ts`의 `getSummary`, `getHourlySignups` 등을 V2 엔드포인트(`/admin/v2/dashboard/*`)로 변경 + `{ data }` 언래핑
- [ ] **Step 2:** 기존 V1 대시보드 엔드포인트 상수 제거
- [ ] **Step 3:** 빌드 확인
- [ ] **Step 4:** 커밋

### Task A3: users (프론트 전환)

**V2 엔드포인트:**
- `GET /admin/v2/users` — 목록 (통합 검색/필터/페이지네이션)
- `GET /admin/v2/users/:userId` — 상세
- `PATCH /admin/v2/users/:userId/appearance` — 외모 등급
- `PATCH /admin/v2/users/appearance/bulk` — 벌크 외모 등급

**Files:**
- Modify: `repos/Project-Solo/app/services/admin/users.ts`

- [ ] **Step 1:** `userAppearance` 객체의 메서드들을 V2 엔드포인트 + `adminRequest`로 전환
- [ ] **Step 2:** V2에 없는 기능(상태변경, 경고, 삭제, 젬 지급 등)은 `adminGet/adminPost`로 기존 V1 경로 유지하되 `axiosServer` → `adminRequest` 전환
- [ ] **Step 3:** `deletedFemales`, `userEngagement` 도 `adminRequest`로 전환
- [ ] **Step 4:** `import axiosServer from '@/utils/axios'` 제거
- [ ] **Step 5:** 빌드 확인
- [ ] **Step 6:** 커밋

### Task A4: stats (프론트 전환)

**V2 엔드포인트:**
- `GET /admin/v2/stats/users` — 유저 통계
- `GET /admin/v2/stats/users/trend` — 가입 추이
- `GET /admin/v2/stats/sales` — 매출 통계
- `GET /admin/v2/stats/sales/trend` — 매출 추이
- `GET /admin/v2/stats/sales/analysis` — 매출 분석
- `GET /admin/v2/stats/withdrawals` — 탈퇴 통계

**Files:**
- Modify: `repos/Project-Solo/app/services/admin/dashboard.ts` (stats 부분)
- Modify: `repos/Project-Solo/app/services/sales.ts`

- [ ] **Step 1:** `stats` 객체의 메서드들을 V2 엔드포인트로 전환
- [ ] **Step 2:** `salesService`를 `stats-v2` 엔드포인트로 전환
- [ ] **Step 3:** `axiosServer` import 제거
- [ ] **Step 4:** 빌드 확인
- [ ] **Step 5:** 커밋

### Task A5: reports + profile-review (프론트 전환)

**V2 엔드포인트:**
- Reports: `GET /admin/v2/reports`, `GET /:id`, `PATCH /:id/status`
- Profile Review: `GET /pending`, `GET /users/:id`, `POST /images/:id/action`, `POST /users/:id/approve-profile`, `POST /users/:id/reject-profile`, `PATCH /users/:id/rank`, `GET /history`

**Files:**
- Modify: `repos/Project-Solo/app/services/admin/moderation.ts`

- [ ] **Step 1:** `reports` 객체를 V2 엔드포인트로 전환. 응답 구조 변환 로직 필요 시 유지
- [ ] **Step 2:** `userReview`, `profileImages` 객체를 V2 profile-review 엔드포인트로 전환
- [ ] **Step 3:** `axiosServer` import 제거
- [ ] **Step 4:** 빌드 확인
- [ ] **Step 5:** 커밋

### Task A6: chat + ai-chat (프론트 전환)

**V2 엔드포인트:**
- Chat: `GET /admin/v2/chat/rooms`, `GET /rooms/:id/messages`, `GET /stats`, `GET /export`
- AI Chat: `GET /admin/v2/ai-chat/sessions`, `GET /sessions/:id/messages`

**Files:**
- Modify: `repos/Project-Solo/app/services/chat.ts`
- Modify: `repos/Project-Solo/app/services/admin/messaging.ts` (ai-chat 부분)

- [ ] **Step 1:** `chat.ts`를 V2 엔드포인트 + `adminRequest`로 전환
- [ ] **Step 2:** `messaging.ts`의 AI 채팅 관련 메서드를 V2로 전환
- [ ] **Step 3:** `axiosServer` import 제거
- [ ] **Step 4:** 빌드 확인
- [ ] **Step 5:** 커밋

---

## Phase B: V2 백엔드 없는 10개 도메인 — 백엔드 생성 + 프론트 전환

각 도메인에 대해: (1) 백엔드 V2 컨트롤러 생성, (2) 프론트엔드 전환

### 백엔드 V2 컨트롤러 공통 패턴

```typescript
// src/admin/v2/{domain}/{domain}-v2.controller.ts
@Controller('admin/v2/{domain}')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(V2ResponseInterceptor)
@UseFilters(V2ExceptionFilter)
@Roles(Role.ADMIN)
export class {Domain}V2Controller {
  constructor(private readonly service: {Domain}V2Service) {}
}
```

각 V2 서비스는 기존 V1 서비스/리포지토리를 재사용하되, `AdminQueryFilter`를 적용하고 응답 구조를 표준화.

### Task B1: matching (백엔드 + 프론트)

**프론트 레거시:** `matching.ts` (14호출) — 매칭 관리, 강제 매칭

**새 V2 엔드포인트:**
```
GET    /admin/v2/matching              — 매칭 목록
GET    /admin/v2/matching/:id          — 매칭 상세
POST   /admin/v2/matching/force        — 강제 매칭
DELETE /admin/v2/matching/:id          — 매칭 취소
GET    /admin/v2/matching/stats        — 매칭 통계
```

**Backend Files:**
- Create: `repos/sometimes-api/src/admin/v2/matching/matching-v2.controller.ts`
- Create: `repos/sometimes-api/src/admin/v2/matching/matching-v2.service.ts`
- Create: `repos/sometimes-api/src/admin/v2/matching/matching-v2.repository.ts`
- Create: `repos/sometimes-api/src/admin/v2/matching/dto/matching-v2.dto.ts`
- Modify: `repos/sometimes-api/src/admin/v2/admin-v2.module.ts`

**Frontend Files:**
- Modify: `repos/Project-Solo/app/services/admin/matching.ts`

- [ ] **Step 1:** 백엔드 — 기존 `MatchingService`/`ForceMatchingService`의 메서드를 확인하여 V2 서비스 작성
- [ ] **Step 2:** 백엔드 — V2 컨트롤러 + DTO 작성
- [ ] **Step 3:** 백엔드 — `admin-v2.module.ts`에 등록
- [ ] **Step 4:** 백엔드 — 서버 동작 확인 (hot reload)
- [ ] **Step 5:** 프론트 — `matching.ts`를 V2 엔드포인트 + `adminRequest`로 전환
- [ ] **Step 6:** 프론트 — 빌드 확인
- [ ] **Step 7:** 커밋 (백엔드 + 프론트 각각)

### Task B2: system — universities, fcm-tokens (백엔드 + 프론트)

**프론트 레거시:** `system.ts` (22호출)

**새 V2 엔드포인트:**
```
GET    /admin/v2/universities                     — 목록
GET    /admin/v2/universities/:id                 — 상세
POST   /admin/v2/universities                     — 생성
PUT    /admin/v2/universities/:id                 — 수정
DELETE /admin/v2/universities/:id                 — 삭제
POST   /admin/v2/universities/:id/logo            — 로고 업로드
DELETE /admin/v2/universities/:id/logo            — 로고 삭제
GET    /admin/v2/universities/meta/regions        — 지역 메타
GET    /admin/v2/universities/meta/types           — 유형 메타
GET    /admin/v2/universities/meta/foundations     — 설립 메타
GET    /admin/v2/universities/:id/departments      — 학과 목록
POST   /admin/v2/universities/:id/departments      — 학과 추가
PUT    /admin/v2/universities/:id/departments/:did — 학과 수정
DELETE /admin/v2/universities/:id/departments/:did — 학과 삭제
GET    /admin/v2/universities/clusters             — 클러스터
GET    /admin/v2/fcm-tokens                        — FCM 토큰 목록
```

**Backend Files:**
- Create: `repos/sometimes-api/src/admin/v2/system/system-v2.controller.ts`
- Create: `repos/sometimes-api/src/admin/v2/system/system-v2.service.ts`
- Modify: `repos/sometimes-api/src/admin/v2/admin-v2.module.ts`

**Frontend Files:**
- Modify: `repos/Project-Solo/app/services/admin/system.ts`

- [ ] **Step 1~3:** 백엔드 V2 컨트롤러/서비스 생성 (기존 서비스 위임)
- [ ] **Step 4:** 프론트 — `system.ts`를 V2 엔드포인트 + `adminRequest`로 전환
- [ ] **Step 5:** 프론트 — FormData 업로드는 `adminRequest`에 content-type 옵션으로 처리
- [ ] **Step 6:** 빌드 확인 + 커밋

### Task B3: messaging — push, sms (백엔드 + 프론트)

**프론트 레거시:** `messaging.ts` (11호출), `sms.ts` (9호출)

**새 V2 엔드포인트:**
```
POST   /admin/v2/messaging/push/send              — 푸시 발송
GET    /admin/v2/messaging/push/history            — 발송 이력
POST   /admin/v2/messaging/sms/send               — SMS 발송
POST   /admin/v2/messaging/sms/schedule            — SMS 예약
GET    /admin/v2/messaging/sms/history             — 발송 이력
GET    /admin/v2/messaging/sms/templates           — 템플릿 목록
```

**Backend Files:**
- Create: `repos/sometimes-api/src/admin/v2/messaging/messaging-v2.controller.ts`
- Create: `repos/sometimes-api/src/admin/v2/messaging/messaging-v2.service.ts`
- Modify: `repos/sometimes-api/src/admin/v2/admin-v2.module.ts`

**Frontend Files:**
- Modify: `repos/Project-Solo/app/services/admin/messaging.ts`
- Modify: `repos/Project-Solo/app/services/sms.ts`

- [ ] **Step 1~3:** 백엔드 V2 컨트롤러/서비스 생성
- [ ] **Step 4:** 프론트 전환
- [ ] **Step 5:** 빌드 확인 + 커밋

### Task B4: community (백엔드 + 프론트)

**프론트 레거시:** `community.ts` (18호출)

**새 V2 엔드포인트:**
```
GET    /admin/v2/community/posts                   — 게시글 목록
GET    /admin/v2/community/posts/:id               — 게시글 상세
PATCH  /admin/v2/community/posts/:id/status        — 상태 변경
DELETE /admin/v2/community/posts/:id               — 삭제
GET    /admin/v2/community/comments                — 댓글 목록
DELETE /admin/v2/community/comments/:id            — 댓글 삭제
```

**Backend Files:**
- Create: `repos/sometimes-api/src/admin/v2/community/community-v2.controller.ts`
- Create: `repos/sometimes-api/src/admin/v2/community/community-v2.service.ts`
- Modify: `repos/sometimes-api/src/admin/v2/admin-v2.module.ts`

**Frontend Files:**
- Modify: `repos/Project-Solo/app/services/community.ts`

- [ ] **Step 1~3:** 백엔드 V2 컨트롤러/서비스 생성
- [ ] **Step 4:** 프론트 전환
- [ ] **Step 5:** 빌드 확인 + 커밋

### Task B5: analytics (백엔드 + 프론트)

**프론트 레거시:** `analytics.ts` (9호출)

**새 V2 엔드포인트:**
```
GET    /admin/v2/analytics/overview                — 전체 개요
GET    /admin/v2/analytics/pages                   — 페이지별 통계
GET    /admin/v2/analytics/visitors                — 방문자 통계
GET    /admin/v2/analytics/devices                 — 디바이스 통계
GET    /admin/v2/analytics/demographics            — 인구통계
GET    /admin/v2/analytics/traffic-sources         — 트래픽 소스
```

**Backend Files:**
- Create: `repos/sometimes-api/src/admin/v2/analytics/analytics-v2.controller.ts`
- Create: `repos/sometimes-api/src/admin/v2/analytics/analytics-v2.service.ts`
- Modify: `repos/sometimes-api/src/admin/v2/admin-v2.module.ts`

**Frontend Files:**
- Modify: `repos/Project-Solo/app/services/analytics.ts`

- [ ] **Step 1~3:** 백엔드 V2 컨트롤러/서비스 생성
- [ ] **Step 4:** 프론트 전환
- [ ] **Step 5:** 빌드 확인 + 커밋

### Task B6: care (백엔드 + 프론트)

**프론트 레거시:** `care.ts` (5호출)

**새 V2 엔드포인트:**
```
GET    /admin/v2/care/targets                      — 케어 대상 목록
POST   /admin/v2/care/execute                      — 케어 실행
GET    /admin/v2/care/logs                         — 케어 로그
```

**Backend/Frontend Files:** 패턴 동일

- [ ] **Step 1~5:** 백엔드 생성 + 프론트 전환 + 빌드 확인 + 커밋

### Task B7: feature-flags (백엔드 + 프론트)

**프론트 레거시:** `feature-flags.ts` (3호출)

**새 V2 엔드포인트:**
```
GET    /admin/v2/feature-flags                     — 플래그 목록
PATCH  /admin/v2/feature-flags/:id                 — 플래그 토글
```

- [ ] **Step 1~5:** 백엔드 생성 + 프론트 전환 + 빌드 확인 + 커밋

### Task B8: style-reference (백엔드 + 프론트)

**프론트 레거시:** `style-reference.ts` (6호출)

**새 V2 엔드포인트:**
```
GET    /admin/v2/style-reference                   — 목록
POST   /admin/v2/style-reference                   — 생성
PUT    /admin/v2/style-reference/:id               — 수정
DELETE /admin/v2/style-reference/:id               — 삭제
GET    /admin/v2/style-reference/stats             — 통계
POST   /admin/v2/style-reference/bulk              — 벌크 생성
```

- [ ] **Step 1~5:** 백엔드 생성 + 프론트 전환 + 빌드 확인 + 커밋

### Task B9: keywords (백엔드 + 프론트)

**프론트 레거시:** `keywords.ts` (5호출)

**새 V2 엔드포인트:**
```
GET    /admin/v2/keywords                          — 키워드 목록
POST   /admin/v2/keywords                          — 키워드 추가
PUT    /admin/v2/keywords/:id                      — 키워드 수정
DELETE /admin/v2/keywords/:id                      — 키워드 삭제
```

- [ ] **Step 1~5:** 백엔드 생성 + 프론트 전환 + 빌드 확인 + 커밋

### Task B10: version (프론트만 — BFF 전환)

**프론트 레거시:** `version.ts` (5호출) — 앱 버전 관리

version은 단순 CRUD이므로 V2 컨트롤러 없이 BFF(`adminRequest`)로 기존 V1 엔드포인트 호출로 전환.

**Files:**
- Modify: `repos/Project-Solo/app/services/version.ts`

- [ ] **Step 1:** `axiosServer` → `adminRequest`로 전환 (V1 경로 유지)
- [ ] **Step 2:** 빌드 확인 + 커밋

---

## Phase C: BFF 프록시 + 정리

### Task C1: BFF 프록시 허용 경로 업데이트

**Files:**
- Modify: `repos/Project-Solo/app/api/admin-proxy/[...path]/route.ts`

- [ ] **Step 1:** Phase B에서 추가된 모든 V2 경로가 `ALLOWED_PATH_PREFIXES`에 포함되어 있는지 확인. 누락 경로 추가.
- [ ] **Step 2:** 커밋

### Task C2: 레거시 axios 제거

**Files:**
- Modify: `repos/Project-Solo/utils/axios.ts`
- Modify: `repos/Project-Solo/app/services/admin/index.ts`
- 모든 서비스 파일에서 `import axiosServer` 제거 확인

- [ ] **Step 1:** `grep -r "axiosServer\|axiosNextGen\|axiosMultipart" app/services/` 결과 0건 확인
- [ ] **Step 2:** `utils/axios.ts`에서 미사용 인스턴스 제거 (앱 사이드에서 사용하는지 확인 후)
- [ ] **Step 3:** 빌드 확인 + 커밋

### Task C3: content.ts 전환 확인

`content.ts`는 이미 `adminRequest`를 사용 중(33호출). V2 엔드포인트가 없으므로 현재 상태 유지.

- [ ] **Step 1:** `content.ts`에 `axiosServer` import가 없는지 확인
- [ ] **Step 2:** 필요 시 누락된 BFF 허용 경로 추가

---

## Phase D: 프로덕션 DB(kr) 검증

### Task D1: 매출 검증

```sql
-- V2 API 총 매출과 DB 직접 쿼리 비교
SELECT
  COALESCE(SUM(CASE WHEN LOWER(method) != 'apple_iap' OR method IS NULL THEN amount ELSE 0 END), 0) as pg_revenue,
  COALESCE(SUM(CASE WHEN LOWER(method) = 'apple_iap' THEN COALESCE(price_in_millis/1000, amount) ELSE 0 END), 0) as iap_revenue
FROM (
  SELECT DISTINCT ON(order_id) amount, method, price_in_millis
  FROM kr.pay_histories
  WHERE paid_at IS NOT NULL
    AND refund_status IS NULL
    AND paid_at >= '2026-03-01'
    AND paid_at < '2026-04-01'
  ORDER BY order_id, paid_at DESC
) deduped;
```

- [ ] **Step 1:** DB 직접 쿼리 실행
- [ ] **Step 2:** V2 API `/admin/v2/revenue/summary?startDate=2026-03-01&endDate=2026-03-29` 응답과 비교
- [ ] **Step 3:** 차이가 5% 이내인지 확인

### Task D2: 유저 수 검증

```sql
-- 활성 유저 수
SELECT COUNT(*) FROM kr.users
WHERE is_faker = false AND is_test = false AND deleted_at IS NULL AND status = 'approved';

-- 총 가입자 (faker/test 제외)
SELECT COUNT(*) FROM kr.users
WHERE is_faker = false AND is_test = false;

-- 오늘 가입
SELECT COUNT(*) FROM kr.users
WHERE is_faker = false AND is_test = false
  AND created_at >= CURRENT_DATE;
```

- [ ] **Step 1:** DB 직접 쿼리 실행
- [ ] **Step 2:** V2 대시보드 API 응답과 비교
- [ ] **Step 3:** 정확히 일치하는지 확인

### Task D3: 통계 검증

```sql
-- 성별 통계 (profiles 테이블 기준)
SELECT p.gender, COUNT(*) FROM kr.users u
JOIN kr.profiles p ON u.id = p.user_id
WHERE u.is_faker = false AND u.is_test = false AND u.deleted_at IS NULL
GROUP BY p.gender;

-- 탈퇴 통계
SELECT COUNT(*) FROM kr.users
WHERE is_faker = false AND is_test = false AND deleted_at IS NOT NULL;
```

- [ ] **Step 1:** DB 직접 쿼리 실행
- [ ] **Step 2:** V2 stats API 응답과 비교

### Task D4: 신고/심사 검증

```sql
-- 대기 중 신고 수
SELECT COUNT(*) FROM kr.user_reports WHERE status = 'PENDING';

-- 심사 대기 유저 수
SELECT COUNT(*) FROM kr.users
WHERE status = 'pending' AND is_faker = false AND is_test = false;
```

- [ ] **Step 1:** DB 직접 쿼리 실행
- [ ] **Step 2:** V2 reports/profile-review API 응답과 비교

---

## Phase E: 최종 검증 및 배포

### Task E1: 전체 빌드 + 타입체크

- [ ] **Step 1:** `cd repos/Project-Solo && pnpm build` 에러 0건
- [ ] **Step 2:** `cd repos/sometimes-api && pnpm build` 에러 0건
- [ ] **Step 3:** `grep -r "axiosServer\|axiosNextGen" repos/Project-Solo/app/services/` 결과 0건

### Task E2: E2E 검증

- [ ] **Step 1:** 어드민 대시보드 페이지 로드 → 에러 콘솔 0건
- [ ] **Step 2:** 매출 현황 → PG + IAP 합산 수치 표시 확인
- [ ] **Step 3:** 유저 관리 → 목록/상세/검색 정상
- [ ] **Step 4:** 신고 관리 → 목록/상세/상태변경 정상
- [ ] **Step 5:** 프로필 심사 → 대기 목록/승인/거절 정상
- [ ] **Step 6:** support-chat → 세션 목록 정상 (403 없음)

### Task E3: 배포

- [ ] **Step 1:** sometimes-api 배포 (V2 엔드포인트 추가)
- [ ] **Step 2:** Project-Solo 배포 (Vercel)
- [ ] **Step 3:** 프로덕션 대시보드 확인

---

## 실행 순서 요약

```
Phase A (프론트 전환, V2 있는 도메인)
  A1 revenue → A2 dashboard → A3 users → A4 stats → A5 reports → A6 chat
                                                                    ↓
Phase B (백엔드 생성 + 프론트 전환, V2 없는 도메인)
  B1 matching → B2 system → B3 messaging → B4 community → B5 analytics
  → B6 care → B7 feature-flags → B8 style-reference → B9 keywords → B10 version
                                                                    ↓
Phase C (정리)
  C1 BFF 허용경로 → C2 레거시 axios 제거 → C3 content 확인
                                                                    ↓
Phase D (DB 검증)
  D1 매출 → D2 유저 → D3 통계 → D4 신고/심사
                                                                    ↓
Phase E (최종 검증 + 배포)
  E1 빌드 → E2 E2E → E3 배포
```
