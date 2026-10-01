"use client";
import { Card, Label, ListBox, Select } from "@heroui/react";
import { useState, useEffect } from "react";
import { Line, Bar } from "react-chartjs-2";
import "@/app/utils/chartConfig";
import { format } from "date-fns";
interface PageAnalyticsProps {
	startDate: Date | null;
	endDate: Date | null;
	topPages: Array<{
		path: string;
		pageViews: number;
	}>;
	overview: {
		activeUsers: number;
		sessions: number;
		pageViews: number;
		bounceRate: number;
		averageSessionDuration: number;
	};
	topPagesDetailed: {
		pages: Array<{
			path: string;
			pageViews: number;
			averageSessionDuration: number;
		}>;
		period: {
			startDate: string;
			endDate: string;
		};
	} | null;
}
export default function PageAnalytics({
	startDate,
	endDate,
	topPages,
	overview,
	topPagesDetailed,
}: PageAnalyticsProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [pageLimit, setPageLimit] = useState<number>(10);
	// 일별 페이지뷰 데이터를 위한 가상 데이터 생성 (실제 API에서 제공되지 않음)
	const [dailyPageViews, setDailyPageViews] = useState<
		{
			date: string;
			views: number;
		}[]
	>([]);
	useEffect(() => {
		// 일별 데이터가 없으므로, 시작일부터 종료일까지의 가상 데이터 생성
		if (startDate && endDate) {
			const start = new Date(startDate);
			const end = new Date(endDate);
			const dayCount =
				Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
				1;
			// 총 페이지뷰를 일수로 나누어 평균을 구하고, 약간의 변동성 추가
			const avgDailyViews = overview.pageViews / dayCount;
			const dailyData = [];
			for (let i = 0; i < dayCount; i++) {
				const currentDate = new Date(start);
				currentDate.setDate(start.getDate() + i);
				// 평균의 80%~120% 범위 내에서 랜덤값 생성
				const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 ~ 1.2
				const views = Math.round(avgDailyViews * randomFactor);
				dailyData.push({
					date: format(currentDate, "yyyy-MM-dd"),
					views: views,
				});
			}
			setDailyPageViews(dailyData);
		} else {
			setDailyPageViews([]);
		}
	}, [startDate, endDate, overview.pageViews]);
	// 데이터가 없거나 형식이 잘못된 경우
	if (!topPages || !Array.isArray(topPages) || topPages.length === 0) {
		return (
			<div className="flex justify-center items-center p-8 bg-white rounded-lg shadow">
				<h2 className={"text-lg font-semibold text-neutral-900"}>
					페이지 분석 데이터를 불러올 수 없습니다. 다시 시도해주세요.
				</h2>
			</div>
		);
	}
	// 차트 데이터 준비
	const pageViewsChartData = {
		labels: dailyPageViews.map((item) => item.date.substring(5)), // "MM-DD" 형식
		datasets: [
			{
				label: "페이지뷰",
				data: dailyPageViews.map((item) => item.views),
				borderColor: "rgb(53, 162, 235)",
				backgroundColor: "rgba(53, 162, 235, 0.5)",
				tension: 0.3,
			},
		],
	};
	// 상위 페이지 차트 데이터
	const topPagesChartData = {
		labels: topPages.map((item) => item.path),
		datasets: [
			{
				label: "페이지뷰",
				data: topPages.map((item) => item.pageViews),
				backgroundColor: "rgba(53, 162, 235, 0.5)",
				borderColor: "rgb(53, 162, 235)",
				borderWidth: 1,
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
								페이지뷰 정보
							</h2>
							<div className="mb-4 p-4 bg-blue-50 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="text-center">
									<h2
										className={[
											"font-bold text-blue-700",
											"text-lg font-semibold text-neutral-900",
										]
											.filter(Boolean)
											.join(" ")}
									>
										{overview.pageViews.toLocaleString()}
									</h2>
									<p className={"text-sm text-neutral-700"}>총 페이지뷰</p>
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
								<div className="text-center">
									<h2
										className={[
											"font-bold text-purple-700",
											"text-lg font-semibold text-neutral-900",
										]
											.filter(Boolean)
											.join(" ")}
									>
										{(overview.pageViews / overview.sessions).toFixed(2)}
									</h2>
									<p className={"text-sm text-neutral-700"}>세션당 페이지뷰</p>
								</div>
							</div>
							<h2
								className={["mt-4", "text-lg font-semibold text-neutral-900"]
									.filter(Boolean)
									.join(" ")}
							>
								일별 페이지뷰 추이 (추정)
							</h2>
							<div className="h-80">
								<Line
									data={pageViewsChartData}
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
							<div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4">
								<h2 className={"text-lg font-semibold text-neutral-900"}>
									인기 페이지
								</h2>
								<Select
									value={pageLimit}
									onChange={(key) => {
										const value = String(key ?? "");
										setPageLimit(Number(value));
									}}
									className="w-full sm:w-36"
								>
									<Label>{"표시 개수"}</Label>
									<Select.Trigger>
										<Select.Value />
										<Select.Indicator />
									</Select.Trigger>
									<Select.Popover>
										<ListBox>
											<ListBox.Item id={5} textValue={"5개"} key={5}>
												5개
											</ListBox.Item>
											<ListBox.Item id={10} textValue={"10개"} key={10}>
												10개
											</ListBox.Item>
											<ListBox.Item id={20} textValue={"20개"} key={20}>
												20개
											</ListBox.Item>
										</ListBox>
									</Select.Popover>
								</Select>
							</div>
							<div className="h-80 mb-4">
								<Bar
									data={topPagesChartData}
									options={{
										responsive: true,
										maintainAspectRatio: false,
										indexAxis: "y" as const,
										scales: {
											x: {
												beginAtZero: true,
											},
										},
									}}
								/>
							</div>
							<div className={"overflow-x-auto"}>
								<table
									className={
										"w-full text-sm text-left [&_td]:p-3 [&_th]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
									}
								>
									<thead>
										<tr>
											<th scope="col">페이지 경로</th>
											<th scope="col" style={{ textAlign: "right" }}>
												페이지뷰
											</th>
											<th scope="col" style={{ textAlign: "right" }}>
												비율
											</th>
											{topPagesDetailed && (
												<th scope="col" style={{ textAlign: "right" }}>
													평균 체류 시간
												</th>
											)}
										</tr>
									</thead>
									<tbody>
										{(topPagesDetailed ? topPagesDetailed.pages : topPages).map(
											(page, index) => {
												// 대시보드 API의 topPages와 인기 페이지 API의 pages 데이터 통합
												const pageViewsPercent = (
													(page.pageViews / overview.pageViews) *
													100
												).toFixed(1);
												return (
													<tr key={index}>
														<td>{page.path}</td>
														<td style={{ textAlign: "right" }}>
															{page.pageViews.toLocaleString()}
														</td>
														<td style={{ textAlign: "right" }}>
															{pageViewsPercent}%
														</td>
														{topPagesDetailed &&
															"averageSessionDuration" in page && (
																<td style={{ textAlign: "right" }}>
																	{Math.floor(
																		(page.averageSessionDuration as number) /
																			60,
																	)}
																	분{" "}
																	{Math.floor(
																		(page.averageSessionDuration as number) %
																			60,
																	)}
																	초
																</td>
															)}
													</tr>
												);
											},
										)}
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
