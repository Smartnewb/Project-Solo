# V4 스타일 레퍼런스 관리 어드민 메뉴 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** V4 매칭의 이상형 스타일 레퍼런스 이미지를 관리하는 어드민 메뉴를 구현한다.

**Architecture:** 기존 어드민 패턴(service → hooks → v2 page)을 그대로 따른다. `app/services/admin/style-reference.ts`에 API 함수를, `app/admin/hooks/use-style-reference.ts`에 TanStack Query 훅을, `app/admin/style-reference/` 하위에 페이지·컴포넌트를 배치한다. 통합 그리드형 레이아웃으로 상단 필터 드롭다운 + 5열 이미지 그리드 + 페이지네이션으로 구성한다.

**Tech Stack:** Next.js 14 App Router, TypeScript, Material-UI 6, TanStack Query, axiosServer (`/api-proxy` 기반), patchAdminAxios interceptor

---

## File Map

| 상태 | 경로 | 역할 |
|------|------|------|
| Create | `app/admin/style-reference/constants.ts` | 스타일 키워드 17종, 카테고리·성별 레이블 |
| Create | `app/services/admin/style-reference.ts` | API 함수 + 타입 정의 |
| Modify | `app/services/admin/index.ts` | styleReference barrel export + AdminService 객체 |
| Create | `app/admin/hooks/use-style-reference.ts` | TanStack Query 훅 6개 |
| Modify | `app/admin/hooks/index.ts` | 훅 re-export |
| Create | `app/admin/style-reference/components/StyleReferenceStats.tsx` | 통계 카드 바 |
| Create | `app/admin/style-reference/components/StyleReferenceFilters.tsx` | 필터 드롭다운 바 |
| Create | `app/admin/style-reference/components/StyleReferenceCard.tsx` | 개별 이미지 카드 |
| Create | `app/admin/style-reference/components/StyleReferenceGrid.tsx` | 이미지 그리드 (Grid 컨테이너) |
| Create | `app/admin/style-reference/components/StyleReferenceUploadDialog.tsx` | 단건 등록 다이얼로그 |
| Create | `app/admin/style-reference/components/StyleReferenceBulkDialog.tsx` | 일괄 등록 다이얼로그 |
| Create | `app/admin/style-reference/style-reference-v2.tsx` | 메인 페이지 컴포넌트 |
| Create | `app/admin/style-reference/page.tsx` | Next.js 라우트 진입점 |
| Modify | `shared/ui/admin/sidebar.tsx` | 매칭/채팅 카테고리에 메뉴 추가 |

---

## Task 1: 상수 파일

**Files:**
- Create: `app/admin/style-reference/constants.ts`

- [ ] **Step 1: 파일 생성**

```typescript
// app/admin/style-reference/constants.ts

export const STYLE_KEYWORDS = [
  { code: 'warm',         nameKo: '따뜻한',     category: 'VIBE',       emoji: '🌤️' },
  { code: 'chic',         nameKo: '시크한',     category: 'VIBE',       emoji: '🖤' },
  { code: 'bright',       nameKo: '밝은',       category: 'VIBE',       emoji: '☀️' },
  { code: 'calm',         nameKo: '차분한',     category: 'VIBE',       emoji: '🌊' },
  { code: 'cute',         nameKo: '귀여운',     category: 'VIBE',       emoji: '🐰' },
  { code: 'intellectual', nameKo: '지적인',     category: 'VIBE',       emoji: '📚' },
  { code: 'natural',      nameKo: '자연스러운', category: 'VIBE',       emoji: '🌿' },
  { code: 'artistic',     nameKo: '감성적인',   category: 'VIBE',       emoji: '🎨' },
  { code: 'clean',        nameKo: '깔끔한',     category: 'FASHION',    emoji: '✨' },
  { code: 'casual',       nameKo: '캐주얼한',   category: 'FASHION',    emoji: '👕' },
  { code: 'street',       nameKo: '스트릿',     category: 'FASHION',    emoji: '🧢' },
  { code: 'sporty',       nameKo: '스포티한',   category: 'FASHION',    emoji: '🏃' },
  { code: 'formal',       nameKo: '포멀한',     category: 'FASHION',    emoji: '👔' },
  { code: 'vintage',      nameKo: '빈티지한',   category: 'FASHION',    emoji: '📻' },
  { code: 'warm_tone',    nameKo: '따뜻한 톤',  category: 'COLOR_TONE', emoji: '🍂' },
  { code: 'cool_tone',    nameKo: '차가운 톤',  category: 'COLOR_TONE', emoji: '🌑' },
  { code: 'pastel_tone',  nameKo: '파스텔 톤',  category: 'COLOR_TONE', emoji: '🌸' },
] as const;

export type StyleKeywordCode = (typeof STYLE_KEYWORDS)[number]['code'];

export const CATEGORY_LABELS: Record<'VIBE' | 'FASHION' | 'COLOR_TONE', string> = {
  VIBE: '분위기',
  FASHION: '패션',
  COLOR_TONE: '컬러톤',
};

export const GENDER_LABELS: Record<'MALE' | 'FEMALE', string> = {
  MALE: '남성',
  FEMALE: '여성',
};

export function getKeywordMeta(code: string) {
  return STYLE_KEYWORDS.find((k) => k.code === code);
}
```

