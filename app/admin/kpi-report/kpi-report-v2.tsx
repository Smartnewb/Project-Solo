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
