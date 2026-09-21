# V4 스타일 레퍼런스 관리 어드민 메뉴 — Design Spec

**Date:** 2026-03-18
**Status:** Approved
**Layout:** 통합 그리드형 (Option C)

---

## 1. 개요

V4 매칭에서 유저가 이상형 스타일을 선택하기 위해 사용하는 레퍼런스 이미지를 어드민에서 관리하는 메뉴.
`V4_MATCHING_ENABLED` Feature Flag가 true일 때만 활성화되는 기능이며, 관리자는 이미지를 등록/비활성화/재활성화할 수 있다.

---

## 2. API 범위 (관리자)

| Method | Path | 기능 |
|--------|------|------|
| GET    | /v4/admin/style-reference | 목록 조회 (페이지네이션, 필터) |
| POST   | /v4/admin/style-reference | 단건 등록 (Vision AI 자동 분석) |
| POST   | /v4/admin/style-reference/bulk | 일괄 등록 |
| DELETE | /v4/admin/style-reference/:id | 비활성화 |
| POST   | /v4/admin/style-reference/:id/reactivate | 재활성화 |
| GET    | /v4/admin/style-reference/stats | 통계 |

**전송 방식**: 모든 요청은 JSON body (`Content-Type: application/json`). 이미지는 URL 문자열로 전달하며 파일 업로드 없음.

---

## 3. 레이아웃 결정: 통합 그리드형

### 화면 구성

```
[헤더 영역]
  제목: "V4 스타일 레퍼런스 관리"
  우측: [+ 이미지 등록] 버튼, [일괄 등록] 버튼

[통계 카드 바]
  전체 | 활성 | 비활성  (성별/카테고리별 숫자)

[필터 바]
  성별: 전체/여성/남성  |  카테고리: 전체/VIBE/FASHION/COLOR_TONE  |  상태: 전체/활성/비활성

[이미지 그리드]  (5열, MUI Grid)
  각 카드: 썸네일 이미지, 태그 배지, 카테고리·성별 뱃지, 활성 상태, 액션 버튼(비활성화/재활성화)
  비활성 카드: opacity:0.5 + "비활성" chip

[페이지네이션]
  pageSize: 30 (6행 × 5열)
  마지막 페이지에서 30개 미만이면 빈 셀 없이 자연스럽게 줄어듦 (no placeholder cards)
  "총 N개 · 페이지 X/Y" 표시
```

---

## 4. 컴포넌트 구조

```
app/admin/style-reference/
├── page.tsx                            # Next.js 라우트 — AdminShell wrapping
├── style-reference-v2.tsx             # 메인 컴포넌트
│   └── patchAdminAxios() mount effect  # ← 필수 (다른 v2 페이지와 동일)
├── constants.ts                        # 스타일 키워드 17종, 카테고리 레이블
└── components/
    ├── StyleReferenceStats.tsx         # 통계 카드 바
    ├── StyleReferenceFilters.tsx       # 필터 드롭다운 바
    ├── StyleReferenceGrid.tsx          # 이미지 그리드
    ├── StyleReferenceCard.tsx          # 개별 이미지 카드
    ├── StyleReferenceUploadDialog.tsx  # 단건 등록 다이얼로그
    └── StyleReferenceBulkDialog.tsx    # 일괄 등록 다이얼로그
```

---

## 5. patchAdminAxios 처리

`style-reference-v2.tsx`의 최상위 컴포넌트에서 mount 시 호출한다. 기존 `moment-v2.tsx` 패턴과 동일:

```typescript
import { patchAdminAxios } from '@/shared/lib/http/admin-axios-interceptor';

function StyleReferencePageContent() {
  useEffect(() => {
    const unpatch = patchAdminAxios();
    return () => unpatch();
  }, []);
  // ...
}
```

---

## 6. 서비스 레이어

### 파일: `app/services/admin/style-reference.ts`

```typescript
// 타입 정의 (이 파일 내에서 export)
export interface StyleReferenceItem {
  id: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  tags: string[];
  category: 'VIBE' | 'FASHION' | 'COLOR_TONE';
  gender: 'MALE' | 'FEMALE';
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface StyleReferenceListResponse {
  items: StyleReferenceItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface StyleReferenceStats {
  stats: Array<{
    gender: 'MALE' | 'FEMALE';
    category: 'VIBE' | 'FASHION' | 'COLOR_TONE';
    count: number;
    activeCount: number;
  }>;
}

export interface CreateStyleReferenceRequest {
  imageUrl: string;
  thumbnailUrl?: string;
  tags?: string[];  // 미입력 시 Vision AI 자동 분석
  category: 'VIBE' | 'FASHION' | 'COLOR_TONE';
  gender: 'MALE' | 'FEMALE';
  sortOrder?: number;
}

export interface StyleReferenceListParams {
  page?: number;
  pageSize?: number;
  gender?: 'MALE' | 'FEMALE';
  category?: 'VIBE' | 'FASHION' | 'COLOR_TONE';
}

// 모두 JSON body, axiosServer 사용
export const styleReference = {
  getList: (params: StyleReferenceListParams): Promise<StyleReferenceListResponse> => ...,
  create: (data: CreateStyleReferenceRequest): Promise<StyleReferenceItem> => ...,
  bulkCreate: (items: CreateStyleReferenceRequest[]): Promise<{ created: number; analyzed: number; errors: string[] }> => ...,
  deactivate: (id: string): Promise<{ success: boolean }> => ...,
  reactivate: (id: string): Promise<{ success: boolean }> => ...,
  getStats: (): Promise<StyleReferenceStats> => ...,
}
```

---

## 7. React Query 훅

### 파일: `app/admin/hooks/use-style-reference.ts` (기존 shared hooks 디렉토리)

