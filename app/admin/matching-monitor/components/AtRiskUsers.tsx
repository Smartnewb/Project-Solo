"use client";
import { Button, ButtonGroup, Card, Chip } from "@heroui/react";
import { useState, useMemo } from "react";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip as RechartsTooltip,
	ResponsiveContainer,
} from "recharts";
import { safeFormat } from "@/app/utils/formatters";
import type { AtRiskUsers as AtRiskUsersType } from "../types";
const FAILURE_REASON_LABELS: Record<string, string> = {
	NO_SQL_CANDIDATES: "SQL 후보 없음",
	NO_PHOTO_POOL_CANDIDATES: "사진 심사 완료 후보 없음",
	NO_ELIGIBLE_CANDIDATES: "적격 후보 없음",
	NO_COMPATIBLE_CANDIDATES: "호환 후보 없음",
	NO_REGION_CANDIDATES: "지역 조건 후보 없음",
	NO_PREFERENCE_MATCH: "선호 조건 불일치",
};
function formatFailureReason(reason: string) {
	return (
		FAILURE_REASON_LABELS[reason] ?? reason.replace(/_/g, " ").toLowerCase()
	);
}
function getFailureReasonLabel(payload: unknown, fallback: string) {
	if (
		payload &&
		typeof payload === "object" &&
		"fullName" in payload &&
		typeof (
			payload as {
				fullName?: unknown;
			}
		).fullName === "string"
	) {
		return (
			payload as {
				fullName: string;
			}
		).fullName;
	}
	return fallback;
}
export default function AtRiskUsersSection({
	data,
	onUserClick,
}: {
	data: AtRiskUsersType;
	onUserClick: (userId: string) => void;
}) {
	const [riskPeriod, setRiskPeriod] = useState<"3d" | "7d">("3d");
	const users = riskPeriod === "3d" ? data.riskUsers3d : data.riskUsers7d;
	const reasonData = useMemo(
		() =>
			data.topFailureReasons.map((r) => ({
				name: formatFailureReason(r.reason),
				fullName: formatFailureReason(r.reason),
				count: r.count,
			})),
		[data.topFailureReasons],
	);
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
			<div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
				<Card style={{ flex: 1, minWidth: 160, textAlign: "center" }}>
					<Card.Content>
						<span className={"text-sm text-neutral-700"}>3일+ 연속 실패</span>
						<h4 className={"text-lg font-semibold text-neutral-900"}>
							{data.riskUsers3d.length}
						</h4>
					</Card.Content>
				</Card>
				<Card style={{ flex: 1, minWidth: 160, textAlign: "center" }}>
					<Card.Content>
						<span className={"text-sm text-neutral-700"}>7일+ 연속 실패</span>
						<h4 className={"text-lg font-semibold text-neutral-900"}>
							{data.riskUsers7d.length}
						</h4>
					</Card.Content>
				</Card>
				<Card style={{ flex: 1, minWidth: 160, textAlign: "center" }}>
					<Card.Content>
						<span className={"text-sm text-neutral-700"}>24h 후보 0명</span>
						<h4 className={"text-lg font-semibold text-neutral-900"}>
							{data.zeroCandidateUsers}
						</h4>
					</Card.Content>
				</Card>
			</div>
			<div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
				<Card style={{ flex: 2, minWidth: 0 }}>
					<Card.Content>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								marginBottom: 16,
							}}
						>
							<p className={"text-sm text-neutral-700"}>위험 유저 목록</p>
							<ButtonGroup
								aria-label={"지표 필터"}
								className={"flex flex-wrap"}
							>
								<Button
									variant={riskPeriod === "3d" ? "primary" : "secondary"}
									aria-pressed={riskPeriod === "3d"}
									onPress={() => setRiskPeriod("3d")}
								>
									3일+
								</Button>
								<Button
									variant={riskPeriod === "7d" ? "primary" : "secondary"}
									aria-pressed={riskPeriod === "7d"}
									onPress={() => setRiskPeriod("7d")}
								>
									7일+
								</Button>
							</ButtonGroup>
						</div>
						<div style={{ maxHeight: 400 }} className={"overflow-x-auto"}>
							<table
								className={
									"w-full text-sm text-left [&_td]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
								}
							>
								<thead>
									<tr>
										<th scope="col">이름</th>
										<th scope="col">성별</th>
										<th scope="col">연속 실패일</th>
										<th scope="col">마지막 실패 사유</th>
										<th scope="col">시각</th>
									</tr>
								</thead>
								<tbody>
									{users.length === 0 ? (
										<tr>
											<td
												colSpan={5}
												style={{
													paddingTop: 32,
													paddingBottom: 32,
													color: "#525252",
												}}
											>
												위험 유저 없음
											</td>
										</tr>
									) : (
										users.map((user) => (
											<tr key={user.userId} style={{ cursor: "pointer" }}>
												<td>
													<div title={user.userId}>
														<Button
															variant="ghost"
															onPress={() => onUserClick(user.userId)}
															aria-label={`${user.name} 매칭 실패 진단 열기`}
														>
															{user.name}
														</Button>
													</div>
												</td>
												<td>
													<Chip
														style={{
															backgroundColor:
																user.gender === "MALE" ? "#eff6ff" : "#fdf2f8",
															color:
																user.gender === "MALE" ? "#3b82f6" : "#ec4899",
															fontWeight: 600,
														}}
														size={"sm"}
														variant={"soft"}
													>
														<Chip.Label>
															{user.gender === "MALE" ? "남" : "여"}
														</Chip.Label>
													</Chip>
												</td>
												<td>
													<Chip size={"sm"} variant={"soft"}>
														<Chip.Label>{`${user.consecutiveFailureDays}일`}</Chip.Label>
													</Chip>
												</td>
												<td>
													<p
														style={{
															maxWidth: 200,
															overflow: "hidden",
															textOverflow: "ellipsis",
															whiteSpace: "nowrap",
														}}
														className={"text-sm text-neutral-700"}
													>
														{formatFailureReason(user.lastFailureReason)}
													</p>
												</td>
												<td>
													<span className={"text-sm text-neutral-700"}>
														{safeFormat(user.lastFailedAt, "MM/dd HH:mm")}
													</span>
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					</Card.Content>
				</Card>
				<Card style={{ flex: 1, minWidth: 0 }}>
					<Card.Content>
						<p className={"text-sm text-neutral-700"}>상위 실패 사유</p>
						{reasonData.length > 0 ? (
							<ResponsiveContainer width="100%" height={350}>
								<BarChart
									data={reasonData}
									layout="vertical"
									margin={{ left: 10, right: 10 }}
								>
									<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
									<XAxis type="number" tick={{ fontSize: 12 }} />
									<YAxis
										type="category"
										dataKey="name"
										tick={{ fontSize: 11 }}
										width={140}
									/>
									<RechartsTooltip
										formatter={(value: number) => [
											value.toLocaleString(),
											"건수",
										]}
										labelFormatter={(
											label: string,
											payload: Array<{
												payload?: unknown;
											}>,
										) => getFailureReasonLabel(payload?.[0]?.payload, label)}
									/>
									<Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
								</BarChart>
							</ResponsiveContainer>
						) : (
							<p
								style={{
									paddingTop: 32,
									paddingBottom: 32,
									textAlign: "center",
								}}
								className={"text-sm text-neutral-700"}
							>
								데이터 없음
							</p>
						)}
					</Card.Content>
				</Card>
			</div>
		</div>
	);
}
