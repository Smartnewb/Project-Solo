# Plan: Apple IAP 72h Behavior-Based Offer

Date: 2026-05-10
Status: DRAFT
Related docs:
- `/Volumes/eungu/projects/Project-Solo/requirements/apple-iap-72h-offer-plan.md`
- `/Volumes/eungu/projects/Project-Solo/requirements/apple-iap-72h-offer-visual.html`
- `/Volumes/eungu/projects/Project-Solo/requirements/apple-price-sot-requirements.md`

## Goal

가입 후 72시간 이내 첫 구매 전 유저에게 행동 기반으로 `gem_sale_10`, `gem_25`, `gem_50` 중 하나를 노출한다. 결제 검증과 구슬 지급은 기존 Apple IAP 서버 검증 흐름을 유지하고, 앱은 서버가 내려준 오퍼를 표시하고 기존 gem-store 결제로 연결한다.

## Product Policy

| 공개 조건 | 상품 | 가격/구성 | 노출 목적 |
|---|---|---:|---|
| 첫 유료 액션 시도, 결제 없음, 가입 72시간 이내 | `gem_sale_10` | 10구슬, 첫 구매 50% | 첫 결제 장벽 제거 |
| D1 전후 또는 프로필 상세 3회 이상, 같은 상대 재방문 | `gem_25` | 25구슬, 25,000원 | 첫 연결 완성 |
| D2-D3, 부족 구슬 모달 2회 이상 또는 구매 이탈 | `gem_50` | 50구슬, 45,000원 | 고의도 객단가 상승 |

`gem_1`은 기준 단가/QA용, `gem_5`는 `gem_sale_10` fallback, `gem_100`은 첫 구매 이후 재구매/헤비 유저용으로 분리한다. 구매한 구슬 자체에는 만료를 걸지 않고, 72시간 만료는 오퍼 노출에만 적용한다.

## Executor Context

- **Repos**
  - Backend: `/Volumes/eungu/projects/solo-nestjs-api` on `main`
  - App: `/Volumes/eungu/projects/sometimes-app` on `main`
  - Admin: `/Volumes/eungu/projects/Project-Solo` on `main`
- **Backend stack**: NestJS, Drizzle ORM, multi-schema `public`/`kr`/`jp`, pnpm.
- **App stack**: Expo/React Native, TanStack Query, `expo-iap`, Mixpanel.
- **Admin stack**: Next.js 14 App Router, Material UI, Shadcn/ui, BFF proxy `/api/admin-proxy/*`.
- **Critical conventions**
  - Admin API calls go through service layer files under `app/services/admin/*`.
  - Admin routes use `/api/admin-proxy/*` and backend admin endpoints.
  - Existing Apple IAP purchase success must remain server-authoritative: app must not treat purchase as successful before `/iap/apple/verify-purchase` returns success.
  - Do not expose raw prompt/internal targeting data to client. Client gets IDs/reasons suitable for analytics only.
  - Preserve unrelated dirty tree changes. Stage only files touched for this feature.
- **Feature flag recommendation**
  - Backend flag: `iap_72h_offer_enabled`
  - App flag: reuse backend response as the source of truth; optionally gate UI calls with existing `useFeatureFlag` if rollout needs app-side kill switch.
- **Primary verification**
  - Backend targeted tests: `pnpm test -- offer`
  - Backend compile: `pnpm build` or existing targeted `pnpm test` if full build is noisy
  - App targeted lint/type: use existing project command if available, otherwise touched-file TypeScript/Biome checks
  - Admin: `pnpm lint` or touched-file type check, plus local route smoke if UI is changed

## Existing Code Map

### Backend: `/Volumes/eungu/projects/solo-nestjs-api`

Read-only reference files:
- `src/events/event.module.ts`: existing promotion module registration pattern.
- `src/events/controller/v1/promotion.controller.ts`: user-facing promotion list endpoint.
- `src/events/controller/v1/admin-promotion.controller.ts`: admin promotion CRUD pattern.
- `src/events/services/promotion.service.ts`: first-purchase filtering, promotion Mixpanel tracking, Apple price injection.
- `src/events/repository/gem-promotion.repository.ts`: repository pattern for country-scoped promotion table.
- `src/database/schema/gem_promotions.ts`: existing promotion schema.
- `src/database/schema/gem_products.ts`: active product schema and `apple_sku`.
- `src/payment/controller/apple-iap.controller.ts`: Apple IAP verify endpoint.
- `src/payment/services/apple-iap.service.ts`: server-authoritative verification and gem grant.
- `src/payment/dto/apple-iap.dto.ts`: Apple SKU and quantity mapping.
- `src/database/run-migrations.ts`: migration registration.

