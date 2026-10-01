"use client";
import {
	Button,
	Card,
	Checkbox,
	Chip,
	Pagination,
	Spinner,
	Tooltip,
} from "@heroui/react";
import { useState } from "react";
import type { DormantUserResponse } from "@/types/admin";
import { safeToLocaleString } from "@/app/utils/formatters";
import PendingLikesModal from "./components/PendingLikesModal";
import BulkProcessModal from "./components/BulkProcessModal";
import { useDormantLikesDashboard } from "@/app/admin/hooks";
function DormantLikesPageContent() {
	const [page, setPage] = useState(1);
	const [selectedUser, setSelectedUser] = useState<DormantUserResponse | null>(
		null,
	);
	const [modalOpen, setModalOpen] = useState(false);
	const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
	const [bulkProcessModalOpen, setBulkProcessModalOpen] = useState(false);
	const {
		data: dashboardData,
		isLoading,
		error,
		refetch,
	} = useDormantLikesDashboard(page, 20);
	const handleUserClick = (user: DormantUserResponse) => {
		setSelectedUser(user);
		setModalOpen(true);
	};
	const handleModalClose = () => {
		setModalOpen(false);
		setSelectedUser(null);
		refetch();
	};
	const processableUsers =
		dashboardData?.users.filter((u) => u.canProcess) || [];
	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			setSelectedUserIds(processableUsers.map((u) => u.id));
		} else {
			setSelectedUserIds([]);
		}
	};
	const handleSelectUser = (userId: string, canProcess: boolean) => {
		if (!canProcess) return;
		setSelectedUserIds((prev) =>
			prev.includes(userId)
				? prev.filter((id) => id !== userId)
				: [...prev, userId],
		);
	};
	const handleBulkProcessComplete = () => {
		setSelectedUserIds([]);
		refetch();
	};
	const selectedUsers =
		dashboardData?.users.filter((u) => selectedUserIds.includes(u.id)) || [];
	const formatDate = (dateString: string | null) => {
		if (!dateString) return "로그인 기록 없음";
		return safeToLocaleString(
			dateString,
			"ko-KR",
			{
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
			},
			"로그인 기록 없음",
		);
	};
	return (
		<div>
			<div style={{ marginBottom: 24 }}>
				<h2 className={"text-lg font-semibold text-neutral-900"}>
					파묘 계정 좋아요 관리
				</h2>
				<p style={{ marginTop: 8 }} className={"text-sm text-neutral-700"}>
					1일 이상 미접속한 구슬 보유 여성 유저의 미확인 좋아요에 대해 프로필
					노출 또는 거절 처리합니다.
				</p>
			</div>
			{error && (
				<p style={{ marginBottom: 16 }} className={"text-sm text-neutral-700"}>
					{(error as any).response?.data?.message ||
						"대시보드를 불러오는데 실패했습니다."}
				</p>
			)}
			{/* 통계 카드 */}
			<div style={{ marginBottom: 24 }} className={"grid grid-cols-12 gap-4"}>
				<div className={"min-w-0 col-span-12 sm:col-span-6 md:col-span-3"}>
					<Card>
						<Card.Content>
							<p className={"text-sm text-neutral-700"}>전체 미확인 좋아요</p>
							<h4 className={"text-lg font-semibold text-neutral-900"}>
								{dashboardData?.totalPendingLikes || 0}
							</h4>
						</Card.Content>
					</Card>
				</div>
				<div className={"min-w-0 col-span-12 sm:col-span-6 md:col-span-3"}>
					<Card>
						<Card.Content>
							<p className={"text-sm text-neutral-700"}>오늘 처리</p>
							<h4 className={"text-lg font-semibold text-neutral-900"}>
								{dashboardData?.todayProcessedCount || 0}
							</h4>
						</Card.Content>
					</Card>
				</div>
				<div className={"min-w-0 col-span-12 sm:col-span-6 md:col-span-3"}>
					<Card style={{ backgroundColor: "#ecfdf5" }}>
						<Card.Content>
							<p className={"text-sm text-neutral-700"}>오늘 프로필 노출</p>
							<h4
								style={{ color: "#10b981" }}
								className={"text-lg font-semibold text-neutral-900"}
							>
								{dashboardData?.todayViewedCount || 0}
							</h4>
						</Card.Content>
					</Card>
				</div>
				<div className={"min-w-0 col-span-12 sm:col-span-6 md:col-span-3"}>
					<Card style={{ backgroundColor: "#fef2f2" }}>
						<Card.Content>
							<p className={"text-sm text-neutral-700"}>오늘 거절</p>
							<h4
								style={{ color: "#ef4444" }}
								className={"text-lg font-semibold text-neutral-900"}
							>
								{dashboardData?.todayRejectedCount || 0}
							</h4>
						</Card.Content>
					</Card>
				</div>
			</div>
			<div
				style={{
					marginBottom: 16,
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<p className={"text-sm text-neutral-700"}>
					총 {dashboardData?.totalUsers || 0}명의 대상 계정
				</p>
				{selectedUserIds.length > 0 && (
					<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
						<Chip size={"sm"} variant={"soft"}>
							<Chip.Label>{`${selectedUserIds.length}명 선택됨`}</Chip.Label>
						</Chip>
						<Button
							onClick={() => setBulkProcessModalOpen(true)}
							variant={"primary"}
							size={"sm"}
						>
							일괄 처리
						</Button>
						<Button
							onClick={() => setSelectedUserIds([])}
							variant={"secondary"}
							size={"sm"}
						>
							선택 해제
						</Button>
					</div>
				)}
			</div>
			{isLoading ? (
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
			) : !dashboardData || dashboardData.users.length === 0 ? (
				<div style={{ textAlign: "center", paddingTop: 64, paddingBottom: 64 }}>
					<p className={"text-sm text-neutral-700"}>
						현재 처리 대기 중인 파묘 계정이 없습니다.
					</p>
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
									<th scope="col">
										<Checkbox
											isSelected={
												processableUsers.length > 0 &&
												selectedUserIds.length === processableUsers.length
											}
											isDisabled={processableUsers.length === 0}
											isIndeterminate={
												selectedUserIds.length > 0 &&
												selectedUserIds.length < processableUsers.length
											}
											onChange={(checked) => handleSelectAll(checked)}
											aria-label={"선택"}
										>
											<Checkbox.Content>
												<Checkbox.Control>
													<Checkbox.Indicator />
												</Checkbox.Control>
											</Checkbox.Content>
										</Checkbox>
									</th>
									<th scope="col">이름</th>
									<th scope="col">전화번호</th>
									<th scope="col">구슬</th>
									<th scope="col">마지막 로그인</th>
									<th scope="col">미접속 일수</th>
									<th scope="col">미확인 좋아요</th>
									<th scope="col">처리 상태</th>
									<th scope="col">액션</th>
								</tr>
							</thead>
							<tbody>
								{dashboardData.users.map((user) => (
									<tr key={user.id}>
										<td>
											<Checkbox
												isSelected={selectedUserIds.includes(user.id)}
												isDisabled={!user.canProcess}
												onChange={() =>
													handleSelectUser(user.id, user.canProcess)
												}
												aria-label={`${user.name} 선택`}
											>
												<Checkbox.Content>
													<Checkbox.Control>
														<Checkbox.Indicator />
													</Checkbox.Control>
												</Checkbox.Content>
											</Checkbox>
										</td>
										<td>{user.name}</td>
										<td>{user.phoneNumber}</td>
										<td>
											<Chip size={"sm"} variant={"soft"}>
												<Chip.Label>{`${user.gemBalance}개`}</Chip.Label>
											</Chip>
										</td>
										<td>{formatDate(user.lastLoginAt)}</td>
										<td>
											<Chip size={"sm"} variant={"soft"}>
												<Chip.Label>{`${user.daysSinceLastLogin}일`}</Chip.Label>
											</Chip>
										</td>
										<td>
											<Chip size={"sm"} variant={"soft"}>
												<Chip.Label>{`${user.pendingLikeCount}개`}</Chip.Label>
											</Chip>
										</td>
										<td>
											{user.canProcess ? (
												<Chip
													style={{ backgroundColor: "#10b981", color: "white" }}
													size={"sm"}
													variant={"soft"}
												>
													<Chip.Label>{"처리 가능"}</Chip.Label>
												</Chip>
											) : (
												<Chip size={"sm"} variant={"soft"}>
													<Chip.Label>{`${user.cooldownRemainingMinutes}분 후`}</Chip.Label>
												</Chip>
											)}
										</td>
										<td>
											<Button
												onClick={() => handleUserClick(user)}
												variant={"primary"}
												size={"sm"}
											>
												상세
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<div style={{ display: "flex", justifyContent: "center" }}>
						<Pagination aria-label="페이지 이동">
							<Pagination.Summary>
								{page} / {Math.max(1, dashboardData.totalPages)}
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
										isDisabled={page >= dashboardData.totalPages}
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
			{selectedUser && (
				<PendingLikesModal
					open={modalOpen}
					onClose={handleModalClose}
					user={selectedUser}
				/>
			)}
			<BulkProcessModal
				open={bulkProcessModalOpen}
				onClose={() => setBulkProcessModalOpen(false)}
				selectedUsers={selectedUsers}
				onComplete={handleBulkProcessComplete}
			/>
		</div>
	);
}
export default function DormantLikesPageV2() {
	return <DormantLikesPageContent />;
}
