# 카드뉴스 Longform(1-page Article) — 어드민 웹 PRD

**버전:** v1.0
**작성일:** 2026-04-22
**문서 상태:** 초안 (Draft)
**프로젝트:** Project-Solo (Next.js 14 어드민 대시보드)

**관련 문서**
- 서버 PRD: `solo-nestjs-api/docs/prd/card-news-longform-server-prd.md`
- 서버 PRD(리뉴얼 선행): `solo-nestjs-api/docs/prd/card-news-renewal-server-prd.md`
- 앱 플랜: `~/.claude/plans/2026-04-21-2146-card-news-longform-app.md`

---

## 1. 개요 & 배경

서버에서 `articles.layout_mode` enum에 `longform` 값이 추가되었고, `body_markdown` / `read_time_minutes` 컬럼이 신규로 들어갔다. 기존 카드뉴스 타입(`article` / `image_only`)은 여러 장의 카드 섹션을 가로 스와이프로 읽는 포맷이며, `longform`은 **단일 Markdown 본문을 세로로 스크롤하며 읽는 브런치형 에세이/칼럼** 포맷이다.

어드민 관점에서 longform은 기존 카드뉴스와 다음이 다르다.
- `sections[]`를 사용하지 않음 (비활성 필드)
- `body` (Markdown) 단일 필드로 본문 저장
- `readTimeMinutes`는 서버가 자동 계산 (어드민은 readonly 미리보기)
- 배경 이미지(hero) / 카테고리 / 보상 / 푸시 알림은 공유

Project-Solo 현황 요약 (2026-04-22 기준)
- `/admin/content` 허브에 3개 탭 존재: `card-series`, `article`(sometime-articles 전용), `notice`
- 카드뉴스 에디터: `app/admin/content/components/forms/CardSeriesForm.tsx` — `LayoutModeSelector` 컴포넌트로 `article | image_only` 선택 가능
- 카드뉴스 API 서비스: `app/services/admin/content.ts` → `cardNews.{create,get,getList,update,publish}`
- 타입: `types/admin.ts` — `CardNewsLayoutMode`, `AdminCardNewsItem`, `CreateCardNewsRequest`, `UpdateCardNewsRequest`
- Zod 스키마: `app/admin/hooks/forms/schemas/card-news.schema.ts`
- Markdown 에디터 이미 존재: `app/admin/content/components/article/MarkdownEditor.tsx` (sometime-articles에서 사용 중)

---

## 2. 목표 & 비목표

### 2.1. 목표

1. 카드뉴스 타입에 `longform`을 1급(first-class) 지원 추가 — 타입/스키마/폼/리스트 반영
2. `/admin/content` 허브에 `longform` 탭 신설 → 기존 카드뉴스(`card-series`)와 시각적으로 분리
3. Longform 전용 에디터(`LongformForm`) 신설 — 본문 Markdown 1필드 + hero image + 메타데이터
4. 리스트/테이블에서 layoutMode를 구분해 노출, 발행/수정/삭제/푸시 플로우 공유
5. 상세 미리보기(`LongformPreview`)에서 앱과 동일한 세로 스크롤 레이아웃 제공
6. 기존 `card-series` 플로우에 영향 없음 (회귀 없음)

### 2.2. 비목표

- Markdown 본문 렌더링 엔진 교체 (기존 `MarkdownEditor` 재사용)
- 이미지 업로드 파이프라인 변경 (기존 `backgroundPresets.upload` / `cardNews.uploadSectionImage` 재사용)
- 보상 규칙 / 푸시 알림 페이로드 변경 (서버가 동일하게 처리)
- 어드민 권한/세션 체계 변경
- sometime-articles 도메인은 이 PRD 범위 밖 (longform은 카드뉴스 도메인)

---

## 3. 타입 & 스키마 변경

### 3.1. `types/admin.ts`

```ts
// BEFORE
export type CardNewsLayoutMode = 'article' | 'image_only';

// AFTER
export type CardNewsLayoutMode = 'article' | 'image_only' | 'longform';
export const CARD_NEWS_LAYOUT_MODES: CardNewsLayoutMode[] = [
  'article',
  'image_only',
  'longform',
];
export type CardNewsTrack = 'cards' | 'longform';
```

`AdminCardNewsItem` 확장:
```ts
export interface AdminCardNewsItem {
  // ...기존 필드
  layoutMode: CardNewsLayoutMode;
  body?: string;              // longform 본문 (Markdown)
  readTimeMinutes?: number;   // longform 예상 읽기 시간 (서버 계산)
  sections?: CardSection[];   // longform에서는 빈 배열
}
```

