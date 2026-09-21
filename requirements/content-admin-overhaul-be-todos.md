# BE TODO — content admin overhaul

FE 측 어드민 콘텐츠 관리 개선(`feat/content-admin-overhaul`)에 동반 필요한 백엔드 작업 목록.
저장소: `solo-nestjs-api` (`/Users/user/projects/solo-nestjs-api`).

## P0: 카드뉴스 카테고리 6종 seed

현재 backend 에 `'notice'` 카테고리만 seed됨. FE 6종 강제 (`relationship`, `dating`,
`psychology`, `essay`, `qna`, `event`).

- 마이그레이션: 카테고리 row insert (kr/jp 양 스키마)
  - displayName: 연애, 데이트, 심리, 에세이, 질의응답, 이벤트
- `POST /admin/v2/content/card-news` 발행 시 위 코드 허용
- (선택) `GET /articles/category/list` 응답에 6종 + emojiUrl 포함하여 FE 동적 로딩 가능 (이미 `useCardNewsCategories` hook 적용됨)

## P1: sitemap 캐시 무효화 admin endpoint

```
POST /admin/v2/seo/sitemap/invalidate?kind=articles&country=kr
POST /admin/v2/seo/sitemap/invalidate?kind=cardnews&country=kr
```

응답: `{ success: boolean, invalidatedAt: ISO8601 }`

FE는 발행 후 즉시 호출하여 sitemap 캐시(1h) 우회. `/admin/seo` 페이지에 "캐시 무효화" 버튼 추가 예정.

## P2: 카드뉴스 발행 스케줄

현재 즉시 발행만 지원. `scheduledAt` 필드 + 크론 트리거로 `scheduled` 상태 → `published` 자동 전환.

- DB: `card_news.scheduled_at TIMESTAMP NULL`
- BullMQ delayed job 또는 cron worker

## P3: customBackgroundUrl OG 자동 추출 (image_only)

`layoutMode='image_only'` 카드시리즈 발행 시 첫 sectionImage URL을 자동으로 ogImage 매핑.
현재 첫 컷 미반영 → SEO 미리보기에서 hero 빠짐.

## P4: Mixpanel SEO_HIT 어드민 대시보드

이벤트는 발사되고 있음. `/admin/seo` 페이지에 크롤러별 일별 hit count 카드 추가 예정.

```
GET /admin/v2/seo/hits?from=2026-04-01&to=2026-04-30&groupBy=crawler|day
```

## P5: aritcle (sometime-articles) 카테고리 enum 정합

현재 BE: `story | interview | tips | team | update | safety` (legacy).
FE NEW_CATEGORY_OPTIONS: `relationship | dating | psychology | essay | qna | event`.

- 두 그룹을 통합할지, sometime-articles 는 legacy 유지할지 결정 필요.
- 결정 후 `sometimeArticleSchema.articleCategoryValues` 와 BE enum 동기.

## P6: notice publish 시 push 필드 검증

스펙 C-2 / C-4: `pushEnabled=true` → publish 호출에서 `pushTitle`/`pushMessage` 둘 다 필수.
FE PublishDialog 는 message만 required. 서버가 두 항목 모두 NOT NULL 체크하면 400 가능.
- 서버 검증 정책 명확화 (title 선택 vs 필수)
- FE 추가 검증 또는 BE 완화 중 결정 필요.