- [ ] **Step 2: 커밋**

```bash
git add app/admin/style-reference/constants.ts
git commit -m "feat(style-reference): add style keyword constants"
```

---

## Task 2: 서비스 레이어

**Files:**
- Create: `app/services/admin/style-reference.ts`

- [ ] **Step 1: 파일 생성**

```typescript
// app/services/admin/style-reference.ts
import axiosServer from '@/utils/axios';

export interface StyleReferenceItem {
  id: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  tags: string[];
  category: 'VIBE' | 'FASHION' | 'COLOR_TONE';
  gender: 'MALE' | 'FEMALE';
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface StyleReferenceListResponse {
  items: StyleReferenceItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface StyleReferenceStatsItem {
  gender: 'MALE' | 'FEMALE';
  category: 'VIBE' | 'FASHION' | 'COLOR_TONE';
  count: number;
  activeCount: number;
}

export interface StyleReferenceStats {
  stats: StyleReferenceStatsItem[];
}

export interface CreateStyleReferenceRequest {
  imageUrl: string;
  thumbnailUrl?: string;
  tags?: string[];
  category: 'VIBE' | 'FASHION' | 'COLOR_TONE';
  gender: 'MALE' | 'FEMALE';
  sortOrder?: number;
}

export interface BulkCreateResult {
  created: number;
  analyzed: number;
  errors: string[];
}

export interface StyleReferenceListParams {
  page?: number;
  pageSize?: number;
  gender?: 'MALE' | 'FEMALE';
  category?: 'VIBE' | 'FASHION' | 'COLOR_TONE';
}

export const styleReference = {
  getList: async (params: StyleReferenceListParams = {}): Promise<StyleReferenceListResponse> => {
    const response = await axiosServer.get('/v4/admin/style-reference', { params });
    return response.data;
  },

  create: async (data: CreateStyleReferenceRequest): Promise<StyleReferenceItem> => {
    const response = await axiosServer.post('/v4/admin/style-reference', data);
    return response.data;
  },

  bulkCreate: async (items: CreateStyleReferenceRequest[]): Promise<BulkCreateResult> => {
    const response = await axiosServer.post('/v4/admin/style-reference/bulk', { items });
    return response.data;
  },

  deactivate: async (id: string): Promise<{ success: boolean }> => {
    const response = await axiosServer.delete(`/v4/admin/style-reference/${id}`);
    return response.data;
  },

  reactivate: async (id: string): Promise<{ success: boolean }> => {
    const response = await axiosServer.post(`/v4/admin/style-reference/${id}/reactivate`);
    return response.data;
  },

  getStats: async (): Promise<StyleReferenceStats> => {
    const response = await axiosServer.get('/v4/admin/style-reference/stats');
    return response.data;
  },
};
```

- [ ] **Step 2: 커밋**

```bash
git add app/services/admin/style-reference.ts
git commit -m "feat(style-reference): add style reference service layer"
```

---

## Task 3: AdminService barrel export 연결

**Files:**
- Modify: `app/services/admin/index.ts`

- [ ] **Step 1: named export 추가** — 파일 상단 export 블록에 추가

```typescript
// 기존 export 줄들 아래에 추가
export { styleReference } from './style-reference';
export type {
  StyleReferenceItem,
  StyleReferenceListResponse,
  StyleReferenceStats,
  StyleReferenceStatsItem,
  CreateStyleReferenceRequest,
  BulkCreateResult,
  StyleReferenceListParams,
} from './style-reference';
```

- [ ] **Step 2: import 추가** — 파일 하단 import 블록에 추가

```typescript
import { styleReference } from './style-reference';
```

- [ ] **Step 3: AdminService 객체에 추가** — `const AdminService = { ... }` 안에

