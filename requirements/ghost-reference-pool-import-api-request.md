# Ghost Reference Pool — 기존 프로필 임포트 API 요청

## 배경

`Ghost Reference Pool` 시스템(2026-04-13 BE 가이드)은 어드민이 Seedream으로 새 후보를 생성(F1)→선별(F2)하는 흐름을 갖습니다. 그러나 이미 운영 중인 **A/B 등급 Ghost 프로필의 사진**은 이미 사람 눈으로 검증된 고품질 자산입니다. 이를 풀 부트스트래핑 단계에서 즉시 재활용하면:

- Seedream 생성 비용 절감 (선별률 50% 가정 시 풀 1장당 생성 2장 비용 발생)
- 부트스트래핑 시간 단축 (15~30초 × N배치 → 즉시)
- 검증된 사진만 풀에 들어가므로 초기 품질 baseline 상승

본 요청서는 **기존 Ghost 사진을 풀로 임포트**하는 신규 엔드포인트와, 임포트 모달 UI에서 필요한 **Ghost 목록 조회 필터 확장** 2건을 다룹니다.

---

## 요청 1. 풀 임포트 엔드포인트

### POST /admin/ghost-injection/reference-pool/promote-from-ghost

기존 Ghost의 사진(들)을 레퍼런스 풀에 즉시 등록합니다. F1(생성)을 거치지 않고 `ghost_reference_images` 테이블에 직접 INSERT.

**Request Body:**

```json
{
  "selections": [
    {
      "ghostAccountId": "uuid-...",
      "photoUrl": "https://cdn.sometime.im/ghost-photos/...jpg",
      "tags": { "mood": "casual", "setting": "cafe" }
    }
  ],
  "reason": "import-from-A-rank-bootstrap"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `selections[].ghostAccountId` | `string` | Y | 원본 Ghost ID. 나이 → ageBucket 자동 계산 근거 |
| `selections[].photoUrl` | `string` | Y | Ghost의 `photos[].url` 그대로 전달 |
| `selections[].tags` | `object` | N | mood/setting/style 자유 태깅 |
| `reason` | `string` | Y | 감사 로그용 (10자 이상) |

> **`ageBucket` 자동 계산**: BE가 `ghostAccountId`로 Ghost의 `age`를 조회해 `20-22 / 23-25 / 26-28`로 매핑. FE는 보낼 필요 없음. (Ghost 나이가 28 초과면 해당 항목은 skip + 결과에 `error`로 반환)

> **`sourceMeta` 자동 채움**: BE가 원본 사진 생성 시점의 metadata(있다면)를 그대로 복사. 메타가 없으면 `{ vendor: 'unknown', model: 'imported-from-ghost', prompt: '' }` 같은 fallback. FE는 보낼 필요 없음.

**Response 200:**

```json
{
  "imported": [
    {
      "id": "ref-uuid-1",
      "s3Key": "ghost-reference-pool/ref-uuid-1.jpg",
      "s3Url": "https://cdn.sometime.im/ghost-reference-pool/ref-uuid-1.jpg",
      "ageBucket": "23-25",
      "isActive": true,
      "usageCount": 0,
      "lastUsedAt": null,
      "curatedBy": "admin-user-id",
      "curatedAt": "2026-04-13T12:34:56Z",
      "tags": { "mood": "casual" },
      "sourceMeta": { "vendor": "seedream", "model": "seedream-4-5-251128", "prompt": "..." },
      "createdAt": "2026-04-13T12:34:56Z",
      "updatedAt": "2026-04-13T12:34:56Z",
      "deletedAt": null
    }
  ],
  "skipped": [
    {
      "ghostAccountId": "uuid-...",
      "photoUrl": "https://...",
      "reason": "duplicate" 
    }
  ]
}
```

| 필드 | 의미 |
|------|------|
| `imported` | 실제로 풀에 INSERT된 항목 (전체 `GhostReferenceImage` 형태) |
| `skipped` | 중복 또는 ageBucket 범위 외 등으로 건너뛴 항목 + 사유 |

`skipped[].reason` 케이스: `"duplicate"`, `"age-out-of-range"`, `"photo-not-found"`, `"ghost-not-found"`

**동작 명세:**

1. **S3 복사 vs 참조 — 복사 권장**
   - 원본 Ghost 사진 S3 객체를 `ghost-reference-pool/{new-uuid}.jpg`로 **복사**
   - 이유: 원본 Ghost 비활성화/삭제 시 풀이 깨지면 안 됨. 풀은 독립 lifecycle이어야 함
   - S3 `CopyObject` API 사용 (재업로드 아님)

2. **중복 감지 (dedup)**
   - 같은 원본 `photoUrl`이 이미 풀에 존재하는지 체크 (e.g. `sourceMeta.originalPhotoUrl` 인덱스)
   - 중복이면 `skipped`에 추가, INSERT 안 함
   - **권장**: `ghost_reference_images`에 `source_ghost_account_id` + `source_photo_url` 컬럼 추가 + UNIQUE 제약

3. **연령대 자동 계산**
   - Ghost.age → `20-22 / 23-25 / 26-28` 매핑
   - 19세 이하 또는 29세 이상이면 skip + `"age-out-of-range"`

4. **부분 성공 허용**
   - 일부 항목 실패해도 200 응답. `imported`/`skipped`로 분리 반환
   - 전체 실패만 4xx/5xx

5. **감사 로그**
   - 항목별 1건씩 감사 로그 (`reference-pool.promote-from-ghost`) 기록
   - payload에 `{ ghostAccountId, photoUrl, refImageId, reason }`

**에러:**

- `400` — `selections` 비었거나 100개 초과, `reason` 10자 미만
- `401` — JWT 없음/만료
- `403` — `Role.ADMIN` 권한 없음
- `500` — S3 복사 실패 등 시스템 오류

---

## 요청 2. Ghost 목록 조회 필터 확장

기존 `GET /admin/ghost-injection` (Ghost 리스트)에 임포트 모달용 필터/정렬 옵션 추가.

### 추가 query 파라미터

| 파라미터 | 타입 | 기본 | 설명 |
|---------|------|------|------|
| `rank` | `'A' \| 'B' \| 'C'` (반복 가능) | undefined | 등급 필터. 다중 선택 시 OR (`?rank=A&rank=B`) |
| `minPhotoCount` | `number` | undefined | 사진 N장 이상인 Ghost만. 임포트 모달 기본값 3 |
| `excludeAlreadyImported` | `'true' \| 'false'` | `'false'` | `true` 시, 이미 풀에 임포트된 사진을 가진 Ghost는 제외 (또는 photoCount에서 차감) |
| `sort` | `'createdAt' \| 'updatedAt' \| 'rank'` | `'createdAt'` | `'rank'` 추가 — A→B→C 순 |
| `ageBucket` | `'20-22' \| '23-25' \| '26-28'` | undefined | 임포트 시 ageBucket 미리 좁히기용 |

> `gender` 필터는 불필요 — Ghost는 항상 FEMALE.

### Response 확장 (선택)

`GhostListItem`에 다음 필드 추가하면 임포트 모달에서 한 번에 처리 가능:

```typescript
export interface GhostListItem {
  // ... 기존 필드 ...
  
