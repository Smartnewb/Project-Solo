"use client";
import { Card } from "@heroui/react";
import { TrendingDown, Minus, TrendingUp } from "lucide-react";
import type {
	PeriodComparison as PeriodComparisonType,
	PeriodComparisonMetric,
} from "../types";
const METRIC_LABELS: Record<string, string> = {
	matchesCreated: "매칭 생성",
	likesSent: "좋아요 발송",
	mutualAccepted: "상호 수락",
	chatRoomsOpened: "채팅 개설",
};
export default function PeriodComparisonSection({
	data,
}: {
	data: PeriodComparisonType;
}) {
	const metrics: {
		key: string;
		metric: PeriodComparisonMetric;
	}[] = [
		{ key: "matchesCreated", metric: data.matchesCreated },
		{ key: "likesSent", metric: data.likesSent },
		{ key: "mutualAccepted", metric: data.mutualAccepted },
		{ key: "chatRoomsOpened", metric: data.chatRoomsOpened },
	];
	return (
		<Card>
			<Card.Content>
				<p className={"text-sm text-neutral-700"}>전기 대비 변화</p>
				<div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
					{metrics.map(({ key, metric }) => (
						<ComparisonCard
							key={key}
							label={METRIC_LABELS[key]}
							metric={metric}
						/>
					))}
				</div>
			</Card.Content>
		</Card>
	);
}
function ComparisonCard({
	label,
	metric,
}: {
	label: string;
	metric: PeriodComparisonMetric;
}) {
	const delta = metric.deltaPercent;
	const isUp = delta != null && delta > 0;
	const isDown = delta != null && delta < 0;
	return (
		<div
			style={{
				flex: 1,
				minWidth: 160,
				padding: 16,
				borderRadius: 16,
				border: "1px solid",
				textAlign: "center",
			}}
		>
			<span className={"text-sm text-neutral-700"}>{label}</span>
			<h2 className={"text-lg font-semibold text-neutral-900"}>
				{metric.current.toLocaleString()}
			</h2>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					gap: 4,
					marginTop: 4,
				}}
			>
				{isUp && (
					<TrendingUp style={{ fontSize: 16, color: "#16a34a" }} size={18} />
				)}
				{isDown && (
					<TrendingDown style={{ fontSize: 16, color: "#dc2626" }} size={18} />
				)}
				{!isUp && !isDown && (
					<Minus style={{ fontSize: 16, color: "#9ca3af" }} size={18} />
				)}
				<p className={"text-sm text-neutral-700"}>
					{delta != null ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%` : "-"}
				</p>
				<span className={"text-sm text-neutral-700"}>
					(전기 {metric.previous.toLocaleString()})
				</span>
			</div>
		</div>
	);
}
