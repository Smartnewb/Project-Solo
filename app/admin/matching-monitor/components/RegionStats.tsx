"use client";
import { Card, Chip } from "@heroui/react";
import type { RegionStat } from "../types";
export default function RegionStats({
	data,
}: {
	data: RegionStat[];
}) {
	return (
		<Card>
			<Card.Content>
				<p className={"text-sm text-neutral-700"}>지역별 매칭 실패 현황</p>
				<div className={"overflow-x-auto"}>
					<table
						className={
							"w-full text-sm text-left [&_td]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
						}
					>
						<thead>
							<tr>
								<th scope="col">지역</th>
								<th scope="col">실패 건수</th>
								<th scope="col">후보 0명</th>
								<th scope="col">지역 내 풀</th>
								<th scope="col">광역 풀</th>
								<th scope="col">전국 풀</th>
							</tr>
						</thead>
						<tbody>
							{data.length === 0 ? (
								<tr>
									<td
										colSpan={6}
										style={{
											paddingTop: 32,
											paddingBottom: 32,
											color: "#525252",
										}}
									>
										데이터 없음
									</td>
								</tr>
							) : (
								data.map((region) => (
									<tr key={region.region}>
										<td>{region.region}</td>
										<td>
											<Chip size={"sm"} variant={"soft"}>
												<Chip.Label>
													{region.failureCount.toLocaleString()}
												</Chip.Label>
											</Chip>
										</td>
										<td>
											{region.zeroCandidateCount > 0 ? (
												<p className={"text-sm text-neutral-700"}>
													{region.zeroCandidateCount}
												</p>
											) : (
												0
											)}
										</td>
										<td>{region.avgPoolInRegion.toLocaleString()}</td>
										<td>{region.avgPoolInMetro.toLocaleString()}</td>
										<td>{region.avgPoolNationwide.toLocaleString()}</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</Card.Content>
		</Card>
	);
}
