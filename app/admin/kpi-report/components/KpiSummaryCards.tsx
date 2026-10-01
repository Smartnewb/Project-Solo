"use client";
import { Card, Chip, Skeleton } from "@heroui/react";
import {
	KpiValue,
	KpiCategory,
	CATEGORY_CONFIG,
	CATEGORIES,
	STATUS_CONFIG,
	formatKpiValue,
	formatChangeRate,
} from "../types";
interface KpiSummaryCardsProps {
	kpis: KpiValue[];
	loading: boolean;
}
const REPRESENTATIVE_KPI: Record<KpiCategory, number> = {
	acquisition: 0,
	onboarding: 0,
	engagement: 0,
	matching: 0,
	monetization: 0,
};
export default function KpiSummaryCards({
	kpis,
	loading,
}: KpiSummaryCardsProps) {
	if (loading) {
		return (
			<div className={"grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"}>
				{CATEGORIES.map((cat) => (
					<div key={cat} className={"min-w-0"}>
						<Card>
							<Card.Content style={{ padding: 16 }}>
								<Skeleton
									style={{ width: 80, height: 20 }}
									className="rounded-xl"
								/>
								<Skeleton
									style={{ ...{ marginTop: 8 }, ...{ width: 100, height: 36 } }}
									className="rounded-xl"
								/>
								<Skeleton
									style={{ width: 60, height: 20 }}
									className="rounded-xl"
								/>
							</Card.Content>
						</Card>
					</div>
				))}
			</div>
		);
	}
	return (
		<div className={"grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"}>
			{CATEGORIES.map((category) => {
				const config = CATEGORY_CONFIG[category];
				const categoryKpis = kpis.filter((k) => k.category === category);
				const representative = categoryKpis[REPRESENTATIVE_KPI[category]];
				if (!representative) return null;
				const change = formatChangeRate(representative.changeRate);
				const statusConfig = STATUS_CONFIG[representative.status];
				return (
					<div key={category} className={"min-w-0"}>
						<Card style={{ borderTop: `3px solid ${config.color}` }}>
							<Card.Content style={{ padding: 16 }}>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										gap: 4,
										marginBottom: 8,
									}}
								>
									<span
										style={{ fontSize: "1rem" }}
										className={"text-sm text-neutral-700"}
									>
										{config.icon}
									</span>
									<span className={"text-sm text-neutral-700"}>
										{config.label}
									</span>
								</div>
								<h2 className={"text-lg font-semibold text-neutral-900"}>
									{formatKpiValue(
										representative.currentValue,
										representative.unit,
									)}
								</h2>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										gap: 8,
										marginTop: 4,
									}}
								>
									<span
										style={{ color: change.color }}
										className={"text-sm text-neutral-700"}
									>
										{change.text}
									</span>
									<Chip
										style={{ height: 20, fontSize: "0.65rem" }}
										size={"sm"}
										variant={"soft"}
									>
										<Chip.Label>{statusConfig.arrow}</Chip.Label>
									</Chip>
								</div>
								<span
									style={{ display: "block", marginTop: 4 }}
									className={"text-sm text-neutral-700"}
								>
									{representative.label}
								</span>
							</Card.Content>
						</Card>
					</div>
				);
			})}
		</div>
	);
}
