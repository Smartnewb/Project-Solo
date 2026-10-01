"use client";
import { Alert, Button, ButtonGroup, Spinner, Tooltip } from "@heroui/react";
import { ArrowRight, Bug, Copy, TrendingDown } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { dashboardService } from "@/app/services/dashboard";
import { GemSystemFunnelResponse, MatchingTypeFunnel } from "../types";
const FUNNEL_COLORS = ["#4CAF50", "#2196F3", "#FF9800", "#E91E63"];
interface FunnelBarProps {
	step: {
		name: string;
		count: number;
		conversionRate: number;
		overallConversionRate: number;
	};
	index: number;
	maxCount: number;
	isLast: boolean;
}
const FunnelBar = ({ step, index, maxCount, isLast }: FunnelBarProps) => {
	const widthPercent = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
	return (
		<div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
			<div style={{ width: 100, flexShrink: 0 }}>
				<p className={"text-sm text-neutral-700"}>{step.name}</p>
			</div>
			<div style={{ flex: 1, marginLeft: 16, marginRight: 16 }}>
				<Tooltip>
					<Tooltip.Trigger tabIndex={0}>
						<div
							style={{
								height: 32,
								backgroundColor: FUNNEL_COLORS[index % FUNNEL_COLORS.length],
								borderRadius: 8,
								width: `${Math.max(widthPercent, 5)}%`,
								transition: "width 0.5s ease-in-out",
								display: "flex",
								alignItems: "center",
								justifyContent: "flex-end",
								paddingRight: 8,
								minWidth: 60,
							}}
						>
							<p
								style={{ color: "white", fontWeight: "bold" }}
								className={"text-sm text-neutral-700"}
							>
								{(step.count ?? 0).toLocaleString()}
							</p>
						</div>
					</Tooltip.Trigger>
					<Tooltip.Content>{`전체 대비: ${step.overallConversionRate}%`}</Tooltip.Content>
				</Tooltip>
			</div>
			<div style={{ width: 80, textAlign: "right", flexShrink: 0 }}>
				{!isLast && (
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "flex-end",
						}}
					>
						<TrendingDown
							style={{
								fontSize: 16,
								color: step.conversionRate >= 50 ? "#15803d" : "#b45309",
								marginRight: 4,
							}}
							size={18}
						/>
						<p className={"text-sm text-neutral-700"}>{step.conversionRate}%</p>
					</div>
				)}
			</div>
		</div>
	);
};
interface FunnelSectionProps {
	funnel: MatchingTypeFunnel;
}
const FunnelSection = ({ funnel }: FunnelSectionProps) => {
	const maxCount = Math.max(...funnel.steps.map((s) => s.count));
	const firstStep = funnel.steps[0];
	const lastStep = funnel.steps[funnel.steps.length - 1];
	const overallRate =
		firstStep.count > 0
			? ((lastStep.count / firstStep.count) * 100).toFixed(1)
			: "0";
	return (
		<section style={{ padding: 16, marginBottom: 16 }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 16,
				}}
			>
				<p className={"text-sm text-neutral-700"}>{funnel.typeName}</p>
				<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
					<p className={"text-sm text-neutral-700"}>전체 전환율:</p>
					<p className={"text-sm text-neutral-700"}>{overallRate}%</p>
				</div>
			</div>
			{funnel.steps.map((step, index) => (
				<div key={step.name}>
					<FunnelBar
						step={step}
						index={index}
						maxCount={maxCount}
						isLast={index === funnel.steps.length - 1}
					/>
					{index < funnel.steps.length - 1 && (
						<div
							style={{
								display: "flex",
								justifyContent: "center",
								marginTop: 4,
								marginBottom: 4,
							}}
						>
							<ArrowRight
								style={{
									fontSize: 16,
									color: "#737373",
									transform: "rotate(90deg)",
								}}
								size={18}
							/>
						</div>
					)}
				</div>
			))}
		</section>
	);
};
export default function GemSystemFunnel() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<GemSystemFunnelResponse | null>(null);
	const [viewType, setViewType] = useState<"total" | "byType">("total");
	const [debugMode, setDebugMode] = useState(false);
	const [copied, setCopied] = useState<string | null>(null);
	const fetchData = useCallback(async (debug: boolean) => {
		try {
			setLoading(true);
			setError(null);
			const response = await dashboardService.getGemSystemFunnel(
				undefined,
				undefined,
				debug,
			);
			setData(response);
		} catch (err) {
			setError("매칭 퍼널 데이터를 불러오는데 실패했습니다.");
		} finally {
			setLoading(false);
		}
	}, []);
	useEffect(() => {
		fetchData(debugMode);
	}, [debugMode, fetchData]);
	const handleViewTypeChange = (newValue: "total" | "byType" | null) => {
		if (newValue !== null) {
			setViewType(newValue);
		}
	};
	const handleCopyQuery = async (queryName: string, query: string) => {
		try {
			await navigator.clipboard.writeText(query);
			setCopied(queryName);
			setTimeout(() => setCopied(null), 2000);
		} catch {}
	};
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
						매칭 퍼널 데이터 로딩 중...
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
	if (!data) {
		return null;
	}
	return (
		<section style={{ padding: 24 }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 16,
				}}
			>
				<div>
					<h2 className={"text-lg font-semibold text-neutral-900"}>
						매칭 전환 퍼널
					</h2>
					<span className={"text-sm text-neutral-700"}>
						{data.period.startDate}~ {data.period.endDate}(구슬 시스템 도입
						이후)
					</span>
				</div>
				<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
					{process.env.NODE_ENV === "development" && (
						<Tooltip>
							<Button
								onClick={() => setDebugMode(!debugMode)}
								variant={"tertiary"}
								isIconOnly={true}
								aria-label="SQL 디버그 보기"
								size={"sm"}
							>
								<Bug size={18} />
							</Button>
							<Tooltip.Content>{"디버그 모드 (SQL 쿼리 확인)"}</Tooltip.Content>
						</Tooltip>
					)}
					<ButtonGroup aria-label={"지표 필터"} className={"flex flex-wrap"}>
						<Button
							variant={viewType === "total" ? "primary" : "secondary"}
							aria-pressed={viewType === "total"}
							onPress={() => handleViewTypeChange("total")}
						>
							전체
						</Button>
						<Button
							variant={viewType === "byType" ? "primary" : "secondary"}
							aria-pressed={viewType === "byType"}
							onPress={() => handleViewTypeChange("byType")}
						>
							타입별
						</Button>
					</ButtonGroup>
				</div>
			</div>
			{viewType === "total" ? (
				<FunnelSection funnel={data.totalFunnel} />
			) : (
				data.funnelByType.map((funnel) => (
					<FunnelSection key={funnel.type} funnel={funnel} />
				))
			)}
			<div
				hidden={
					!(process.env.NODE_ENV === "development" && debugMode && !!data.debug)
				}
			>
				<section
					style={{ padding: 16, marginTop: 16, backgroundColor: "#f5f5f5" }}
				>
					<p
						style={{ marginBottom: 16 }}
						className={"text-sm text-neutral-700"}
					>
						🔍 디버그 정보 (SQL 쿼리)
					</p>
					{data.debug && (
						<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
							{[
								{ name: "matchesQuery", label: "매칭 수 쿼리" },
								{ name: "likesQuery", label: "좋아요 수 쿼리" },
								{ name: "mutualLikesQuery", label: "상호 좋아요 수 쿼리" },
								{ name: "chatRoomsQuery", label: "채팅방 수 쿼리" },
							].map(({ name, label }) => (
								<div key={name}>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: 8,
											marginBottom: 4,
										}}
									>
										<span className={"text-sm text-neutral-700"}>{label}</span>
										<Button
											onClick={() =>
												handleCopyQuery(
													name,
													data.debug![
														name as keyof typeof data.debug
													] as string,
												)
											}
											variant={"tertiary"}
											isIconOnly={true}
											aria-label="쿼리 복사"
											size={"sm"}
										>
											<Copy size={18} />
										</Button>
										{copied === name && (
											<span className={"text-sm text-neutral-700"}>
												복사됨!
											</span>
										)}
									</div>
									<pre
										style={{
											padding: 8,
											backgroundColor: "#171717",
											color: "#f5f5f5",
											borderRadius: 8,
											overflow: "auto",
											fontSize: "0.75rem",
											fontFamily: "monospace",
											margin: 0,
										}}
									>
										{data.debug![name as keyof typeof data.debug] as string}
									</pre>
								</div>
							))}
							<div>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										gap: 8,
										marginBottom: 4,
									}}
								>
									<span className={"text-sm text-neutral-700"}>Raw 결과</span>
									<Button
										onClick={() =>
											handleCopyQuery(
												"rawResults",
												JSON.stringify(data.debug!.rawResults, null, 2),
											)
										}
										variant={"tertiary"}
										isIconOnly={true}
										aria-label="쿼리 복사"
										size={"sm"}
									>
										<Copy size={18} />
									</Button>
									{copied === "rawResults" && (
										<span className={"text-sm text-neutral-700"}>복사됨!</span>
									)}
								</div>
								<pre
									style={{
										padding: 8,
										backgroundColor: "#171717",
										color: "#f5f5f5",
										borderRadius: 8,
										overflow: "auto",
										fontSize: "0.75rem",
										fontFamily: "monospace",
										margin: 0,
									}}
								>
									{JSON.stringify(data.debug.rawResults, null, 2)}
								</pre>
							</div>
						</div>
					)}
				</section>
			</div>
			<span
				style={{ display: "block", marginTop: 8 }}
				className={"text-sm text-neutral-700"}
			>
				* 전환율은 이전 단계 대비 비율입니다. 막대 위에 마우스를 올리면 전체
				대비 비율을 확인할 수 있습니다.
			</span>
		</section>
	);
}
