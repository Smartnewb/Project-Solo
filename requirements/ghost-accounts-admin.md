# Ghost Account 관리 어드민 페이지 요구사항

## Overview
탈퇴 여성 유저 프로필을 복제한 Ghost 계정을 관리하고, 비활성 남성 유저에게 좋아요를 발송하는 시스템의 어드민 UI.

## Page Structure
- **URL**: `/admin/ghost-accounts`
- **구조**: 탭 기반 단일 페이지 (4개 탭)
- **사이드바 위치**: 리텐션 카테고리

## Tabs

### 1. 대시보드 (Dashboard)
- 상태별 카운트 카드: ACTIVE / INACTIVE / EXHAUSTED
- API: `GET /admin/v1/ghost-accounts/stats`

### 2. Ghost 풀 (Pool Management)
- Ghost 계정 목록 테이블
- 상태 필터 (ACTIVE / INACTIVE / EXHAUSTED / 전체)
- 상태 변경 기능 (ACTIVE ↔ INACTIVE ↔ EXHAUSTED)
- 페이지네이션
- API: `GET /admin/v1/ghost-accounts`, `PATCH /admin/v1/ghost-accounts/:id`

### 3. 후보 생성 (Eligible Sources)
- eligible-sources 목록 테이블 (탈퇴 30일+ 여성)
- 컬럼: 이름, 나이, 등급, MBTI, 소개, 탈퇴일, 이미지 수, 경과일
- 개별 [생성] 버튼 + 체크박스 일괄 생성
- API: `GET /admin/v1/ghost-accounts/eligible-sources`, `POST /admin/v1/ghost-accounts`

### 4. 후보 승인 (Candidate Approval)
- PENDING 후보 목록 테이블
- 컬럼: Ghost 프로필, 타겟 유저, 상태, 주차, 생성일
- 체크박스 일괄 선택 → 승인/취소 버튼
- API: `GET /admin/v1/ghost-accounts/candidates`, `POST .../approve`, `POST .../cancel`

## UX Decisions
| 결정 | 선택 |
|------|------|
| 페이지 구조 | 탭 기반 단일 페이지 |
| 후보 승인 | 체크박스 일괄 선택 → 승인/취소 버튼 |
| 계정 생성 | 테이블에서 직접 생성 (개별+일괄) |
| 사이드바 | 리텐션 카테고리 |

## Technical Constraints
- BFF 프록시: `/api/admin-proxy/admin/v1/ghost-accounts/*`
- UI: MUI + Tailwind (기존 패턴 준수)
- 시스템 이모지 코드 사용 금지
- 참고 페이지: dormant-likes (파묘 좋아요)
