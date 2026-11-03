"use client";
import dynamic from "next/dynamic";
import type { UserDetail } from "@/components/admin/appearance/UserDetailModal";
import { useState } from "react";
import { Button, Chip } from "@heroui/react";
import type {
	MeetingRoomCheckin,
	MeetingRoomDeposit,
	MeetingRoomMember,
	MeetingRoomStatus,
} from "@/app/services/admin";
import {
	CHECKIN_OPEN_STATUSES,
	FORFEITABLE_DEPOSIT_STATUSES,
	checkinSourceLabel,
	depositStatusLabel,
	formatKrw,
	formatKst,
	genderLabel,
} from "./lib/format";
const UserDetailModal = dynamic(() => import("@/components/admin/appearance/UserDetailModal"), { ssr: false });
// 빈 id로 열면 기존 회원 상세 화면이 선택한 userId의 전체 프로필을 조회한다.
const EMPTY_PROFILE: UserDetail = { id: "", name: "", age: 0, gender: "MALE", profileImages: [] };

export type MemberAction =
	| "checkin"
	| "force-majeure"
	| "clear-contact-flag"
	| "forfeit"
	| "refund";
/** 멤버 한 명과 그 멤버의 보증금·체크인을 memberId 로 묶은 화면용 뷰. */
export interface MemberView {
	member: MeetingRoomMember;
	deposit: MeetingRoomDeposit | null;
	checkin: MeetingRoomCheckin | null;
}
export function memberDisplayName(
	member: Pick<MeetingRoomMember, "name">,
): string {
	return member.name || "이름 없음";
}
interface MemberCardProps {
	view: MemberView;
	roomStatus: MeetingRoomStatus;
	busy: boolean;
	onAction: (action: MemberAction, view: MemberView) => void;
}
function InfoRow({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div
			style={{
				display: "flex",
				gap: 8,
				alignItems: "baseline",
				flexWrap: "wrap",
			}}
		>
			<span
				style={{ minWidth: 48, fontWeight: 600 }}
				className={"text-sm text-neutral-700"}
			>
				{label}
			</span>
			<div
				style={{
					display: "flex",
					gap: 6,
					alignItems: "center",
					flexWrap: "wrap",
					minWidth: 0,
				}}
			>
				{children}
			</div>
		</div>
	);
}
export function MemberCard({
	view,
	roomStatus,
	busy,
	onAction,
}: MemberCardProps) {
	const { member, deposit, checkin } = view;
	const [profileOpen, setProfileOpen] = useState(false);
	const [failedImage, setFailedImage] = useState<string | null>(null);
	const left = Boolean(member.leftAt);
	const roomLive = CHECKIN_OPEN_STATUSES.has(roomStatus);
	// 버튼 노출은 화면 편의일 뿐이고 최종 판정은 서버가 한다.
	// 수동 체크인: 확정·진행 중인 방의 남아 있는 멤버, 아직 유효한 체크인이 없을 때.
	const canCheckin = roomLive && !left && !checkin?.isValid;
	// 불가항력 환불: 확정·진행 중인 방의 남아 있는 멤버이고 돌려줄 보증금이 있을 때. 연락처 제한이면 서버가 409 로 막는다.
	const showForceMajeure =
		roomLive &&
		!left &&
		(deposit?.status === "PAID_PENDING_SETTLEMENT" ||
			deposit?.status === "REFUND_FAILED");
	const forceMajeureBlocked = member.contactRestricted;
	const canClearContactFlag = member.contactRestricted;
	const canForfeit = Boolean(
		deposit && FORFEITABLE_DEPOSIT_STATUSES.has(deposit.status),
	);
	// 다시 환불은 환불 실패(REFUND_FAILED)에만. 정산 중(SETTLING)은 결제사 확인이 먼저다.
	const canRetryRefund = deposit?.status === "REFUND_FAILED";
	const canCorrectRefund =
		!member.contactRestricted &&
		Boolean(
			deposit &&
				["FORFEITED", "PARTIALLY_REFUNDED"].includes(deposit.status) &&
				deposit.amount > deposit.refundedAmount,
		);
	const hasAnyAction =
		canCheckin ||
		showForceMajeure ||
		canClearContactFlag ||
		canForfeit ||
		canRetryRefund ||
		canCorrectRefund;
	const accent = left
		? "#a3a3a3"
		: member.contactRestricted
			? "#ef4444"
			: "#22c55e";
	return (
		<section
			style={{
				padding: 16,
				borderLeftWidth: 4,
				borderLeftStyle: "solid",
				borderLeftColor: accent,
			}}
			data-testid={`meeting-member-card-${member.memberId}`}
		>
			<div
				style={{
					display: "flex",
					gap: 8,
					alignItems: "center",
					flexWrap: "wrap",
				}}
			>
				{member.profileImageUrl && failedImage !== member.profileImageUrl ? (
					<a href={member.profileImageUrl} target="_blank" rel="noreferrer" aria-label={`${memberDisplayName(member)} 사진 크게 보기`}>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={member.profileImageUrl} alt={`${memberDisplayName(member)} 프로필`} width={44} height={44}
							style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8 }} onError={() => setFailedImage(member.profileImageUrl ?? null)} />
					</a>
				) : <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-xs text-neutral-500">사진 없음</div>}
				<div style={{ flex: "1 1 140px", minWidth: 0 }}>
					<p className="text-base font-semibold text-neutral-900">{memberDisplayName(member)}</p>
					<p className="text-sm text-neutral-700">{genderLabel(member.gender)} · {member.appearanceGrade && member.appearanceGrade !== "UNKNOWN" ? `${member.appearanceGrade}등급` : member.profileUnavailable ? "등급 조회 실패" : "미분류"}</p>
					<p className="text-sm text-neutral-700">{member.universityName || "학교 정보 없음"}</p>
					{member.profileUnavailable && <p role="status" className="text-xs text-amber-700">프로필을 불러오지 못했어요. 상세를 다시 열어 주세요.</p>}
				</div>

				<Button size="sm" variant="secondary" onPress={() => setProfileOpen(true)}>프로필 상세보기</Button>
			</div>

			<details className="mt-3">
				<summary className="cursor-pointer text-sm text-neutral-600">미팅 운영 정보 · 보증금·체크인</summary>
				<div className="mt-2 flex flex-wrap gap-2">
				{member.contactRestricted && (
					<Chip size={"sm"} variant={"soft"}>
						<Chip.Label>{"연락처 제한"}</Chip.Label>
					</Chip>
				)}
				{left ? (
					<Chip size={"sm"} variant={"soft"}>
						<Chip.Label>{`나감 ${formatKst(member.leftAt)}`}</Chip.Label>
					</Chip>
				) : (
					<Chip size={"sm"} variant={"soft"}>
						<Chip.Label>{"참여 중"}</Chip.Label>
					</Chip>
				)}
				</div>
			<div style={{ display: "grid", gap: 6, marginTop: 12 }}>
				<InfoRow label="보증금">
					{deposit ? (
						<>
							<Chip size={"sm"} variant={"soft"}>
								<Chip.Label>{depositStatusLabel(deposit.status)}</Chip.Label>
							</Chip>
							<p className={"text-sm text-neutral-700"}>
								{formatKrw(deposit.amount)}
							</p>
							{deposit.refundedAmount > 0 && (
								<p className={"text-sm text-neutral-700"}>
									(환불 {formatKrw(deposit.refundedAmount)})
								</p>
							)}
							<span className={"text-sm text-neutral-700"}>
								결제 {formatKst(deposit.paidAt)}
							</span>
						</>
					) : (
						<p className={"text-sm text-neutral-700"}>없음</p>
					)}
				</InfoRow>
				{deposit?.lastError && (
					<span
						style={{ wordBreak: "break-all", paddingLeft: 56 }}
						className={"text-sm text-neutral-700"}
					>
						오류: {deposit.lastError}
					</span>
				)}
				<InfoRow label="체크인">
					{checkin ? (
						<>
							<Chip size={"sm"} variant={"soft"}>
								<Chip.Label>{checkin.isValid ? "유효" : "무효"}</Chip.Label>
							</Chip>
							<p className={"text-sm text-neutral-700"}>
								{checkinSourceLabel(checkin)}
							</p>
							<span className={"text-sm text-neutral-700"}>
								{formatKst(checkin.checkedAt)}
							</span>
						</>
					) : (
						<p className={"text-sm text-neutral-700"}>없음</p>
					)}
				</InfoRow>
			</div>
			{hasAnyAction && (
				<div
					style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}
				>
					{canCheckin && (
						<Button
							onClick={() => onAction("checkin", view)}
							variant={"secondary"}
							isDisabled={busy}
							size={"sm"}
						>
							수동 체크인
						</Button>
					)}
					{showForceMajeure && (
						<Button
							onClick={() => onAction("force-majeure", view)}
							variant={"secondary"}
							isDisabled={busy || forceMajeureBlocked}
							size={"sm"}
						>
							불가항력 환불
						</Button>
					)}
					{canClearContactFlag && (
						<Button
							onClick={() => onAction("clear-contact-flag", view)}
							variant={"secondary"}
							isDisabled={busy}
							size={"sm"}
						>
							연락처 제한 해제
						</Button>
					)}
					{(canRetryRefund || canCorrectRefund) && (
						<Button
							onClick={() => onAction("refund", view)}
							variant={"primary"}
							isDisabled={busy}
							size={"sm"}
						>
							{canCorrectRefund ? "환불 정정" : "환불 재시도"}
						</Button>
					)}
					{canForfeit && (
						<Button
							onClick={() => onAction("forfeit", view)}
							variant={"secondary"}
							isDisabled={busy}
							size={"sm"}
						>
							몰수
						</Button>
					)}
				</div>
			)}
			{showForceMajeure && forceMajeureBlocked && (
				<span
					style={{ display: "block", marginTop: 8 }}
					className={"text-sm text-neutral-700"}
				>
					연락처 제한 상태라 불가항력 환불은 할 수 없어요. 잘못 감지된 거라면
					먼저 제한을 해제하세요.
				</span>
			)}
			</details>
			{profileOpen && <UserDetailModal spacious open userId={member.userId} userDetail={EMPTY_PROFILE} loading error={null} onClose={() => setProfileOpen(false)} />}
		</section>
	);
}