```typescript
styleReference,
```

- [ ] **Step 4: 커밋**

```bash
git add app/services/admin/index.ts
git commit -m "feat(style-reference): wire styleReference into AdminService barrel"
```

---

## Task 4: React Query 훅

**Files:**
- Create: `app/admin/hooks/use-style-reference.ts`
- Modify: `app/admin/hooks/index.ts`

- [ ] **Step 1: 훅 파일 생성**

```typescript
// app/admin/hooks/use-style-reference.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminService from '@/app/services/admin';
import type { CreateStyleReferenceRequest, StyleReferenceListParams } from '@/app/services/admin';

export const styleReferenceKeys = {
  all: ['admin', 'style-reference'] as const,
  list: (params: StyleReferenceListParams) =>
    [...styleReferenceKeys.all, 'list', params] as const,
  stats: () => [...styleReferenceKeys.all, 'stats'] as const,
};

export function useStyleReferenceList(params: StyleReferenceListParams = {}) {
  return useQuery({
    queryKey: styleReferenceKeys.list(params),
    queryFn: () => AdminService.styleReference.getList(params),
  });
}

export function useStyleReferenceStats() {
  return useQuery({
    queryKey: styleReferenceKeys.stats(),
    queryFn: () => AdminService.styleReference.getStats(),
  });
}

export function useCreateStyleReference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStyleReferenceRequest) =>
      AdminService.styleReference.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: styleReferenceKeys.all });
    },
  });
}

export function useBulkCreateStyleReference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: CreateStyleReferenceRequest[]) =>
      AdminService.styleReference.bulkCreate(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: styleReferenceKeys.all });
    },
  });
}

export function useDeactivateStyleReference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AdminService.styleReference.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: styleReferenceKeys.all });
    },
  });
}

export function useReactivateStyleReference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AdminService.styleReference.reactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: styleReferenceKeys.all });
    },
  });
}
```

- [ ] **Step 2: `app/admin/hooks/index.ts`에 re-export 추가**

기존 마지막 줄 아래에:
```typescript
export * from './use-style-reference';
```

- [ ] **Step 3: 커밋**

```bash
git add app/admin/hooks/use-style-reference.ts app/admin/hooks/index.ts
git commit -m "feat(style-reference): add React Query hooks"
```

---

## Task 5: StyleReferenceStats 컴포넌트

**Files:**
- Create: `app/admin/style-reference/components/StyleReferenceStats.tsx`

- [ ] **Step 1: 파일 생성**

```tsx
// app/admin/style-reference/components/StyleReferenceStats.tsx
'use client';

import { Box, Card, CardContent, Typography, CircularProgress } from '@mui/material';
import { useStyleReferenceStats } from '@/app/admin/hooks';
import { CATEGORY_LABELS, GENDER_LABELS } from '../constants';

export function StyleReferenceStats() {
  const { data, isLoading } = useStyleReferenceStats();

  const total = data?.stats.reduce((acc, s) => acc + s.count, 0) ?? 0;
  const active = data?.stats.reduce((acc, s) => acc + s.activeCount, 0) ?? 0;
  const inactive = total - active;

  const summaryCards = [
    { label: '전체', value: total, color: '#111827' },
    { label: '활성', value: active, color: '#059669' },
    { label: '비활성', value: inactive, color: '#dc2626' },
  ];

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
      {summaryCards.map(({ label, value, color }) => (
        <Card key={label} variant="outlined" sx={{ minWidth: 100 }}>
          <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="h5" fontWeight="bold" sx={{ color }}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
          </CardContent>
        </Card>
      ))}
      {data?.stats.map((s) => (
        <Card
          key={`${s.gender}-${s.category}`}
          variant="outlined"
          sx={{ minWidth: 120 }}
        >
          <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="h6" fontWeight="bold">
              {s.activeCount}
              <Typography component="span" variant="caption" color="text.secondary">
                /{s.count}
              </Typography>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {GENDER_LABELS[s.gender]} · {CATEGORY_LABELS[s.category]}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add app/admin/style-reference/components/StyleReferenceStats.tsx
git commit -m "feat(style-reference): add StyleReferenceStats component"
```

---

## Task 6: StyleReferenceFilters 컴포넌트

**Files:**
- Create: `app/admin/style-reference/components/StyleReferenceFilters.tsx`

- [ ] **Step 1: 파일 생성**

