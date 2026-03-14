'use client';

import { Box, Typography, Chip, Alert } from '@mui/material';
import type { HealthScore, HealthAlert } from '../types';

const gradeConfig: Record<HealthScore['grade'], { color: string; bg: string; label: string; border: string }> = {
	HEALTHY: { color: '#16a34a', bg: '#f0fdf4', label: 'HEALTHY', border: '#bbf7d0' },
	CAUTION: { color: '#ca8a04', bg: '#fefce8', label: 'CAUTION', border: '#fef08a' },
	CRITICAL: { color: '#dc2626', bg: '#fef2f2', label: 'CRITICAL', border: '#fecaca' },
};

const FALLBACK_GRADE = gradeConfig.CAUTION;

const alertLevelColor: Record<HealthAlert['level'], 'info' | 'warning' | 'error'> = {
	info: 'info',
	warn: 'warning',
	critical: 'error',
};

export default function HealthScoreBanner({ data }: { data: HealthScore }) {
	const config = gradeConfig[data.grade] || FALLBACK_GRADE;

	return (
		<Box
			sx={{
				p: 3,
				borderRadius: 3,
				border: `2px solid ${config.border}`,
				backgroundColor: config.bg,
				display: 'flex',
				flexDirection: { xs: 'column', md: 'row' },
				alignItems: { md: 'center' },
				gap: 3,
			}}
		>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 200 }}>
				<Box
					sx={{
						width: 72,
						height: 72,
						borderRadius: '50%',
						border: `4px solid ${config.color}`,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<Typography variant="h4" fontWeight={800} color={config.color}>
						{data.score}
					</Typography>
				</Box>
				<Box>
					<Typography variant="body2" color="text.secondary">
						Health Score
					</Typography>
					<Chip
						label={config.label}
						size="small"
						sx={{ backgroundColor: config.color, color: '#fff', fontWeight: 700 }}
					/>
				</Box>
			</Box>

			{data.alerts.length > 0 && (
				<Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
					{data.alerts.map((alert, i) => (
						<Alert
							key={i}
							severity={alertLevelColor[alert.level] || 'info'}
							sx={{ py: 0.5, '& .MuiAlert-message': { fontSize: '0.85rem' } }}
						>
							{alert.message}
						</Alert>
					))}
				</Box>
			)}
		</Box>
	);
}
