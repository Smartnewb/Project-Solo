"use client";
import { Card, Chip, Tooltip } from "@heroui/react";
import { safeFormat } from "@/app/utils/formatters";
import type { MatchDetail } from "../types";
const LIKE_STATUS_CONFIG: Record<
	string,
	{
		label: string;
		color: "default" | "success" | "warning" | "error";
	}
> = {
	PENDING: { label: "대기", color: "warning" },
	ACCEPTED: { label: "수락", color: "success" },
	EXPIRED: { label: "만료", color: "default" },
	REJECTED: { label: "거절", color: "error" },
};
const MATCH_TYPE_LABEL: Record<string, string> = {
	scheduled: "스케줄드",
	rematching: "리매칭",
	profile_viewer: "PV",
	admin: "어드민",
};
const ACTIVITY_LABEL: Record<
	string,
	{
		label: string;
		color: string;
	}
> = {
	mutual: { label: "양방향", color: "#16a34a" },
	one_sided: { label: "일방", color: "#f59e0b" },
	inactive: { label: "미활동", color: "#9ca3af" },
};
export default function MatchDetailsSection({
	data,
}: {
	data: MatchDetail[];
}) {
	return (
		<Card>
			<Card.Content>
				<p className={"text-sm text-neutral-700"}>
					매칭 상세 ({data.length}건)
				</p>
				<div style={{ maxHeight: 500 }} className={"overflow-x-auto"}>
					<table
						className={
							"w-full text-sm text-left [&_td]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
						}
					>
						<thead>
							<tr>
								<th scope="col">시각</th>
								<th scope="col">유형</th>
								<th scope="col">남성</th>
								<th scope="col">여성</th>
								<th scope="col">좋아요</th>
								<th scope="col">편지</th>
								<th scope="col">채팅</th>
								<th scope="col">24h 활동</th>
								<th scope="col">메시지</th>
							</tr>
						</thead>
						<tbody>
							{data.length === 0 ? (
								<tr>
									<td
										colSpan={9}
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
								data.map((item) => {
									const likeConfig = item.likeStatus
										? LIKE_STATUS_CONFIG[item.likeStatus]
										: null;
									const activityConfig = item.activity24hStatus
										? ACTIVITY_LABEL[item.activity24hStatus]
										: null;
									return (
										<tr key={item.connectionId}>
											<td>
												<Tooltip>
													<Tooltip.Trigger tabIndex={0}>
														<span className={"text-sm text-neutral-700"}>
															{safeFormat(item.publishedAt, "MM/dd HH:mm")}
														</span>
													</Tooltip.Trigger>
													<Tooltip.Content>{item.connectionId}</Tooltip.Content>
												</Tooltip>
											</td>
											<td>
												<Chip size={"sm"} variant={"soft"}>
													<Chip.Label>
														{MATCH_TYPE_LABEL[item.matchType] || item.matchType}
													</Chip.Label>
												</Chip>
											</td>
											<td>
												<p className={"text-sm text-neutral-700"}>
													{item.maleName}
												</p>
											</td>
											<td>
												<p className={"text-sm text-neutral-700"}>
													{item.femaleName}
												</p>
											</td>
											<td>
												{likeConfig ? (
													<Chip size={"sm"} variant={"soft"}>
														<Chip.Label>{likeConfig.label}</Chip.Label>
													</Chip>
												) : (
													<span className={"text-sm text-neutral-700"}>-</span>
												)}
											</td>
											<td>
												{item.hasLetter ? (
													<Chip
														style={{
															backgroundColor: "#eff6ff",
															color: "#3b82f6",
															fontWeight: 700,
														}}
														size={"sm"}
														variant={"soft"}
													>
														<Chip.Label>{"O"}</Chip.Label>
													</Chip>
												) : (
													<span className={"text-sm text-neutral-700"}>-</span>
												)}
											</td>
											<td>
												{item.hasChatRoom ? (
													<Chip size={"sm"} variant={"soft"}>
														<Chip.Label>
															{item.chatActive ? "활성" : "비활성"}
														</Chip.Label>
													</Chip>
												) : (
													<span className={"text-sm text-neutral-700"}>-</span>
												)}
											</td>
											<td>
												{activityConfig ? (
													<p className={"text-sm text-neutral-700"}>
														{activityConfig.label}
													</p>
												) : (
													<span className={"text-sm text-neutral-700"}>-</span>
												)}
											</td>
											<td>
												{item.messageCount > 0 ? (
													<Tooltip>
														<Tooltip.Trigger tabIndex={0}>
															<p className={"text-sm text-neutral-700"}>
																{item.messageCount}
															</p>
														</Tooltip.Trigger>
														<Tooltip.Content>
															{item.lastMessageAt
																? safeFormat(item.lastMessageAt, "MM/dd HH:mm")
																: ""}
														</Tooltip.Content>
													</Tooltip>
												) : (
													<span className={"text-sm text-neutral-700"}>0</span>
												)}
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>
			</Card.Content>
		</Card>
	);
}
