# PRD: UTM 대시보드 백엔드 API 모듈

**문서 버전**: 1.0  
**작성일**: 2026-04-15  
**상태**: Draft

---

## 1. Summary

어드민 프론트엔드(Project-Solo)의 UTM 성과 대시보드가 배포 환경에서 즉시 크래시하는 문제를 해결하기 위해, solo-nestjs-api에 UTM 링크 관리 및 성과 측정 API 모듈을 신규 구현한다. API 응답 계약을 프론트엔드 기대와 일치시켜 어드민이 마케팅 채널별 성과를 안정적으로 조회할 수 있도록 한다.

---

## 2. Contacts

| 이름 | 역할 | 담당 |
|------|------|------|
| galaxy4276 | Backend Engineer | solo-nestjs-api UTM 모듈 구현 |
| — | Frontend Engineer | Project-Solo utm.ts / utm-dashboard.tsx 계약 정의 |
| — | Admin Operator | 어드민 대시보드 사용자 |

---

## 3. Background

### 현재 상황

Project-Solo 어드민의 **성과 대시보드 탭**(`/admin/utm-management`)이 배포 환경에서 즉시 에러 바운더리를 노출한다.

```
TypeError: f is not iterable
```

### 근본 원인

solo-nestjs-api에 UTM 모듈이 **전혀 없다**. `admin-v2.module.ts`에 UTM 관련 Controller/Service가 등록되어 있지 않으며, `/admin/v2/utm/*` 경로에 해당하는 라우트가 존재하지 않는다.

프론트엔드(`utm.ts`)는 `adminGet<{ data: X }>()` 후 `result.data`를 읽는데, API 응답이 없거나 예상 외 형태면 `undefined`가 내려가 스프레드 연산(`[...channels]`)에서 크래시한다.

### 왜 지금인가

- 어드민 팀이 마케팅 채널 성과를 측정하기 위해 UTM 대시보드 기능을 요구하고 있다.
- 프론트엔드 UI는 이미 완성 상태이나 백엔드 API가 없어 사용 불가능하다.
- 에러 바운더리 노출이 어드민 신뢰도를 하락시킨다.

---

## 4. Objective

### 목표

어드민이 마케팅 채널(UTM source)별 성과를 실시간으로 확인하여 광고 예산 및 캠페인을 데이터 기반으로 의사결정할 수 있도록 한다.

### Key Results

| 지표 | 목표 |
|------|------|
| 성과 대시보드 크래시 | 0건 (현재: 100%) |
| API 응답 계약 일치율 | 100% (프론트 기대 스키마 기준) |
| 채널별 데이터 정확도 | UTM 파라미터 기반 이벤트와 100% 연결 |
| 대시보드 로딩 시간 | P95 < 2초 |

---

## 5. Market Segment

### 대상

**내부 어드민 운영팀** — 마케팅 캠페인을 기획하고 성과를 분석하는 팀원.

### 제약 조건

- 어드민 권한(`Role.ADMIN`)을 가진 사용자만 접근 가능
- 국가별 멀티 스키마 환경(kr/jp/public)을 지원해야 함
- 기존 이벤트 추적 구조(가입, 프로필 승인, 구매)와 연동 필요

---

## 6. Value Proposition

### 어드민이 얻는 것 (Gains)

- UTM 링크별 클릭 수, 가입 수, 승인 수, 구매 수를 한 화면에서 확인
- 채널별(source) 전환율 비교로 고성과 채널 즉시 파악
- 이전 기간 대비 변화율(`change` 필드)로 트렌드 파악

### 어드민이 피하는 것 (Pains Relieved)

- 에러 바운더리 노출로 인한 화면 사용 불가 해소
- 수동으로 DB를 직접 조회하던 번거로움 제거
- 채널 성과를 스프레드시트에 수동 정리하는 작업 제거

---

## 7. Solution

### 7.1 API 엔드포인트 명세

모든 응답은 `{ data: ... }` 래핑 형태 (`V2ResponseInterceptor` 적용).

#### UTM 링크 관리

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/admin/v2/utm/links` | UTM 링크 목록 (페이지네이션) |
| `POST` | `/admin/v2/utm/links` | UTM 링크 생성 |
| `PATCH` | `/admin/v2/utm/links/:id` | UTM 링크 수정 |
| `DELETE` | `/admin/v2/utm/links/:id` | UTM 링크 삭제 |

#### 성과 대시보드

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/admin/v2/utm/dashboard` | 기간별 요약 지표 |
| `GET` | `/admin/v2/utm/dashboard/funnel` | 전환 퍼널 단계별 데이터 |
| `GET` | `/admin/v2/utm/dashboard/channels` | 채널별 성과 테이블 |
| `GET` | `/admin/v2/utm/dashboard/campaigns/:source` | 소스별 캠페인 성과 |

### 7.2 응답 스키마

#### `GET /admin/v2/utm/links`

```typescript
{
  data: UtmLink[];
  total: number;
}

interface UtmLink {
  id: string;
  name: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string | null;
  destinationType: string;       // 예: 'app_store' | 'landing_page'
  destinationUrl: string;
  shortCode: string;
  shortUrl?: string;
  memo: string | null;
  createdAt: string;             // ISO 8601
  clickCount?: number;
  signupCount?: number;
}
```

#### `GET /admin/v2/utm/dashboard`

**Query**: `startDate`, `endDate`, `utmSource?`, `utmCampaign?`

```typescript
{
  data: {
    pageVisit:       { count: number; change: number | null };
    signup:          { count: number; change: number | null };
    profileApproved: { count: number; change: number | null };
    firstPurchase:   { count: number; change: number | null };
  }
}
```