Files to create:
- `src/database/schema/user_offer_events.ts`
- `src/events/dto/offer.dto.ts`
- `src/events/repository/user-offer-event.repository.ts`
- `src/events/services/offer-decision.service.ts`
- `src/events/controller/v1/offer.controller.ts`
- `src/database/migrations/20260510_create_user_offer_events.ts`
- tests near the new service/repository/controller.

Files to modify:
- `src/database/schema/schema.ts`
- `src/database/schema/index.ts`
- `src/database/run-migrations.ts`
- `src/events/event.module.ts`
- `src/payment/dto/apple-iap.dto.ts` only if `VerifyPurchase` lacks attribution fields needed for `offerId`
- `src/payment/controller/apple-iap.controller.ts`
- `src/payment/services/apple-iap.service.ts`
- `src/payment/events/payment-success.event.ts` if offer fields are not already supported
- `src/types/mixpanel-server-events.ts` if server Mixpanel typing is strict

### App: `/Volumes/eungu/projects/sometimes-app`

Read-only reference files:
- `src/features/payment/api/gem-promotions.ts`
- `src/features/payment/queries/use-promotions.ts`
- `src/widgets/gem-store-v2/ui/promotion-carousel/index.tsx`
- `src/widgets/gem-store-v2/types.ts`
- `src/widgets/gem-store-v2/context/gem-store-context.tsx`
- `src/features/payment/data-sources/apple-iap-data-source.tsx`
- `app/purchase/gem-store.tsx`
- `app/partner/view/[id].tsx`
- `app/chat/[id].tsx`
- `src/features/matching-history/*`
- `src/shared/constants/mixpanel-events.ts`

Files to create:
- `src/features/payment/api/offers.ts`
- `src/features/payment/queries/use-next-offer.ts`
- `src/features/payment/types/offer.ts`
- `src/features/payment/ui/offer/offer-card.tsx`
- `src/features/payment/ui/offer/offer-bottom-sheet.tsx` if a modal presentation is chosen.

Files to modify:
- `src/widgets/gem-store-v2/ui/promotion-carousel/index.tsx`
- `src/features/payment/data-sources/apple-iap-data-source.tsx`
- `app/purchase/gem-store.tsx`
- selected entry points for D0-D3 triggers:
  - `app/partner/view/[id].tsx`
  - `app/chat/[id].tsx`
  - `src/features/matching-history/ui/matching-history-card.tsx`
  - insufficient-gem modal components after locating exact component by `rg "insufficient_gem|insufficient_gems|gem_shortage"`
- locale files:
  - `src/shared/libs/locales/ko/features/payment.json`
  - `src/shared/libs/locales/ja/features/payment.json`

### Admin: `/Volumes/eungu/projects/Project-Solo`

Read-only reference files:
- `app/admin/promotions/promotions-client.tsx`
- `app/admin/promotions/components/PromotionFormDrawer.tsx`
- `app/admin/promotions/components/PromotionTable.tsx`
- `app/admin/hooks/use-promotions.ts`
- `app/services/admin/promotions.ts`
- `types/admin.ts`
- `shared/ui/admin/sidebar.tsx`
- `app/admin/iap-catalog/iap-catalog-client.tsx`

Files to create:
- Optional V1: none. Extend existing Promotions page.
- Optional V2: `app/services/admin/offers.ts`, `app/admin/offers/page.tsx`, `app/admin/offers/offers-client.tsx` if a dedicated menu is desired.

Files to modify:
- `types/admin.ts`
- `app/admin/promotions/components/PromotionFormDrawer.tsx`
- `app/admin/promotions/components/PromotionTable.tsx`
- `app/services/admin/promotions.ts`
- `shared/ui/admin/sidebar.tsx` only if adding a dedicated offer menu.

## API Contract

### `POST /v1/offers/events`

Purpose: record app-side behavior signals used by the offer engine.

Request:

```json
{
  "eventType": "profile_view",
  "context": "profile",
  "targetId": "user-or-room-id",
  "metadata": {
    "source": "partner_detail",
    "offerId": "optional-existing-offer"
  }
}
```

Allowed event types:
- `profile_view`
- `paid_action_attempt`
- `insufficient_gem_modal_view`
- `purchase_page_view`
- `offer_impression`
- `offer_tap`
- `purchase_completed`

