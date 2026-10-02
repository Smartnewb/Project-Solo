"use client";
import { Button, ButtonGroup, Card, Skeleton } from "@heroui/react";
import { useState, useMemo } from "react";
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import {
	KpiTrend,
	KpiValue,
	KpiCategory,
	CATEGORIES,
	CATEGORY_CONFIG,
} from "../types";
interface KpiTrendChartProps {
	trends: KpiTrend[];
	kpis: KpiValue[];
	loading: boolean;
}
export default function KpiTrendChart({
	trends,
	kpis,
	loading,
}: KpiTrendChartProps) {
	const [selectedCategory, setSelectedCategory] =
		useState<KpiCategory>("acquisition");
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
	const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];
	const handleCategoryChange = (newCategory: KpiCategory | null) => {
		if (newCategory) setSelectedCategory(newCategory);
	};
	if (loading) {
		return (
			<Card>
				<Card.Content>
					<Skeleton
						style={{ ...{ marginBottom: 16 }, ...{ width: 200, height: 28 } }}
						className="rounded-xl"
					/>
					<Skeleton
						style={{
							...{ borderRadius: 16 },
							...{ width: "100%", height: 250 },
						}}
						className="rounded-xl"
					/>
				</Card.Content>
			</Card>
		);
	}
	return (
		<Card>
			<Card.Content>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						marginBottom: 16,
						flexWrap: "wrap",
						gap: 8,
					}}
				>
					<h2 className={"text-lg font-semibold text-neutral-900"}>
						4주 KPI 트렌드
					</h2>
					<ButtonGroup aria-label={"지표 필터"} className={"flex flex-wrap"}>
						{CATEGORIES.map((cat) => (
							<Button
								key={cat}
								style={{
									paddingLeft: 12,
									paddingRight: 12,
									paddingTop: 4,
									paddingBottom: 4,
									textTransform: "none",
									fontSize: "0.75rem",
								}}
								variant={selectedCategory === cat ? "primary" : "secondary"}
								aria-pressed={selectedCategory === cat}
								onPress={() => handleCategoryChange(cat)}
							>
								{CATEGORY_CONFIG[cat].icon}
								{CATEGORY_CONFIG[cat].label}
							</Button>
						))}
					</ButtonGroup>
				</div>
				{chartData.length === 0 ? (
					<div
						style={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							height: 250,
						}}
					>
						<p className={"text-sm text-neutral-700"}>
							선택한 카테고리의 트렌드 데이터가 없습니다.
						</p>
					</div>
				) : (
					<div style={{ width: "100%", height: 250 }}>
						<ResponsiveContainer>
							<AreaChart
								data={chartData}
								margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
							>
								<defs>
									{filteredTrends.map((trend, idx) => (
										<linearGradient
											key={trend.name}
											id={`gradient-kpi-${idx}`}
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop
												offset="5%"
												stopColor={CHART_COLORS[idx % CHART_COLORS.length]}
												stopOpacity={0.3}
											/>
											<stop
												offset="95%"
												stopColor={CHART_COLORS[idx % CHART_COLORS.length]}
												stopOpacity={0}
											/>
										</linearGradient>
									))}
								</defs>
								<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
								<XAxis
									dataKey="week"
									tick={{ fontSize: 12, fill: "#6b7280" }}
									axisLine={{ stroke: "#e5e7eb" }}
									tickLine={false}
								/>
								<YAxis
									tick={{ fontSize: 12, fill: "#6b7280" }}
									axisLine={false}
									tickLine={false}
									width={60}
									tickFormatter={(v: number) => v.toLocaleString()}
								/>
								<Tooltip
									contentStyle={{
										backgroundColor: "#fff",
										border: "1px solid #e5e7eb",
										borderRadius: 8,
										boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
									}}
								/>
								{filteredTrends.map((trend, idx) => (
									<Area
										key={trend.name}
										type="monotone"
										dataKey={trend.label}
										stroke={CHART_COLORS[idx % CHART_COLORS.length]}
										strokeWidth={2}
										fill={`url(#gradient-kpi-${idx})`}
									/>
								))}
							</AreaChart>
						</ResponsiveContainer>
					</div>
				)}
			</Card.Content>
		</Card>
	);
}