`CreateCardNewsRequest` 확장:
```ts
export interface CreateCardNewsRequest {
  // ...기존 필드
  layoutMode?: CardNewsLayoutMode;   // 'longform' 추가됨
  body?: string;                     // layoutMode='longform'일 때 필수
  sections?: Array<{                 // longform 시 생략
    order: number;
    title: string;
    content: string;
    imageUrl?: string;
  }>;
}
```

`UpdateCardNewsRequest` 도 `body?: string` 추가. (단, 서버가 `layoutMode` 변경을 거부하므로 수정 폼은 `layoutMode`를 readonly로 표시.)

### 3.2. Zod 스키마 (`app/admin/hooks/forms/schemas/card-news.schema.ts`)

기존 `cardNewsFormSchema` 는 카드시리즈 전용으로 유지(`article | image_only`만 허용). Longform 은 별도 스키마 파일로 분리.

신규 파일: `app/admin/hooks/forms/schemas/longform.schema.ts`
```ts
import { z } from 'zod';

export const longformFormSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.').max(50, '제목은 최대 50자까지 입력 가능합니다.'),
  subtitle: z.string().max(100, '부제목은 최대 100자까지 입력 가능합니다.').optional(),
  description: z.string().min(1, '설명을 입력해주세요.').max(100, '설명은 최대 100자까지 입력 가능합니다.'),
  categoryCode: z.string().min(1, '카테고리를 선택해주세요.'),
  hasReward: z.boolean(),
  body: z.string().min(1, '본문을 입력해주세요.'),
  pushTitle: z.string().max(50).optional(),
  pushMessage: z.string().max(100).optional(),
});

export type LongformFormData = z.infer<typeof longformFormSchema>;
```

> `layoutMode` 필드는 폼 레벨에 없음 — 제출 시 항상 `'longform'` 고정으로 API 호출.
> `body` 길이 상한은 서버 PRD 의 50KB 소프트 리밋 준수 (폼에서 경고 토스트).

### 3.3. Content 타입 상수

`app/admin/content/constants.ts`:
```ts
export const CONTENT_TYPES = ['card-series', 'longform', 'article', 'notice'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];
```

---

## 4. 서비스 레이어 변경

### 4.1. `app/services/admin/content.ts`

`cardNews.getList`에 `track` 파라미터 지원:
```ts
getList: async (
  page = 1,
  limit = 20,
  track?: CardNewsTrack,
): Promise<AdminCardNewsListResponse> => {
  const params: Record<string, string> = {
    page: String(page),
    limit: String(limit),
  };
  if (track) params.track = track;
  const res = await adminGet<{ data: AdminCardNewsItem[]; meta: { total; page; limit } }>(
    '/admin/v2/content/card-news',
    params,
  );
  return { items: res.data, total: res.meta.total, page: res.meta.page, limit: res.meta.limit };
};
```

> 서버 어드민 리스트 엔드포인트가 `track` 쿼리를 지원해야 한다. 현재 서버 어드민 `getCardNewsListAdmin` 은 `track`을 받지 않으므로 **서버 수정 필요 (Open Question §12 참고)**.

### 4.2. 훅 (`app/admin/hooks/`)

`useCardNewsList(params?: { page?; limit?; track? })` 로 확장. `AllContentTable`/`CardSeriesTable`/새 `LongformTable`에서 서로 다른 `track` 인자로 호출.

신규 훅:
```ts
export const useLongformList = (params?: { page?: number; limit?: number }) =>
  useCardNewsList({ ...params, track: 'longform' });
```

---

## 5. UI 변경

### 5.1. `/admin/content` 탭 추가

`app/admin/content/page.tsx`:
- 탭 순서: `all | card-series | longform | article | notice`
- `AllContentTable` 은 longform 행을 포함 (layoutMode 컬럼으로 구분 표시)
- `handleCreate('longform')` → `/admin/content/longform/create`

신규 컴포넌트: `app/admin/content/components/LongformTable.tsx`
- 컬럼: `제목 | 카테고리 | 발행일 | 읽기시간 | 조회수 | 발행상태 | 액션`
- `readTimeMinutes` 표시: `N분`
- 기존 `CardSeriesTable` 컴포넌트를 참조해 구현, `cardNews.getList({ track: 'longform' })` 호출

### 5.2. 라우팅

