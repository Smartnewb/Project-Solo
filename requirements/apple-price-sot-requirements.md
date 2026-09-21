# Apple 가격 SoT 통합 — Requirements

> **Status:** IMPLEMENTED (flag-gated, off by default; manual prod migration + flag flip pending)
>
> 코드 / 마이그레이션 파일 / 어드민 UI / 앱 매퍼 모두 완료. 운영 단계 수동 작업:
> - `pnpm migration:run` against prod DB (마지막 migration: `20260430_drop_promotion_discount_rate`)
> - 어드민 UI 에서 `apple_price_sot_enabled` On 토글
> - ECS service 를 신규 task definition (revision 946) 으로 deploy

## Original Request
> "../sometimes-app 에서 스킬을 분석해서 애플의 가격 조회를 진행하고 이를 ../solo-nestjs-api 에서 조회 기능을 구현하여 적용되게할 방안을 마련해줘. 모든 가격정책은 애플을 기준으로 따라가야함."

## Goal
Apple App Store Connect API를 가격 정책의 단일 진실 원천(SoT)으로 채택. solo-nestjs-api가 Apple SKU 가격을 캐시하고, 앱이 본 가격을 보조로 푸시. GemProduct/Promotion 응답 모두 Apple 캐시 우선 derive.

## Scope

### 포함
- 신규 테이블 `apple_iap_price_points` (kr 스키마, PK `(sku, storefront)`)
- `gem_products.appleSku varchar(64) UNIQUE NOT NULL` 컬럼 추가
- `gem_products.price/currency` 컬럼 **유지**, read-time Apple cache 우선
- App Store Connect API 클라이언트 서비스 (`@nestjs/jwt` ES256)
  - `GET /v1/apps/{appId}/inAppPurchasesV2`
  - `GET /v2/inAppPurchases/{id}/iapPriceSchedule`
  - `GET /v1/inAppPurchasePriceSchedules/{id}/manualPrices?include=...`
- Cron 일 1회 (`@nestjs/schedule`) + 어드민 수동 동기화 엔드포인트 (`POST /v1/admin/iap/sync-apple-prices`)
- 앱 관측 푸시 엔드포인트 (`POST /v1/iap/prices/observed`) — 보조망
- `/v1/payment/gem-products` 응답에 `appleSku`, `applePrice` inject
- `/v1/promotions` 응답에 `targetAppleSku`, `applePrice` inject
- Promotion `discountRate` 자유 입력 폐기 → **SKU 페어 (origin + sale) 선택 + 서버 derive**
- 어드민 UI:
  - GemProduct 드롭다운 (기존 자유 텍스트 대체)
  - 신규 페이지 `/admin/iap-catalog`: 동기화 버튼 + 매핑 상태
  - Promotion 폼: `targetGemProductId` 드롭다운 + 원가/할인 SKU 페어 선택
- 피쳐플래그 `apple_price_sot_enabled` (Off=기존 DB price, On=Apple cache 우선)

### 제외
- JPN/기타 storefront (KOR만 우선, 구조만 확장 가능)
- App Store Server Notifications 웹훅 실시간 가격 동기화
- 신규 SKU 자동 생성 (수동 등록 유지)

## Constraints
- App Store Connect API 키 즉시 발급 가능
- Apple SKU 6개: `gem_1, gem_5, gem_25, gem_50, gem_100, gem_sale_10`
- 기존 응답 contract 호환 (필드 추가만, 제거 X)
- `gem_products.price` 컬럼 어드민 직접 수정 차단 (read-only)
- 다국가 스키마(kr/jp) 구조 유지

## Success Criteria
1. App Store Connect 가격 변경 → 24h 내 또는 수동 sync 즉시 서버 캐시 반영
2. `/v1/payment/gem-products` 응답에 Apple 실가 노출, 앱 PromotionCarousel/ProductList 사용
3. Promotion 등록 시 자유 입력 `discountRate` UI 제거, SKU 페어 선택 → derive
4. 피쳐플래그 Off 상태에서 기존 동작 100% 유지 (회귀 0)
5. `apple_iap_price_points` 24h+ stale 시 Sentry/Slack 알림
6. KOR storefront 6개 SKU 전체 가격 DB 캐시

## Decisions

| Question | Decision |
|---|---|
| 가격 SoT | Connect API + 앱 관측 보조 |
| Connect API 키 | 즉시 확보 가능 |
| `gem_products.price` 컬럼 | 유지 + Apple cache 우선 read |
| Promotion discountRate | SKU 페어 + 서버 derive |
| 동기화 트리거 | Cron 일 1회 + 어드민 수동 버튼 |
| 적용 범위 | GemProduct + Promotion 전체 |
| Storefront | KOR만 우선 |
| 롤아웃 | 피쳐플래그 + 점진 전환 |

