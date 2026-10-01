"use client";
import { Button, Card, Separator, Skeleton } from "@heroui/react";
import { ArrowRight } from "lucide-react";
import { useMemo } from "react";
import Link from "next/link";
import { KPI } from "../types";
import { useRevenueSummary } from "@/app/admin/hooks/use-revenue-v2";
interface RevenueOverviewProps {
	kpi: KPI | null;
	loading?: boolean;
}
const formatCurrency = (value: number | undefined | null) => {
	const v = value ?? 0;
	if (v >= 100000000) {
		return `${(v / 100000000).toFixed(1)}억`;
	}
	if (v >= 10000000) {
		return `${(v / 10000).toFixed(0)}만`;
	}
	if (v >= 10000) {
		return `${(v / 10000).toFixed(1)}만`;
	}
	return `${v.toLocaleString()}`;
};
export default function RevenueOverview({
	kpi,
	loading,
}: RevenueOverviewProps) {
	const { startDate, endDate } = useMemo(() => {
		const now = new Date();
		const y = now.getFullYear();
		const m = String(now.getMonth() + 1).padStart(2, "0");
		const d = String(now.getDate()).padStart(2, "0");
		return {
			startDate: `${y}-${m}-01`,
			endDate: `${y}-${m}-${d}`,
		};
	}, []);
	const { data: v2Summary, isLoading: v2Loading } = useRevenueSummary(
		startDate,
		endDate,
	);
	const isLoading = loading || v2Loading;
	const totalRevenue = v2Summary?.totalRevenue ?? kpi?.monthlyRevenue ?? 0;
	const pgRevenue = v2Summary?.pgRevenue ?? 0;
	const iapRevenue = v2Summary?.iapRevenue ?? 0;
	return (
		<Card>
			<Card.Content>
				<div className="flex items-center justify-between mb-3">
					<h2 className={"text-lg font-semibold text-neutral-900"}>
						💰 매출 현황
					</h2>
					<Link href="/admin/sales" passHref>
						<Button
							style={{ textTransform: "none" }}
							variant={"tertiary"}
							size={"sm"}
						>
							상세 보기
							{<ArrowRight size={18} />}
						</Button>
					</Link>
				</div>
				{isLoading ? (
					<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
						<Skeleton
							style={{
								...{ borderRadius: 16 },
								...{ width: "100%", height: 80 },
							}}
							className="rounded-xl"
						/>
						<Skeleton
							style={{
								...{ borderRadius: 16 },
								...{ width: "100%", height: 60 },
							}}
							className="rounded-xl"
						/>
					</div>
				) : (
					<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
						<div
							style={{
								padding: 16,
								borderRadius: 16,
								backgroundColor: "#ecfdf5",
							}}
						>
							<p
								style={{ fontSize: "0.875rem" }}
								className={"text-sm text-neutral-700"}
							>
								이번 달 매출
							</p>
							<p
								style={{ color: "#059669", fontSize: "1.75rem" }}
								className={"text-sm text-neutral-700"}
							>
								₩{formatCurrency(totalRevenue)}
							</p>
						</div>
						<Separator></Separator>
						<div className={"grid grid-cols-12 gap-4"}>
							<div className={"min-w-0 col-span-6"}>
								<div
									style={{
										padding: 12,
										borderRadius: 8,
										backgroundColor: "#f0f9ff",
									}}
								>
									<span className={"text-sm text-neutral-700"}>PG 매출</span>
									<p className={"text-sm text-neutral-700"}>
										₩{formatCurrency(pgRevenue)}
									</p>
								</div>
							</div>
							<div className={"min-w-0 col-span-6"}>
								<div
									style={{
										padding: 12,
										borderRadius: 8,
										backgroundColor: "#fefce8",
									}}
								>
									<span className={"text-sm text-neutral-700"}>IAP 매출</span>
									<p className={"text-sm text-neutral-700"}>
										₩{formatCurrency(iapRevenue)}
									</p>
								</div>
							</div>
						</div>
					</div>
				)}
			</Card.Content>
		</Card>
	);
}
