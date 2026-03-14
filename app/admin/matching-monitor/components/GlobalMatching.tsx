'use client';

import { Box, Card, CardContent, Typography } from '@mui/material';
import type { GlobalMatching as GlobalMatchingType, HistoryTtl } from '../types';

export default function GlobalMatchingSection({
	data,
	ttl,
}: {
	data: GlobalMatchingType;
	ttl: HistoryTtl;
}) {
	const krToJpRate =
		data.krToJpAttempted > 0 ? ((data.krToJpSuccess / data.krToJpAttempted) * 100).toFixed(1) : '0';
	const jpToKrRate =
		data.jpToKrAttempted > 0 ? ((data.jpToKrSuccess / data.jpToKrAttempted) * 100).toFixed(1) : '0';

	return (
		<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
			<DirectionCard
				title="KR → JP"
				attempted={data.krToJpAttempted}
				success={data.krToJpSuccess}
				rate={krToJpRate}
				color="#3b82f6"
			/>
			<DirectionCard
				title="JP → KR"
				attempted={data.jpToKrAttempted}
				success={data.jpToKrSuccess}
				rate={jpToKrRate}
				color="#ec4899"
			/>

			<Card sx={{ flex: 1, minWidth: 200 }}>
				<CardContent>
					<Typography variant="subtitle2" color="text.secondary" gutterBottom>
						글로벌 좋아요
					</Typography>
					<StatRow label="대기 중" value={data.pendingLikes} />
					<StatRow label="기간 내 만료" value={data.expiredLikesInPeriod} />
				</CardContent>
			</Card>

			<Card sx={{ flex: 1, minWidth: 200 }}>
				<CardContent>
					<Typography variant="subtitle2" color="text.secondary" gutterBottom>
						History TTL
					</Typography>
					<StatRow label="TTL 설정" value={`${ttl.ttlDays}일`} />
					<StatRow label="기간 내 만료" value={ttl.expiredInPeriod} />
					<StatRow label="활성 제외" value={ttl.currentActiveExclusions} />
				</CardContent>
			</Card>
		</Box>
	);
}

function DirectionCard({
	title,
	attempted,
	success,
	rate,
	color,
}: {
	title: string;
	attempted: number;
	success: number;
	rate: string;
	color: string;
}) {
	return (
		<Card sx={{ flex: 1, minWidth: 200 }}>
			<CardContent>
				<Typography variant="subtitle2" color="text.secondary" gutterBottom>
					{title}
				</Typography>
				<Typography variant="h4" fontWeight={800} color={color}>
					{rate}%
				</Typography>
				<Typography variant="caption" color="text.secondary">
					{success.toLocaleString()} / {attempted.toLocaleString()} 시도
				</Typography>
			</CardContent>
		</Card>
	);
}

function StatRow({ label, value }: { label: string; value: string | number }) {
	return (
		<Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
			<Typography variant="body2" color="text.secondary">
				{label}
			</Typography>
			<Typography variant="body2" fontWeight={600}>
				{typeof value === 'number' ? value.toLocaleString() : value}
			</Typography>
		</Box>
	);
}
