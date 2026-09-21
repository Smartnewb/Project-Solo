# 프로필 유형(Archetype) 시스템 명세

## 개요

"프로필 유형"은 가상 프로필(Ghost)을 생성할 때 사용하는 **페르소나 템플릿**이다.
하나의 유형에 나이 범위, MBTI 후보, 관심사 키워드, 말투 힌트를 정의하면,
Ghost 생성 시 BE가 이 범위 안에서 **매번 다른 랜덤 프로필**을 자동 생성한다.

```
프로필 유형 (Archetype)
├── name: "활발한 대학생"
├── description: "사교적이고 에너지 넘치는 성격"
├── traits
│   ├── ageRange: { min: 20, max: 24 }
│   ├── mbtiPool: ["ENFP", "ESFP", "ESFJ"]
│   ├── keywordPool: ["음악", "카페", "여행", "독서", "맛집", "운동"]
│   └── toneHints: ["밝은", "친근한", "자연스러운"]
└── code: "active_student"  (BE 내부 고유 식별자)
```

---

## 프로필 생성 흐름

```
[어드민] 프로필 유형 선택 + 대학/학과/노출 학교 지정
     ↓
POST /admin/ghost-injection/create
     ↓
[BE] GhostProfileGeneratorService.generate(archetype)
     ├── 이름: 한국 성 20종 x 이름 30종 조합 랜덤 (600가지)
     ├── 나이: ageRange.min ~ max 범위에서 랜덤 (기본: 20~28)
     ├── MBTI: mbtiPool에서 1개 랜덤 선택 (없으면 null)
     ├── 키워드: keywordPool에서 3~5개 랜덤 서브셋 (없으면 null)
     └── 소개글: Gemini AI가 실시간 생성
     │           (toneHints + 나이/MBTI/키워드를 컨텍스트로 전달)
     │           (실패 시 archetype.description을 fallback으로 사용)
     ↓
[BE] users, profiles, ghostAccounts, universityInfo 레코드 생성
     ↓
[어드민] 생성 결과 확인 (이름/나이/MBTI/키워드/소개글)
```

**핵심**: 같은 프로필 유형으로 10개를 만들면 10개 모두 다른 이름/소개글/키워드를 가진다.

---

## DB 스키마

테이블: `ghost_persona_archetypes`

| 컬럼 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | varchar(128) | PK | UUID |
| code | varchar(64) | UNIQUE, NOT NULL | 내부 식별 코드 (예: `active_student`) |
| name | varchar(100) | NOT NULL | 표시 이름 (예: "활발한 대학생") |
| description | text | nullable | 유형 설명 / AI 소개글 생성 실패 시 fallback |
| traits | jsonb | NOT NULL | 생성 파라미터 (아래 상세) |
| is_active | boolean | NOT NULL, default=true | 활성 여부 |
| created_at | timestamptz | NOT NULL | 생성일 |
| updated_at | timestamptz | nullable | 수정일 |
| deleted_at | timestamptz | nullable | 소프트 삭제 |

### traits JSONB 구조

```typescript
{
  ageRange?: { min: number; max: number };   // 기본: { min: 20, max: 28 }
  mbtiPool?: string[];                       // 예: ["ENFP", "ESFP"]
  keywordPool?: string[];                    // 예: ["음악", "여행", "카페"]
  toneHints?: string[];                      // AI 소개글 말투 힌트 (예: ["밝은", "친근한"])
  introductionStyle?: string | null;         // (미사용, 예약)
}
```

---

## BE API 명세

### 1. 목록 조회

```
GET /admin/ghost-injection/archetypes

Response:
{
  "items": [
    {
      "archetypeId": "uuid-...",
      "name": "활발한 대학생",
      "description": "사교적이고 에너지 넘치는 성격",
      "traits": {
        "ageRange": { "min": 20, "max": 24 },
        "mbtiPool": ["ENFP", "ESFP", "ESFJ"],
        "keywordPool": ["음악", "카페", "여행"],
        "toneHints": ["밝은", "친근한"]
      },
      "activeGhostCount": 5,
      "createdAt": "2026-04-11T10:30:00Z",
      "updatedAt": "2026-04-11T10:30:00Z"
    }
  ]
}
```

### 2. 생성

```
POST /admin/ghost-injection/archetypes

Request:
{
  "archetypeFields": {
    "code": "active_student",              // *** 필수, UNIQUE ***
    "name": "활발한 대학생",
    "description": "사교적이고 에너지 넘치는 성격",
    "mbtiOptions": ["ENFP", "ESFP"],       // *** BE 필드명: mbtiOptions (NOT mbtiPool) ***
    "keywordOptions": ["음악", "여행"],     // *** BE 필드명: keywordOptions (NOT keywordPool) ***
    "introductionTemplates": ["밝은", "친근한"]  // *** BE 필드명: introductionTemplates ***
  },
  "reason": "신규 유형 추가"
}

Response: { "archetypeId": "uuid-..." }
```

