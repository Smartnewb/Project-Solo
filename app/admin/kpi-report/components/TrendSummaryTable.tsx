"use client";
import { Card, Skeleton } from "@heroui/react";
import { KpiTrend, TREND_CONFIG } from "../types";
interface TrendSummaryTableProps {
	trends: KpiTrend[];
	loading: boolean;
}
export default function TrendSummaryTable({
	trends,
	loading,
}: TrendSummaryTableProps) {
	if (loading) {
		return (
			<Card>
				<Card.Content>
					<Skeleton
						style={{ ...{ marginBottom: 16 }, ...{ width: 160, height: 28 } }}
						className="rounded-xl"
					/>
					{[1, 2, 3, 4].map((i) => (
						<Skeleton
							key={i}
							style={{
								...{ marginBottom: 8, borderRadius: 8 },
								...{ width: "100%", height: 36 },
							}}
							className="rounded-xl"
						/>
					))}
				</Card.Content>
			</Card>
		);
	}
	if (trends.length === 0) return null;
	return (
		<Card>
			<Card.Content>
				<h2
					style={{ marginBottom: 16 }}
					className={"text-lg font-semibold text-neutral-900"}
				>
					4주 트렌드 요약
				</h2>
				<div className={"overflow-x-auto"}>
					<table
						className={
							"min-w-[520px] w-full text-sm text-left [&_td]:p-3 [&_th]:p-3 [&_td:nth-child(n+2)]:text-right [&_th:nth-child(n+2)]:text-right [&_thead]:bg-neutral-50 [&_tr]:border-b"
						}
					>
						<thead>
							<tr>
								<th style={{ fontWeight: 600 }} scope="col">
									KPI
								</th>
								{trends[0]?.points?.map((point, idx) => (
									<th key={idx} style={{ fontWeight: 600 }} scope="col">
										{point.weekLabel || `W${point.week}`}
									</th>
								))}
								<th style={{ fontWeight: 600 }} scope="col">
									방향
								</th>
								<th style={{ fontWeight: 600 }} scope="col">
									기울기
								</th>
							</tr>
						</thead>
						<tbody>
							{trends.map((trend) => {
								const trendConfig = TREND_CONFIG[trend.direction];
								return (
									<tr key={trend.name}>
										<td>
											<p className={"text-sm text-neutral-700"}>
												{trend.label}
											</p>
										</td>
										{trend.points.map((point, idx) => (
											<td key={idx}>
												<p className={"text-sm text-neutral-700"}>
													{point.value.toLocaleString()}
												</p>
											</td>
										))}
										<td>
											<span
												style={{
													color: trendConfig.color,
													fontWeight: "bold",
													fontSize: "1.2rem",
												}}
											>
												{trendConfig.arrow}
											</span>
											<span
												style={{ color: trendConfig.color, marginLeft: 4 }}
												className={"text-sm text-neutral-700"}
											>
												{trendConfig.label}
											</span>
										</td>
										<td>
											<p
												style={{ color: trendConfig.color }}
												className={"text-sm text-neutral-700"}
											>
												{trend.slope > 0 ? "+" : ""}
												{trend.slope.toFixed(2)}
											</p>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</Card.Content>
		</Card>
	);
}
