"use client";
import { Card } from "@heroui/react";
import { useState, useEffect } from "react";
import { Pie, Doughnut } from "react-chartjs-2";
import "@/app/utils/chartConfig";
import { format } from "date-fns";
interface DeviceAnalyticsProps {
	startDate: Date | null;
	endDate: Date | null;
	deviceCategories: Array<{
		category: string;
		users: number;
	}>;
	period: {
		startDate: string;
		endDate: string;
	};
	deviceDetail?: {
		deviceCategories: Array<{
			category: string;
			users: number;
		}>;
		browsers: Array<{
			browser: string;
			users: number;
		}>;
		operatingSystems: Array<{
			os: string;
			users: number;
		}>;
		period: {
			startDate: string;
			endDate: string;
		};
	} | null;
}
export default function DeviceAnalytics({
	startDate,
	endDate,
	deviceCategories,
	period,
	deviceDetail,
}: DeviceAnalyticsProps) {
	const [isLoading, setIsLoading] = useState(false);
	// 데이터가 없거나 형식이 잘못된 경우
	if (
		!deviceCategories ||
		!Array.isArray(deviceCategories) ||
		deviceCategories.length === 0
	) {
		return (
			<div className="flex justify-center items-center p-8 bg-white rounded-lg shadow">
				<h2 className={"text-lg font-semibold text-neutral-900"}>
					디바이스 데이터를 불러올 수 없습니다. 다시 시도해주세요.
				</h2>
			</div>
		);
	}
	// 상세 디바이스 정보가 있으면 해당 데이터 사용, 없으면 대시보드 API의 deviceCategories 사용
	const categories = deviceDetail?.deviceCategories || deviceCategories;
	const browsers = deviceDetail?.browsers || [];
	const operatingSystems = deviceDetail?.operatingSystems || [];
	// 총 사용자 수 계산
	const totalUsers = categories.reduce((sum, item) => sum + item.users, 0);
	const totalBrowserUsers = browsers.reduce((sum, item) => sum + item.users, 0);
	const totalOSUsers = operatingSystems.reduce(
		(sum, item) => sum + item.users,
		0,
	);
	// 디바이스 카테고리 차트 데이터
	const deviceCategoryChartData = {
		labels: categories.map((item) => item.category),
		datasets: [
			{
				label: "사용자 수",
				data: categories.map((item) => item.users),
				backgroundColor: [
					"rgba(255, 99, 132, 0.6)",
					"rgba(54, 162, 235, 0.6)",
					"rgba(255, 206, 86, 0.6)",
					"rgba(75, 192, 192, 0.6)",
				],
				borderColor: [
					"rgb(255, 99, 132)",
					"rgb(54, 162, 235)",
					"rgb(255, 206, 86)",
					"rgb(75, 192, 192)",
				],
				borderWidth: 1,
			},
		],
	};
	// 브라우저 차트 데이터 (상위 5개만)
	const browserChartData = {
		labels: browsers.slice(0, 5).map((item) => item.browser),
		datasets: [
			{
				label: "사용자 수",
				data: browsers.slice(0, 5).map((item) => item.users),
				backgroundColor: [
					"rgba(54, 162, 235, 0.6)",
					"rgba(255, 99, 132, 0.6)",
					"rgba(255, 206, 86, 0.6)",
					"rgba(75, 192, 192, 0.6)",
					"rgba(153, 102, 255, 0.6)",
				],
				borderColor: [
					"rgb(54, 162, 235)",
					"rgb(255, 99, 132)",
					"rgb(255, 206, 86)",
					"rgb(75, 192, 192)",
					"rgb(153, 102, 255)",
				],
				borderWidth: 1,
			},
		],
	};
	// 운영체제 차트 데이터
	const osChartData = {
		labels: operatingSystems.map((item) => item.os),
		datasets: [
			{
				label: "사용자 수",
				data: operatingSystems.map((item) => item.users),
				backgroundColor: [
					"rgba(255, 206, 86, 0.6)",
					"rgba(75, 192, 192, 0.6)",
					"rgba(153, 102, 255, 0.6)",
					"rgba(255, 159, 64, 0.6)",
					"rgba(54, 162, 235, 0.6)",
				],
				borderColor: [
					"rgb(255, 206, 86)",
					"rgb(75, 192, 192)",
					"rgb(153, 102, 255)",
					"rgb(255, 159, 64)",
					"rgb(54, 162, 235)",
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
					분석 기간: {deviceDetail?.period?.startDate || period.startDate}~{" "}
					{deviceDetail?.period?.endDate || period.endDate}
				</p>
				<p
					className={["font-bold mt-2", "text-sm text-neutral-700"]
						.filter(Boolean)
						.join(" ")}
				>
					총 사용자 수: {totalUsers.toLocaleString()}
				</p>
			</div>

			<div className={"grid grid-cols-12 gap-4"}>
				<div className={"min-w-0 col-span-12 md:col-span-4"}>
					<Card>
						<Card.Content>
							<h2 className={"text-lg font-semibold text-neutral-900"}>
								디바이스 카테고리
							</h2>
							<div className="h-80 flex items-center justify-center">
								<div className="w-4/5 h-full">
									<Pie
										data={deviceCategoryChartData}
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
				{browsers.length > 0 && (
					<div className={"min-w-0 col-span-12 md:col-span-4"}>
						<Card>
							<Card.Content>
								<h2 className={"text-lg font-semibold text-neutral-900"}>
									브라우저 (상위 5개)
								</h2>
								<div className="h-80 flex items-center justify-center">
									<div className="w-4/5 h-full">
										<Doughnut
											data={browserChartData}
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
				)}
				{operatingSystems.length > 0 && (
					<div className={"min-w-0 col-span-12 md:col-span-4"}>
						<Card>
							<Card.Content>
								<h2 className={"text-lg font-semibold text-neutral-900"}>
									운영체제
								</h2>
								<div className="h-80 flex items-center justify-center">
									<div className="w-4/5 h-full">
										<Doughnut
											data={osChartData}
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
				)}
				<div className={"min-w-0 col-span-12 md:col-span-4"}>
					<Card>
						<Card.Content>
							<h2 className={"text-lg font-semibold text-neutral-900"}>
								디바이스 카테고리 상세
							</h2>
							<div className={"overflow-x-auto"}>
								<table
									className={
										"w-full text-sm text-left [&_td]:p-3 [&_th]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
									}
								>
									<thead>
										<tr>
											<th scope="col">카테고리</th>
											<th scope="col" style={{ textAlign: "right" }}>
												사용자
											</th>
											<th scope="col" style={{ textAlign: "right" }}>
												비율
											</th>
										</tr>
									</thead>
									<tbody>
										{categories.map((device, index) => (
											<tr key={index}>
												<td>{device.category}</td>
												<td style={{ textAlign: "right" }}>
													{device.users.toLocaleString()}
												</td>
												<td style={{ textAlign: "right" }}>
													{((device.users / totalUsers) * 100).toFixed(1)}%
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</Card.Content>
					</Card>
				</div>
				{browsers.length > 0 && (
					<div className={"min-w-0 col-span-12 md:col-span-4"}>
						<Card>
							<Card.Content>
								<h2 className={"text-lg font-semibold text-neutral-900"}>
									브라우저 상세
								</h2>
								<div className={"overflow-x-auto"}>
									<table
										className={
											"w-full text-sm text-left [&_td]:p-3 [&_th]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
										}
									>
										<thead>
											<tr>
												<th scope="col">브라우저</th>
												<th scope="col" style={{ textAlign: "right" }}>
													사용자
												</th>
												<th scope="col" style={{ textAlign: "right" }}>
													비율
												</th>
											</tr>
										</thead>
										<tbody>
											{browsers.map((browser, index) => (
												<tr key={index}>
													<td>{browser.browser}</td>
													<td style={{ textAlign: "right" }}>
														{browser.users.toLocaleString()}
													</td>
													<td style={{ textAlign: "right" }}>
														{(
															(browser.users / totalBrowserUsers) *
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
				)}
				{operatingSystems.length > 0 && (
					<div className={"min-w-0 col-span-12 md:col-span-4"}>
						<Card>
							<Card.Content>
								<h2 className={"text-lg font-semibold text-neutral-900"}>
									운영체제 상세
								</h2>
								<div className={"overflow-x-auto"}>
									<table
										className={
											"w-full text-sm text-left [&_td]:p-3 [&_th]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
										}
									>
										<thead>
											<tr>
												<th scope="col">운영체제</th>
												<th scope="col" style={{ textAlign: "right" }}>
													사용자
												</th>
												<th scope="col" style={{ textAlign: "right" }}>
													비율
												</th>
											</tr>
										</thead>
										<tbody>
											{operatingSystems.map((os, index) => (
												<tr key={index}>
													<td>{os.os}</td>
													<td style={{ textAlign: "right" }}>
														{os.users.toLocaleString()}
													</td>
													<td style={{ textAlign: "right" }}>
														{((os.users / totalOSUsers) * 100).toFixed(1)}%
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</Card.Content>
						</Card>
					</div>
				)}
			</div>
		</div>
	);
}
