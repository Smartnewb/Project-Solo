"use client";
import { Card } from "@heroui/react";
import { useState, useEffect } from "react";
import { Pie, Bar } from "react-chartjs-2";
import "@/app/utils/chartConfig";
import { format } from "date-fns";
interface TrafficSourceAnalyticsProps {
	startDate: Date | null;
	endDate: Date | null;
	trafficSources: Array<{
		source: string;
		sessions: number;
	}>;
	period: {
		startDate: string;
		endDate: string;
	};
}
export default function TrafficSourceAnalytics({
	startDate,
	endDate,
	trafficSources,
	period,
}: TrafficSourceAnalyticsProps) {
	const [isLoading, setIsLoading] = useState(false);
	// 데이터가 없거나 형식이 잘못된 경우
	if (
		!trafficSources ||
		!Array.isArray(trafficSources) ||
		trafficSources.length === 0
	) {
		return (
			<div className="flex justify-center items-center p-8 bg-white rounded-lg shadow">
				<h2 className={"text-lg font-semibold text-neutral-900"}>
					트래픽 소스 데이터를 불러올 수 없습니다. 다시 시도해주세요.
				</h2>
			</div>
		);
	}
	// 상위 10개 소스만 사용하고 나머지는 '기타'로 통합
	const topSources = [...trafficSources]
		.sort((a, b) => b.sessions - a.sessions)
		.slice(0, 10);
	// 총 세션 수 계산
	const totalSessions = trafficSources.reduce(
		(sum, item) => sum + item.sessions,
		0,
	);
	// 차트 데이터 준비
	const pieChartData = {
		labels: topSources.map((item) => item.source),
		datasets: [
			{
				label: "세션 수",
				data: topSources.map((item) => item.sessions),
				backgroundColor: [
					"rgba(255, 99, 132, 0.6)",
					"rgba(54, 162, 235, 0.6)",
					"rgba(255, 206, 86, 0.6)",
					"rgba(75, 192, 192, 0.6)",
					"rgba(153, 102, 255, 0.6)",
					"rgba(255, 159, 64, 0.6)",
					"rgba(199, 199, 199, 0.6)",
					"rgba(83, 102, 255, 0.6)",
					"rgba(128, 0, 128, 0.6)",
					"rgba(0, 128, 0, 0.6)",
				],
				borderColor: [
					"rgb(255, 99, 132)",
					"rgb(54, 162, 235)",
					"rgb(255, 206, 86)",
					"rgb(75, 192, 192)",
					"rgb(153, 102, 255)",
					"rgb(255, 159, 64)",
					"rgb(199, 199, 199)",
					"rgb(83, 102, 255)",
					"rgb(128, 0, 128)",
					"rgb(0, 128, 0)",
				],
				borderWidth: 1,
			},
		],
	};
	const barChartData = {
		labels: topSources.map((item) => item.source),
		datasets: [
			{
				label: "세션 수",
				data: topSources.map((item) => item.sessions),
				backgroundColor: "rgba(75, 192, 192, 0.6)",
				borderColor: "rgb(75, 192, 192)",
				borderWidth: 1,
			},
		],
	};
	return (
		<div className="space-y-6">
			<div className={"grid grid-cols-12 gap-4"}>
				<div className={"min-w-0 col-span-12 md:col-span-6"}>
					<Card>
						<Card.Content>
							<h2 className={"text-lg font-semibold text-neutral-900"}>
								트래픽 소스별 세션 분포
							</h2>
							<div className="h-80 flex items-center justify-center">
								<div className="w-4/5 h-full">
									<Pie
										data={pieChartData}
										options={{
											responsive: true,
											maintainAspectRatio: false,
										}}
									/>
								</div>
							</div>
						</Card.Content>
					</Card>
				</div>
				<div className={"min-w-0 col-span-12 md:col-span-6"}>
					<Card>
						<Card.Content>
							<h2 className={"text-lg font-semibold text-neutral-900"}>
								트래픽 소스별 신규/기존 사용자
							</h2>
							<div className="h-80">
								<Bar
									data={barChartData}
									options={{
										responsive: true,
										maintainAspectRatio: false,
										scales: {
											x: {
												stacked: true,
											},
											y: {
												stacked: true,
												beginAtZero: true,
											},
										},
									}}
								/>
							</div>
						</Card.Content>
					</Card>
				</div>
				<div className={"min-w-0 col-span-12"}>
					<Card>
						<Card.Content>
							<h2 className={"text-lg font-semibold text-neutral-900"}>
								트래픽 소스 상세 분석
							</h2>
							<div className="mb-4 p-4 bg-blue-50 rounded-lg">
								<p
									className={["font-bold", "text-sm text-neutral-700"]
										.filter(Boolean)
										.join(" ")}
								>
									분석 기간: {period.startDate}~ {period.endDate}
								</p>
								<p
									className={["font-bold mt-2", "text-sm text-neutral-700"]
										.filter(Boolean)
										.join(" ")}
								>
									총 세션 수: {totalSessions.toLocaleString()}
								</p>
							</div>
							<div className={"overflow-x-auto"}>
								<table
									className={
										"w-full text-sm text-left [&_td]:p-3 [&_th]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
									}
								>
									<thead>
										<tr>
											<th scope="col">소스</th>
											<th scope="col" style={{ textAlign: "right" }}>
												세션
											</th>
											<th scope="col" style={{ textAlign: "right" }}>
												비율
											</th>
										</tr>
									</thead>
									<tbody>
										{trafficSources.map((source, index) => (
											<tr key={index}>
												<td>{source.source}</td>
												<td style={{ textAlign: "right" }}>
													{source.sessions.toLocaleString()}
												</td>
												<td style={{ textAlign: "right" }}>
													{((source.sessions / totalSessions) * 100).toFixed(1)}
													%
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</Card.Content>
					</Card>
				</div>
			</div>
		</div>
	);
}