```typescript
export const styleReferenceKeys = {
  all: ['admin', 'style-reference'] as const,
  list: (params: StyleReferenceListParams) => [...styleReferenceKeys.all, 'list', params] as const,
  stats: () => [...styleReferenceKeys.all, 'stats'] as const,
};

export function useStyleReferenceList(params: StyleReferenceListParams) { ... }
export function useStyleReferenceStats() { ... }
export function useCreateStyleReference() { ... }  // onSuccess: invalidate list + stats
export function useBulkCreateStyleReference() { ... }  // onSuccess: invalidate list + stats
export function useDeactivateStyleReference() { ... }  // onSuccess: invalidate list + stats
export function useReactivateStyleReference() { ... }  // onSuccess: invalidate list + stats
```

모든 mutation의 `onSuccess`에서 `styleReferenceKeys.all` invalidation 처리.

---

## 8. AdminService barrel export

`app/services/admin/index.ts`에 두 곳 모두 추가:

```typescript
// 상단 named export
export { styleReference } from './style-reference';
export type { StyleReferenceItem, StyleReferenceListResponse, StyleReferenceStats, CreateStyleReferenceRequest } from './style-reference';

// AdminService 객체
const AdminService = {
  ...
  styleReference,  // ← 추가
};
```

`app/admin/hooks/index.ts` barrel export에도 추가:
```typescript
export * from './use-style-reference';
```

---

## 9. Feature Flag 403 처리 (반응적)

별도 flag 사전 체크 없이, API 호출 시 백엔드가 내려주는 403에 반응한다.
`useStyleReferenceList` 쿼리의 `onError`에서 403이면 페이지 상단에 MUI `Alert`로 안내:

```
"V4 매칭 기능이 비활성 상태입니다. Feature Flags 메뉴에서 V4_MATCHING_ENABLED를 활성화해주세요."
```

---

## 10. 스타일 키워드 상수

`app/admin/style-reference/constants.ts`:

```typescript
export const STYLE_KEYWORDS = [
  { code: 'warm',         nameKo: '따뜻한',    category: 'VIBE',       emoji: '🌤️' },
  { code: 'chic',         nameKo: '시크한',    category: 'VIBE',       emoji: '🖤' },
  { code: 'bright',       nameKo: '밝은',      category: 'VIBE',       emoji: '☀️' },
  { code: 'calm',         nameKo: '차분한',    category: 'VIBE',       emoji: '🌊' },
  { code: 'cute',         nameKo: '귀여운',    category: 'VIBE',       emoji: '🐰' },
  { code: 'intellectual', nameKo: '지적인',    category: 'VIBE',       emoji: '📚' },
  { code: 'natural',      nameKo: '자연스러운', category: 'VIBE',      emoji: '🌿' },
  { code: 'artistic',     nameKo: '감성적인',  category: 'VIBE',       emoji: '🎨' },
  { code: 'clean',        nameKo: '깔끔한',    category: 'FASHION',    emoji: '✨' },
  { code: 'casual',       nameKo: '캐주얼한',  category: 'FASHION',    emoji: '👕' },
  { code: 'street',       nameKo: '스트릿',    category: 'FASHION',    emoji: '🧢' },
  { code: 'sporty',       nameKo: '스포티한',  category: 'FASHION',    emoji: '🏃' },
  { code: 'formal',       nameKo: '포멀한',    category: 'FASHION',    emoji: '👔' },
  { code: 'vintage',      nameKo: '빈티지한',  category: 'FASHION',    emoji: '📻' },
  { code: 'warm_tone',    nameKo: '따뜻한 톤', category: 'COLOR_TONE', emoji: '🍂' },
  { code: 'cool_tone',    nameKo: '차가운 톤', category: 'COLOR_TONE', emoji: '🌑' },
  { code: 'pastel_tone',  nameKo: '파스텔 톤', category: 'COLOR_TONE', emoji: '🌸' },
] as const;

export const CATEGORY_LABELS = {
  VIBE: '분위기',
  FASHION: '패션',
  COLOR_TONE: '컬러톤',
} as const;

export const GENDER_LABELS = {
  MALE: '남성',
  FEMALE: '여성',
} as const;
```

---

## 11. 에러 처리

| 상황 | 처리 방법 |
|------|---------|
| 403 (Feature flag 비활성) | 페이지 상단 MUI Alert, 목록 렌더 안함 |
| 400 (잘못된 태그 코드) | UploadDialog 내 인라인 에러 메시지 |
| Vision AI 분석 실패 | `toast.error('이미지 분석 실패. 태그를 수동으로 입력해주세요.')` |
| 일괄 등록 부분 실패 | 완료 후 `created`, `errors` 보여주는 결과 Alert |
| 네트워크 오류 | `toast.error` (기존 패턴과 동일) |

---

## 12. 사이드바 추가

`shared/ui/admin/sidebar.tsx` — `💕 매칭/채팅` 카테고리에 추가:

```typescript
{ href: '/admin/style-reference', label: 'V4 스타일 관리' }
```

---

## 13. 구현 순서

1. `app/admin/style-reference/constants.ts` — 상수 정의
2. `app/services/admin/style-reference.ts` — 타입 + API 함수
3. `app/services/admin/index.ts` — barrel export + AdminService 객체에 추가
4. `app/admin/hooks/use-style-reference.ts` — React Query 훅
5. `app/admin/hooks/index.ts` — 훅 barrel export 추가
6. `app/admin/style-reference/components/` — 컴포넌트 6개 구현
7. `app/admin/style-reference/style-reference-v2.tsx` — 페이지 조립
8. `app/admin/style-reference/page.tsx` — 라우트 페이지
9. `shared/ui/admin/sidebar.tsx` — 사이드바 메뉴 추가
