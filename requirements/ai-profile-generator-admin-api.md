# AI Profile Generator Admin API Spec (Captured from Session)

> Note: 이 파일은 세션 중 제공된 스펙 조각을 합친 사본이다. 누락 구간(endpoint route table, 일부 domain contract, validation detail) 은 `TBD` 표기 후 구현 시 백엔드 스펙으로 확정한다.

## 개요

- Date: 2026-04-22
- Base path: `/admin/v2/ai-companions`
- Status: MVP / Phase 1 (Admin UI scope)

AI Profile Generator는 운영자가 stateful draft를 만들고 도메인별 JSON을 생성, 수정, 재생성한 뒤 템플릿으로 재사용할 수 있게 하는 Admin 전용 도구다.

## Phase 1 Admin UI 범위 (이 작업 대상)

- Draft list, create, get, patch, delete
- 11개 지원 도메인 중 MVP 6개 (`seed`, `basic`, `personalityCore`, `relationshipPsychology`, `voice`, `chatBehavior`) 카드 UI + 생성/재생성/편집
- Template list + apply
- Validation warnings 패널
- Version conflict 재조회 흐름
- Locked fields 토글

사진 생성, publish (actual/dry-run), preview chat, prompt version 관리, batch generation, media upload, cleanup UI는 Phase 2+ 범위다.

## 공통 규칙

| Header | Required | Description |
| --- | --- | --- |
| `Authorization: Bearer <admin_access_token>` | O | BFF proxy가 자동 주입 |
| `X-Country` | O | Admin session meta에서 proxy가 자동 주입 (`kr | jp`) |
| `Content-Type: application/json` | POST/PATCH | JSON body |

Response wrapper:

```json
{ "data": {} }
```

Error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": ["expectedVersion must be an integer number"]
  }
}
```

Status codes: `400 | 401 | 403 | 404 | 409` (expectedVersion 불일치).

## Draft Response

```json
{
  "id": "draft-id",
  "scope": "admin_curated",
  "status": "draft",
  "adminUserId": "admin-user-id",
  "ownerUserId": null,
  "templateId": "template-id",
  "templateVersion": 1,
  "domains": {},
  "domainStatus": {
    "seed": "ready",
    "basic": "empty",
    "personalityCore": "empty",
    "relationshipPsychology": "empty",
    "voice": "empty",
    "chatBehavior": "empty"
  },
  "validation": {
    "warnings": [],
    "blockedFlags": [],
    "lastValidatedAt": "2026-04-22T00:00:00.000Z"
  },
  "generationCost": {},
  "controlPolicy": {},
  "lockedFields": {},
  "sourceDataSnapshot": {},
  "publishedCompanionId": null,
  "representativeImageUrl": null,
  "gallery": [],
  "version": 1,
  "createdAt": "2026-04-22T00:00:00.000Z",
  "updatedAt": null
}
```

## Domain Status

`empty | generating | ready | stale | blocked | failed`

Stale 규칙 (발췌):

| Changed domain | Stale target |
| --- | --- |
| `seed` | 모든 하위 |
| `basic` | `personalityCore`, `relationshipPsychology`, `voice`, `chatBehavior` |
| `personalityCore` | `relationshipPsychology`, `voice`, `chatBehavior` |
| `relationshipPsychology` | `voice`, `chatBehavior` |
| `voice` | `chatBehavior` |

## 가정 (구현 시 백엔드 스펙으로 확정)

REST 관례 기반 추정 — 백엔드 구현 완료 후 수정:

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/admin/v2/ai-companions/drafts` | list (pagination, filter) |
| POST | `/admin/v2/ai-companions/drafts` | create draft |
| GET | `/admin/v2/ai-companions/drafts/:id` | get draft |
| PATCH | `/admin/v2/ai-companions/drafts/:id` | mutate top-level (expectedVersion) |
| DELETE | `/admin/v2/ai-companions/drafts/:id` | delete draft |
| POST | `/admin/v2/ai-companions/drafts/:id/domains/:domain/generate` | generate domain |
| POST | `/admin/v2/ai-companions/drafts/:id/domains/:domain/regenerate` | regenerate |
| PATCH | `/admin/v2/ai-companions/drafts/:id/domains/:domain` | patch domain JSON |
| POST | `/admin/v2/ai-companions/drafts/:id/domains/:domain/lock` | lock fields |
| GET | `/admin/v2/ai-companions/templates` | list templates |
| POST | `/admin/v2/ai-companions/drafts/:id/apply-template` | apply template |

