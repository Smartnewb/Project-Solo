# 유저 집중 케어 시스템 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 매칭 반복 실패 유저를 어드민이 직접 케어할 수 있는 리텐션 관리 페이지 구현

**Architecture:** 리스트+사이드패널 레이아웃. 왼쪽에 케어 대상 카드 리스트, 오른쪽에 유저 상세+파트너 추천 패널. 케어 실행은 2스텝 위저드 모달. 케어 이력은 별도 페이지에 심플 테이블.

**Tech Stack:** Next.js 14 (App Router) / MUI 6 / TypeScript / axiosServer (BFF proxy) / patchAdminAxios

**Spec:** `docs/superpowers/specs/2026-03-23-user-care-system-design.md`

---

## File Structure

```
CREATE  app/services/admin/care.ts              # API 서비스 모듈
MODIFY  app/services/admin/index.ts             # barrel export에 care 추가
MODIFY  shared/ui/admin/sidebar.tsx             # 사이드바에 유저 케어 메뉴 추가
CREATE  app/admin/care/page.tsx                 # 서버 컴포넌트
CREATE  app/admin/care/care-v2.tsx              # 메인 클라이언트 컴포넌트
CREATE  app/admin/care/components/CareStats.tsx          # 요약 통계 카드
CREATE  app/admin/care/components/CareTargetList.tsx     # 대상 카드 리스트
CREATE  app/admin/care/components/CareDetailPanel.tsx    # 상세+파트너 패널
CREATE  app/admin/care/components/CareExecuteModal.tsx   # 2스텝 위저드 모달
CREATE  app/admin/care/logs/page.tsx            # 이력 서버 컴포넌트
CREATE  app/admin/care/logs/care-logs-v2.tsx    # 이력 테이블 컴포넌트
```

---

## Task 1: API 서비스 모듈 + 사이드바 등록

**Files:**
- Create: `app/services/admin/care.ts`
- Modify: `app/services/admin/index.ts`
- Modify: `shared/ui/admin/sidebar.tsx`

- [ ] **Step 1: care.ts 서비스 모듈 생성**

```typescript
// app/services/admin/care.ts
import axiosServer from '@/utils/axios';
import { getCountryHeader } from './_shared';

export interface CareTarget {
  id: string;
  user_id: string;
  consecutive_failure_days: number;
  last_failure_reason: string | null;
  last_failure_at: string | null;
  engagement_score: number | null;
  gender: string;
  status: 'pending' | 'cared' | 'dismissed';
  created_at: string;
  name: string;
  birthday: string;
  introduction: string | null;
  user_status: string;
  university_name: string;
  profile_image_url: string | null;
}

export interface CareTargetsResponse {
  items: CareTarget[];
  total: number;
  page: number;
  limit: number;
}

export interface CarePartner {
  userId: string;
  name: string;
  age: number;
  gender: string;
  universityName: string;
  profileImageUrl: string | null;
}

export interface CareExecuteRequest {
  targetUserId: string;
  partnerUserId: string;
  action: 'like' | 'mutual_like' | 'open_chat';
  letterContent: string;
  careTargetId?: string;
}

export interface CareExecuteResponse {
  success: boolean;
  connectionId: string;
  matchId: string;
  chatRoomId?: string;
}

export interface CareLog {
  id: string;
  target_user_id: string;
  partner_user_id: string;
  admin_user_id: string;
  action: 'like' | 'mutual_like' | 'open_chat';
  letter_content: string;
  connection_id: string;
  chat_room_id: string | null;
  care_target_id: string | null;
  created_at: string;
  target_name: string;
  partner_name: string;
  admin_name: string;
}

export interface CareLogsResponse {
  items: CareLog[];
  total: number;
  page: number;
  limit: number;
}

export const care = {
  getTargets: async (params: { page?: number; limit?: number; search?: string }) => {
    const country = getCountryHeader();
    const response = await axiosServer.get<CareTargetsResponse>('/admin/care/targets', {
      params,
      headers: { 'X-Country': country },
    });
    return response.data;
  },

  getPartners: async (userId: string, limit: number = 10) => {
    const country = getCountryHeader();
    const response = await axiosServer.get<CarePartner[]>(
      `/admin/care/targets/${userId}/partners`,
      {
        params: { limit },
        headers: { 'X-Country': country },
      },
    );
    return response.data;
  },

  execute: async (body: CareExecuteRequest) => {
    const country = getCountryHeader();
    const response = await axiosServer.post<CareExecuteResponse>(
      '/admin/care/execute',
      body,
      { headers: { 'X-Country': country } },
    );
    return response.data;
  },

  dismiss: async (targetId: string) => {
    const country = getCountryHeader();
    const response = await axiosServer.post<{ success: boolean }>(
      `/admin/care/targets/${targetId}/dismiss`,
      {},
      { headers: { 'X-Country': country } },
    );
    return response.data;
  },

  getLogs: async (params: {
    page?: number;
    limit?: number;
    targetUserId?: string;
    action?: string;
  }) => {
    const country = getCountryHeader();
    const response = await axiosServer.get<CareLogsResponse>('/admin/care/logs', {
      params,
      headers: { 'X-Country': country },
    });
    return response.data;
  },
};
```

