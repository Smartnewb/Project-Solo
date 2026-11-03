# 피쳐플래그 관리 화면 기획서

2026-10-23 · 기획보드 v1(`designs/2026-10-23-feature-flags-planning-board.html`)에서 전부 추천안으로 확정했다.

## 0. 확정 사항

뼈대는 시안 6·7·8·9를 합친 판이다. 큰 검색창, 요약 숫자 5칸(누르면 필터), [묶음별 전체 | 정리함 | 최근 변경] 탭, 오른쪽 상세 패널로 구성한다.

| 질문 | 결정 | 이번에 반영했나 |
|---|---|---|
| A1 첫 탭 | 묶음별 전체 | 반영 |
| A2 한국어 제목 | 새 `label` 칸 | 칸이 생기기 전까지는 설명 앞부분을 쓴다 (3단계) |
| A3 일본 플래그 | 지금처럼 국가를 전환해서 본다 | 그대로 |
| B1 끄기 의미 | `enabled` 와 롤아웃을 0 으로, 테스트 계정·지정 유저는 유지 | 반영 (서버) |
| B2 묶음 관계 | 서버 `depends_on` 칸 | 칸이 생기기 전까지는 설명 글자로 추정한다 (3단계) |
| B3 부모가 꺼졌을 때 | 경고만 | 반영 |
| B4 변경 이력 | `public.admin_action_logs` 에 기록하고 표시 | 반영 (서버·어드민) |
| B5 폐기 표기 | 보관 표시 | 정리함에 "폐기 표기"로만 모은다. 보관 칸은 3단계 |
| D1 로그인 유지 | 어드민 먼저, 그다음 서버에 기기별 토큰 | 어드민 반영, 서버는 4단계 |

사용자가 답하지 않은 질문은 없다. 모든 질문을 추천안으로 정했다.

**검증 요청.** 운영 DB에서 `enabled=false` 이면서 `rollout_percentage>0` 인 플래그를 아직 세지 않았다. devbox 에서는 3개(`live-female-routing`, `live-female-rank-guard`, `iap_72h_offer_enabled`)가 롤아웃 100%였다. 운영에도 같은 상태라면 지금 그 기능은 로그인한 전원에게 켜져 있다.

## 1. 출시 순서

| 단계 | 저장소 | 내용 | 상태 | 관문 |
|---|---|---|---|---|
| 1 | Project-Solo | 합본 화면, 실제로 받는 사람 표시, 세션 재시도 | 로컬 구현·테스트 완료, 커밋 안 함 | 커밋·배포는 승인 필요 |
| 2 | solo-nestjs-api | 끄기에 롤아웃 포함, 변경 이력 기록·조회 API | `dev` a6c65ba8b | `main` 승격은 승인 필요. 1단계보다 먼저 나가야 "최근 변경"에 기록이 보인다 |
| 3 | solo-nestjs-api | `label`, `depends_on`, `archived_at` 칸 | 미착수 | 마이그레이션 실행 승인 |
| 4 | solo-nestjs-api | refresh 토큰 기기별 테이블 | 미착수 | 마이그레이션 실행 승인 |

옛 어드민과의 호환은 이렇다. 1단계 화면은 2단계 서버 없이도 동작한다. 이 경우 변경 이력 조회에 실패하면 "수정일 순"으로 대신 보여 준다. 반대로 2단계 서버는 옛 어드민 화면에서도 동작하고, 옛 화면에서 끄는 것도 롤아웃까지 내린다.

스토어에 있는 앱에는 영향이 없다. 바뀌는 것은 관리자가 끄기를 누를 때의 결과뿐이다.

## 2. 서버 스펙 (solo-nestjs-api)

평가식은 `src/feature-flags/services/feature-flags.service.ts:40` 의 `evaluateFlagForUser` 다. 지정 유저 → 테스트 계정 → `rollout_percentage` → `enabled`+역할 순서로 본다. 그래서 `enabled` 만 끄면 롤아웃으로 계속 나간다.

- `src/admin/v2/feature-flags/feature-flags-v2.repository.ts:70`: `enabled=false` 로 바꿀 때 `rolloutPercentage: 0` 도 같이 쓴다.
- `feature-flags-v2.repository.ts:82` `recordChange`: `public.admin_action_logs` 에 `resource_type='feature_flag'`, `resource_id=플래그 이름`, `action=TOGGLE|UPDATE`, `diff={before,after}`(enabled·description·allowedRoles·rolloutPercentage)를 남긴다.
- `feature-flags-v2.repository.ts:93` `findChanges`: 국가별 최근 변경을 관리자 이름과 함께 돌려준다.
- `feature-flags-v2.service.ts:47` `applyUpdate`: 토글·수정 모두 이 함수를 거쳐 기록한다.
- `feature-flags-v2.controller.ts:42` `GET /admin/v2/feature-flags/changes?limit=` (기본 50, 최대 200).
- 테스트는 `feature-flags-v2.toggle.spec.ts` 3개다. 끌 때 롤아웃이 0 이 되는지, 켤 때 롤아웃을 건드리지 않는지, 변경 기록이 남는지를 본다.

