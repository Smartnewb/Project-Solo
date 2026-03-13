# Phase 2: Dashboard & KPI Report V2 Rewrite

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `dashboard` and `kpi-report` admin pages as native v2 pages — using `useAdminSession()` for auth, React Query hooks for data fetching, and feature-flag gating for safe rollout.

**Architecture:** V2 pages live alongside legacy extractions. A server-component `page.tsx` checks `getRouteMode()` and renders the appropriate variant. V2 pages call `patchAdminAxios()` so existing self-fetching sub-components work unchanged. React Query hooks wrap existing service functions — no new HTTP client needed for hooks.

**Tech Stack:** Next.js 14 App Router, React Query (`@tanstack/react-query`), Vercel Edge Config feature flags, existing axios service layer.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `shared/lib/http/admin-fetch.ts` | CREATE | Thin `fetch`-based BFF client (infrastructure for future) |
| `shared/lib/http/index.ts` | MODIFY | Re-export adminFetch utilities |
| `app/admin/dashboard/hooks.ts` | CREATE | `useDashboardSummary()` React Query hook |
| `app/admin/kpi-report/hooks.ts` | CREATE | `useKpiReportLatest()`, `useKpiReportByWeek()`, `useGenerateKpiReport()` |
| `app/admin/dashboard/dashboard-legacy.tsx` | CREATE | Extract current `MainDashboardContent` + `LegacyPageAdapter` |
| `app/admin/dashboard/dashboard-v2.tsx` | CREATE | V2 dashboard using React Query + `patchAdminAxios()` |
| `app/admin/dashboard/page.tsx` | MODIFY | Server component with feature-flag routing |
| `app/admin/kpi-report/kpi-report-legacy.tsx` | CREATE | Extract current `KpiReportPageContent` + `LegacyPageAdapter` |
| `app/admin/kpi-report/kpi-report-v2.tsx` | CREATE | V2 KPI report using React Query + `patchAdminAxios()` |
| `app/admin/kpi-report/page.tsx` | MODIFY | Server component with feature-flag routing |

**Files NOT changed:** All dashboard sub-components (`WeeklyTrend`, `GemSystemFunnel`, `UserEngagementStats`, `ActionableInsights`, `RevenueOverview`, `ActionRequired`, `TodayMetrics`, `QuickAccess`), all KPI sub-components, service files, types, `AdminShell`, `LegacyPageAdapter`.

---

## Chunk 1: Infrastructure & Hooks

### Task 1: Create `adminFetch` BFF client

**Files:**
- Create: `shared/lib/http/admin-fetch.ts`
- Modify: `shared/lib/http/index.ts`

- [ ] **Step 1: Create `admin-fetch.ts`**

Reference: `shared/lib/http/admin-axios-interceptor.ts` uses `/api/admin-proxy` as base path.

```typescript
// shared/lib/http/admin-fetch.ts

const PROXY_BASE = '/api/admin-proxy';

export class AdminApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'AdminApiError';
  }
}

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  options?: { body?: unknown; params?: Record<string, string> },
): Promise<T> {
  let url = `${PROXY_BASE}${path}`;

  if (options?.params) {
    const search = new URLSearchParams(
      Object.entries(options.params).filter(([, v]) => v != null),
    ).toString();
    if (search) url += `?${search}`;
  }

  const res = await fetch(url, {
    method,
    headers: options?.body
      ? { 'Content-Type': 'application/json' }
      : undefined,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new AdminApiError(
      body?.message ?? `Request failed: ${res.status}`,
      res.status,
      body,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export function adminGet<T>(
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  return request<T>('GET', path, { params });
}

export function adminPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('POST', path, { body });
}

export function adminPut<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('PUT', path, { body });
}

export function adminPatch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('PATCH', path, { body });
}

export function adminDelete<T>(path: string): Promise<T> {
  return request<T>('DELETE', path);
}
```

- [ ] **Step 2: Update `shared/lib/http/index.ts` to re-export**