모든 mutation body는 `expectedVersion: number`를 포함한다고 가정한다.

## Phase 2 추정 Endpoint (구현 시 확정 필요)

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/admin/v2/ai-companions/drafts/:id/photos/generate` | `photoPrompt` 기반 photo slot 생성 |
| POST | `/admin/v2/ai-companions/drafts/:id/photos` | representative image / gallery 항목 수동 등록 |
| DELETE | `/admin/v2/ai-companions/drafts/:id/photos/:photoId` | 갤러리 항목 제거 |
| PATCH | `/admin/v2/ai-companions/drafts/:id/representative-image` | 대표 이미지 지정 |
| POST | `/admin/v2/ai-companions/drafts/:id/publish/dry-run` | Publish 프리뷰 (실 insert 없음) |
| POST | `/admin/v2/ai-companions/drafts/:id/publish` | Actual publish — `companions` insert |
| POST | `/admin/v2/ai-companions/drafts/:id/preview-chat` | 3턴 시뮬레이션 (저장 안함) |

### Photo generate body

`{ expectedVersion, style?: 'portrait'|'casual'|'custom', customPrompt?: string }`

### Publish dry-run response

`{ companionPreview: Companion, warnings: ValidationWarning[], blocked: boolean }`

### Preview chat

Request: `{ userMessages: string[] }` (1–3 messages)
Response: `{ turns: [{ role: 'user'|'assistant', content: string }] }`

## Phase 3 추정 Endpoint (구현 시 확정 필요)

### Template

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/admin/v2/ai-companions/templates` | list (기존) |
| GET | `/admin/v2/ai-companions/templates/:id` | detail |
| POST | `/admin/v2/ai-companions/templates` | create |
| PATCH | `/admin/v2/ai-companions/templates/:id` | update (expectedVersion) |
| POST | `/admin/v2/ai-companions/templates/:id/archive` | archive |
| POST | `/admin/v2/ai-companions/templates/:id/restore` | restore (archived → active) |
| POST | `/admin/v2/ai-companions/templates/:id/duplicate` | duplicate — 버전 증가된 새 템플릿 생성 |

### Prompt Version

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/admin/v2/ai-companions/prompt-versions` | list |
| GET | `/admin/v2/ai-companions/prompt-versions/:id` | detail (snapshot 포함) |
| POST | `/admin/v2/ai-companions/prompt-versions` | create |
| PATCH | `/admin/v2/ai-companions/prompt-versions/:id` | update (expectedVersion, draft 상태만) |
| POST | `/admin/v2/ai-companions/prompt-versions/:id/activate` | active 전환 (기존 active는 자동 archive) |
| POST | `/admin/v2/ai-companions/prompt-versions/:id/archive` | archive |

### Template body

Create:
`{ name, description?, baseInstruction, domainInstructions?, lockedFields?, randomizationPolicy?, sourceDataPolicy?, imagePolicy?, safetyPolicy?, domainBlueprints?, promptVersionId? }`

Update:
`{ expectedVersion, ...(create fields optional) }`

### Prompt Version body

Create:
`{ name, config: { globalInstruction, domainInstructions?, safetyInstruction?, repairInstruction?, temperatureByDomain? }, description? }`

Update:
`{ expectedVersion, name?, config?, description? }`

## Phase 4 추정 Endpoint (구현 시 확정 필요)

### Photo media upload + retry

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/admin/v2/ai-companions/drafts/:id/photos/upload` | multipart/form-data — 관리자가 직접 이미지 업로드 |
| POST | `/admin/v2/ai-companions/drafts/:id/photos/:photoId/retry` | blocked/failed photo 재생성 |
| POST | `/admin/v2/ai-companions/drafts/:id/photos/:photoId/reject` | 수동 reject — moderationStatus=blocked 유지 + reason 기록 |

### Upload body (multipart)

Fields:
- `file`: image file (required)
- `expectedVersion`: number (required, text field)
- `setAsRepresentative`: `'true' | 'false'` (optional)

Response: updated `AiProfileDraft`

### Retry body

`{ expectedVersion, customPrompt?: string }`

### Reject body

`{ expectedVersion, reason: string }`
