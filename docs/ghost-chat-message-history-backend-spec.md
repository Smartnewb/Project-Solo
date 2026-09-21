# Ghost Chat 메시지 본문 표시 백엔드 수정 스펙

작성일: 2026-05-04
대상 FE: `/Volumes/eungu/projects/Project-Solo`
대상 BE: `/Volumes/eungu/projects/solo-nestjs-api`

## 배경

운영자가 `https://project-solo-gray.vercel.app/admin/ghost-chat?session=b87ce5e1-0ec5-43ca-8e68-231f23adbed7`에서 Ghost Chat 세션을 배정받은 뒤에도 상대방의 실제 채팅 본문이 보이지 않는다.

브라우저 확인 결과 세션은 `진행 중`이고 `userMessageCount=1`, `firstUserMessageAt`, `lastUserMessageAt`은 내려오지만, 화면 중앙에는 “메시지 히스토리 API가 연결되면 실제 대화가 이 영역에 표시됩니다.” 안내만 노출된다.

## 현재 코드 분석

### Frontend

- `app/services/admin/ghost-chat.ts`
  - 현재 API는 `listSessions`, `getSession`, `assignSession`, `sendMessage`, `closeSession`, `eventsUrl`만 제공한다.
  - 메시지 본문 조회 함수가 없다.
- `app/types/ghost-chat.ts`
  - `GhostChatSession`은 `userMessageCount`, `adminMessageCount`, `firstUserMessageAt`, `lastUserMessageAt` 같은 집계/시각 필드만 가진다.
  - `GhostChatTimelineMessage` 타입은 있지만 실제 서비스/훅에서 사용되지 않는다.
- `app/admin/ghost-chat/components/GhostChatPanel.tsx`
  - 실제 메시지 목록 대신 세션 타임라인만 렌더링한다.
  - “최근 메시지 본문은 아직 표시되지 않습니다” 경고가 하드코딩되어 있다.

### Backend

- `src/ghost-injection/ghost-chat/controllers/ghost-chat-admin.controller.ts`
  - `GET /admin/ghost-chat/sessions`
  - `GET /admin/ghost-chat/sessions/:id`
  - `POST /admin/ghost-chat/sessions/:id/assign`
  - `POST /admin/ghost-chat/sessions/:id/messages`
  - `POST /admin/ghost-chat/sessions/:id/close`
  - `SSE /admin/ghost-chat/events`
  - 현재 admin 전용 메시지 히스토리 조회 API가 없다.
- `src/ghost-injection/ghost-chat/services/ghost-chat-session.service.ts`
  - `ghost_chat_session.chat_room_id`에 실제 채팅방 id가 저장되어 있다.
  - `recordUserMessage()`는 유저 메시지 카운트와 시각만 갱신한다.
  - `findById()`는 세션 row만 반환한다.
- `src/ghost-injection/ghost-chat/services/ghost-chat-message.service.ts`
  - `sendAsGhost(sessionId, content)`는 세션을 찾은 뒤 `ChatMessageService.sendMessageToUser(ghostUserId, targetUserId, content, chatRoomId)`를 호출한다.
  - 즉 운영자 메시지는 Ghost 유저 명의의 일반 채팅 메시지로 저장/발행된다.
  - 반대로 읽기용 메서드는 아직 없다.
- `src/chat/service/chat-message.service.ts`
  - 일반 유저용 `getChatMessagesWithCursor(chatRoomId, userId, limit, cursor)`가 이미 존재한다.
  - 하지만 이 메서드는 `ChatRoomRepository.hasAccess(chatRoomId, userId)`를 검사한다.
  - admin user id는 채팅방의 `maleId`/`femaleId`가 아니므로 Ghost Chat admin 화면에서 그대로 재사용하면 권한 실패가 정상이다.
- `src/chat/repository/chat-message.repository.ts`
  - `getChatMessagesWithCursor(chatRoomId, limit, cursor)`는 access check 없이 `chat_messages`를 cursor 기반으로 읽는 low-level repository 메서드다.
  - Ghost Chat admin read API는 이 repository 접근을 감싸되, 세션 존재와 세션의 `chatRoomId`를 기준으로만 조회해야 한다.

## 확인된 추가 버그

`POST /admin/ghost-chat/sessions/:id/assign`은 현재 `req.user.userId`를 사용한다.

```ts
await this.sessionService.assignAdmin(id, req.user.userId);
```