```typescript
// shared/lib/http/index.ts
export {
  adminGet,
  adminPost,
  adminPut,
  adminPatch,
  adminDelete,
  AdminApiError,
} from './admin-fetch';
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors in `shared/lib/http/`

- [ ] **Step 4: Commit**

```bash
git add shared/lib/http/admin-fetch.ts shared/lib/http/index.ts
git commit -m "feat(phase-2): add adminFetch BFF client utility"
```

---

### Task 2: Dashboard React Query hook

**Files:**
- Create: `app/admin/dashboard/hooks.ts`

**Context:**
- `AdminShell` wraps pages in `AdminSessionContext.Provider` → `AdminQueryProvider`
- `useAdminSession()` returns `{ session, isLoading, error, changeCountry, logout }`
- `session.selectedCountry` used as query key segment for country-scoped refetch
- `dashboardService.getSummary()` calls `GET /admin/dashboard/summary` via `axiosServer`
- `AdminQueryProvider` has `staleTime: 60_000`, `retry: 1`, `refetchOnWindowFocus: false`

- [ ] **Step 1: Create `hooks.ts`**

```typescript
// app/admin/dashboard/hooks.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/app/services/dashboard';
import { useAdminSession } from '@/shared/contexts/admin-session-context';
import type { DashboardSummaryResponse } from './types';

/**
 * Fetches dashboard summary with auto-refresh every 60s.
 * Includes selectedCountry in query key so changing country
 * triggers an automatic refetch via React Query.
 */