Response:

```json
{ "ok": true }
```

### `GET /v1/offers/next?context=home|profile|chat|gem_store`

Purpose: return the single best current offer for the user and context.

Response when eligible:

```json
{
  "offer": {
    "offerId": "first-72h-sale",
    "targetGemProductId": "a0000001-0000-4000-8000-000000000010",
    "appleSku": "gem_sale_10",
    "reason": "first_paid_action",
    "context": "profile",
    "title": "첫 마음 표현 팩",
    "subtitle": "첫 마음 표현은 72시간 안에 가볍게 시작하세요",
    "ctaText": "지금 시작하기",
    "expiresAt": "2026-05-13T00:00:00.000Z",
    "priority": 100
  }
}
```

Response when not eligible:

```json
{ "offer": null }
```

### Apple IAP verify-purchase attribution

Extend existing verify request body with optional offer fields:

```json
{
  "transactionReceipt": "...",
  "paymentEventId": "...",
  "attribution": {
    "offerId": "first-72h-sale",
    "offerReason": "first_paid_action",
    "offerContext": "profile"
  }
}
```

The server should copy these into `PaymentSuccessEvent` attribution. Do not block payment success if analytics dispatch fails.

## Backend Decision Logic

Offer eligibility hard gates:
1. `iap_72h_offer_enabled` is on.
2. User has no completed payment: reuse `GemRepository.hasCompletedPayment(userId)`.
3. User account age is <= 72 hours. Use `users.createdAt` from the active country schema.
4. User has not dismissed or exhausted the offer. V1 may ignore dismiss state if not implemented.

Priority rules:
1. If `insufficient_gem_modal_view >= 2` within 72h or `purchase_page_view >= 1` and no purchase: return `gem_50`, reason `high_intent_shortage`.
2. Else if `profile_view >= 3` or same `targetId` profile viewed at least 2 times: return `gem_25`, reason `profile_interest`.
3. Else if `paid_action_attempt >= 1` or `insufficient_gem_modal_view >= 1`: return `gem_sale_10`, reason `first_paid_action`.
4. Else return null.

Context override:
- `context=gem_store`: return the highest priority eligible offer even if no current modal trigger.
- `context=profile`: prefer `gem_sale_10` for the first paid attempt, then upgrade to `gem_25` after profile interest.
- `context=chat`: prefer `gem_25` unless shortage/purchase abandon qualifies for `gem_50`.
- `context=home`: do not return offer before any meaningful signal unless D3 is approaching and the user has at least one profile view.

## Commit Groups and Tasks

## Commit Group 1: Backend schema and event ingestion

Commit: `feat(offers): record app offer behavior events`

### Task 1: Add `user_offer_events` schema

**Repo:** `/Volumes/eungu/projects/solo-nestjs-api`
**Files:**
- Create `src/database/schema/user_offer_events.ts`
- Modify `src/database/schema/schema.ts`
- Modify `src/database/schema/index.ts`

**Depends on:** none

**Steps:**
1. Create a Drizzle schema table for both `kr` and `jp` schemas, following `src/database/schema/gem_promotions.ts`.
2. Columns:
   - `id uuid primary key`
   - `userId varchar('user_id', { length: 128 }).notNull()`
   - `eventType varchar('event_type', { length: 40 }).notNull()`
   - `context varchar('context', { length: 40 }).notNull()`
   - `targetId varchar('target_id', { length: 128 })`
   - `offerId varchar('offer_id', { length: 80 })`
   - `metadata jsonb('metadata').$type<Record<string, unknown>>()`
   - `createdAt timestamps.createdAt`
3. Export `krUserOfferEvents`, `jpUserOfferEvents`, `UserOfferEvent`, `NewUserOfferEvent`.
4. Add exports/imports to schema barrel files.

**Verification:**
- `pnpm exec tsc --noEmit --pretty false` if feasible.
- If repo-wide typecheck is noisy, run `pnpm test -- user-offer-event` after tests exist.

**Subagent Prompt:**
> Repo: `/Volumes/eungu/projects/solo-nestjs-api`. Create `src/database/schema/user_offer_events.ts` using the country-schema pattern from `src/database/schema/gem_promotions.ts`. Export KR/JP tables and types, then wire them into `src/database/schema/schema.ts` and `src/database/schema/index.ts`. Do not touch unrelated schemas. Verify with TypeScript or explain existing baseline failures.

