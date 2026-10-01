"use client";
import { Card, Chip } from "@heroui/react";
import type { PostMatchFunnel } from "../types";
interface FunnelStep {
	label: string;
	value: number;
	color: string;
	rate?: number;
	rateLabel?: string;
}
export default function FunnelChart({
	data,
}: {
	data: PostMatchFunnel;
}) {
	const steps: FunnelStep[] = [
		{ label: "매칭 생성", value: data.matchesCreated, color: "#3b82f6" },
		{ label: "좋아요 발송", value: data.likesSent, color: "#8b5cf6" },
		{
			label: "상호 수락",
			value: data.mutualAccepted,
			color: "#f59e0b",
			rate: data.mutualAcceptRate,
			rateLabel: "수락률",
		},
		{
			label: "채팅방 개설",
			value: data.chatRoomsOpened,
			color: "#10b981",
			rate: data.chatOpenRate,
			rateLabel: "개설률",
		},
	];
	const maxValue = Math.max(...steps.map((s) => s.value), 1);
	return (
		<Card>
			<Card.Content>
				<p className={"text-sm text-neutral-700"}>포스트매칭 퍼널</p>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: 16,
						marginTop: 16,
					}}
				>
					{steps.map((step, i) => {
						const widthPct = Math.max((step.value / maxValue) * 100, 8);
						return (
							<div key={step.label}>
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										marginBottom: 4,
									}}
								>
									<p className={"text-sm text-neutral-700"}>{step.label}</p>
									<div
										style={{ display: "flex", alignItems: "center", gap: 8 }}
									>
										<p className={"text-sm text-neutral-700"}>
											{step.value.toLocaleString()}
										</p>
										{step.rate !== undefined && (
											<Chip
												style={{ fontSize: "0.75rem", height: 22 }}
												size={"sm"}
												variant={"soft"}
											>
												<Chip.Label>{`${step.rateLabel} ${step.rate}%`}</Chip.Label>
											</Chip>
										)}
									</div>
								</div>
								<div
									style={{
										height: 28,
										width: `${widthPct}%`,
										backgroundColor: step.color,
										borderRadius: 8,
										transition: "width 0.5s ease",
										opacity: 0.85,
									}}
								></div>
							</div>
						);
					})}
				</div>
				<div
					style={{
						marginTop: 24,
						paddingTop: 16,
						borderTop: "1px solid",
						display: "flex",
						gap: 24,
						flexWrap: "wrap",
					}}
				>
					<Stat
						label="편지 포함 좋아요"
						value={data.likesWithLetter}
						sub={`${data.letterRate}%`}
					/>
					<Stat label="만료된 좋아요" value={data.likeExpired} />
					<Stat label="거절된 좋아요" value={data.likeRejected} />
					<Stat label="활성 채팅방" value={data.chatRoomsActive} />
				</div>
			</Card.Content>
		</Card>
	);
}
function Stat({
	label,
	value,
	sub,
}: {
	label: string;
	value: number;
	sub?: string;
}) {
	return (
		<div>
			<span className={"text-sm text-neutral-700"}>{label}</span>
			<p className={"text-sm text-neutral-700"}>
				{value.toLocaleString()}
				{sub && (
					<span
						style={{ marginLeft: 4 }}
						className={"text-sm text-neutral-700"}
					>
						({sub})
					</span>
				)}
			</p>
		</div>
	);
}