그러나 이 코드베이스의 인증 payload/`AuthenticationUser` 표준 필드는 `id`다. 실제 화면에서도 `assignedAt`은 생겼지만 `assignedAdminId`가 `없음`으로 표시되었다. 따라서 `@CurrentUser() user: AuthenticationUser`를 쓰고 `user.id`를 넘기도록 수정해야 한다.

## 목표

1. 운영자가 Ghost Chat 세션을 열면 실제 `chat_messages` 본문이 보여야 한다.
2. 메시지 발신자는 운영자 관점에서 `TARGET_USER`, `GHOST`, `SYSTEM`으로 구분되어야 한다.
3. 배정받기 시 `ghost_chat_session.assigned_admin_id`와 `ghost_chat_admin_assignment.admin_user_id`에 실제 admin user id가 저장되어야 한다.
4. 일반 유저 앱에는 “관리자에게 배정됨” 같은 시스템 메시지를 보내지 않는다.
5. 기존 일반 채팅 권한 모델을 admin 조회 때문에 느슨하게 만들지 않는다.

## Backend API 스펙

### GET `/admin/ghost-chat/sessions/:id/messages`

Ghost Chat admin 전용 메시지 히스토리 조회 API를 추가한다.

#### Query

| 이름 | 타입 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `limit` | number | `50` | 1-100 사이로 제한 |
| `cursor` | string | 없음 | 이전 페이지 조회용 createdAt cursor |

#### Response

```ts
interface GhostChatMessagesResponse {
  messages: GhostChatTimelineMessage[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface GhostChatTimelineMessage {
  id: string;
  chatRoomId: string;
  senderType: 'TARGET_USER' | 'GHOST' | 'SYSTEM';
  senderId: string;
  content: string | null;
  messageType: 'text' | 'image' | 'emoji' | 'voice';
  mediaUrl: string | null;
  audioDuration: number | null;
  createdAt: string;
  contentLanguage: string | null;
  contentTranslated: string | null;
  translatedLanguage: string | null;
  translationStatus: string | null;
  translationErrorCode: string | null;
  translatedAt: string | null;
}
```

#### Sender mapping

세션 row 기준으로 매핑한다.

| 조건 | `senderType` |
| --- | --- |
| `message.senderId === session.targetUserId` | `TARGET_USER` |
| `message.senderId === session.ghostUserId` | `GHOST` |
| 그 외 시스템 유저 또는 기타 | `SYSTEM` |

#### 조회 방식

1. `GhostChatSessionService.findById(sessionId)`로 세션을 먼저 조회한다.
2. 세션이 없으면 기존처럼 `404 NotFoundException`.
3. 세션의 `chatRoomId`로 `ChatMessageRepository.getChatMessagesWithCursor(chatRoomId, limit, cursor)`를 호출한다.
4. 반환 메시지를 admin 전용 DTO로 변환한다.
5. 일반 유저용 `ChatMessageService.getChatMessagesWithCursor()`는 사용하지 않는다. 이 메서드는 채팅방 참가자 권한 검사를 수행하므로 admin 조회에는 맞지 않는다.

## Backend 구현 범위

### 1. Controller 인증 payload 수정

파일: `src/ghost-injection/ghost-chat/controllers/ghost-chat-admin.controller.ts`

- `@Req() req: { user: { userId: string } }` 패턴 제거.
- `@CurrentUser() user: AuthenticationUser` 사용.
- `assignAdmin(id, user.id)` 호출.
- SSE도 `user.id` 기준으로 연결한다.

### 2. 메시지 조회 DTO 추가

권장 파일:

- `src/ghost-injection/ghost-chat/dto/ghost-chat-message.dto.ts`
- 또는 controller 파일 내부 DTO로 시작해도 된다. 다만 FE 계약이 생기므로 별도 DTO 파일을 권장한다.

### 3. `GhostChatMessageService`에 read 메서드 추가

파일: `src/ghost-injection/ghost-chat/services/ghost-chat-message.service.ts`

추가 메서드 예시:

```ts
async getSessionMessages(
  sessionId: string,
  query: { limit?: number; cursor?: string },
): Promise<GhostChatMessagesResponse>
```

의존성 추가:

- `ChatMessageRepository`

처리:

- `sessionService.findById(sessionId)`
- limit clamp
- `chatMessageRepository.getChatMessagesWithCursor(session.chatRoomId, limit, cursor)`
- sender type mapping

### 4. Controller endpoint 추가

파일: `src/ghost-injection/ghost-chat/controllers/ghost-chat-admin.controller.ts`

