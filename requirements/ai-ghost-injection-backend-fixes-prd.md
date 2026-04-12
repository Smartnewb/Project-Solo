# Ghost Injection BE 보완 PRD

**작성일**: 2026-04-12
**대상 레포**: `solo-nestjs-api` (브랜치 `feat/ghost-injection-mvp`)
**연관 문서**:
- `requirements/ai-ghost-injection-backend-prd.md` (원본 BE 명세)
- `requirements/ai-ghost-admin-ui-spec.md` (FE UX 스펙)
- `requirements/ai-ghost-admin-phase2-handoff.md` (Phase 2 구현 가이드)

---

## 1. 배경

Project-Solo 어드민 Phase 2(Ghost 관리 UI)가 구현 완료되어 `GET/POST/PATCH/PUT/DELETE /admin/ghost-injection/*` 24개 엔드포인트를 호출합니다. BE 컨트롤러와 감사 로그(AuditedCommandBus) 골격은 완성되어 있으나, **FE 타입 계약을 깨는 enum mismatch 1건**과 **데이터 무결성·집계 누락 4건** + 부가 이슈 3건이 확인되었습니다.

본 PRD는 어드민 콘솔이 실사용 환경에 투입되기 전에 보완해야 할 BE 항목을 우선순위로 정리합니다.

---

## 2. 범위 외