```tsx
// app/admin/style-reference/components/StyleReferenceFilters.tsx
'use client';

import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { CATEGORY_LABELS, GENDER_LABELS } from '../constants';

interface Filters {
  gender: 'ALL' | 'MALE' | 'FEMALE';
  category: 'ALL' | 'VIBE' | 'FASHION' | 'COLOR_TONE';
  status: 'ALL' | 'ACTIVE' | 'INACTIVE';
}

interface StyleReferenceFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function StyleReferenceFilters({ filters, onChange }: StyleReferenceFiltersProps) {
  const handleChange =
    (field: keyof Filters) => (e: SelectChangeEvent) => {
      onChange({ ...filters, [field]: e.target.value });
    };

  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>성별</InputLabel>
        <Select value={filters.gender} label="성별" onChange={handleChange('gender')}>
          <MenuItem value="ALL">전체</MenuItem>
          {(Object.keys(GENDER_LABELS) as Array<keyof typeof GENDER_LABELS>).map((g) => (
            <MenuItem key={g} value={g}>{GENDER_LABELS[g]}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>카테고리</InputLabel>
        <Select value={filters.category} label="카테고리" onChange={handleChange('category')}>
          <MenuItem value="ALL">전체</MenuItem>
          {(Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>).map((c) => (
            <MenuItem key={c} value={c}>{CATEGORY_LABELS[c]}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>상태</InputLabel>
        <Select value={filters.status} label="상태" onChange={handleChange('status')}>
          <MenuItem value="ALL">전체</MenuItem>
          <MenuItem value="ACTIVE">활성</MenuItem>
          <MenuItem value="INACTIVE">비활성</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}

export type { Filters };
```

- [ ] **Step 2: 커밋**

```bash
git add app/admin/style-reference/components/StyleReferenceFilters.tsx
git commit -m "feat(style-reference): add StyleReferenceFilters component"
```

---

## Task 7: StyleReferenceCard 컴포넌트

**Files:**
- Create: `app/admin/style-reference/components/StyleReferenceCard.tsx`

- [ ] **Step 1: 파일 생성**

```tsx
// app/admin/style-reference/components/StyleReferenceCard.tsx
'use client';

import {
  Box,
  Card,
  CardMedia,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import RestoreIcon from '@mui/icons-material/Restore';
import type { StyleReferenceItem } from '@/app/services/admin';
import { getKeywordMeta, CATEGORY_LABELS, GENDER_LABELS } from '../constants';

interface StyleReferenceCardProps {
  item: StyleReferenceItem;
  onDeactivate: (id: string) => void;
  onReactivate: (id: string) => void;
  isLoading?: boolean;
}

export function StyleReferenceCard({
  item,
  onDeactivate,
  onReactivate,
  isLoading,
}: StyleReferenceCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{ opacity: item.isActive ? 1 : 0.5, position: 'relative' }}
    >
      <CardMedia
        component="img"
        height={120}
        image={item.thumbnailUrl ?? item.imageUrl}
        alt={`${GENDER_LABELS[item.gender]} ${CATEGORY_LABELS[item.category]}`}
        sx={{ objectFit: 'cover', bgcolor: 'grey.100' }}
      />

      {!item.isActive && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            bgcolor: 'error.main',
            color: 'white',
            px: 0.75,
            py: 0.25,
            borderRadius: 1,
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          비활성
        </Box>
      )}

      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.75 }}>
          {item.tags.slice(0, 3).map((tag) => {
            const meta = getKeywordMeta(tag);
            return (
              <Chip
                key={tag}
                label={meta ? `${meta.emoji} ${meta.nameKo}` : tag}
                size="small"
                sx={{ fontSize: 10, height: 20 }}
              />
            );
          })}
          {item.tags.length > 3 && (
            <Chip
              label={`+${item.tags.length - 3}`}
              size="small"
              sx={{ fontSize: 10, height: 20 }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary" noWrap>
            {GENDER_LABELS[item.gender]} · {CATEGORY_LABELS[item.category]}
          </Typography>

          {item.isActive ? (
            <Tooltip title="비활성화">
              <span>
                <IconButton
                  size="small"
                  color="default"
                  disabled={isLoading}
                  onClick={() => onDeactivate(item.id)}
                >
                  <VisibilityOffIcon fontSize="inherit" />
                </IconButton>
              </span>
            </Tooltip>
          ) : (
            <Tooltip title="재활성화">
              <span>
                <IconButton
                  size="small"
                  color="primary"
                  disabled={isLoading}
                  onClick={() => onReactivate(item.id)}
                >
                  <RestoreIcon fontSize="inherit" />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add app/admin/style-reference/components/StyleReferenceCard.tsx
git commit -m "feat(style-reference): add StyleReferenceCard component"
```

