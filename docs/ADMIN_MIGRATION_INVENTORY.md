# Admin API 마이그레이션 인벤토리

> 생성일: 2025-01-06
> 최종 검토: 2025-01-06 (2차 검토 완료)
> 목적: sometimes-admin-main → sometimes-api 통합을 위한 현황 분석

---

## 📊 요약

| 구분 | 개수 |
|------|------|
| sometimes-admin-main 전용 API (마이그레이션 필요) | **13개** |
| Route 충돌/중복 (스킵) | 2개 |
| sometimes-api에 이미 존재 (마이그레이션 불필요) | 35개+ |
| DB 스키마 마이그레이션 필요 | 1개 (admin_goals) |
| ⚠️ 프론트에서 호출하지만 백엔드 없음 | 1개 (admin/analytics) |

---

## 🚨 긴급 발견: 백엔드 없는 API

프론트엔드 `app/services/analytics.ts`에서 호출하지만 **양쪽 백엔드 모두에 없음**:
- `/admin/analytics/active-users`
- `/admin/analytics/page-views`
- `/admin/analytics/traffic-sources`
- `/admin/analytics/user-engagement`
- `/admin/analytics/top-pages`
- `/admin/analytics/user-demographics`
- `/admin/analytics/devices`
- `/admin/analytics/daily-traffic`
- `/admin/analytics/dashboard`

**→ 이 기능은 현재 동작하지 않는 것으로 추정됨**

---

## 🔴 마이그레이션 대상 (sometimes-admin-main → sometimes-api)