- [ ] **Step 2: index.ts에 care 모듈 추가**

`app/services/admin/index.ts`에서:
```typescript
// 추가할 import
export { care } from './care';

// AdminService 객체에 추가
const AdminService = {
  // ... 기존 모듈들
  care,
};
```

- [ ] **Step 3: 사이드바에 메뉴 추가**

`shared/ui/admin/sidebar.tsx`의 `NAV_CATEGORIES` 배열에서 리텐션 카테고리의 `items` 배열 끝에 추가:
```typescript
{ href: '/admin/care', label: '유저 케어' },
{ href: '/admin/care/logs', label: '케어 이력' },
```

- [ ] **Step 4: 커밋**

```bash
git add app/services/admin/care.ts app/services/admin/index.ts shared/ui/admin/sidebar.tsx
git commit -m "feat(care): add care service module and sidebar menu entries"
```

---

## Task 2: 메인 페이지 스캐폴딩 + 통계 카드

**Files:**
- Create: `app/admin/care/page.tsx`
- Create: `app/admin/care/care-v2.tsx`
- Create: `app/admin/care/components/CareStats.tsx`

- [ ] **Step 1: page.tsx 서버 컴포넌트 생성**

```typescript
// app/admin/care/page.tsx
import CareV2 from './care-v2';

export default function CarePage() {
  return <CareV2 />;
}
```

- [ ] **Step 2: CareStats.tsx 생성**

```typescript
// app/admin/care/components/CareStats.tsx
import { Box, Typography, Skeleton } from '@mui/material';

interface CareStatsProps {
  pending: number;
  cared: number;
  dismissed: number;
  loading: boolean;
}

export default function CareStats({ pending, cared, dismissed, loading }: CareStatsProps) {
  const stats = [
    { label: '대기 중', value: pending, color: '#2563eb', bg: '#f0f7ff' },
    { label: '케어 완료', value: cared, color: '#16a34a', bg: '#f0fdf4' },
    { label: '무시', value: dismissed, color: '#d97706', bg: '#fefce8' },
  ];

  return (
    <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
      {stats.map((stat) => (
        <Box
          key={stat.label}
          sx={{
            flex: 1,
            bgcolor: stat.bg,
            p: 1.5,
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          {loading ? (
            <Skeleton variant="text" width={40} height={36} sx={{ mx: 'auto' }} />
          ) : (
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: stat.color }}>
              {stat.value}
            </Typography>
          )}
          <Typography sx={{ fontSize: 11, color: '#6b7280' }}>{stat.label}</Typography>
        </Box>
      ))}
    </Box>
  );
}
```

- [ ] **Step 3: care-v2.tsx 기본 구조 생성 (통계 + 빈 레이아웃)**

```typescript
// app/admin/care/care-v2.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import AdminService from '@/app/services/admin';
import { patchAdminAxios } from '@/shared/lib/http/admin-axios-interceptor';
import type { CareTarget, CareTargetsResponse } from '@/app/services/admin/care';
import CareStats from './components/CareStats';

function CareV2Content() {
  const [targets, setTargets] = useState<CareTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<CareTarget | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unpatch = patchAdminAxios();
    return () => unpatch();
  }, []);

  const fetchTargets = useCallback(async (page: number = 1, search?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params: { page?: number; limit?: number; search?: string } = { page, limit: 20 };
      if (search) {
        params.search = search;
      }
      const data = await AdminService.care.getTargets(params);
      setTargets(data.items);
      setPagination({ page: data.page, limit: data.limit, total: data.total });
    } catch (err: any) {
      setError(err.response?.data?.message || '케어 대상 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTargets();
  }, [fetchTargets]);

  // 통계: targets 리스트에서 status별 카운트 파생
  const stats = {
    pending: targets.filter((t) => t.status === 'pending').length,
    cared: targets.filter((t) => t.status === 'cared').length,
    dismissed: targets.filter((t) => t.status === 'dismissed').length,
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        유저 집중 케어
      </Typography>
      <CareStats
        pending={stats.pending}
        cared={stats.cared}
        dismissed={stats.dismissed}
        loading={loading}
      />
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Box sx={{ width: 320, flexShrink: 0 }}>
          <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
            대상 리스트 (Task 3에서 구현)
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
            상세 패널 (Task 4에서 구현)
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default function CareV2() {
  return <CareV2Content />;
}
```