### Task 2: Add migration for `user_offer_events`

**Repo:** `/Volumes/eungu/projects/solo-nestjs-api`
**Files:**
- Create `src/database/migrations/20260510_create_user_offer_events.ts`
- Modify `src/database/run-migrations.ts`

**Depends on:** Task 1

**Steps:**
1. Create the table in `kr` and `jp`.
2. Add indexes:
   - `(user_id, created_at DESC)`
   - `(user_id, event_type, created_at DESC)`
   - `(user_id, target_id, event_type, created_at DESC)`
3. Register migration in `src/database/run-migrations.ts`.
4. The migration must be idempotent with `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`.

**Verification:**
- `pnpm migration:run` only against local/dev when explicitly approved.
- Static verification: `rg "20260510_create_user_offer_events" src/database/run-migrations.ts`.

**Subagent Prompt:**
> Repo: `/Volumes/eungu/projects/solo-nestjs-api`. Add migration `src/database/migrations/20260510_create_user_offer_events.ts` for `kr` and `jp` `user_offer_events`, with user/time and user/event/time indexes. Register it in `src/database/run-migrations.ts`. Do not run migrations unless explicitly approved. Verify the migration name appears in `run-migrations.ts`.

### Task 3: Implement offer event DTO and repository

**Repo:** `/Volumes/eungu/projects/solo-nestjs-api`
**Files:**
- Create `src/events/dto/offer.dto.ts`
- Create `src/events/repository/user-offer-event.repository.ts`

**Depends on:** Task 1

**Steps:**
1. Define string union or enum constants:
   - `profile_view`
   - `paid_action_attempt`
   - `insufficient_gem_modal_view`
   - `purchase_page_view`
   - `offer_impression`
   - `offer_tap`
   - `purchase_completed`
2. Define `OfferContext`: `home | profile | chat | gem_store | matching_history`.
3. Define `RecordOfferEventRequest` with validation decorators.
4. Repository methods:
   - `create(userId, dto)`
   - `countRecent(userId, eventType, since)`
   - `countRecentByTarget(userId, eventType, targetId, since)`
   - `hasRecent(userId, eventType, since)`
5. Use `CountryProvider` or existing schema context pattern from `GemPromotionRepository`.

**Verification:**
- Add a small unit test if repository mocking pattern exists.
- `pnpm test -- user-offer-event` after test creation.

**Subagent Prompt:**
> Repo: `/Volumes/eungu/projects/solo-nestjs-api`. Create offer DTO and repository files. Follow `GemPromotionRepository` for country-scoped table selection. Implement create/count helpers for recent event rules. Keep event names as exact string literals listed in the plan. Verify with targeted tests or TypeScript.

### Task 4: Add event ingestion controller

**Repo:** `/Volumes/eungu/projects/solo-nestjs-api`
**Files:**
- Create `src/events/controller/v1/offer.controller.ts`
- Modify `src/events/event.module.ts`

**Depends on:** Task 3

**Steps:**
1. Add `POST /v1/offers/events`.
2. Require `Role.USER, Role.ADMIN`, matching `PromotionController`.
3. Controller calls `UserOfferEventRepository.create(user.id, dto)`.
4. Return `{ ok: true }`.
5. Register controller and repository provider in `EventModule`.

**Verification:**
- `pnpm test -- offer.controller` if test exists.
- `rg "OfferController" src/events/event.module.ts`.

**Subagent Prompt:**
> Repo: `/Volumes/eungu/projects/solo-nestjs-api`. Add `POST /v1/offers/events` controller in `src/events/controller/v1/offer.controller.ts`, register it in `src/events/event.module.ts`, and wire `UserOfferEventRepository`. Follow `PromotionController` auth/role style. Verify module registration with `rg`.

## Commit Group 2: Backend offer decision API

Commit: `feat(offers): return next 72h iap offer`

### Task 5: Implement offer decision service

**Repo:** `/Volumes/eungu/projects/solo-nestjs-api`
**Files:**
- Create `src/events/services/offer-decision.service.ts`
- Modify `src/events/dto/offer.dto.ts`

**Depends on:** Tasks 3-4

**Steps:**
1. Define response DTO `NextOfferResponse`.
2. Inject:
   - `GemRepository`
   - `UserOfferEventRepository`
   - `DateTimeService`
   - user repository or Drizzle access for `users.createdAt`
   - feature flag service if existing flag service is available in module
