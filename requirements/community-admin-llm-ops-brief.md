# 커뮤니티 어드민 LLM 운영 기능 기획안

Date: 2026-05-05
Target: Project-Solo Admin + solo-nestjs-api
Status: Draft for handoff

## 1. 커뮤니티 운영 인박스

관리자가 전체 게시글 목록을 직접 훑지 않고, 처리 우선순위가 있는 운영 큐로 커뮤니티를 보게 한다.

핵심 분류:
- `댓글 유도 필요`: 댓글 0개이지만 조회/좋아요가 있는 글
- `불씨 있음`: 최근 댓글이 붙기 시작한 글
- `위험`: 신고, 민감 키워드, 부정 반응이 있는 글
- `방치됨`: 작성 후 일정 시간 반응이 없는 글
- `고스트 개입됨`: 고스트 댓글 예약/발화/실패 이력이 있는 글

어드민 화면:
- `/admin/community-automation/target-posts` 상단에 운영 큐 탭 추가
- 각 탭은 기존 카드 그리드를 재사용
- 카드에는 운영 사유 배지와 추천 액션 표시

서버 힌트:
- target-posts list API에 `opsQueue` 필터 추가
- 댓글 수, 조회 수, 신고 수, 최신 댓글 시각, automation history를 기준으로 서버에서 분류

성공 기준:
- 관리자가 "지금 처리할 게시글"만 빠르게 볼 수 있다.
- 각 카드가 왜 해당 큐에 들어왔는지 1줄로 설명된다.

## 2. LLM 운영 요약

게시글 상세 Drawer에서 본문과 댓글을 모두 읽지 않아도 운영 판단이 가능하도록 LLM 요약을 제공한다.

요약 내용:
- 게시글 의도: 질문, 자기소개, 고민, 논쟁, 위험 등
- 분위기: 긍정, 중립, 불안, 공격적
- 댓글 흐름 요약
- 운영 추천: 댓글 달기, 지켜보기, 블라인드 검토, 핫글 후보
- 추천 이유 1-2줄

어드민 화면:
- `CommunityPostAppDetailPanel` 오른쪽 상단에 `LLM 운영 요약` 박스 추가
- 버튼: `요약 생성`, `다시 생성`
- 생성 결과는 Drawer를 닫았다 열어도 유지되도록 서버 저장 권장

서버 힌트:
- 새 endpoint 예: `POST /admin/v2/community-automation/target-posts/:articleId/ops-summary`
- 저장 위치는 v1에서 별도 테이블보다 `community_automation_audit_events.payload` 또는 신규 lightweight table 검토
- 프롬프트 입력: 게시글 본문, 최근 댓글 20개, 신고 수, 고스트 개입 이력

성공 기준:
- 관리자가 5초 안에 개입 여부를 판단할 수 있다.
- LLM 추천이 항상 이유와 함께 표시된다.

## 3. 댓글 후보 3개 추천 후 즉시/지연 발송

현재 직접 입력 중심의 고스트 댓글 작성 흐름을, LLM 후보 선택형 워크플로우로 확장한다.

핵심 기능:
- 버튼: `댓글 후보 3개 추천`
- 후보 톤:
  - 공감형
  - 질문형
  - 분위기 전환형
- 각 후보 액션:
  - `즉시 발송`
  - `15분 후`
  - `30분 후`
  - `직접 수정`

어드민 화면:
- 고스트 댓글 입력 영역 위에 후보 카드 3개 표시
- 후보 선택 시 textarea에 반영
- 기존 즉시/지연 발송 UI와 연결

서버 힌트:
- 기존 `comment-drafts`는 검수 큐 생성용으로 유지
- 새 endpoint 예: `POST /admin/v2/community-automation/target-posts/:articleId/live-comment-suggestions`
- 응답: `{ suggestions: [{ tone, content, reason }] }`
- 실제 발송은 기존 `live-comments` endpoint 사용

성공 기준:
- 관리자는 직접 문장을 작성하지 않아도 1-2번 클릭으로 자연스러운 댓글을 예약할 수 있다.
- 후보 문장은 짧고 운영자 티가 나지 않아야 한다.

## 4. 고스트 계정 안전 패널

고스트 계정을 직접 선택할 때 반복 노출, 과사용, 같은 글 중복 댓글을 피할 수 있게 안전 정보를 제공한다.

표시 정보:
- 최근 24시간 댓글 수
- 이 게시글에 이미 댓글을 달았는지
- 최근 사용 시각
- 같은 카테고리 발화 빈도
- 추천/주의/비추천 배지

어드민 화면:
- 직접 선택 모드의 ghost dropdown 옵션에 배지 표시
- 선택된 ghost 상세 미니 패널 표시
- 위험한 ghost는 선택 가능하되 경고 문구 노출

서버 힌트:
- 현재 `ghostCandidates` 응답에 이미 `recentCommentCount`, `hasArticleComment`가 있음
- 추가로 `lastCommentAt`, `sameCategoryCommentCount`, `riskLevel`, `riskReasons` 확장
- 수동 선택 검증은 기존 정책 유지

성공 기준:
- 관리자가 잘못된 ghost를 고르기 전에 위험을 알 수 있다.
- 자동 선택 로직과 수동 선택 UI의 판단 기준이 일관된다.

## 5. 예약 댓글 타임라인

게시글 상세에서 앞으로 발화될 고스트 댓글과 과거 발화 결과를 한눈에 보게 한다.

표시 상태:
- 예약됨
- 발화됨
- 실패
- 취소됨

기능:
- 예약 댓글 내용, ghost 계정, 발화 예정 시각 표시
- 예약 취소
- 발송 시간 변경
- 내용 수정

어드민 화면:
- `CommunityPostAppDetailPanel` 오른쪽 영역에 `예약/발화 타임라인` 섹션 추가
- scheduled item은 댓글 목록에 섞지 않고 별도 타임라인으로 표시

서버 힌트:
- 기존 `community_automation_contents`의 `status`, `scheduledAt`, `publishedAt`, `commentId`, `targetArticleId` 활용
- 새 list endpoint 예: `GET /admin/v2/community-automation/target-posts/:articleId/scheduled-comments`
- 취소: `PATCH /.../scheduled-comments/:contentId/cancel`
- 시간 변경: `PATCH /.../scheduled-comments/:contentId/reschedule`
- 내용 수정: `PATCH /.../scheduled-comments/:contentId/text`
- BullMQ jobId는 `scheduled-ghost-comment:{schema}:{contentId}` 패턴을 사용해 취소/재예약 가능하게 유지

성공 기준:
- 관리자가 같은 글에 예약된 고스트 댓글을 중복 생성하지 않는다.
- 예약 후에도 취소/수정/시간 변경이 가능하다.

## 권장 구현 순서

1. 예약 댓글 타임라인 조회 + 취소
2. 고스트 계정 안전 패널
3. LLM 운영 요약
4. 댓글 후보 3개 추천
5. 운영 인박스 분류

## 공통 검증

- Backend: `pnpm exec tsc --noEmit --pretty false`
- Backend: `pnpm test -- community-automation --runInBand`
- Admin: `pnpm exec tsc --noEmit --pretty false`
- Admin: `pnpm test:admin -- --runInBand`

## 메모

- 모든 기능은 기존 `target-posts` 상세 Drawer를 중심으로 확장한다.
- 지연 발송은 이미 BullMQ 기반 `community-automation-publish` 큐를 사용한다.
- v1에서는 WebSocket/SSE 없이 작성/예약 후 재조회 방식으로 충분하다.