`app/admin/content/[type]/create/page.tsx` / `edit/[id]/page.tsx` 는 이미 존재. `type==='longform'` 일 때 신규 `LongformForm` 을 렌더링하도록 분기.

```tsx
// app/admin/content/[type]/create/page.tsx (예시)
switch (type) {
  case 'card-series': return <CardSeriesForm mode="create" />;
  case 'longform':    return <LongformForm mode="create" />;
  case 'article':     return <ArticleForm mode="create" />;
  case 'notice':      return <NoticeForm mode="create" />;
}
```

### 5.3. `LongformForm` 컴포넌트 스펙

위치: `app/admin/content/components/forms/LongformForm.tsx`

**레이아웃:**
```
[← 뒤로]  [저장] [저장 후 발행]

┌─ 기본 정보 ────────────────────┐
│ 제목*        [__________]      │
│ 부제목       [__________]      │
│ 설명*        [__________]      │
│ 카테고리*    [Select]          │
│ 보상 여부    [  ] 구슬 지급     │
└───────────────────────────────┘

┌─ Hero 이미지 ──────────────────┐
│ [BackgroundSelector 재사용]    │
│  - PRESET / CUSTOM 선택        │
│  - 미리보기                    │
└───────────────────────────────┘

┌─ 본문 (Markdown) ──────────────┐
│ [MarkdownEditor 재사용]        │
│  높이 600px, 툴바 포함         │
│  - 입력하면서 하단에            │
│    "예상 읽기 시간 N분" 미리보기│
│  - 50KB 초과 시 경고 토스트     │
└───────────────────────────────┘

┌─ 푸시 알림 (선택) ─────────────┐
│ [기존 CardSeriesForm 섹션 재사용]│
└───────────────────────────────┘

┌─ 미리보기 ────────────────────┐
│ [LongformPreview 컴포넌트]     │
│  세로 스크롤 형태 앱 미리보기   │
└───────────────────────────────┘
```

**폼 상태 관리**: `useAdminForm<LongformFormData>({ schema: longformFormSchema })`

**제출 플로우**:
```ts
const payload: CreateCardNewsRequest = {
  title, description, subtitle, categoryCode, hasReward,
  layoutMode: 'longform',
  body,
  backgroundImage: { type: backgroundType, presetId, customUrl },
  pushNotificationTitle: pushTitle,
  pushNotificationMessage: pushMessage,
  // sections 생략
};
await AdminService.cardNews.create(payload);
```

**수정 모드 제약**:
- `layoutMode` 필드 자체를 렌더링하지 않음 (서버가 변경 거부)
- `body` 필드만 수정 가능; 변경 시 서버가 `readTimeMinutes` 재계산 후 응답에 포함 → 폼 상태 동기화

### 5.4. `LongformPreview` 컴포넌트 스펙

위치: `app/admin/content/components/card-series/LongformPreview.tsx` (기존 `CardNewsDetailPreview`와 동급으로 배치)

- 390×844 (iPhone 14 Pro 비율) 목업 프레임
- Hero 이미지 상단 풀블리드
- 제목 / 부제목 / 카테고리 / 예상 읽기 시간 / 작성자 (optional)
- Markdown 본문 렌더 (기존 앱과 동일한 스타일)
- Sticky footer 영역 mock (좋아요/보상/공유 — 실제 로직은 앱 쪽)

### 5.5. `LayoutModeSelector` (선택적 확장)

**결정**: `CardSeriesForm` 내 `LayoutModeSelector`에는 `longform`을 **추가하지 않는다**. 이유:
- Longform은 독립된 에디터 플로우(`LongformForm`)로 분리
- Card series 탭에서 longform을 선택하게 만들면 sections UI를 숨기고 body UI를 여는 복잡한 분기가 생겨 유지보수성 저하
- 탭 레벨에서 분리가 UX 상 명확함

대신, `AllContentTable`/`CardSeriesTable`에서 `layoutMode === 'longform'` 행을 편집 클릭하면 `/admin/content/longform/edit/:id` 로 라우팅되게 분기.

---

## 6. 상태/라우팅/권한

### 6.1. 라우팅 매트릭스

| 경로 | 페이지 | 권한 |
|---|---|---|
| `/admin/content?tab=longform` | 리스트 | 운영자 |
| `/admin/content/longform/create` | 생성 | 운영자 |
| `/admin/content/longform/edit/[id]` | 수정 | 운영자 |

모두 기존 미들웨어(`middleware.ts`) 보호 대상 — 변경 없음.