---

## Task 8: StyleReferenceGrid 컴포넌트

**Files:**
- Create: `app/admin/style-reference/components/StyleReferenceGrid.tsx`

- [ ] **Step 1: 파일 생성**

```tsx
// app/admin/style-reference/components/StyleReferenceGrid.tsx
'use client';

import { Box, CircularProgress, Grid, Pagination, Typography } from '@mui/material';
import type { StyleReferenceItem } from '@/app/services/admin';
import { StyleReferenceCard } from './StyleReferenceCard';

interface StyleReferenceGridProps {
  items: StyleReferenceItem[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  loadingId?: string;
  onPageChange: (page: number) => void;
  onDeactivate: (id: string) => void;
  onReactivate: (id: string) => void;
}

export function StyleReferenceGrid({
  items,
  total,
  page,
  pageSize,
  isLoading,
  loadingId,
  onPageChange,
  onDeactivate,
  onReactivate,
}: StyleReferenceGridProps) {
  const totalPages = Math.ceil(total / pageSize);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (items.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography color="text.secondary">등록된 이미지가 없습니다.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={1.5}>
        {items.map((item) => (
          <Grid item key={item.id} xs={12} sm={6} md={4} lg={3} xl={2.4}>
            <StyleReferenceCard
              item={item}
              onDeactivate={onDeactivate}
              onReactivate={onReactivate}
              isLoading={loadingId === item.id}
            />
          </Grid>
        ))}
      </Grid>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3, gap: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, p) => onPageChange(p)}
            color="primary"
            size="small"
          />
          <Typography variant="caption" color="text.secondary">
            총 {total}개 · 페이지 {page}/{totalPages}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add app/admin/style-reference/components/StyleReferenceGrid.tsx
git commit -m "feat(style-reference): add StyleReferenceGrid component"
```

---

## Task 9: StyleReferenceUploadDialog (단건 등록)

**Files:**
- Create: `app/admin/style-reference/components/StyleReferenceUploadDialog.tsx`

- [ ] **Step 1: 파일 생성**

```tsx
// app/admin/style-reference/components/StyleReferenceUploadDialog.tsx
'use client';

import { useState } from 'react';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import type { CreateStyleReferenceRequest } from '@/app/services/admin';
import { STYLE_KEYWORDS, CATEGORY_LABELS } from '../constants';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStyleReferenceRequest) => Promise<void>;
  isLoading: boolean;
}

const EMPTY: CreateStyleReferenceRequest = {
  imageUrl: '',
  thumbnailUrl: undefined,
  tags: undefined,
  category: 'VIBE',
  gender: 'FEMALE',
  sortOrder: 0,
};

export function StyleReferenceUploadDialog({ open, onClose, onSubmit, isLoading }: Props) {
  const toast = useToast();
  const [form, setForm] = useState<CreateStyleReferenceRequest>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setForm(EMPTY);
    setError(null);
    onClose();
  };

  const toggleTag = (code: string) => {
    const current = form.tags ?? [];
    const next = current.includes(code)
      ? current.filter((t) => t !== code)
      : [...current, code];
    setForm((f) => ({ ...f, tags: next.length > 0 ? next : undefined }));
  };

  const handleSubmit = async () => {
    if (!form.imageUrl.trim()) {
      setError('이미지 URL을 입력해주세요.');
      return;
    }
    setError(null);
    try {
      await onSubmit(form);
      handleClose();
    } catch (e: any) {
      const msg: string = e?.response?.data?.message ?? '등록에 실패했습니다.';
      // Vision AI 분석 실패는 toast + 인라인 에러 병행 노출
      if (msg.includes('분석') || msg.includes('analyze')) {
        toast.error('이미지 분석에 실패했습니다. 태그를 수동으로 입력해주세요.');
      }
      setError(msg);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>이미지 등록</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>

          <TextField
            label="이미지 URL *"
            value={form.imageUrl}
            onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            size="small"
            fullWidth
            placeholder="https://cdn.example.com/..."
          />

          <TextField
            label="썸네일 URL (선택)"
            value={form.thumbnailUrl ?? ''}
            onChange={(e) =>
              setForm((f) => ({ ...f, thumbnailUrl: e.target.value || undefined }))
            }
            size="small"
            fullWidth
          />

          <Box>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              성별 *
            </Typography>
            <ToggleButtonGroup
              exclusive
              value={form.gender}
              onChange={(_, v) => v && setForm((f) => ({ ...f, gender: v }))}
              size="small"
              sx={{ display: 'flex' }}
            >
              <ToggleButton value="FEMALE">여성</ToggleButton>
              <ToggleButton value="MALE">남성</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <FormControl size="small" fullWidth>
            <InputLabel>카테고리 *</InputLabel>
            <Select
              value={form.category}
              label="카테고리 *"
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value as typeof f.category }))
              }
            >
              {(Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>).map((c) => (
                <MenuItem key={c} value={c}>{CATEGORY_LABELS[c]}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            <Typography variant="caption" color="text.secondary">
              스타일 태그 (선택 — 미입력 시 AI 자동 분석)
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.75 }}>
              {STYLE_KEYWORDS.map((kw) => {
                const selected = (form.tags ?? []).includes(kw.code);
                return (
                  <Chip
                    key={kw.code}
                    label={`${kw.emoji} ${kw.nameKo}`}
                    size="small"
                    variant={selected ? 'filled' : 'outlined'}
                    color={selected ? 'primary' : 'default'}
                    onClick={() => toggleTag(kw.code)}
                    clickable
                  />
                );
              })}
            </Box>
            {!form.tags && (
              <Alert severity="info" sx={{ mt: 1, fontSize: 12 }}>
                태그 미선택 시 Gemini Vision AI가 자동으로 분석합니다.
              </Alert>
            )}
          </Box>

          <TextField
            label="정렬 순서"
            type="number"
            value={form.sortOrder ?? 0}
            onChange={(e) =>
              setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))
            }
            size="small"
            sx={{ width: 140 }}
            helperText="낮을수록 먼저 표시"
          />

          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>취소</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? '등록 중...' : '등록'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add app/admin/style-reference/components/StyleReferenceUploadDialog.tsx
git commit -m "feat(style-reference): add StyleReferenceUploadDialog component"
```