### 1. AdminGoalsController
| 항목 | 값 |
|------|-----|
| **Route** | `admin/goals` |
| **Endpoints** | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id` |
| **Service** | `admin-goals.service.ts` |
| **Repository** | `admin-goals.repository.ts` |
| **DTO** | `goals.dto.ts` |
| **DB Schema** | `admin_goals` ⚠️ **sometimes-api에 없음 - 마이그레이션 필요** |
| **Dependencies** | DrizzleService, users 테이블, iap_payments 테이블 |
| **Frontend Usage** | `app/services/dashboard.ts` → `/admin/goals` |
| **복잡도** | 🟢 낮음 (독립적) |

### 2. AdminTicketController
| 항목 | 값 |
|------|-----|
| **Route** | `admin/tickets` |
| **Endpoints** | `GET /user/:userId`, `POST /`, `DELETE /` |
| **Service** | `admin-ticket.service.ts` |
| **Repository** | `admin-ticket.repository.ts` |
| **DTO** | `ticket.dto.ts` |
| **DB Schema** | `tickets` ✅ sometimes-api에 존재 |
| **Dependencies** | DrizzleService, users 테이블, tickets 테이블 |
| **Frontend Usage** | `app/services/admin.ts` → `/admin/tickets/*` |
| **복잡도** | 🟢 낮음 |

### 3. AdminUniversityController
| 항목 | 값 |
|------|-----|
| **Route** | `admin/universities` |
| **Endpoints** | `GET /` |
| **Service** | `admin-university.service.ts` |
| **Repository** | `admin-university.repository.ts` |
| **DTO** | 없음 (string[] 반환) |
| **DB Schema** | `universities` 테이블 참조 |
| **Dependencies** | DrizzleService |
| **Frontend Usage** | `app/services/admin.ts` → `/admin/universities` |
| **복잡도** | 🟢 매우 낮음 (단순 조회) |

### 4. AdminSmsController
| 항목 | 값 |
|------|-----|
| **Route** | `admin/sms` |
| **Endpoints** | `POST /templates`, `GET /templates`, `GET /templates/:id`, `PUT /templates/:id`, `DELETE /templates/:id`, `GET /users/search`, `POST /send-bulk`, `GET /histories`, `GET /histories/:id` |
| **Service** | `admin-sms-template.service.ts`, `admin-bulk-sms.service.ts` |
| **Repository** | 없음 (Service에서 직접 DB 접근) |
| **DTO** | `sms-template.dto.ts`, `sms-history.dto.ts`, `bulk-sms.dto.ts` |
| **DB Schema** | sms 관련 테이블들 |
| **Dependencies** | DrizzleService, 외부 SMS API |
| **Frontend Usage** | `app/services/sms.ts` → `/admin/sms/*` |
| **복잡도** | 🟡 중간 (외부 서비스 의존) |

### 5. AdminPushNotificationController
| 항목 | 값 |
|------|-----|
| **Route** | `admin/push-notifications` |
| **Endpoints** | `POST /filter-users`, `POST /send`, `GET /scheduled`, `DELETE /scheduled/:scheduleId` |
| **Service** | `admin-push-notification.service.ts` |
| **Repository** | `admin-push-notification.repository.ts` |
| **DTO** | `push-notification.dto.ts` |
| **DB Schema** | push_notification 관련 테이블 |
| **Dependencies** | DrizzleService, FCM/APNs |
| **Frontend Usage** | `app/services/admin.ts` → `/admin/push-notifications/*` |
| **복잡도** | 🟡 중간 |

### 6. AdminChatController
| 항목 | 값 |
|------|-----|
| **Route** | `admin/chat` |
| **Endpoints** | `GET /rooms`, `GET /messages` |
| **Service** | `admin-chat.service.ts` |
| **Repository** | 없음 |
| **DTO** | `chat.dto.ts` |
| **DB Schema** | chat_rooms, chat_messages 테이블 |
| **Dependencies** | DrizzleService |
| **Frontend Usage** | `app/services/chat.ts` → `/admin/chat/*` |
| **복잡도** | 🟢 낮음 |

### 7. AdminAiChatController
| 항목 | 값 |
|------|-----|
| **Route** | `admin/ai-chat` |
| **Endpoints** | `GET /sessions`, `GET /messages` |
| **Service** | `admin-ai-chat.service.ts` |
| **Repository** | 없음 |
| **DTO** | `ai-chat.dto.ts` |
| **DB Schema** | ai_chat 관련 테이블 |
| **Dependencies** | DrizzleService |
| **Frontend Usage** | `app/services/admin.ts` → `/admin/ai-chat/*` |
| **복잡도** | 🟢 낮음 |

### 8. AdminIapPaymentController
| 항목 | 값 |
|------|-----|
| **Route** | `admin/iap-payments` |
| **Endpoints** | `GET /`, `GET /stats`, `GET /users/:userId` |
| **Service** | `admin-iap-payment.service.ts` |
| **Repository** | `admin-iap-payment.repository.ts` |
| **DTO** | `iap-payment.dto.ts` |
| **DB Schema** | iap_payments 테이블 |
| **Dependencies** | DrizzleService |
| **Frontend Usage** | `app/services/sales.ts` → `/admin/iap-payments/stats` |
| **복잡도** | 🟢 낮음 |

### 9. AdminMailController ⚠️ Route 중복
| 항목 | 값 |
|------|-----|
| **Route** | `admin/mail` |
| **Endpoints** | `POST /pre-signup` |
| **Service** | CommonModule의 MailService 사용 |
| **Repository** | 없음 |
| **DTO** | `email.dto.ts` |
| **Dependencies** | MailService (외부 서비스) |
| **Frontend Usage** | 직접 호출 없음 (내부용?) |
| **복잡도** | 🟢 낮음 |
| **⚠️ 주의** | sometimes-api에 동일 route 존재 (`admin/mail`)하지만 빈 구현. 병합 불필요 (비활성 기능) |

### 10. AdminNotificationController ⚠️ Route 유사
| 항목 | 값 |
|------|-----|
| **Route** | `admin/notification` (단수) |
| **Endpoints** | `POST /email`, `POST /sms` |
| **Service** | CommonModule (MailService, SmsService) |
| **Repository** | 없음 |
| **DTO** | `notification.dto.ts` |
| **Dependencies** | MailService, SmsService, UserRepository |
| **Frontend Usage** | `app/services/admin.ts` → `/admin/notification/email`, `/admin/notification/sms` |
| **복잡도** | 🟢 낮음 |
| **⚠️ 주의** | sometimes-api에는 `admin/notifications`(복수) 존재 - 다른 기능 (푸시알림). 이건 이메일/SMS 전송 기능으로 별도 마이그레이션 필요 |

### 11. AdminMatchLikeNotificationController
| 항목 | 값 |
|------|-----|
| **Route** | `admin/match-like-notifications` |
| **Endpoints** | `POST /send-manual`, `GET /preview`, `POST /test-schedule` |
| **Service** | `match-like-notification.service.ts` |
| **Repository** | 없음 |
| **DTO** | `match-like-history.dto.ts` |
| **Dependencies** | DrizzleService, PushNotification |
| **Frontend Usage** | 직접 호출 없음 (내부용?) |
| **복잡도** | 🟡 중간 |

### 12. AdminUniversityVerificationController
| 항목 | 값 |
|------|-----|
| **Route** | `admin/university-verification` |
| **Endpoints** | `GET /pending`, `POST /approve`, `POST /reject` |
| **Service** | `admin-university-verification.service.ts` |
| **Repository** | 없음 |
| **DTO** | `university-verification.dto.ts` |
| **Dependencies** | DrizzleService, users 테이블 |
| **Frontend Usage** | `app/services/admin.ts` → `/admin/university-verification/*` |
| **복잡도** | 🟢 낮음 |

### 13. AdminVersionUpdatesController
| 항목 | 값 |
|------|-----|
| **Route** | `admin/version-updates` |
| **Endpoints** | `POST /`, `PUT /:id`, `GET /latest`, `GET /`, `GET /:id` |
| **Service** | `admin-version-updates.service.ts` |
| **Repository** | 없음 |
| **DTO** | `version-updates.dto.ts` |
| **DB Schema** | version_updates 테이블 |
| **Dependencies** | DrizzleService |
| **Frontend Usage** | `app/services/version.ts` → `/admin/version-updates/*` |
| **복잡도** | 🟢 낮음 |

### 14. FemaleRetentionController
| 항목 | 값 |
|------|-----|
| **Route** | `admin/female-retention` |
| **Endpoints** | `GET /`, `POST /:userId` |
| **Service** | `female-retention.service.ts` |
| **Repository** | `female-retention.repository.ts` |
| **DTO** | `female-retention.dto.ts` |
| **DB Schema** | users 테이블 |
| **Dependencies** | DrizzleService, UserRepository |
| **Frontend Usage** | `app/services/admin.ts` → `/admin/female-retention/*` |
| **복잡도** | 🟢 낮음 |

---

## 🟢 sometimes-api에 이미 존재하는 Admin API (마이그레이션 불필요)

| Route | Frontend 호출 | 비고 |
|-------|---------------|------|
| `admin/matching` | ✅ `/admin/matching/*` | |
| `admin/profiles` | ✅ `/admin/profiles/*` | |
| `admin/stats` | ✅ `/admin/stats/*` | |
| `admin/users` | ✅ `/admin/users/*` | |
| `admin/appearance` | ✅ | |
| `admin/community` | ✅ `/admin/community/*` | |
| `admin/gems` | ✅ `/admin/gems/*` | |
| `admin/posts/card-news` | ✅ `/admin/posts/card-news/*` | ⚠️ admin-main의 `admin/card-news`는 사용 안 함 |
| `admin/background-presets` | ✅ `/admin/background-presets/*` | |
| `admin/dashboard` | ✅ `/admin/dashboard/*` | |
| `admin/deleted-females` | ✅ `/admin/deleted-females/*` | |
| `admin/dormant-likes` | ✅ `/admin/dormant-likes/*` | |
| `admin/refund` | ✅ `/admin/refund/*` | |
| `admin/payments/apple` | ✅ `/admin/apple-refund/*` | |
| `admin/stats/sales` | ✅ `/admin/stats/sales/*` | |
| `admin/stats/withdrawals` | ✅ `/admin/stats/withdrawals/*` | |
| `admin/instagram-reviews` | ? | |
| `admin/profile-images` | ✅ `/admin/profile-images/*` | |
| `admin/user-review` | ✅ `/admin/user-review/*` | |
| `admin/notifications` (복수) | ? | 푸시알림 전용 (이메일/SMS 아님) |
| `admin/mail` | ❌ | 빈 구현 (비활성), admin-main도 동일 |
| `admin/moment` | ? | |
| `admin/batch` | ? | |
| `admin/banners` | ✅ `/admin/banners/*` | |
| `admin/stats/matching-pool` | ? | |
| `admin/scheduled-matching/config` | ? | |
| `admin/events/roulette` | ? | |
| `admin/human-rank` | ? | |
| `admin/questions` | ? | |
| `admin/weekly-questions/scheduler` | ? | |
| `admin/jp/identity` | ? | 일본 전용 |
| `admin/v1/dev` | ? | 개발용 |
| `admin/v1/migration` | ? | 마이그레이션용 |
| `admin/v1/fake-users` | ? | 테스트용 |
| `admin/image-optimizer-test` | ? | 테스트용 |

---

## ⚠️ 주의사항

### 1. DB 스키마 마이그레이션 필요
- `admin_goals` 테이블이 sometimes-api에 없음
- 마이그레이션 스크립트 필요

### 2. 카드뉴스 Route 차이 → 스킵 (충돌 아님)
- sometimes-admin-main: `admin/card-news` (GET /list, POST, GET /:id, PUT /:id, DELETE /:id, POST /:id/publish)
- sometimes-api: `admin/posts/card-news` (GET, POST, GET /:id, PUT /:id, DELETE /:id, POST /:id/publish, POST /section-images/upload)
- **Route가 다름** - 프론트엔드는 `admin/posts/card-news` 사용 중
- **기능은 유사하지만 구현이 다름** (admin-main은 authToken 전달, api는 CurrentUser 사용)
- → **sometimes-api 버전 유지, admin-main 버전 스킵**

### 3. AdminMailController → 스킵
- **양쪽 모두 빈 구현** (비활성 기능)
- sometimes-api: 주석 처리된 코드, void 반환
- sometimes-admin-main: 가짜 성공 응답만 반환
- 프론트엔드에서 호출하지 않음
- **마이그레이션 불필요**

### 4. AdminNotificationController (단수) vs AdminNotificationController (복수)
- sometimes-admin-main: `admin/notification` → 이메일/SMS 전송 기능
- sometimes-api: `admin/notifications` → 푸시알림 기능
- **서로 다른 기능이므로 admin-main 버전 마이그레이션 필요** (route: `admin/notification`)

### 5. 공통 모듈 의존성 차이
- sometimes-admin-main의 Guard/Decorator 경로:
  - `@/auth/guards/jwt-auth.guard` 또는 `@/common/guards/jwt-auth.guard`
  - `@/auth/guards/roles.guard` 또는 `@/common/guards/roles.guard`
- sometimes-api의 Guard/Decorator 경로:
  - `@/auth/decorators` (Roles)
  - `@/auth/domain/user-role.enum` (Role)
- **마이그레이션 시 import 경로 수정 필수**

---

## 📋 마이그레이션 순서 (권장)

### 마이그레이션 대상 (13개)

| 순서 | Controller | Route | 이유 |
|------|------------|-------|------|
| 1 | AdminUniversityController | `admin/universities` | 가장 단순, 의존성 없음, GET 1개 |
| 2 | AdminTicketController | `admin/tickets` | 독립적, tickets 테이블 이미 존재 |
| 3 | AdminGoalsController | `admin/goals` | 독립적, **DB 스키마 마이그레이션 포함** |
| 4 | AdminChatController | `admin/chat` | 단순 조회 |
| 5 | AdminAiChatController | `admin/ai-chat` | 단순 조회 |
| 6 | AdminIapPaymentController | `admin/iap-payments` | 단순 조회 |
| 7 | AdminVersionUpdatesController | `admin/version-updates` | 독립적 |
| 8 | FemaleRetentionController | `admin/female-retention` | UserRepository 의존 |
| 9 | AdminUniversityVerificationController | `admin/university-verification` | 유저 관련 |
| 10 | AdminNotificationController | `admin/notification` (단수) | 이메일/SMS 전송, 외부 서비스 의존 |
| 11 | AdminSmsController | `admin/sms` | 외부 서비스 의존, 복잡 |
| 12 | AdminPushNotificationController | `admin/push-notifications` | 외부 서비스 의존, 복잡 |
| 13 | AdminMatchLikeNotificationController | `admin/match-like-notifications` | 복잡, 프론트 미사용 (내부용?) |

### 스킵 대상 (2개)

| Controller | Route | 스킵 이유 |
|------------|-------|----------|
| AdminMailController | `admin/mail` | 양쪽 모두 빈 구현, 프론트 미사용 |
| AdminCardNewsController | `admin/card-news` | Route 다름, sometimes-api의 `admin/posts/card-news` 사용 중 |

---

## 📁 파일 목록 (마이그레이션 대상)

### Controllers (13개, 2개 스킵)
```
src/controllers/admin/
├── admin-ai-chat.controller.ts          ✅ 마이그레이션
├── admin-card-news.controller.ts        ❌ 스킵 (route 충돌)
├── admin-chat.controller.ts             ✅ 마이그레이션
├── admin-goals.controller.ts            ✅ 마이그레이션
├── admin-iap-payment.controller.ts      ✅ 마이그레이션
├── admin-mail.controller.ts             ❌ 스킵 (빈 구현)
├── admin-match-like-notification.controller.ts  ✅ 마이그레이션
├── admin-notification.controller.ts     ✅ 마이그레이션 (이메일/SMS)
├── admin-push-notification.controller.ts  ✅ 마이그레이션
├── admin-sms.controller.ts              ✅ 마이그레이션
├── admin-ticket.controller.ts           ✅ 마이그레이션
├── admin-university-verification.controller.ts  ✅ 마이그레이션
├── admin-university.controller.ts       ✅ 마이그레이션
├── admin-version-updates.controller.ts  ✅ 마이그레이션
└── female-retention.controller.ts       ✅ 마이그레이션
```

### Services (13개, 2개 스킵)
```
src/services/admin/
├── activity-aggregator.service.ts       ? (사용처 확인 필요)
├── admin-ai-chat.service.ts             ✅ 마이그레이션
├── admin-bulk-sms.service.ts            ✅ 마이그레이션
├── admin-card-news.service.ts           ❌ 스킵
├── admin-chat.service.ts                ✅ 마이그레이션
├── admin-goals.service.ts               ✅ 마이그레이션
├── admin-iap-payment.service.ts         ✅ 마이그레이션
├── admin-push-notification.service.ts   ✅ 마이그레이션
├── admin-sms-template.service.ts        ✅ 마이그레이션
├── admin-ticket.service.ts              ✅ 마이그레이션
├── admin-university-verification.service.ts  ✅ 마이그레이션
├── admin-university.service.ts          ✅ 마이그레이션
├── admin-version-updates.service.ts     ✅ 마이그레이션
├── female-retention.service.ts          ✅ 마이그레이션
└── match-like-notification.service.ts   ✅ 마이그레이션
```

### Repositories (6개)
```
src/repository/admin/
├── admin-goals.repository.ts            ✅ 마이그레이션
├── admin-iap-payment.repository.ts      ✅ 마이그레이션
├── admin-push-notification.repository.ts  ✅ 마이그레이션
├── admin-ticket.repository.ts           ✅ 마이그레이션
├── admin-university.repository.ts       ✅ 마이그레이션
└── female-retention.repository.ts       ✅ 마이그레이션
```

### DTOs (마이그레이션 대상만)
```
src/dto/admin/
├── ai-chat.dto.ts                       ✅
├── bulk-sms.dto.ts                      ✅
├── chat.dto.ts                          ✅
├── female-retention.dto.ts              ✅
├── goals.dto.ts                         ✅
├── iap-payment.dto.ts                   ✅
├── match-like-history.dto.ts            ✅
├── notification.dto.ts                  ✅ (이메일/SMS용)
├── push-notification.dto.ts             ✅
├── sms-history.dto.ts                   ✅
├── sms-template.dto.ts                  ✅
├── ticket.dto.ts                        ✅
├── university-verification.dto.ts       ✅
└── version-updates.dto.ts               ✅
```

### DB Schema (1개 - 신규 생성 필요)
```
src/database/schema/
└── admin_goals.ts
```

---

---

## 🔍 Import 경로 변환 가이드

마이그레이션 시 아래 경로들을 변환해야 함:

| sometimes-admin-main | sometimes-api |
|---------------------|---------------|
| `@/common/guards/jwt-auth.guard` | Guard 사용 안 함 (Module level에서 처리) |
| `@/common/guards/roles.guard` | Guard 사용 안 함 |
| `@/common/decorators/roles.decorator` | `@/auth/decorators` |
| `@/common/enums/role.enum` | `@/auth/domain/user-role.enum` |
| `@/auth/guards/jwt-auth.guard` | 제거 (Module level) |
| `@/auth/guards/roles.guard` | 제거 (Module level) |
| `@/database/drizzle.service` | `@/database/drizzle.service` (동일) |
| `@/dto/admin/*` | `../dto/*` (sometimes-api 구조에 맞게) |
| `@/repository/admin/*` | `../repositories/*` |
| `@/services/admin/*` | `../services/*` |

---

## ✅ 다음 단계

1. **파일럿 선정**: AdminUniversityController (가장 단순, GET 1개)
2. **상세 체크리스트 작성**: 파일럿용
3. **마이그레이션 실행 및 검증**
4. **나머지 순차 진행**

---

## 📝 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2025-01-06 | 초안 작성 |
| 2025-01-06 | Route 중복 검토 완료 (AdminMail 스킵, AdminNotification 단수/복수 구분) |
| 2025-01-06 | Import 경로 변환 가이드 추가 |
| 2025-01-06 | **2차 검토**: 카드뉴스 구현 비교 (Route 다름 확인), 백엔드 없는 API 발견 (admin/analytics), sometimes-api 전체 route 목록 추가 |
