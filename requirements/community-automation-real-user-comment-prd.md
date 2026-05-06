# 커뮤니티 자동화: 실제 유저 게시글 댓글 운영 PRD

작성일: 2026-05-05
대상 repo: `Project-Solo` admin frontend + `solo-nestjs-api` backend
요청 원문: "커뮤니티 자동화에서 실제 유저 커뮤니티의 모든 게시글들에 대해 카드 테이블 형식으로 ui 를 보여주고 누르면 상세 메뉴로 이동하고 거기서 기본값을 유저와 같은 REGION_CLUSTER 로 두고, 댓글을 LLM 으로 생성하거나, 어드민이 직접 내용을 입력해서댓글을 작성할 수 있는 기능을 만들고싶어. 요구사항과 기획을 더 디테일하고 풍부하게 만들어줘. 서버 요구사항은 ../solo-nestjs-api 를 분석해줘."

## 1. 배경

현재 `Project-Solo`에는 일반 커뮤니티 관리 화면(`/admin/community`)과 커뮤니티 자동화 화면(`/admin/community-automation`)이 분리되어 있다.

- 일반 커뮤니티 관리 화면은 실제 커뮤니티 게시글/댓글을 조회하고 블라인드/삭제/신고 처리를 한다.
- 커뮤니티 자동화 화면은 캠페인, 검수 큐, 메트릭스, 페르소나, 설정을 관리한다.
- 백엔드 `solo-nestjs-api`에는 `src/community-automation` 모듈이 있으며 `post`, `auto_comment`, `target_comment`, `reply` 템플릿 이름과 LLM 댓글 생성 프롬프트가 이미 있다.

다만 현재 자동화는 "실제 유저 게시글을 운영자가 직접 선택해서 댓글을 생성/작성/검수/발행"하는 완성된 관리자 플로우로 보기는 어렵다. 특히 수동 DAG 실행 API에는 대상 게시글 ID, 대상 댓글 ID, REGION_CLUSTER 조건, 수동 입력 댓글을 전달할 수 있는 계약이 없다.

## 2. 목표

어드민이 실제 유저가 작성한 모든 커뮤니티 게시글을 카드 테이블로 탐색하고, 게시글 상세에서 같은 REGION_CLUSTER의 ghost 계정을 기본 작성자 풀로 사용해 댓글을 생성하거나 직접 입력하여 발행할 수 있게 한다.

핵심 목표는 세 가지다.

1. 실제 유저 게시글을 자동화 작업의 "대상"으로 쉽게 고를 수 있게 한다.
2. LLM 생성 댓글과 어드민 직접 입력 댓글을 같은 검수/발행/회수 체계로 관리한다.
3. 기본 작성자 풀은 게시글 작성자와 같은 REGION_CLUSTER로 제한하되, 어드민이 명시적으로 바꿀 수 있게 한다.

## 3. 범위

### 포함

- 커뮤니티 자동화 내 "실제 게시글" 탭 추가
- 실제 유저 게시글 전체 목록 카드 테이블 UI
- 게시글 클릭 시 상세 패널/상세 메뉴 이동
- 게시글 본문, 기존 댓글, 신고/블라인드 상태, 작성자 지역 정보 표시
- 기본 REGION_CLUSTER 산출 및 표시
- LLM 댓글 생성 요청
- 어드민 직접 입력 댓글 작성
- 생성/입력 댓글 미리보기와 수정
- 승인 후 예약 발행 또는 즉시 발행
- 커뮤니티 자동화 검수 큐와 이력에 연결
- 백엔드 타깃 댓글 API, DTO, 큐 데이터, DAG 상태 확장
- ghost 작성자 선택 시 같은 REGION_CLUSTER 기본 필터 적용

### 제외

- 일반 유저 앱 커뮤니티 UI 변경
- 커뮤니티 게시글 자체 자동 생성 정책 재설계
- 매칭 시스템의 REGION_CLUSTER 규칙 변경
- 신고/블라인드 정책 변경
- 전체 Ghost Injection 시스템 재설계