---

## Task 10: StyleReferenceBulkDialog (일괄 등록)

**Files:**
- Create: `app/admin/style-reference/components/StyleReferenceBulkDialog.tsx`

- [ ] **Step 1: 파일 생성**

```tsx
// app/admin/style-reference/components/StyleReferenceBulkDialog.tsx
'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import type { BulkCreateResult, CreateStyleReferenceRequest } from '@/app/services/admin';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (items: CreateStyleReferenceRequest[]) => Promise<BulkCreateResult>;
  isLoading: boolean;
}

export function StyleReferenceBulkDialog({ open, onClose, onSubmit, isLoading }: Props) {
  const [jsonText, setJsonText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkCreateResult | null>(null);

  const handleClose = () => {
    setJsonText('');
    setParseError(null);
    setResult(null);
    onClose();
  };

  const handleSubmit = async () => {
    setParseError(null);
    let items: CreateStyleReferenceRequest[];
    try {
      const parsed = JSON.parse(jsonText);
      items = Array.isArray(parsed) ? parsed : parsed.items;
      if (!Array.isArray(items)) throw new Error('items 배열이 필요합니다.');
    } catch (e: any) {
      setParseError(`JSON 파싱 오류: ${e.message}`);
      return;
    }
    try {
      const res = await onSubmit(items);
      setResult(res);
    } catch (e: any) {
      setParseError(e?.response?.data?.message ?? '일괄 등록에 실패했습니다.');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>일괄 등록</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            JSON 배열을 붙여넣으세요. tags 미입력 항목은 AI가 자동 분석합니다.
          </Typography>

          <Typography variant="caption" component="pre" sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1, fontSize: 11 }}>
{`[
  { "imageUrl": "https://...", "category": "VIBE", "gender": "FEMALE" },
  { "imageUrl": "https://...", "tags": ["chic"], "category": "FASHION", "gender": "MALE" }
]`}
          </Typography>

          <TextField
            multiline
            rows={8}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder="JSON 붙여넣기..."
            size="small"
            fullWidth
            disabled={!!result}
          />

          {parseError && <Alert severity="error">{parseError}</Alert>}

          {result && (
            <Alert severity={result.errors.length > 0 ? 'warning' : 'success'}>
              <Typography variant="body2">
                ✓ 등록 완료: {result.created}개
                {result.analyzed > 0 && ` (AI 분석: ${result.analyzed}개)`}
              </Typography>
              {result.errors.length > 0 && (
                <Typography variant="body2" color="error.main">
                  ✗ 실패: {result.errors.length}개
                </Typography>
              )}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{result ? '닫기' : '취소'}</Button>
        {!result && (
          <Button variant="contained" onClick={handleSubmit} disabled={isLoading || !jsonText.trim()}>
            {isLoading ? '등록 중...' : '일괄 등록'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add app/admin/style-reference/components/StyleReferenceBulkDialog.tsx
git commit -m "feat(style-reference): add StyleReferenceBulkDialog component"
```