- [ ] **Step 4: 개발 서버에서 /admin/care 페이지 확인**

Run: `pnpm dev` 후 브라우저에서 `/admin/care` 접속. 통계 카드와 빈 레이아웃이 표시되는지 확인.

- [ ] **Step 5: 커밋**

```bash
git add app/admin/care/
git commit -m "feat(care): scaffold main page with stats cards"
```

---

## Task 3: 케어 대상 카드 리스트

**Files:**
- Create: `app/admin/care/components/CareTargetList.tsx`
- Modify: `app/admin/care/care-v2.tsx`

- [ ] **Step 1: CareTargetList.tsx 생성**

```typescript
// app/admin/care/components/CareTargetList.tsx
import { Box, Typography, TextField, InputAdornment, Skeleton, Pagination } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import type { CareTarget } from '@/app/services/admin/care';

interface CareTargetListProps {
  targets: CareTarget[];
  selectedTarget: CareTarget | null;
  onSelect: (target: CareTarget) => void;
  loading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  pagination: { page: number; limit: number; total: number };
  onPageChange: (page: number) => void;
}

function getAge(birthday: string): number {
  const today = new Date();
  const birth = new Date(birthday);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function FailureBadge({ days }: { days: number }) {
  const color = days >= 7 ? '#ef4444' : days >= 5 ? '#f59e0b' : '#6b7280';
  const bg = days >= 7 ? '#fef2f2' : days >= 5 ? '#fef9c3' : '#f3f4f6';
  return (
    <Box
      component="span"
      sx={{
        bgcolor: bg,
        color,
        px: 1,
        py: 0.25,
        borderRadius: 3,
        fontSize: 10,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {days}일 실패
    </Box>
  );
}

export default function CareTargetList({
  targets,
  selectedTarget,
  onSelect,
  loading,
  searchTerm,
  onSearchChange,
  pagination,
  onPageChange,
}: CareTargetListProps) {
  // 빈 상태
  if (!loading && targets.length === 0) {
    return (
      <Box>
        <TextField
          size="small"
          fullWidth
          placeholder="이름 또는 유저 ID 검색..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: '#9ca3af' }} />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 1.5 }}
        />
        <Typography
          color="text.secondary"
          sx={{ textAlign: 'center', mt: 4, fontSize: 13 }}
        >
          {searchTerm ? '검색 결과가 없습니다' : '현재 케어가 필요한 유저가 없습니다'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* 검색 */}
      <TextField
        size="small"
        fullWidth
        placeholder="이름 또는 유저 ID 검색..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 18, color: '#9ca3af' }} />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 1.5 }}
      />

      {/* 로딩 스켈레톤 */}
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      ) : (
        <>
          {/* 카드 리스트 */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {targets.map((target) => {
              const isSelected = selectedTarget?.id === target.id;
              const age = getAge(target.birthday);
              const genderLabel = target.gender === 'MALE' ? '남' : '여';
              return (
                <Box
                  key={target.id}
                  onClick={() => onSelect(target)}
                  sx={{
                    p: 1.5,
                    border: isSelected ? '2px solid #2563eb' : '1px solid #e5e7eb',
                    borderRadius: 2,
                    bgcolor: isSelected ? '#f8faff' : 'white',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: isSelected ? '#f8faff' : '#f9fafb' },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Box
                        component="img"
                        src={target.profile_image_url || '/default-avatar.png'}
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          bgcolor: '#e5e7eb',
                          flexShrink: 0,
                        }}
                      />
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{target.name}</Typography>
                        <Typography sx={{ fontSize: 11, color: '#666' }}>
                          {target.university_name} / {genderLabel} / {age}세
                        </Typography>
                      </Box>
                    </Box>
                    <FailureBadge days={target.consecutive_failure_days} />
                  </Box>
                  <Typography sx={{ mt: 0.5, fontSize: 10, color: '#9ca3af' }}>
                    마지막 실패: {target.last_failure_at ? new Date(target.last_failure_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                    {target.last_failure_reason && ` · 사유: ${target.last_failure_reason}`}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* 페이지네이션 */}
          {!searchTerm && pagination.total > pagination.limit && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.5 }}>
              <Pagination
                count={Math.ceil(pagination.total / pagination.limit)}
                page={pagination.page}
                onChange={(_, page) => onPageChange(page)}
                size="small"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
```

- [ ] **Step 2: care-v2.tsx에 CareTargetList 통합 + debounce 검색**

care-v2.tsx 수정:
- 플레이스홀더 "대상 리스트 (Task 3에서 구현)" 영역을 `<CareTargetList>` 컴포넌트로 교체
- debounce 검색 추가: `searchTerm` 변경 시 300ms 후 `fetchTargets` 호출