3. Implement hard gates:
   - feature flag enabled
   - no completed payment
   - account age <= 72h
4. Implement product lookup by `appleSku`. Use active products from `GemRepository.getActiveProducts()`.
5. Implement priority:
   - `gem_50` for shortage >= 2 or purchase page view >= 1
   - `gem_25` for profile view >= 3 or same target profile view >= 2
   - `gem_sale_10` for paid action attempt >= 1 or shortage >= 1
6. Return null if the product SKU is missing/inactive; log a warning.

**Verification:**
- Unit tests for:
  - ineligible after completed payment
  - ineligible after 72h
  - `paid_action_attempt` returns `gem_sale_10`
  - `profile_view >= 3` returns `gem_25`
  - `insufficient_gem_modal_view >= 2` returns `gem_50`

**Subagent Prompt:**
> Repo: `/Volumes/eungu/projects/solo-nestjs-api`. Create `OfferDecisionService` with hard gates and priority rules from this plan. Use `GemRepository.hasCompletedPayment`, active product lookup by `appleSku`, and `UserOfferEventRepository` counts. Add unit tests for the five listed cases. Do not modify Apple IAP grant logic in this task.

### Task 6: Add `GET /v1/offers/next`

**Repo:** `/Volumes/eungu/projects/solo-nestjs-api`
**Files:**
- Modify `src/events/controller/v1/offer.controller.ts`
- Modify `src/events/event.module.ts`

**Depends on:** Task 5

**Steps:**
1. Add `GET /v1/offers/next`.
2. Query param: `context`.
3. Current user from `@CurrentUser()`.
4. Call `OfferDecisionService.getNextOffer(user.id, context)`.
5. Return `{ offer }`.
6. Register service provider in `EventModule`.

**Verification:**
- `pnpm test -- offer`
- Manual local curl after auth setup if available.

**Subagent Prompt:**
> Repo: `/Volumes/eungu/projects/solo-nestjs-api`. Extend `OfferController` with `GET /v1/offers/next?context=...`, returning `{ offer }` from `OfferDecisionService`. Register service in `EventModule`. Verify with targeted offer tests.

### Task 7: Thread offer attribution through Apple IAP verification

**Repo:** `/Volumes/eungu/projects/solo-nestjs-api`
**Files:**
- Modify `src/payment/dto/apple-iap.dto.ts`
- Modify `src/payment/controller/apple-iap.controller.ts`
- Modify `src/payment/services/apple-iap.service.ts`
- Modify `src/payment/events/payment-success.event.ts` if needed
- Modify `src/types/mixpanel-server-events.ts` if needed

**Depends on:** Task 6

**Steps:**
1. Ensure `VerifyPurchase` accepts optional `attribution.offerId`, `attribution.offerReason`, `attribution.offerContext`.
2. Do not make these fields required.
3. Preserve existing `paymentEventId` behavior.
4. In `AppleIapService.emitPaymentSuccessEvent`, pass attribution through unchanged.
5. Optionally record `purchase_completed` via `UserOfferEventRepository` after successful verification if `offerId` exists. This must not block purchase success.

**Verification:**
- Existing Apple IAP service tests still pass.
- Add or update one test proving attribution passes into `PaymentSuccessEvent`.

**Subagent Prompt:**
> Repo: `/Volumes/eungu/projects/solo-nestjs-api`. Extend Apple IAP verify attribution to carry optional `offerId`, `offerReason`, and `offerContext`. Preserve server-authoritative payment flow and do not block success on analytics/event recording failures. Update tests around `AppleIapService`.

## Commit Group 3: App API, attribution, and offer UI

Commit: `feat(payment): show 72h iap offers from backend`

### Task 8: Add app offer API and query hook

**Repo:** `/Volumes/eungu/projects/sometimes-app`
**Files:**
- Create `src/features/payment/types/offer.ts`
- Create `src/features/payment/api/offers.ts`
- Create `src/features/payment/queries/use-next-offer.ts`

**Depends on:** Backend API contract

**Steps:**
1. Define `OfferContext`, `OfferReason`, `NextOffer`, `NextOfferResponse`.
2. Add `fetchNextOffer(context)` calling `axiosClient.get('/v1/offers/next', { params: { context } })`.
3. Add `recordOfferEvent(body)` calling `axiosClient.post('/v1/offers/events', body)`.
4. Query key: `['payment', 'next-offer', country, context]`.
5. `staleTime`: 30-60 seconds.

