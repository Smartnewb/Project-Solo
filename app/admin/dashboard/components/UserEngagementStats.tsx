'use client';

import {
	Chat as ChatIcon,
	Favorite as FavoriteIcon,
	ThumbUp as ThumbUpIcon,
	TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { Alert, Box, CircularProgress, Grid, Paper, Tooltip, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import AdminService from '@/app/services/admin';

interface StatMetric {
	mean: number;
	median: number;
}

interface EngagementRate {
	activeUsers: number;
	totalUsers: number;
	rate: number;
}

interface UserEngagementStatsData {
	stats: {
		likesPerUser: StatMetric;
		mutualLikesPerUser: StatMetric;
		chatOpensPerUser: StatMetric;
		likeEngagement: EngagementRate;
		mutualLikeEngagement: EngagementRate;
		chatOpenEngagement: EngagementRate;
	};
	startDate: string;
	endDate: string;
}

interface StatCardProps {
	title: string;
	icon: React.ReactNode;
	color: string;
	metric: StatMetric;
	engagement: EngagementRate;
}

const StatCard = ({ title, icon, color, metric, engagement }: StatCardProps) => {
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
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
					<TrendingUpIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
					<Typography variant="caption" color="text.secondary">
						전체 유저 참여율
					</Typography>
				</Box>
				<Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
					<Typography
						variant="h4"
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
					<Typography variant="caption" color="text.secondary">
						({engagement.activeUsers.toLocaleString()} / {engagement.totalUsers.toLocaleString()})
					</Typography>
				</Box>
			</Box>
		</Paper>
	);
};

export default function UserEngagementStats() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<UserEngagementStatsData | null>(null);

	const fetchData = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await AdminService.userEngagement.getStats();
			setData(response);
		} catch (err) {
			console.error('유저 참여 통계 조회 실패:', err);
			setError('유저 참여 통계를 불러오는데 실패했습니다.');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	if (loading) {
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

	const { stats, startDate, endDate } = data;

	return (
		<Paper sx={{ p: 3 }}>
			<Box sx={{ mb: 3 }}>
				<Typography variant="h6" fontWeight="bold">
					유저 참여 통계
				</Typography>
				<Typography variant="caption" color="text.secondary">
					{startDate} ~ {endDate}
				</Typography>
			</Box>

			<Grid container spacing={2}>
				<Grid item xs={12} md={4}>
					<StatCard
						title="좋아요"
						icon={<ThumbUpIcon />}
						color="#2196F3"
						metric={stats.likesPerUser}
						engagement={stats.likeEngagement}
					/>
				</Grid>
				<Grid item xs={12} md={4}>
					<StatCard
						title="상호 좋아요"
						icon={<FavoriteIcon />}
						color="#E91E63"
						metric={stats.mutualLikesPerUser}
						engagement={stats.mutualLikeEngagement}
					/>
				</Grid>
				<Grid item xs={12} md={4}>
					<StatCard
						title="채팅 오픈"
						icon={<ChatIcon />}
						color="#4CAF50"
						metric={stats.chatOpensPerUser}
						engagement={stats.chatOpenEngagement}
					/>
				</Grid>
			</Grid>

			<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
				* 평균/중앙값은 해당 활동을 1회 이상 한 유저 기준입니다. 참여율은 전체 유저 대비 해당 활동을
				한 유저 비율입니다.
			</Typography>
		</Paper>
	);
}
