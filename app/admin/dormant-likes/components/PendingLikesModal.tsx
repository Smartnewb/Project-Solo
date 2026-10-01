"use client";
import {
	Alert,
	Avatar,
	Button,
	Checkbox,
	Chip,
	Modal,
	Spinner,
} from "@heroui/react";
import { useConfirm } from "@/shared/ui/admin/confirm-dialog";
import { useToast } from "@/shared/ui/admin/toast";
import { Slider } from "@heroui/react";
import { useState, useEffect } from "react";
import AdminService from "@/app/services/admin";
import { safeToLocaleString } from "@/app/utils/formatters";
import UserDetailModal from "@/components/admin/appearance/UserDetailModal";
import type {
	DormantUserResponse,
	DormantLikeDetailResponse,
	CooldownStatusResponse,
} from "@/types/admin";
interface PendingLikesModalProps {
	open: boolean;
	onClose: () => void;
	user: DormantUserResponse;
}
export default function PendingLikesModal({
	open,
	onClose,
	user,
}: PendingLikesModalProps) {
	const [likes, setLikes] = useState<DormantLikeDetailResponse[]>([]);
	const [cooldownStatus, setCooldownStatus] =
		useState<CooldownStatusResponse | null>(null);
	const [selectedLikeIds, setSelectedLikeIds] = useState<string[]>([]);
	const confirm = useConfirm();
	const toast = useToast();
	const [rejectionRate, setRejectionRate] = useState(0.2);
	const [loading, setLoading] = useState(true);
	const [processing, setProcessing] = useState(false);
	const [error, setError] = useState("");
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
	const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
	const [userDetail, setUserDetail] = useState<any>(null);
	const [loadingUserDetail, setLoadingUserDetail] = useState(false);
	const [userDetailError, setUserDetailError] = useState<string | null>(null);
	const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
	useEffect(() => {
		if (open) {
			fetchData();
		} else {
			setSelectedLikeIds([]);
			setRejectionRate(0.2);
			setError("");
		}
	}, [open, user.id]);
	const fetchData = async () => {
		try {
			setLoading(true);
			setError("");
			const [likesData, cooldownData] = await Promise.all([
				AdminService.dormantLikes.getPendingLikes(user.id),
				AdminService.dormantLikes.getCooldownStatus(user.id),
			]);
			setLikes(likesData);
			setCooldownStatus(cooldownData);
		} catch (err: any) {
			setError(
				err.response?.data?.message || "데이터를 불러오는데 실패했습니다.",
			);
		} finally {
			setLoading(false);
		}
	};
	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			const allIds = likes.slice(0, 5).map((like) => like.matchLikeId);
			setSelectedLikeIds(allIds);
		} else {
			setSelectedLikeIds([]);
		}
	};
	const handleSelectOne = (matchLikeId: string) => {
		const currentIndex = selectedLikeIds.indexOf(matchLikeId);
		const newSelected = [...selectedLikeIds];
		if (currentIndex === -1) {
			if (newSelected.length < 5) {
				newSelected.push(matchLikeId);
			} else {
				toast.info("최대 5개까지만 선택 가능합니다.");
				return;
			}
		} else {
			newSelected.splice(currentIndex, 1);
		}
		setSelectedLikeIds(newSelected);
	};
	const handleProcess = async () => {
		if (selectedLikeIds.length === 0) {
			toast.info("처리할 좋아요를 선택해주세요.");
			return;
		}
		if (cooldownStatus?.isOnCooldown) {
			toast.info(
				`쿨다운 중입니다. ${cooldownStatus.remainingMinutes}분 후에 다시 시도해주세요.`,
			);
			return;
		}
		const expectedRejections = Math.round(
			selectedLikeIds.length * rejectionRate,
		);
		const confirmed = await confirm({
			message:
				`선택한 ${selectedLikeIds.length}개의 좋아요를 처리하시겠습니까?\n\n` +
				`약 ${expectedRejections}개는 거절, ${selectedLikeIds.length - expectedRejections}개는 프로필 노출 처리됩니다.`,
			confirmText: "처리",
			severity: "warning",
		});
		if (!confirmed) return;
		try {
			setProcessing(true);
			const result = await AdminService.dormantLikes.processLikes({
				dormantUserId: user.id,
				matchLikeIds: selectedLikeIds,
				rejectionRate,
			});
			toast.info(
				`처리가 완료되었습니다.\n\n` +
					`프로필 노출: ${result.viewedCount}개\n` +
					`거절: ${result.rejectedCount}개`,
			);
			onClose();
		} catch (err: any) {
			const errorMsg =
				err.response?.data?.message || "처리 중 오류가 발생했습니다.";
			setError(errorMsg);
			toast.info(errorMsg);
		} finally {
			setProcessing(false);
		}
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
	const isSelected = (matchLikeId: string) =>
		selectedLikeIds.indexOf(matchLikeId) !== -1;
	const handleUserClick = async (userId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		setSelectedUserId(userId);
		setUserDetailModalOpen(true);
		setLoadingUserDetail(true);
		setUserDetailError(null);
		try {
			const response = await AdminService.userAppearance.getUserDetails(userId);
			setUserDetail(response);
		} catch (err: any) {
			setUserDetailError(
				err.response?.data?.message ||
					err.message ||
					"사용자 정보를 불러오는 중 오류가 발생했습니다.",
			);
		} finally {
			setLoadingUserDetail(false);
		}
	};
	const handleCloseUserDetailModal = () => {
		setUserDetailModalOpen(false);
		setSelectedUserId(null);
		setUserDetail(null);
		setUserDetailError(null);
	};
	const handleViewProfile = async (
		senderUserId: string,
		e: React.MouseEvent,
	) => {
		e.stopPropagation();
		if (cooldownStatus?.isOnCooldown) {
			toast.info(
				`쿨다운 중입니다. ${cooldownStatus.remainingMinutes}분 후에 다시 시도해주세요.`,
			);
			return;
		}
		const confirmed = await confirm({
			message:
				"이 사용자의 프로필을 노출 처리하시겠습니까?\n\n" +
				'좋아요를 보낸 남성에게 "상대방이 프로필을 봤어요" 푸시 알림이 발송됩니다.',
			confirmText: "처리",
			severity: "warning",
		});
		if (!confirmed) return;
		try {
			setViewingProfileId(senderUserId);
			const result = await AdminService.dormantLikes.viewProfile({
				viewerId: user.id,
				viewedUserId: senderUserId,
			});
			if (result.success) {
				toast.info(
					`프로필 노출 처리가 완료되었습니다.\n\n` +
						`매칭 ID: ${result.matchId}\n` +
						`첫 노출 여부: ${result.isFirstView ? "예" : "아니오"}\n` +
						`알림 발송: ${result.notificationSent ? "성공" : "실패"}`,
				);
				await fetchData();
			}
		} catch (err: any) {
			const errorMsg =
				err.response?.data?.message ||
				"프로필 노출 처리 중 오류가 발생했습니다.";
			setError(errorMsg);
			toast.info(errorMsg);
		} finally {
			setViewingProfileId(null);
		}
	};
	return (
		<Modal.Backdrop
			isOpen={open}
			onOpenChange={(isOpen) => {
				if (!isOpen && !processing && !viewingProfileId) onClose?.();
			}}
			isDismissable={!processing && !viewingProfileId}
		>
			<Modal.Container size="md" scroll="inside">
				<Modal.Dialog>
					<Modal.Header>
						<Modal.Heading>미확인 좋아요 관리 - {user.name}</Modal.Heading>
					</Modal.Header>
					<Modal.Body>
						{error && (
							<Alert style={{ marginBottom: 16 }} status={"danger"}>
								<Alert.Content>{error}</Alert.Content>
							</Alert>
						)}
						{/* 파묘 계정 정보 */}
						<div
							style={{
								marginBottom: 24,
								padding: 16,
								backgroundColor: "#f9fafb",
								borderRadius: 8,
							}}
						>
							<div className={"grid grid-cols-12 gap-4"}>
								<div className={"min-w-0 col-span-6"}>
									<span className={"text-sm text-neutral-700"}>이름</span>
									<p className={"text-sm text-neutral-700"}>{user.name}</p>
								</div>
								<div className={"min-w-0 col-span-6"}>
									<span className={"text-sm text-neutral-700"}>구슬 잔액</span>
									<p className={"text-sm text-neutral-700"}>
										{user.gemBalance}개
									</p>
								</div>
								<div className={"min-w-0 col-span-6"}>
									<span className={"text-sm text-neutral-700"}>
										미접속 일수
									</span>
									<p className={"text-sm text-neutral-700"}>
										{user.daysSinceLastLogin}일
									</p>
								</div>
								<div className={"min-w-0 col-span-6"}>
									<span className={"text-sm text-neutral-700"}>처리 상태</span>
									<div>
										{cooldownStatus?.isOnCooldown ? (
											<Chip size={"sm"} variant={"soft"}>
												<Chip.Label>{`${cooldownStatus.remainingMinutes}분 후 처리 가능`}</Chip.Label>
											</Chip>
										) : (
											<Chip
												style={{ backgroundColor: "#10b981", color: "white" }}
												size={"sm"}
												variant={"soft"}
											>
												<Chip.Label>{"처리 가능"}</Chip.Label>
											</Chip>
										)}
									</div>
								</div>
							</div>
						</div>
						{loading ? (
							<div
								style={{
									display: "flex",
									justifyContent: "center",
									paddingTop: 32,
									paddingBottom: 32,
								}}
							>
								<Spinner aria-label="불러오는 중" size="sm" />
							</div>
						) : likes.length === 0 ? (
							<div
								style={{
									textAlign: "center",
									paddingTop: 32,
									paddingBottom: 32,
								}}
							>
								<p className={"text-sm text-neutral-700"}>
									미확인 좋아요가 없습니다.
								</p>
							</div>
						) : (
							<>
								{/* 좋아요 목록 */}
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
															likes.length > 0 &&
															selectedLikeIds.length ===
																Math.min(5, likes.length)
														}
														isIndeterminate={
															selectedLikeIds.length > 0 &&
															selectedLikeIds.length < Math.min(5, likes.length)
														}
														onChange={handleSelectAll}
														aria-label={"선택"}
													>
														<Checkbox.Content>
															<Checkbox.Control>
																<Checkbox.Indicator />
															</Checkbox.Control>
														</Checkbox.Content>
													</Checkbox>
												</th>
												<th scope="col">프로필</th>
												<th scope="col">이름</th>
												<th scope="col">나이</th>
												<th scope="col">대학교</th>
												<th scope="col">경과일</th>
												<th scope="col">프로필 노출</th>
											</tr>
										</thead>
										<tbody>
											{likes.map((like) => {
												const selected = isSelected(like.matchLikeId);
												return (
													<tr
														key={like.matchLikeId}
														style={{ cursor: "pointer" }}
													>
														<td>
															<Checkbox
																isSelected={selected}
																aria-label={"선택"}
																onChange={() =>
																	handleSelectOne(like.matchLikeId)
																}
															>
																<Checkbox.Content>
																	<Checkbox.Control>
																		<Checkbox.Indicator />
																	</Checkbox.Control>
																</Checkbox.Content>
															</Checkbox>
														</td>
														<td>
															<Avatar
																style={{
																	width: 40,
																	height: 40,
																	cursor: "pointer",
																}}
															>
																<Avatar.Image
																	src={like.senderMainImageUrl || undefined}
																	alt={"프로필"}
																/>
																<Avatar.Fallback>
																	{like.senderName[0]}
																</Avatar.Fallback>
															</Avatar>
														</td>
														<td>
															<Button
																variant="ghost"
																size="sm"
																onClick={(e) =>
																	handleUserClick(like.senderUserId, e)
																}
															>
																{like.senderName}
															</Button>
														</td>
														<td>{like.senderAge}세</td>
														<td>{like.senderUniversity}</td>
														<td>
															<Chip size={"sm"} variant={"soft"}>
																<Chip.Label>{`${like.daysSinceLiked}일 전`}</Chip.Label>
															</Chip>
														</td>
														<td>
															<Button
																onClick={(e) =>
																	handleViewProfile(like.senderUserId, e)
																}
																style={{ minWidth: 80 }}
																variant={"secondary"}
																isDisabled={
																	viewingProfileId === like.senderUserId ||
																	cooldownStatus?.isOnCooldown
																}
																size={"sm"}
															>
																{viewingProfileId === like.senderUserId ? (
																	<Spinner aria-label="불러오는 중" size="sm" />
																) : (
																	"프로필 노출"
																)}
															</Button>
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>

								{/* 처리 옵션 */}
								<div
									style={{
										padding: 16,
										backgroundColor: "#f9fafb",
										borderRadius: 8,
									}}
								>
									<p className={"text-sm text-neutral-700"}>거절 비율</p>
									<Slider
										aria-label="거절 비율"
										value={rejectionRate}
										onChange={(value) => setRejectionRate(value as number)}
										minValue={0}
										maxValue={1}
										step={0.1}
										isDisabled={processing}
									>
										<Slider.Output>
											{Math.round(rejectionRate * 100)}%
										</Slider.Output>
										<Slider.Track>
											<Slider.Fill />
											<Slider.Thumb />
										</Slider.Track>
									</Slider>
									<p
										style={{ marginTop: 8 }}
										className={"text-sm text-neutral-700"}
									>
										선택 {selectedLikeIds.length}개 중 약{" "}
										{Math.round(selectedLikeIds.length * rejectionRate)}개 거절,{" "}
										{selectedLikeIds.length -
											Math.round(selectedLikeIds.length * rejectionRate)}
										개 프로필 노출 예정
									</p>
								</div>
							</>
						)}
					</Modal.Body>
					<Modal.Footer>
						<Button
							onClick={onClose}
							variant={"tertiary"}
							isDisabled={processing}
							size={"md"}
						>
							취소
						</Button>
						<Button
							onClick={handleProcess}
							variant={"primary"}
							isDisabled={
								selectedLikeIds.length === 0 ||
								cooldownStatus?.isOnCooldown ||
								processing ||
								loading
							}
							size={"md"}
						>
							{processing && <Spinner aria-label="불러오는 중" size="sm" />}
							{processing ? "처리 중..." : "처리하기"}
						</Button>
					</Modal.Footer>
					<UserDetailModal
						open={userDetailModalOpen}
						onClose={handleCloseUserDetailModal}
						userId={selectedUserId}
						userDetail={userDetail || {}}
						loading={loadingUserDetail}
						error={userDetailError}
					/>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