### 6.2. 네비게이션

`shared/ui/admin/sidebar.tsx` 는 이미 `운영 콘텐츠`를 가리키므로 추가 변경 불필요. 서브 메뉴가 있다면 `썸타임 이야기` 항목을 하위로 추가할 수 있다 (선택).

---

## 7. 접근성 & UX 세부

- Markdown 에디터 focus 시 `Ctrl/Cmd+S` 저장 단축키 (기존 `useAdminForm` 패턴 재사용)
- 저장 미완료 + 페이지 이탈 시 `useConfirm` 으로 확인 다이얼로그 (기존 훅 재사용)
- `body` 빈 상태에서 저장 시도 → inline 에러 (zod 검증) + 토스트
- 발행 후 수정 시 "이미 발행된 콘텐츠입니다. 수정 내용이 즉시 반영됩니다." 경고 배너
- `readTimeMinutes` 미리보기는 500자 단위로 계산 (서버 로직 동일): `Math.max(1, Math.round(body.length / 500))`

---

## 8. 테스트 전략

### 8.1. 단위 테스트

신규 테스트 파일:
- `__tests__/app/admin/content/forms/LongformForm.test.tsx`
  - 빈 body 제출 → 에러
  - `LayoutModeSelector` 미렌더링 확인
  - `layoutMode: 'longform'` 페이로드 전송 검증
  - 읽기 시간 미리보기 계산 (500자→1분, 2000자→4분)
- `__tests__/app/admin/hooks/schemas/longform.schema.test.ts`
  - body min/max 길이
  - 필수 필드 검증

### 8.2. 통합 테스트

- `AllContentTable` 에서 longform 레코드가 정상 렌더링되는지
- `LongformTable` 에서 `track=longform` 호출되는지
- 편집 클릭 → `longform/edit` 라우팅 확인

### 8.3. E2E (Playwright)

- 시나리오: 어드민 로그인 → 운영 콘텐츠 → `longform` 탭 → 생성 → 저장 → 목록에 노출 → 편집 → 발행
- 푸시 알림 발송 후 `pushSentAt` 표시 확인

---

## 9. 마이그레이션 / 기존 데이터

- 기존 카드뉴스 레코드는 `layoutMode: 'article' | 'image_only'` 만 존재 — 어드민에 변경 없이 노출
- Longform 레코드는 신규 생성부터 나타남 → 회귀 없음
- `AdminCardNewsItem.sections` 가 `optional`로 완화되는 점 때문에 기존 `CardSeriesForm` / `CardSeriesTable` 의 `sections` 참조 경로를 `sections ?? []` 로 방어

---

## 10. 배포 전략

### 10.1. 순서

1. 서버 배포 (본 PRD 선행 — 이미 구현 완료)
2. 어드민 타입/서비스/스키마 PR (본 PRD Phase A)
3. 어드민 UI PR (Phase B) — 리스트 탭 + 폼 + 미리보기
4. QA: staging 환경에서 longform 레코드 생성/수정/발행 검증
5. 프로덕션 배포 (Vercel) — 점진 롤아웃 불필요 (내부 운영 툴)

### 10.2. 피처 플래그

Edge Config 기반 피처 플래그 불필요. `CONTENT_TYPES` 배열에 `'longform'` 추가 여부로 노출 제어 가능.

만약 단계적 공개가 필요하면:
```ts
const CONTENT_TYPES_ENABLED = process.env.NEXT_PUBLIC_LONGFORM_ENABLED === 'true'
  ? ['card-series', 'longform', 'article', 'notice']
  : ['card-series', 'article', 'notice'];
```

---

## 11. 모니터링 & 로깅

- `shared/lib/admin-logger.ts` 로 BFF 프록시 요청/응답 로깅 (기존 인프라)
- 에러 추적: Slack Webhook (`SLACK_WEBHOOK_URL`) 이미 설정됨
- 추가 로깅: `longform.create`, `longform.update`, `longform.publish` 이벤트는 서버 측 Mixpanel 로깅에 위임

---

## 12. Open Questions / 서버 선행 확인 필요

1. **어드민 리스트 엔드포인트의 `track` 쿼리 지원**
   - 서버 PRD §4.1 은 유저 리스트 `GET /posts/card-news` 의 `track` 파라미터 추가를 명시. 어드민 `/admin/v2/content/card-news` 도 동일 파라미터 지원 필요.
   - 서버에 `getCardNewsListAdmin(page, limit, track?)` 구현 요청 — **Action Required**
