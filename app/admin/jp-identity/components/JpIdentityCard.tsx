"use client";
import { Button, Card, Chip, Modal, Spinner, Tooltip } from "@heroui/react";
import { useEffect, useState } from "react";
import { ImageOff, RefreshCw, X } from "lucide-react";
import type { JpIdentitySubmission } from "@/app/services/admin";
import {
	JP_IDENTITY_CHECKS,
	formatAgeGender,
	formatBirthDate,
	formatJpDocumentType,
	formatKstDateTime,
	getCheckBadge,
	getStatusChip,
	isJpIdentityActionable,
} from "../utils";
type Props = {
	readonly item: JpIdentitySubmission;
	readonly busy: boolean;
	readonly refreshing: boolean;
	readonly onApprove: (item: JpIdentitySubmission) => void;
	readonly onReject: (item: JpIdentitySubmission) => void;
	/** presigned URL 만료 등으로 이미지 로드에 실패했을 때 항목을 다시 조회해 새 URL 을 받는다. */
	readonly onRefreshImage: (item: JpIdentitySubmission) => void;
};
const THUMB_WIDTH = 200;
function ValueCell({
	value,
	muted,
}: {
	readonly value: string;
	readonly muted?: boolean;
}) {
	return (
		<td
			style={{
				color: muted ? "text.disabled" : "text.primary",
				fontWeight: muted ? 400 : 600,
			}}
		>
			{value}
		</td>
	);
}
export function JpIdentityCard({
	item,
	busy,
	refreshing,
	onApprove,
	onReject,
	onRefreshImage,
}: Props) {
	const [imageFailed, setImageFailed] = useState(false);
	const [autoRefreshed, setAutoRefreshed] = useState(false);
	const [viewerOpen, setViewerOpen] = useState(false);
	// 새 URL 이 내려오면 다시 로드 시도.
	useEffect(() => {
		setImageFailed(false);
	}, [item.imageUrl]);
	const handleImageError = () => {
		setImageFailed(true);
		setViewerOpen(false);
		if (!autoRefreshed) {
			setAutoRefreshed(true);
			onRefreshImage(item);
		}
	};
	const handleManualRefresh = () => {
		setAutoRefreshed(true);
		onRefreshImage(item);
	};
	const status = getStatusChip(item.status);
	const actionable = isJpIdentityActionable(item.status);
	const account = item.account;
	const displayName = account?.name ?? item.extracted.name ?? "이름 미상";
	const docLabel = formatJpDocumentType(item.documentType);
	const imageAlt = `${displayName} ${docLabel} 이미지`;
	const showImage = Boolean(item.imageUrl) && !imageFailed;
	return (
		<Card data-testid="jp-identity-card">
			<Card.Content style={{ padding: 16 }}>
				<div className="flex flex-col items-stretch gap-4 lg:flex-row">
					<div
						style={{
							position: "relative",
							flexShrink: 0,
							width: "100%",
							aspectRatio: "8 / 5",
							alignSelf: "flex-start",
							borderRadius: 16,
							overflow: "hidden",
							backgroundColor: "#f5f5f5",
							border: "1px solid #e5e5e5",
						}}
					>
						{showImage ? (
							<Button
								variant="ghost"
								className="h-full w-full rounded-none p-0"
								onPress={() => setViewerOpen(true)}
								aria-label={`${displayName} 신분증 크게 보기`}
								style={{ width: "100%", height: "100%", display: "block" }}
							>
								<img
									onError={handleImageError}
									loading="lazy"
									src={item.imageUrl ?? undefined}
									alt={imageAlt}
									style={{
										width: "100%",
										height: "100%",
										objectFit: "contain",
										display: "block",
									}}
								></img>
							</Button>
						) : (
							<div
								style={{
									width: "100%",
									height: "100%",
									color: "#525252",
									paddingLeft: 8,
									paddingRight: 8,
									textAlign: "center",
								}}
								className={"flex flex-wrap items-center gap-2"}
							>
								<ImageOff size={22} />
								<span className={"text-sm text-neutral-700"}>
									{item.imageUrl ? "이미지 로드 실패" : "이미지 없음"}
								</span>
								{item.imageUrl && (
									<Button
										onClick={handleManualRefresh}
										variant={"tertiary"}
										isDisabled={refreshing}
										size={"sm"}
									>
										{refreshing ? (
											<Spinner aria-label="불러오는 중" size="sm" />
										) : (
											<RefreshCw size={12} />
										)}
										다시 불러오기
									</Button>
								)}
							</div>
						)}
						{refreshing && showImage && (
							<div
								style={{
									position: "absolute",
									inset: 0,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									backgroundColor: "action.disabledBackground",
								}}
							>
								<Spinner aria-label="불러오는 중" size="sm" />
							</div>
						)}
					</div>
					<div
						style={{ flex: 1, minWidth: 0 }}
						className={"flex flex-wrap items-center gap-2"}
					>
						<div className={"flex flex-wrap items-center gap-2"}>
							<div style={{ minWidth: 0 }}>
								<h2 title={displayName} className={"text-sm text-neutral-700"}>
									{displayName}
								</h2>
								<p className={"text-sm text-neutral-700"}>
									{docLabel}
									{" · 제출 "}
									{formatKstDateTime(item.submittedAt)}
									{" (KST)"}
								</p>
								<p title={item.userId} className={"text-sm text-neutral-700"}>
									회원 ID {item.userId}
									{account?.userStatus ? ` · 계정 ${account.userStatus}` : ""}
								</p>
							</div>
							<Chip size={"sm"} variant={"soft"}>
								<Chip.Label>{status.label}</Chip.Label>
							</Chip>
						</div>
						<table
							aria-label="계정 정보와 서류 정보 비교"
							style={{}}
							className={
								"w-full text-sm text-left [&_td]:p-3 [&_th]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
							}
						>
							<thead>
								<tr>
									<th
										style={{ color: "#525252", fontWeight: 600, width: 88 }}
										scope="col"
									>
										항목
									</th>
									<th style={{ color: "#525252", fontWeight: 600 }} scope="col">
										계정
									</th>
									<th style={{ color: "#525252", fontWeight: 600 }} scope="col">
										서류(OCR)
									</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td style={{ color: "#525252" }}>이름</td>
									<ValueCell
										value={account?.name ?? "-"}
										muted={!account?.name}
									/>
									<ValueCell
										value={item.extracted.name ?? "-"}
										muted={!item.extracted.name}
									/>
								</tr>
								<tr>
									<td style={{ color: "#525252" }}>생년월일</td>
									<ValueCell
										value={formatBirthDate(account?.birthday)}
										muted={!account?.birthday}
									/>
									<ValueCell
										value={formatBirthDate(item.extracted.birthDate)}
										muted={!item.extracted.birthDate}
									/>
								</tr>
								<tr>
									<td style={{ color: "#525252" }}>나이 / 성별</td>
									<ValueCell
										value={formatAgeGender(account?.age, account?.gender)}
										muted={account?.age == null && !account?.gender}
									/>
									<ValueCell value="-" muted />
								</tr>
							</tbody>
						</table>
						{!account && (
							<span className={"text-sm text-neutral-700"}>
								연결된 계정 정보를 찾지 못했습니다.
							</span>
						)}
						<div
							aria-label="검증 결과"
							className={"flex flex-wrap items-center gap-2"}
						>
							{JP_IDENTITY_CHECKS.map(({ key, label }) => {
								const badge = getCheckBadge(item.checks[key]);
								return (
									<Chip key={key} size={"sm"} variant={"soft"}>
										<Chip.Label>{`${label} ${badge.label}`}</Chip.Label>
									</Chip>
								);
							})}
						</div>
						{item.rejectionReason && (
							<p
								style={{ whiteSpace: "pre-wrap" }}
								className={"text-sm text-neutral-700"}
							>
								거절 사유: {item.rejectionReason}
							</p>
						)}
						<div className={"flex flex-wrap items-center gap-2"}>
							{actionable ? (
								<>
									<Button
										onClick={() => onReject(item)}
										variant={"secondary"}
										isDisabled={busy}
										size={"sm"}
									>
										거절
									</Button>
									<Button
										onClick={() => onApprove(item)}
										variant={"primary"}
										isDisabled={busy}
										size={"sm"}
									>
										승인
									</Button>
								</>
							) : (
								<Tooltip>
									<Tooltip.Trigger tabIndex={0}>
										<span className={"text-sm text-neutral-700"}>
											처리 완료
										</span>
									</Tooltip.Trigger>
									<Tooltip.Content>
										{formatKstDateTime(item.reviewedAt)}
									</Tooltip.Content>
								</Tooltip>
							)}
						</div>
					</div>
				</div>
			</Card.Content>
			<Modal.Backdrop
				isOpen={viewerOpen && showImage}
				onOpenChange={(isOpen) => {
					if (!isOpen) (() => setViewerOpen(false))?.();
				}}
				isDismissable={true}
			>
				<Modal.Container size="lg" scroll="inside">
					<Modal.Dialog style={{ width: '100%', maxWidth: 1200, minWidth: 0 }} aria-label="신분증 크게 보기">
						<Modal.Body
							style={{
								padding: 0,
								position: "relative",
								backgroundColor: "secondary.main",
								height: "88vh",
							}}
						>
							<Button
								onClick={() => setViewerOpen(false)}
								style={{
									position: "absolute",
									top: 10,
									right: 10,
									zIndex: 2,
									color: "secondary.contrastText",
									backgroundColor: "action.active",
								}}
								variant={"tertiary"}
								isIconOnly={true}
								aria-label={"큰 이미지 닫기"}
								size={"md"}
							>
								<X size={20} />
							</Button>
							<img
								onError={handleImageError}
								loading="lazy"
								src={item.imageUrl ?? undefined}
								alt={`${imageAlt} 크게 보기`}
								style={{
									width: "100%",
									height: "100%",
									objectFit: "contain",
									display: "block",
								}}
							></img>
						</Modal.Body>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</Card>
	);
}
