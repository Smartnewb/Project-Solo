# 1:1 문의 어드민 응대·완료 효율화 — 구현 완료

> 작성일: 2026-06-13
> 기획 원문: `support-chat-admin-response-ideation.md`
> 범위: Project-Solo(어드민 프론트) + solo-nestjs-api(백엔드)
> 검증: 양 repo `tsc --noEmit` 0 에러

---

## 구현 항목 (11개 아이디어 전체)

| # | 기능 | 작업처 | 상태 |
|---|------|--------|------|
| 1 | AI 답변 초안 | BE + FE | ✅ |
| 2 | 빠른 답변 템플릿 | FE | ✅ |
| 3 | 큐 정렬 + SLA 표시 | FE | ✅ |
| 4 | 커스텀 종료 메시지 + 사유 태그 | BE + FE | ✅ |
| 5 | 검색 & 필터 | FE | ✅ |
| 6 | 담당자 배정 표시 + 내 문의만 | BE + FE | ✅ |
| 7 | 내부 메모 (유저 비노출) | BE + FE | ✅ |
| 8 | 유사 과거 문의 참조 | BE + FE | ✅ |
| 9 | 타이핑 인디케이터 활성화 | FE | ✅ |
| 10 | 수동 재연결 버튼 | FE | ✅ |
| 11 | 신규 대기 데스크톱 알림 | FE | ✅ |

---

## 백엔드 (solo-nestjs-api)

신규/확장 — 기존 서비스 재활용 위주, 마이그레이션 1건.

- **스키마**: `support_chat_sessions.admin_note TEXT` 컬럼 추가
  - `src/database/schema/support-chat-sessions.ts`
  - 마이그레이션: `src/database/migrations/20260613_add_admin_note_to_support_sessions.ts` (kr/jp/public, TS 레저 패턴 `runOnce` 등록)
- **엔드포인트** (`support-chat-admin.controller.ts`)
  - `GET sessions/:id/ai-draft` → `AiDraftResponse{ draft, confidence, sources[] }`
    - `SupportChatRagService.generateResponse()` 재활용. 마지막 사용자 메시지를 질문으로 RAG 초안 생성. **저장/전송 없음**(초안 전용). sources가 유사 과거 문의(#8) 역할.
  - `PATCH sessions/:id/note` → 내부 메모 저장(빈 값이면 삭제)
  - `POST sessions/:id/resolve` 확장 → `resolutionReason` 수신·영속
- **서비스** (`support-chat.service.ts`)
  - `generateDraftReply`, `updateAdminNote` 추가, `resolveSession`에 reason 전달
  - 세션 목록(`getAdminSessions`)에 `assignedAdminId` 노출, 상세에 `adminNote` 노출
- **리포지토리**: `updateAdminNote`, `resolveWithReason`(closedBy/closedReason 영속)

**No-Silent-Fallback 준수**: AI 초안은 사용자 질문 없으면 `BadRequestException`, 임의 답변 미생성. reason/note 미입력은 선택값으로 명시 처리.

## 프론트 (Project-Solo)

- **신규 모듈/컴포넌트**
  - `app/admin/support-chat/lib/quick-replies.ts` — 템플릿(빌트인+localStorage), 변수 치환(`{nickname}`, 값 없으면 토큰 유지)
  - `components/QuickReplyDialog.tsx` — 템플릿 선택/추가/삭제
  - `components/ResolveDialog.tsx` — 종료 메시지 편집/프리셋 + 해결 사유 칩
- **ChatPanel.tsx**
  - AI 초안 버튼(생성→입력창 채움+유사문의 표시), 템플릿 버튼
  - 타이핑 인디케이터(양방향), 수동 재연결 버튼
  - 내부 메모 패널, 담당자 칩
  - 해결 완료 → ResolveDialog 경유
- **SessionQueue.tsx**
  - 검색창(닉네임/유저ID/메시지)
  - 활성탭 정렬: 대기(오래된순)→AI→어드민
  - SLA 색상 단계(10분 경고/30분 위험 깜빡임)
  - "내 문의만" 필터 + 카드 담당 표시
- **support-chat-v2.tsx**: 신규 waiting_admin 데스크톱 알림(Notification API, 권한 요청·클릭 시 해당 세션 이동)
- **service/types**: `generateAiDraft`, `updateAdminNote`, `resolutionReason`, `adminNote`, `assignedAdminId` 연동

---

## 배포 전 필요 조치

- **마이그레이션 실행**: solo-nestjs-api 배포 시 `pnpm migration:run`이 `admin_note` 컬럼 추가(`runOnce` 멱등).
- **drizzle-kit generate 주의**: 현재 repo에 무관한 스키마 드리프트(ad_platform_bindings 등 타 작업)가 있어 `db:generate`가 인터랙티브로 막힘. 본 작업은 TS 레저 마이그레이션으로 처리했으므로 generate 불필요.

## 검증 상태

- Project-Solo `tsc --noEmit`: **0 에러**
- solo-nestjs-api `tsc --noEmit`: **0 에러**
- lint: 두 repo 모두 lint 설정이 사전적으로 반쯤 마이그레이션된 상태라 CLI 인터랙티브/버전 충돌 → 본 변경과 무관. tsc로 타입 안전성 확인.
- 런타임 E2E(소켓 타이핑/AI초안 응답/메모 영속)는 미실행 — QA 단계 권장.