```typescript
// care-v2.tsx에 추가할 import
import CareTargetList from './components/CareTargetList';

// 추가할 state & effect
const [searchInput, setSearchInput] = useState('');

// debounce 검색
useEffect(() => {
  const timer = setTimeout(() => {
    setSearchTerm(searchInput);
    fetchTargets(1, searchInput || undefined);
  }, 300);
  return () => clearTimeout(timer);
}, [searchInput]);

// CareTargetList 컴포넌트 렌더
<CareTargetList
  targets={targets}
  selectedTarget={selectedTarget}
  onSelect={setSelectedTarget}
  loading={loading}
  searchTerm={searchInput}
  onSearchChange={setSearchInput}
  pagination={pagination}
  onPageChange={(page) => fetchTargets(page, searchTerm || undefined)}
/>
```

- [ ] **Step 3: 개발 서버에서 대상 리스트 확인**

브라우저에서 `/admin/care` 접속. 카드 리스트, 검색, 페이지네이션이 동작하는지 확인.

- [ ] **Step 4: 커밋**

```bash
git add app/admin/care/components/CareTargetList.tsx app/admin/care/care-v2.tsx
git commit -m "feat(care): add care target card list with search and pagination"
```

---

## Task 4: 상세 패널 (유저 정보 + 파트너 추천)

**Files:**
- Create: `app/admin/care/components/CareDetailPanel.tsx`
- Modify: `app/admin/care/care-v2.tsx`

- [ ] **Step 1: CareDetailPanel.tsx 생성**

```typescript
// app/admin/care/components/CareDetailPanel.tsx
import { Box, Typography, Button, Skeleton } from '@mui/material';
import type { CareTarget, CarePartner } from '@/app/services/admin/care';

interface CareDetailPanelProps {
  target: CareTarget | null;
  partners: CarePartner[];
  partnersLoading: boolean;
  onDismiss: () => void;
  onSelectPartner: (partner: CarePartner) => void;
  dismissLoading: boolean;
}

function getAge(birthday: string): number {
  const today = new Date();
  const birth = new Date(birthday);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function CareDetailPanel({
  target,
  partners,
  partnersLoading,
  onDismiss,
  onSelectPartner,
  dismissLoading,
}: CareDetailPanelProps) {
  if (!target) {
    return (
      <Box
        sx={{
          flex: 1,
          border: '1px solid #e5e7eb',
          borderRadius: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 300,
        }}
      >
        <Typography color="text.secondary" sx={{ fontSize: 13 }}>
          좌측에서 유저를 선택하세요
        </Typography>
      </Box>
    );
  }

  const age = getAge(target.birthday);
  const genderLabel = target.gender === 'MALE' ? '남' : '여';

  return (
    <Box
      sx={{
        flex: 1,
        border: '1px solid #e5e7eb',
        borderRadius: 3,
        p: 2,
        bgcolor: '#fafafa',
      }}
    >
      {/* 유저 헤더 */}
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          alignItems: 'center',
          mb: 2,
          pb: 1.5,
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <Box
          component="img"
          src={target.profile_image_url || '/default-avatar.png'}
          sx={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', bgcolor: '#e5e7eb', flexShrink: 0 }}
        />
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{target.name}</Typography>
          <Typography sx={{ fontSize: 12, color: '#666' }}>
            {target.university_name} / {genderLabel} / {age}세
          </Typography>
          {target.introduction && (
            <Typography sx={{ fontSize: 12, color: '#9ca3af', mt: 0.25 }}>
              {target.introduction}
            </Typography>
          )}
        </Box>
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          onClick={onDismiss}
          disabled={dismissLoading}
          sx={{ fontSize: 11, color: '#6b7280', borderColor: '#e5e7eb' }}
        >
          무시
        </Button>
      </Box>

      {/* 실패 정보 배너 */}
      <Box
        sx={{
          bgcolor: '#fef2f2',
          p: 1.5,
          borderRadius: 2,
          mb: 2,
          display: 'flex',
          gap: 2,
          fontSize: 12,
        }}
      >
        <Box>
          <Typography component="span" sx={{ fontWeight: 600, color: '#dc2626', fontSize: 12 }}>
            연속 실패:
          </Typography>{' '}
          {target.consecutive_failure_days}일
        </Box>
        <Box>
          <Typography component="span" sx={{ fontWeight: 600, color: '#dc2626', fontSize: 12 }}>
            마지막 실패:
          </Typography>{' '}
          {target.last_failure_at
            ? new Date(target.last_failure_at).toLocaleDateString('ko-KR', {
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '-'}
        </Box>
        {target.last_failure_reason && (
          <Box>
            <Typography component="span" sx={{ fontWeight: 600, color: '#dc2626', fontSize: 12 }}>
              사유:
            </Typography>{' '}
            {target.last_failure_reason}
          </Box>
        )}
      </Box>

      {/* 추천 파트너 */}
      <Typography sx={{ fontWeight: 600, fontSize: 13, mb: 1 }}>추천 파트너</Typography>

      {partnersLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={48} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      ) : partners.length === 0 ? (
        <Typography color="text.secondary" sx={{ fontSize: 12, mt: 1 }}>
          추천 가능한 파트너가 없습니다
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {partners.map((partner) => (
            <Box
              key={partner.userId}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 1.25,
                bgcolor: 'white',
                borderRadius: 2,
                border: '1px solid #e5e7eb',
              }}
            >
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Box
                  component="img"
                  src={partner.profileImageUrl || '/default-avatar.png'}
                  sx={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', bgcolor: '#e5e7eb', flexShrink: 0 }}
                />
                <Box>
                  <Typography component="span" sx={{ fontWeight: 500, fontSize: 13 }}>
                    {partner.name}
                  </Typography>
                  <Typography component="span" sx={{ fontSize: 11, color: '#666', ml: 0.5 }}>
                    · {partner.universityName} · {partner.gender === 'MALE' ? '남' : '여'} · {partner.age}세
                  </Typography>
                </Box>
              </Box>
              <Button
                size="small"
                variant="contained"
                onClick={() => onSelectPartner(partner)}
                sx={{ fontSize: 11, minWidth: 'auto', px: 1.5 }}
              >
                선택
              </Button>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
```

