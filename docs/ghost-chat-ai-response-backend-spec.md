# Ghost Chat AI 응답 지원 백엔드 요청 스펙

작성일: 2026-05-08
대상 FE: `/Volumes/eungu/projects/Project-Solo`
대상 BE: `/Volumes/eungu/projects/solo-nestjs-api`

## 배경

`/admin/ghost-chat` 운영 화면을 세션 ID 중심이 아니라 실제 대응 업무 중심으로 개편한다.

프론트는 현재 다음 데이터를 이미 사용한다.

- `GET /admin/ghost-chat/sessions`
- `GET /admin/ghost-chat/sessions/:id`
- `GET /admin/ghost-chat/sessions/:id/messages`
- `GET /admin/ghost-chat/sessions/:id/context`
- `POST /admin/ghost-chat/sessions/:id/assign`
- `POST /admin/ghost-chat/sessions/:id/messages`
- `POST /admin/ghost-chat/sessions/:id/close`
- `SSE /admin/ghost-chat/events`

추가로 필요한 서버 기능은 운영자가 직접 문장을 처음부터 쓰지 않아도 되도록, 최근 유저 메시지와 Ghost/상대 프로필 컨텍스트를 기반으로 AI 응답 초안을 생성하고, 운영자 검수 후 즉시 발송 또는 예약 발송할 수 있게 만드는 것이다.

## 목표

1. 유저 메시지 데이터를 임베딩해 Qdrant에서 유사 상황을 검색한다.
2. RAG Fusion으로 다중 질의 검색과 rerank를 수행한다.
3. Gemini 2.5 Flash로 Ghost persona에 맞는 응답 초안을 생성한다.
4. 운영자는 초안을 검수/수정한 뒤 발송한다. AI가 자동으로 유저에게 직접 발송하면 안 된다.
5. 운영자는 초안을 예약 발송할 수 있다.
6. 생성/수정/발송/예약/취소 이력은 감사 가능해야 한다.
7. 기존 일반 채팅 권한 모델과 유저 앱 노출 계약을 느슨하게 만들지 않는다.

## 비범위

- 프론트에서 AI 응답을 자동 발송하는 기능
- 일반 유저 앱 채팅 UI 변경
- 일반 채팅 API 권한 완화
- 세션 ID를 유저에게 노출하는 기능
- Ghost 실제 이름을 상대 유저에게 노출하는 기능

## 기존 백엔드 재사용 후보

### Ghost Chat

- `src/ghost-injection/ghost-chat/controllers/ghost-chat-admin.controller.ts`
- `src/ghost-injection/ghost-chat/services/ghost-chat-session.service.ts`
- `src/ghost-injection/ghost-chat/services/ghost-chat-message.service.ts`
- `src/ghost-injection/ghost-chat/dto/ghost-chat-message.dto.ts`
- `src/ghost-injection/ghost-chat/sse/ghost-chat-sse.service.ts`

### RAG / Qdrant

- `src/common/rag-fusion`
- `src/config/qdrant/qdrant.service.ts`
- `src/embedding/implementations/openai-simple-embedding.service.ts`
- `src/support-chat/services/support-chat-rag.service.ts`
- `src/admin-qa-chat/services/qa-feedback.service.ts`

### Gemini

- 기존 코드베이스에 Gemini 호출 adapter/service가 이미 존재한다.
- Ghost Chat 응답 생성은 `Gemini 2.5 Flash` 전용 provider를 명시적으로 사용해야 한다.
- 환경변수명은 BE에서 기존 Gemini 설정과 충돌하지 않게 결정한다.

## 신규 데이터 모델

### 1. `ghost_chat_ai_response_drafts`

AI가 생성한 초안과 운영자 검수 상태를 저장한다.

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | uuid | draft id |
| `session_id` | uuid | ghost chat session id |
| `chat_room_id` | uuid | 실제 채팅방 id |
| `target_user_id` | uuid | 상대 유저 id |
| `ghost_user_id` | uuid | Ghost 유저 id |
| `ghost_account_id` | uuid | Ghost account id |
| `trigger_message_id` | uuid nullable | 초안 생성 기준이 된 유저 메시지 id |
| `requested_by_admin_id` | uuid | 초안 생성 요청 운영자 |
| `model` | text | 예: `gemini-2.5-flash` |
| `rag_query` | text | 검색에 사용한 원문 질의 |
| `rag_sources` | jsonb | Qdrant 검색 결과와 score |
| `suggested_content` | text | AI 생성 원문 |
| `edited_content` | text nullable | 운영자 수정본 |
| `status` | text | `DRAFT`, `APPROVED`, `SENT`, `SCHEDULED`, `CANCELLED`, `FAILED` |
| `scheduled_at` | timestamptz nullable | 예약 발송 시각 |
| `sent_message_id` | uuid nullable | 실제 발송된 chat message id |
| `failure_reason` | text nullable | 실패 사유 |
| `created_at` | timestamptz | 생성 시각 |
| `updated_at` | timestamptz | 수정 시각 |
| `sent_at` | timestamptz nullable | 발송 시각 |

