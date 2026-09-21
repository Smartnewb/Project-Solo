# 유저 집중 케어 시스템 — Design Spec

**Date:** 2026-03-23
**Status:** Approved
**Layout:** 리스트 + 사이드패널 (Option B)

---

## 1. 개요

매칭에 반복적으로 실패하는 활성 유저를 자동으로 감지하고, 어드민이 직접 개입하여 매칭을 성사시키는 기능. 백엔드 API는 이미 구현되어 있으며, 이 스펙은 Admin 프론트엔드 구현 범위만 다룬다.

---

## 2. API 범위

| Method | Path | 기능 |
|--------|------|------|
| GET | /admin/care/targets | 케어 대상 유저 리스트 (페이지네이션, 검색) |
| GET | /admin/care/targets/:userId/partners | 추천 파트너 리스트 |
| POST | /admin/care/execute | 케어 실행 (좋아요/상호좋아요/채팅방 개설) |
| POST | /admin/care/targets/:targetId/dismiss | 케어 대상 무시 |
| GET | /admin/care/logs | 케어 이력 조회 (페이지네이션, 필터) |

모든 요청은 BFF 프록시(`/api/admin-proxy/admin/care/...`)를 통해 전달. `X-Country` 헤더로 KR/JP 스키마 선택.

---

## 3. 사이드바 배치

**리텐션** 카테고리에 추가:

```
리텐션
  ├── 여성 리텐션
  ├── 삭제 여성 복구
  ├── 휴면 좋아요
  │     └── 처리 로그
  ├── 유저 케어          ← NEW (/admin/care)
  │     └── 케어 이력    ← NEW (/admin/care/logs)
```

---

## 4. 메인 페이지 레이아웃: 리스트 + 사이드패널

### 화면 구성

```
[상단 요약 통계]
  대기 중: N  |  케어 완료: N  |  무시: N
  (targets API 응답의 total + status별 카운트에서 파생)

[검색 바]
  이름 또는 유저 ID 검색 (search 파라미터, 300ms debounce)

[리스트 + 사이드패널]
  좌측 (320px 고정폭):
    - 케어 대상 카드 리스트
    - 각 카드: 프로필 이미지, 이름, 대학, 성별/나이, 실패일수 뱃지, 마지막 실패 정보
    - 선택된 카드 하이라이트 (border: 2px solid primary)
    - 페이지네이션
    - 빈 상태: "현재 케어가 필요한 유저가 없습니다"
    - 로딩 상태: 스켈레톤 카드 3개

  우측 (flex: 1):
    - 유저 미선택 시: 빈 상태 안내 문구 ("좌측에서 유저를 선택하세요")
    - 유저 선택 시:
      - 유저 프로필 헤더 (이미지, 이름, 대학, 성별, 나이, 소개)
      - 무시 버튼 (헤더 우측)
      - 실패 정보 배너 (연속 실패일수, 마지막 실패 시각, 실패 사유)
      - 추천 파트너 리스트 (이미지, 이름, 대학, 성별, 나이, "선택" 버튼)
      - 파트너 로딩 상태: 스켈레톤 행 3개
      - 파트너 빈 상태: "추천 가능한 파트너가 없습니다"
```

### ID 매핑

targets API 응답의 각 아이템은 `id` (케어 대상 레코드 ID)와 `user_id` (유저 ID) 두 필드를 모두 포함:
- 파트너 추천 요청 시: `user_id` 사용
- 무시(dismiss) 요청 시: `id` (targetId) 사용
- 케어 실행 시: `careTargetId`에 `id`를 전달하면 자동으로 `cared` 처리. 검색으로 찾은 비-케어대상 유저는 `careTargetId` 생략.

### 정렬

검색 없이 조회 시: `consecutive_failure_days` 내림차순 → `engagement_score` 내림차순 (API 기본 정렬).

### 검색

`search` 파라미터 사용. 입력 시 페이지네이션 무시, 전체 결과 반환. 케어 대상이 아닌 유저도 검색 가능. 300ms debounce 적용.

### 데이터 갱신 전략

케어 실행 또는 무시 처리 후 React Query `invalidateQueries`로 targets 리스트 refetch. 낙관적 업데이트는 적용하지 않음 (API 응답으로 정확한 상태 확인).

---

## 5. 케어 실행 모달: 2스텝 위저드

파트너 카드의 "선택" 버튼 클릭 시 모달 오픈.

### Step 1: 액션 선택

- 유저 페어 요약 (프로필 이미지, 이름, 대학, 나이)
- 3개 액션 카드:
  - **좋아요** — 단방향 좋아요 전송. 상대 수락 필요.
  - **상호좋아요** — 양방향 매칭 즉시 성립. 수락 불필요.
  - **채팅방 개설** — 매칭 + 채팅방 생성 + 편지 전달. 즉시 대화 가능.
