# Ghost Profile Preview — Requirement Spec

## Original Requirement

> "AI 프로필 (위장 유저) 가 생성되면, 실제로 앱 레이아웃과 ui 가 완전히 동일한 구조의 스켈레톤화면에서 매칭된 상대가 해당 유저 상세보기 페이지로 들어가면 어떻게 보이게될지 모바일 ui 로 사전에 볼 수 있게끔 하는 기능을 지원하고싶어."

## Goal

운영자가 Ghost(AI 프로필) 생성 후, 매칭된 실제 유저가 `/partner/view/[id]` 진입 시 보게 될 모바일 UI 를 admin Drawer 내 모달로 즉시 검증.

## Reference

| 영역 | 경로 |
|------|------|
| 앱 매칭 상대 상세 화면 | `sometimes-app/app/partner/view/[id].tsx` |
| 데이터 타입 | `sometimes-app/src/types/user.ts` (`UserProfile`) |
| 데이터 호출 | `useMatchPartnerQuery` → `GET /matching/history/:matchId` |
| 핵심 컴포넌트 | `PartnerBasicInfo`, `PartnerMBTI`, `PartnerIdealType`, `MomentReportCard`, `BlurredPhotoCard`, `ProfileImageWatermarkOverlay` |
| Admin ghost 진입점 | `app/admin/ai-profiles/ghosts/ghost-detail-drawer.tsx` |
| Ghost 타입 | `app/types/ghost-injection.ts` (`GhostDetail`) |

## Scope — 포함

### 진입점
- `ghost-detail-drawer.tsx` 상단 액션 버튼 영역에 **`매칭 시 노출 미리보기`** 버튼 추가
- 클릭 시 Dialog (모달) 오픈 — drawer 닫지 않음

### 폰 프레임
- 크기: 375 × 812 (iPhone 14 기준)
- 둥근 모서리: 44px
- 외곽: zinc-900 14px border + shadow-2xl
- 노치: 상단 중앙 pill (120 × 28, bg-zinc-900, rounded-b-2xl)
- 내부: `overflow-y-auto` ScrollArea

### 스크롤 구조 (앱 미러)

| 순번 | 섹션 | 데이터 소스 |
|------|------|-------------|
| 1 | Header (구슬 뱃지·신고 아이콘 disabled) | 시각만 |
| 2 | 메인 사진 + LinearGradient 오버레이 | `profileImages[0]` |
| 2-1 | 최근 접속 뱃지 (`apps.partner.view.last_login_label` + `formatLastLogin`) | `updatedAt` |
| 2-2 | 나이 텍스트 (3xl bold) | `age` |
| 2-3 | 대학 로고 + 이름 | `universityDetails.code`, `name` |
| 2-4 | 대학 인증 체크 | `universityDetails.authentication` |
| 3 | PartnerBasicInfo | `characteristics`, `introductions`, `keywords` |
| 4 | 추가 사진 #2 (워터마크) | `profileImages[1]` |
| 5 | PartnerMBTI | `mbti`, `additionalPreferences` |
| 6 | **Compatibility 영역 — Placeholder 배너** | `매칭 시 자동 생성` 안내 |
| 7 | PartnerIdealType | `preferences`, `idealTypeResult` |
| 8 | MomentReportCard | ghost `userId`, `name` (실제 API 호출) |
| 9 | **MatchingReason 영역 — Placeholder 배너** | `매칭 시 자동 생성` 안내 |
| 10 | 추가 사진 #3+ (BlurredPhotoCard 분기) | `profileImages[2..]`, `myApprovedPhotosCount` |
| 11 | 하단 좋아요 버튼 (disabled + tooltip) | `connectionId` 분기 시뮬 |

### 사진 워터마크
- 고정 더미: `예시) 홍길동 · 010-1234-5678` (앱 `my-profile-preview` 와 동일)

### 시뮬레이션 토글 (모달 상단 컨트롤 패널)

1. **상대 유저 승인 사진수**: `1 / 2 / 3` 라디오
   - `BlurredPhotoCard` 차단 동작 즉시 반영
2. **국가**: `kr / jp` 라디오
   - 대학 로고 URL (`getSmartUnivLogoUrl`) + i18n 텍스트 시뮬
3. **매칭 상태**: `PENDING / OPEN / IN_CHAT / REJECTED` 라디오
   - 하단 액션 버튼 영역 분기 미리보기

## Scope — 제외

- **Compatibility 카드**: 가짜 데이터 X. `매칭 시 자동 생성됩니다` 안내 배너만.
- **MatchingReason 카드**: 동일 처리.
- **좋아요 버튼**: 시각만, `disabled + tooltip("운영자 미리보기 모드")`.
- **빈 사진 블라인드 케이스**: ghost 사진 항상 ≥1 가정, 별도 처리 X.
- **PhotoSlider (사진 확대)**: 폰 프레임 내 탭 시 동작 X (정적 미리보기).
- **App Expo Web 임베드**: 미사용, admin 측 정적 미러.