export function useDashboardSummary() {
  const { session } = useAdminSession();

  return useQuery<DashboardSummaryResponse>({
    queryKey: ['dashboard', 'summary', session?.selectedCountry],
    queryFn: () => dashboardService.getSummary(),
    refetchInterval: 60_000,
  });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors in `app/admin/dashboard/hooks.ts`

- [ ] **Step 3: Commit**

```bash
git add app/admin/dashboard/hooks.ts
git commit -m "feat(phase-2): add useDashboardSummary React Query hook"
```

---

### Task 3: KPI Report React Query hooks

**Files:**
- Create: `app/admin/kpi-report/hooks.ts`

**Context:**
- `AdminService.kpiReport.getLatest()` → `GET /admin/kpi-report/latest` (timeout 60s)
- `AdminService.kpiReport.getByWeek(year, week)` → `GET /admin/kpi-report/{year}/{week}` (timeout 60s)
- `AdminService.kpiReport.generate(year, week)` → `POST /admin/kpi-report/generate` (timeout 60s)
- On 404, service throws axios error with `error.response.status === 404`
- Generate should invalidate latest + set specific week cache

- [ ] **Step 1: Create `hooks.ts`**

```typescript
// app/admin/kpi-report/hooks.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminService from '@/app/services/admin';
import type { KpiReport } from './types';

/**
 * Fetch the most recent KPI report.
 * Used on initial page load to determine which week to display.
 */
export function useKpiReportLatest(options?: { enabled?: boolean }) {
  return useQuery<KpiReport>({
    queryKey: ['kpi-report', 'latest'],
    queryFn: () => AdminService.kpiReport.getLatest(),
    enabled: options?.enabled,
    retry: (failureCount, error) => {
      // Don't retry 404 (no report exists yet)
      if ((error as any)?.response?.status === 404) return false;
      return failureCount < 1;
    },
  });
}

/**
 * Fetch a KPI report for a specific year/week.
 * Used after the user navigates to a different week.
 */
export function useKpiReportByWeek(
  year: number,
  week: number,
  options?: { enabled?: boolean },
) {
  return useQuery<KpiReport>({
    queryKey: ['kpi-report', year, week],
    queryFn: () => AdminService.kpiReport.getByWeek(year, week),
    enabled: options?.enabled ?? true,
    retry: (failureCount, error) => {
      if ((error as any)?.response?.status === 404) return false;
      return failureCount < 1;
    },
  });
}

/**
 * Generate a KPI report for a given year/week.
 * On success: caches the result and invalidates the latest query.
 */
export function useGenerateKpiReport() {
  const queryClient = useQueryClient();

  return useMutation<KpiReport, Error, { year: number; week: number }>({
    mutationFn: ({ year, week }) =>
      AdminService.kpiReport.generate(year, week),
    onSuccess: (data, { year, week }) => {
      queryClient.setQueryData(['kpi-report', year, week], data);
      queryClient.invalidateQueries({ queryKey: ['kpi-report', 'latest'] });
    },
  });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors in `app/admin/kpi-report/hooks.ts`

- [ ] **Step 3: Commit**

```bash
git add app/admin/kpi-report/hooks.ts
git commit -m "feat(phase-2): add KPI report React Query hooks"
```

---

## Chunk 2: Page Rewrites & Routing

### Task 4: Dashboard page — extract legacy, create v2, add routing

**Files:**
- Create: `app/admin/dashboard/dashboard-legacy.tsx`
- Create: `app/admin/dashboard/dashboard-v2.tsx`
- Modify: `app/admin/dashboard/page.tsx`

**Context:**
- Current `page.tsx`: `'use client'`, exports `MainDashboard` wrapping `MainDashboardContent` in `LegacyPageAdapter`
- V2 removes: localStorage auth check, manual fetch + setInterval, authChecking/authError state
- V2 adds: `useDashboardSummary()` hook, `patchAdminAxios()` for sub-component compat
- Sub-components unchanged: `WeeklyTrend`, `GemSystemFunnel`, `UserEngagementStats`, `ActionableInsights` self-fetch via axios

#### Step Group A: Extract legacy

- [ ] **Step 1: Create `dashboard-legacy.tsx`**

Copy existing `MainDashboardContent` + `LegacyPageAdapter` wrapper verbatim from current `page.tsx`.

```typescript
// app/admin/dashboard/dashboard-legacy.tsx
'use client';

import { Alert, Box, CircularProgress, Grid, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { dashboardService } from '@/app/services/dashboard';
import ActionableInsights from './components/ActionableInsights';
import ActionRequired from './components/ActionRequired';
import GemSystemFunnel from './components/GemSystemFunnel';
import QuickAccess from './components/QuickAccess';
import RevenueOverview from './components/RevenueOverview';
import TodayMetrics from './components/TodayMetrics';
import UserEngagementStats from './components/UserEngagementStats';
import WeeklyTrend from './components/WeeklyTrend';
import { DashboardSummaryResponse } from './types';
import { LegacyPageAdapter } from '@/shared/ui/admin/legacy-page-adapter';

function MainDashboardContent() {
	const router = useRouter();
	const [authChecking, setAuthChecking] = useState(true);
	const [authError, setAuthError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		const checkAuth = async () => {
			try {
				setAuthChecking(true);
				const token = localStorage.getItem('accessToken');
				const isAdmin = localStorage.getItem('isAdmin');

				if (!token || isAdmin !== 'true') {
					setAuthError('관리자 권한이 없습니다. 로그인 페이지로 이동합니다.');
					setTimeout(() => router.push('/'), 2000);
					return;
				}

				setAuthError(null);
			} catch (error) {
				console.error('인증 확인 오류:', error);
				setAuthError('인증 확인 중 오류가 발생했습니다.');
			} finally {
				setAuthChecking(false);
			}
		};

		checkAuth();
	}, [router]);

	const fetchDashboardData = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const summaryRes = await dashboardService.getSummary();
			setSummary(summaryRes);
		} catch (err) {
			console.error('대시보드 데이터 로딩 실패:', err);
			setError('대시보드 데이터를 불러오는데 실패했습니다.');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		if (authChecking || authError) return;

		fetchDashboardData();

		const interval = setInterval(fetchDashboardData, 60000);
		return () => clearInterval(interval);
	}, [authChecking, authError, fetchDashboardData]);

	if (authChecking) {
		return (
			<Box className="flex items-center justify-center h-screen">
				<CircularProgress />
				<Typography variant="h6" sx={{ ml: 2 }}>
					관리자 권한 확인 중...
				</Typography>
			</Box>
		);
	}

	if (authError) {
		return (
			<Box className="flex flex-col items-center justify-center h-screen">
				<Alert severity="error" sx={{ mb: 2 }}>
					{authError}
				</Alert>
				<Typography variant="body1">잠시 후 로그인 페이지로 이동합니다...</Typography>
			</Box>
		);
	}

	const today = new Date();
	const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

	return (
		<Box className="min-h-screen bg-gray-50">
			<Box className="bg-white shadow-sm border-b border-gray-200">
				<Box className="max-w-7xl mx-auto px-4 py-4">
					<Box className="flex items-center justify-between">
						<Box>
							<Typography variant="h5" fontWeight="bold" color="textPrimary">
								메인 대시보드
							</Typography>
							<Typography variant="body2" color="textSecondary">
								오늘 해야 할 일을 한눈에 확인하세요
							</Typography>
						</Box>
						<Typography variant="body2" color="textSecondary">
							{formattedDate}
						</Typography>
					</Box>
				</Box>
			</Box>

			<Box className="max-w-7xl mx-auto px-4 py-6 space-y-4">
				{error && (
					<Alert severity="error" onClose={() => setError(null)}>
						{error}
					</Alert>
				)}

				<ActionRequired actionItems={summary?.actionItems ?? null} loading={loading} />

				<Grid container spacing={3}>
					<Grid item xs={12} md={7}>
						<TodayMetrics kpi={summary?.kpi ?? null} loading={loading} />
						<Box sx={{ mt: 3 }}>
							<WeeklyTrend compact />
						</Box>
					</Grid>
					<Grid item xs={12} md={5}>
						<RevenueOverview kpi={summary?.kpi ?? null} loading={loading} />
					</Grid>
				</Grid>

				<GemSystemFunnel />

				<UserEngagementStats />

				<ActionableInsights />

				<QuickAccess />
			</Box>
		</Box>
	);
}

