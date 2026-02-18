'use client';

import {
	Card,
	CardContent,
	Typography,
	Grid,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Chip,
	Alert,
	Skeleton,
	Box,
} from '@mui/material';
import { CountryBreakdownData, STATUS_CONFIG, formatKpiValue, formatChangeRate } from '../types';

interface CountryBreakdownProps {
	countryBreakdown?: CountryBreakdownData;
	loading: boolean;
}

const COUNTRY_INFO: Record<string, { flag: string; label: string }> = {
	KR: { flag: '🇰🇷', label: '한국' },
	JP: { flag: '🇯🇵', label: '일본' },
};

export default function CountryBreakdown({ countryBreakdown, loading }: CountryBreakdownProps) {
	if (loading) {
		return (
			<Card>
				<CardContent>
					<Skeleton variant="text" width={160} height={28} sx={{ mb: 2 }} />
					<Grid container spacing={2}>
						{[1, 2].map((i) => (
							<Grid item xs={12} md={6} key={i}>
								<Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
							</Grid>
						))}
					</Grid>
				</CardContent>
			</Card>
		);
	}

	if (!countryBreakdown) {
		return (
			<Card>
				<CardContent>
					<Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
						국가별 비교
					</Typography>
					<Alert severity="info">국가별 데이터가 아직 생성되지 않았습니다.</Alert>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardContent>
				<Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
					국가별 비교
				</Typography>
				<Grid container spacing={2}>
					{(Object.keys(countryBreakdown) as Array<'KR' | 'JP'>).map((countryCode) => {
						const info = COUNTRY_INFO[countryCode];
						const kpis = countryBreakdown[countryCode];

						return (
							<Grid item xs={12} md={6} key={countryCode}>
								<Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
									<Box sx={{ bgcolor: 'grey.50', px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
										<Typography variant="body1">{info.flag}</Typography>
										<Typography variant="subtitle2" fontWeight="bold">
											{info.label}
										</Typography>
									</Box>
									<TableContainer>
										<Table size="small">
											<TableHead>
												<TableRow>
													<TableCell sx={{ fontWeight: 600 }}>KPI</TableCell>
													<TableCell align="right" sx={{ fontWeight: 600 }}>값</TableCell>
													<TableCell align="right" sx={{ fontWeight: 600 }}>변화율</TableCell>
													<TableCell align="center" sx={{ fontWeight: 600 }}>상태</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{kpis.map((kpi) => {
													const change = formatChangeRate(kpi.changeRate);
													const statusConfig = STATUS_CONFIG[kpi.status];
													return (
														<TableRow key={kpi.name} hover>
															<TableCell>
																<Typography variant="body2" fontWeight={500}>
																	{kpi.label}
																</Typography>
															</TableCell>
															<TableCell align="right">
																<Typography variant="body2" fontWeight={600}>
																	{formatKpiValue(kpi.currentValue, kpi.unit)}
																</Typography>
															</TableCell>
															<TableCell align="right">
																<Typography variant="body2" fontWeight="bold" sx={{ color: change.color }}>
																	{change.text}
																</Typography>
															</TableCell>
															<TableCell align="center">
																<Chip
																	label={statusConfig.arrow}
																	size="small"
																	color={statusConfig.color}
																	sx={{ height: 22, fontSize: '0.7rem' }}
																/>
															</TableCell>
														</TableRow>
													);
												})}
												{kpis.length === 0 && (
													<TableRow>
														<TableCell colSpan={4} align="center">
															<Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
																데이터 없음
															</Typography>
														</TableCell>
													</TableRow>
												)}
											</TableBody>
										</Table>
									</TableContainer>
								</Box>
							</Grid>
						);
					})}
				</Grid>
			</CardContent>
		</Card>
	);
}