- FE 코드 변경 (EXHAUSTED 표시 폴백은 [#1](#1-ghostaccountstatus-enum-동기화) 해결 전략에 따라 부수적으로 처리)
- 주입 파이프라인 알고리즘(스코어링, 타겟팅 가중치) 자체 수정
- 새로운 어드민 기능 추가

---

## 3. 이슈 정의 (P0~P2)

### #1. `GhostAccountStatus` enum 동기화 — **P0**

**문제**
- BE schema: `src/database/schema/ghost-accounts.ts:6` — `'ACTIVE' | 'INACTIVE' | 'EXHAUSTED'`
- FE type: `app/types/ghost-injection.ts:5` — `'ACTIVE' | 'INACTIVE'`
- `EXHAUSTED` 상태의 Ghost가 `listGhosts()` 응답에 포함되는 순간 FE의 `Badge`, 필터 Select, 상태 토글 로직이 예상하지 못한 값을 받게 됨.

**영향도**
- 어드민 Ghost 목록/카드 뷰에서 `status` 배지가 스타일 누락된 채 렌더
- 상태 필터 `ACTIVE/INACTIVE`로는 EXHAUSTED Ghost를 추려낼 수 없음 → 운영자가 해당 Ghost 존재를 인지 못 함
- `toggleGhostStatus`에 `targetStatus: 'EXHAUSTED'` 전달 경로가 없어 복구 UX 없음

**수정 요건** (택 1)
- **옵션 A (권장)**: API 응답에서 `EXHAUSTED`를 `INACTIVE`로 normalize. 어드민은 2-상태 모델로 유지하고 `EXHAUSTED`는 내부 관리 상태로만 존재. `exposureStats`에 `isExhausted: boolean` 플래그를 추가해 FE가 배지로 구분.
- **옵션 B**: FE 타입에 `'EXHAUSTED'` 추가 + BE는 그대로. 상태 필터/토글 UX가 3-상태로 확장되어야 함.

**수용 기준**
- [ ] 옵션 A 선택 시: `GhostListItem.status`/`GhostDetail.status`는 어떤 경로에서도 `'EXHAUSTED'`를 반환하지 않음
- [ ] 옵션 A 선택 시: `GhostExposureStats`에 `isExhausted: boolean` 필드 추가
- [ ] 옵션 B 선택 시: FE PR 동반 (FE 타입 + 배지/필터 UX 확장)
- [ ] E2E: EXHAUSTED 상태 Ghost를 DB에 직접 만들고 `/admin/ghost-injection/ghosts` 조회 시 목록이 깨지지 않음

**관련 파일**
- `src/database/schema/ghost-accounts.ts`
- `src/ghost-injection/services/ghost-injection-admin-query.service.ts`
- (FE) `/Users/user/projects/Project-Solo/app/types/ghost-injection.ts`

---

### #2. 사진 교체 시 `newImageId` 사전 검증 누락 — **P0**

**문제**
- `ReplaceGhostPhotoHandler`가 `PUT /:ghostAccountId/photo/:slotIndex` 요청을 받으면 `images` 테이블 조회 없이 바로 UPDATE 시도.
- 존재하지 않거나 삭제된 imageId를 입력하면 DB FK 에러(raw Postgres 메시지)로 실패.
- 어드민은 raw imageId(UUID)를 직접 입력하는 UX(사양 확정)이므로 오타 발생 빈도가 높음.

**영향도**
- 운영자가 원인을 파악하지 못해 문의/재시도 반복
- 감사 로그에 실패 이벤트가 남지만 이유가 "Postgres FK violation"으로만 기록

**수정 요건**
- Handler 진입 직후 다음 검증을 순서대로 수행:
  1. `newImageId`가 `images` 테이블에 존재하는가?
  2. 해당 이미지의 상태가 `approved`인가? (approved 아닌 이미지 사용 금지)
  3. `deletedAt IS NULL`
  4. 이미지가 실제로 여성 유저의 프로필 이미지인가? (Ghost는 여성 합성이므로 잘못된 성별 이미지로 교체 불가)
- 실패 시 `BadRequestException`으로 한국어 메시지 throw:
  - "존재하지 않는 이미지 ID입니다." / "승인되지 않은 이미지입니다." / "사용할 수 없는 이미지입니다." 등 구분
- 성공 경로는 기존 로직 유지

**수용 기준**
- [ ] 존재하지 않는 UUID 입력 시 400 + 명확한 메시지
- [ ] 삭제된 이미지 입력 시 400
- [ ] `pending`/`rejected` 상태 이미지 입력 시 400
- [ ] 성공 케이스는 기존과 동일하게 photo row UPDATE + audit event 기록
- [ ] 단위 테스트 4건 (각 실패 경로 + 성공)

**관련 파일**
- `src/ghost-injection/commands/handlers/replace-ghost-photo.handler.ts` (파일명 추정)

---

### #3. Ghost 생성 시 `phaseSchoolIds` 버킷 검증 누락 — **P0**

**문제**
- `SyntheticGhostCreationService`가 `personaArchetypeId`, `universityId`, `departmentId`는 검증하나 `phaseSchoolIds[]`는 그대로 저장.
- 결과적으로 다음이 가능:
  - 블랙리스트 학교(`ghost_school_blacklist`)에 배정된 학교 ID
  - `CONTROL` 버킷 학교 ID
  - 존재하지 않는 UUID
- 실험 격리 원칙 위반. 통계 오염 위험.

**영향도**
- A/B 실험 신뢰성 파손 — CONTROL 그룹에 Ghost가 노출되면 실험 결과 무의미
- 블랙리스트 학교에 Ghost 주입 가능 → 리스크 관리 실패

**수정 요건**
- 생성 트랜잭션 시작 전 검증:
  1. 모든 `phaseSchoolIds`가 `ghost_phase_schools` 테이블에 존재
  2. 모든 항목의 `bucket === 'TREATMENT'`
  3. 어느 하나라도 `ghost_school_blacklist`에 존재하면 reject
- 실패 시 `BadRequestException`: "선택한 학교 중 일부가 TREATMENT 버킷이 아닙니다." / "블랙리스트 학교는 선택할 수 없습니다."
- 감사 로그는 실패도 기록(AuditedCommandBus가 이미 처리하는 것으로 확인됨)

**수용 기준**
- [ ] 블랙리스트 학교 ID가 포함된 요청 → 400 + 메시지
- [ ] CONTROL 버킷 학교 ID가 포함된 요청 → 400 + 메시지
- [ ] 존재하지 않는 UUID → 400 + 메시지
- [ ] 유효한 TREATMENT 학교 ID들 → 정상 생성
- [ ] 단위 테스트 4건

**관련 파일**
- `src/ghost-injection/services/synthetic-ghost-creation.service.ts` (파일명 추정)
- `src/ghost-injection/commands/handlers/create-ghost.handler.ts`

---

### #4. `PhaseSchoolItem.assignedGhostCount` 실제 집계 — **P1**

**문제**
- `ghost-injection-admin-query.service.ts:327` 근처에서 `assignedGhostCount: 0`으로 하드코딩.
- FE는 이 값을 "학교별 활성 Ghost 수" 지표로 사용하여 Phase-School 관리 테이블 + Ghost 생성 시 선택 UX에 노출.

**영향도**
- Phase-School 관리 탭의 `활성 Ghost` 컬럼이 상시 0 → 운영자가 "왜 0인가?" 오해
- Ghost 생성 시 어느 학교에 얼마나 배정됐는지 판단 불가

**수정 요건**
- `listPhaseSchools` 쿼리에서 `ghost_accounts` 테이블 join 또는 correlated subquery로 집계:
  ```sql
  SELECT ga.* FROM ghost_phase_schools ga
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS count
    FROM ghost_accounts g
    WHERE g.status = 'ACTIVE'
      AND g.university_id = ga.school_id
  ) counter ON TRUE
  ```
- "해당 학교를 `phaseSchoolIds`에 포함한 Ghost 수"가 더 정확한 정의라면 관계 매핑 테이블이 있어야 함. 현재 schema에 그런 테이블이 없다면 `university_id` 기준으로 집계 (간이).
- 집계 대상 상태: `ACTIVE` (옵션 A 선택 시 `INACTIVE`가 EXHAUSTED 포함)

**수용 기준**
- [ ] `assignedGhostCount`가 실제 DB 값을 반영
- [ ] 해당 학교의 Ghost를 ACTIVE → INACTIVE 전환 후 재조회 시 숫자 감소 확인
- [ ] `listPhaseSchools` 응답 시간 < 500ms (학교 100개 기준)

**관련 파일**
- `src/ghost-injection/services/ghost-injection-admin-query.service.ts:327`

---

### #5. `GhostExposureStats.totalReported` 실제 소스 연결 — **P1**

**문제**
- `ghost-injection-admin-query.service.ts:540` 근처에서 `totalReported: 0` 하드코딩.
- FE Ghost 상세 drawer의 노출 통계 섹션에 이 값이 표시됨.

**영향도**
- 운영자가 문제 Ghost를 식별하는 가장 중요한 시그널(신고 수)이 상시 0 → 조기 대응 불가
- Ghost 품질 관리 KPI가 비어 있음

**수정 요건**
- 옵션 A (즉시 적용 가능): 기존 `reports` 테이블에서 `reported_user_id == ghostUserId` 카운트
- 옵션 B (장기): `ghost_accounts`에 `total_reported` 카운터 컬럼 추가 + report 이벤트 리스너로 누적
- MVP로는 옵션 A 권장. `GhostDetail` 조회 시 `SELECT COUNT(*) FROM reports WHERE reported_user_id = $1`로 집계.
- N+1 우려 없음 (상세 조회는 단건)

**수용 기준**
- [ ] Ghost를 신고 처리한 후 상세 조회 시 카운터 증가
- [ ] 신고 이력이 없는 Ghost는 `0` 반환 (현 동작 유지)
- [ ] `GET /ghosts/:id` 응답 시간 변동 < 50ms

**관련 파일**
- `src/ghost-injection/services/ghost-injection-admin-query.service.ts:540`

---

### #6. `GhostInjectionStatus.featureFlag.value` 의미 분리 — **P2**

**문제**
- 현재 `featureFlag.value`는 `ghost_exposure_limits.globalCap > 0` 추론 값. Feature Flag와 주입 상한(cap)이라는 별도 개념이 하나의 컬럼에 묶여 있음.
- 운영 중 "주입은 켜두고 cap만 0으로 임시 차단"하고 싶을 때 표현 불가.
- FE `PUT /feature-flag` 호출 시 cap 값이 암묵적으로 변경될 수 있음.

**수정 요건**
- `ghost_exposure_limits` 테이블에 독립 `is_enabled BOOLEAN NOT NULL DEFAULT FALSE` 컬럼 추가 (또는 전용 `ghost_feature_flags` 테이블)
- 마이그레이션: 기존 row에 대해 `globalCap > 0`이면 `is_enabled = true`로 초기값 설정
- `setFeatureFlag` command가 `is_enabled`만 갱신, `globalCap`은 건드리지 않음
- `getStatus` 쿼리도 `is_enabled` 컬럼 직접 반환

**수용 기준**
- [ ] 마이그레이션 롤백 가능
- [ ] FE는 수정 불필요 (계약 유지)
- [ ] `setFeatureFlag(false)` 후 `globalCap` 값 보존 확인

**관련 파일**
- `src/database/schema/ghost-exposure-limits.ts` 또는 동명 파일
- `src/ghost-injection/commands/handlers/set-feature-flag.handler.ts`
- 새 마이그레이션 파일

---

### #7. `ghost_audit_events` 복합 인덱스 확인 — **P2**

**문제**
- FE는 Ghost 상세 drawer에서 `recentAuditEvents`를 노출 (target Ghost에 대한 최근 이벤트).
- 쿼리 조건이 `(target_type, target_id, created_at DESC)`인데 복합 인덱스 존재 여부 미확인.
- 감사 로그는 append-only로 빠르게 증가 → 인덱스 없으면 상세 조회가 Full Scan으로 악화.

**수정 요건**
- 기존 마이그레이션을 확인, 없다면 추가:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_ghost_audit_events_target
    ON ghost_audit_events (target_type, target_id, created_at DESC);
  ```

**수용 기준**
- [ ] `EXPLAIN ANALYZE SELECT * FROM ghost_audit_events WHERE target_type = 'ghost' AND target_id = $1 ORDER BY created_at DESC LIMIT 20` 가 Index Scan
- [ ] Ghost 상세 조회 시간 < 200ms (100만 이벤트 기준)

---

### #8. `primaryPhotoUrl` vs `photos[].url` 일관성 — **P2**

**문제**
- `GhostListItem.primaryPhotoUrl` = `images.thumbnailUrl ?? s3Url`
- `GhostDetail.photos[].url` = `images.largeUrl ?? s3Url`
- 목록과 상세에서 다른 해상도가 표시됨. 배지/카드 뷰는 thumbnail이 맞지만, 명시적 정책 없이 분기되면 혼란.

**수정 요건**
- 정책 명문화: "목록/카드는 썸네일, 상세는 large"
- query service에 주석 추가
- 선택적으로 `GhostPhotoItem`에 `thumbnailUrl`도 함께 반환해 FE가 자유롭게 선택

**수용 기준**
- [ ] 정책 주석 또는 내부 문서화
- [ ] (선택) `photos[].thumbnailUrl` 필드 추가

**관련 파일**
- `src/ghost-injection/services/ghost-injection-admin-query.service.ts`

---

## 4. 우선순위 및 작업 순서

| 순서 | 이슈 | P | 예상 난이도 |
|---|---|---|---|
| 1 | #1 GhostAccountStatus enum 동기화 | P0 | S — 옵션 A면 query normalize만 |
| 2 | #3 phaseSchoolIds 버킷 검증 | P0 | S — 검증 쿼리 추가 |
| 3 | #2 newImageId 사전 검증 | P0 | S — 이미지 존재·상태 체크 |
| 4 | #5 totalReported 집계 연결 | P1 | S — 단건 COUNT 쿼리 |
| 5 | #4 assignedGhostCount 집계 | P1 | M — LEFT JOIN + 성능 확인 |
| 6 | #7 audit events 인덱스 | P2 | XS — 마이그레이션 1줄 |
| 7 | #6 featureFlag 컬럼 분리 | P2 | M — schema 마이그레이션 + handler 수정 |
| 8 | #8 photo URL 정책 문서화 | P2 | XS — 주석 |

**권장 묶음**:
- **PR 1 (P0 3건 번들)** — #1 + #2 + #3. FE 계약 보호 + 데이터 무결성.
- **PR 2 (P1 2건)** — #4 + #5. UI가 의미 있는 숫자를 보이게.
- **PR 3 (P2 정리)** — #6 + #7 + #8. 운영 안정성/성능.

---

## 5. 검증 체크리스트 (전 항목 공통)

- [ ] 각 수정 항목마다 단위 테스트 또는 integration 테스트
- [ ] `pnpm test` 통과
- [ ] 기존 admin E2E가 회귀 없이 통과
- [ ] 감사 로그가 모든 실패 경로에서도 남는지 확인
- [ ] FE(Project-Solo) 페이지 `/admin/ai-profiles/ghosts`가 실제 API와 연동 시 목록/상세/생성/상태 토글 정상 동작
- [ ] `PUT /feature-flag` 호출로 cap이 변동하지 않는지 (#6 한정)

---

## 6. 미결정 사항 (BE 리드 판단 필요)

1. **#1 옵션 A vs B**: EXHAUSTED를 어드민 모델에 노출할지 숨길지. UX 영향이 크므로 사용자 승인 필요.
2. **#4 집계 기준**: "같은 대학 소속 Ghost" vs "phaseSchoolIds에 학교를 포함한 Ghost". 후자가 정확하나 관계 매핑 테이블 필요. 전자는 즉시 가능하나 의미가 약간 다름.
3. **#5 저장소**: reports 테이블 재사용 vs 전용 카운터. MVP는 재사용이 빠르나 장기 성능은 카운터가 유리.

---

## 7. 참고

- FE Phase 2 구현 완료 시점: 2026-04-11
- FE는 현재 uncommitted working tree 상태 (Phase 0/1/2 변경 누적)
- BE 레포 브랜치: `feat/ghost-injection-mvp` (2026-04-11 기준 working tree 상태)
- 본 PRD의 file:line 참조는 분석 에이전트가 조사한 시점 기준이며, 실제 수정 전 `git grep`으로 재확인 필요