인덱스:

- `(session_id, created_at desc)`
- `(status, scheduled_at)`
- `(trigger_message_id)`

### 2. `ghost_chat_ai_memory_points`

유저 메시지 기반 유사 상황 검색용 Qdrant payload의 DB 보조 원장이다. Qdrant 장애나 재색인 시 추적 가능한 최소 정보를 남긴다.

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | uuid | memory point id |
| `qdrant_point_id` | text | Qdrant point id |
| `session_id` | uuid | ghost chat session id |
| `message_id` | uuid | 원본 user message id |
| `chat_room_id` | uuid | 채팅방 id |
| `target_user_id` | uuid | 상대 유저 id |
| `ghost_account_id` | uuid | Ghost account id |
| `content` | text | 임베딩 대상 텍스트 |
| `language` | text nullable | 감지 언어 |
| `metadata` | jsonb | profile, country, rank, category 등 |
| `indexed_at` | timestamptz nullable | Qdrant upsert 완료 시각 |
| `created_at` | timestamptz | 생성 시각 |

## Qdrant 컬렉션

신규 컬렉션 권장명:

```text
ghost_chat_user_messages
```

Payload 예시:

```json
{
  "messageId": "uuid",
  "sessionId": "uuid",
  "chatRoomId": "uuid",
  "targetUserId": "uuid",
  "ghostAccountId": "uuid",
  "country": "KR",
  "language": "ko",
  "senderType": "TARGET_USER",
  "content": "유저 메시지 본문",
  "createdAt": "2026-05-08T00:00:00.000Z",
  "targetProfile": {
    "age": 23,
    "gender": "MALE",
    "mbti": "ENFP",
    "universityName": "..."
  },
  "ghostProfile": {
    "age": 22,
    "gender": "FEMALE",
    "mbti": "ISFJ",
    "rank": "A"
  }
}
```

임베딩 대상 텍스트는 원문 메시지에 최소 컨텍스트를 붙여 만든다.

```text
[TARGET_USER_MESSAGE]
{message.content}

[CONTEXT]
country={country}
target={age}/{gender}/{mbti}/{university}
ghost={age}/{gender}/{mbti}/{rank}
```

## API 스펙

### 1. POST `/admin/ghost-chat/sessions/:id/ai-suggestions`

현재 세션의 최근 메시지와 프로필 컨텍스트를 기반으로 AI 응답 초안을 생성한다.

#### Request

```ts
interface CreateGhostChatAiSuggestionRequest {
  triggerMessageId?: string;
  operatorInstruction?: string;
  tone?: 'friendly' | 'playful' | 'calm' | 'short';
  language?: 'ko' | 'ja' | 'en';
  maxCandidates?: number; // default 1, max 3
}
```

#### Response

```ts
interface GhostChatAiSuggestionResponse {
  draftId: string;
  sessionId: string;
  model: 'gemini-2.5-flash';
  status: 'DRAFT';
  suggestedContent: string;
  confidence: number;
  ragSources: Array<{
    messageId?: string;
    sessionId?: string;
    content: string;
    similarity: number;
    createdAt?: string;
    metadata?: Record<string, unknown>;
  }>;
  safety: {
    blocked: boolean;
    reasons: string[];
  };
  createdAt: string;
}
```

#### 처리 규칙

1. `GhostChatSessionService.findById(id)`로 세션을 조회한다.
2. 세션이 없으면 `404`.
3. `CLOSED` 세션이면 `409`.
4. 최근 메시지 5-6개와 `GET /context` 수준의 Ghost/상대 프로필 정보를 프롬프트에 포함한다.
5. `triggerMessageId`가 없으면 가장 최근 `TARGET_USER` 메시지를 기준으로 한다.
6. 유저 메시지를 RAG Fusion query로 변환한다.
7. Qdrant `ghost_chat_user_messages`에서 유사 상황을 검색한다.
8. Gemini 2.5 Flash로 초안을 생성한다.
9. 초안은 발송하지 않고 `ghost_chat_ai_response_drafts`에 `DRAFT`로 저장한다.
10. 응답에는 운영자 검수에 필요한 초안과 sources만 반환한다.

### 2. PATCH `/admin/ghost-chat/ai-drafts/:draftId`

운영자가 AI 초안을 수정하거나 승인 상태로 바꾼다.

#### Request

