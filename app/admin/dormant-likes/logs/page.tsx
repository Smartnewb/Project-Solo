"use client";
import {
	Alert,
	Chip,
	Input,
	Label,
	Pagination,
	Spinner,
	TextField,
	Tooltip,
} from "@heroui/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminService from "@/app/services/admin";
import type { ActionLogsResponse, ActionLogResponse } from "@/types/admin";
import { safeToLocaleString } from "@/app/utils/formatters";
function DormantLikesLogsPageContent() {
	const router = useRouter();
	const [logs, setLogs] = useState<ActionLogResponse[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalItems, setTotalItems] = useState(0);
	const [filters, setFilters] = useState({
		adminUserId: "",
		dormantUserId: "",
		batchId: "",
	});
	const fetchLogs = async () => {
		try {
			setLoading(true);
			setError("");
			const cleanFilters: any = {};
			if (filters.adminUserId) cleanFilters.adminUserId = filters.adminUserId;
			if (filters.dormantUserId)
				cleanFilters.dormantUserId = filters.dormantUserId;
			if (filters.batchId) cleanFilters.batchId = filters.batchId;
			const data = await AdminService.dormantLikes.getActionLogs(
				page,
				20,
				cleanFilters,
			);
			setLogs(data.items);
			setTotalPages(Math.ceil(data.meta.totalItems / data.meta.itemsPerPage));
			setTotalItems(data.meta.totalItems);
		} catch (err: any) {
			setError(
				err.response?.data?.message || "이력을 불러오는데 실패했습니다.",
			);
		} finally {
			setLoading(false);
		}
	};
	useEffect(() => {
		fetchLogs();
	}, [page]);
	const handleFilterChange = (field: string, value: string) => {
		setFilters((prev) => ({ ...prev, [field]: value }));
	};
	const handleFilterApply = () => {
		setPage(1);
		fetchLogs();
	};
	const formatDate = (dateString: string) => {
		return safeToLocaleString(dateString, "ko-KR", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};
	const formatDuration = (minutes: number) => {
		const days = Math.floor(minutes / (24 * 60));
		const hours = Math.floor((minutes % (24 * 60)) / 60);
		const mins = minutes % 60;
		const parts = [];
		if (days > 0) parts.push(`${days}일`);
		if (hours > 0) parts.push(`${hours}시간`);
		if (mins > 0) parts.push(`${mins}분`);
		return parts.join(" ") || "0분";
	};
	const truncateBatchId = (batchId: string) => {
		return batchId.slice(0, 8);
	};
	return (
		<div>
			<div style={{ marginBottom: 24 }}>
				<h2 className={"text-lg font-semibold text-neutral-900"}>처리 이력</h2>
				<p style={{ marginTop: 8 }} className={"text-sm text-neutral-700"}>
					파묘 계정 좋아요 처리 이력을 조회합니다.
				</p>
			</div>
			{error && (
				<Alert style={{ marginBottom: 16 }} status={"danger"}>
					<Alert.Content>{error}</Alert.Content>
				</Alert>
			)}
			{/* 필터 */}
			<div
				style={{ marginBottom: 24, display: "flex", gap: 16, flexWrap: "wrap" }}
			>
				<TextField className="w-full">
					<Label>{"배치 ID"}</Label>
					<Input
						value={filters.batchId}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleFilterApply();
						}}
						onChange={(e) => handleFilterChange("batchId", e.target.value)}
						placeholder="UUID"
						style={{ minWidth: 200 }}
					/>
				</TextField>
			</div>
			<p style={{ marginBottom: 16 }} className={"text-sm text-neutral-700"}>
				총 {totalItems}건의 처리 이력
			</p>
			{loading ? (
				<div
					style={{
						display: "flex",
						justifyContent: "center",
						paddingTop: 64,
						paddingBottom: 64,
					}}
				>
					<Spinner aria-label="불러오는 중" size="sm" />
				</div>
			) : logs.length === 0 ? (
				<div style={{ textAlign: "center", paddingTop: 64, paddingBottom: 64 }}>
					<p className={"text-sm text-neutral-700"}>처리 이력이 없습니다.</p>
				</div>
			) : (
				<>
					<div style={{ marginBottom: 24 }} className={"overflow-x-auto"}>
						<table
							className={
								"w-full text-sm text-left [&_td]:p-3 [&_th]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
							}
						>
							<thead>
								<tr>
									<th scope="col">처리일시</th>
									<th scope="col">처리자</th>
									<th scope="col">파묘 계정</th>
									<th scope="col">처리 유형</th>
									<th scope="col">경과시간</th>
									<th scope="col">배치 ID</th>
								</tr>
							</thead>
							<tbody>
								{logs.map((log) => (
									<tr key={log.id}>
										<td>{formatDate(log.createdAt)}</td>
										<td>{log.adminUserName}</td>
										<td>{log.dormantUserName}</td>
										<td>
											{log.actionType === "VIEW" ? (
												<Chip
													style={{ backgroundColor: "#3b82f6", color: "white" }}
													size={"sm"}
													variant={"soft"}
												>
													<Chip.Label>{"프로필 노출"}</Chip.Label>
												</Chip>
											) : (
												<Chip
													style={{ backgroundColor: "#ef4444", color: "white" }}
													size={"sm"}
													variant={"soft"}
												>
													<Chip.Label>{"거절"}</Chip.Label>
												</Chip>
											)}
										</td>
										<td>{formatDuration(log.delayMinutes)}</td>
										<td>
											<Tooltip>
												<Tooltip.Trigger tabIndex={0}>
													<p
														style={{
															fontFamily: "monospace",
															fontSize: "0.75rem",
															cursor: "help",
														}}
														className={"text-sm text-neutral-700"}
													>
														{truncateBatchId(log.batchId)}...
													</p>
												</Tooltip.Trigger>
												<Tooltip.Content>{log.batchId}</Tooltip.Content>
											</Tooltip>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<div style={{ display: "flex", justifyContent: "center" }}>
						<Pagination aria-label="페이지 이동">
							<Pagination.Summary>
								{page} / {Math.max(1, totalPages)}
							</Pagination.Summary>
							<Pagination.Content>
								<Pagination.Item>
									<Pagination.Previous
										isDisabled={page <= 1}
										onPress={() =>
											((_, value) => setPage(value))(null, page - 1)
										}
									>
										이전
									</Pagination.Previous>
								</Pagination.Item>
								<Pagination.Item>
									<Pagination.Next
										isDisabled={page >= totalPages}
										onPress={() =>
											((_, value) => setPage(value))(null, page + 1)
										}
									>
										다음
									</Pagination.Next>
								</Pagination.Item>
							</Pagination.Content>
						</Pagination>
					</div>
				</>
			)}
		</div>
	);
}
export default function DormantLikesLogsPage() {
	return <DormantLikesLogsPageContent />;
}
