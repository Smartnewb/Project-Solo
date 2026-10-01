"use client";
import { Card } from "@heroui/react";
import { Handshake, Heart, MessageCircle, Users } from "lucide-react";
import type { PoolOverview, MatchRate, PostMatchFunnel } from "../types";
interface KpiCardProps {
	icon: React.ReactNode;
	label: string;
	value: string | number;
	sub?: string;
	bgColor: string;
}
function KpiCard({ icon, label, value, sub, bgColor }: KpiCardProps) {
	return (
		<Card style={{ flex: 1, minWidth: 200 }}>
			<Card.Content
				style={{
					display: "flex",
					alignItems: "center",
					gap: 16,
					paddingTop: 16,
					paddingBottom: 16,
				}}
			>
				<div
					style={{
						padding: 12,
						borderRadius: 16,
						backgroundColor: bgColor,
						display: "flex",
						alignItems: "center",
					}}
				>
					{icon}
				</div>
				<div>
					<p className={"text-sm text-neutral-700"}>{label}</p>
					<h2 className={"text-lg font-semibold text-neutral-900"}>{value}</h2>
					{sub && <span className={"text-sm text-neutral-700"}>{sub}</span>}
				</div>
			</Card.Content>
		</Card>
	);
}
interface Props {
	pool: PoolOverview;
	matchRate: MatchRate;
	funnel: PostMatchFunnel;
}
export default function KpiCards({ pool, matchRate, funnel }: Props) {
	return (
		<div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
			<KpiCard
				icon={<Users style={{ color: "#3b82f6" }} size={18} />}
				label="전체 적격 유저"
				value={pool.totalEligible.toLocaleString()}
				sub={`활성 ${pool.activeUsers30d.toLocaleString()}명`}
				bgColor="#eff6ff"
			/>
			<KpiCard
				icon={<Heart style={{ color: "#ec4899" }} size={18} />}
				label="매칭 생성"
				value={matchRate.totalCreated.toLocaleString()}
				sub={`스케줄드 ${matchRate.scheduledCount} / 일반 ${matchRate.normalCount}`}
				bgColor="#fdf2f8"
			/>
			<KpiCard
				icon={<Handshake style={{ color: "#f59e0b" }} size={18} />}
				label="상호 수락률"
				value={`${funnel.mutualAcceptRate}%`}
				sub={`${funnel.mutualAccepted}건 수락`}
				bgColor="#fffbeb"
			/>
			<KpiCard
				icon={<MessageCircle style={{ color: "#10b981" }} size={18} />}
				label="채팅 개설률"
				value={`${funnel.chatOpenRate}%`}
				sub={`활성 채팅방 ${funnel.chatRoomsActive}개`}
				bgColor="#ecfdf5"
			/>
		</div>
	);
}
