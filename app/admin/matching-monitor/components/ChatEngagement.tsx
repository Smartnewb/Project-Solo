"use client";
import { Card } from "@heroui/react";
import type { ChatEngagement as ChatEngagementType } from "../types";
export default function ChatEngagementSection({
	data,
}: {
	data: ChatEngagementType;
}) {
	return (
		<Card>
			<Card.Content>
				<p className={"text-sm text-neutral-700"}>채팅 품질</p>
				<div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
					<Metric label="총 채팅방" value={data.totalRooms} />
					<Metric
						label="메시지 있는 방"
						value={data.roomsWithMessages}
						sub={`${data.messageRate}%`}
					/>
					<Metric
						label="양방향 대화"
						value={data.mutualChatRooms}
						sub={`${data.mutualChatRate}%`}
					/>
					<Metric
						label="방당 평균 메시지"
						value={
							data.avgMessagesPerRoom != null
								? data.avgMessagesPerRoom.toFixed(1)
								: "-"
						}
					/>
					<Metric
						label="첫 메시지까지"
						value={
							data.avgMinutesToFirstMessage != null
								? `${data.avgMinutesToFirstMessage.toFixed(0)}분`
								: "-"
						}
					/>
					<Metric label="총 메시지" value={data.totalMessages} />
				</div>
			</Card.Content>
		</Card>
	);
}
function Metric({
	label,
	value,
	sub,
}: {
	label: string;
	value: number | string;
	sub?: string;
}) {
	return (
		<div style={{ textAlign: "center", minWidth: 100 }}>
			<span className={"text-sm text-neutral-700"}>{label}</span>
			<h2 className={"text-lg font-semibold text-neutral-900"}>
				{typeof value === "number" ? value.toLocaleString() : value}
			</h2>
			{sub && <span className={"text-sm text-neutral-700"}>{sub}</span>}
		</div>
	);
}
