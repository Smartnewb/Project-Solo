"use client";
import { Card } from "@heroui/react";
import type { BatchPerformance as BatchPerformanceType } from "../types";
export default function BatchPerformanceSection({
	data,
}: {
	data: BatchPerformanceType;
}) {
	const durationSec =
		data.avgDurationMs != null ? (data.avgDurationMs / 1000).toFixed(1) : "-";
	return (
		<Card>
			<Card.Content>
				<p className={"text-sm text-neutral-700"}>배치 성과</p>
				<div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
					<Metric label="총 배치" value={data.totalBatches} />
					<Metric label="완료" value={data.completedBatches} color="#16a34a" />
					<Metric
						label="실패"
						value={data.failedBatches}
						color={data.failedBatches > 0 ? "#dc2626" : undefined}
					/>
					<Metric
						label="평균 성공"
						value={data.avgSuccessCount}
						suffix="건/배치"
					/>
					<Metric
						label="평균 실패"
						value={data.avgFailureCount}
						suffix="건/배치"
					/>
					<Metric label="평균 소요시간" value={durationSec} suffix="초" />
				</div>
			</Card.Content>
		</Card>
	);
}
function Metric({
	label,
	value,
	suffix,
	color,
}: {
	label: string;
	value: number | string;
	suffix?: string;
	color?: string;
}) {
	return (
		<div style={{ textAlign: "center", minWidth: 80 }}>
			<span className={"text-sm text-neutral-700"}>{label}</span>
			<h2 className={"text-lg font-semibold text-neutral-900"}>
				{typeof value === "number" ? value.toLocaleString() : value}
			</h2>
			{suffix && <span className={"text-sm text-neutral-700"}>{suffix}</span>}
		</div>
	);
}
