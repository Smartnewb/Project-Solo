"use client";
import { Alert, Chip } from "@heroui/react";
import type { HealthScore, PeriodComparison } from "../types";
const gradeConfig: Record<
	HealthScore["grade"],
	{
		color: string;
		bg: string;
		label: string;
		border: string;
	}
> = {
	HEALTHY: {
		color: "#16a34a",
		bg: "#f0fdf4",
		label: "HEALTHY",
		border: "#bbf7d0",
	},
	CAUTION: {
		color: "#ca8a04",
		bg: "#fefce8",
		label: "CAUTION",
		border: "#fef08a",
	},
	CRITICAL: {
		color: "#dc2626",
		bg: "#fef2f2",
		label: "CRITICAL",
		border: "#fecaca",
	},
};
// 알 수 없는 grade를 다른 등급으로 대체하지 않고 그대로 드러낸다.
const UNKNOWN_GRADE = {
	color: "#6b7280",
	bg: "#f9fafb",
	label: "UNKNOWN",
	border: "#e5e7eb",
};
// 백엔드 healthScore는 전기 대비 증감을 반영하지 않는다
// (solo-nestjs-api matching-monitor.service.ts computeHealthScore).
// 급감 경고 기준은 화면 표시용이며 등급/점수에는 영향을 주지 않는다.
const DROP_WARN_PERCENT = -30;
const DROP_CRITICAL_PERCENT = -50;
const DROP_LABELS = {
	matchesCreated: "매칭 생성",
	likesSent: "좋아요 발송",
	mutualAccepted: "상호 수락",
	chatRoomsOpened: "채팅 개설",
} as const;
export default function HealthScoreBanner({
	data,
	periodComparison,
}: {
	data: HealthScore;
	periodComparison?: PeriodComparison;
}) {
	const config = gradeConfig[data.grade] ?? UNKNOWN_GRADE;
	const drops = periodComparison
		? (Object.keys(DROP_LABELS) as (keyof typeof DROP_LABELS)[]).flatMap(
				(key) => {
					const delta = periodComparison[key].deltaPercent;
					return delta != null && delta <= DROP_WARN_PERCENT
						? [{ key, delta, critical: delta <= DROP_CRITICAL_PERCENT }]
						: [];
				},
			)
		: [];
	return (
		<div
			style={{
				padding: 24,
				borderRadius: 24,
				border: `2px solid ${config.border}`,
				backgroundColor: config.bg,
				display: "flex",
				flexDirection: "row",
				flexWrap: "wrap",
				alignItems: "center",
				gap: 24,
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 16,
					minWidth: 200,
				}}
			>
				<div
					style={{
						width: 72,
						height: 72,
						borderRadius: "50%",
						border: `4px solid ${config.color}`,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<h4 className={"text-lg font-semibold text-neutral-900"}>
						{data.score}
					</h4>
				</div>
				<div>
					<p className={"text-sm text-neutral-700"}>Health Score</p>
					<Chip
						style={{
							backgroundColor: config.color,
							color: "#fff",
							fontWeight: 700,
						}}
						size={"sm"}
						variant={"soft"}
					>
						<Chip.Label>{config.label}</Chip.Label>
					</Chip>
				</div>
			</div>
			{(data.alerts.length > 0 || drops.length > 0) && (
				<div
					style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}
				>
					{drops.map(({ key, delta, critical }) => (
						<Alert
							key={key}
							style={{ paddingTop: 4, paddingBottom: 4 }}
							status={critical ? "danger" : "warning"}
						>
							<Alert.Content>
								{`${DROP_LABELS[key]} 전기 대비 ${delta.toFixed(1)}% 급감 (건강 점수에는 반영되지 않음)`}
							</Alert.Content>
						</Alert>
					))}
					{data.alerts.map((alert, i) => (
						<Alert
							key={i}
							style={{ paddingTop: 4, paddingBottom: 4 }}
							status={
								alert.level === "critical"
									? "danger"
									: alert.level === "warn"
										? "warning"
										: "default"
							}
						>
							<Alert.Content>{alert.message}</Alert.Content>
						</Alert>
					))}
				</div>
			)}
		</div>
	);
}