> `change`는 이전 동일 기간 대비 % 변화율. 이전 기간 데이터가 없으면 `null`.

#### `GET /admin/v2/utm/dashboard/funnel`

**Query**: `startDate`, `endDate`, `utmSource?`, `utmCampaign?`

```typescript
{
  data: Array<{
    step: string;    // '페이지 방문' | '회원가입' | '프로필 승인' | '첫 구매'
    count: number;
    rate: number;    // 첫 단계 대비 전환율 (%)
  }>
}
```

#### `GET /admin/v2/utm/dashboard/channels`

**Query**: `startDate`, `endDate`

```typescript
{
  data: Array<{
    source: string;
    clicks: number;
    signups: number;
    signupRate: number;    // clicks 대비 %
    approved: number;      // ⚠️ 필수 — 프로필 승인 수
    purchases: number;
    purchaseRate: number;  // signups 대비 %
  }>
}
```

#### `GET /admin/v2/utm/dashboard/campaigns/:source`

**Query**: `startDate`, `endDate`

```typescript
{
  data: Array<{
    campaign: string;
    clicks: number;
    signups: number;
    purchases: number;
  }>
}
```

#### `POST /admin/v2/utm/links` (Request Body)

```typescript
{
  name: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent?: string;
  destinationType: string;
  memo?: string;
}
```

### 7.3 데이터 모델 (DB Schema)

#### `utm_links` 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | `uuid` PK | |
| `name` | `varchar` | 링크 식별 이름 |
| `utm_source` | `varchar` | 유입 채널 (instagram, facebook 등) |
| `utm_medium` | `varchar` | 매체 유형 (social, cpc 등) |
| `utm_campaign` | `varchar` | 캠페인 이름 |
| `utm_content` | `varchar` nullable | 광고 소재 구분 |
| `destination_type` | `varchar` | 목적지 유형 |
| `destination_url` | `text` | 실제 이동 URL |
| `short_code` | `varchar` unique | 단축 코드 |
| `memo` | `text` nullable | 내부 메모 |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | |

#### `utm_click_events` 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | `uuid` PK | |
| `utm_link_id` | `uuid` FK | utm_links.id |
| `utm_source` | `varchar` | |
| `utm_campaign` | `varchar` | |
| `user_id` | `uuid` nullable | 로그인 유저 연결 |
| `clicked_at` | `timestamp` | |

> 가입, 프로필 승인, 첫 구매 이벤트는 기존 user 테이블 및 payment 테이블에서 `created_at` + UTM session cookie 방식으로 연결.

### 7.4 구현 파일 구조

```
src/admin/v2/utm/
├── utm-v2.controller.ts       # 8개 엔드포인트
├── utm-v2.service.ts          # 비즈니스 로직
├── utm-v2.repository.ts       # Drizzle ORM 쿼리
└── dto/
    ├── create-utm-link.dto.ts
    ├── update-utm-link.dto.ts
    └── utm-dashboard-query.dto.ts
```

**`admin-v2.module.ts` 수정**:
- `UtmV2Controller`, `UtmV2Service`, `UtmV2Repository` 등록

### 7.5 기술 구현 상세

**컨트롤러 데코레이터 패턴** (기존 analytics-v2 / retention-v2 패턴 동일):
```typescript
@Controller('admin/v2/utm')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(V2ResponseInterceptor)   // { data: ... } 래핑 자동 처리
@UseFilters(V2ExceptionFilter)
@Roles(Role.ADMIN)
```

**`change` 계산 로직**:
- 요청 기간 길이(N일)를 계산
- 이전 N일 동일 구간의 카운트를 동시에 조회
- `change = ((current - previous) / previous) * 100`
- `previous === 0`이면 `null` 반환

**멀티 스키마**:
- `SchemaMiddleware`가 `X-Country` 헤더로 스키마 자동 전환 (기존 구조 그대로)

### 7.6 가정 (Assumptions)

| 가정 | 검증 방법 |
|------|----------|
| UTM 클릭 이벤트를 `utm_click_events` 테이블로 신규 수집 | DB 마이그레이션 후 데이터 적재 확인 |
| 가입/승인/구매 이벤트는 기존 테이블에서 JOIN으로 추출 가능 | user, payment 테이블 컬럼 확인 필요 |
| UTM 세션을 쿠키 또는 user 레코드에 저장 가능 | 유저 가입 플로우 확인 필요 |
| `shortUrl`은 별도 리다이렉트 서버 없이 API가 처리 | 단축 URL 처리 엔드포인트 별도 설계 필요 |

---

## 8. Release

### Phase 1 — 크래시 해결 (즉시)

목표: 어드민 성과 대시보드 탭 크래시 해소.

- `GET /admin/v2/utm/dashboard` — Mock 또는 빈 데이터 반환 (계약 형태 준수)
- `GET /admin/v2/utm/dashboard/funnel`
- `GET /admin/v2/utm/dashboard/channels` (approved 포함)
- `GET /admin/v2/utm/dashboard/campaigns/:source`
- `GET /admin/v2/utm/links`

> 응답 계약 형태만 맞춰도 크래시는 해소됨. 실데이터가 없어도 빈 배열 + 올바른 구조로 반환.

### Phase 2 — 실데이터 연결 (1~2주)

- `utm_links`, `utm_click_events` 테이블 생성 및 Drizzle 마이그레이션
- UTM 링크 CRUD API
- 클릭 이벤트 수집 및 집계 쿼리 구현
- `change` 필드 계산 로직

### Phase 3 — 정밀도 향상 (미래)

- UTM 세션 기반 가입/구매 어트리뷰션 정확도 개선
- 단축 URL 리다이렉트 처리 (`/r/:shortCode`)
- 채널별 CAC(고객 획득 비용) 계산 연동
