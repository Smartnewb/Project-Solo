'use client';

import { useState, useCallback, useMemo } from 'react';
import {
	Box,
	Typography,
	Tabs,
	Tab,
	ToggleButton,
	ToggleButtonGroup,
	IconButton,
	Tooltip,
	Alert,
	Skeleton,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useQueryClient } from '@tanstack/react-query';
import { useMatchingDashboard, monitorKeys } from './hooks';
import type { DashboardPeriod, DashboardCountry } from './types';

import HealthScoreBanner from './components/HealthScoreBanner';
import KpiCards from './components/KpiCards';
import PoolOverviewSection from './components/PoolOverview';
import BatchPerformanceSection from './components/BatchPerformance';
import FunnelChart from './components/FunnelChart';
import PipelineAnalysis from './components/PipelineAnalysis';
import RegionStats from './components/RegionStats';
import GlobalMatchingSection from './components/GlobalMatching';
import AtRiskUsersSection from './components/AtRiskUsers';
import UserDiagnosis from './components/UserDiagnosis';

interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
	return (
		<div role="tabpanel" hidden={value !== index}>
			{value === index && <Box sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>{children}</Box>}
		</div>
	);
}

export default function MatchingMonitorV2() {
	const [activeTab, setActiveTab] = useState(0);
	const [period, setPeriod] = useState<DashboardPeriod>('today');
	const [country, setCountry] = useState<DashboardCountry>('ALL');
	const [diagnosisUserId, setDiagnosisUserId] = useState('');

	const queryClient = useQueryClient();
	const { data, isLoading, error, dataUpdatedAt } = useMatchingDashboard(period, country);

	const handleRefresh = useCallback(() => {
		queryClient.invalidateQueries({ queryKey: monitorKeys.dashboard(period, country) });
	}, [queryClient, period, country]);

	const TAB_RISK_USERS = 3;

	const handleUserClick = useCallback((userId: string) => {
		setDiagnosisUserId(userId);
		setActiveTab(TAB_RISK_USERS);
	}, []);

	const cachedTimeStr = useMemo(
		() =>
			dataUpdatedAt
				? new Date(dataUpdatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
				: '',
		[dataUpdatedAt],
	);

	return (
		<Box className="min-h-screen bg-gray-50">
			<Box className="bg-white shadow-sm border-b border-gray-200">
				<Box className="max-w-7xl mx-auto px-4 py-4">
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
						<Typography variant="h5" fontWeight="bold">
							매칭 모니터
						</Typography>

						<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
							<ToggleButtonGroup
								size="small"
								exclusive
								value={period}
								onChange={(_, v) => v && setPeriod(v)}
							>
								<ToggleButton value="today">오늘</ToggleButton>
								<ToggleButton value="7d">7일</ToggleButton>
								<ToggleButton value="30d">30일</ToggleButton>
							</ToggleButtonGroup>

							<ToggleButtonGroup
								size="small"
								exclusive
								value={country}
								onChange={(_, v) => v && setCountry(v)}
							>
								<ToggleButton value="ALL">전체</ToggleButton>
								<ToggleButton value="KR">KR</ToggleButton>
								<ToggleButton value="JP">JP</ToggleButton>
							</ToggleButtonGroup>

							<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
								<Tooltip title="새로고침">
									<IconButton size="small" onClick={handleRefresh}>
										<RefreshIcon fontSize="small" />
									</IconButton>
								</Tooltip>
								{cachedTimeStr && (
									<Typography variant="caption" color="text.secondary">
										{cachedTimeStr}
									</Typography>
								)}
							</Box>
						</Box>
					</Box>
				</Box>
			</Box>

			<Box className="max-w-7xl mx-auto px-4 py-6">
				{error && (
					<Alert severity="error" sx={{ mb: 3 }}>
						데이터 로드 실패: {(error as Error).message}
					</Alert>
				)}

				{isLoading && !data ? (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
						<Skeleton variant="rounded" height={100} />
						<Box sx={{ display: 'flex', gap: 2 }}>
							{[1, 2, 3, 4].map((i) => (
								<Skeleton key={i} variant="rounded" height={96} sx={{ flex: 1 }} />
							))}
						</Box>
						<Skeleton variant="rounded" height={300} />
					</Box>
				) : data ? (
					<>
						<HealthScoreBanner data={data.healthScore} />

						<Tabs
							value={activeTab}
							onChange={(_, v) => setActiveTab(v)}
							sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}
						>
							<Tab label="종합 현황" />
							<Tab label="퍼널 & 파이프라인" />
							<Tab label="지역 & 글로벌" />
							<Tab label="위험 유저 관리" />
						</Tabs>

						<TabPanel value={activeTab} index={0}>
							<KpiCards
								pool={data.pool}
								matchRate={data.matchRate}
								funnel={data.postMatchFunnel}
							/>
							<PoolOverviewSection pool={data.pool} segments={data.segmentStats} />
							<BatchPerformanceSection data={data.batchPerformance} />
						</TabPanel>

						<TabPanel value={activeTab} index={1}>
							<FunnelChart data={data.postMatchFunnel} />
							<PipelineAnalysis data={data.pipelineTransparency} />
						</TabPanel>

						<TabPanel value={activeTab} index={2}>
							<RegionStats data={data.regionStats} />
							<GlobalMatchingSection data={data.globalMatching} ttl={data.historyTtl} />
						</TabPanel>

						<TabPanel value={activeTab} index={3}>
							<AtRiskUsersSection data={data.atRiskUsers} onUserClick={handleUserClick} />
							<UserDiagnosis initialUserId={diagnosisUserId} />
						</TabPanel>
					</>
				) : null}
			</Box>
		</Box>
	);
}