## 4. 사용자

주 사용자는 운영 어드민이다.

- 커뮤니티 활성도를 관리한다.
- 실제 유저 게시글 중 반응이 필요한 글을 찾는다.
- LLM 초안을 빠르게 만들되, 위험한 문구는 직접 수정한다.
- 특정 지역/대학권 유저처럼 보이는 자연스러운 댓글을 운영하고 싶다.

보조 사용자는 PM/운영 리드다.

- 자동화가 실제 유저 게시글에 얼마나 개입했는지 확인한다.
- 지역별/카테고리별 댓글 운영 성과를 본다.
- 오작동 시 kill switch나 회수 기능으로 중단한다.

## 5. UX 기획

### 5.1 메뉴 구조

기존 `/admin/community-automation` 하위에 새 탭을 추가한다.

- 캠페인
- 실제 게시글
- 검수 큐
- 메트릭스
- 페르소나
- 설정

"실제 게시글"은 캠페인 생성보다 더 운영 친화적인 작업 시작점이다. 운영자는 캠페인을 먼저 만들지 않아도 게시글을 보고 바로 댓글 작업을 시작할 수 있어야 한다.

### 5.2 실제 게시글 카드 테이블

테이블은 단순 row 목록이 아니라 게시글 상태를 빠르게 판단할 수 있는 카드형 row로 구성한다.

각 row/card 필드:

- 제목
- 본문 미리보기
- 카테고리
- 작성자 표시명 또는 익명 표시
- 작성자 지역 코드와 REGION_CLUSTER
- 작성 시간
- 댓글 수
- 좋아요 수
- 조회 수
- 신고 수
- 블라인드/삭제 여부
- 최근 댓글 요약 1-2개
- 자동화 개입 상태
  - 없음
  - 초안 생성됨
  - 검수 대기
  - 예약됨
  - 발행됨
  - 회수됨

필터:

- 국가/schema: KR, JP
- 카테고리
- REGION_CLUSTER
- 게시글 상태: 정상, 신고 있음, 블라인드, 삭제 제외
- 자동화 상태
- 댓글 수 범위
- 최신순/댓글 많은 순/신고 많은 순/조회 많은 순
- 검색: 제목/본문/작성자 ID

기본 정렬:

- 신고/블라인드가 아닌 정상 게시글
- 최신순
- 댓글 수가 너무 많은 글보다 댓글이 부족한 글 우선 노출 옵션 제공

### 5.3 게시글 상세 메뉴

row/card 클릭 시 오른쪽 drawer 또는 상세 페이지로 이동한다.

상세 영역 구성:

- 상단: 게시글 제목, 카테고리, 작성자, 작성 시간, 지역/클러스터
- 본문: 전체 내용
- 댓글 맥락: 기존 댓글 전체 또는 최근 N개, 대댓글 트리
- 자동화 패널:
  - 대상 게시글 ID
  - 대상 댓글 ID: 대댓글일 때만 선택
  - 댓글 유형: 일반 댓글 / 대댓글
  - 작성 방식: LLM 생성 / 직접 입력
  - 작성자 풀: REGION_CLUSTER 기본값
  - ghost 후보: 자동 선택 / 특정 ghost 선택
  - 톤: 공감형, 질문형, 정보형, 가벼운 리액션형, 후기형
  - 안전 옵션: 개인정보 언급 금지, 작성자 신상 추론 금지, 과도한 친밀감 금지
  - 발행 방식: 검수 큐로 보내기 / 즉시 예약 / 즉시 발행

### 5.4 REGION_CLUSTER 기본값

기본값은 "게시글 작성자와 같은 REGION_CLUSTER"다.

산출 흐름:

1. 게시글 `articles.author_id`로 작성자 user를 찾는다.
2. `profiles.user_id`와 `university_info.profile_id`를 통해 작성자의 학교 정보를 찾는다.
3. `universities.region`을 가져온다.
4. `RegionClusterFactory.getClusterName(region)` 또는 `getRegionCluster(region)`로 클러스터를 계산한다.
5. ghost 후보는 같은 cluster에 속한 학교/지역 기반 ghost 계정으로 제한한다.

