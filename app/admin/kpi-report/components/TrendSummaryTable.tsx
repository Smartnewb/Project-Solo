'use client';

import {
	Card,
	CardContent,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Skeleton,
	Box,
} from '@mui/material';
import { KpiTrend, TREND_CONFIG } from '../types';

interface TrendSummaryTableProps {
	trends: KpiTrend[];
	loading: boolean;
}

export default function TrendSummaryTable({ trends, loading }: TrendSummaryTableProps) {
	if (loading) {
		return (
			<Card>
				<CardContent>
					<Skeleton variant="text" width={160} height={28} sx={{ mb: 2 }} />
					{[1, 2, 3, 4].map((i) => (
						<Skeleton key={i} variant="rectangular" height={36} sx={{ mb: 1, borderRadius: 1 }} />
					))}
				</CardContent>
			</Card>
		);
	}

	if (trends.length === 0) return null;

	return (
		<Card>
			<CardContent>
				<Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
					4주 트렌드 요약
				</Typography>
				<TableContainer>
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell sx={{ fontWeight: 600 }}>KPI</TableCell>
								{trends[0]?.points?.map((point, idx) => (
									<TableCell key={idx} align="right" sx={{ fontWeight: 600 }}>
										{point.weekLabel || `W${point.week}`}
									</TableCell>
								))}
								<TableCell align="center" sx={{ fontWeight: 600 }}>방향</TableCell>
								<TableCell align="right" sx={{ fontWeight: 600 }}>기울기</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{trends.map((trend) => {
								const trendConfig = TREND_CONFIG[trend.direction];
								return (
									<TableRow key={trend.name} hover>
										<TableCell>
											<Typography variant="body2" fontWeight={500}>
												{trend.label}
											</Typography>
										</TableCell>
										{trend.points.map((point, idx) => (
											<TableCell key={idx} align="right">
												<Typography variant="body2">
													{point.value.toLocaleString()}
												</Typography>
											</TableCell>
										))}
										<TableCell align="center">
											<Box
												component="span"
												sx={{
													color: trendConfig.color,
													fontWeight: 'bold',
													fontSize: '1.2rem',
												}}
											>
												{trendConfig.arrow}
											</Box>
											<Typography variant="caption" sx={{ color: trendConfig.color, ml: 0.5 }}>
												{trendConfig.label}
											</Typography>
										</TableCell>
										<TableCell align="right">
											<Typography
												variant="body2"
												fontWeight="bold"
												sx={{ color: trendConfig.color }}
											>
												{trend.slope > 0 ? '+' : ''}{trend.slope.toFixed(2)}
											</Typography>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</TableContainer>
			</CardContent>
		</Card>
	);
}