- 선택된 액션: border 하이라이트 + 배경색
- "다음" 버튼으로 Step 2 진행

### Step 2: 편지 작성 + 최종 확인

- 요약 정보: 대상, 파트너, 선택된 액션
- 편지 내용 textarea (최대 500자, 글자 수 카운터, 필수 입력)
- "이전" 버튼으로 Step 1 복귀
- "케어 실행" 버튼으로 API 호출 (로딩 중 버튼 비활성화 + 스피너)

### 모달 동작

- 모달 닫기/취소 시 상태 초기화 (Step 1로 복귀, 입력값 클리어)
- 편지 내용이 입력된 상태에서 닫기 시도 시 별도 확인 없이 바로 닫음 (어드민 도구이므로 간소화)

### 실행 후 처리

- 성공 시: 모달 닫기 + 토스트 알림 + targets 리스트 refetch (React Query invalidate)
- 실패 시: 모달 유지 + 에러 메시지 표시 (API 에러 메시지 그대로 활용)

---

## 6. 무시 처리

사이드패널 유저 헤더의 "무시" 버튼 클릭 시:
- 확인 다이얼로그 표시 ("이 유저를 케어 대상에서 제외하시겠습니까?")
- 확인 시 `POST /admin/care/targets/:targetId/dismiss` 호출
- 성공 시 대상 리스트에서 해당 유저 제거 + 토스트 알림

---

## 7. 케어 이력 페이지

### 화면 구성

```
[필터 바]
  액션 타입 셀렉트 (전체/좋아요/상호좋아요/채팅방 개설)
  대상 유저 ID 검색 (300ms debounce)

[테이블]
  컬럼: 일시 | 대상 유저 | 파트너 | 액션 | 편지 내용 | 실행 어드민
  - 액션: 타입별 색상 뱃지 (좋아요=핑크, 상호좋아요=블루, 채팅방 개설=그린)
  - 편지 내용: ellipsis 처리, hover 시 전체 표시
  - 최신순 정렬
  - 로딩 상태: 스켈레톤 행
  - 빈 상태: "케어 이력이 없습니다"

[페이지네이션]
```

데스크톱 전용 (어드민 도구). 반응형 지원 불필요.

---

## 8. 컴포넌트 구조

```
app/admin/care/
  page.tsx                    # 서버 컴포넌트 → <CareV2 />
  care-v2.tsx                 # 메인 클라이언트 컴포넌트 (상태 관리, 레이아웃)
  components/
    CareStats.tsx             # 상단 요약 통계 카드 (대기/완료/무시)
    CareTargetList.tsx        # 왼쪽 대상 카드 리스트 + 검색 + 페이지네이션
    CareDetailPanel.tsx       # 오른쪽 상세 패널 (유저 정보 + 파트너 추천)
    CareExecuteModal.tsx      # 2스텝 위저드 모달

app/admin/care/logs/
  page.tsx                    # 서버 컴포넌트 → <CareLogsV2 />
  care-logs-v2.tsx            # 이력 테이블 클라이언트 컴포넌트

app/services/admin/care.ts   # API 서비스 모듈
```

---

## 9. 서비스 모듈 (`care.ts`)

```typescript
export const care = {
  getTargets: (params: { page?: number; limit?: number; search?: string }) => ...,
  getPartners: (userId: string, limit?: number) => ...,
  execute: (body: {
    targetUserId: string;
    partnerUserId: string;
    action: 'like' | 'mutual_like' | 'open_chat';
    letterContent: string;
    careTargetId?: string;
  }) => ...,
  dismiss: (targetId: string) => ...,
  getLogs: (params: {
    page?: number;
    limit?: number;
    targetUserId?: string;
    adminUserId?: string;
    action?: string;
  }) => ...,
};
```

`app/services/admin/index.ts`에서 re-export.

---

## 10. 에러 처리

| 상황 | 처리 |
|------|------|
| 같은 성별 매칭 시도 | 모달 에러 메시지 표시 |
| 이미 활성 채팅방 존재 | 모달 에러 메시지 표시 (chatRoomId 포함) |
| 유저 없음 (404) | 모달 에러 메시지 표시 |
| 인증/권한 오류 | 기존 인터셉터가 처리 (리다이렉트) |

---

## 11. 사이드바 등록

`shared/ui/admin/sidebar.tsx`의 `NAV_CATEGORIES` 배열, 리텐션 카테고리에 추가:

```typescript
{
  label: '유저 케어',
  href: '/admin/care',
},
{
  label: '케어 이력',
  href: '/admin/care/logs',
  indent: true,
},
```