**Verification:**
- TypeScript compile for new files.
- If test infra exists, add a mock API unit test.

**Subagent Prompt:**
> Repo: `/Volumes/eungu/projects/sometimes-app`. Add offer types, API functions, and `useNextOffer` query. Follow `src/features/payment/api/gem-promotions.ts` and `src/features/payment/queries/use-promotions.ts`. Use `/v1/offers/next` and `/v1/offers/events`. Verify TypeScript.

### Task 9: Add reusable offer presentation component

**Repo:** `/Volumes/eungu/projects/sometimes-app`
**Files:**
- Create `src/features/payment/ui/offer/offer-card.tsx`
- Optional create `src/features/payment/ui/offer/offer-bottom-sheet.tsx`
- Modify locale files:
  - `src/shared/libs/locales/ko/features/payment.json`
  - `src/shared/libs/locales/ja/features/payment.json`

**Depends on:** Task 8

**Steps:**
1. Component props:
   - `offer`
   - `onPress`
   - `variant: 'inline' | 'sheet'`
2. Display server `title`, `subtitle`, `ctaText`, and remaining time from `expiresAt`.
3. Avoid hardcoding price text in UI unless server includes it. The product card/gem-store remains price source.
4. Add Korean/Japanese fallback labels only for generic UI words, not product amounts.

**Verification:**
- Component renders without layout overflow on small width.
- `pnpm test -- offer-card` if component tests are added.

**Subagent Prompt:**
> Repo: `/Volumes/eungu/projects/sometimes-app`. Create a reusable offer card/bottom-sheet component under `src/features/payment/ui/offer`. Use server title/subtitle/cta. Keep price display out unless already available from server. Add minimal locale fallback strings. Verify TypeScript and layout basics.

### Task 10: Record behavior signals at entry points

**Repo:** `/Volumes/eungu/projects/sometimes-app`
**Files:**
- Modify `app/partner/view/[id].tsx`
- Modify `app/chat/[id].tsx`
- Modify `src/features/matching-history/ui/matching-history-card.tsx`
- Modify exact insufficient-gem modal components after locating with:
  - `rg "insufficient_gem|insufficient_gems|gem_shortage" src app`

**Depends on:** Task 8

**Steps:**
1. On profile detail screen mount or profile reveal action, record `profile_view` with `context='profile'`, `targetId=partnerId`.
2. When user taps a paid action that cannot proceed due to gem shortage, record:
   - `paid_action_attempt`
   - `insufficient_gem_modal_view`
3. On chat open shortage, use `context='chat'`.
4. On matching history paid profile unlock shortage, use `context='matching_history'`.
5. Deduplicate within a screen session using `useRef` to avoid repeated events on rerender.

**Verification:**
- Manual dev logging or API mock proves one event per user action.
- No event should block the original UI flow if request fails.

**Subagent Prompt:**
> Repo: `/Volumes/eungu/projects/sometimes-app`. Add non-blocking `recordOfferEvent` calls to profile, chat, matching-history, and insufficient-gem entry points. Deduplicate mount events with `useRef`. Do not change paid feature business logic. Verify events are fire-and-forget and failures do not block UI.

### Task 11: Show offer on eligible paid-action contexts

**Repo:** `/Volumes/eungu/projects/sometimes-app`
**Files:**
- Modify entry points from Task 10.
- Use `src/features/payment/ui/offer/offer-card.tsx` or bottom sheet.
- Modify navigation to `app/purchase/gem-store.tsx` with query params.

**Depends on:** Tasks 8-10

**Steps:**
1. On insufficient-gem or paid-action attempt, call/use `useNextOffer(context)`.
2. If `offer` exists, show offer UI before navigating to gem-store.
3. On CTA:
   - record `offer_tap`
   - navigate to `/purchase/gem-store?offerId=...&offerReason=...&offerContext=...&returnTo=...`
4. If no offer exists, keep existing flow.

**Verification:**
- Eligible mocked response shows offer.
- Null response keeps existing insufficient-gem flow.

**Subagent Prompt:**
> Repo: `/Volumes/eungu/projects/sometimes-app`. Display the server offer in paid-action shortage contexts. CTA should record `offer_tap` and navigate to gem-store with `offerId`, `offerReason`, `offerContext`, and existing `returnTo`. Preserve old flow when no offer is returned.

### Task 12: Pass offer attribution through purchase

