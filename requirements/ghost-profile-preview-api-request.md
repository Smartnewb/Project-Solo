# Ghost Profile Preview API 요청안

## 배경

어드민 Ghost 상세 Drawer에서 **실제 앱 매칭 화면과 동일한 형태**로 Ghost 프로필을 미리보기하는 기능이 구현되어 있다.
FE는 `GET /admin/ghost-injection/ghosts/:ghostAccountId/profile-preview` 를 호출하나,
**현재 BE 컨트롤러에 이 엔드포인트가 존재하지 않아 404 USER_NOT_FOUND 에러가 발생한다.**

---

## 요청 사항

### 신규 엔드포인트 추가

```
GET /admin/ghost-injection/ghosts/:ghostAccountId/profile-preview
```

- 인증: `JwtAuthGuard + AdminGuard` (기존 ghost 관리 엔드포인트와 동일)
- `X-Country` 헤더 필수 (kr / jp)

---

## 구현 가이드

### 기본 흐름

1. `ghostAccountId`로 `ghost_accounts` 조회 → `ghostUserId` 획득 (없으면 404)
2. `ProfileQueryService.getUserProfiles(ghostUserId, sensitive=false, onlyApprovedImages=true)` 호출
   - `sensitive=false` → `rank` 필드 포함
   - `onlyApprovedImages=true` → 승인된 사진만 반환
3. 결과를 아래 응답 구조로 변환 후 반환

> **참고**: `user-profile.service.ts`의 `getCompleteProfile(userId)` 내부 흐름과 동일.
> Ghost는 `ghostUserId`를 실제 유저 ID처럼 사용하면 된다.

### 의존 서비스

| 서비스 | 용도 |
|--------|------|
| `GhostInjectionAdminQueryService` (기존) | ghostAccountId → ghostUserId 조회 |
| `ProfileQueryService` (user 모듈) | ghostUserId로 완전한 프로필 데이터 조회 |

> `ProfileQueryService`가 ghost-injection 모듈에 없다면,
> `GhostInjectionModule`의 imports에 `UserModule` (또는 `ProfileQueryService`를 export 하는 모듈) 추가 필요.

---

## 응답 스펙

### 200 OK

```typescript
{
  // Ghost 식별
  id: string;                    // ghostAccountId
  name: string;
  age: number;
  gender: 'FEMALE';              // ghost는 항상 FEMALE
  mbti: string | null;
  rank: 'A' | 'B' | 'C' | null;

  // 프로필 이미지 (approved + mainPhoto 필터 적용)
  profileImages: Array<{
    id: string;
    order: number;
    slotIndex: number;           // 0=대표, 1=서브1, 2=서브2
    isMain: boolean;
    url: string;
    reviewStatus: 'approved';    // 미리보기니 approved만
    imageUrl?: string;
    thumbnailUrl?: string;
  }>;

  // 학교 정보
  universityDetails: {
    name: string | null;
    authentication: boolean;
    department: string | null;
    grade: string | null;
    studentNumber: string | null;
    code: string | null;
    region: string | null;
    isVerified?: boolean;
  } | null;

  // 선호도
  preferences: PreferenceTypeGroup[];       // partner 선호도
  characteristics: PreferenceTypeGroup[];   // self 특성
  additionalPreferences: {
    goodMbti: string;
    badMbti: string;
  } | null;

  // 자기소개
  introductions: string[];
  introduction: string | null;              // introductions[0] 또는 profiles.introduction
  keywords: string[] | null;               // characteristics에서 추출

  // 이상형 테스트 결과
  idealTypeResult: {
    name: string;
    tags: string[];
  } | null;

  updatedAt: string | null;
  deletedAt: string | null;

  // 미리보기 전용 상수 필드 (앱 매칭 카드 인터페이스 호환용)
  connectionId: null;
  matchScore: null;
  v4Compatibility: null;
  matchLikeId: null;
  isLikeSended: 0;
  isFirstView: false;
  canLetter: false;
  skippedPhotoCount: 0;
  external: null;
}
```

`PreferenceTypeGroup`:
```typescript
{
  typeName: string;
  typeKey?: string;
  selectedOptions: Array<{
    id: string;
    displayName: string;
    imageUrl?: string | null;
    key?: string;
  }>;
}
```

### 404 Not Found

```json
{ "statusCode": 404, "message": "Ghost account not found: <ghostAccountId>" }
```

---

## 참고: FE 호출 위치

- `app/services/admin/ghost-injection.ts` → `getProfilePreview(ghostAccountId)`
- `app/admin/ai-profiles/ghosts/ghost-detail-drawer.tsx` → "미리보기" 버튼 클릭 시 호출
- `app/admin/ai-profiles/ghosts/_preview/ghost-mobile-preview-modal.tsx` → 수신 데이터 렌더링