export default function DashboardLegacy() {
  return (
    <LegacyPageAdapter>
      <MainDashboardContent />
    </LegacyPageAdapter>
  );
}
```

- [ ] **Step 2: Verify legacy extraction compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

#### Step Group B: Create v2

- [ ] **Step 3: Create `dashboard-v2.tsx`**

Key differences from legacy:
- No `LegacyPageAdapter` wrapper (AdminShell provides context)
- No localStorage auth check (AdminShell handles auth via cookie session)
- `useDashboardSummary()` replaces manual fetch + setInterval
- Calls `patchAdminAxios()` in useEffect so sub-components work

```typescript
// app/admin/dashboard/dashboard-v2.tsx
'use client';

import { useEffect } from 'react';
import { Alert, Box, Grid, Typography } from '@mui/material';
import { patchAdminAxios } from '@/shared/lib/http/admin-axios-interceptor';
import { useDashboardSummary } from './hooks';
import ActionableInsights from './components/ActionableInsights';
import ActionRequired from './components/ActionRequired';
import GemSystemFunnel from './components/GemSystemFunnel';
import QuickAccess from './components/QuickAccess';
import RevenueOverview from './components/RevenueOverview';
import TodayMetrics from './components/TodayMetrics';
import UserEngagementStats from './components/UserEngagementStats';
import WeeklyTrend from './components/WeeklyTrend';

export default function DashboardV2() {
  // Patch axios instances so sub-components that self-fetch
  // (WeeklyTrend, GemSystemFunnel, etc.) route through BFF proxy
  useEffect(() => {
    const unpatch = patchAdminAxios();
    return unpatch;
  }, []);

  const { data: summary, isLoading, error } = useDashboardSummary();

  const today = new Date();
  const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  return (
    <Box className="min-h-screen bg-gray-50">
      <Box className="bg-white shadow-sm border-b border-gray-200">
        <Box className="max-w-7xl mx-auto px-4 py-4">
          <Box className="flex items-center justify-between">
            <Box>
              <Typography variant="h5" fontWeight="bold" color="textPrimary">
                메인 대시보드
              </Typography>
              <Typography variant="body2" color="textSecondary">
                오늘 해야 할 일을 한눈에 확인하세요
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary">
              {formattedDate}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {error && (
          <Alert severity="error">
            대시보드 데이터를 불러오는데 실패했습니다.
          </Alert>
        )}

        <ActionRequired actionItems={summary?.actionItems ?? null} loading={isLoading} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <TodayMetrics kpi={summary?.kpi ?? null} loading={isLoading} />
            <Box sx={{ mt: 3 }}>
              <WeeklyTrend compact />
            </Box>
          </Grid>
          <Grid item xs={12} md={5}>
            <RevenueOverview kpi={summary?.kpi ?? null} loading={isLoading} />
          </Grid>
        </Grid>

        <GemSystemFunnel />
        <UserEngagementStats />
        <ActionableInsights />
        <QuickAccess />
      </Box>
    </Box>
  );
}
```

- [ ] **Step 4: Verify v2 compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

#### Step Group C: Server component router

- [ ] **Step 5: Rewrite `page.tsx` as server component with feature-flag routing**

Replace entire file. Remove `'use client'` directive. Import `getRouteMode` (server-side).

```typescript
// app/admin/dashboard/page.tsx
import { getRouteMode } from '@/shared/feature-flags';
import DashboardLegacy from './dashboard-legacy';
import DashboardV2 from './dashboard-v2';