- [ ] **Step 2: care-v2.tsx에 CareDetailPanel 통합**

care-v2.tsx 수정:
- 파트너 목록 state 추가: `partners`, `partnersLoading`
- `selectedTarget` 변경 시 파트너 API 호출
- 무시 처리 핸들러 추가
- 모달용 state 추가 (Task 5에서 사용): `selectedPartner`, `modalOpen`

```typescript
// 추가 import
import CareDetailPanel from './components/CareDetailPanel';
import type { CarePartner } from '@/app/services/admin/care';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog';
import { useToast } from '@/shared/ui/admin/toast';

// 추가 state
const [partners, setPartners] = useState<CarePartner[]>([]);
const [partnersLoading, setPartnersLoading] = useState(false);
const [selectedPartner, setSelectedPartner] = useState<CarePartner | null>(null);
const [modalOpen, setModalOpen] = useState(false);
const [dismissLoading, setDismissLoading] = useState(false);
const confirm = useConfirm();
const toast = useToast();

// 파트너 fetch
useEffect(() => {
  if (!selectedTarget) {
    setPartners([]);
    return;
  }
  const fetchPartners = async () => {
    try {
      setPartnersLoading(true);
      const data = await AdminService.care.getPartners(selectedTarget.user_id);
      setPartners(data);
    } catch (err: any) {
      setPartners([]);
    } finally {
      setPartnersLoading(false);
    }
  };
  fetchPartners();
}, [selectedTarget]);

// 무시 핸들러
const handleDismiss = async () => {
  if (!selectedTarget) return;
  const ok = await confirm('이 유저를 케어 대상에서 제외하시겠습니까?');
  if (!ok) return;
  try {
    setDismissLoading(true);
    await AdminService.care.dismiss(selectedTarget.id);
    toast.success('케어 대상에서 제외되었습니다.');
    setSelectedTarget(null);
    fetchTargets(pagination.page, searchTerm || undefined);
  } catch (err: any) {
    toast.error(err.response?.data?.message || '무시 처리에 실패했습니다.');
  } finally {
    setDismissLoading(false);
  }
};

// 파트너 선택 → 모달 오픈
const handleSelectPartner = (partner: CarePartner) => {
  setSelectedPartner(partner);
  setModalOpen(true);
};

// 렌더에서 플레이스홀더를 CareDetailPanel로 교체
<CareDetailPanel
  target={selectedTarget}
  partners={partners}
  partnersLoading={partnersLoading}
  onDismiss={handleDismiss}
  onSelectPartner={handleSelectPartner}
  dismissLoading={dismissLoading}
/>
```

- [ ] **Step 3: 개발 서버에서 패널 동작 확인**

유저 카드 클릭 시 오른쪽 패널에 유저 정보와 파트너 리스트가 표시되는지 확인. 무시 버튼 동작 확인.

- [ ] **Step 4: 커밋**

```bash
git add app/admin/care/components/CareDetailPanel.tsx app/admin/care/care-v2.tsx
git commit -m "feat(care): add detail panel with partner recommendations and dismiss"
```

---

## Task 5: 케어 실행 2스텝 위저드 모달

**Files:**
- Create: `app/admin/care/components/CareExecuteModal.tsx`
- Modify: `app/admin/care/care-v2.tsx`

- [ ] **Step 1: CareExecuteModal.tsx 생성**

