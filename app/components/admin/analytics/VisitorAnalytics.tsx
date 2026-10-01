"use client";
import { Card } from "@heroui/react";
import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import "@/app/utils/chartConfig";
import { format, subDays } from "date-fns";
interface VisitorAnalyticsProps {
	startDate: Date | null;
	endDate: Date | null;
	dailyUsers: Array<{
		date: string;
		users: number;
	}>;
	overview: {
		activeUsers: number;
		sessions: number;
		pageViews: number;
		bounceRate: number;
		averageSessionDuration: number;
	};
	userEngagement: {
		engagementDuration: number;
		engagedSessions: number;
		engagementRate: number;
		averageSessionDuration: number;
		period: {
			startDate: string;
			endDate: string;
		};
	} | null;
	dailyTraffic?: {
		dailyData: Array<{
			date: string;
			activeUsers: number;
			sessions: number;
			pageViews: number;
		}>;
		period: {
			startDate: string;
			endDate: string;
		};
	} | null;
}
export default function VisitorAnalytics({
	startDate,
	endDate,
	dailyUsers,
	overview,
	userEngagement,
	dailyTraffic,
}: VisitorAnalyticsProps) {
	const [isLoading, setIsLoading] = useState(false);
	// 데이터가 없거나 형식이 잘못된 경우
	if (!dailyUsers || !Array.isArray(dailyUsers) || dailyUsers.length === 0) {
		return (
			<div className="flex justify-center items-center p-8 bg-white rounded-lg shadow">
				<h2 className={"text-lg font-semibold text-neutral-900"}>
					방문자 분석 데이터를 불러올 수 없습니다. 다시 시도해주세요.
				</h2>
			</div>
		);
	}
	// 일별 트래픽 데이터가 있는 경우 해당 데이터 사용, 없으면 대시보드 API의 dailyUsers 사용
	const dailyData =
		dailyTraffic?.dailyData ||
		dailyUsers.map((item) => ({
			date: item.date,
			activeUsers: item.users,
			sessions: 0,
			pageViews: 0,
		}));
	// 차트 데이터 준비
	const dailyUsersChartData = {
		labels: dailyData.map((item) => item.date.substring(5)), // "MM-DD" 형식
		datasets: [
			{
				label: "활성 사용자",
				data: dailyData.map((item) => item.activeUsers),
				borderColor: "rgb(53, 162, 235)",
				backgroundColor: "rgba(53, 162, 235, 0.5)",
				tension: 0.3,
			},
		],
	};
	// 세션 및 페이지뷰 차트 데이터
	const trafficChartData = {
		labels: dailyData.map((item) => item.date.substring(5)), // "MM-DD" 형식
		datasets: [
			{
				label: "세션 수",
				data: dailyData.map((item) => item.sessions),
				borderColor: "rgb(255, 99, 132)",
				backgroundColor: "rgba(255, 99, 132, 0.5)",
				tension: 0.3,
				yAxisID: "y",
			},
			{
				label: "페이지뷰",
				data: dailyData.map((item) => item.pageViews),
				borderColor: "rgb(75, 192, 192)",
				backgroundColor: "rgba(75, 192, 192, 0.5)",
				tension: 0.3,
				yAxisID: "y1",
			},
		],
	};
	return (
		<div className="space-y-6">
			<div className={"grid grid-cols-12 gap-4"}>
				<div className={"min-w-0 col-span-12"}>
					<Card>
						<Card.Content>
							<h2 className={"text-lg font-semibold text-neutral-900"}>
								일별 활성 사용자 추이
							</h2>
							<div className="h-80">
								<Line
									data={dailyUsersChartData}
									options={{
										responsive: true,
										maintainAspectRatio: false,
										scales: {
											y: {
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
								일별 세션 및 페이지뷰 추이
							</h2>
							<div className="h-80">
								<Line
									data={trafficChartData}
									options={{
										responsive: true,
										maintainAspectRatio: false,
										scales: {
											y: {
												display: true,
												position: "left",
												beginAtZero: true,
												title: {
													display: true,
													text: "세션 수",
												},
											},
											y1: {
												display: true,
												position: "right",
												beginAtZero: true,
												grid: {
													drawOnChartArea: false,
												},
												title: {
													display: true,
													text: "페이지뷰",
												},
											},
										},
									}}
								/>
							</div>
						</Card.Content>
					</Card>
				</div>
				<div className={"min-w-0 col-span-12 md:col-span-6"}>
					<Card>
						<Card.Content>
							<h2 className={"text-lg font-semibold text-neutral-900"}>
								사용자 통계 요약
							</h2>
							<div className="p-4 bg-blue-50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="text-center">
									<h2
										className={[
											"font-bold text-blue-700",
											"text-lg font-semibold text-neutral-900",
										]
											.filter(Boolean)
											.join(" ")}
									>
										{overview.activeUsers.toLocaleString()}
									</h2>
									<p className={"text-sm text-neutral-700"}>활성 사용자</p>
								</div>
								<div className="text-center">
									<h2
										className={[
											"font-bold text-green-700",
											"text-lg font-semibold text-neutral-900",
										]
											.filter(Boolean)
											.join(" ")}
									>
										{overview.sessions.toLocaleString()}
									</h2>
									<p className={"text-sm text-neutral-700"}>총 세션 수</p>
								</div>
							</div>
						</Card.Content>
					</Card>
				</div>
				<div className={"min-w-0 col-span-12 md:col-span-6"}>
					<Card>
						<Card.Content>
							<h2 className={"text-lg font-semibold text-neutral-900"}>
								사용자 참여도 지표
							</h2>
							<div className={"overflow-x-auto"}>
								<table
									className={
										"w-full text-sm text-left [&_td]:p-3 [&_th]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
									}
								>
									<thead>
										<tr>
											<th scope="col">지표</th>
											<th scope="col" style={{ textAlign: "right" }}>
												값
											</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>평균 세션 시간</td>
											<td style={{ textAlign: "right" }}>
												{Math.floor(overview.averageSessionDuration / 60)}분{" "}
												{Math.floor(overview.averageSessionDuration % 60)}초
											</td>
										</tr>
										<tr>
											<td>이탈률</td>
											<td style={{ textAlign: "right" }}>
												{(overview.bounceRate * 100).toFixed(1)}%
											</td>
										</tr>
										{userEngagement && (
											<tr>
												<td>참여율</td>
												<td style={{ textAlign: "right" }}>
													{(userEngagement.engagementRate * 100).toFixed(1)}%
												</td>
											</tr>
										)}
										{userEngagement && (
											<tr>
												<td>참여 세션 수</td>
												<td style={{ textAlign: "right" }}>
													{userEngagement.engagedSessions.toLocaleString()}
												</td>
											</tr>
										)}
										<tr>
											<td>세션당 페이지뷰</td>
											<td style={{ textAlign: "right" }}>
												{(overview.pageViews / overview.sessions).toFixed(1)}
											</td>
										</tr>
										<tr>
											<td>총 페이지뷰</td>
											<td style={{ textAlign: "right" }}>
												{overview.pageViews.toLocaleString()}
											</td>
										</tr>
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
