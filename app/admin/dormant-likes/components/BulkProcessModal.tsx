"use client";
import { Alert, Button, Chip, Modal, ProgressBar } from "@heroui/react";
import { useConfirm } from "@/shared/ui/admin/confirm-dialog";
import { Slider } from "@heroui/react";
import { useState } from "react";
import AdminService from "@/app/services/admin";
import type { DormantUserResponse } from "@/types/admin";
interface BulkProcessModalProps {
	open: boolean;
	onClose: () => void;
	selectedUsers: DormantUserResponse[];
	onComplete: () => void;
}
interface ProcessResult {
	success: number;
	failed: number;
	totalViewed: number;
	totalRejected: number;
	totalProcessed: number;
}
export default function BulkProcessModal({
	open,
	onClose,
	selectedUsers,
	onComplete,
}: BulkProcessModalProps) {
	const confirm = useConfirm();
	const [rejectionRate, setRejectionRate] = useState(0.2);
	const [processing, setProcessing] = useState(false);
	const [progress, setProgress] = useState(0);
	const [currentUser, setCurrentUser] = useState<string>("");
	const [result, setResult] = useState<ProcessResult | null>(null);
	const [error, setError] = useState("");
	const handleProcess = async () => {
		if (selectedUsers.length === 0) return;
		const confirmed = await confirm({
			message:
				`선택한 ${selectedUsers.length}명의 파묘 계정에 대해\n` +
				`모든 미확인 좋아요를 일괄 처리하시겠습니까?\n\n` +
				`거절률: ${Math.round(rejectionRate * 100)}%`,
			confirmText: "처리",
			severity: "warning",
		});
		if (!confirmed) return;
		setProcessing(true);
		setProgress(0);
		setError("");
		const results: ProcessResult = {
			success: 0,
			failed: 0,
			totalViewed: 0,
			totalRejected: 0,
			totalProcessed: 0,
		};
		for (let i = 0; i < selectedUsers.length; i++) {
			const user = selectedUsers[i];
			setCurrentUser(user.name);
			setProgress(Math.round((i / selectedUsers.length) * 100));
			try {
				const likes = await AdminService.dormantLikes.getPendingLikes(user.id);
				if (likes.length === 0) {
					results.success++;
					continue;
				}
				const allLikeIds = likes.map((like) => like.matchLikeId);
				const response = await AdminService.dormantLikes.processLikes({
					dormantUserId: user.id,
					matchLikeIds: allLikeIds,
					rejectionRate,
				});
				results.success++;
				results.totalViewed += response.viewedCount;
				results.totalRejected += response.rejectedCount;
				results.totalProcessed += response.processedCount;
			} catch (err: any) {
				results.failed++;
			}
		}
		setProgress(100);
		setCurrentUser("");
		setResult(results);
		setProcessing(false);
	};
	const handleClose = () => {
		if (processing) return;
		if (result) {
			onComplete();
		}
		setResult(null);
		setProgress(0);
		setRejectionRate(0.2);
		setError("");
		onClose();
	};
	const totalPendingLikes = selectedUsers.reduce(
		(sum, user) => sum + user.pendingLikeCount,
		0,
	);
	return (
		<Modal.Backdrop
			isOpen={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) handleClose?.();
			}}
			isDismissable={!processing}
		>
			<Modal.Container size="md" scroll="inside">
				<Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}>
					<Modal.Header>
						<Modal.Heading>일괄 처리</Modal.Heading>
					</Modal.Header>
					<Modal.Body>
						{error && (
							<Alert style={{ marginBottom: 16 }} status={"danger"}>
								<Alert.Content>{error}</Alert.Content>
							</Alert>
						)}
						{result ? (
							<div style={{ paddingTop: 16, paddingBottom: 16 }}>
								<Alert
									style={{ marginBottom: 16 }}
									status={
										(
											{
												error: "danger",
												info: "default",
												warning: "warning",
												success: "success",
												default: "default",
											} as const
										)[result.failed > 0 ? "warning" : "success"]
									}
								>
									<Alert.Content>
										{result.failed > 0
											? `일부 처리가 실패했습니다 (${result.failed}건 실패)`
											: "모든 처리가 완료되었습니다!"}
									</Alert.Content>
								</Alert>
								<div
									style={{ display: "flex", flexDirection: "column", gap: 8 }}
								>
									<div
										style={{ display: "flex", justifyContent: "space-between" }}
									>
										<p className={"text-sm text-neutral-700"}>처리 성공</p>
										<p className={"text-sm text-neutral-700"}>
											{result.success}명
										</p>
									</div>
									{result.failed > 0 && (
										<div
											style={{
												display: "flex",
												justifyContent: "space-between",
											}}
										>
											<p className={"text-sm text-neutral-700"}>처리 실패</p>
											<p className={"text-sm text-neutral-700"}>
												{result.failed}명
											</p>
										</div>
									)}
									<div
										style={{ display: "flex", justifyContent: "space-between" }}
									>
										<p className={"text-sm text-neutral-700"}>프로필 노출</p>
										<p
											style={{ color: "#10b981" }}
											className={"text-sm text-neutral-700"}
										>
											{result.totalViewed}개
										</p>
									</div>
									<div
										style={{ display: "flex", justifyContent: "space-between" }}
									>
										<p className={"text-sm text-neutral-700"}>거절</p>
										<p
											style={{ color: "#ef4444" }}
											className={"text-sm text-neutral-700"}
										>
											{result.totalRejected}개
										</p>
									</div>
									<div
										style={{ display: "flex", justifyContent: "space-between" }}
									>
										<p className={"text-sm text-neutral-700"}>총 처리</p>
										<p className={"text-sm text-neutral-700"}>
											{result.totalProcessed}개
										</p>
									</div>
								</div>
							</div>
						) : processing ? (
							<div style={{ paddingTop: 16, paddingBottom: 16 }}>
								<p className={"text-sm text-neutral-700"}>
									처리 중... ({currentUser})
								</p>
								<ProgressBar value={progress} aria-label="진행률">
									<ProgressBar.Track>
										<ProgressBar.Fill />
									</ProgressBar.Track>
								</ProgressBar>
								<p className={"text-sm text-neutral-700"}>{progress}%</p>
							</div>
						) : (
							<>
								<div
									style={{
										marginBottom: 24,
										padding: 16,
										backgroundColor: "#f9fafb",
										borderRadius: 8,
									}}
								>
									<p className={"text-sm text-neutral-700"}>선택된 계정</p>
									<div
										style={{ display: "flex", gap: 8, alignItems: "center" }}
									>
										<Chip size={"sm"} variant={"soft"}>
											<Chip.Label>{`${selectedUsers.length}명`}</Chip.Label>
										</Chip>
										<p className={"text-sm text-neutral-700"}>
											(총 {totalPendingLikes}개 미확인 좋아요)
										</p>
									</div>
								</div>

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
										약 {Math.round(totalPendingLikes * rejectionRate)}개 거절,{" "}
										{Math.round(totalPendingLikes * (1 - rejectionRate))}개
										프로필 노출 예정
									</p>
								</div>
							</>
						)}
					</Modal.Body>
					<Modal.Footer>
						{result ? (
							<Button onClick={handleClose} variant={"primary"} size={"md"}>
								확인
							</Button>
						) : (
							<>
								<Button
									onClick={handleClose}
									variant={"tertiary"}
									isDisabled={processing}
									size={"md"}
								>
									취소
								</Button>
								<Button
									onClick={handleProcess}
									variant={"primary"}
									isDisabled={processing || selectedUsers.length === 0}
									size={"md"}
								>
									{processing ? "처리 중..." : "처리하기"}
								</Button>
							</>
						)}
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