**Repo:** `/Volumes/eungu/projects/sometimes-app`
**Files:**
- Modify `app/purchase/gem-store.tsx`
- Modify `src/features/payment/data-sources/apple-iap-data-source.tsx`
- Modify `src/features/payment/data-sources/portone-data-source.tsx` only if web/PG parity is desired
- Modify `src/widgets/gem-store-v2/context/gem-store-context.tsx` if source contract needs offer metadata

**Depends on:** Task 11

**Steps:**
1. Read `offerId`, `offerReason`, `offerContext` from route params in gem-store.
2. Store/pass them into the data source purchase call.
3. In Apple IAP verify call, include:
   - `attribution.offerId`
   - `attribution.offerReason`
   - `attribution.offerContext`
4. Record `purchase_page_view` when gem-store opens with offer params.
5. Do not call success or finish transaction before backend verify returns success.

**Verification:**
- Mocked Apple IAP verify payload includes offer attribution.
- Existing purchase success tests still pass.

**Subagent Prompt:**
> Repo: `/Volumes/eungu/projects/sometimes-app`. Thread `offerId`, `offerReason`, and `offerContext` from gem-store route params into Apple IAP verify attribution. Record `purchase_page_view` for offer visits. Preserve existing server-authoritative purchase success flow.

## Commit Group 4: Admin operation and reporting

Commit: `feat(admin): manage 72h offer targeting metadata`

### Task 13: Extend backend promotion schema for targeting metadata

**Repo:** `/Volumes/eungu/projects/solo-nestjs-api`
**Files:**
- Modify `src/database/schema/gem_promotions.ts`
- Create migration `src/database/migrations/20260510_add_offer_targeting_to_gem_promotions.ts`
- Modify `src/database/run-migrations.ts`
- Modify `src/events/dto/gem-promotion.dto.ts`
- Modify `src/events/services/promotion.service.ts`

**Depends on:** Backend MVP can ship without this. Do after MVP if admin-managed targeting is required.

**Steps:**
1. Add nullable fields:
   - `targetingRule varchar('targeting_rule', { length: 64 })`
   - `context varchar('context', { length: 40 })`
   - `maxImpressions integer('max_impressions')`
   - `priority integer('priority').notNull().default(0)`
2. Add DTO fields to create/update/admin response.
3. For V1, `OfferDecisionService` can still use code constants. For V2, read active promotion rows matching rule/context.

**Verification:**
- Migration static registration.
- Promotion create/update tests cover new optional fields.

**Subagent Prompt:**
> Repo: `/Volumes/eungu/projects/solo-nestjs-api`. Add optional targeting metadata fields to `gem_promotions`, migration, DTOs, and promotion service persistence. Keep existing promotion behavior backward compatible. Verify existing promotion tests still pass.

### Task 14: Extend Project-Solo promotion form and table

**Repo:** `/Volumes/eungu/projects/Project-Solo`
**Files:**
- Modify `types/admin.ts`
- Modify `app/admin/promotions/components/PromotionFormDrawer.tsx`
- Modify `app/admin/promotions/components/PromotionTable.tsx`
- Modify `app/services/admin/promotions.ts` if request/response typing changes

**Depends on:** Task 13

**Steps:**
1. Add fields to `Promotion`, `CreatePromotionRequest`, `UpdatePromotionRequest`:
   - `targetingRule`
   - `context`
   - `maxImpressions`
   - `priority`
2. Add selects:
   - `targetingRule`: `first_paid_action`, `profile_interest`, `high_intent_shortage`, `purchase_abandon`
   - `context`: `home`, `profile`, `chat`, `gem_store`, `matching_history`
3. Add numeric inputs for priority and max impressions.
4. Show rule/context/priority columns in table.

**Verification:**
- `pnpm lint` or project type check.
- Manual admin page smoke with local dev server.

**Subagent Prompt:**
> Repo: `/Volumes/eungu/projects/Project-Solo`. Extend promotions admin types, drawer, and table for targeting rule, context, priority, and max impressions. Follow current MUI form style in `PromotionFormDrawer.tsx`. Verify lint/typecheck.

### Task 15: Add admin metrics endpoint and UI

**Repo:** backend + admin
**Files backend:**
- Create `src/events/services/offer-analytics.service.ts`
- Add admin endpoint in `src/events/controller/v1/admin-promotion.controller.ts` or new admin offer controller.

**Files admin:**
- Modify `app/admin/promotions/promotions-client.tsx`
- Modify/create a stats component under `app/admin/promotions/components/`

**Depends on:** Tasks 1-14