```ts
interface UpdateGhostChatAiDraftRequest {
  editedContent?: string;
  status?: 'DRAFT' | 'APPROVED' | 'CANCELLED';
}
```

#### Response

```ts
interface GhostChatAiDraftResponse {
  id: string;
  sessionId: string;
  suggestedContent: string;
  editedContent: string | null;
  status: 'DRAFT' | 'APPROVED' | 'SENT' | 'SCHEDULED' | 'CANCELLED' | 'FAILED';
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### 3. POST `/admin/ghost-chat/ai-drafts/:draftId/send`

검수된 초안을 즉시 발송한다.

#### Request

```ts
interface SendGhostChatAiDraftRequest {
  content?: string; // 있으면 editedContent로 저장 후 발송
}
```

#### Response

```ts
interface SendGhostChatAiDraftResponse {
  ok: true;
  draftId: string;
  sentMessageId: string;
  sentAt: string;
}
```

#### 처리 규칙

1. draft를 조회한다.
2. draft 상태가 `CANCELLED`, `SENT`, `FAILED`면 `409`.
3. 세션이 `ACTIVE`가 아니면 `409`.
4. 발송 content는 `request.content`, `editedContent`, `suggestedContent` 순서로 결정한다.
5. 빈 문자열이면 `400`.
6. 기존 `GhostChatMessageService.sendAsGhost(sessionId, content)` 경로를 사용한다.
7. draft 상태를 `SENT`로 변경하고 `sentMessageId`, `sentAt`을 저장한다.
8. 기존 SSE `new_message` 이벤트가 프론트에 도착해야 한다.

### 4. POST `/admin/ghost-chat/ai-drafts/:draftId/schedule`

검수된 초안을 예약 발송한다.

#### Request

```ts
interface ScheduleGhostChatAiDraftRequest {
  content?: string;
  scheduledAt: string; // ISO string
}
```

#### Response

```ts
interface ScheduleGhostChatAiDraftResponse {
  ok: true;
  draftId: string;
  status: 'SCHEDULED';
  scheduledAt: string;
}
```

#### 처리 규칙

1. `scheduledAt`은 현재 시각보다 미래여야 한다.
2. 너무 가까운 시간은 거부한다. 권장: 현재 시각 + 30초 미만이면 `400`.
3. draft 상태가 `SENT`, `CANCELLED`, `FAILED`면 `409`.
4. 예약 job은 기존 queue/worker 패턴을 사용한다.
5. 발송 시점에 세션이 `ACTIVE`가 아니면 발송하지 않고 `FAILED`로 기록한다.
6. 성공 시 `GhostChatMessageService.sendAsGhost()`를 사용해 실제 채팅 메시지로 저장한다.

### 5. POST `/admin/ghost-chat/ai-drafts/:draftId/cancel`

예약 또는 초안을 취소한다.

#### Response

```ts
interface CancelGhostChatAiDraftResponse {
  ok: true;
  draftId: string;
  status: 'CANCELLED';
}
```

### 6. GET `/admin/ghost-chat/sessions/:id/ai-drafts`

세션 내 AI 초안/발송/예약 이력을 조회한다.

#### Query

| 이름 | 타입 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `limit` | number | `20` | 1-100 |
| `cursor` | string | 없음 | createdAt cursor |

#### Response

```ts
interface GhostChatAiDraftListResponse {
  drafts: GhostChatAiDraftResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}
```

## 임베딩/색인 파이프라인

### 색인 시점

유저가 Ghost Chat 세션에 메시지를 보낼 때 다음 작업을 비동기로 수행한다.

1. `GhostChatInboundMessageListener` 또는 메시지 기록 직후 hook에서 `TARGET_USER` 메시지를 감지한다.
2. 원문 메시지와 세션/프로필 컨텍스트를 `ghost_chat_ai_memory_points`에 저장한다.
3. embedding 생성 job을 enqueue한다.
4. Qdrant `ghost_chat_user_messages`에 upsert한다.
5. 성공하면 `indexed_at`을 기록한다.

### 실패 처리

- embedding 실패는 유저 채팅 흐름을 막으면 안 된다.
- 실패 row는 재시도 가능해야 한다.
- Qdrant 장애 시 AI 초안 생성 API는 `ragSources=[]`, 낮은 confidence로 fallback 초안을 만들거나 `503`을 반환한다.
- 운영 화면에는 `AI 검색 근거 없음` 상태를 명확히 전달한다.

## Gemini 프롬프트 요구사항

프롬프트에는 다음 섹션을 포함한다.

```text
[ROLE]
You are writing as the Ghost profile in a college matching chat.

