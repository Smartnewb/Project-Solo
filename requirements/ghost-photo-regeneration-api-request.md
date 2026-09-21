# Ghost 사진 재생성 API 요청

## 배경

어드민이 Ghost 일괄 생성 후 결과를 카드 형태로 검토합니다.
생성된 사진 품질이 불만족스러울 때, 기존 사진을 레퍼런스로 참조하거나
커스텀 프롬프트를 입력하여 사진을 재생성할 수 있어야 합니다.

---

## 요청 엔드포인트

### POST /admin/ghost-injection/:ghostAccountId/regenerate-photos

Ghost의 프로필 사진을 AI로 재생성합니다.

**Request Body:**

```json
{
  "prompt": "자연스러운 셀카, 밝은 조명, 20대 여성",
  "referencePhotoUrls": [
    "https://s3.../existing-photo-1.jpg"
  ],
  "reason": "사진 품질 개선"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `prompt` | `string` | N | AI 사진 생성 프롬프트. 비워두면 기본 프롬프트 사용 |
| `referencePhotoUrls` | `string[]` | N | 레퍼런스로 사용할 기존 사진 URL. 빈 배열이면 레퍼런스 없이 생성 |
| `reason` | `string` | Y | 감사 로그용 변경 사유 (10자 이상) |

**Response (200):**

```json
{
  "ghostAccountId": "uuid-...",
  "photos": [
    {
      "slotIndex": 0,
      "imageId": "new-image-uuid-1",
      "url": "https://s3.../new-photo-1.jpg"
    },
    {
      "slotIndex": 1,
      "imageId": "new-image-uuid-2",
      "url": "https://s3.../new-photo-2.jpg"
    }
  ]
}
```

**동작:**
- 기존 사진 슬롯을 모두 교체 (기존 이미지는 S3에서 soft-delete)
- `referencePhotoUrls`가 있으면 해당 이미지를 스타일/분위기 레퍼런스로 사용
- `prompt`가 있으면 해당 프롬프트로 생성, 없으면 Ghost 프로필 정보(나이/MBTI 등) 기반 기본 프롬프트
- Ghost당 2~3장 생성 (기존 create-batch와 동일)
- 감사 로그에 기록

**에러:**
- 404: Ghost 없음
- 400: reason 누락 또는 10자 미만
- 500: AI 사진 생성 실패 (재시도 가능)

---

## 추가 고려사항

- 사진 생성은 비동기 처리가 필요할 수 있음 (Ghost당 5~10초 소요 예상)
- 일괄 생성 직후 결과 화면에서 호출하므로, 단일 Ghost 단위로 요청
- 기존 `replaceGhostPhoto`(imageId 직접 입력)와는 별개의 "AI 재생성" 플로우

---

## FE 사용 시나리오

```
1. 어드민이 일괄 생성 실행 (POST /create-batch)
2. 결과를 카드 그리드로 확인
3. 특정 카드의 사진이 마음에 안 듦
4. "사진 재생성" 클릭
5. (선택) 기존 사진 중 레퍼런스로 쓸 것 체크
6. (선택) 커스텀 프롬프트 입력
7. "재생성" 클릭 → POST /regenerate-photos
8. 새 사진으로 카드 업데이트
```

---

*작성: 2026-04-13*
*FE 구현은 이 API가 준비되기 전에 선행 구현합니다. (타입/서비스만 추가, 호출부는 API 준비 후 활성화)*