## Architecture

```
┌────────────────────────────────────────────────┐
│ Apple App Store Connect (가격 정책 SoT)        │
└────────────────────────────────────────────────┘
        ▲                              ▲
        │ ① 서버 풀 (Cron 1d + 어드민 트리거)   │ ② 앱 푸시 (런타임 보조)
        │   App Store Connect API           │   expo-iap displayPrice
        │   JWT(ES256)                      │
┌───────┴──────────────────────┐      ┌────┴────────────────┐
│ solo-nestjs-api              │      │ sometimes-app       │
│  apple-connect-api.service   │◀─────│ POST snapshot       │
│  apple_iap_price_points      │      │ (KR storefront)     │
│                              │      └─────────────────────┘
│  GemProduct.applePrice       │
│  ← apple_iap_price_points    │
│                              │
│  Promotion.applePrice        │
│  ← gem_products.appleSku     │
│  ← apple_iap_price_points    │
│                              │
│  FeatureFlag:                │
│   apple_price_sot_enabled    │
└──────────────────────────────┘
```

## Data Models

### `apple_iap_price_points` (신규, kr 스키마)
```ts
{
  sku: varchar(64),                 // 'gem_1', 'gem_sale_10' …
  storefront: varchar(8),           // 'KOR'
  price: integer,                   // minor units (KRW = 정수)
  currency: varchar(3),             // 'KRW'
  displayPrice: varchar(32),        // '₩1,500'
  source: enum('connect_api', 'app_observed', 'manual'),
  syncedAt: timestamp,
  ...timestamps
}
// PK: (sku, storefront)
// 우선순위: connect_api > app_observed > manual
```

### `gem_products` 변경
```diff
+ appleSku: varchar(64) UNIQUE NOT NULL
  price: integer (유지, read-only on admin)
  currency: varchar(3) (유지)
```

### `gem_promotions` 변경
```diff
- discountRate: integer NOT NULL (자유 입력 → 폐기)
+ originGemProductId: uuid (원가 SKU 참조)  -- nullable, sale SKU 사용 시만
+ saleGemProductId: uuid NOT NULL (할인 또는 단일 SKU)
+ derivedDiscountRate: integer (서버 계산, 캐시)
```
> 마이그레이션: 기존 `targetGemProductId` → `saleGemProductId`로 이전. `discountRate` 백필 후 컬럼 drop.

## Endpoints

### 신규
- `POST /v1/admin/iap/sync-apple-prices` — 어드민 수동 동기화 트리거
- `GET /v1/admin/iap/price-points` — 캐시된 가격 목록 조회
- `POST /v1/iap/prices/observed` — 앱 관측 푸시 (인증 사용자)

### 변경
- `GET /v1/payment/gem-products` — `appleSku`, `applePrice` 추가
- `GET /v1/promotions` — `targetAppleSku`, `applePrice`, `derivedDiscountRate` 추가
- `POST /v1/admin/promotions` — payload에서 `discountRate` 제거, `originGemProductId` + `saleGemProductId` 추가

## Phases

| Phase | 내용 | 의존 |
|---|---|---|
| 1 | DB 마이그레이션 (apple_iap_price_points, gem_products.appleSku, gem_promotions FK) | — |
| 2 | Apple Connect API 클라이언트 + Cron + 수동 트리거 | Phase 1 |
| 3 | 앱 관측 푸시 엔드포인트 + 우선순위 머지 | Phase 1 |
| 4 | `/v1/payment/gem-products`, `/v1/promotions` 응답 변경 (피쳐플래그) | Phase 2-3 |
| 5 | 어드민 UI (드롭다운, IAP 카탈로그 페이지) | Phase 4 |
| 6 | 앱 매퍼 단순화 (`mapAppleProductToServerGem` → `appleSku` 직매칭) | Phase 4 |
| 7 | 피쳐플래그 On 점진 전환 + 모니터링 | Phase 1-6 |

## Open Questions (구현 단계에서 결정)
- App Store Connect API rate limit 대응 (백오프 전략)
- `displayPrice` 다국어 처리 — 현 KOR만이라 지연
- 앱 관측 푸시 인증 범위 (모든 인증 유저 vs 샘플링)
- 마이그레이션 다운타임 — 백필 전략 (트랜잭션 vs 점진)

## Next Steps
1. `/write-plan` — 본 스펙 기반 체크포인트 분해
2. `/execute-plan` — Phase 1 부터 구현
3. App Store Connect API 키 발급 (병렬 진행)
