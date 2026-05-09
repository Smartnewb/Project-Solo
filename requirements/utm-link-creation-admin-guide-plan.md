# UTM 링크 생성 관리자 가이드 및 AI 자동입력 기획

작성일: 2026-05-08
대상 화면: `/admin/utm-management`
관련 FE repo: `/Volumes/eungu/projects/Project-Solo`
관련 BE repo: `/Volumes/eungu/projects/solo-nestjs-api`

## 1. 현재 API/데이터 구조 요약

관리자 화면은 `POST /admin/v2/utm/links`로 UTM 링크를 생성한다. 프론트 서비스 계약 기준 생성 payload는 다음 필드를 보낸다.

```ts
{
  name: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent?: string;
  utmTerm?: string;
  utmId?: string;
  utmSourcePlatform?: string;
  utmCreativeFormat?: string;
  utmMarketingTactic?: string;
  destinationType: 'web' | 'appstore_ios' | 'appstore_android';
  memo?: string;
  platformBindings?: PlatformBindingInput[];
}
```

백엔드 DTO/DB 기준 필수값은 `name`, `utmSource`, `utmMedium`, `utmCampaign`, `destinationType`이다. 나머지는 선택값이지만 성과 분석 정밀도를 위해 가능한 한 자동입력 또는 선택식으로 채우는 것이 좋다.

백엔드는 링크 생성 시 목적지별 URL을 만든다.

- `web`: `https://some-in-univ.com?utm_source=...&utm_medium=...&utm_campaign=...` plus optional UTM params
- `appstore_ios`: `https://apps.apple.com/app/id6444733685?ct={utmCampaign}&pt=126413580&mt=8`
- `appstore_android`: `https://play.google.com/store/apps/details?id=com.sometime.app&referrer={encoded UTM params}`
- 백엔드 enum에는 `deeplink`도 있으나 현재 프론트 생성 UI에는 없다.

성과 구조는 링크 자체의 `utm_links`, 방문 이벤트 `utm_events`, 첫 터치/세션 `attribution_touches`, 가입 `user_attributions`, 결제 `payment_attributions`, Meta CAPI/전환 내보내기 로그까지 이어진다. 따라서 링크 생성 UI는 "URL 만들기"가 아니라 "이후 성과 JOIN을 안정화하는 메타데이터 입력"으로 설계해야 한다.

## 2. 관리자가 실제로 입력해야 하는 것

### 필수 입력

| UI 필드 | API 필드 | 의미 | 권장 입력 규칙 | 자동입력 |
|---|---|---|---|---|
| 채널 | `utmSource`, `utmMedium` | 어디서 들어왔고 어떤 유형의 트래픽인지 | 프리셋 우선. 직접입력은 lowercase snake_case | 프리셋 선택 시 자동 |
| 캠페인 | `utmCampaign` | 예산/기획 단위의 캠페인명 | `YYYYMM_objective_audience` 예: `2026_spring_signup_kr20f` | AI가 목적/기간/타겟에서 추천 |
| 링크 이름 | `name` | 관리자 목록에서 보는 내부 이름 | `{source}_{campaign}` 기본, 필요하면 소재/목적 추가 | 현재 자동 생성 유지 |
| 목적지 | `destinationType` | 웹/스토어 이동 방식 | 캠페인 CTA에 맞게 선택 | AI가 캠페인 설명에서 추천 |

### 선택이지만 강하게 권장

| UI 필드 | API 필드 | 의미 | 언제 입력해야 하는가 | 자동입력 |
|---|---|---|---|---|
| 콘텐츠 | `utmContent` | 같은 캠페인 안의 소재/문구/랜딩 변형 | A/B 테스트, 소재별 성과 비교가 필요할 때 | AI가 소재 설명에서 `video_a`, `poster_qr_01` 등 추천 |
| Term | `utmTerm` | 검색 키워드 또는 타겟 세그먼트 | Google Search 키워드, 타겟 그룹, 학교/지역별 분리 | AI가 타겟/키워드에서 추천 |
| UTM ID | `utmId` | 플랫폼을 넘나드는 안정적인 캠페인 키 | 동일 캠페인을 Meta/Google/오프라인에서 묶어 봐야 할 때 | `{source}_{campaign}_{shortHash}` 자동 생성 |
| Source platform | `utmSourcePlatform` | 실제 광고/유입 플랫폼 | Meta Ads, Google Ads, Instagram Organic 등 | 채널/플랫폼 바인딩 기반 자동 |
| Creative format | `utmCreativeFormat` | 이미지/영상/릴스/QR 등 소재 형식 | 소재 성과를 형식별로 보고 싶을 때 | AI가 소재 설명에서 추천 |
| Marketing tactic | `utmMarketingTactic` | 신규획득/리타게팅/이벤트/추천 등 마케팅 전술 | 대시보드 drilldown 기준을 운영 언어와 맞출 때 | AI가 캠페인 목적에서 추천 |

