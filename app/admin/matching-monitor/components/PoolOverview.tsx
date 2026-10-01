"use client";
import { Card, Chip, ProgressBar } from "@heroui/react";
import type { PoolOverview as PoolOverviewType, SegmentStat } from "../types";
interface Props {
	pool: PoolOverviewType;
	segments: SegmentStat[];
}
function formatRankLabel(rank: string) {
	return rank === "UNKNOWN" ? "등급 미분류" : rank;
}
export default function PoolOverviewSection({ pool, segments }: Props) {
	const { maleCount, femaleCount } = pool;
	const total = maleCount + femaleCount;
	const malePercent = total > 0 ? (maleCount / total) * 100 : 50;
	return (
		<div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
			<Card className="w-full lg:flex-1 min-w-0">
				<Card.Content>
					<p className={"text-sm text-neutral-700"}>매칭 풀 현황</p>
					<div style={{ marginBottom: 16 }}>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								marginBottom: 4,
							}}
						>
							<p className={"text-sm text-neutral-700"}>
								남성 {maleCount.toLocaleString()}명
							</p>
							<p className={"text-sm text-neutral-700"}>
								여성 {femaleCount.toLocaleString()}명
							</p>
						</div>
						<div
							style={{
								display: "flex",
								height: 12,
								borderRadius: 8,
								overflow: "hidden",
							}}
						>
							<div
								style={{ width: `${malePercent}%`, backgroundColor: "#3b82f6" }}
							></div>
							<div
								style={{
									width: `${100 - malePercent}%`,
									backgroundColor: "#ec4899",
								}}
							></div>
						</div>
						<span
							style={{ marginTop: 4, display: "block" }}
							className={"text-sm text-neutral-700"}
						>
							성비 {pool.genderRatio}
						</span>
					</div>
					<div
						style={{
							display: "flex",
							gap: 8,
							flexWrap: "wrap",
							marginBottom: 16,
						}}
					>
						{Object.entries(pool.byRank).map(([rank, count]) => (
							<Chip key={rank} size={"sm"} variant={"soft"}>
								<Chip.Label>{`${formatRankLabel(rank)}: ${count.toLocaleString()}`}</Chip.Label>
							</Chip>
						))}
					</div>
					{pool.prefOptionZeroCount > 0 && (
						<p className={"text-sm text-neutral-700"}>
							온보딩 미완료 (선호 0개): {pool.prefOptionZeroCount}명
						</p>
					)}
				</Card.Content>
			</Card>
			<Card className="w-full lg:flex-1 min-w-0">
				<Card.Content>
					<p className={"text-sm text-neutral-700"}>랭크별 성별 분포</p>
					<div className={"overflow-x-auto"}>
						<table
							className={
								"w-full text-sm text-left [&_td]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
							}
						>
							<thead>
								<tr>
									<th scope="col">랭크</th>
									<th scope="col">남성</th>
									<th scope="col">여성</th>
									<th scope="col">합계</th>
									<th style={{ width: 120 }} scope="col">
										비율
									</th>
								</tr>
							</thead>
							<tbody>
								{segments.map((seg) => {
									const segTotal = seg.maleCount + seg.femaleCount;
									const malePct =
										segTotal > 0 ? (seg.maleCount / segTotal) * 100 : 50;
									return (
										<tr key={seg.rank}>
											<td>
												<Chip size={"sm"} variant={"soft"}>
													<Chip.Label>{formatRankLabel(seg.rank)}</Chip.Label>
												</Chip>
											</td>
											<td>{seg.maleCount.toLocaleString()}</td>
											<td>{seg.femaleCount.toLocaleString()}</td>
											<td>{segTotal.toLocaleString()}</td>
											<td>
												<ProgressBar value={malePct} aria-label="진행률">
													<ProgressBar.Track>
														<ProgressBar.Fill />
													</ProgressBar.Track>
												</ProgressBar>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</Card.Content>
			</Card>
		</div>
	);
}
