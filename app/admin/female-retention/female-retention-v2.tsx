"use client";
import { Alert, Button, Chip, Modal, Spinner, Tooltip } from "@heroui/react";
import { Copy, KeyRound, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/shared/ui/admin/toast";
import AdminService from "@/app/services/admin";
import { safeToLocaleString } from "@/app/utils/formatters";
interface InactiveUser {
	id: string;
	name: string;
	phoneNumber: string;
	email: string | null;
	updatedAt: string;
	inactiveDuration: string;
	// 임시 패스워드 발급 후 추가되는 필드
	issuedEmail?: string;
	issuedPassword?: string;
}
interface PaginationInfo {
	total: number;
	limit: number;
	offset: number;
}
function FemaleRetentionPageContent() {
	const toast = useToast();
	const [users, setUsers] = useState<InactiveUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [processing, setProcessing] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [pagination, setPagination] = useState<PaginationInfo>({
		total: 0,
		limit: 20,
		offset: 0,
	});
	const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState<InactiveUser | null>(null);
	useEffect(() => {
		fetchInactiveUsers();
	}, [pagination.offset]);
	const fetchInactiveUsers = async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await AdminService.femaleRetention.getInactiveUsers(
				pagination.limit,
				pagination.offset,
			);
			setUsers(response.data || []);
			setPagination({
				total: response.total || 0,
				limit: response.limit || 20,
				offset: response.offset || 0,
			});
		} catch (err: any) {
			setError(
				err.response?.data?.message || "유저 목록을 불러오는데 실패했습니다.",
			);
		} finally {
			setLoading(false);
		}
	};
	const handleIssuePasswordClick = (user: InactiveUser) => {
		setSelectedUser(user);
		setConfirmDialogOpen(true);
	};
	const handleIssuePasswordConfirm = async () => {
		if (!selectedUser) return;
		try {
			setProcessing(selectedUser.id);
			setConfirmDialogOpen(false);
			const response =
				await AdminService.femaleRetention.issueTemporaryPassword(
					selectedUser.id,
				);
			if (response.success) {
				// 테이블에서 해당 유저 업데이트
				setUsers((prevUsers) =>
					prevUsers.map((user) =>
						user.id === selectedUser.id
							? {
									...user,
									issuedEmail: response.email,
									issuedPassword: response.password,
								}
							: user,
					),
				);
				toast.success(
					"임시 패스워드가 발급되었습니다. 표에서 이메일과 패스워드를 확인하세요.",
				);
			}
		} catch (err: any) {
			toast.error(
				err.response?.data?.message || "임시 패스워드 발급에 실패했습니다.",
			);
		} finally {
			setProcessing(null);
			setSelectedUser(null);
		}
	};
	const handleCopyToClipboard = (text: string, label: string) => {
		navigator.clipboard.writeText(text);
		toast.info(`${label}이(가) 클립보드에 복사되었습니다.`);
	};
	const formatInactiveDuration = (duration: string) => {
		// ISO 8601 Duration 파싱 (예: P5DT3H30M)
		const daysMatch = duration.match(/P(\d+)D/);
		const hoursMatch = duration.match(/T(\d+)H/);
		const minutesMatch = duration.match(/(\d+)M/);
		const days = daysMatch ? parseInt(daysMatch[1]) : 0;
		const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
		const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
		const parts = [];
		if (days > 0) parts.push(`${days}일`);
		if (hours > 0) parts.push(`${hours}시간`);
		if (minutes > 0) parts.push(`${minutes}분`);
		return parts.join(" ") || "0분";
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
	const handlePageChange = (direction: "prev" | "next") => {
		if (direction === "prev" && pagination.offset > 0) {
			setPagination((prev) => ({
				...prev,
				offset: Math.max(0, prev.offset - prev.limit),
			}));
		} else if (
			direction === "next" &&
			pagination.offset + pagination.limit < pagination.total
		) {
			setPagination((prev) => ({
				...prev,
				offset: prev.offset + prev.limit,
			}));
		}
	};
	const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
	const totalPages = Math.ceil(pagination.total / pagination.limit);
	if (loading) {
		return (
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "60vh",
				}}
			>
				<Spinner aria-label="불러오는 중" size="sm" />
				<p style={{ marginLeft: 16 }} className={"text-sm text-neutral-700"}>
					유저 목록을 불러오는 중...
				</p>
			</div>
		);
	}
	return (
		<div style={{ padding: 24 }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 24,
				}}
			>
				<div>
					<h2 className={"text-lg font-semibold text-neutral-900"}>
						여성 유저 리텐션 관리
					</h2>
					<p style={{ marginTop: 4 }} className={"text-sm text-neutral-700"}>
						3일 이상 미접속 여성 유저 관리 (총 {pagination.total}명)
					</p>
				</div>
				<Button onClick={fetchInactiveUsers} variant={"secondary"} size={"md"}>
					{<RefreshCw size={18} />}새로고침
				</Button>
			</div>
			{error && (
				<Alert style={{ marginBottom: 24 }} status={"danger"}>
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
						<tr>
							<th scope="col">이름</th>
							<th scope="col">전화번호</th>
							<th scope="col">이메일</th>
							<th scope="col">미접속 기간</th>
							<th scope="col">마지막 접속</th>
							<th scope="col">발급된 정보</th>
							<th scope="col">작업</th>
						</tr>
					</thead>
					<tbody>
						{users.length === 0 ? (
							<tr>
								<td colSpan={7}>
									<p
										style={{ paddingTop: 32, paddingBottom: 32 }}
										className={"text-sm text-neutral-700"}
									>
										미접속 여성 유저가 없습니다.
									</p>
								</td>
							</tr>
						) : (
							users.map((user) => (
								<tr key={user.id}>
									<td>{user.name}</td>
									<td>{user.phoneNumber}</td>
									<td>
										{user.email || (
											<Chip size={"sm"} variant={"soft"}>
												<Chip.Label>{"미등록"}</Chip.Label>
											</Chip>
										)}
									</td>
									<td>
										<Chip size={"sm"} variant={"soft"}>
											<Chip.Label>
												{formatInactiveDuration(user.inactiveDuration)}
											</Chip.Label>
										</Chip>
									</td>
									<td>{formatDate(user.updatedAt)}</td>
									<td>
										{user.issuedEmail && user.issuedPassword ? (
											<div
												style={{
													display: "flex",
													flexDirection: "column",
													gap: 4,
												}}
											>
												<div
													style={{
														display: "flex",
														alignItems: "center",
														gap: 4,
													}}
												>
													<span className={"text-sm text-neutral-700"}>
														이메일:
													</span>
													<p
														style={{ fontFamily: "monospace" }}
														className={"text-sm text-neutral-700"}
													>
														{user.issuedEmail}
													</p>
													<Button
														onClick={() =>
															handleCopyToClipboard(user.issuedEmail!, "이메일")
														}
														variant={"tertiary"}
														isIconOnly={true}
														aria-label={"자세히 보기"}
														size={"sm"}
													>
														<Copy size={18} />
													</Button>
												</div>
												<div
													style={{
														display: "flex",
														alignItems: "center",
														gap: 4,
													}}
												>
													<span className={"text-sm text-neutral-700"}>
														패스워드:
													</span>
													<p
														style={{
															fontFamily: "monospace",
															fontWeight: "bold",
														}}
														className={"text-sm text-neutral-700"}
													>
														{user.issuedPassword}
													</p>
													<Button
														onClick={() =>
															handleCopyToClipboard(
																user.issuedPassword!,
																"패스워드",
															)
														}
														variant={"tertiary"}
														isIconOnly={true}
														aria-label={"자세히 보기"}
														size={"sm"}
													>
														<Copy size={18} />
													</Button>
												</div>
											</div>
										) : (
											<span className={"text-sm text-neutral-700"}>미발급</span>
										)}
									</td>
									<td>
										<Tooltip>
											<Button
												onClick={() => handleIssuePasswordClick(user)}
												variant={"primary"}
												isDisabled={processing === user.id}
												size={"sm"}
											>
												{processing === user.id ? (
													<Spinner aria-label="불러오는 중" size="sm" />
												) : (
													<KeyRound size={18} />
												)}
												{processing === user.id
													? "처리 중..."
													: "패스워드 발급"}
											</Button>
											<Tooltip.Content>
												{"임시 패스워드 발급 및 Push 토큰 제거"}
											</Tooltip.Content>
										</Tooltip>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
			{/* 페이지네이션 */}
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					marginTop: 24,
					gap: 16,
				}}
			>
				<Button
					onClick={() => handlePageChange("prev")}
					variant={"secondary"}
					isDisabled={pagination.offset === 0}
					size={"md"}
				>
					이전
				</Button>
				<p className={"text-sm text-neutral-700"}>
					{currentPage}/ {totalPages}페이지
				</p>
				<Button
					onClick={() => handlePageChange("next")}
					variant={"secondary"}
					isDisabled={pagination.offset + pagination.limit >= pagination.total}
					size={"md"}
				>
					다음
				</Button>
			</div>
			{/* 확인 다이얼로그 */}
			<Modal.Backdrop
				isOpen={confirmDialogOpen}
				onOpenChange={(isOpen) => {
					if (!isOpen) (() => setConfirmDialogOpen(false))?.();
				}}
				isDismissable={true}
			>
				<Modal.Container size="md" scroll="inside">
					<Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}>
						<Modal.Header>
							<Modal.Heading>임시 패스워드 발급 확인</Modal.Heading>
						</Modal.Header>
						<Modal.Body>
							<div>
								{selectedUser && (
									<>
										<strong>{selectedUser.name}</strong> 님에게 임시 패스워드를
										발급하시겠습니까?
										<br />
										<br />
										다음 작업이 수행됩니다:
										<ul>
											<li>1회성 임시 패스워드 생성 및 설정</li>
											<li>이메일 주소 생성 (미등록 시)</li>
											<li>모든 기기의 Push 토큰 제거 (로그아웃 효과)</li>
										</ul>
									</>
								)}
							</div>
						</Modal.Body>
						<Modal.Footer>
							<Button
								onClick={() => setConfirmDialogOpen(false)}
								variant={"tertiary"}
								size={"md"}
							>
								취소
							</Button>
							<Button
								onClick={handleIssuePasswordConfirm}
								variant={"primary"}
								size={"md"}
							>
								발급
							</Button>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</div>
	);
}
export default function FemaleRetentionPageV2() {
	return <FemaleRetentionPageContent />;
}
