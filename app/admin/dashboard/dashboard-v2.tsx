"use client";
import { Alert } from "@heroui/react";
import { useDashboardSummary } from "./hooks";
import ActionableInsights from "./components/ActionableInsights";
import ActionRequired from "./components/ActionRequired";
import GemSystemFunnel from "./components/GemSystemFunnel";
import QuickAccess from "./components/QuickAccess";
import RevenueOverview from "./components/RevenueOverview";
import TodayMetrics from "./components/TodayMetrics";
import UserEngagementStats from "./components/UserEngagementStats";
import WeeklyTrend from "./components/WeeklyTrend";
export default function DashboardV2() {
	const { data: summary, isLoading, error } = useDashboardSummary();
	const today = new Date();
	const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
	return (
		<div className="min-h-screen bg-gray-50">
			<div className="bg-white shadow-sm border-b border-gray-200">
				<div className="max-w-7xl mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						<div>
							<h1 className={"text-lg font-semibold text-neutral-900"}>
								메인 대시보드
							</h1>
							<p className={"text-sm text-neutral-700"}>
								오늘 해야 할 일을 한눈에 확인하세요
							</p>
						</div>
						<p className={"text-sm text-neutral-700"}>{formattedDate}</p>
					</div>
				</div>
			</div>
			<div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
				{error && (
					<Alert status={"danger"}>
						<Alert.Content>
							대시보드 데이터를 불러오는데 실패했습니다.
						</Alert.Content>
					</Alert>
				)}
				<ActionRequired />
				<div className={"grid grid-cols-12 gap-4"}>
					<div className={"min-w-0 col-span-12 md:col-span-7"}>
						<TodayMetrics
							overview={summary?.overview}
							conversionRate={summary?.matchingFunnel?.overallConversionRate}
							loading={isLoading}
						/>
						<div style={{ marginTop: 24 }}>
							<WeeklyTrend compact />
						</div>
					</div>
					<div className={"min-w-0 col-span-12 md:col-span-5"}>
						<RevenueOverview revenue={summary?.revenue} loading={isLoading} />
					</div>
				</div>
				<GemSystemFunnel />
				<UserEngagementStats />
				<ActionableInsights />
				<QuickAccess />
			</div>
		</div>
	);
}
