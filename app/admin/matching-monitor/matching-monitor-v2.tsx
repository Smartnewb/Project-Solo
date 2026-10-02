"use client";
import {
	Alert,
	Button,
	ButtonGroup,
	Skeleton,
	Tabs,
	Tooltip,
} from "@heroui/react";
import { RefreshCw } from "lucide-react";
import { useState, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMatchingDashboard, monitorKeys } from "./hooks";
import type { DashboardPeriod, DashboardCountry } from "./types";
import HealthScoreBanner from "./components/HealthScoreBanner";
import KpiCards from "./components/KpiCards";
import PoolOverviewSection from "./components/PoolOverview";
import BatchPerformanceSection from "./components/BatchPerformance";
import FunnelChart from "./components/FunnelChart";
import PipelineAnalysis from "./components/PipelineAnalysis";
import RegionStats from "./components/RegionStats";
import GlobalMatchingSection from "./components/GlobalMatching";
import ChatEngagementSection from "./components/ChatEngagement";
import PeriodComparisonSection from "./components/PeriodComparison";
import MatchDetailsSection from "./components/MatchDetails";
import AtRiskUsersSection from "./components/AtRiskUsers";
import UserDiagnosis from "./components/UserDiagnosis";
const PERIOD_LABEL: Record<DashboardPeriod, string> = {
	today: "오늘",
	"7d": "최근 7일",
	"30d": "최근 30일",
};
const COUNTRY_LABEL: Record<DashboardCountry, string> = {
	ALL: "전체 국가",
	KR: "한국",
	JP: "일본",
};
export default function MatchingMonitorV2() {
	const [activeTab, setActiveTab] = useState(0);
	const [period, setPeriod] = useState<DashboardPeriod>("today");
	const [country, setCountry] = useState<DashboardCountry>("ALL");
	const [diagnosisUserId, setDiagnosisUserId] = useState("");
	const queryClient = useQueryClient();
	const { data, isLoading, error, dataUpdatedAt } = useMatchingDashboard(
		period,
		country,
	);
	const handleRefresh = useCallback(() => {
		queryClient.invalidateQueries({
			queryKey: monitorKeys.dashboard(period, country),
		});
	}, [queryClient, period, country]);
	const TAB_RISK_USERS = 4;
	const handleUserClick = useCallback((userId: string) => {
		setDiagnosisUserId(userId);
		setActiveTab(TAB_RISK_USERS);
	}, []);
	const cachedTimeStr = useMemo(
		() =>
			dataUpdatedAt
				? new Date(dataUpdatedAt).toLocaleTimeString("ko-KR", {
						hour: "2-digit",
						minute: "2-digit",
						second: "2-digit",
					})
				: "",
		[dataUpdatedAt],
	);
	return (
		<div className="min-h-screen bg-gray-50">
			<div className="bg-white shadow-sm border-b border-gray-200">
				<div className="max-w-7xl mx-auto px-4 py-4">
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							flexWrap: "wrap",
							gap: 16,
						}}
					>
						<h1 className={"text-xl font-bold text-neutral-900"}>
							매칭 모니터
						</h1>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: 16,
								flexWrap: "wrap",
							}}
						>
							<ButtonGroup
								aria-label="매칭 모니터 기간 필터"
								className={"flex flex-wrap"}
							>
								<Button
									aria-label="오늘 데이터 보기"
									variant={period === "today" ? "primary" : "secondary"}
									aria-pressed={period === "today"}
									onPress={() => setPeriod("today")}
								>
									오늘
								</Button>
								<Button
									aria-label="최근 7일 데이터 보기"
									variant={period === "7d" ? "primary" : "secondary"}
									aria-pressed={period === "7d"}
									onPress={() => setPeriod("7d")}
								>
									7일
								</Button>
								<Button
									aria-label="최근 30일 데이터 보기"
									variant={period === "30d" ? "primary" : "secondary"}
									aria-pressed={period === "30d"}
									onPress={() => setPeriod("30d")}
								>
									30일
								</Button>
							</ButtonGroup>
							<ButtonGroup
								aria-label="매칭 모니터 국가 필터"
								className={"flex flex-wrap"}
							>
								<Button
									aria-label="전체 국가 데이터 보기"
									variant={country === "ALL" ? "primary" : "secondary"}
									aria-pressed={country === "ALL"}
									onPress={() => setCountry("ALL")}
								>
									전체
								</Button>
								<Button
									aria-label="한국 데이터 보기"
									variant={country === "KR" ? "primary" : "secondary"}
									aria-pressed={country === "KR"}
									onPress={() => setCountry("KR")}
								>
									KR
								</Button>
								<Button
									aria-label="일본 데이터 보기"
									variant={country === "JP" ? "primary" : "secondary"}
									aria-pressed={country === "JP"}
									onPress={() => setCountry("JP")}
								>
									JP
								</Button>
							</ButtonGroup>
							<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
								<Tooltip>
									<Button
										onClick={handleRefresh}
										variant={"tertiary"}
										isIconOnly={true}
										aria-label={"매칭 모니터 데이터 새로고침"}
										size={"sm"}
									>
										<RefreshCw size={18} />
									</Button>
									<Tooltip.Content>{"새로고침"}</Tooltip.Content>
								</Tooltip>
								{cachedTimeStr && (
									<span className={"text-sm text-neutral-700"}>
										{cachedTimeStr}
									</span>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className="max-w-7xl mx-auto px-4 py-6">
				{error && (
					<Alert style={{ marginBottom: 24 }} status={"danger"}>
						<Alert.Content>
							데이터 로드 실패: {(error as Error).message}
						</Alert.Content>
					</Alert>
				)}
				{isLoading && !data ? (
					<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
						<p className={"text-sm text-neutral-700"}>
							{PERIOD_LABEL[period]}· {COUNTRY_LABEL[country]}기준 매칭 지표를
							불러오는 중입니다.
						</p>
						<Skeleton
							style={{ width: "100%", height: 100 }}
							className="rounded-xl"
						/>
						<div style={{ display: "flex", gap: 16 }}>
							{[1, 2, 3, 4].map((i) => (
								<Skeleton
									key={i}
									style={{ ...{ flex: 1 }, ...{ width: "100%", height: 96 } }}
									className="rounded-xl"
								/>
							))}
						</div>
						<Skeleton
							style={{ width: "100%", height: 300 }}
							className="rounded-xl"
						/>
					</div>
				) : data ? (
					<>
						<HealthScoreBanner
							data={data.healthScore}
							periodComparison={data.periodComparison}
						/>

						<Tabs
							selectedKey={activeTab}
							onSelectionChange={(key) => setActiveTab(Number(key))}
						>
							<Tabs.List
								aria-label="매칭 모니터 상세 보기"
								className="flex-wrap"
							>
								<Tabs.Tab id={0}>{"종합 현황"}</Tabs.Tab>
								<Tabs.Tab id={1}>{"퍼널 & 채팅"}</Tabs.Tab>
								<Tabs.Tab id={2}>{"매칭 상세"}</Tabs.Tab>
								<Tabs.Tab id={3}>{"지역 & 글로벌"}</Tabs.Tab>
								<Tabs.Tab id={4}>{"위험 유저 관리"}</Tabs.Tab>
							</Tabs.List>

							<Tabs.Panel id={0} className="flex flex-col gap-6 pt-6">
								<KpiCards
									pool={data.pool}
									matchRate={data.matchRate}
									funnel={data.postMatchFunnel}
								/>
								<PeriodComparisonSection data={data.periodComparison} />
								<PoolOverviewSection
									pool={data.pool}
									segments={data.segmentStats}
								/>
								<BatchPerformanceSection data={data.batchPerformance} />
							</Tabs.Panel>

							<Tabs.Panel id={1} className="flex flex-col gap-6 pt-6">
								<FunnelChart data={data.postMatchFunnel} />
								<ChatEngagementSection data={data.chatEngagement} />
								<PipelineAnalysis data={data.pipelineTransparency} />
							</Tabs.Panel>

							<Tabs.Panel id={2} className="flex flex-col gap-6 pt-6">
								<MatchDetailsSection data={data.matchDetails} />
							</Tabs.Panel>

							<Tabs.Panel id={3} className="flex flex-col gap-6 pt-6">
								<RegionStats data={data.regionStats} />
								<GlobalMatchingSection
									data={data.globalMatching}
									ttl={data.historyTtl}
								/>
							</Tabs.Panel>

							<Tabs.Panel id={4} className="flex flex-col gap-6 pt-6">
								<AtRiskUsersSection
									data={data.atRiskUsers}
									onUserClick={handleUserClick}
								/>
								<UserDiagnosis initialUserId={diagnosisUserId} />
							</Tabs.Panel>
						</Tabs>
					</>
				) : null}
			</div>
		</div>
	);
}