2. **어드민 상세/생성 응답에 `body` / `readTimeMinutes` 포함 여부**
   - 서버 PRD §4.2 (유저 상세)에는 `body` 포함 명시. 어드민 상세(`GET /admin/v2/content/card-news/:id`)에서도 동일 필드 반환되는지 확인 필요 — **Action Required**
3. **발행 후 `layoutMode` 변경 불가**
   - 서버에서 `BadRequestException`으로 거부 → 어드민 수정 폼에서 layoutMode 필드 아예 표시 안 하는 것으로 합의
4. **Markdown 이미지 업로드 경로**
   - Markdown 본문 내 `![](url)` 이미지는 기존 `cardNews.uploadSectionImage` 재사용할지, 전용 엔드포인트 만들지. v1에서는 기존 업로드 재사용하고 업로드 후 URL 을 수동 붙여넣기로 진행

---

## 13. 리스크 & 완화

| 리스크 | 영향 | 완화 |
|---|---|---|
| Markdown 렌더 차이 (어드민 미리보기 vs 앱) | 콘텐츠 레이아웃 불일치 | 앱 `MarkdownRenderer` 와 동일한 remark/rehype 플러그인 목록 사용 |
| 대용량 본문 (50KB+) 폼 성능 | 타이핑 lag | `MarkdownEditor` 에 debounce 적용 (기존 article 플로우와 동일) |
| 타입 변경으로 인한 기존 `CardSeriesForm` 깨짐 | 회귀 | `sections?` → 렌더 경로에 `?? []` 방어 + Jest 회귀 테스트 |
| 탭 추가로 `AllContentTable` 혼잡 | UX 저하 | 필터/검색 기존 기능 재사용, longform 전용 `readTimeMinutes` 컬럼은 longform 탭에만 노출 |
| 서버 어드민 엔드포인트 track 미지원 | 리스트 분리 불가 | 초기 릴리즈는 클라이언트 측 `items.filter((i) => i.layoutMode === 'longform')` 로 임시 대응 → 서버 업데이트 후 쿼리 파라미터로 전환 |

---

## 14. 구현 체크리스트

### Phase A — 타입/스키마/서비스
- [ ] `types/admin.ts` : `CardNewsLayoutMode`, `AdminCardNewsItem`, `CreateCardNewsRequest`, `UpdateCardNewsRequest` 확장
- [ ] `app/admin/hooks/forms/schemas/longform.schema.ts` 신규 생성
- [ ] `app/admin/content/constants.ts` : `CONTENT_TYPES` 에 `longform` 추가
- [ ] `app/services/admin/content.ts` : `cardNews.getList` 에 `track` 파라미터
- [ ] `app/admin/hooks/` : `useLongformList` 훅

### Phase B — UI
- [ ] `app/admin/content/components/forms/LongformForm.tsx` 신규
- [ ] `app/admin/content/components/card-series/LongformPreview.tsx` 신규
- [ ] `app/admin/content/components/LongformTable.tsx` 신규
- [ ] `app/admin/content/page.tsx` : 탭 추가
- [ ] `app/admin/content/components/AllContentTable.tsx` : longform 행 지원
- [ ] `app/admin/content/[type]/create/page.tsx` / `edit/[id]/page.tsx` : 분기 추가

### Phase C — 테스트/QA
- [ ] 단위 테스트 (`LongformForm.test.tsx`, `longform.schema.test.ts`)
- [ ] 통합 테스트 (테이블 렌더/라우팅)
- [ ] E2E 시나리오 (Playwright) 추가
- [ ] Staging QA 체크리스트 통과

### Phase D — 배포
- [ ] PR 리뷰 완료
- [ ] Vercel preview 확인
- [ ] 서버 어드민 `track` 파라미터 지원 확인
- [ ] 프로덕션 배포
- [ ] 릴리즈 노트 (`docs/admin-features-release-note.md`) 업데이트

---

## 15. 추정 공수

| Phase | 작업 | 예상 |
|---|---|---|
| A | 타입/스키마/서비스 | 0.5일 |
| B | UI (Form/Preview/Table/라우팅) | 1.5일 |
| C | 테스트 작성 + QA | 1일 |
| D | 리뷰/배포 | 0.5일 |
| **총합** | | **3.5일** |

단, 서버 어드민 `track` 파라미터 추가 작업이 선행되지 않으면 Phase A에서 임시 클라이언트 필터링 방식으로 대응 후 서버 배포 시점에 재전환 필요 (+0.5일).
