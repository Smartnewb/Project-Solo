"use client";
import { Card } from "@heroui/react";
import { useMemo } from "react";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Cell,
} from "recharts";
import type { PipelineTransparency } from "../types";
const FILTER_COLORS = [
	"#3b82f6",
	"#8b5cf6",
	"#ec4899",
	"#f59e0b",
	"#10b981",
	"#6366f1",
	"#ef4444",
];
const FILTER_LABELS: Record<string, string> = {
	NO_PHOTO_POOL_CANDIDATES: "사진 심사 완료 후보 없음",
	NO_ELIGIBLE_CANDIDATES: "적격 후보 없음",
	NO_COMPATIBLE_CANDIDATES: "호환 후보 없음",
	NO_REGION_CANDIDATES: "지역 조건 후보 없음",
	NO_PREFERENCE_MATCH: "선호 조건 불일치",
	ALREADY_MATCHED: "이미 매칭됨",
	BLOCKED_OR_REPORTED: "차단/신고 관계",
};
function formatFilterLabel(filterName: string) {
	return (
		FILTER_LABELS[filterName] ?? filterName.replace(/_/g, " ").toLowerCase()
	);
}
export default function PipelineAnalysis({
	data,
}: {
	data: PipelineTransparency;
}) {
	const filterData = useMemo(
		() =>
			[...data.byFilter]
				.sort((a, b) => b.totalEliminated - a.totalEliminated)
				.slice(0, 10)
				.map((item) => ({
					...item,
					label: formatFilterLabel(item.filterName),
				})),
		[data.byFilter],
	);
	const relaxData = useMemo(
		() =>
			data.byRelaxationStep.map((s) => ({
				name: `Step ${s.step}`,
				count: s.count,
			})),
		[data.byRelaxationStep],
	);
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
			<div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
				<StatCard label="총 실패 로그" value={data.totalFailureLogs} />
				<StatCard
					label="필터 전 평균 후보"
					value={data.avgCandidatesBeforeFilter}
				/>
				<StatCard
					label="필터 후 평균 후보"
					value={data.avgCandidatesAfterFilter}
				/>
				<StatCard
					label="후보 0명 건수"
					value={data.zeroCandidateCount}
					highlight={data.zeroCandidateCount > 0}
				/>
			</div>
			<div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
				<Card style={{ flex: 2, minWidth: 0 }}>
					<Card.Content>
						<p className={"text-sm text-neutral-700"}>필터별 탈락 건수</p>
						{filterData.length > 0 ? (
							<ResponsiveContainer width="100%" height={300}>
								<BarChart
									data={filterData}
									layout="vertical"
									margin={{ left: 20, right: 20 }}
								>
									<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
									<XAxis type="number" tick={{ fontSize: 12 }} />
									<YAxis
										type="category"
										dataKey="label"
										tick={{ fontSize: 11 }}
										width={160}
									/>
									<Tooltip
										formatter={(value: number) => [
											value.toLocaleString(),
											"탈락 건수",
										]}
										labelFormatter={(label) => String(label)}
									/>
									<Bar dataKey="totalEliminated" radius={[0, 4, 4, 0]}>
										{filterData.map((_, i) => (
											<Cell
												key={i}
												fill={FILTER_COLORS[i % FILTER_COLORS.length]}
											/>
										))}
									</Bar>
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
				<Card style={{ flex: 1, minWidth: 280 }}>
					<Card.Content>
						<p className={"text-sm text-neutral-700"}>릴랙세이션 단계 분포</p>
						{relaxData.length > 0 ? (
							<ResponsiveContainer width="100%" height={300}>
								<BarChart data={relaxData} margin={{ left: 0, right: 10 }}>
									<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
									<XAxis dataKey="name" tick={{ fontSize: 12 }} />
									<YAxis tick={{ fontSize: 12 }} />
									<Tooltip />
									<Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
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
function StatCard({
	label,
	value,
	highlight,
}: {
	label: string;
	value: number;
	highlight?: boolean;
}) {
	return (
		<Card
			style={{ flex: 1, minWidth: 160 }}
			className={highlight ? "border-l-4 border-amber-500" : undefined}
		>
			<Card.Content
				style={{ textAlign: "center", paddingTop: 16, paddingBottom: 16 }}
			>
				<span className={"text-sm text-neutral-700"}>{label}</span>
				<h2 className={"text-lg font-semibold text-neutral-900"}>
					{value.toLocaleString()}
				</h2>
			</Card.Content>
		</Card>
	);
}