```typescript
// app/admin/care/components/CareExecuteModal.tsx
import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { CareTarget, CarePartner } from '@/app/services/admin/care';

type CareAction = 'like' | 'mutual_like' | 'open_chat';

interface CareExecuteModalProps {
  open: boolean;
  onClose: () => void;
  target: CareTarget | null;
  partner: CarePartner | null;
  onExecute: (action: CareAction, letterContent: string) => Promise<void>;
  executing: boolean;
  executeError: string | null;
}

function getAge(birthday: string): number {
  const today = new Date();
  const birth = new Date(birthday);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const ACTION_OPTIONS: { value: CareAction; label: string; description: string }[] = [
  { value: 'like', label: '좋아요', description: '단방향 좋아요 전송. 상대 수락 필요.' },
  { value: 'mutual_like', label: '상호좋아요', description: '양방향 매칭 즉시 성립. 수락 불필요.' },
  { value: 'open_chat', label: '채팅방 개설', description: '매칭 + 채팅방 생성 + 편지 전달. 즉시 대화 가능.' },
];

export default function CareExecuteModal({
  open,
  onClose,
  target,
  partner,
  onExecute,
  executing,
  executeError,
}: CareExecuteModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedAction, setSelectedAction] = useState<CareAction | null>(null);
  const [letterContent, setLetterContent] = useState('');

  const handleClose = () => {
    setStep(1);
    setSelectedAction(null);
    setLetterContent('');
    onClose();
  };

  const handleNext = () => {
    if (selectedAction) setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleExecute = async () => {
    if (!selectedAction) return;
    await onExecute(selectedAction, letterContent);
  };

  if (!target || !partner) return null;

  const targetAge = getAge(target.birthday);
  const targetGender = target.gender === 'MALE' ? '남' : '여';
  const partnerGender = partner.gender === 'MALE' ? '남' : '여';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        케어 실행
        <IconButton size="small" onClick={handleClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {/* 스텝 인디케이터 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: step >= 1 ? (step > 1 ? '#16a34a' : '#2563eb') : '#e5e7eb',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {step > 1 ? '\u2713' : '1'}
          </Box>
          <Box sx={{ height: 2, flex: 1, bgcolor: step > 1 ? '#2563eb' : '#e5e7eb' }} />
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: step === 2 ? '#2563eb' : '#e5e7eb',
              color: step === 2 ? 'white' : '#9ca3af',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            2
          </Box>
        </Box>

        {/* 유저 페어 */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mb: 2,
            p: 1.5,
            bgcolor: '#f8fafc',
            borderRadius: 2,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Box
              component="img"
              src={target.profile_image_url || '/default-avatar.png'}
              sx={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', bgcolor: '#e5e7eb', mx: 'auto', mb: 0.5 }}
            />
            <Typography sx={{ fontSize: 11, fontWeight: 600 }}>{target.name}</Typography>
            <Typography sx={{ fontSize: 9, color: '#666' }}>{target.university_name} / {targetAge}세</Typography>
          </Box>
          <Typography sx={{ fontSize: 20, color: '#cbd5e1' }}>&rarr;</Typography>
          <Box sx={{ textAlign: 'center' }}>
            <Box
              component="img"
              src={partner.profileImageUrl || '/default-avatar.png'}
              sx={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', bgcolor: '#e5e7eb', mx: 'auto', mb: 0.5 }}
            />
            <Typography sx={{ fontSize: 11, fontWeight: 600 }}>{partner.name}</Typography>
            <Typography sx={{ fontSize: 9, color: '#666' }}>{partner.universityName} / {partner.age}세</Typography>
          </Box>
        </Box>

        {step === 1 ? (
          <>
            <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 1 }}>액션 선택</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {ACTION_OPTIONS.map((option) => (
                <Box
                  key={option.value}
                  onClick={() => setSelectedAction(option.value)}
                  sx={{
                    p: 1.5,
                    border: selectedAction === option.value ? '2px solid #2563eb' : '1px solid #e5e7eb',
                    borderRadius: 2,
                    bgcolor: selectedAction === option.value ? '#eff6ff' : 'white',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: selectedAction === option.value ? '#eff6ff' : '#f9fafb' },
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: 13,
                      color: selectedAction === option.value ? '#2563eb' : 'inherit',
                    }}
                  >
                    {option.label}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: '#6b7280' }}>{option.description}</Typography>
                </Box>
              ))}
            </Box>
          </>
        ) : (
          <>
            {/* Step 2: 요약 + 편지 */}
            <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 2, mb: 2, fontSize: 12 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ color: '#6b7280', fontSize: 12 }}>대상:</Typography>
                <Typography sx={{ fontWeight: 600, fontSize: 12 }}>{target.name} ({target.university_name}, {targetAge}세)</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ color: '#6b7280', fontSize: 12 }}>파트너:</Typography>
                <Typography sx={{ fontWeight: 600, fontSize: 12 }}>{partner.name} ({partner.universityName}, {partner.age}세)</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ color: '#6b7280', fontSize: 12 }}>액션:</Typography>
                <Typography sx={{ fontWeight: 600, fontSize: 12, color: '#2563eb' }}>
                  {ACTION_OPTIONS.find((o) => o.value === selectedAction)?.label}
                </Typography>
              </Box>
            </Box>

            <Typography sx={{ fontWeight: 600, fontSize: 12, mb: 0.75 }}>
              편지 내용 <Typography component="span" sx={{ color: '#9ca3af', fontWeight: 400, fontSize: 12 }}>(최대 500자)</Typography>
            </Typography>
            <TextField
              multiline
              rows={3}
              fullWidth
              value={letterContent}
              onChange={(e) => {
                if (e.target.value.length <= 500) setLetterContent(e.target.value);
              }}
              placeholder="편지 내용을 입력하세요..."
              size="small"
            />
            <Typography sx={{ textAlign: 'right', fontSize: 10, color: '#9ca3af', mt: 0.5 }}>
              {letterContent.length} / 500
            </Typography>

            {executeError && (
              <Typography color="error" sx={{ fontSize: 12, mt: 1 }}>
                {executeError}
              </Typography>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {step === 1 ? (
          <>
            <Button onClick={handleClose} color="inherit">취소</Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!selectedAction}
            >
              다음
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleBack} color="inherit" disabled={executing}>
              이전
            </Button>
            <Button
              variant="contained"
              onClick={handleExecute}
              disabled={executing || !letterContent.trim()}
              startIcon={executing ? <CircularProgress size={16} /> : null}
            >
              케어 실행
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
```

