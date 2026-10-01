"use client";
import { Alert, Card, Chip, Skeleton } from "@heroui/react";
import {
	CountryBreakdownData,
	STATUS_CONFIG,
	formatKpiValue,
	formatChangeRate,
} from "../types";
interface CountryBreakdownProps {
	countryBreakdown?: CountryBreakdownData;
	loading: boolean;
}
const COUNTRY_INFO: Record<
	string,
	{
		flag: string;
		label: string;
	}
> = {
	KR: { flag: "🇰🇷", label: "한국" },
	JP: { flag: "🇯🇵", label: "일본" },
};
export default function CountryBreakdown({
	countryBreakdown,
	loading,
}: CountryBreakdownProps) {
	if (loading) {
		return (
			<Card>
				<Card.Content>
					<Skeleton
						style={{ ...{ marginBottom: 16 }, ...{ width: 160, height: 28 } }}
						className="rounded-xl"
					/>
					<div className={"grid grid-cols-12 gap-4"}>
						{[1, 2].map((i) => (
							<div key={i} className={"min-w-0 col-span-12 md:col-span-6"}>
								<Skeleton
									style={{
										...{ borderRadius: 8 },
										...{ width: "100%", height: 200 },
									}}
									className="rounded-xl"
								/>
							</div>
						))}
					</div>
				</Card.Content>
			</Card>
		);
	}
	if (!countryBreakdown) {
		return (
			<Card>
				<Card.Content>
					<h2
						style={{ marginBottom: 16 }}
						className={"text-lg font-semibold text-neutral-900"}
					>
						국가별 비교
					</h2>
					<Alert status={"default"}>
						<Alert.Content>
							국가별 데이터가 아직 생성되지 않았습니다.
						</Alert.Content>
					</Alert>
				</Card.Content>
			</Card>
		);
	}
	return (
		<Card>
			<Card.Content>
				<h2
					style={{ marginBottom: 16 }}
					className={"text-lg font-semibold text-neutral-900"}
				>
					국가별 비교
				</h2>
				<div className={"grid grid-cols-12 gap-4"}>
					{(Object.keys(countryBreakdown) as Array<"KR" | "JP">).map(
						(countryCode) => {
							const info = COUNTRY_INFO[countryCode];
							const kpis = countryBreakdown[countryCode];
							return (
								<div
									key={countryCode}
									className={"min-w-0 col-span-12 md:col-span-6"}
								>
									<div
										style={{
											border: "1px solid",
											borderColor: "#e5e5e5",
											borderRadius: 8,
											overflow: "hidden",
										}}
									>
										<div
											style={{
												backgroundColor: "#fafafa",
												paddingLeft: 16,
												paddingRight: 16,
												paddingTop: 8,
												paddingBottom: 8,
												display: "flex",
												alignItems: "center",
												gap: 8,
											}}
										>
											<p className={"text-sm text-neutral-700"}>{info.flag}</p>
											<p className={"text-sm text-neutral-700"}>{info.label}</p>
										</div>
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
															값
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
													{kpis.map((kpi) => {
														const change = formatChangeRate(kpi.changeRate);
														const statusConfig = STATUS_CONFIG[kpi.status];
														return (
															<tr key={kpi.name}>
																<td>
																	<p className={"text-sm text-neutral-700"}>
																		{kpi.label}
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
																		<Chip.Label>
																			{statusConfig.arrow}
																		</Chip.Label>
																	</Chip>
																</td>
															</tr>
														);
													})}
													{kpis.length === 0 && (
														<tr>
															<td colSpan={4}>
																<p
																	style={{ paddingTop: 8, paddingBottom: 8 }}
																	className={"text-sm text-neutral-700"}
																>
																	데이터 없음
																</p>
															</td>
														</tr>
													)}
												</tbody>
											</table>
										</div>
									</div>
								</div>
							);
						},
					)}
				</div>
			</Card.Content>
		</Card>
	);
}
