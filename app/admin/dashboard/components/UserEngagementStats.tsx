'use client';

import {
	Chat as ChatIcon,
	Favorite as FavoriteIcon,
	HelpOutline as HelpOutlineIcon,
	ThumbUp as ThumbUpIcon,
	TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import {
	Alert,
	Box,
	CircularProgress,
	FormControlLabel,
	Grid,
	IconButton,
	Paper,
	Switch,
	ToggleButton,
	ToggleButtonGroup,
	Tooltip,
	Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminService from '@/app/services/admin';

type PeriodType = 'all' | 'year' | 'month' | 'week' | 'day';

interface StatMetric {
	mean: number;
	median: number;
}

interface EngagementRate {
	activeUsers: number;
	totalUsers: number;
	rate: number;
}

interface PeriodEngagement {
	likeEngagement: EngagementRate;
	mutualLikeEngagement: EngagementRate;
	chatOpenEngagement: EngagementRate;
}

interface UserEngagementStatsData {
	stats: {
		likesPerUser: StatMetric;
		mutualLikesPerUser: StatMetric;
		chatOpensPerUser: StatMetric;
		likeEngagement: EngagementRate;
		mutualLikeEngagement: EngagementRate;
		chatOpenEngagement: EngagementRate;
		periodEngagement?: PeriodEngagement;
	};
	startDate: string | null;
	endDate: string;
	periodType: 'all' | 'custom';
}

interface StatCardProps {
	title: string;
	icon: React.ReactNode;
	color: string;
	metric: StatMetric;
	engagement: EngagementRate;
	periodEngagement?: EngagementRate;
}

const PERIOD_LABELS: Record<PeriodType, string> = {
	all: '전체',
	year: '올해',
	month: '이번 달',
	week: '이번 주',
	day: '오늘',
};

const PERIOD_DESCRIPTIONS: Record<PeriodType, string> = {
	all: '서비스 시작부터 현재까지 가입한 전체 유저 대비 참여율',
	year: '올해 가입한 유저 중 참여율',
	month: '이번 달 가입한 유저 중 참여율',
	week: '이번 주 가입한 유저 중 참여율',
	day: '오늘 가입한 유저 중 참여율',
};

const getDateRange = (period: PeriodType): { startDate?: string; endDate?: string } => {
	const now = new Date();
	const formatDate = (d: Date) => d.toISOString().split('T')[0];

	switch (period) {
		case 'all':
			return {};
		case 'year': {
			const startOfYear = new Date(now.getFullYear(), 0, 1);
			return { startDate: formatDate(startOfYear), endDate: formatDate(now) };
		}
		case 'month': {
			const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
			return { startDate: formatDate(startOfMonth), endDate: formatDate(now) };
		}
		case 'week': {
			const dayOfWeek = now.getDay();
			const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
			const startOfWeek = new Date(now);
			startOfWeek.setDate(now.getDate() - diff);
			return { startDate: formatDate(startOfWeek), endDate: formatDate(now) };
		}
		case 'day': {
			return { startDate: formatDate(now), endDate: formatDate(now) };
		}
	}
};

const EngagementRateDisplay = ({
	label,
	engagement,
	isPrimary = false,
}: {
	label: string;
	engagement: EngagementRate;
	isPrimary?: boolean;
}) => (
	<Box sx={{ flex: 1 }}>
		<Tooltip title={label}>
			<Typography
				variant="caption"
				color="text.secondary"
				sx={{
					display: 'block',
					mb: 0.5,
					fontSize: isPrimary ? '0.75rem' : '0.7rem',
				}}
			>
				{label}
			</Typography>
		</Tooltip>
		<Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, flexWrap: 'wrap' }}>
			<Typography
				variant={isPrimary ? 'h4' : 'h5'}
				fontWeight="bold"
				color={
					engagement.rate >= 30
						? 'success.main'
						: engagement.rate >= 15
							? 'warning.main'
							: 'error.main'
				}
			>
				{engagement.rate}%
			</Typography>
			<Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
				({engagement.activeUsers.toLocaleString()}/{engagement.totalUsers.toLocaleString()})
			</Typography>
		</Box>
	</Box>
);

const StatCard = ({ title, icon, color, metric, engagement, periodEngagement }: StatCardProps) => {
	return (
		<Paper
			sx={{
				p: 2,
				height: '100%',
				borderLeft: `4px solid ${color}`,
			}}
		>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
				<Box sx={{ color }}>{icon}</Box>
				<Typography variant="subtitle2" fontWeight="bold">
					{title}
				</Typography>
			</Box>

			<Box sx={{ mb: 2 }}>
				<Typography variant="caption" color="text.secondary">
					유저 1인당
				</Typography>
				<Box sx={{ display: 'flex', gap: 3, mt: 0.5 }}>
					<Tooltip title="활동한 유저들의 평균값">
						<Box>
							<Typography variant="caption" color="text.secondary">
								평균
							</Typography>
							<Typography variant="h5" fontWeight="bold" color={color}>
								{metric.mean.toFixed(2)}
							</Typography>
						</Box>
					</Tooltip>
					<Tooltip title="활동한 유저들의 중앙값 (상위 50% 기준)">
						<Box>
							<Typography variant="caption" color="text.secondary">
								중앙값
							</Typography>
							<Typography variant="h5" fontWeight="bold" color={color}>
								{metric.median}
							</Typography>
						</Box>
					</Tooltip>
				</Box>
			</Box>

			<Box
				sx={{
					pt: 2,
					borderTop: '1px solid',
					borderColor: 'divider',
				}}
			>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
					<TrendingUpIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
					<Typography variant="caption" color="text.secondary">
						참여율
					</Typography>
				</Box>
				<Box sx={{ display: 'flex', gap: 2 }}>
					<EngagementRateDisplay
						label="전체 대상"
						engagement={engagement}
						isPrimary={!periodEngagement}
					/>
					{periodEngagement && (
						<EngagementRateDisplay
							label="기간 내 가입자"
							engagement={periodEngagement}
							isPrimary
						/>
					)}
				</Box>
			</Box>
		</Paper>
	);
};

