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

export default function KpiReportPage() {
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