---

## Task 11: 메인 페이지 컴포넌트 조립

**Files:**
- Create: `app/admin/style-reference/style-reference-v2.tsx`

- [ ] **Step 1: 파일 생성**

```tsx
// app/admin/style-reference/style-reference-v2.tsx
'use client';

import { useEffect, useState } from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadIcon from '@mui/icons-material/Upload';
import { patchAdminAxios } from '@/shared/lib/http/admin-axios-interceptor';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog/confirm-dialog-context';
import {
  useStyleReferenceList,
  useCreateStyleReference,
  useBulkCreateStyleReference,
  useDeactivateStyleReference,
  useReactivateStyleReference,
} from '@/app/admin/hooks';
import type { CreateStyleReferenceRequest, BulkCreateResult } from '@/app/services/admin';
import { StyleReferenceStats } from './components/StyleReferenceStats';
import { StyleReferenceFilters } from './components/StyleReferenceFilters';
import type { Filters } from './components/StyleReferenceFilters';
import { StyleReferenceGrid } from './components/StyleReferenceGrid';
import { StyleReferenceUploadDialog } from './components/StyleReferenceUploadDialog';
import { StyleReferenceBulkDialog } from './components/StyleReferenceBulkDialog';

const PAGE_SIZE = 30;

const DEFAULT_FILTERS: Filters = {
  gender: 'ALL',
  category: 'ALL',
  status: 'ALL',
};

function StyleReferencePageContent() {
  const toast = useToast();
  const confirmAction = useConfirm();

  useEffect(() => {
    const unpatch = patchAdminAxios();
    return () => unpatch();
  }, []);

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | undefined>();

  // filters → API params 변환 (ALL 값은 전달 안 함)
  const listParams = {
    page,
    pageSize: PAGE_SIZE,
    ...(filters.gender !== 'ALL' && { gender: filters.gender }),
    ...(filters.category !== 'ALL' && { category: filters.category }),
  };

  const { data, isLoading, error } = useStyleReferenceList(listParams);
  const createMutation = useCreateStyleReference();
  const bulkMutation = useBulkCreateStyleReference();
  const deactivateMutation = useDeactivateStyleReference();
  const reactivateMutation = useReactivateStyleReference();

  // status 필터는 클라이언트 사이드 (API에 status 파라미터 없음)
  const filteredItems = (data?.items ?? []).filter((item) => {
    if (filters.status === 'ACTIVE') return item.isActive;
    if (filters.status === 'INACTIVE') return !item.isActive;
    return true;
  });

  const handleFiltersChange = (next: Filters) => {
    setFilters(next);
    setPage(1);
  };

  const handleDeactivate = async (id: string) => {
    const ok = await confirmAction({
      title: '이미지 비활성화',
      message: '이 이미지를 비활성화하시겠습니까? 유저에게 보이지 않게 됩니다. 나중에 재활성화할 수 있습니다.',
    });
    if (!ok) return;
    setLoadingId(id);
    try {
      await deactivateMutation.mutateAsync(id);
      toast.success('비활성화되었습니다.');
    } catch {
      toast.error('비활성화에 실패했습니다.');
    } finally {
      setLoadingId(undefined);
    }
  };

  const handleReactivate = async (id: string) => {
    setLoadingId(id);
    try {
      await reactivateMutation.mutateAsync(id);
      toast.success('재활성화되었습니다.');
    } catch {
      toast.error('재활성화에 실패했습니다.');
    } finally {
      setLoadingId(undefined);
    }
  };

  const handleCreate = async (formData: CreateStyleReferenceRequest) => {
    await createMutation.mutateAsync(formData);
    toast.success('이미지가 등록되었습니다.');
  };

  const handleBulkCreate = async (items: CreateStyleReferenceRequest[]): Promise<BulkCreateResult> => {
    const result = await bulkMutation.mutateAsync(items);
    if (result.created > 0) toast.success(`${result.created}개 등록 완료`);
    return result;
  };

  const is403 =
    error &&
    (error as any)?.response?.status === 403;

  return (
    <Box>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          V4 스타일 레퍼런스 관리
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setBulkOpen(true)}
          >
            일괄 등록
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setUploadOpen(true)}
          >
            이미지 등록
          </Button>
        </Box>
      </Box>

      {/* Feature Flag 403 안내 */}
      {is403 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          V4 매칭 기능이 비활성 상태입니다. Feature Flags 메뉴에서{' '}
          <strong>V4_MATCHING_ENABLED</strong>를 활성화해주세요.
        </Alert>
      )}

      {/* 통계 */}
      <StyleReferenceStats />

      {/* 필터 */}
      <StyleReferenceFilters filters={filters} onChange={handleFiltersChange} />

      {/* 그리드
          status 필터(ACTIVE/INACTIVE) 적용 시 페이지 내 클라이언트 필터이므로
          pagination total을 서버 total 대신 filteredItems.length로 교체해
          잘못된 페이지 수 노출을 막는다. */}
      <StyleReferenceGrid
        items={filteredItems}
        total={filters.status !== 'ALL' ? filteredItems.length : (data?.total ?? 0)}
        page={page}
        pageSize={PAGE_SIZE}
        isLoading={isLoading}
        loadingId={loadingId}
        onPageChange={setPage}
        onDeactivate={handleDeactivate}
        onReactivate={handleReactivate}
      />

      {/* 다이얼로그 */}
      <StyleReferenceUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSubmit={handleCreate}
        isLoading={createMutation.isPending}
      />
      <StyleReferenceBulkDialog
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onSubmit={handleBulkCreate}
        isLoading={bulkMutation.isPending}
      />
    </Box>
  );
}

export default function StyleReferenceV2() {
  return <StyleReferencePageContent />;
}
```

