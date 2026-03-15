'use client';

import { Box, Card, CardContent, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import type { PeriodComparison as PeriodComparisonType, PeriodComparisonMetric } from '../types';

const METRIC_LABELS: Record<string, string> = {
	matchesCreated: '매칭 생성',
	likesSent: '좋아요 발송',
	mutualAccepted: '상호 수락',
	chatRoomsOpened: '채팅 개설',
};

export default function PeriodComparisonSection({ data }: { data: PeriodComparisonType }) {
	const metrics: { key: string; metric: PeriodComparisonMetric }[] = [
		{ key: 'matchesCreated', metric: data.matchesCreated },
		{ key: 'likesSent', metric: data.likesSent },
		{ key: 'mutualAccepted', metric: data.mutualAccepted },
		{ key: 'chatRoomsOpened', metric: data.chatRoomsOpened },
	];

	return (
		<Card>
			<CardContent>
				<Typography variant="subtitle1" fontWeight={700} gutterBottom>
					전기 대비 변화
				</Typography>
				<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
					{metrics.map(({ key, metric }) => (
						<ComparisonCard key={key} label={METRIC_LABELS[key]} metric={metric} />
					))}
				</Box>
			</CardContent>
		</Card>
	);
}

function ComparisonCard({ label, metric }: { label: string; metric: PeriodComparisonMetric }) {
	const delta = metric.deltaPercent;
	const isUp = delta != null && delta > 0;
	const isDown = delta != null && delta < 0;

	return (
		<Box
			sx={{
				flex: 1,
				minWidth: 160,
				p: 2,
				borderRadius: 2,
				border: '1px solid',
				borderColor: 'divider',
				textAlign: 'center',
			}}
		>
			<Typography variant="caption" color="text.secondary">
				{label}
			</Typography>
			<Typography variant="h5" fontWeight={700}>
				{metric.current.toLocaleString()}
			</Typography>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
				{isUp && <TrendingUpIcon sx={{ fontSize: 16, color: '#16a34a' }} />}
				{isDown && <TrendingDownIcon sx={{ fontSize: 16, color: '#dc2626' }} />}
				{!isUp && !isDown && <TrendingFlatIcon sx={{ fontSize: 16, color: '#9ca3af' }} />}
				<Typography
					variant="body2"
					fontWeight={600}
					color={isUp ? '#16a34a' : isDown ? '#dc2626' : 'text.secondary'}
				>
					{delta != null ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%` : '-'}
				</Typography>
				<Typography variant="caption" color="text.secondary">
					(전기 {metric.previous.toLocaleString()})
				</Typography>
			</Box>
		</Box>
	);
}
