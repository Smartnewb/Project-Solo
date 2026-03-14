'use client';

import { Box, Card, CardContent, Typography, Chip } from '@mui/material';
import type { BatchPerformance as BatchPerformanceType } from '../types';

export default function BatchPerformanceSection({ data }: { data: BatchPerformanceType }) {
	const durationSec = data.avgDurationMs != null ? (data.avgDurationMs / 1000).toFixed(1) : '-';

	return (
		<Card>
			<CardContent>
				<Typography variant="subtitle1" fontWeight={700} gutterBottom>
					배치 성과
				</Typography>
				<Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
					<Metric label="총 배치" value={data.totalBatches} />
					<Metric label="완료" value={data.completedBatches} color="#16a34a" />
					<Metric
						label="실패"
						value={data.failedBatches}
						color={data.failedBatches > 0 ? '#dc2626' : undefined}
					/>
					<Metric label="평균 성공" value={data.avgSuccessCount} suffix="건/배치" />
					<Metric label="평균 실패" value={data.avgFailureCount} suffix="건/배치" />
					<Metric label="평균 소요시간" value={durationSec} suffix="초" />
				</Box>
			</CardContent>
		</Card>
	);
}

function Metric({
	label,
	value,
	suffix,
	color,
}: {
	label: string;
	value: number | string;
	suffix?: string;
	color?: string;
}) {
	return (
		<Box sx={{ textAlign: 'center', minWidth: 80 }}>
			<Typography variant="caption" color="text.secondary">
				{label}
			</Typography>
			<Typography variant="h5" fontWeight={700} color={color || 'text.primary'}>
				{typeof value === 'number' ? value.toLocaleString() : value}
			</Typography>
			{suffix && (
				<Typography variant="caption" color="text.secondary">
					{suffix}
				</Typography>
			)}
		</Box>
	);
}