export default async function DashboardPage() {
  const mode = await getRouteMode('dashboard');

  if (mode === 'v2') {
    return <DashboardV2 />;
  }

  return <DashboardLegacy />;
}
```

- [ ] **Step 6: Type-check the full dashboard directory**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add app/admin/dashboard/dashboard-legacy.tsx app/admin/dashboard/dashboard-v2.tsx app/admin/dashboard/page.tsx
git commit -m "feat(phase-2): split dashboard into legacy/v2 with feature-flag routing"
```

---

### Task 5: KPI Report page — extract legacy, create v2, add routing

**Files:**
- Create: `app/admin/kpi-report/kpi-report-legacy.tsx`
- Create: `app/admin/kpi-report/kpi-report-v2.tsx`
- Modify: `app/admin/kpi-report/page.tsx`

**Context:**
- Current `page.tsx`: `'use client'`, exports `KpiReportPage` wrapping `KpiReportPageContent` in `LegacyPageAdapter`
- V2 removes: localStorage auth check, manual fetchReport/fetchLatest callbacks
- V2 adds: `useKpiReportLatest()` for initial load, `useKpiReportByWeek()` for navigation, `useGenerateKpiReport()` mutation
- All 6 KPI sub-components are pure presentational (props only) — no changes needed

#### Step Group A: Extract legacy

- [ ] **Step 1: Create `kpi-report-legacy.tsx`**

Copy existing `KpiReportPageContent` + `LegacyPageAdapter` wrapper verbatim from current `page.tsx`.