- [ ] **Step 2: 커밋**

```bash
git add app/admin/style-reference/style-reference-v2.tsx
git commit -m "feat(style-reference): assemble main page component"
```

---

## Task 12: 라우트 페이지 + 사이드바

**Files:**
- Create: `app/admin/style-reference/page.tsx`
- Modify: `shared/ui/admin/sidebar.tsx`

- [ ] **Step 1: page.tsx 생성**

```typescript
// app/admin/style-reference/page.tsx
import StyleReferenceV2 from './style-reference-v2';

export default function StyleReferencePage() {
  return <StyleReferenceV2 />;
}
```

- [ ] **Step 2: 사이드바에 메뉴 추가**

`shared/ui/admin/sidebar.tsx`의 `💕 매칭/채팅` 카테고리 items 배열에 추가:

```typescript
// 기존 { href: '/admin/ai-chat', label: 'AI 채팅' } 아래에
{ href: '/admin/style-reference', label: 'V4 스타일 관리' },
```

- [ ] **Step 3: 커밋**

```bash
git add app/admin/style-reference/page.tsx shared/ui/admin/sidebar.tsx
git commit -m "feat(style-reference): add page route and sidebar menu entry"
```

---

## Task 13: 동작 확인

- [ ] **Step 1: 개발 서버 확인**

`pnpm dev` 가 실행 중이어야 한다 (hot reload 자동 적용).

- [ ] **Step 2: 사이드바 노출 확인**

브라우저에서 `http://localhost:3000/admin` 접속 → 사이드바 `매칭/채팅` 섹션에 `V4 스타일 관리` 링크 노출 확인.

- [ ] **Step 3: 페이지 로드 확인**

`/admin/style-reference` 접속 → 페이지 타이틀, 통계 카드, 필터 드롭다운, 이미지 그리드 렌더링 확인.

  - 정상 응답 시: 이미지 그리드 표시
  - 403 응답 시: Feature Flag 경고 Alert 표시

- [ ] **Step 4: 이미지 등록 확인**

"이미지 등록" 버튼 클릭 → 다이얼로그 열림 → URL 입력 + 성별/카테고리 선택 → 등록 → 그리드 갱신 확인.

- [ ] **Step 5: 비활성화/재활성화 확인**

카드 우하단 아이콘 클릭 → confirm 다이얼로그(비활성화) 또는 즉시 처리(재활성화) → 카드 opacity 변경 확인.

- [ ] **Step 6: 필터 확인**

성별/카테고리 필터 변경 → 목록 갱신 확인. 상태 필터(활성/비활성) 변경 → 클라이언트 필터링 확인.

- [ ] **Step 7: 최종 커밋**

```bash
git add -A
git commit -m "feat(style-reference): complete V4 style reference admin menu"
```