예외:

- 작성자 학교/지역이 없으면 `UNKNOWN_REGION`으로 표시하고 자동 발행은 막는다.
- 같은 클러스터 ghost가 부족하면 어드민에게 "같은 클러스터 후보 없음"을 표시한다.
- 어드민이 명시적으로 "전국/전체"로 변경할 수 있지만, 변경 사유를 audit payload에 남긴다.

### 5.5 LLM 생성 플로우

1. 어드민이 게시글 상세에서 "LLM 생성"을 선택한다.
2. 시스템은 게시글 본문, 기존 댓글, 카테고리, 작성자 지역 클러스터, 선택된 ghost persona traits를 prompt context로 구성한다.
3. LLM은 댓글 후보를 1-3개 생성한다.
4. 품질 가드가 PII, 욕설, 과몰입, 사실 단정, 작성자 신상 추론을 검사한다.
5. 결과는 바로 발행하지 않고 기본적으로 검수 큐 또는 상세 패널의 초안 상태로 둔다.
6. 어드민은 초안을 수정하거나 재생성하거나 거절한다.
7. 승인 시 publish queue에 등록한다.

LLM 댓글 후보는 짧고 자연스러워야 한다.

- 권장 길이: 20-120자
- 이모지 과다 사용 금지
- "나도", "혹시", "그거" 같은 커뮤니티형 표현 허용
- 게시글 작성자의 개인정보를 추정하는 표현 금지
- 특정 학교/지역명을 직접 언급하는 것은 기본 금지

### 5.6 직접 입력 플로우

1. 어드민이 "직접 입력"을 선택한다.
2. 댓글 내용을 작성한다.
3. 작성자 풀은 LLM 생성과 동일하게 REGION_CLUSTER 기본값을 사용한다.
4. 저장 시 `generatedText`는 null 또는 original admin text로, `finalText`는 입력값으로 기록한다.
5. 품질 가드는 직접 입력에도 적용한다. 단, 실패 시 override 가능 권한을 별도 정책으로 둔다.
6. 승인 후 발행한다.

직접 입력도 자동화 콘텐츠로 기록해야 한다. 그래야 회수, 메트릭스, audit, 중복 방지, ghost별 발화 제한이 동일하게 동작한다.

## 6. 백엔드 현황 분석

### 6.1 이미 존재하는 API

`solo-nestjs-api`에는 다음 관리자 API가 있다.

- `GET /admin/v2/community/posts`
- `GET /admin/v2/community/posts/:id`
- `GET /admin/v2/community/comments?articleId=...`
- `PATCH /admin/v2/community/posts/:id/status`
- `DELETE /admin/v2/community/posts/:id`
- `GET /admin/v2/community/categories`
- `GET /admin/v2/community-automation/campaigns`
- `POST /admin/v2/community-automation/campaigns/:id/dag-run`
- `GET /admin/v2/community-automation/review-queue`
- `PATCH /admin/v2/community-automation/review-queue/:id/approve`
- `PATCH /admin/v2/community-automation/review-queue/:id/inject`
- `POST /admin/v2/community-automation/review-queue/:id/regenerate`
- `PATCH /admin/v2/community-automation/review-queue/:id/withdraw`

### 6.2 현재 구조에서 바로 재사용 가능한 것

- `CommunityV2Repository.getArticles`: 실제 게시글 목록 조회 기반
- `CommunityV2Repository.getComments`: 게시글 댓글 조회 기반
- `community_automation_contents`: 생성/검수/발행 상태 저장
- `ReviewService.approve/inject/reject/regenerate/withdraw`: 검수 액션
- `PublishQueueService`: 예약 발행 큐
- `GeminiProClient` + `ContentGeneratorNode`: LLM 텍스트 생성 기반
- `QualityGuardNode`: 품질 검사 기반
- `RegionClusterFactory`: 지역 클러스터 계산 기반
- `universities.region`: 작성자 지역 산출의 소스

