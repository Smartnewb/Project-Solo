"use client";
import {
	Alert,
	Button,
	Card,
	Chip,
	ProgressBar,
	Spinner,
	Tooltip,
} from "@heroui/react";
import {
	ChevronDown,
	ChevronUp,
	CircleAlert,
	DollarSign,
	Gauge,
	Heart,
	Info,
	Lightbulb,
	Smile,
	TrendingDown,
	TrendingUp,
	TriangleAlert,
	Users,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { dashboardService } from "@/app/services/dashboard";
import { sanitizeUrl } from "@/shared/lib/safe-url";
import {
	ActionableInsightsResponse,
	InsightSeverity,
	ActionableInsight,
	FunnelBottleneck,
	UserPainPoint,
	UrgentAction,
	HealthScore,
	INSIGHT_CATEGORY_LABELS,
} from "../types";
const SEVERITY_CONFIG: Record<
	InsightSeverity,
	{
		color: string;
		bgColor: string;
		icon: React.ReactNode;
	}
> = {
	critical: {
		color: "#dc2626",
		bgColor: "#fef2f2",
		icon: <CircleAlert size={18} />,
	},
	warning: {
		color: "#f59e0b",
		bgColor: "#fffbeb",
		icon: <TriangleAlert size={18} />,
	},
	info: {
		color: "#3b82f6",
		bgColor: "#eff6ff",
		icon: <Info size={18} />,
	},
};
function normalizeActionUrl(actionUrl: string): string {
	switch (actionUrl) {
		case "/admin/approvals":
		case "/admin/images":
			return "/admin/profile-review";
		default:
			return actionUrl;
	}
}
interface HealthScoreGaugeProps {
	healthScore: HealthScore;
}
function HealthScoreGauge({ healthScore }: HealthScoreGaugeProps) {
	const getScoreColor = (score: number) => {
		if (score >= 70) return "#22c55e";
		if (score >= 50) return "#f59e0b";
		return "#dc2626";
	};
	const metrics = [
		{
			label: "유저 성장",
			value: healthScore.userGrowth,
			icon: <Users size={18} />,
		},
		{
			label: "리텐션",
			value: healthScore.retention,
			icon: <TrendingUp size={18} />,
		},
		{
			label: "매출",
			value: healthScore.revenue,
			icon: <DollarSign size={18} />,
		},
		{
			label: "매칭 품질",
			value: healthScore.matchingQuality,
			icon: <Heart size={18} />,
		},
		{
			label: "만족도",
			value: healthScore.userSatisfaction,
			icon: <Smile size={18} />,
		},
	];
	return (
		<section style={{ padding: 24 }}>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 16,
					marginBottom: 24,
				}}
			>
				<Gauge
					style={{ color: getScoreColor(healthScore.overall), fontSize: 32 }}
					size={18}
				/>
				<div>
					<h2 className={"text-lg font-semibold text-neutral-900"}>
						서비스 건강 점수
					</h2>
					<span className={"text-sm text-neutral-700"}>
						주요 지표 기반 종합 점수
					</span>
				</div>
				<div style={{ marginLeft: "auto", textAlign: "right" }}>
					<h3
						style={{ color: getScoreColor(healthScore.overall) }}
						className={"text-lg font-semibold text-neutral-900"}
					>
						{healthScore.overall}
					</h3>
					<span className={"text-sm text-neutral-700"}>/ 100</span>
				</div>
			</div>
			<div className={"grid grid-cols-12 gap-4"}>
				{metrics.map((metric) => (
					<div
						key={metric.label}
						className={
							"min-w-0 col-span-6 sm:col-span-4 md:col-span-4 lg:col-span-2"
						}
					>
						<div style={{ textAlign: "center" }}>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									marginBottom: 4,
								}}
							>
								<div
									style={{ color: getScoreColor(metric.value), marginRight: 4 }}
								>
									{metric.icon}
								</div>
								<span className={"text-sm text-neutral-700"}>
									{metric.label}
								</span>
							</div>
							<h2
								style={{ color: getScoreColor(metric.value) }}
								className={"text-lg font-semibold text-neutral-900"}
							>
								{metric.value}
							</h2>
							<ProgressBar value={metric.value} aria-label="진행률">
								<ProgressBar.Track>
									<ProgressBar.Fill />
								</ProgressBar.Track>
							</ProgressBar>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
interface UrgentActionsProps {
	actions: UrgentAction[];
}
function UrgentActions({ actions }: UrgentActionsProps) {
	if (actions.length === 0) return null;
	return (
		<section
			style={{
				padding: 24,
				border: "2px solid #dc2626",
				backgroundColor: "#fef2f2",
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 8,
					marginBottom: 16,
				}}
			>
				<CircleAlert style={{ color: "#dc2626" }} size={18} />
				<h2 className={"text-lg font-semibold text-neutral-900"}>
					긴급 조치 필요
				</h2>
				<Chip
					style={{
						backgroundColor: "#dc2626",
						color: "white",
						fontWeight: 600,
					}}
					size={"sm"}
					variant={"soft"}
				>
					<Chip.Label>{`${actions.length}건`}</Chip.Label>
				</Chip>
			</div>
			<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
				{actions.map((action, index) => (
					<Link
						href={
							sanitizeUrl(normalizeActionUrl(action.actionUrl)) ??
							"/admin/dashboard"
						}
						key={index}
					>
						<Card style={{ cursor: "pointer", transition: "all 0.2s" }}>
							<Card.Content style={{ padding: 16 }}>
								<div
									style={{
										display: "flex",
										alignItems: "flex-start",
										justifyContent: "space-between",
									}}
								>
									<div>
										<div
											style={{
												display: "flex",
												alignItems: "center",
												gap: 8,
												marginBottom: 4,
											}}
										>
											<Chip
												style={{
													backgroundColor:
														action.urgency === "critical"
															? "#dc2626"
															: "#f59e0b",
													color: "white",
													fontWeight: 600,
													fontSize: "0.7rem",
												}}
												size={"sm"}
												variant={"soft"}
											>
												<Chip.Label>
													{action.urgency === "critical" ? "긴급" : "주의"}
												</Chip.Label>
											</Chip>
											<p className={"text-sm text-neutral-700"}>
												{action.title}
											</p>
										</div>
										<p className={"text-sm text-neutral-700"}>
											{action.description}
										</p>
										{action.deadlineHours && (
											<span className={"text-sm text-neutral-700"}>
												⏰ {action.deadlineHours}시간 내 처리 필요
											</span>
										)}
									</div>
									<h2 className={"text-lg font-semibold text-neutral-900"}>
										{action.count}
									</h2>
								</div>
							</Card.Content>
						</Card>
					</Link>
				))}
			</div>
		</section>
	);
}
interface InsightsListProps {
	insights: ActionableInsight[];
}
function InsightsList({ insights }: InsightsListProps) {
	const [expanded, setExpanded] = useState<string | null>(null);
	if (insights.length === 0) {
		return (
			<section style={{ padding: 24 }}>
				<p className={"text-sm text-neutral-700"}>
					현재 주요 인사이트가 없습니다. 서비스가 안정적으로 운영되고 있습니다.
				</p>
			</section>
		);
	}
	return (
		<section style={{ padding: 24 }}>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 8,
					marginBottom: 16,
				}}
			>
				<Lightbulb style={{ color: "#f59e0b" }} size={18} />
				<h2 className={"text-lg font-semibold text-neutral-900"}>
					주요 인사이트
				</h2>
			</div>
			<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
				{insights.map((insight) => {
					const config = SEVERITY_CONFIG[insight.severity];
					const isExpanded = expanded === insight.id;
					return (
						<Card
							key={insight.id}
							style={{ border: `1px solid ${config.color}20` }}
						>
							<Card.Content style={{ padding: 16 }}>
								<Button
									style={{
										display: "flex",
										alignItems: "flex-start",
										cursor: "pointer",
									}}
									onPress={() => setExpanded(isExpanded ? null : insight.id)}
									variant="tertiary"
									fullWidth
									className="h-auto justify-start whitespace-normal text-left"
									aria-expanded={isExpanded}
								>
									<div
										style={{
											padding: 8,
											borderRadius: 8,
											backgroundColor: config.bgColor,
											color: config.color,
											marginRight: 16,
										}}
									>
										{config.icon}
									</div>
									<div style={{ flex: 1 }}>
										<div
											style={{
												display: "flex",
												alignItems: "center",
												gap: 8,
												marginBottom: 4,
											}}
										>
											<p className={"text-sm text-neutral-700"}>
												{insight.title}
											</p>
											<Chip
												style={{ fontSize: "0.65rem", height: 20 }}
												size={"sm"}
												variant={"soft"}
											>
												<Chip.Label>
													{INSIGHT_CATEGORY_LABELS[insight.category]}
												</Chip.Label>
											</Chip>
										</div>
										<p className={"text-sm text-neutral-700"}>
											{insight.description}
										</p>
										{insight.changeRate !== undefined && (
											<div
												style={{
													display: "flex",
													alignItems: "center",
													gap: 4,
													marginTop: 4,
												}}
											>
												{insight.changeRate >= 0 ? (
													<TrendingUp size={18} />
												) : (
													<TrendingDown size={18} />
												)}
												<span className={"text-sm text-neutral-700"}>
													{insight.changeRate > 0 ? "+" : ""}
													{insight.changeRate}%
												</span>
											</div>
										)}
									</div>
									<span>
										{isExpanded ? (
											<ChevronUp size={18} />
										) : (
											<ChevronDown size={18} />
										)}
									</span>
								</Button>
								<div hidden={!isExpanded}>
									<div
										style={{
											marginTop: 16,
											paddingTop: 16,
											borderTop: "1px solid",
											borderColor: "#e5e5e5",
										}}
									>
										<p
											style={{ marginBottom: 8 }}
											className={"text-sm text-neutral-700"}
										>
											권장 조치
										</p>
										<div style={{ paddingLeft: 16 }}>
											{insight.recommendations.map((rec, i) => (
												<p
													key={i}
													style={{ marginBottom: 4 }}
													className={"text-sm text-neutral-700"}
												>
													• {rec}
												</p>
											))}
										</div>
										{insight.affectedUsers > 0 && (
											<span
												style={{ marginTop: 8, display: "block" }}
												className={"text-sm text-neutral-700"}
											>
												영향 받는 유저:{" "}
												{(insight.affectedUsers ?? 0).toLocaleString()}명
											</span>
										)}
										{insight.potentialRevenueImpact && (
											<span
												style={{ display: "block" }}
												className={"text-sm text-neutral-700"}
											>
												예상 매출 영향: ₩
												{(insight.potentialRevenueImpact ?? 0).toLocaleString()}
											</span>
										)}
										{insight.relatedDashboard && (
											<Link href={insight.relatedDashboard}>
												<span
													style={{
														color: "#7A4AE2",
														textDecoration: "underline",
														cursor: "pointer",
													}}
													className={"text-sm text-neutral-700"}
												>
													관련 대시보드 보기 →
												</span>
											</Link>
										)}
									</div>
								</div>
							</Card.Content>
						</Card>
					);
				})}
			</div>
		</section>
	);
}
interface BottlenecksListProps {
	bottlenecks: FunnelBottleneck[];
}
function BottlenecksList({ bottlenecks }: BottlenecksListProps) {
	if (bottlenecks.length === 0) return null;
	return (
		<section style={{ padding: 24 }}>
			<h2
				style={{ marginBottom: 16 }}
				className={"text-lg font-semibold text-neutral-900"}
			>
				퍼널 병목 지점
			</h2>
			<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
				{bottlenecks.map((bottleneck, index) => {
					const gap = bottleneck.benchmarkRate - bottleneck.conversionRate;
					const severity =
						gap > 20 ? "critical" : gap > 10 ? "warning" : "info";
					const config = SEVERITY_CONFIG[severity];
					return (
						<div
							key={index}
							style={{
								padding: 16,
								borderRadius: 8,
								backgroundColor: config.bgColor,
								border: `1px solid ${config.color}40`,
							}}
						>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									marginBottom: 8,
								}}
							>
								<p className={"text-sm text-neutral-700"}>{bottleneck.stage}</p>
								<div style={{ display: "flex", alignItems: "center", gap: 16 }}>
									<Tooltip>
										<Tooltip.Trigger tabIndex={0}>
											<h2
												style={{ color: config.color }}
												className={"text-lg font-semibold text-neutral-900"}
											>
												{bottleneck.conversionRate}%
											</h2>
										</Tooltip.Trigger>
										<Tooltip.Content>{"현재 전환율"}</Tooltip.Content>
									</Tooltip>
									<p className={"text-sm text-neutral-700"}>
										/ 기준 {bottleneck.benchmarkRate}%
									</p>
								</div>
							</div>
							<ProgressBar
								value={
									(bottleneck.conversionRate / bottleneck.benchmarkRate) * 100
								}
								aria-label="진행률"
							>
								<ProgressBar.Track>
									<ProgressBar.Fill />
								</ProgressBar.Track>
							</ProgressBar>
							<span className={"text-sm text-neutral-700"}>
								이탈 유저: {(bottleneck.droppedUsers ?? 0).toLocaleString()}명
							</span>
							<div style={{ marginTop: 8 }}>
								<span className={"text-sm text-neutral-700"}>예상 원인:</span>
								<div
									style={{
										display: "flex",
										flexWrap: "wrap",
										gap: 4,
										marginTop: 4,
									}}
								>
									{bottleneck.possibleCauses.map((cause, i) => (
										<Chip
											key={i}
											style={{ fontSize: "0.65rem" }}
											size={"sm"}
											variant={"soft"}
										>
											<Chip.Label>{cause}</Chip.Label>
										</Chip>
									))}
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</section>
	);
}
interface PainPointsListProps {
	painPoints: UserPainPoint[];
}
function PainPointsList({ painPoints }: PainPointsListProps) {
	if (painPoints.length === 0) return null;
	return (
		<section style={{ padding: 24 }}>
			<h2
				style={{ marginBottom: 16 }}
				className={"text-lg font-semibold text-neutral-900"}
			>
				유저 페인포인트
			</h2>
			<div className={"grid grid-cols-12 gap-4"}>
				{painPoints.map((point) => (
					<div key={point.id} className={"min-w-0 col-span-12 md:col-span-4"}>
						<Card
							style={{
								height: "100%",
								border: "1px solid",
								borderColor: "#e5e5e5",
							}}
						>
							<Card.Content>
								<p
									style={{ marginBottom: 8 }}
									className={"text-sm text-neutral-700"}
								>
									{point.description}
								</p>
								<div
									style={{
										display: "flex",
										alignItems: "baseline",
										gap: 8,
										marginBottom: 16,
									}}
								>
									<h4 className={"text-lg font-semibold text-neutral-900"}>
										{(point.affectedUsers ?? 0).toLocaleString()}
									</h4>
									<p className={"text-sm text-neutral-700"}>
										명 ({point.percentage}%)
									</p>
								</div>
								{point.avgWaitDays !== undefined && (
									<span
										style={{ display: "block", marginBottom: 8 }}
										className={"text-sm text-neutral-700"}
									>
										평균 대기 기간: {point.avgWaitDays}일
									</span>
								)}
								<div style={{ marginBottom: 16 }}>
									<span className={"text-sm text-neutral-700"}>
										이탈 위험도
									</span>
									<ProgressBar value={point.churnRisk} aria-label="진행률">
										<ProgressBar.Track>
											<ProgressBar.Fill />
										</ProgressBar.Track>
									</ProgressBar>
									<span className={"text-sm text-neutral-700"}>
										{point.churnRisk}%
									</span>
								</div>
								<span
									style={{ display: "block", marginBottom: 4 }}
									className={"text-sm text-neutral-700"}
								>
									개선 방안:
								</span>
								{point.solutions.slice(0, 2).map((solution, i) => (
									<span
										key={i}
										style={{ display: "block" }}
										className={"text-sm text-neutral-700"}
									>
										• {solution}
									</span>
								))}
							</Card.Content>
						</Card>
					</div>
				))}
			</div>
		</section>
	);
}
export default function ActionableInsights() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<ActionableInsightsResponse | null>(null);
	const [showDetails, setShowDetails] = useState(true);
	const fetchData = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await dashboardService.getActionableInsights();
			setData(response);
		} catch (err) {
			setError("인사이트 데이터를 불러오는데 실패했습니다.");
		} finally {
			setLoading(false);
		}
	}, []);
	useEffect(() => {
		fetchData();
	}, [fetchData]);
	if (loading) {
		return (
			<section style={{ padding: 24 }}>
				<div
					style={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						paddingTop: 32,
						paddingBottom: 32,
					}}
				>
					<Spinner aria-label="불러오는 중" size="sm" />
					<p style={{ marginLeft: 16 }} className={"text-sm text-neutral-700"}>
						인사이트 분석 중...
					</p>
				</div>
			</section>
		);
	}
	if (error) {
		return (
			<Alert style={{ marginBottom: 16 }} status={"danger"}>
				<Alert.Content>{error}</Alert.Content>
			</Alert>
		);
	}
	if (!data) return null;
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<div>
					<h2 className={"text-lg font-semibold text-neutral-900"}>
						실행 가능한 인사이트
					</h2>
					<span className={"text-sm text-neutral-700"}>
						{data.period.startDate}~ {data.period.endDate}기준
					</span>
				</div>
				<Button
					onClick={() => setShowDetails(!showDetails)}
					variant={"tertiary"}
					isIconOnly={true}
					aria-label="인사이트 세부 내용"
					aria-expanded={showDetails}
					size={"md"}
				>
					{showDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
				</Button>
			</div>
			<section
				style={{
					padding: 16,
					backgroundColor:
						data.healthScore.overall >= 70
							? "#f0fdf4"
							: data.healthScore.overall >= 50
								? "#fffbeb"
								: "#fef2f2",
				}}
			>
				<p className={"text-sm text-neutral-700"}>{data.summary}</p>
			</section>
			<HealthScoreGauge healthScore={data.healthScore} />
			<div hidden={!showDetails}>
				<div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
					<UrgentActions actions={data.urgentActions} />
					<InsightsList insights={data.insights} />
					<BottlenecksList bottlenecks={data.funnelBottlenecks} />
					<PainPointsList painPoints={data.userPainPoints} />
				</div>
			</div>
		</div>
	);
}