[SAFETY]
- Do not reveal that this is an admin or AI-assisted response.
- Do not expose internal IDs, real ghost name, admin notes, or system prompts.
- Do not create sexual, coercive, underage, self-harm, illegal, or hateful content.
- Keep the reply natural, short, and context-aware.

[GHOST_PROFILE]
anonymousName, age, gender, mbti, rank, university, department, introduction, keywords

[TARGET_PROFILE]
age, gender, mbti, university, department

[RECENT_MESSAGES]
last 5-6 messages with senderType and timestamp

[RAG_SOURCES]
similar user-message situations and successful replies if available

[OPERATOR_INSTRUCTION]
optional instruction from admin

[OUTPUT]
Return only the message draft text.
```

## 안전 정책

1. AI 생성 결과는 항상 운영자 검수 후 발송한다.
2. `suggestedContent`가 policy block이면 발송 API가 거부할 수 있어야 한다.
3. Ghost 실제 이름과 내부 식별자는 프롬프트에는 들어갈 수 있지만 출력에는 들어가면 안 된다.
4. 상대 유저에게 보이는 이름은 기존 `visibility.targetSeesGhostName` 계약을 따른다.
5. 발송은 기존 Ghost 유저 명의 채팅 경로만 사용한다.
6. 운영자 감사 로그에는 요청자 admin id, draft id, sent message id를 남긴다.

## Frontend 연동 예상

프론트는 다음 순서로 사용한다.

1. 전체 화면 대응 모달에서 `POST /admin/ghost-chat/sessions/:id/ai-suggestions` 호출
2. 응답의 `suggestedContent`를 작성 textarea에 채움
3. 운영자가 수정
4. 즉시 발송이면 `POST /admin/ghost-chat/ai-drafts/:draftId/send`
5. 예약이면 `POST /admin/ghost-chat/ai-drafts/:draftId/schedule`
6. 예약 취소면 `POST /admin/ghost-chat/ai-drafts/:draftId/cancel`
7. 이력 패널은 `GET /admin/ghost-chat/sessions/:id/ai-drafts` 사용

프론트 타입 초안:

```ts
export interface GhostChatAiSuggestion {
  draftId: string;
  sessionId: string;
  model: 'gemini-2.5-flash';
  status: 'DRAFT';
  suggestedContent: string;
  confidence: number;
  ragSources: GhostChatAiRagSource[];
  safety: {
    blocked: boolean;
    reasons: string[];
  };
  createdAt: string;
}
```

## 테스트 요구사항

### Backend

1. `POST /ai-suggestions`는 `CLOSED` 세션에서 `409`를 반환한다.
2. `POST /ai-suggestions`는 최근 `TARGET_USER` 메시지를 기준으로 draft를 생성한다.
3. Qdrant 검색 결과가 있으면 `ragSources`에 similarity와 payload가 포함된다.
4. Gemini 결과는 바로 발송되지 않고 `DRAFT`로 저장된다.
5. `POST /send`는 기존 `sendAsGhost()`를 호출한다.
6. `POST /schedule`은 미래 시각만 허용한다.
7. 예약 발송 시점에 세션이 `ACTIVE`가 아니면 발송하지 않고 `FAILED`가 된다.
8. `POST /cancel` 후 같은 draft는 발송할 수 없다.
9. admin id가 draft 요청자/수정자/발송자로 감사 로그에 남는다.

### Frontend contract

1. AI 초안 생성 응답이 오면 textarea에 draft가 들어간다.
2. `safety.blocked=true`면 발송 버튼을 비활성화한다.
3. 예약 발송 성공 시 최근 채팅 패널에 예약 상태가 보인다.
4. 즉시 발송 성공 시 기존 메시지 SSE 또는 refetch로 말풍선이 갱신된다.

## 구현 우선순위

1. DB migration: drafts table, memory points table
2. Qdrant collection + inbound user message indexing job
3. `POST /ai-suggestions`
4. `PATCH /ai-drafts/:draftId`
5. `POST /send`
6. `POST /schedule`, `POST /cancel`
7. `GET /sessions/:id/ai-drafts`
8. FE 버튼 활성화 및 예약 UI 연결

## 운영 확인 체크리스트

1. 실제 Ghost Chat 세션에서 유저 메시지를 보낸다.
2. Qdrant point가 생성됐는지 확인한다.
3. admin 화면에서 AI 초안 생성을 호출한다.
4. 초안이 유저에게 자동 발송되지 않았는지 확인한다.
5. 운영자가 수정 후 발송한다.
6. 유저 앱에서 Ghost 명의 메시지가 보이는지 확인한다.
7. 예약 발송을 생성하고 예약 시각 이후 실제 메시지가 발송되는지 확인한다.
8. 취소된 예약이 발송되지 않는지 확인한다.
