"use client";
import { Card, Skeleton } from "@heroui/react";
import { TrendingUp, UserPlus, Users } from "lucide-react";
import { KPI } from "../types";
interface TodayMetricsProps {
	kpi: KPI | null;
	loading?: boolean;
}
interface MetricItemProps {
	label: string;
	value: number | string;
	icon: React.ReactNode;
	color: string;
	bgColor: string;
	loading?: boolean;
	suffix?: string;
}
const formatNumber = (value: number | undefined | null) =>
	(value ?? 0).toLocaleString();
function MetricItem({
	label,
	value,
	icon,
	color,
	bgColor,
	loading,
	suffix,
}: MetricItemProps) {
	return (
		<div className="flex items-center gap-3">
			<div
				style={{
					padding: 12,
					borderRadius: 16,
					backgroundColor: bgColor,
					color: color,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				{icon}
			</div>
			<div className="flex-1">
				<p className={"text-sm text-neutral-700"}>{label}</p>
				{loading ? (
					<Skeleton style={{ width: 80, height: 28 }} className="rounded-xl" />
				) : (
					<h2 style={{}} className={"text-lg font-semibold text-neutral-900"}>
						{typeof value === "number" ? formatNumber(value) : value}
						{suffix && (
							<span
								style={{ color: "#6b7280", marginLeft: 4 }}
								className={"text-sm text-neutral-700"}
							>
								{suffix}
							</span>
						)}
					</h2>
				)}
			</div>
		</div>
	);
}
export default function TodayMetrics({ kpi, loading }: TodayMetricsProps) {
	return (
		<Card>
			<Card.Content>
				<div className="flex items-center gap-2 mb-4">
					<h2 className={"text-lg font-semibold text-neutral-900"}>
						📊 오늘의 핵심 지표
					</h2>
				</div>
				<div className={"grid grid-cols-12 gap-4"}>
					<div className={"min-w-0 col-span-12 sm:col-span-4"}>
						<MetricItem
							label="오늘 가입"
							value={kpi?.dailySignups ?? 0}
							icon={<UserPlus size={18} />}
							color="#3b82f6"
							bgColor="#eff6ff"
							loading={loading}
							suffix="명"
						/>
					</div>
					<div className={"min-w-0 col-span-12 sm:col-span-4"}>
						<MetricItem
							label="총 회원 수"
							value={kpi?.totalUsers ?? 0}
							icon={<Users size={18} />}
							color="#8b5cf6"
							bgColor="#f5f3ff"
							loading={loading}
							suffix="명"
						/>
					</div>
					<div className={"min-w-0 col-span-12 sm:col-span-4"}>
						<MetricItem
							label="매칭률"
							value={`${(kpi?.matchingRate ?? 0).toFixed(1)}`}
							icon={<TrendingUp size={18} />}
							color="#10b981"
							bgColor="#ecfdf5"
							loading={loading}
							suffix="%"
						/>
					</div>
				</div>
			</Card.Content>
		</Card>
	);
}