```typescript
// app/admin/kpi-report/kpi-report-legacy.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import AdminService from '@/app/services/admin';
import WeekSelector from './components/WeekSelector';
import KpiSummaryCards from './components/KpiSummaryCards';
import KpiTrendChart from './components/KpiTrendChart';
import KpiCategoryTable from './components/KpiCategoryTable';
import CountryBreakdown from './components/CountryBreakdown';
import TrendSummaryTable from './components/TrendSummaryTable';
import {
	KpiReport,
	CATEGORIES,
	CATEGORY_CONFIG,
	getCurrentWeekInfo,
	getWeekLabel,
} from './types';
import { LegacyPageAdapter } from '@/shared/ui/admin/legacy-page-adapter';

function KpiReportPageContent() {
	const router = useRouter();
	const [authChecking, setAuthChecking] = useState(true);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [report, setReport] = useState<KpiReport | null>(null);
	const [year, setYear] = useState(() => getCurrentWeekInfo().year);
	const [week, setWeek] = useState(() => getCurrentWeekInfo().week);
	const [generating, setGenerating] = useState(false);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		const checkAuth = async () => {
			try {
				setAuthChecking(true);
				const token = localStorage.getItem('accessToken');
				const isAdmin = localStorage.getItem('isAdmin');

				if (!token || isAdmin !== 'true') {
					setTimeout(() => router.push('/'), 2000);
					return;
				}
			} catch (err) {
				console.error('인증 확인 오류:', err);
			} finally {
				setAuthChecking(false);
			}
		};

		checkAuth();
	}, [router]);

	const fetchReport = useCallback(async (targetYear: number, targetWeek: number) => {
		try {
			setLoading(true);
			setError(null);
			const data = await AdminService.kpiReport.getByWeek(targetYear, targetWeek);
			setReport(data);
		} catch (err: any) {
			if (err?.response?.status === 404) {
				setReport(null);
				setError('해당 주차의 리포트가 아직 생성되지 않았습니다. "리포트 생성" 버튼을 눌러주세요.');
			} else {
				console.error('KPI 리포트 조회 실패:', err);
				setError('KPI 리포트를 불러오는데 실패했습니다.');
			}
		} finally {
			setLoading(false);
		}
	}, []);

	const fetchLatest = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await AdminService.kpiReport.getLatest();
			setReport(data);
			if (data?.year && data?.week) {
				setYear(data.year);
				setWeek(data.week);
			}
		} catch (err: any) {
			if (err?.response?.status === 404) {
				setReport(null);
				setError('아직 생성된 리포트가 없습니다. "리포트 생성" 버튼을 눌러주세요.');
			} else {
				console.error('최신 KPI 리포트 조회 실패:', err);
				setError('KPI 리포트를 불러오는데 실패했습니다.');
			}
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		if (authChecking) return;
		fetchLatest();
	}, [authChecking, fetchLatest]);

	const handleWeekChange = (newYear: number, newWeek: number) => {
		setYear(newYear);
		setWeek(newWeek);
		fetchReport(newYear, newWeek);
	};

	const handleGenerate = async () => {
		try {
			setGenerating(true);
			setError(null);
			const data = await AdminService.kpiReport.generate(year, week);
			setReport(data);
		} catch (err) {
			console.error('KPI 리포트 생성 실패:', err);
			setError('KPI 리포트 생성에 실패했습니다.');
		} finally {
			setGenerating(false);
		}
	};

	if (authChecking) {
		return (
			<Box className="flex items-center justify-center h-screen">
				<CircularProgress />
				<Typography variant="h6" sx={{ ml: 2 }}>
					관리자 권한 확인 중...
				</Typography>
			</Box>
		);
	}

	return (
		<Box className="min-h-screen bg-gray-50">
			<Box className="bg-white shadow-sm border-b border-gray-200">
				<Box className="max-w-7xl mx-auto px-4 py-4">
					<Box className="flex items-center justify-between">
						<Box>
							<Typography variant="h5" fontWeight="bold" color="textPrimary">
								KPI 주간 리포트
							</Typography>
							<Typography variant="body2" color="textSecondary">
								Mixpanel 기반 주간 핵심 지표 분석
							</Typography>
						</Box>
					</Box>
				</Box>
			</Box>

			<Box className="max-w-7xl mx-auto px-4 py-6 space-y-4">
				<WeekSelector
					year={year}
					week={week}
					weekLabel={report?.weekLabel || getWeekLabel(year, week)}
					onWeekChange={handleWeekChange}
					onGenerate={handleGenerate}
					generating={generating}
				/>

				{error && (
					<Alert severity={report ? 'warning' : 'info'} onClose={() => setError(null)}>
						{error}
					</Alert>
				)}

				<KpiSummaryCards kpis={report?.kpis ?? []} loading={loading} />

				<KpiTrendChart
					trends={report?.trends ?? []}
					kpis={report?.kpis ?? []}
					loading={loading}
				/>

				{CATEGORIES.map((category) => (
					<KpiCategoryTable
						key={category}
						category={category}
						categoryLabel={CATEGORY_CONFIG[category].label}
						kpis={report?.kpis ?? []}
						loading={loading}
						defaultExpanded={category === 'acquisition'}
					/>
				))}

				<CountryBreakdown
					countryBreakdown={report?.countryBreakdown}
					loading={loading}
				/>

				<TrendSummaryTable
					trends={report?.trends ?? []}
					loading={loading}
				/>
			</Box>
		</Box>
	);
}

export default function KpiReportLegacy() {
  return (
    <LegacyPageAdapter>
      <KpiReportPageContent />
    </LegacyPageAdapter>
  );
}
```

- [ ] **Step 2: Verify legacy extraction compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

#### Step Group B: Create v2

- [ ] **Step 3: Create `kpi-report-v2.tsx`**