### 6.3 현재 부족한 점

서버는 이름상 `target_comment`를 지원하지만 실제 운영 요구에는 부족하다.

1. `TriggerDagRunBodyDto`가 `dagTemplateId`, `count`만 받는다. 대상 게시글 ID를 받을 수 없다.
2. `DagRunJobData`에 `parentArticleId`, `parentCommentId`, `regionCluster`, `manualText`, `ghostPoolFilter`가 없다.
3. `GraphBuilder.runCommentGraph`가 `CommentContextCollectorNode`를 실행하지 않는다. 따라서 댓글 생성 prompt에 부모 게시글/기존 댓글 맥락이 비어 있을 수 있다.
4. `PersonaSelectorNode`가 아직 DB 연동 TODO 상태라 실제 ghost 계정을 선택하지 못한다.
5. `ReviewQueueEnqueueNode`는 `targetType`을 `COMMENT` 대문자로 저장하지만 `PublishProcessor`는 `comment` 소문자를 비교한다. 이 상태면 댓글 콘텐츠가 게시글로 발행될 위험이 있다.
6. `PublishProcessor.publishComment`에서 대댓글 parentId로 `content.commentId`를 사용하지만, 이것은 새로 발행된 commentId를 저장하는 필드라 부모 댓글 ID로 쓰기에 부적절하다. 별도 `targetCommentId` 또는 `target_parent_comment_id`가 필요하다.
7. `withdraw`는 자동화 content 상태만 바꾸고 실제 article/comment soft delete는 TODO다.
8. 커뮤니티 게시글 목록은 작성자 지역/클러스터를 반환하지 않는다.
9. 같은 REGION_CLUSTER ghost 후보를 조회하는 API가 없다.
10. 어드민 직접 입력 댓글을 검수 큐에 새 콘텐츠로 생성하는 API가 없다.

## 7. 서버 요구사항

### 7.1 실제 게시글 타깃 목록 API 확장

새 API를 추가한다.

`GET /admin/v2/community-automation/target-posts`

Query:

- `page`
- `limit`
- `categoryId`
- `regionCluster`
- `status`: `normal | reported | blinded | all`
- `automationStatus`: `none | pending_review | scheduled | published | withdrawn | all`
- `sort`: `createdAt | commentCount | reportCount | readCount`
- `order`: `asc | desc`
- `search`

Response item:

```ts
{
  id: string;
  title: string;
  contentPreview: string;
  categoryId: string;
  categoryName: string | null;
  authorId: string;
  authorName: string | null;
  anonymous: string | null;
  authorRegion: string | null;
  authorRegionName: string | null;
  authorRegionCluster: string | null;
  authorRegionClusterName: string | null;
  likeCount: number;
  readCount: number;
  commentCount: number;
  reportCount: number;
  latestComments: Array<{ id: string; content: string; nickname: string; createdAt: string }>;
  automation: {
    latestContentId: string | null;
    status: string | null;
    publishedCommentId: string | null;
    pendingCount: number;
    publishedCount: number;
  };
  createdAt: string;
  blindedAt: string | null;
  deletedAt: string | null;
}
```

Implementation:

- 기존 `CommunityV2Repository.getArticles`를 직접 확장하기보다 자동화용 read model repository를 새로 둔다.
- join: `articles -> users -> profiles -> university_info -> universities`
- `community_automation_contents.target_parent_id = articles.id` 기준으로 자동화 상태 aggregate를 붙인다.
- 삭제된 게시글은 기본 제외한다.

### 7.2 타깃 게시글 상세 API

`GET /admin/v2/community-automation/target-posts/:articleId`

Response:

- 게시글 전문
- 작성자 지역/클러스터
- 기존 댓글 트리
- 자동화 콘텐츠 이력
- 같은 클러스터 ghost 후보 summary
- 추천 기본값
  - `defaultRegionCluster`
  - `defaultTargetType: COMMENT`
  - `defaultPublishMode: REVIEW_QUEUE`