- [ ] **Step 2: care-v2.tsx에 모달 통합**

```typescript
// 추가 import
import CareExecuteModal from './components/CareExecuteModal';

// 추가 state
const [executing, setExecuting] = useState(false);
const [executeError, setExecuteError] = useState<string | null>(null);

// 실행 핸들러
const handleExecute = async (action: 'like' | 'mutual_like' | 'open_chat', letterContent: string) => {
  if (!selectedTarget || !selectedPartner) return;
  try {
    setExecuting(true);
    setExecuteError(null);
    await AdminService.care.execute({
      targetUserId: selectedTarget.user_id,
      partnerUserId: selectedPartner.userId,
      action,
      letterContent,
      careTargetId: selectedTarget.status === 'pending' ? selectedTarget.id : undefined,
    });
    toast.success('케어가 실행되었습니다.');
    setModalOpen(false);
    setSelectedPartner(null);
    setSelectedTarget(null);
    fetchTargets(pagination.page, searchTerm || undefined);
  } catch (err: any) {
    setExecuteError(err.response?.data?.message || '케어 실행에 실패했습니다.');
  } finally {
    setExecuting(false);
  }
};

// 모달 닫기 핸들러
const handleModalClose = () => {
  setModalOpen(false);
  setSelectedPartner(null);
  setExecuteError(null);
};

// 렌더에 모달 추가
<CareExecuteModal
  open={modalOpen}
  onClose={handleModalClose}
  target={selectedTarget}
  partner={selectedPartner}
  onExecute={handleExecute}
  executing={executing}
  executeError={executeError}
/>
```

- [ ] **Step 3: 전체 워크플로우 테스트**

파트너 "선택" → 모달 Step 1(액션 선택) → Step 2(편지 작성) → "케어 실행" 전체 플로우 확인.

- [ ] **Step 4: 커밋**

```bash
git add app/admin/care/components/CareExecuteModal.tsx app/admin/care/care-v2.tsx
git commit -m "feat(care): add 2-step wizard modal for care execution"
```

---

## Task 6: 케어 이력 페이지

**Files:**
- Create: `app/admin/care/logs/page.tsx`
- Create: `app/admin/care/logs/care-logs-v2.tsx`

- [ ] **Step 1: page.tsx 서버 컴포넌트 생성**

```typescript
// app/admin/care/logs/page.tsx
import CareLogsV2 from './care-logs-v2';

export default function CareLogsPage() {
  return <CareLogsV2 />;
}
```

- [ ] **Step 2: care-logs-v2.tsx 생성**

