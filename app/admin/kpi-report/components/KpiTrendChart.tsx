'use client';

import { useState, useMemo } from 'react';
import {
	Box,
	Card,
	CardContent,
	Typography,
	ToggleButton,
	ToggleButtonGroup,
	Skeleton,
} from '@mui/material';
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from 'recharts';
import {
	KpiTrend,
	KpiValue,
	KpiCategory,
	CATEGORIES,
	CATEGORY_CONFIG,
} from '../types';

interface KpiTrendChartProps {
	trends: KpiTrend[];
	kpis: KpiValue[];
	loading: boolean;
}

export default function KpiTrendChart({ trends, kpis, loading }: KpiTrendChartProps) {
	const [selectedCategory, setSelectedCategory] = useState<KpiCategory>('acquisition');

	const nameToCategory = useMemo(() => {
		const map: Record<string, KpiCategory> = {};
		kpis.forEach((k) => {
			map[k.name] = k.category;
		});
		return map;
	}, [kpis]);

	const filteredTrends = useMemo(() => {
		return trends.filter((t) => {
			const cat = t.category || nameToCategory[t.name];
			return cat === selectedCategory;
		});
	}, [trends, selectedCategory, nameToCategory]);

	const chartData = useMemo(() => {
		if (filteredTrends.length === 0) return [];

		const maxPoints = filteredTrends[0]?.points?.length || 0;
		const data: Record<string, any>[] = [];

		for (let i = 0; i < maxPoints; i++) {
			const point: Record<string, any> = {
				week: filteredTrends[0]?.points[i]?.weekLabel || `W${i + 1}`,
			};
			filteredTrends.forEach((trend) => {
				if (trend.points[i]) {
					point[trend.label] = trend.points[i].value;
				}
			});
			data.push(point);
		}
		return data;
	}, [filteredTrends]);

	const config = CATEGORY_CONFIG[selectedCategory];
	const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

	const handleCategoryChange = (_: any, newCategory: KpiCategory | null) => {
		if (newCategory) setSelectedCategory(newCategory);
	};

	if (loading) {
		return (
			<Card>
				<CardContent>
					<Skeleton variant="text" width={200} height={28} sx={{ mb: 2 }} />
					<Skeleton variant="rectangular" height={250} sx={{ borderRadius: 2 }} />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardContent>
				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
					<Typography variant="h6" fontWeight={600}>
						4주 KPI 트렌드
					</Typography>
					<ToggleButtonGroup
						value={selectedCategory}
						exclusive
						onChange={handleCategoryChange}
						size="small"
					>
						{CATEGORIES.map((cat) => (
							<ToggleButton
								key={cat}
								value={cat}
								sx={{ px: 1.5, py: 0.5, textTransform: 'none', fontSize: '0.75rem' }}
							>
								{CATEGORY_CONFIG[cat].icon} {CATEGORY_CONFIG[cat].label}
							</ToggleButton>
						))}
					</ToggleButtonGroup>
				</Box>

				{chartData.length === 0 ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 250 }}>
						<Typography variant="body2" color="text.secondary">
							선택한 카테고리의 트렌드 데이터가 없습니다.
						</Typography>
					</Box>
				) : (
					<Box sx={{ width: '100%', height: 250 }}>
						<ResponsiveContainer>
							<AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
								<defs>
									{filteredTrends.map((trend, idx) => (
										<linearGradient
											key={trend.name}
											id={`gradient-kpi-${trend.name}`}
											x1="0" y1="0" x2="0" y2="1"
										>
											<stop offset="5%" stopColor={CHART_COLORS[idx % CHART_COLORS.length]} stopOpacity={0.3} />
											<stop offset="95%" stopColor={CHART_COLORS[idx % CHART_COLORS.length]} stopOpacity={0} />
										</linearGradient>
									))}
								</defs>
								<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
								<XAxis
									dataKey="week"
									tick={{ fontSize: 12, fill: '#6b7280' }}
									axisLine={{ stroke: '#e5e7eb' }}
									tickLine={false}
								/>
								<YAxis
									tick={{ fontSize: 12, fill: '#6b7280' }}
									axisLine={false}
									tickLine={false}
									width={60}
									tickFormatter={(v: number) => v.toLocaleString()}
								/>
								<Tooltip
									contentStyle={{
										backgroundColor: '#fff',
										border: '1px solid #e5e7eb',
										borderRadius: 8,
										boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
									}}
								/>
								{filteredTrends.map((trend, idx) => (
									<Area
										key={trend.name}
										type="monotone"
										dataKey={trend.label}
										stroke={CHART_COLORS[idx % CHART_COLORS.length]}
										strokeWidth={2}
										fill={`url(#gradient-kpi-${trend.name})`}
									/>
								))}
							</AreaChart>
						</ResponsiveContainer>
					</Box>
				)}
			</CardContent>
		</Card>
	);
}
