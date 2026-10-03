"use client";
import { Alert, Button, Chip, Spinner } from "@heroui/react";
import { useState } from "react";
import AdminService from "@/app/services/admin";
import type { MeetingRefundFailure } from "@/app/services/admin";
import { useConfirm } from "@/shared/ui/admin/confirm-dialog";
import { useToast } from "@/shared/ui/admin/toast";
import { meetingErrorMessage } from "./lib/errors";
import {
	depositStatusColor,
	depositStatusLabel,
	formatKrw,
	formatKst,
	shortId,
} from "./lib/format";
const COLUMNS = [
	"상태",
	"금액",
	"마지막 오류",
	"마지막 변경",
	"방 ID",
	"멤버 ID",
	"유저 ID",
	"처리",
];
interface RefundFailuresTableProps {
	items: MeetingRefundFailure[];
	loading: boolean;
	error: string | null;
	onDismissError: () => void;
	onOpenRoom: (roomId: string) => void;
	/** 재시도가 끝나면(성공·실패 모두) 목록을 새로 읽는다. */
	onChanged: () => void;
}
function failureKey(item: MeetingRefundFailure): string {
	return `${item.roomId}:${item.memberId}`;
}
export function RefundFailuresTable({
	items,
	loading,
	error,
	onDismissError,
	onOpenRoom,
	onChanged,
}: RefundFailuresTableProps) {
	const confirm = useConfirm();
	const toast = useToast();
	const [retryingKey, setRetryingKey] = useState<string | null>(null);
	const handleRetry = async (item: MeetingRefundFailure) => {
		if (retryingKey || item.status !== "REFUND_FAILED") return;
		const ok = await confirm({
			title: "환불 다시 시도",
			message: `${formatKrw(item.amount - item.refundedAmount)}을 다시 환불할게요. 결제사(PortOne)에 환불 요청이 바로 나가요.`,
			confirmText: "환불 재시도",
			severity: "warning",
		});
		if (!ok) return;
		setRetryingKey(failureKey(item));
		try {
			const result = await AdminService.meeting.refund(
				item.roomId,
				item.memberId,
			);
			toast.success(
				`환불했어요. (${formatKrw(result.amount)})`,
			);
		} catch (retryError) {
			toast.error(meetingErrorMessage(retryError, "환불 재시도에 실패했어요."));
		} finally {
			setRetryingKey(null);
			onChanged();
		}
	};
	return (
		<div>
			<div
				style={{
					display: "flex",
					alignItems: "flex-start",
					gap: 12,
					padding: 16,
				}}
			>
				<p className={"text-sm text-neutral-700"}>
					환불 실패는 여기서 다시 시도할 수 있어요. 10분 넘게 정산 중에 멈춘
					건은 다시 요청하면 두 번 환불될 수 있어서, 결제사(PortOne)에서 실제
					환불 여부를 먼저 확인해야 해요.
				</p>
				<p
					style={{ marginLeft: "auto", whiteSpace: "nowrap" }}
					className={"text-sm text-neutral-700"}
				>
					{items.length.toLocaleString("ko-KR")}건
				</p>
			</div>
			{error && (
				<Alert
					style={{ marginLeft: 16, marginRight: 16, marginBottom: 16 }}
					status={"danger"}
				>
					<Alert.Content>{error}</Alert.Content>
				</Alert>
			)}
			<div className={"overflow-x-auto"}>
				<table
					className={
						"w-full text-sm text-left [&_td]:p-3 [&_th]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
					}
				>
					<thead>
						<tr style={{ backgroundColor: "#fafafa" }}>
							{COLUMNS.map((heading) => (
								<th
									key={heading}
									style={{ fontWeight: 600, whiteSpace: "nowrap" }}
									scope="col"
								>
									{heading}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td
									colSpan={COLUMNS.length}
									style={{ paddingTop: 48, paddingBottom: 48 }}
								>
									<Spinner aria-label="불러오는 중" size="sm" />
								</td>
							</tr>
						) : items.length === 0 ? (
							<tr>
								<td
									colSpan={COLUMNS.length}
									style={{
										paddingTop: 48,
										paddingBottom: 48,
										color: "#525252",
									}}
								>
									환불 실패 건이 없어요.
								</td>
							</tr>
						) : (
							items.map((item) => {
								const key = failureKey(item);
								return (
									<tr key={key} data-testid={`refund-failure-row-${key}`}>
										<td>
											<Chip size={"sm"} variant={"soft"}>
												<Chip.Label>
													{depositStatusLabel(item.status)}
												</Chip.Label>
											</Chip>
										</td>
										<td style={{ whiteSpace: "nowrap" }}>
											{formatKrw(item.amount)}
										</td>
										<td style={{ minWidth: 200, maxWidth: 320 }}>
											<span
												style={{
													wordBreak: "keep-all",
													overflowWrap: "anywhere",
													display: "block",
												}}
												className={"text-sm text-neutral-700"}
											>
												{item.lastError || "-"}
											</span>
										</td>
										<td style={{ whiteSpace: "nowrap" }}>
											{formatKst(item.updatedAt)}
										</td>
										<td style={{ whiteSpace: "nowrap" }}>
											<Button
												onClick={() => onOpenRoom(item.roomId)}
												aria-label={`미팅 방 ${item.roomId} 열기`}
												variant={"tertiary"}
												size={"sm"}
											>
												{shortId(item.roomId)}
											</Button>
										</td>
										<td style={{ whiteSpace: "nowrap" }}>
											<span
												style={{ fontFamily: "monospace" }}
												title={item.memberId}
												className={"text-sm text-neutral-700"}
											>
												{shortId(item.memberId)}
											</span>
										</td>
										<td style={{ whiteSpace: "nowrap" }}>
											<span
												style={{ fontFamily: "monospace" }}
												title={item.userId}
												className={"text-sm text-neutral-700"}
											>
												{shortId(item.userId)}
											</span>
										</td>
										<td style={{ minWidth: 200 }}>
											{item.status === "REFUND_FAILED" ? (
												<Button
													onClick={() => handleRetry(item)}
													variant={"primary"}
													isDisabled={Boolean(retryingKey)}
													size={"sm"}
												>
													{retryingKey === key ? (
														<Spinner aria-label="불러오는 중" size="sm" />
													) : (
														"환불 재시도"
													)}
												</Button>
											) : (
												<div>
													<p className={"text-sm text-neutral-700"}>
														결제사 확인 필요
													</p>
													<span
														style={{ display: "block" }}
														className={"text-sm text-neutral-700"}
													>
														PortOne에서 환불됐는지 확인한 뒤 개발팀에 알려
														주세요.
													</span>
												</div>
											)}
										</td>
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