Key differences from legacy:
- No `LegacyPageAdapter` wrapper
- No localStorage auth check
- `useKpiReportLatest()` for initial load (sets year/week from response)
- `useKpiReportByWeek()` after user navigates weeks
- `useGenerateKpiReport()` mutation for generate button
- Calls `patchAdminAxios()` for sub-component compat (KPI sub-components are pure props, but patchAdminAxios is cheap insurance)

```typescript
// app/admin/kpi-report/kpi-report-v2.tsx
'use client';

import { useState, useEffect } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import { patchAdminAxios } from '@/shared/lib/http/admin-axios-interceptor';
import {
  useKpiReportLatest,
  useKpiReportByWeek,
  useGenerateKpiReport,
} from './hooks';
import WeekSelector from './components/WeekSelector';
import KpiSummaryCards from './components/KpiSummaryCards';
import KpiTrendChart from './components/KpiTrendChart';
import KpiCategoryTable from './components/KpiCategoryTable';
import CountryBreakdown from './components/CountryBreakdown';
import TrendSummaryTable from './components/TrendSummaryTable';
import {
  CATEGORIES,
  CATEGORY_CONFIG,
  getCurrentWeekInfo,
  getWeekLabel,
} from './types';

export default function KpiReportV2() {
  useEffect(() => {
    const unpatch = patchAdminAxios();
    return unpatch;
  }, []);

  const [year, setYear] = useState(() => getCurrentWeekInfo().year);
  const [week, setWeek] = useState(() => getCurrentWeekInfo().week);
  const [hasNavigated, setHasNavigated] = useState(false);

  // Initial load: fetch latest report
  const latestQuery = useKpiReportLatest({ enabled: !hasNavigated });

  // After navigation: fetch specific week
  const weekQuery = useKpiReportByWeek(year, week, {
    enabled: hasNavigated,
  });

  const generateMutation = useGenerateKpiReport();

  // Set year/week from latest response on first load
  useEffect(() => {
    if (latestQuery.data?.year && latestQuery.data?.week) {
      setYear(latestQuery.data.year);
      setWeek(latestQuery.data.week);
    }
  }, [latestQuery.data]);

  // Derive display state from active query
  const report = hasNavigated ? weekQuery.data : latestQuery.data;
  const loading = hasNavigated ? weekQuery.isLoading : latestQuery.isLoading;
  const queryError = hasNavigated ? weekQuery.error : latestQuery.error;

  const handleWeekChange = (newYear: number, newWeek: number) => {
    setYear(newYear);
    setWeek(newWeek);
    setHasNavigated(true);
  };

  const handleGenerate = async () => {
    try {
      await generateMutation.mutateAsync({ year, week });
    } catch {
      // Error handled via generateMutation.error
    }
  };

  // Build user-facing error message
  let errorMessage: string | null = null;
  if (queryError) {
    const status = (queryError as any)?.response?.status;
    if (status === 404) {
      errorMessage = report
        ? '해당 주차의 리포트가 아직 생성되지 않았습니다.'
        : '해당 주차의 리포트가 아직 생성되지 않았습니다. "리포트 생성" 버튼을 눌러주세요.';
    } else {
      errorMessage = 'KPI 리포트를 불러오는데 실패했습니다.';
    }
  }
  if (generateMutation.error) {
    errorMessage = 'KPI 리포트 생성에 실패했습니다.';
  }

  return (
    <Box className="min-h-screen bg-gray-50">
      <Box className="bg-white shadow-sm border-b border-gray-200">
        <Box className="max-w-7xl mx-auto px-4 py-4">
          <Box className="flex items-center justify-between">
            <Box>
              <Typography variant="h5" fontWeight="bold" color="textPrimary">
                KPI 주간 리포트
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Mixpanel 기반 주간 핵심 지표 분석
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        <WeekSelector
          year={year}
          week={week}
          weekLabel={report?.weekLabel || getWeekLabel(year, week)}
          onWeekChange={handleWeekChange}
          onGenerate={handleGenerate}
          generating={generateMutation.isPending}
        />

        {errorMessage && (
          <Alert severity={report ? 'warning' : 'info'}>
            {errorMessage}
          </Alert>
        )}

        <KpiSummaryCards kpis={report?.kpis ?? []} loading={loading} />

        <KpiTrendChart
          trends={report?.trends ?? []}
          kpis={report?.kpis ?? []}
          loading={loading}
        />

        {CATEGORIES.map((category) => (
          <KpiCategoryTable
            key={category}
            category={category}
            categoryLabel={CATEGORY_CONFIG[category].label}
            kpis={report?.kpis ?? []}
            loading={loading}
            defaultExpanded={category === 'acquisition'}
          />
        ))}

        <CountryBreakdown
          countryBreakdown={report?.countryBreakdown}
          loading={loading}
        />

        <TrendSummaryTable
          trends={report?.trends ?? []}
          loading={loading}
        />
      </Box>
    </Box>
  );
}
```

