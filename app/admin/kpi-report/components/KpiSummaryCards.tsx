'use client';

import { Box, Card, CardContent, Grid, Typography, Skeleton, Chip } from '@mui/material';
import {
	KpiValue,
	KpiCategory,
	CATEGORY_CONFIG,
	CATEGORIES,
	STATUS_CONFIG,
	formatKpiValue,
	formatChangeRate,
} from '../types';

interface KpiSummaryCardsProps {
	kpis: KpiValue[];
	loading: boolean;
}

const REPRESENTATIVE_KPI: Record<KpiCategory, number> = {
	acquisition: 0,
	engagement: 0,
	activation: 0,
	matching: 0,
	monetization: 0,
};

export default function KpiSummaryCards({ kpis, loading }: KpiSummaryCardsProps) {
	if (loading) {
		return (
			<Grid container spacing={2}>
				{CATEGORIES.map((cat) => (
					<Grid item xs={12} sm={6} md={2.4} key={cat}>
						<Card>
							<CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
								<Skeleton variant="text" width={80} height={20} />
								<Skeleton variant="text" width={100} height={36} sx={{ mt: 1 }} />
								<Skeleton variant="text" width={60} height={20} />
							</CardContent>
						</Card>
					</Grid>
				))}
			</Grid>
		);
	}

	return (
		<Grid container spacing={2}>
			{CATEGORIES.map((category) => {
				const config = CATEGORY_CONFIG[category];
				const categoryKpis = kpis.filter((k) => k.category === category);
				const representative = categoryKpis[REPRESENTATIVE_KPI[category]];

				if (!representative) return null;

				const change = formatChangeRate(representative.changeRate);
				const statusConfig = STATUS_CONFIG[representative.status];

				return (
					<Grid item xs={12} sm={6} md={2.4} key={category}>
						<Card sx={{ borderTop: `3px solid ${config.color}` }}>
							<CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
									<Typography variant="caption" sx={{ fontSize: '1rem' }}>
										{config.icon}
									</Typography>
									<Typography variant="caption" color="text.secondary" fontWeight={600}>
										{config.label}
									</Typography>
								</Box>
								<Typography variant="h5" fontWeight="bold">
									{formatKpiValue(representative.currentValue, representative.unit)}
								</Typography>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
									<Typography variant="caption" fontWeight="bold" sx={{ color: change.color }}>
										{change.text}
									</Typography>
									<Chip
										label={statusConfig.arrow}
										size="small"
										color={statusConfig.color}
										sx={{ height: 20, fontSize: '0.65rem' }}
									/>
								</Box>
								<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
									{representative.label}
								</Typography>
							</CardContent>
						</Card>
					</Grid>
				);
			})}
		</Grid>
	);
}