### 3. 수정

```
PUT /admin/ghost-injection/archetypes/:archetypeId

Request:
{
  "archetypeFields": {
    "name": "활발한 대학생 (수정)",
    "description": "업데이트된 설명",
    "mbtiOptions": ["ENFP", "ESFP", "ISFP"],
    "keywordOptions": ["음악", "여행", "맛집"],
    "introductionTemplates": ["자연스러운"]
  },
  "reason": "키워드 추가"
}

Response: { "archetypeId": "uuid-..." }
```

---

## FE-BE 필드명 매핑 (중요!)

BE의 **요청 body**와 **응답 body**에서 필드명이 다르다.

| 용도 | FE 타입 (응답) | BE 요청 필드명 | BE 내부 저장 |
|------|---------------|---------------|-------------|
| MBTI 후보 | `traits.mbtiPool` | `archetypeFields.mbtiOptions` | `traits.mbtiPool` |
| 키워드 후보 | `traits.keywordPool` | `archetypeFields.keywordOptions` | `traits.keywordPool` |
| 말투 힌트 | `traits.toneHints` | `archetypeFields.introductionTemplates` | `traits.toneHints` |
| 나이 범위 | `traits.ageRange` | (code에서 직접 매핑) | `traits.ageRange` |
| 고유 코드 | (응답에 없음) | `archetypeFields.code` | `code` 컬럼 |

**BE 내부 변환 로직:**
```
요청: mbtiOptions      → 저장: traits.mbtiPool
요청: keywordOptions   → 저장: traits.keywordPool
요청: introductionTemplates → 저장: traits.toneHints
```

---

## 현재 FE 구현 문제점

### 1. 요청 body 형식 불일치

현재 FE (`archetype-form-dialog.tsx`)는 `traits` 객체를 직접 보낸다:
```typescript
// 현재 FE가 보내는 형식 (잘못됨)
{
  archetypeFields: {
    name: "...",
    traits: { ageRange, mbtiPool, keywordPool }  // ← BE가 이 형식을 인식 못할 수 있음
  }
}
```

BE가 기대하는 형식:
```typescript
// BE가 기대하는 형식
{
  archetypeFields: {
    code: "...",           // CREATE 시 필수
    name: "...",
    mbtiOptions: [...],    // mbtiPool 아님
    keywordOptions: [...], // keywordPool 아님
    introductionTemplates: [...],
  }
}
```

### 2. code 필드 누락

CREATE 시 `code` 필드가 필수인데 FE 폼에 해당 입력이 없다.

### 3. toneHints 미지원

FE 폼에 "말투 힌트(toneHints)" 입력이 없다.
AI 소개글 생성 시 말투를 제어하는 핵심 파라미터인데 설정할 수 없는 상태.

---

## traits 각 필드의 역할

| 필드 | Ghost 생성 시 동작 | 비어있을 때 |
|------|-------------------|------------|
| `ageRange` | min~max 범위에서 랜덤 정수 | 기본 20~28세 |
| `mbtiPool` | 배열에서 1개 랜덤 선택 | null (MBTI 없음) |
| `keywordPool` | 배열에서 3~5개 랜덤 서브셋 | null (키워드 없음) |
| `toneHints` | AI 소개글 프롬프트에 말투 힌트 전달 | 기본 "자연스러운, 친근한" |
| `introductionStyle` | 미사용 (예약) | — |

---

## 관련 테이블 연결

```
ghost_persona_archetypes (프로필 유형)
        │
        │ 1:N  personaArchetypeId
        ↓
ghost_accounts (가상 프로필 계정)
        │
        │ 1:1  ghostUserId
        ↓
users (유저 테이블, name 저장)
        │
        │ 1:1
        ↓
profiles (프로필 테이블, age/mbti/introduction/keywords 저장)
```

---

## 백필 API

기존에 생성된 Ghost들의 프로필을 현재 archetype 설정 기준으로 재생성한다.

```
POST /admin/ghost-injection/backfill-profiles

Request:
{
  "reason": "프로필 랜덤화 적용",
  "archetypeId": "uuid-..."   // 선택. 생략 시 모든 ACTIVE Ghost 대상
}

Response:
{
  "totalFound": 12,
  "updated": 11,
  "failed": 1,
  "details": [
    { "ghostAccountId": "...", "ghostUserId": "...", "status": "updated" },
    { "ghostAccountId": "...", "ghostUserId": "...", "status": "failed", "error": "..." }
  ]
}
```

동작:
- ACTIVE 상태 Ghost만 대상
- 각 Ghost의 archetype를 기반으로 `GhostProfileGeneratorService.generate()` 호출
- `users.name`, `profiles.*`, `ghostAccounts.profileSnapshot` 3곳 동시 업데이트
- Ghost당 Gemini API 호출 → 프로필당 1~3초 소요
- 개별 실패 시 나머지 계속 진행 (partial success)