### 플랫폼 바인딩

Platform binding은 광고 플랫폼의 원본 ID와 UTM 링크를 묶는 영역이다. 성과 대시보드에서 `campaignId`, `adsetId/adGroupId`, `adId`, `creativeId`, `placement`, `siteSourceName` 필터와 전환 export를 연결하기 위해 필요하다.

| 플랫폼 | 입력 우선순위 | 비고 |
|---|---|---|
| Meta | `campaignId` > `adsetId` > `adId` > `creativeId` > `placement` > `siteSourceName` | `adsetId`는 Meta 전용 |
| Google Ads | `campaignId` > `adGroupId` > `adId/creativeId` > `placement/siteSourceName` | `adGroupId`는 Google 전용 |

바인딩 값은 사람이 외우는 값이 아니므로 수동 입력보다 CSV/복붙/광고 URL 파싱/AI 추출을 붙이는 편이 좋다.

## 3. 화면 가이드 UX 기획

### 3.1 단계형 생성 플로우

현재 한 화면에 모든 입력이 노출되어 있어 초보 관리자는 "무엇을 꼭 넣어야 하는지" 알기 어렵다. 다음 3단계로 재구성한다.

1. 캠페인 의도 입력
   - 관리자 입력: 캠페인 목적, 채널, 타겟, 소재 설명, 목적지
   - AI 출력: 필수 UTM 초안, 추천 옵션, 누락 경고

2. 추적값 확인
   - 필수 필드와 권장 필드를 카드 형태로 표시
   - 각 필드 옆에 "왜 필요한가", "예시", "성과 대시보드 어디에 쓰이나" 툴팁 제공
   - 고급 추적값은 접을 수 있지만, AI가 채울 수 있으면 자동으로 펼쳐 제안

3. 생성 전 검증
   - 최종 URL preview
   - iOS는 App Store `ct`에 캠페인만 들어간다는 주의 표시
   - 같은 `utmSource + utmCampaign + utmContent + utmTerm` 중복 여부 경고
   - 생성 후 short URL/QR/복사 버튼 제공
   - short URL의 공개 형식은 `https://some-in-univ.com/go/{shortCode}`이다. 운영자에게 노출되거나 광고/QR에 들어가는 URL에는 `api.some-in-univ.com` 또는 `/api` prefix를 넣지 않는다.

### 3.2 호버 툴팁 문구

| 필드 | 툴팁 문구 |
|---|---|
| 채널 | "유입이 시작된 장소입니다. 예: google, meta, instagram, everytime. 프리셋을 쓰면 source/medium이 같이 채워집니다." |
| 캠페인 | "예산과 성과를 묶어 볼 캠페인 단위입니다. 기간/목적/타겟이 드러나게 작성하세요. 예: 2026_spring_signup_kr20f." |
| 소스 | "URL의 utm_source입니다. 유입 출처입니다. 대시보드 채널 성과의 1차 그룹 기준입니다." |
| 매체 | "URL의 utm_medium입니다. paid/social/cpc/referral/offline처럼 트래픽 유형을 나타냅니다." |
| 콘텐츠 | "URL의 utm_content입니다. 같은 캠페인 안에서 소재, 문구, 배너 위치, QR 포스터 버전을 구분합니다." |
| Term | "URL의 utm_term입니다. 검색 키워드 또는 타겟 세그먼트를 넣습니다. 검색 광고가 아니면 선택입니다." |
| UTM ID | "플랫폼이 달라도 같은 캠페인을 묶는 안정적인 ID입니다. 자동 생성값 사용을 권장합니다." |
| Source platform | "실제 광고/유입 플랫폼입니다. Meta Ads와 Instagram Organic처럼 source만으로 구분이 어려운 경우 필요합니다." |
| Creative format | "이미지, 영상, 릴스, QR 등 소재 형식입니다. 형식별 전환율 비교에 사용합니다." |
| Marketing tactic | "신규획득, 리타게팅, 이벤트, 추천 등 마케팅 전술입니다. 운영 관점의 성과 비교에 사용합니다." |
| Campaign ID | "광고 플랫폼의 캠페인 ID입니다. Meta/Google 관리자 화면에서 복사합니다." |
| Adset/Ad group ID | "Meta는 Adset, Google은 Ad group 단위입니다. 타겟/그룹별 성과 연결에 필요합니다." |
| Ad ID | "개별 광고 ID입니다. 광고 단위 전환 연결에 필요합니다." |
| Creative ID | "소재 ID입니다. 같은 광고 안의 이미지/영상 성과를 구분할 때 사용합니다." |
| Placement | "광고가 노출된 위치입니다. 예: Instagram Feed, Reels, YouTube, campus poster." |
| Site source name | "플랫폼 내부 유입면입니다. Meta의 ig/fb/an/msg 또는 Google/YouTube 구분에 사용합니다." |
| 목적지 | "사용자가 클릭 후 이동할 위치입니다. 웹은 전체 UTM query가 붙고, Android는 referrer에 UTM이 들어갑니다. iOS는 App Store 캠페인 토큰 중심입니다." |
| 메모 | "URL에는 노출되지 않는 내부 메모입니다. 예산, 요청자, 실험 가설, 소재 링크를 남기세요." |