  // 신규
  photoUrls?: string[];                  // 모든 사진 URL 배열 (primaryPhotoUrl 외)
  importedPhotoUrls?: string[];          // 이미 풀에 임포트된 사진 URL (회색 처리용)
}
```

> `photoUrls`가 부담스러우면 기존 `primaryPhotoUrl + photoCount`만 유지하고, 모달에서 Ghost 클릭 시 `GET /admin/ghost-injection/:id`로 상세 조회하는 N+1 패턴도 가능. **권장은 `photoUrls` 포함** (모달 UX가 단일 화면에서 완결됨)

---

## 사용 시나리오

```
1. 어드민이 /admin/ai-profiles/reference-pool 진입
2. 통계 카드에서 minThresholdBreach 확인 → "기존에서 임포트" 클릭
3. 모달 오픈 → 기본 필터: rank=A,B / minPhotoCount=3 / excludeAlreadyImported=true / sort=rank
4. GET /admin/ghost-injection?rank=A&rank=B&minPhotoCount=3&excludeAlreadyImported=true&sort=rank&limit=50
5. Ghost별 카드(아바타 + 사진 그리드) 표시. 사진 단위로 체크박스
6. 어드민이 12장 선택 → 사유 입력 → "임포트하기" 클릭
7. POST /admin/ghost-injection/reference-pool/promote-from-ghost { selections: [...12개...], reason: "..." }
8. 응답: imported 11건, skipped 1건 (duplicate)
9. 토스트로 결과 알림 → 풀 통계/목록 refetch → 모달 닫기
```

---

## FE 작업 분리

본 API가 준비되기 전에도 FE는 다음을 선행 가능:

1. 페이지/라우트 스캐폴딩 (`/admin/ai-profiles/reference-pool`)
2. 통계 카드 + 그리드 뷰 (기존 `GET /reference-pool`, `/stats` 활용)
3. F1/F2/F3 큐레이션 플로우 구현
4. 임포트 모달 UI 셸 (필터 컨트롤, 그리드 레이아웃)
5. 임포트 모달의 mock 데이터로 인터랙션 검증

API 준비 후:
6. 임포트 모달의 실 데이터 연동 (GhostListQuery 확장 + promote-from-ghost 호출)

---

## 우선순위

| 항목 | 우선순위 | 이유 |
|------|---------|------|
| 요청 1: promote-from-ghost | **P0** | 임포트 모달의 핵심. 이게 없으면 기능 자체가 동작 안 함 |
| 요청 2: rank 필터 + sort | **P0** | 모달 기본 UX. rank 정렬이 핵심 요구사항 |
| 요청 2: minPhotoCount | **P1** | 사진 적은 프로필 자동 제외. 없어도 FE에서 후처리 가능하지만 페이지네이션 정확도 위해 BE 권장 |
| 요청 2: excludeAlreadyImported | **P1** | 중복 노출 방지. 없으면 FE에서 회색 처리만 |
| 요청 2: photoUrls 응답 확장 | **P1** | 없으면 N+1 호출 패턴으로 fallback 가능 |
| 요청 2: ageBucket 필터 | **P2** | 부트스트래핑 후반부에 유용. 초기 출시는 없어도 됨 |

---

*작성: 2026-04-13*
*FE는 P0 항목 준비 후 임포트 모달 활성화. P1/P2는 단계적 enhancement.*
