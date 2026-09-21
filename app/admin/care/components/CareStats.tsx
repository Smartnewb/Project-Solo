'use client';

import { Box, Typography, Skeleton } from '@mui/material';

interface CareStatsProps {
	pending: number;
	cared: number;
	dismissed: number;
	loading: boolean;
}

const stats_config = [
	{ label: '대기 중', key: 'pending' as const, color: '#2563eb', bg: '#f0f7ff' },
	{ label: '케어 완료', key: 'cared' as const, color: '#16a34a', bg: '#f0fdf4' },
	{ label: '무시', key: 'dismissed' as const, color: '#d97706', bg: '#fefce8' },
];

export default function CareStats({ pending, cared, dismissed, loading }: CareStatsProps) {
	const values = { pending, cared, dismissed };

	return (
		<Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
			{stats_config.map((stat) => (
				<Box
					key={stat.label}
					sx={{
						flex: 1,
						bgcolor: stat.bg,
						p: 1.5,
						borderRadius: 2,
						textAlign: 'center',
					}}
				>
					{loading ? (
						<Skeleton variant="text" width={40} height={36} sx={{ mx: 'auto' }} />
					) : (
						<Typography sx={{ fontSize: 24, fontWeight: 700, color: stat.color }}>
							{values[stat.key]}
						</Typography>
					)}
					<Typography sx={{ fontSize: 11, color: '#6b7280' }}>{stat.label}</Typography>
				</Box>
			))}
		</Box>
	);
}