### 3.3 인터랙티브 가이드

- "이 링크는 어디에 쓸 건가요?" 빠른 선택: 광고 / 오가닉 SNS / 오프라인 QR / 커뮤니티 / 추천 / CRM
- 선택에 따라 필수/권장 필드 강조
  - 광고: platform binding 영역 강조
  - 오프라인 QR: creative format=`qr`, source platform=`offline`, medium=`offline` 추천
  - 커뮤니티: source=`everytime`, medium=`community`, content에 게시판/문구 버전 추천
  - CRM: medium=`crm`, tactic=`crm`, content에 푸시/문자 템플릿명 추천
- "성과 분석 가능성 점수" 표시
  - 100점: 필수값 + utmId + sourcePlatform + tactic + binding campaign/ad ID 존재
  - 70점: 필수값 + sourcePlatform/tactic 일부 존재
  - 40점: 필수값만 존재
  - 20점: source/medium/campaign이 너무 일반적이거나 중복 위험
- 생성 버튼 옆에 "이 값으로 볼 수 있는 대시보드" preview
  - 채널별 성과: `utmSource`
  - 캠페인별 성과: `utmCampaign`
  - 콘텐츠별 성과: `utmContent`
  - 플랫폼 ID별 drilldown: `platformBindings`

## 4. AI 자동입력 기능 기획

### 4.1 모델 선택

사용자 요청은 "Gemini 3.0 Pro"이나, 2026-05-08 기준 Google 공식 문서상 `Gemini 3 Pro Preview`는 2026-03-09 종료되었고 `gemini-3.1-pro-preview`가 Gemini 3 Pro 계열의 현재 Pro preview 모델이다. 제품 문구는 "Gemini 3 Pro 자동입력"으로 두되, API model id는 env로 분리한다.

권장 환경변수:

```env
GEMINI_API_KEY=
UTM_AI_MODEL=gemini-3.1-pro-preview
UTM_AI_THINKING_LEVEL=low
```

`thinking_level`은 실시간 폼 자동입력에는 `low`, 대량 CSV 정규화나 모호한 캠페인 분석에는 `high`를 사용한다.

### 4.2 기능 단위

#### A. 자연어에서 UTM 초안 생성

입력 예:

```text
5월 중간고사 끝난 대학생 대상 인스타 릴스 광고.
여성 20대 신규가입 유도. 영상 소재 A/B 테스트.
목적지는 웹 랜딩.
```

출력 JSON:

```json
{
  "utmSource": "instagram",
  "utmMedium": "cpc",
  "utmCampaign": "2026_may_signup_kr20f",
  "utmContent": "reels_video_a",
  "utmTerm": "female_univ_20s",
  "utmId": "instagram_2026_may_signup_kr20f",
  "utmSourcePlatform": "meta_ads",
  "utmCreativeFormat": "reels",
  "utmMarketingTactic": "acquisition",
  "destinationType": "web",
  "name": "instagram_2026_may_signup_kr20f_reels_a",
  "memo": "AI draft: 5월 중간고사 이후 20대 여성 대학생 신규가입 릴스 광고"
}
```

#### B. 광고 플랫폼 URL/텍스트에서 바인딩 추출

관리자가 Meta/Google Ads 화면에서 복사한 텍스트 또는 URL을 붙여넣으면 AI가 ID 후보를 추출한다.

출력:

```json
{
  "platform": "meta",
  "campaignId": "120xxxx",
  "adsetId": "120yyyy",
  "adId": "120zzzz",
  "creativeId": "238xxxx",
  "placement": "instagram_reels",
  "siteSourceName": "ig"
}
```

