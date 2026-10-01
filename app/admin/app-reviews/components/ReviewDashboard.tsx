"use client";
import { Button, Alert, Card, Chip, Skeleton } from "@heroui/react";
import { Apple, MessageSquare, Star, Store, TrendingUp } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
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
} from "recharts";
import AdminService, {
	type AppReviewStatsResponse,
} from "@/app/services/admin";
import { safeToLocaleString } from "@/app/utils/formatters";
interface ReviewDashboardProps {
	onChartClick: (filter: {
		rating?: number;
		store?: "APP_STORE" | "PLAY_STORE";
	}) => void;
}
const STORE_COLORS = ["#007AFF", "#34A853"];
const RATING_COLORS = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];
export default function ReviewDashboard({
	onChartClick,
}: ReviewDashboardProps) {
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
			setError(err.message || "통계를 불러오는데 실패했습니다.");
		} finally {
			setLoading(false);
		}
	}, []);
	useEffect(() => {
		fetchStats();
	}, [fetchStats]);
	if (error) {
		return (
			<Alert style={{ marginBottom: 16 }} status={"danger"}>
				<Alert.Content>{error}</Alert.Content>
			</Alert>
		);
	}
	const kpiCards = stats
		? [
				{
					label: "전체 리뷰",
					value: stats.totalCount.toLocaleString(),
					icon: <MessageSquare size={18} />,
					color: "#3b82f6",
					bg: "#eff6ff",
				},
				{
					label: "평균 별점",
					value: stats.averageRating.toFixed(1),
					icon: <Star size={18} />,
					color: "#eab308",
					bg: "#fefce8",
					suffix: "/ 5.0",
				},
				...(stats.byStore || []).map((s) => ({
					label: s.store === "APP_STORE" ? "App Store" : "Play Store",
					value: `${s.count.toLocaleString()}건`,
					icon:
						s.store === "APP_STORE" ? <Apple size={18} /> : <Store size={18} />,
					color: s.store === "APP_STORE" ? "#007AFF" : "#34A853",
					bg: s.store === "APP_STORE" ? "#f0f4ff" : "#f0fdf4",
					suffix: `(${s.averageRating.toFixed(1)})`,
				})),
			]
		: [];
	const ratingChartData =
		stats?.ratingDistribution
			?.map((d) => ({
				name: `${"★".repeat(d.rating)}`,
				rating: d.rating,
				count: d.count,
			}))
			.reverse() || [];
	const storeChartData =
		stats?.byStore?.map((s) => ({
			name: s.store === "APP_STORE" ? "App Store" : "Play Store",
			value: s.count,
			store: s.store,
			averageRating: s.averageRating,
		})) || [];
	return (
		<div className="space-y-4">
			{/* KPI 카드 */}
			<div className={"grid grid-cols-12 gap-4"}>
				{loading
					? Array.from({ length: 4 }).map((_, i) => (
							<div
								key={i}
								className={"min-w-0 col-span-12 sm:col-span-6 md:col-span-3"}
							>
								<Skeleton
									style={{
										...{ borderRadius: 16 },
										...{ width: "100%", height: 100 },
									}}
									className="rounded-xl"
								/>
							</div>
						))
					: kpiCards.map((card) => (
							<div
								key={card.label}
								className={"min-w-0 col-span-12 sm:col-span-6 md:col-span-3"}
							>
								<Card
									style={{
										borderTop: `3px solid ${card.color}`,
										cursor: card.label.includes("Store")
											? "pointer"
											: "default",
									}}
									className="relative"
								>
									{card.label.includes("Store") && (
										<Button
											variant="ghost"
											className="absolute inset-0 z-10 h-full w-full rounded-xl"
											aria-label={`${card.label} 리뷰 보기`}
											onPress={() => {
												if (card.label === "App Store")
													onChartClick({ store: "APP_STORE" });
												if (card.label === "Play Store")
													onChartClick({ store: "PLAY_STORE" });
											}}
										/>
									)}
									<Card.Content style={{ padding: 16 }}>
										<div className="flex items-center gap-3">
											<div
												style={{
													padding: 8,
													borderRadius: 16,
													backgroundColor: card.bg,
													color: card.color,
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
												}}
											>
												{card.icon}
											</div>
											<div>
												<p className={"text-sm text-neutral-700"}>
													{card.label}
												</p>
												<div className="flex items-baseline gap-1">
													<h2
														className={"text-lg font-semibold text-neutral-900"}
													>
														{card.value}
													</h2>
													{card.suffix && (
														<span className={"text-sm text-neutral-700"}>
															{card.suffix}
														</span>
													)}
												</div>
											</div>
										</div>
									</Card.Content>
								</Card>
							</div>
						))}
			</div>
			{!loading && ratingChartData.length > 0 && (
				<div
					aria-label="별점 리뷰 필터"
					className="flex flex-wrap items-center gap-2"
				>
					<span className="text-sm text-muted">별점별 리뷰 보기</span>
					{ratingChartData.map((entry) => (
						<Button
							key={entry.rating}
							variant="secondary"
							size="sm"
							onPress={() => onChartClick({ rating: entry.rating })}
						>
							{entry.rating}점 · {entry.count}건
						</Button>
					))}
				</div>
			)}
			{/* 차트 영역 */}
			<div className={"grid grid-cols-12 gap-4"}>
				{/* 별점 분포 */}
				<div className={"min-w-0 col-span-12 md:col-span-7"}>
					<Card>
						<Card.Content>
							<div className="flex items-center justify-between mb-4">
								<h2 className={"text-lg font-semibold text-neutral-900"}>
									별점 분포
								</h2>
								<Chip size={"sm"} variant={"soft"}>
									{<TrendingUp style={{ fontSize: 16 }} size={18} />}
									<Chip.Label>{"클릭하여 필터링"}</Chip.Label>
								</Chip>
							</div>
							{loading ? (
								<Skeleton
									style={{
										...{ borderRadius: 16 },
										...{ width: "100%", height: 300 },
									}}
									className="rounded-xl"
								/>
							) : (
								<ResponsiveContainer width="100%" height={300}>
									<BarChart
										data={ratingChartData}
										margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
										layout="vertical"
									>
										<CartesianGrid
											strokeDasharray="3 3"
											stroke="#e5e7eb"
											horizontal={false}
										/>
										<XAxis
											type="number"
											tick={{ fontSize: 12, fill: "#6b7280" }}
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
												backgroundColor: "#fff",
												border: "1px solid #e5e7eb",
												borderRadius: 8,
												boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
											}}
											formatter={(value: number) => [`${value}건`, "리뷰 수"]}
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
						</Card.Content>
					</Card>
				</div>
				{/* 스토어 비교 */}
				<div className={"min-w-0 col-span-12 md:col-span-5"}>
					<Card style={{ height: "100%" }}>
						<Card.Content>
							<h2
								className={["mb-4", "text-lg font-semibold text-neutral-900"]
									.filter(Boolean)
									.join(" ")}
							>
								스토어 비교
							</h2>
							{loading ? (
								<Skeleton
									style={{
										...{ borderRadius: 16 },
										...{ width: "100%", height: 300 },
									}}
									className="rounded-xl"
								/>
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
												<Cell
													key={`cell-${index}`}
													fill={STORE_COLORS[index % STORE_COLORS.length]}
												/>
											))}
										</Pie>
										<Tooltip
											contentStyle={{
												backgroundColor: "#fff",
												border: "1px solid #e5e7eb",
												borderRadius: 8,
												boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
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
												<span style={{ color: "#374151", fontSize: 13 }}>
													{value}
												</span>
											)}
										/>
									</PieChart>
								</ResponsiveContainer>
							)}
						</Card.Content>
					</Card>
				</div>
			</div>
			{/* 마지막 수집 시각 */}
			{stats?.lastCollectedAt && (
				<span
					className={["text-right block", "text-sm text-neutral-700"]
						.filter(Boolean)
						.join(" ")}
				>
					마지막 수집: {safeToLocaleString(stats.lastCollectedAt)}
				</span>
			)}
		</div>
	);
}