```ts
@Get('sessions/:id/messages')
async getMessages(@Param('id') id: string, @Query() query: GetGhostChatMessagesDto) {
  return this.messageService.getSessionMessages(id, query);
}
```

주의: `@Get('sessions/:id/messages')`는 `@Get('sessions/:id')`보다 아래에 있어도 Nest 라우팅상 보통 문제는 없지만, 가독성을 위해 `getSession` 근처에 명확히 배치한다.

## Frontend 연동 스펙

### 타입 추가

파일: `app/types/ghost-chat.ts`

- `GhostChatMessageSender`를 `'TARGET_USER' | 'GHOST' | 'SYSTEM'`으로 확장한다.
- `GhostChatTimelineMessage`를 백엔드 response와 맞춘다.
- `GhostChatMessagesResponse`를 추가한다.

### 서비스 추가

파일: `app/services/admin/ghost-chat.ts`

```ts
getMessages: (id: string, query?: { limit?: number; cursor?: string }) =>
  adminGet<GhostChatMessagesResponse>(`${BASE}/sessions/${id}/messages`, query)
```

### 훅/UI 추가

파일:

- `app/admin/ghost-chat/hooks/useGhostChatSessions.ts`
- `app/admin/ghost-chat/components/GhostChatPanel.tsx`

권장:

- selected session id가 바뀔 때 messages fetch.
- `new_message` SSE에서 선택된 세션이면 messages refetch.
- 전송 성공 후 messages refetch.
- 기존 안내 Alert는 제거하거나 empty/error 상태에서만 표시.
- `TARGET_USER`는 좌측, `GHOST`는 우측 말풍선으로 표시.
- `SYSTEM`은 중앙 보조 텍스트로 표시.

## 테스트 스펙

### Backend unit/integration

1. `assignAdmin`은 `user.id`를 저장한다.
   - given: authenticated user `{ id: 'admin-1' }`
   - when: `POST /admin/ghost-chat/sessions/session-1/assign`
   - then: `assignedAdminId === 'admin-1'`, assignment log `adminUserId === 'admin-1'`
2. `GET /admin/ghost-chat/sessions/:id/messages`는 세션의 `chatRoomId` 메시지를 반환한다.
3. sender mapping:
   - target user message -> `TARGET_USER`
   - ghost user message -> `GHOST`
   - system/unknown sender -> `SYSTEM`
4. 없는 session id는 `404`.
5. 일반 `ChatRoomRepository.hasAccess()`를 admin read path에서 호출하지 않는다.

### Frontend unit

1. selected session이 있으면 `ghostChat.getMessages(session.id)` 호출.
2. 유저 메시지 본문이 화면에 그대로 표시된다.
3. Ghost 메시지 본문이 화면에 표시된다.
4. `new_message` SSE 수신 시 선택된 세션의 messages가 갱신된다.
5. 메시지 조회 실패 시 세션 자체는 유지하고 에러 Alert만 표시한다.

### Manual QA

1. Vercel admin에서 해당 세션 URL로 진입한다.
2. `유저 1건`이 보이는 세션에서 실제 유저 메시지 본문이 말풍선으로 보이는지 확인한다.
3. `Ghost persona로 전송` 후 유저 앱 채팅방에 Ghost 명의 메시지가 자연스럽게 표시되는지 확인한다.
4. 배정 직후 우측 컨텍스트의 `assignedAdminId`가 `없음`이 아닌 실제 admin id로 보이는지 확인한다.
5. 배정만으로 유저 앱에 시스템 메시지가 새로 생기지 않는지 확인한다.

## 비범위

- Ghost persona 자동 응답 생성
- 유저 프로필/학교/나이 컨텍스트 API
- 운영자 템플릿 추천
- 일반 채팅 API 권한 정책 변경
- 배정 사실을 유저에게 알리는 시스템 메시지

## 구현 우선순위

1. BE `assignAdmin` id 필드 버그 수정
2. BE admin messages 조회 API 추가
3. FE service/type/hook 연결
4. FE 말풍선 렌더링
5. SSE/refetch 및 전송 후 갱신 정리

## 핵심 판단

현재 문제는 “배정받기 때문에 상대방 메시지가 안 오는 것”이 아니다. 세션에는 유저 메시지 카운트와 시각이 기록되어 있지만, admin UI가 실제 `chat_messages.content`를 조회하는 API를 아직 갖고 있지 않다. 따라서 수정의 핵심은 Ghost Chat 세션의 `chatRoomId`를 기준으로 admin 전용 메시지 히스토리 read path를 추가하는 것이다.