export default function UserEngagementStats() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<UserEngagementStatsData | null>(null);
	const [includeDeleted, setIncludeDeleted] = useState(false);
	const [period, setPeriod] = useState<PeriodType>('all');

	const dateRange = useMemo(() => getDateRange(period), [period]);

	const fetchData = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await AdminService.userEngagement.getStats(
				dateRange.startDate,
				dateRange.endDate,
				includeDeleted,
			);
			setData(response);
		} catch (err) {
			console.error('유저 참여 통계 조회 실패:', err);
			setError('유저 참여 통계를 불러오는데 실패했습니다.');
		} finally {
			setLoading(false);
		}
	}, [dateRange.startDate, dateRange.endDate, includeDeleted]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const handleIncludeDeletedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setIncludeDeleted(event.target.checked);
	};

	const handlePeriodChange = (
		_event: React.MouseEvent<HTMLElement>,
		newPeriod: PeriodType | null,
	) => {
		if (newPeriod !== null) {
			setPeriod(newPeriod);
		}
	};

	const periodDescription = PERIOD_DESCRIPTIONS[period];
	const displayDateRange = data
		? data.startDate
			? `${data.startDate} ~ ${data.endDate}`
			: `전체 기간 ~ ${data.endDate}`
		: '';

	if (loading && !data) {
		return (
			<Paper sx={{ p: 3 }}>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						py: 4,
					}}
				>
					<CircularProgress size={24} />
					<Typography variant="body2" sx={{ ml: 2 }}>
						유저 참여 통계 로딩 중...
					</Typography>
				</Box>
			</Paper>
		);
	}

	if (error) {
		return (
			<Alert severity="error" sx={{ mb: 2 }}>
				{error}
			</Alert>
		);
	}

	if (!data) {
		return null;
	}

	const { stats } = data;

	return (
		<Paper sx={{ p: 3 }}>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'flex-start',
					mb: 2,
					flexWrap: 'wrap',
					gap: 2,
				}}
			>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<Typography variant="h6" fontWeight="bold">
						유저 참여 통계
					</Typography>
					<Tooltip
						title={
							<Box>
								<Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
									참여율 계산 기준
								</Typography>
								<Typography variant="body2">{periodDescription}</Typography>
								<Typography variant="body2" sx={{ mt: 1, color: 'grey.400' }}>
									• 평균/중앙값: 해당 활동을 1회 이상 한 유저 기준
								</Typography>
								<Typography variant="body2" sx={{ color: 'grey.400' }}>
									• 참여율: 선택 기간 내 가입 유저 중 활동 유저 비율
								</Typography>
							</Box>
						}
						arrow
						placement="right"
					>
						<IconButton size="small" sx={{ color: 'text.secondary' }}>
							<HelpOutlineIcon fontSize="small" />
						</IconButton>
					</Tooltip>
				</Box>
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						gap: 2,
						flexWrap: 'wrap',
					}}
				>
					<ToggleButtonGroup value={period} exclusive onChange={handlePeriodChange} size="small">
						{(Object.keys(PERIOD_LABELS) as PeriodType[]).map((key) => (
							<ToggleButton key={key} value={key} sx={{ px: 1.5, py: 0.5 }}>
								<Typography variant="caption">{PERIOD_LABELS[key]}</Typography>
							</ToggleButton>
						))}
					</ToggleButtonGroup>
					<FormControlLabel
						control={
							<Switch checked={includeDeleted} onChange={handleIncludeDeletedChange} size="small" />
						}
						label={
							<Typography variant="caption" color="text.secondary">
								탈퇴자 포함
							</Typography>
						}
						labelPlacement="start"
						sx={{ mr: 0, ml: 0 }}
					/>
				</Box>
			</Box>

			<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
				{displayDateRange}
			</Typography>

			{loading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
					<CircularProgress size={24} />
				</Box>
			) : (
				<Grid container spacing={2}>
					<Grid item xs={12} md={4}>
						<StatCard
							title="좋아요"
							icon={<ThumbUpIcon />}
							color="#2196F3"
							metric={stats.likesPerUser}
							engagement={stats.likeEngagement}
							periodEngagement={stats.periodEngagement?.likeEngagement}
						/>
					</Grid>
					<Grid item xs={12} md={4}>
						<StatCard
							title="상호 좋아요"
							icon={<FavoriteIcon />}
							color="#E91E63"
							metric={stats.mutualLikesPerUser}
							engagement={stats.mutualLikeEngagement}
							periodEngagement={stats.periodEngagement?.mutualLikeEngagement}
						/>
					</Grid>
					<Grid item xs={12} md={4}>
						<StatCard
							title="채팅 오픈"
							icon={<ChatIcon />}
							color="#4CAF50"
							metric={stats.chatOpensPerUser}
							engagement={stats.chatOpenEngagement}
							periodEngagement={stats.periodEngagement?.chatOpenEngagement}
						/>
					</Grid>
				</Grid>
			)}
		</Paper>
	);
}