**Steps:**
1. Backend aggregates `user_offer_events`:
   - impressions
   - taps
   - purchases
   - tap rate
   - purchase conversion
2. Admin displays metrics per `offerId`/promotion.
3. Keep metrics read-only.

**Verification:**
- Backend unit test for aggregation query.
- Admin page renders empty state and populated mock state.

**Subagent Prompt:**
> Repos: `/Volumes/eungu/projects/solo-nestjs-api` and `/Volumes/eungu/projects/Project-Solo`. Add read-only offer metrics from `user_offer_events` and display them on promotions admin. Keep write flows unchanged. Verify backend aggregation and admin render states.

## Commit Group 5: Rollout and QA

Commit: `chore(offers): add rollout checks for 72h iap offers`

### Task 16: Add feature flags and seed defaults

**Repo:** `/Volumes/eungu/projects/solo-nestjs-api`
**Files:**
- Existing feature flag seed/migration files after locating with `rg "feature_flags|FeatureFlags" src/database src/feature-flags`

**Depends on:** Task 6

**Steps:**
1. Add `iap_72h_offer_enabled` default false for `public`, `kr`, and `jp` if feature flags are schema-scoped.
2. Document cache/TTL behavior.
3. Add a one-line ops note in this plan after implementation.

**Verification:**
- Feature flag visible in admin `/admin/feature-flags`.

**Subagent Prompt:**
> Repo: `/Volumes/eungu/projects/solo-nestjs-api`. Add feature flag `iap_72h_offer_enabled` default false across applicable schemas following existing feature flag seed/migration pattern. Verify it is visible to Project-Solo feature flag admin after backend deploy.

### Task 17: End-to-end QA checklist

**Repos:** all three
**Depends on:** Tasks 1-16

**Steps:**
1. Test user created <72h, no purchases, no events: no home offer.
2. Record `paid_action_attempt`: `GET /v1/offers/next?context=profile` returns `gem_sale_10`.
3. Record 3 `profile_view`: next offer returns `gem_25`.
4. Record 2 `insufficient_gem_modal_view`: next offer returns `gem_50`.
5. Mark user as paid: next offer returns null.
6. Backdate user creation >72h: next offer returns null.
7. App offer CTA navigates to gem-store with offer params.
8. Apple verify payload includes attribution.
9. Payment success still grants correct gem quantity.
10. Admin can view/edit targeting metadata if Group 4 is shipped.

**Verification commands:**
- Backend: `pnpm test -- offer`
- App: targeted unit/smoke around offer API and Apple IAP attribution.
- Admin: `pnpm lint`

**Subagent Prompt:**
> Run the E2E checklist in this plan after backend, app, and admin branches are integrated. Verify the three SKU decisions, null states, purchase attribution, and no regression in Apple IAP gem grant. Report exact failures with endpoint, payload, and response.

## Implementation Order

Recommended MVP order:
1. Backend Groups 1-2.
2. App Group 3.
3. QA Group 5 with feature flag off/on in dev.
4. Admin Group 4 after MVP behavior is verified.

Reason: the user-facing value does not require admin-managed targeting on day one. Code constants for the three initial rules reduce scope and make the first experiment easier to validate. Admin targeting fields should be added once the offer engine has proven the event and conversion path.

## Rollback Plan

1. Turn off `iap_72h_offer_enabled`.
2. App should receive `{ offer: null }` and fall back to existing gem-store/promotion behavior.
3. Leave `user_offer_events` table in place; it is append-only analytics and does not affect purchases.
4. If Apple IAP attribution causes issues, remove only optional `offer*` attribution fields from client payload. Backend should ignore absent fields.
5. Never roll back Apple IAP unique transaction protection or server-authoritative verification.

## Open Questions Before Implementation

1. Should `gem_sale_10` be represented as an active `gem_products` row in every live schema, or only via Apple SKU fallback? Confirm with DB before release.
2. Should users be able to dismiss an offer for the rest of the 72h window? If yes, add `offer_dismissed` event and hard gate by dismissal.
3. Should Admin get a dedicated `/admin/offers` menu, or should this stay inside `/admin/promotions` for V1?
4. Should `gem_50` appear on D2 only, or immediately after two shortage events even on D0? Current recommendation: shortage rule can override time, but no home hero until D2.

## Approval Gate

Approve this plan before implementation. Once approved, execute in the order above and keep backend/app/admin changes in separate commits or PRs unless the deployment flow requires a coordinated merge.