### 7.3 LLM 댓글 초안 생성 API

`POST /admin/v2/community-automation/target-posts/:articleId/comment-drafts`

Body:

```ts
{
  mode: "llm";
  campaignId?: string;
  parentCommentId?: string;
  regionCluster?: string;
  ghostAccountId?: string;
  tone?: "empathy" | "question" | "info" | "light_reaction" | "review";
  candidateCount?: 1 | 2 | 3;
  instruction?: string;
  publishMode?: "review_queue" | "schedule" | "immediate";
}
```

Behavior:

- `articleId`로 게시글과 댓글 맥락을 조회한다.
- regionCluster가 없으면 게시글 작성자 클러스터를 기본값으로 사용한다.
- ghostAccountId가 없으면 같은 cluster에서 ACTIVE ghost를 선택한다.
- LLM 후보를 생성한다.
- 후보마다 `community_automation_contents` row를 만든다.
- 기본 상태는 `pending_review`다.
- `publishMode=schedule/immediate`는 권한과 설정이 허용될 때만 가능하다.

### 7.4 직접 입력 댓글 생성 API

`POST /admin/v2/community-automation/target-posts/:articleId/manual-comments`

Body:

```ts
{
  text: string;
  campaignId?: string;
  parentCommentId?: string;
  regionCluster?: string;
  ghostAccountId?: string;
  publishMode?: "review_queue" | "schedule" | "immediate";
  reason?: string;
}
```

Behavior:

- text length: 1-2000자, 실제 `comments.content` 제한과 동일
- 직접 입력도 quality guard를 통과해야 한다.
- `generatedText`는 null, `finalText`는 text로 저장한다.
- audit action은 `manual_comment_created`로 남긴다.
- 기본 상태는 `pending_review`다.

### 7.5 DAG/큐 데이터 확장

`DagRunJobData`에 추가:

```ts
{
  parentArticleId?: string;
  parentCommentId?: string;
  regionCluster?: string;
  ghostAccountId?: string;
  tone?: string;
  instruction?: string;
}
```

`CommunityGraphState`에 이미 있는 `parentArticleId`, `parentCommentId`를 실제로 채워 넣고, `runCommentGraph`에서 `CommentContextCollectorNode`를 실행해야 한다.

필수 수정:

- `CampaignService.triggerDagRun` DTO 확장
- `InteractionProcessor`가 payload.articleId를 dag run의 parentArticleId로 전달
- `ContentPublishedHandler`가 실제 유저 게시글에 target-comment job을 만들 때 articleId를 보존
- `ReviewQueueEnqueueNode`가 targetType enum/string을 일관되게 저장
- `PublishProcessor`가 대소문자 불일치 없이 댓글/대댓글을 판별

### 7.6 데이터 모델 보강

현재 `community_automation_contents`에는 `target_parent_id` 하나만 있다. 대댓글과 게시글 댓글을 안전하게 구분하려면 아래 중 하나가 필요하다.

권장안:

- `target_article_id`
- `target_comment_id`
- `published_article_id`
- `published_comment_id`

최소안:

- 기존 `target_parent_id`는 articleId로 유지
- `target_comment_id` 컬럼 추가
- 기존 `article_id`, `comment_id`는 발행 결과 ID로 유지

권장안이 더 명확하다. 현재 `commentId`를 부모 댓글과 발행 결과 댓글 양쪽 의미로 쓸 위험을 제거해야 한다.

### 7.7 ghost 후보 선택 요구사항

같은 REGION_CLUSTER 기본값을 충족하려면 ghost 계정과 region을 연결해야 한다.

후보 산출:

- `ghost_accounts.status = ACTIVE`
- `ghost_accounts.ghost_user_id -> users.id`
- `users.profile_id` 또는 `profiles.user_id`
- `university_info.profile_id -> universities.region`
- `RegionClusterFactory.getClusterName(universities.region) = targetCluster`

Fallback:

- 같은 cluster 후보 1명 이상: 자동 선택 가능
- 0명: 초안 생성/직접 입력은 가능하지만 발행 전 ghost 선택 필요
- region 정보 없음: "지역 미확인" 상태로 표시하고 자동 발행 차단

### 7.8 검수/발행 요구사항

- LLM 생성과 직접 입력 모두 `community_automation_contents`에 기록한다.
- 기본 상태는 `pending_review`.
- `reviewRequiredBeforePublish=true`이면 즉시 발행 요청도 검수 큐로 보낸다.
- 승인 시 `scheduled`로 변경하고 publish queue에 등록한다.
- 예약 시간은 `TimingPolicyService.sampleNextPublishTime`을 기본 사용하되, 상세 패널에서 즉시/예약 선택을 허용할 수 있다.
- 발행 성공 시 실제 `comments` row를 생성하고 `publishedAt`, `commentId`를 기록한다.
- 회수 시 실제 `comments.deleted_at`도 업데이트해야 한다.

### 7.9 안전 정책

LLM prompt와 quality guard는 다음을 막아야 한다.

- 게시글 작성자 개인정보 추론
- 학교/지역을 직접 알고 있는 척하는 표현
- 운영자/AI/ghost임을 암시하는 표현
- 특정 유저를 유도하거나 만남을 종용하는 표현
- 신고/블라인드 게시글에 자동 댓글 발행
- 삭제된 게시글에 댓글 발행
- 같은 ghost가 같은 게시글에 반복 댓글 작성
- 같은 유저 게시글에 단기간 과다 댓글 작성

추가 제한:

- 게시글당 자동화 댓글 최대 N개
- ghost당 일일 댓글 최대 N개
- 실제 유저 한 명의 게시글에 대한 ghost 댓글 일일 최대 N개
- 신고 수가 임계치 이상이면 LLM 생성만 허용하고 발행은 차단

## 8. 프론트엔드 요구사항

### 8.1 서비스 레이어

`app/services/admin/community-automation.ts`에 아래 namespace를 추가한다.

- `targetPosts.list(query)`
- `targetPosts.get(articleId)`
- `targetPosts.createLlmDraft(articleId, body)`
- `targetPosts.createManualComment(articleId, body)`
- `targetPosts.listGhostCandidates(articleId, query?)`

### 8.2 페이지

새 페이지:

- `app/admin/community-automation/target-posts/page.tsx`

또는 기존 `campaigns`와 같은 계층에서 route label은 "실제 게시글".

UI 구성:

- 상단 필터바
- 카드 테이블
- 상세 drawer
- 댓글 작성 패널
- 생성 후보 리스트
- 검수 큐 이동 링크
- 발행/예약/검수 상태 chip

### 8.3 상태 처리

- 로딩: 테이블 skeleton
- 빈 상태: "조건에 맞는 실제 게시글이 없습니다"
- region 없음: warning chip
- ghost 후보 없음: 발행 버튼 disabled
- quality failed: 사유 표시
- API 실패: backend error message 표시

## 9. 수용 기준

MVP 수용 기준:

1. 어드민이 `/admin/community-automation/target-posts`에서 실제 유저 게시글 목록을 볼 수 있다.
2. 각 게시글 row에 작성자 REGION_CLUSTER가 표시된다.
3. 게시글 클릭 시 본문과 기존 댓글을 볼 수 있다.
4. 기본 regionCluster는 게시글 작성자의 cluster로 채워진다.
5. LLM 댓글 초안을 생성하면 검수 큐에 `pending_review` 콘텐츠가 생긴다.
6. 어드민이 직접 입력한 댓글도 검수 큐에 `pending_review` 콘텐츠로 생긴다.
7. 승인하면 실제 `comments` row가 생성된다.
8. 생성된 댓글은 target article에 연결된다.
9. 회수하면 자동화 상태뿐 아니라 실제 댓글도 soft delete된다.
10. 신고/블라인드/삭제 게시글에는 기본 발행이 막힌다.

품질 수용 기준:

- 같은 게시글에 대한 LLM prompt에는 게시글 본문과 기존 댓글 맥락이 포함된다.
- targetType 대소문자 불일치로 댓글이 게시글로 발행되는 일이 없다.
- parentCommentId와 publishedCommentId가 혼동되지 않는다.
- regionCluster override는 audit에 남는다.
- 직접 입력 댓글도 audit과 metrics에 포함된다.

## 10. 구현 순서 제안

1. 백엔드 read model부터 만든다.
   - target-posts list/detail API
   - author region/cluster 계산
   - automation status aggregate

2. 백엔드 댓글 생성 계약을 만든다.
   - LLM draft API
   - manual comment API
   - DTO validation
   - audit action 추가

3. DAG/큐 결함을 고친다.
   - DagRunJobData 확장
   - CommentContextCollectorNode 연결
   - targetType 값 정규화
   - parent/published comment ID 분리
   - PersonaSelectorNode DB 연동

4. publish/withdraw를 완성한다.
   - 댓글 발행
   - 대댓글 발행
   - 실제 댓글 soft delete
   - 중복/쿨다운 가드

5. 프론트 실제 게시글 UI를 만든다.
   - route/layout tab 추가
   - 카드 테이블
   - 상세 drawer
   - LLM/직접 입력 패널

6. 검증한다.
   - 백엔드 unit/integration test
   - admin service test
   - 브라우저 E2E smoke test

## 11. 오픈 질문

1. 직접 입력 댓글은 기본적으로 검수 큐를 거쳐야 하는가, 아니면 어드민 권한이면 즉시 발행 가능한가?
2. 같은 REGION_CLUSTER 후보가 없을 때 전국 후보 fallback을 허용할 것인가?
3. 댓글 작성 ghost를 자동 선택만 할 것인가, 특정 ghost 선택도 허용할 것인가?
4. LLM 후보는 한 번에 1개가 좋은가, 3개 후보 중 선택이 좋은가?
5. 실제 유저 게시글에 자동 댓글이 달렸다는 내부 이력을 운영자 외 다른 관리자 화면에도 노출할 것인가?

## 12. 코드 근거

- `Project-Solo/app/services/admin/community-automation.ts`: 현재 캠페인/검수 큐/메트릭스/페르소나/설정 service contract
- `Project-Solo/app/admin/community-automation/campaigns/page.tsx`: 현재 자동화 유형 선택 UI
- `Project-Solo/app/admin/community-automation/review-queue/page.tsx`: 현재 승인/수정승인/재생성/회수 UI
- `solo-nestjs-api/src/admin/v2/community/community-v2.controller.ts`: 실제 게시글/댓글 관리자 API
- `solo-nestjs-api/src/admin/v2/community/community-v2.repository.ts`: 게시글/댓글 조회 쿼리
- `solo-nestjs-api/src/admin/v2/community-automation/campaigns-v2.controller.ts`: 현재 DAG 수동 실행 API
- `solo-nestjs-api/src/admin/v2/community-automation/review-queue-v2.controller.ts`: 현재 검수 큐 API
- `solo-nestjs-api/src/community-automation/dag/graph-builder.ts`: 댓글 그래프 분기 구조
- `solo-nestjs-api/src/community-automation/dag/nodes/comment-context-collector.node.ts`: 댓글 맥락 수집 노드
- `solo-nestjs-api/src/community-automation/dag/nodes/persona-selector.node.ts`: 현재 ghost 선택 TODO
- `solo-nestjs-api/src/community-automation/queue/publish.processor.ts`: 실제 article/comment 발행 처리
- `solo-nestjs-api/src/database/schema/articles.ts`: 게시글 schema
- `solo-nestjs-api/src/database/schema/comments.ts`: 댓글 schema
- `solo-nestjs-api/src/database/schema/community-automation-contents.ts`: 자동화 콘텐츠 상태 schema
- `solo-nestjs-api/src/matching/services/region-cluster/region-cluster.factory.ts`: REGION_CLUSTER 계산 진입점
