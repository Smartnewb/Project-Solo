'use client';

import { useState, useEffect, useCallback } from 'react';
import {
	Box,
	Card,
	CardContent,
	Typography,
	Grid,
	Skeleton,
	Alert,
	Chip,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import AppleIcon from '@mui/icons-material/Apple';
import ShopIcon from '@mui/icons-material/Shop';
import ReviewsIcon from '@mui/icons-material/Reviews';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
	Legend,
} from 'recharts';
import AdminService, { type AppReviewStatsResponse } from '@/app/services/admin';

interface ReviewDashboardProps {
	onChartClick: (filter: { rating?: number; store?: 'APP_STORE' | 'PLAY_STORE' }) => void;
}

const STORE_COLORS = ['#007AFF', '#34A853'];
const RATING_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

export default function ReviewDashboard({ onChartClick }: ReviewDashboardProps) {
	const [stats, setStats] = useState<AppReviewStatsResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchStats = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await AdminService.appReviews.getStats();
			setStats(data);
		} catch (err: any) {
			setError(err.message || '통계를 불러오는데 실패했습니다.');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchStats();
	}, [fetchStats]);

	if (error) {
		return (
			<Alert severity="error" sx={{ mb: 2 }}>
				{error}
			</Alert>
		);
	}

	const kpiCards = stats
		? [
				{
					label: '전체 리뷰',
					value: stats.totalCount.toLocaleString(),
					icon: <ReviewsIcon />,
					color: '#3b82f6',
					bg: '#eff6ff',
				},
				{
					label: '평균 별점',
					value: stats.averageRating.toFixed(1),
					icon: <StarIcon />,
					color: '#eab308',
					bg: '#fefce8',
					suffix: '/ 5.0',
				},
				...(stats.byStore || []).map((s) => ({
					label: s.store === 'APP_STORE' ? 'App Store' : 'Play Store',
					value: `${s.count.toLocaleString()}건`,
					icon: s.store === 'APP_STORE' ? <AppleIcon /> : <ShopIcon />,
					color: s.store === 'APP_STORE' ? '#007AFF' : '#34A853',
					bg: s.store === 'APP_STORE' ? '#f0f4ff' : '#f0fdf4',
					suffix: `(${s.averageRating.toFixed(1)})`,
				})),
			]
		: [];

	const ratingChartData =
		stats?.ratingDistribution
			?.map((d) => ({
				name: `${'★'.repeat(d.rating)}`,
				rating: d.rating,
				count: d.count,
			}))
			.reverse() || [];

	const storeChartData =
		stats?.byStore?.map((s) => ({
			name: s.store === 'APP_STORE' ? 'App Store' : 'Play Store',
			value: s.count,
			store: s.store,
			averageRating: s.averageRating,
		})) || [];

	return (
		<Box className="space-y-4">
			{/* KPI 카드 */}
			<Grid container spacing={2}>
				{loading
					? Array.from({ length: 4 }).map((_, i) => (
							<Grid item xs={12} sm={6} md={3} key={i}>
								<Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
							</Grid>
						))
					: kpiCards.map((card) => (
							<Grid item xs={12} sm={6} md={3} key={card.label}>
								<Card
									sx={{
										borderTop: `3px solid ${card.color}`,
										cursor: card.label.includes('Store') ? 'pointer' : 'default',
										'&:hover': card.label.includes('Store')
											? { boxShadow: 4, transform: 'translateY(-2px)', transition: 'all 0.2s' }
											: {},
									}}
									onClick={() => {
										if (card.label === 'App Store') onChartClick({ store: 'APP_STORE' });
										if (card.label === 'Play Store') onChartClick({ store: 'PLAY_STORE' });
									}}
								>
									<CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
										<Box className="flex items-center gap-3">
											<Box
												sx={{
													p: 1,
													borderRadius: 2,
													backgroundColor: card.bg,
													color: card.color,
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
												}}
											>
												{card.icon}
											</Box>
											<Box>
												<Typography variant="body2" color="text.secondary">
													{card.label}
												</Typography>
												<Box className="flex items-baseline gap-1">
													<Typography variant="h5" fontWeight="bold">
														{card.value}
													</Typography>
													{card.suffix && (
														<Typography variant="caption" color="text.secondary">
															{card.suffix}
														</Typography>
													)}
												</Box>
											</Box>
										</Box>
									</CardContent>
								</Card>
							</Grid>
						))}
			</Grid>

			{/* 차트 영역 */}
			<Grid container spacing={2}>
				{/* 별점 분포 */}
				<Grid item xs={12} md={7}>
					<Card>
						<CardContent>
							<Box className="flex items-center justify-between mb-4">
								<Typography variant="h6" fontWeight={600}>
									별점 분포
								</Typography>
								<Chip
									icon={<TrendingUpIcon sx={{ fontSize: 16 }} />}
									label="클릭하여 필터링"
									size="small"
									variant="outlined"
									color="primary"
								/>
							</Box>
							{loading ? (
								<Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
							) : (
								<ResponsiveContainer width="100%" height={300}>
									<BarChart
										data={ratingChartData}
										margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
										layout="vertical"
									>
										<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
										<XAxis
											type="number"
											tick={{ fontSize: 12, fill: '#6b7280' }}
											axisLine={false}
											tickLine={false}
										/>
										<YAxis
											dataKey="name"
											type="category"
											tick={{ fontSize: 14 }}
											axisLine={false}
											tickLine={false}
											width={80}
										/>
										<Tooltip
											contentStyle={{
												backgroundColor: '#fff',
												border: '1px solid #e5e7eb',
												borderRadius: 8,
												boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
											}}
											formatter={(value: number) => [`${value}건`, '리뷰 수']}
										/>
										<Bar
											dataKey="count"
											radius={[0, 6, 6, 0]}
											cursor="pointer"
											onClick={(data) => {
												if (data?.rating) onChartClick({ rating: data.rating });
											}}
										>
											{ratingChartData.map((entry) => (
												<Cell
													key={`cell-${entry.rating}`}
													fill={RATING_COLORS[entry.rating - 1]}
												/>
											))}
										</Bar>
									</BarChart>
								</ResponsiveContainer>
							)}
						</CardContent>
					</Card>
				</Grid>

				{/* 스토어 비교 */}
				<Grid item xs={12} md={5}>
					<Card sx={{ height: '100%' }}>
						<CardContent>
							<Typography variant="h6" fontWeight={600} className="mb-4">
								스토어 비교
							</Typography>
							{loading ? (
								<Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
							) : (
								<ResponsiveContainer width="100%" height={300}>
									<PieChart>
										<Pie
											data={storeChartData}
											cx="50%"
											cy="45%"
											innerRadius={60}
											outerRadius={100}
											paddingAngle={4}
											dataKey="value"
											cursor="pointer"
											onClick={(data) => {
												if (data?.store) onChartClick({ store: data.store });
											}}
										>
											{storeChartData.map((_, index) => (
												<Cell key={`cell-${index}`} fill={STORE_COLORS[index % STORE_COLORS.length]} />
											))}
										</Pie>
										<Tooltip
											contentStyle={{
												backgroundColor: '#fff',
												border: '1px solid #e5e7eb',
												borderRadius: 8,
												boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
											}}
											formatter={(value: number, _: any, entry: any) => [
												`${value}건 (평점 ${entry.payload.averageRating.toFixed(1)})`,
												entry.payload.name,
											]}
										/>
										<Legend
											verticalAlign="bottom"
											height={36}
											formatter={(value: string) => (
												<span style={{ color: '#374151', fontSize: 13 }}>{value}</span>
											)}
										/>
									</PieChart>
								</ResponsiveContainer>
							)}
						</CardContent>
					</Card>
				</Grid>
			</Grid>

			{/* 마지막 수집 시각 */}
			{stats?.lastCollectedAt && (
				<Typography variant="caption" color="text.secondary" className="text-right block">
					마지막 수집: {new Date(stats.lastCollectedAt).toLocaleString('ko-KR')}
				</Typography>
			)}
		</Box>
	);
}