3단계 DDL 초안이다. 실행하지 않았고, `public`·`kr`·`jp` 세 스키마에 모두 적용해야 한다.

```sql
ALTER TABLE {schema}.feature_flags
  ADD COLUMN IF NOT EXISTS label varchar(60),
  ADD COLUMN IF NOT EXISTS depends_on varchar(128),
  ADD COLUMN IF NOT EXISTS archived_at timestamp;
```

주의할 점이 있다. Drizzle 스키마(`src/database/schema/feature_flags.ts`)에 칸을 먼저 추가하면 `select()` 가 없는 칸을 조회한다. 그러면 모든 플래그 평가가 실패한다. 반드시 마이그레이션을 실행한 뒤에 스키마 코드를 넣는다.

4단계는 지금 `users.refresh_token`(`src/database/schema/users.ts:38`) 한 칸을 `refresh_tokens(user_id, token_hash, device, last_used_at, revoked_at)` 테이블로 옮기는 작업이다. 그러면 같은 계정의 다른 기기 로그인이 서로를 무효로 만들지 않는다. 이 단계는 앱 로그인에도 영향을 주므로 별도 설계가 필요하다.

## 3. 어드민 스펙 (Project-Solo)

| 파일 | 내용 |
|---|---|
| `app/admin/feature-flags/feature-flags-v2.tsx` | 합본 화면 전체 |
| `app/admin/feature-flags/flag-insights.ts` | 순수 판정 함수: `audience`(35), `isLeaking`(54), `displayTitle`(78), `inferParents`(88) |
| `app/services/admin/feature-flags.ts` | `allowTestUsers`·`allowedUserIds`·`rolloutPercentage` 를 받고, `getChanges` 추가 |
| `app/api/admin-proxy/[...path]/route.ts` | 갱신 실패 시 첫 요청은 쿠키를 유지하고 만료 코드만 반환(236·248·297), 7일 지난 세션은 미리 갱신(24) |
| `shared/lib/http/admin-fetch.ts` | `fetchWithSessionRetry`(56): 만료 코드를 받으면 0.4초 뒤 한 번 재시도, 재시도도 실패하면 `/?next=` 로 이동 |
| `shared/auth/admin-auth-contract.ts` | `ADMIN_SESSION_EXPIRED_CODE`, `ADMIN_RETRY_HEADER` |

스위치 상태는 `enabled` 가 아니라 "일반 유저에게 닿는가"(`enabled || rolloutPercentage>0`)로 그린다. 그래야 꺼짐인데 롤아웃으로 나가는 플래그가 켜진 스위치로 보이고, 눌렀을 때 끄기 확인창이 뜬다. 테스트 계정·지정 유저만 남은 플래그는 "꺼짐 · 테스트만"으로 표시한다.

| 상태 | 표시 |
|---|---|
| 불러오는 중 | 스피너 `불러오는 중` |
| 검색 결과 없음 | `"검색어" 와 맞는 기능이 없습니다` |
| 정리함 0개 | `정리할 플래그가 없습니다` |
| 토글 실패 | 스위치 원래대로 + `"이름" 토글에 실패했습니다.` |
| 꺼짐인데 나가는 중 | 빨간 점, 상세 패널에 받는 사람 목록 + `스위치는 꺼져 있지만 위 사람들에게는 켜져 있습니다.` |
| 부모 꺼짐 | 자식 아래 `부모 "이름" 가 꺼져 있음` |
| 변경 이력 조회 실패 | `변경 기록을 불러오지 못해 수정일 순으로 보여 줍니다` |

테스트는 다음과 같다. `heroui-flags.test.tsx` 4개, `flag-insights.test.ts` 4개, `__tests__/app/api/admin-proxy/session-retry.test.ts` 4개, `__tests__/shared/admin-fetch-session-retry.test.ts` 2개. 그리고 `pnpm test:admin` 130개가 통과했다.

## 4. 하지 않는 것

- 롤아웃 % 편집. 분할 배정을 금지하는 메모리 규칙(`no-ab-experiments`) 때문에 보여 주기만 한다.
- 한국·일본 나란히 비교(시안 10). 고르지 않았다.
- 플래그 행 삭제. 대신 3단계에서 보관 표시를 넣는다.
- 지정 유저·테스트 계정 편집 화면.