```typescript
// app/admin/care/logs/care-logs-v2.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Skeleton,
  Tooltip,
  TablePagination,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AdminService from '@/app/services/admin';
import { patchAdminAxios } from '@/shared/lib/http/admin-axios-interceptor';
import type { CareLog } from '@/app/services/admin/care';

const ACTION_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  like: { label: '좋아요', color: '#db2777', bg: '#fce7f3' },
  mutual_like: { label: '상호좋아요', color: '#2563eb', bg: '#dbeafe' },
  open_chat: { label: '채팅방 개설', color: '#059669', bg: '#d1fae5' },
};

function CareLogsContent() {
  const [logs, setLogs] = useState<CareLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [actionFilter, setActionFilter] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unpatch = patchAdminAxios();
    return () => unpatch();
  }, []);

  const fetchLogs = useCallback(
    async (page: number = 1) => {
      try {
        setLoading(true);
        setError(null);
        const params: { page: number; limit: number; action?: string; targetUserId?: string } = {
          page,
          limit: 20,
        };
        if (actionFilter) params.action = actionFilter;
        if (searchTerm) params.targetUserId = searchTerm;
        const data = await AdminService.care.getLogs(params);
        setLogs(data.items);
        setPagination({ page: data.page, limit: data.limit, total: data.total });
      } catch (err: any) {
        setError(err.response?.data?.message || '케어 이력을 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    },
    [actionFilter, searchTerm],
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // debounce 검색
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        케어 이력
      </Typography>

      {/* 필터 바 */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>액션 타입</InputLabel>
          <Select
            value={actionFilter}
            label="액션 타입"
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="like">좋아요</MenuItem>
            <MenuItem value="mutual_like">상호좋아요</MenuItem>
            <MenuItem value="open_chat">채팅방 개설</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          placeholder="대상 유저 ID 검색..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: '#9ca3af' }} />
              </InputAdornment>
            ),
          }}
          sx={{ flex: 1 }}
        />
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {/* 테이블 */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f9fafb' }}>
              <TableCell sx={{ fontWeight: 600 }}>일시</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>대상 유저</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>파트너</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>액션</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>편지 내용</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>실행 어드민</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              [1, 2, 3].map((i) => (
                <TableRow key={i}>
                  {[1, 2, 3, 4, 5, 6].map((j) => (
                    <TableCell key={j}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                    케어 이력이 없습니다
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const actionInfo = ACTION_LABELS[log.action] || {
                  label: log.action,
                  color: '#666',
                  bg: '#f3f4f6',
                };
                return (
                  <TableRow key={log.id} hover>
                    <TableCell sx={{ fontSize: 12, color: '#666', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleDateString('ko-KR', {
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500, fontSize: 13 }}>{log.target_name}</TableCell>
                    <TableCell sx={{ fontWeight: 500, fontSize: 13 }}>{log.partner_name}</TableCell>
                    <TableCell>
                      <Chip
                        label={actionInfo.label}
                        size="small"
                        sx={{
                          bgcolor: actionInfo.bg,
                          color: actionInfo.color,
                          fontWeight: 600,
                          fontSize: 10,
                          height: 22,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, fontSize: 12, color: '#666' }}>
                      <Tooltip title={log.letter_content} arrow>
                        <Typography
                          noWrap
                          sx={{ fontSize: 12, color: '#666', maxWidth: 200 }}
                        >
                          {log.letter_content}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, color: '#666' }}>{log.admin_name}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 페이지네이션 */}
      {!loading && logs.length > 0 && (
        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page - 1}
          onPageChange={(_, newPage) => fetchLogs(newPage + 1)}
          rowsPerPage={pagination.limit}
          rowsPerPageOptions={[20]}
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 총 ${count}건`}
        />
      )}
    </Box>
  );
}

export default function CareLogsV2() {
  return <CareLogsContent />;
}
```

- [ ] **Step 3: 개발 서버에서 /admin/care/logs 페이지 확인**

브라우저에서 `/admin/care/logs` 접속. 테이블, 필터, 페이지네이션 동작 확인.

- [ ] **Step 4: 커밋**

```bash
git add app/admin/care/logs/
git commit -m "feat(care): add care logs page with filters and pagination"
```

---

## Task 7: 최종 검증 + 정리

- [ ] **Step 1: 전체 워크플로우 E2E 확인**

1. `/admin/care` 접속 → 통계 카드 표시
2. 대상 리스트 → 유저 클릭 → 상세 패널 표시
3. 파트너 추천 → "선택" → 모달 Step 1 → Step 2 → 케어 실행
4. 무시 버튼 → 확인 → 대상에서 제거
5. 검색 → debounce 동작
6. `/admin/care/logs` → 이력 테이블 + 필터

- [ ] **Step 2: 사이드바 네비게이션 확인**

리텐션 카테고리에서 "유저 케어", "케어 이력" 메뉴 클릭 시 올바른 페이지로 이동하는지 확인.

- [ ] **Step 3: 빌드 확인**

Run: `pnpm build`
Expected: 빌드 성공, 타입 에러 없음

- [ ] **Step 4: 최종 커밋**

수정사항이 있다면 커밋.

```bash
git add -A
git commit -m "feat(care): complete user care system admin pages"
```