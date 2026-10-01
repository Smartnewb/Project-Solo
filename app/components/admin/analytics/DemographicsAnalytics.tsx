"use client";
import { Card, Tabs } from "@heroui/react";
import { useState } from "react";
import { Pie } from "react-chartjs-2";
import "@/app/utils/chartConfig";
interface DemographicsAnalyticsProps {
	startDate: Date | null;
	endDate: Date | null;
	demographics: {
		countries: Array<{
			country: string;
			users: number;
		}>;
		languages: Array<{
			language: string;
			users: number;
		}>;
		cities: Array<{
			city: string;
			users: number;
		}>;
		period: {
			startDate: string;
			endDate: string;
		};
	} | null;
}
export default function DemographicsAnalytics({
	startDate,
	endDate,
	demographics,
}: DemographicsAnalyticsProps) {
	const [activeTab, setActiveTab] = useState(0);
	// 데이터가 없거나 형식이 잘못된 경우
	if (!demographics) {
		return (
			<div className="flex justify-center items-center p-8 bg-white rounded-lg shadow">
				<h2 className={"text-lg font-semibold text-neutral-900"}>
					사용자 인구통계 데이터를 불러올 수 없습니다. 다시 시도해주세요.
				</h2>
			</div>
		);
	}
	// 총 사용자 수 계산
	const totalCountryUsers = demographics.countries.reduce(
		(sum, item) => sum + item.users,
		0,
	);
	const totalLanguageUsers = demographics.languages.reduce(
		(sum, item) => sum + item.users,
		0,
	);
	const totalCityUsers = demographics.cities.reduce(
		(sum, item) => sum + item.users,
		0,
	);
	// 국가별 차트 데이터
	const countryChartData = {
		labels: demographics.countries.map((item) => item.country),
		datasets: [
			{
				label: "사용자 수",
				data: demographics.countries.map((item) => item.users),
				backgroundColor: [
					"rgba(255, 99, 132, 0.6)",
					"rgba(54, 162, 235, 0.6)",
					"rgba(255, 206, 86, 0.6)",
					"rgba(75, 192, 192, 0.6)",
					"rgba(153, 102, 255, 0.6)",
					"rgba(255, 159, 64, 0.6)",
				],
				borderColor: [
					"rgb(255, 99, 132)",
					"rgb(54, 162, 235)",
					"rgb(255, 206, 86)",
					"rgb(75, 192, 192)",
					"rgb(153, 102, 255)",
					"rgb(255, 159, 64)",
				],
				borderWidth: 1,
			},
		],
	};
	// 언어별 차트 데이터
	const languageChartData = {
		labels: demographics.languages.map((item) => item.language),
		datasets: [
			{
				label: "사용자 수",
				data: demographics.languages.map((item) => item.users),
				backgroundColor: [
					"rgba(54, 162, 235, 0.6)",
					"rgba(255, 99, 132, 0.6)",
					"rgba(255, 206, 86, 0.6)",
					"rgba(75, 192, 192, 0.6)",
					"rgba(153, 102, 255, 0.6)",
					"rgba(255, 159, 64, 0.6)",
				],
				borderColor: [
					"rgb(54, 162, 235)",
					"rgb(255, 99, 132)",
					"rgb(255, 206, 86)",
					"rgb(75, 192, 192)",
					"rgb(153, 102, 255)",
					"rgb(255, 159, 64)",
				],
				borderWidth: 1,
			},
		],
	};
	// 도시별 차트 데이터 (상위 5개만)
	const cityChartData = {
		labels: demographics.cities.slice(0, 5).map((item) => item.city),
		datasets: [
			{
				label: "사용자 수",
				data: demographics.cities.slice(0, 5).map((item) => item.users),
				backgroundColor: [
					"rgba(75, 192, 192, 0.6)",
					"rgba(255, 99, 132, 0.6)",
					"rgba(54, 162, 235, 0.6)",
					"rgba(255, 206, 86, 0.6)",
					"rgba(153, 102, 255, 0.6)",
				],
				borderColor: [
					"rgb(75, 192, 192)",
					"rgb(255, 99, 132)",
					"rgb(54, 162, 235)",
					"rgb(255, 206, 86)",
					"rgb(153, 102, 255)",
				],
				borderWidth: 1,
			},
		],
	};
	return (
		<div className="space-y-6">
			<div className="mb-4 p-4 bg-blue-50 rounded-lg">
				<p
					className={["font-bold", "text-sm text-neutral-700"]
						.filter(Boolean)
						.join(" ")}
				>
					분석 기간: {demographics.period.startDate}~{" "}
					{demographics.period.endDate}
				</p>
			</div>

			<Tabs
				selectedKey={activeTab}
				onSelectionChange={(key) => setActiveTab(Number(key))}
			>
				<Tabs.List aria-label="인구통계 분류">
					<Tabs.Tab id={0}>{"국가"}</Tabs.Tab>
					<Tabs.Tab id={1}>{"언어"}</Tabs.Tab>
					<Tabs.Tab id={2}>{"도시"}</Tabs.Tab>
				</Tabs.List>

				<Tabs.Panel id={0}>
					<div className={"grid grid-cols-12 gap-4"}>
						<div className={"min-w-0 col-span-12 md:col-span-6"}>
							<Card>
								<Card.Content>
									<h2 className={"text-lg font-semibold text-neutral-900"}>
										국가별 사용자 분포
									</h2>
									<div className="h-80 flex items-center justify-center">
										<div className="w-4/5 h-full">
											<Pie
												data={countryChartData}
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
										국가별 사용자 통계
									</h2>
									<div className={"overflow-x-auto"}>
										<table
											className={
												"w-full text-sm text-left [&_td]:p-3 [&_th]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
											}
										>
											<thead>
												<tr>
													<th scope="col">국가</th>
													<th scope="col" style={{ textAlign: "right" }}>
														사용자 수
													</th>
													<th scope="col" style={{ textAlign: "right" }}>
														비율
													</th>
												</tr>
											</thead>
											<tbody>
												{demographics.countries.map((item, index) => (
													<tr key={index}>
														<td>{item.country}</td>
														<td style={{ textAlign: "right" }}>
															{item.users.toLocaleString()}
														</td>
														<td style={{ textAlign: "right" }}>
															{((item.users / totalCountryUsers) * 100).toFixed(
																1,
															)}
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
				</Tabs.Panel>

				<Tabs.Panel id={1}>
					<div className={"grid grid-cols-12 gap-4"}>
						<div className={"min-w-0 col-span-12 md:col-span-6"}>
							<Card>
								<Card.Content>
									<h2 className={"text-lg font-semibold text-neutral-900"}>
										언어별 사용자 분포
									</h2>
									<div className="h-80 flex items-center justify-center">
										<div className="w-4/5 h-full">
											<Pie
												data={languageChartData}
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
										언어별 사용자 통계
									</h2>
									<div className={"overflow-x-auto"}>
										<table
											className={
												"w-full text-sm text-left [&_td]:p-3 [&_th]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
											}
										>
											<thead>
												<tr>
													<th scope="col">언어</th>
													<th scope="col" style={{ textAlign: "right" }}>
														사용자 수
													</th>
													<th scope="col" style={{ textAlign: "right" }}>
														비율
													</th>
												</tr>
											</thead>
											<tbody>
												{demographics.languages.map((item, index) => (
													<tr key={index}>
														<td>{item.language}</td>
														<td style={{ textAlign: "right" }}>
															{item.users.toLocaleString()}
														</td>
														<td style={{ textAlign: "right" }}>
															{(
																(item.users / totalLanguageUsers) *
																100
															).toFixed(1)}
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
				</Tabs.Panel>

				<Tabs.Panel id={2}>
					<div className={"grid grid-cols-12 gap-4"}>
						<div className={"min-w-0 col-span-12 md:col-span-6"}>
							<Card>
								<Card.Content>
									<h2 className={"text-lg font-semibold text-neutral-900"}>
										도시별 사용자 분포 (상위 5개)
									</h2>
									<div className="h-80 flex items-center justify-center">
										<div className="w-4/5 h-full">
											<Pie
												data={cityChartData}
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
										도시별 사용자 통계
									</h2>
									<div className={"overflow-x-auto"}>
										<table
											className={
												"w-full text-sm text-left [&_td]:p-3 [&_th]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
											}
										>
											<thead>
												<tr>
													<th scope="col">도시</th>
													<th scope="col" style={{ textAlign: "right" }}>
														사용자 수
													</th>
													<th scope="col" style={{ textAlign: "right" }}>
														비율
													</th>
												</tr>
											</thead>
											<tbody>
												{demographics.cities.map((item, index) => (
													<tr key={index}>
														<td>{item.city}</td>
														<td style={{ textAlign: "right" }}>
															{item.users.toLocaleString()}
														</td>
														<td style={{ textAlign: "right" }}>
															{((item.users / totalCityUsers) * 100).toFixed(1)}
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
				</Tabs.Panel>
			</Tabs>
		</div>
	);
}