## Backend (solo-nestjs-api)

### 신규 endpoint

```
GET /admin/ghost-injection/ghosts/:ghostAccountId/profile-preview
```

- **권한**: 기존 admin guard 동일 (ghost-injection 모듈)
- **응답**: `UserProfile` 호환 shape

```typescript
interface GhostProfilePreviewResponse {
  id: string;                    // ghost userId
  name: string;
  age: number;
  gender: 'FEMALE';
  mbti: string | null;
  profileImages: ProfileImage[]; // photos → ProfileImage 매핑
  universityDetails: UniversityDetail | null;
  preferences: PreferenceTypeGroup[];   // snapshot 에서 노출
  characteristics: PreferenceTypeGroup[];
  additionalPreferences: { goodMbti: string; badMbti: string } | null;
  introductions: string[];
  introduction: string | null;
  keywords: string[] | null;
  idealTypeResult: { id?: string; name: string; tags: string[] } | null;
  updatedAt: string;
  // 명시적 null
  connectionId: null;
  matchScore: null;
  v4Compatibility: null;
  isFirstView: false;
}
```

### 데이터 출처
- `ghost_account` + `ghost_account.profileSnapshot` JSON
- `university` / `department` join
- `ghost_photos` → `profileImages` 매핑 (`slotIndex`, `isMain`, `url`)

### 에러
- 404: ghostAccountId 없음
- 권한 거부: 401/403

## Frontend (Project-Solo admin)

### 디렉토리

```
app/admin/ai-profiles/ghosts/_preview/
├── ghost-mobile-preview-modal.tsx       # 폰 프레임 컨테이너 + 시뮬 토글
├── sections/
│   ├── PreviewHeader.tsx
│   ├── PreviewMainImage.tsx
│   ├── PreviewBasicInfo.tsx
│   ├── PreviewMBTI.tsx
│   ├── PreviewCompatibilityPlaceholder.tsx
│   ├── PreviewIdealType.tsx
│   ├── PreviewMomentReportCard.tsx
│   ├── PreviewMatchReasonPlaceholder.tsx
│   ├── PreviewAdditionalPhoto.tsx
│   ├── PreviewBlurredPhoto.tsx
│   └── PreviewBottomLikeBar.tsx
└── lib/
    ├── ghost-to-user-profile.ts         # API 응답 → UserProfile 매퍼 (테스트 작성)
    ├── preview-watermark.ts             # 고정 더미 텍스트
    └── preview-simulation.ts            # 토글 상태 타입
```

### 서비스 레이어
- `app/services/admin/ghost-injection.ts` 에 `getGhostProfilePreview(ghostAccountId)` 추가
- React Query: `useGhostProfilePreviewQuery` 훅

### 진입 통합
- `ghost-detail-drawer.tsx` 상단 액션 영역에 버튼 추가
- 모달 오픈 시 `useGhostProfilePreviewQuery` 호출

## Success Criteria

1. Ghost 상세 drawer 상단 `미리보기 열기` 클릭 → 1초 내 폰 프레임 모달 노출
2. 메인사진·추가사진·기본정보·MBTI·이상형 영역이 ghost snapshot 데이터로 채워짐
3. 시뮬 토글 3종 변경 시 즉시 재렌더 (사진 차단·국가 로고·하단 버튼 분기)
4. Compatibility / MatchReason 영역에 안내 배너 노출
5. MomentReportCard 가 ghost userId 로 실제 데이터 호출 성공
6. 운영자 5명 QA 통과: "실제 노출 화면과 동일하다" 확인

## Decision Log

| Question | Decision |
|----------|----------|
| 진입 방식 | Drawer 안 모달 |
| 데이터 출처 | BE 신규 endpoint (`/profile-preview`) |
| 시뮬 토글 범위 | 사진수 + 국가 + 매칭상태 (3종) |
| Compatibility / MatchReason | Placeholder 배너만 |
| Moment 카드 | 표시 (ghost 실제 데이터 호출) |
| 워터마크 | 고정 더미 (`예시) 홍길동 · 010-1234-5678`) |
| CTA 위치 | Drawer 상단 액션 버튼 영역 |

## Out of Scope (향후 고려)

- App Expo Web 빌드 임베드 (실제 RN 코드 100% 일치)
- 매칭 알고리즘 시뮬 (matchScore·matchReason 실제 생성)
- 사진 확대 PhotoSlider 동작
- 다른 ghost 와의 비교 뷰