- [ ] **Step 4: Verify v2 compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

#### Step Group C: Server component router

- [ ] **Step 5: Rewrite `page.tsx` as server component with feature-flag routing**

```typescript
// app/admin/kpi-report/page.tsx
import { getRouteMode } from '@/shared/feature-flags';
import KpiReportLegacy from './kpi-report-legacy';
import KpiReportV2 from './kpi-report-v2';

export default async function KpiReportPage() {
  const mode = await getRouteMode('kpi-report');

  if (mode === 'v2') {
    return <KpiReportV2 />;
  }

  return <KpiReportLegacy />;
}
```

- [ ] **Step 6: Type-check the full kpi-report directory**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add app/admin/kpi-report/kpi-report-legacy.tsx app/admin/kpi-report/kpi-report-v2.tsx app/admin/kpi-report/page.tsx
git commit -m "feat(phase-2): split kpi-report into legacy/v2 with feature-flag routing"
```

---

### Task 6: Full build verification

- [ ] **Step 1: Run production build**

Run: `npm run build`
Expected: Build succeeds with zero errors

- [ ] **Step 2: Fix any build errors**

If build fails, fix issues and re-run until clean.

- [ ] **Step 3: Verify feature-flag defaults**

Check `shared/feature-flags/index.ts`:
- `getRouteMode('dashboard')` defaults to `'legacy-adapted'` → `DashboardLegacy` renders
- `getRouteMode('kpi-report')` defaults to `'legacy-adapted'` → `KpiReportLegacy` renders

This means **no behavior change** unless Edge Config is explicitly set to `'v2'`.

Edge Config keys for activation:
- `admin_route_mode_dashboard` → set to `'v2'`
- `admin_route_mode_kpi-report` → set to `'v2'`

- [ ] **Step 4: Push to branch**

```bash
git push origin claude/sharp-jepsen
```

**Do NOT create a PR.** All phases (1-6) must complete before PR.

---

## Task Dependencies

```
Task 1 (adminFetch)  ─── standalone infrastructure
Task 2 (dashboard hook) ─── Task 4 (dashboard pages)
Task 3 (kpi hooks) ─────── Task 5 (kpi pages)
                                │
                           Task 6 (build verification)
```

Tasks 2 + 3 can run in parallel. Tasks 4 + 5 can run in parallel.

## Feature Flag Rollout

| Flag Key | Default | To Enable V2 |
|----------|---------|--------------|
| `admin_route_mode_dashboard` | `legacy-adapted` | Set to `v2` in Edge Config |
| `admin_route_mode_kpi-report` | `legacy-adapted` | Set to `v2` in Edge Config |

Rollback: remove the Edge Config key or set back to `legacy-adapted`.

## Critical Reference Files

| File | Why |
|------|-----|
| `shared/lib/http/admin-axios-interceptor.ts` | BFF proxy pattern (`/api/admin-proxy`) |
| `shared/feature-flags/index.ts` | `getRouteMode()` function |
| `shared/contexts/admin-session-context.tsx` | `useAdminSession()` hook |
| `shared/providers/query-provider.tsx` | `AdminQueryProvider` React Query setup |
| `shared/ui/admin/admin-shell.tsx` | Provider hierarchy: Session → QueryProvider → content |
| `app/services/dashboard.ts` | Dashboard API endpoint paths |
| `app/services/admin.ts:4440-4488` | KPI report API endpoint paths |
| `app/admin/dashboard/types.ts` | Dashboard response type definitions |
| `app/admin/kpi-report/types.ts` | KPI report type definitions |
