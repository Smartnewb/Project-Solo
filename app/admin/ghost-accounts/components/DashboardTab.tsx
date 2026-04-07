'use client';

import { Box, Card, CardContent, CircularProgress, Grid, Typography } from '@mui/material';
import { useGhostAccountStats } from '@/app/admin/hooks';

const STATUS_CONFIG = {
	ACTIVE: { label: '활성', color: '#10b981', bgColor: '#ecfdf5' },
	INACTIVE: { label: '비활성', color: '#6b7280', bgColor: '#f3f4f6' },
	EXHAUSTED: { label: '소진', color: '#ef4444', bgColor: '#fef2f2' },
} as const;

export default function DashboardTab() {
	const { data, isLoading, error } = useGhostAccountStats();

	if (isLoading) {
		return (
			<Box display="flex" justifyContent="center" py={4}>
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return (
			<Typography color="error">
				통계를 불러오는데 실패했습니다: {(error as Error).message}
			</Typography>
		);
	}

	return (
		<Grid container spacing={2}>
			{(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map((status) => {
				const config = STATUS_CONFIG[status];
				const count = data?.pool[status] ?? 0;

				return (
					<Grid item xs={12} sm={4} key={status}>
						<Card sx={{ bgcolor: config.bgColor }}>
							<CardContent>
								<Typography variant="body2" color="text.secondary">
									{config.label} Ghost
								</Typography>
								<Typography
									variant="h3"
									fontWeight="bold"
									sx={{ color: config.color, mt: 1 }}
								>
									{count}
								</Typography>
							</CardContent>
						</Card>
					</Grid>
				);
			})}
		</Grid>
	);
}
