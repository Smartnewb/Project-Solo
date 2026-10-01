"use client";
import { Disclosure, Chip, Skeleton } from "@heroui/react";
import { useState } from "react";
import {
	KpiValue,
	KpiCategory,
	CATEGORY_CONFIG,
	STATUS_CONFIG,
	formatKpiValue,
	formatChangeRate,
} from "../types";
interface KpiCategoryTableProps {
	category: KpiCategory;
	categoryLabel: string;
	kpis: KpiValue[];
	loading: boolean;
	defaultExpanded?: boolean;
}
export default function KpiCategoryTable({
	category,
	categoryLabel,
	kpis,
	loading,
	defaultExpanded = false,
}: KpiCategoryTableProps) {
	const [expanded, setExpanded] = useState(defaultExpanded);
	const config = CATEGORY_CONFIG[category];
	const filteredKpis = kpis.filter((k) => k.category === category);
	return (
		<Disclosure
			isExpanded={expanded}
			onExpandedChange={setExpanded}
			className="overflow-hidden rounded-xl border border-gray-200 bg-white"
		>
			<Disclosure.Heading>
				<Disclosure.Trigger className="flex w-full items-center justify-between gap-3 p-4">
					<span className="flex items-center gap-2">
						<span aria-hidden="true">{config.icon}</span>
						<span className="font-semibold">{categoryLabel}</span>
						<Chip size="sm">{filteredKpis.length}개</Chip>
					</span>
					<Disclosure.Indicator />
				</Disclosure.Trigger>
			</Disclosure.Heading>
			<Disclosure.Content>
				{loading ? (
					<div style={{ padding: 16 }}>
						{[1, 2, 3].map((i) => (
							<Skeleton
								key={i}
								style={{
									...{ marginBottom: 8, borderRadius: 8 },
									...{ width: "100%", height: 40 },
								}}
								className="rounded-xl"
							/>
						))}
					</div>
				) : (
					<div className={"overflow-x-auto"}>
						<table
							className={
								"min-w-[520px] w-full text-sm text-left [&_td]:p-3 [&_th]:p-3 [&_td:nth-child(n+2)]:text-right [&_th:nth-child(n+2)]:text-right [&_td:last-child]:text-center [&_th:last-child]:text-center [&_thead]:bg-neutral-50 [&_tr]:border-b"
							}
						>
							<thead>
								<tr>
									<th style={{ fontWeight: 600 }} scope="col">
										KPI
									</th>
									<th style={{ fontWeight: 600 }} scope="col">
										전주
									</th>
									<th style={{ fontWeight: 600 }} scope="col">
										금주
									</th>
									<th style={{ fontWeight: 600 }} scope="col">
										변화율
									</th>
									<th style={{ fontWeight: 600 }} scope="col">
										상태
									</th>
								</tr>
							</thead>
							<tbody>
								{filteredKpis.map((kpi) => {
									const change = formatChangeRate(kpi.changeRate);
									const statusConfig = STATUS_CONFIG[kpi.status];
									return (
										<tr key={kpi.name}>
											<td>
												<p className={"text-sm text-neutral-700"}>
													{kpi.label}
												</p>
												{kpi.description && (
													<span className={"text-sm text-neutral-700"}>
														{kpi.description}
													</span>
												)}
											</td>
											<td>
												<p className={"text-sm text-neutral-700"}>
													{formatKpiValue(kpi.previousValue, kpi.unit)}
												</p>
											</td>
											<td>
												<p className={"text-sm text-neutral-700"}>
													{formatKpiValue(kpi.currentValue, kpi.unit)}
												</p>
											</td>
											<td>
												<p
													style={{ color: change.color }}
													className={"text-sm text-neutral-700"}
												>
													{change.text}
												</p>
											</td>
											<td>
												<Chip
													style={{ height: 22, fontSize: "0.7rem" }}
													size={"sm"}
													variant={"soft"}
												>
													<Chip.Label>{statusConfig.arrow}</Chip.Label>
												</Chip>
											</td>
										</tr>
									);
								})}
								{filteredKpis.length === 0 && (
									<tr>
										<td colSpan={5}>
											<p
												style={{ paddingTop: 16, paddingBottom: 16 }}
												className={"text-sm text-neutral-700"}
											>
												데이터가 없습니다.
											</p>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				)}
			</Disclosure.Content>
		</Disclosure>
	);
}
