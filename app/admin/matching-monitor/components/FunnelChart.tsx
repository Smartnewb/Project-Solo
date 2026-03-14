'use client';

import { Box, Card, CardContent, Typography, Chip } from '@mui/material';
import type { PostMatchFunnel } from '../types';

interface FunnelStep {
	label: string;
	value: number;
	color: string;
	rate?: number;
	rateLabel?: string;
}

export default function FunnelChart({ data }: { data: PostMatchFunnel }) {
	const steps: FunnelStep[] = [
		{ label: '매칭 생성', value: data.matchesCreated, color: '#3b82f6' },
		{ label: '좋아요 발송', value: data.likesSent, color: '#8b5cf6' },
		{
			label: '상호 수락',
			value: data.mutualAccepted,
			color: '#f59e0b',
			rate: data.mutualAcceptRate,
			rateLabel: '수락률',
		},
		{
			label: '채팅방 개설',
			value: data.chatRoomsOpened,
			color: '#10b981',
			rate: data.chatOpenRate,
			rateLabel: '개설률',
		},
	];

	const maxValue = Math.max(...steps.map((s) => s.value), 1);

	return (
		<Card>
			<CardContent>
				<Typography variant="subtitle1" fontWeight={700} gutterBottom>
					포스트매칭 퍼널
				</Typography>

				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
					{steps.map((step, i) => {
						const widthPct = Math.max((step.value / maxValue) * 100, 8);
						return (
							<Box key={step.label}>
								<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
									<Typography variant="body2" fontWeight={600}>
										{step.label}
									</Typography>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
										<Typography variant="body2" fontWeight={700}>
											{step.value.toLocaleString()}
										</Typography>
										{step.rate !== undefined && (
											<Chip
												label={`${step.rateLabel} ${step.rate}%`}
												size="small"
												sx={{ fontSize: '0.75rem', height: 22 }}
											/>
										)}
									</Box>
								</Box>
								<Box
									sx={{
										height: 28,
										width: `${widthPct}%`,
										bgcolor: step.color,
										borderRadius: 1,
										transition: 'width 0.5s ease',
										opacity: 0.85,
									}}
								/>
							</Box>
						);
					})}
				</Box>

				<Box
					sx={{
						mt: 3,
						pt: 2,
						borderTop: '1px solid',
						borderColor: 'divider',
						display: 'flex',
						gap: 3,
						flexWrap: 'wrap',
					}}
				>
					<Stat label="편지 포함 좋아요" value={data.likesWithLetter} sub={`${data.letterRate}%`} />
					<Stat label="만료된 좋아요" value={data.likeExpired} />
					<Stat label="거절된 좋아요" value={data.likeRejected} />
					<Stat label="활성 채팅방" value={data.chatRoomsActive} />
				</Box>
			</CardContent>
		</Card>
	);
}

function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
	return (
		<Box>
			<Typography variant="caption" color="text.secondary">
				{label}
			</Typography>
			<Typography variant="body2" fontWeight={700}>
				{value.toLocaleString()}
				{sub && (
					<Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
						({sub})
					</Typography>
				)}
			</Typography>
		</Box>
	);
}
