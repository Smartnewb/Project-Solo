"use client";
import { Card } from "@heroui/react";
import type {
	GlobalMatching as GlobalMatchingType,
	HistoryTtl,
} from "../types";
export default function GlobalMatchingSection({
	data,
	ttl,
}: {
	data: GlobalMatchingType;
	ttl: HistoryTtl;
}) {
	const krToJpRate =
		data.krToJpAttempted > 0
			? ((data.krToJpSuccess / data.krToJpAttempted) * 100).toFixed(1)
			: "0";
	const jpToKrRate =
		data.jpToKrAttempted > 0
			? ((data.jpToKrSuccess / data.jpToKrAttempted) * 100).toFixed(1)
			: "0";
	return (
		<div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
			<DirectionCard
				title="KR → JP"
				attempted={data.krToJpAttempted}
				success={data.krToJpSuccess}
				rate={krToJpRate}
				color="#3b82f6"
			/>
			<DirectionCard
				title="JP → KR"
				attempted={data.jpToKrAttempted}
				success={data.jpToKrSuccess}
				rate={jpToKrRate}
				color="#ec4899"
			/>
			<Card style={{ flex: 1, minWidth: 200 }}>
				<Card.Content>
					<p className={"text-sm text-neutral-700"}>글로벌 좋아요</p>
					<StatRow label="대기 중" value={data.pendingLikes} />
					<StatRow label="기간 내 만료" value={data.expiredLikesInPeriod} />
				</Card.Content>
			</Card>
			<Card style={{ flex: 1, minWidth: 200 }}>
				<Card.Content>
					<p className={"text-sm text-neutral-700"}>History TTL</p>
					<StatRow label="TTL 설정" value={`${ttl.ttlDays}일`} />
					<StatRow label="기간 내 만료" value={ttl.expiredInPeriod} />
					<StatRow label="활성 제외" value={ttl.currentActiveExclusions} />
				</Card.Content>
			</Card>
		</div>
	);
}
function DirectionCard({
	title,
	attempted,
	success,
	rate,
	color,
}: {
	title: string;
	attempted: number;
	success: number;
	rate: string;
	color: string;
}) {
	return (
		<Card style={{ flex: 1, minWidth: 200 }}>
			<Card.Content>
				<p className={"text-sm text-neutral-700"}>{title}</p>
				<h4 className={"text-lg font-semibold text-neutral-900"}>{rate}%</h4>
				<span className={"text-sm text-neutral-700"}>
					{success.toLocaleString()}/ {attempted.toLocaleString()}시도
				</span>
			</Card.Content>
		</Card>
	);
}
function StatRow({
	label,
	value,
}: {
	label: string;
	value: string | number;
}) {
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "space-between",
				paddingTop: 4,
				paddingBottom: 4,
			}}
		>
			<p className={"text-sm text-neutral-700"}>{label}</p>
			<p className={"text-sm text-neutral-700"}>
				{typeof value === "number" ? value.toLocaleString() : value}
			</p>
		</div>
	);
}
