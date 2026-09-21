# Apple IAP 72h Offer Backend Spec

## Scope

가입 후 72시간 이내이고 첫 구매 전인 유저에게 서버가 앱 행동 이벤트 기반 Apple IAP 오퍼를 판정한다. 백엔드는 이벤트 저장, 다음 오퍼 조회, Apple IAP 결제 attribution 보강만 담당한다. 앱 오퍼 UI, 이벤트 전송 타이밍, Admin 화면은 별도 범위다.

## Data

신규 테이블은 `kr.user_offer_events`, `jp.user_offer_events`다.

컬럼:

- `id`
- `user_id`
- `event_type`
- `context`
- `target_id`
- `offer_id`
- `metadata`
- `created_at`
- `updated_at`
- `deleted_at`

인덱스:

- `(user_id, created_at desc)`
- `(user_id, event_type, created_at desc)`
- `(user_id, target_id, event_type, created_at desc)`

Feature flag:

- `iap_72h_offer_enabled`
- 기본값 `false`
- `public`, `kr`, `jp`에 seed

## APIs

`POST /v1/offers/events`

서버 이벤트명은 아래 5개로 고정한다.

- `paid_action_attempt`
- `insufficient_gems`
- `gem_store_view`
- `profile_interest`
- `purchase_completed`

기획/앱 문서의 이전 명칭은 서버 이벤트명으로 매핑한다.

- `profile_view` -> `profile_interest`
- `insufficient_gem_modal_view` -> `insufficient_gems`
- `purchase_page_view` -> `gem_store_view`

Request:

```json
{
  "eventType": "profile_interest",
  "context": "profile",
  "targetId": "target-user-id",
  "offerId": "gem_25",
  "metadata": {}
}
```

Response:

```json
{
  "ok": true
}
```

`GET /v1/offers/next?context=home|profile|chat|gem_store|matching_history`

Response:

```json
{
  "offer": {
    "offerId": "gem_sale_10",
    "reason": "first_paid_action",
    "context": "home",
    "appleSku": "gem_sale_10",
    "title": "72시간 한정 구슬 10개",
    "subtitle": "첫 유료 액션을 바로 이어갈 수 있는 한정 오퍼",
    "expiresAt": "2026-05-13T00:00:00.000Z"
  }
}
```

조건에 맞지 않으면:

```json
{
  "offer": null
}
```

## Decision Rules

Hard gates:

- `iap_72h_offer_enabled`가 켜져 있어야 한다.
- 유저 가입 후 72시간 이내여야 한다.
- 첫 구매 전이어야 한다. 기존 `gem_payments` 완료 건과 Apple IAP `pay_histories` 완료 건을 모두 본다.
- 해당 오퍼 SKU가 active `gem_products.apple_sku`로 존재해야 한다.

우선순위:

1. `insufficient_gems` 2회 이상 또는 `gem_store_view` 1회 이상이면 `gem_50`
2. `profile_interest` 3회 이상 또는 동일 `targetId` 2회 이상이면 `gem_25`
3. `paid_action_attempt` 1회 이상 또는 `insufficient_gems` 1회 이상이면 `gem_sale_10`
4. 그 외 `null`

클라이언트에는 내부 rule 원문을 내려주지 않고 `offerId`, `reason`, `context`, `appleSku`, 표시 문구, `expiresAt`만 내려준다.

## Apple IAP Verify

기존 `VerifyPurchase.attribution`과 `PaymentSuccessEvent.attribution` 경로는 유지한다.

72시간 오퍼 attribution optional keys:

- `offerId`
- `offerReason`
- `offerContext`

결제 성공 후 `purchase_completed` 이벤트 기록은 non-blocking이다. 이벤트 기록 실패가 구슬 지급이나 결제 성공 응답을 막지 않는다.

## Verification Plan

프로젝트 규칙상 별도 승인 없이 `pnpm test`, `pnpm build`, migration 실행, psql 적용은 하지 않는다.

추후 승인 후 권장 검증:

- `OfferDecisionService` unit test
- `OffersController` unit test
- `AppleIapService` attribution / non-blocking event test
- migration dry-run 또는 dev DB 적용 후 `kr.user_offer_events`, `jp.user_offer_events`, feature flag 확인