#### C. 필드 품질 검사

생성 전 AI와 규칙 기반 validator를 같이 사용한다.

- 너무 일반적인 campaign: `spring`, `test`, `google` 경고
- source와 sourcePlatform 충돌: source=`google`, sourcePlatform=`meta_ads` 경고
- medium과 tactic 충돌: medium=`organic`, tactic=`retargeting` 경고
- iOS 목적지에서 content/term 분석이 URL 자체에는 충분히 보존되지 않을 수 있음을 안내
- 기존 링크와 같은 UTM 조합이면 "새 content 또는 utmId를 추가할지" 제안

### 4.3 백엔드 BFF API

Gemini API key를 브라우저에 노출하지 않기 위해 Project-Solo BFF route를 추가한다.

```text
POST /api/admin/utm/ai-suggest
POST /api/admin/utm/ai-parse-binding
POST /api/admin/utm/ai-validate
```

요청은 관리자 세션을 확인한 뒤 Gemini API를 호출한다. 응답은 반드시 JSON schema로 고정한다.

```ts
type UtmAiSuggestion = {
  fields: Partial<CreateUtmLinkInput>;
  confidence: number;
  warnings: string[];
  missingInputs: string[];
  rationale: Record<string, string>;
};
```

로그에는 원문 전체를 남기지 말고, 관리자 id, timestamp, model id, success/failure, token usage, warnings count만 남긴다. 광고 예산/타겟 정보가 포함될 수 있으므로 prompt 원문 저장은 opt-in으로 둔다.

## 5. 구현 범위 제안

### Phase 1: 가이드와 자동 규칙

- 각 필드에 tooltip 추가
- 필수/권장/고급 필드 시각 구분
- 현재 프리셋 기반 `source/medium/name` 자동입력 유지
- `utmId` 자동 생성
- destination별 URL 보존 차이 안내
- 규칙 기반 validation 추가

### Phase 2: Gemini 자동입력

- 캠페인 의도 입력 패널 추가
- `ai-suggest`, `ai-parse-binding`, `ai-validate` BFF route 추가
- JSON schema 기반 응답 파싱
- AI 제안값은 바로 저장하지 않고 diff로 보여준 뒤 관리자가 적용

### Phase 3: 운영 편의

- 기존 링크 중복 탐지
- 광고 플랫폼 CSV 붙여넣기/업로드에서 여러 링크 초안 생성
- 생성 전 "성과 분석 가능성 점수"와 대시보드 preview 제공
- 링크 생성 결과에 QR, short URL, destination URL 차이를 더 명확히 표시
- short URL 표시/복사는 백엔드의 `shortUrl` 응답을 그대로 사용하되, 응답이 `api.some-in-univ.com` 또는 `/api/go/` 형태이면 생성 규칙 위반으로 본다.

## 6. 수용 기준

- 관리자는 "캠페인 설명"만 입력해도 필수 UTM 필드 초안을 받을 수 있다.
- 필수값은 왜 필요한지 tooltip으로 확인 가능하다.
- 선택값은 "언제 필요한지"가 UI에서 설명된다.
- AI가 채운 값은 관리자가 적용 전 확인할 수 있고, 원문이 API key나 로그에 노출되지 않는다.
- 생성 전 중복/충돌/목적지별 손실 가능성을 경고한다.
- 기존 `POST /admin/v2/utm/links` 계약은 유지한다.

## 7. 주의할 점

- 프론트의 목적지 타입에 `deeplink`를 추가할지는 별도 결정이 필요하다. 백엔드는 지원하지만 현재 UI는 노출하지 않는다.
- iOS App Store URL은 현재 `utm_campaign`만 `ct`로 반영한다. iOS 캠페인에서 소재/타겟 단위 분석이 중요하면 short URL 리다이렉트 이벤트와 attribution touch 저장을 반드시 신뢰해야 한다.
- UTM 단축 링크는 공개 마케팅 도메인(`some-in-univ.com/go/...`)이 기준이다. backend/API host는 내부 라우팅 구현 세부사항이며, UTM 생성 규칙이나 관리자 복사 URL에 포함하지 않는다.
- `Gemini 3.0 Pro`라는 정확한 API model id에 고정하면 모델 종료/교체에 취약하다. 환경변수 기반 alias로 운영해야 한다.
- AI 자동입력은 canonical naming을 보조하는 기능이어야 하며, 저장 직전의 실제 API payload는 기존 검증 규칙으로 결정해야 한다.
