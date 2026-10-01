'use client';

import { Box, Button, Chip, Paper, Typography } from '@mui/material';
import type {
	MeetingRoomCheckin,
	MeetingRoomDeposit,
	MeetingRoomMember,
	MeetingRoomStatus,
} from '@/app/services/admin';
import {
	CHECKIN_OPEN_STATUSES,
	FORFEITABLE_DEPOSIT_STATUSES,
	checkinSourceLabel,
	depositStatusColor,
	depositStatusLabel,
	formatKrw,
	formatKst,
	genderLabel,
} from './lib/format';

export type MemberAction = 'checkin' | 'force-majeure' | 'clear-contact-flag' | 'forfeit' | 'refund';

/** 멤버 한 명과 그 멤버의 보증금·체크인을 memberId 로 묶은 화면용 뷰. */
export interface MemberView {
	member: MeetingRoomMember;
	deposit: MeetingRoomDeposit | null;
	checkin: MeetingRoomCheckin | null;
}

export function memberDisplayName(member: Pick<MeetingRoomMember, 'name'>): string {
	return member.name || '이름 없음';
}

interface MemberCardProps {
	view: MemberView;
	roomStatus: MeetingRoomStatus;
	busy: boolean;
	onAction: (action: MemberAction, view: MemberView) => void;
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline', flexWrap: 'wrap' }}>
			<Typography variant="caption" color="text.secondary" sx={{ minWidth: 48, fontWeight: 600 }}>
				{label}
			</Typography>
			<Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', flexWrap: 'wrap', minWidth: 0 }}>{children}</Box>
		</Box>
	);
}

export function MemberCard({ view, roomStatus, busy, onAction }: MemberCardProps) {
	const { member, deposit, checkin } = view;
	const left = Boolean(member.leftAt);
	const roomLive = CHECKIN_OPEN_STATUSES.has(roomStatus);

	// 버튼 노출은 화면 편의일 뿐이고 최종 판정은 서버가 한다.
	// 수동 체크인: 확정·진행 중인 방의 남아 있는 멤버, 아직 유효한 체크인이 없을 때.
	const canCheckin = roomLive && !left && !checkin?.isValid;
	// 불가항력 환불: 확정·진행 중인 방의 남아 있는 멤버이고 돌려줄 보증금이 있을 때. 연락처 제한이면 서버가 409 로 막는다.
	const showForceMajeure =
		roomLive && !left && (deposit?.status === 'PAID_PENDING_SETTLEMENT' || deposit?.status === 'REFUND_FAILED');
	const forceMajeureBlocked = member.contactRestricted;
	const canClearContactFlag = member.contactRestricted;
	const canForfeit = Boolean(deposit && FORFEITABLE_DEPOSIT_STATUSES.has(deposit.status));
	// 다시 환불은 환불 실패(REFUND_FAILED)에만. 정산 중(SETTLING)은 결제사 확인이 먼저다.
	const canRetryRefund = deposit?.status === 'REFUND_FAILED';
	const canCorrectRefund = !member.contactRestricted && Boolean(
		deposit && ['FORFEITED', 'PARTIALLY_REFUNDED'].includes(deposit.status) && deposit.amount > deposit.refundedAmount,
	);
	const hasAnyAction = canCheckin || showForceMajeure || canClearContactFlag || canForfeit || canRetryRefund || canCorrectRefund;

	const accent = left ? 'text.disabled' : member.contactRestricted ? 'error.main' : 'success.main';

	return (
		<Paper
			variant="outlined"
			sx={{ p: 2, borderLeftWidth: 4, borderLeftStyle: 'solid', borderLeftColor: accent }}
			data-testid={`meeting-member-card-${member.memberId}`}
		>
			<Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
				<Typography variant="subtitle2" fontWeight={700}>
					{memberDisplayName(member)}
				</Typography>
				<Chip size="small" variant="outlined" label={genderLabel(member.gender)} />
				{member.contactRestricted && <Chip size="small" color="error" label="연락처 제한" />}
				{left ? (
					<Chip size="small" label={`나감 ${formatKst(member.leftAt)}`} />
				) : (
					<Chip size="small" color="success" variant="outlined" label="참여 중" />
				)}
			</Box>
			<Typography
				variant="caption"
				color="text.secondary"
				sx={{ display: 'block', mt: 0.5, fontFamily: 'monospace', wordBreak: 'break-all' }}
			>
				유저 {member.userId} · 멤버 {member.memberId}
			</Typography>

			<Box sx={{ display: 'grid', gap: 0.75, mt: 1.5 }}>
				<InfoRow label="보증금">
					{deposit ? (
						<>
							<Chip size="small" label={depositStatusLabel(deposit.status)} color={depositStatusColor(deposit.status)} />
							<Typography variant="body2">{formatKrw(deposit.amount)}</Typography>
							{deposit.refundedAmount > 0 && (
								<Typography variant="body2" color="text.secondary">
									(환불 {formatKrw(deposit.refundedAmount)})
								</Typography>
							)}
							<Typography variant="caption" color="text.secondary">
								결제 {formatKst(deposit.paidAt)}
							</Typography>
						</>
					) : (
						<Typography variant="body2" color="text.secondary">
							없음
						</Typography>
					)}
				</InfoRow>
				{deposit?.lastError && (
					<Typography variant="caption" color="error" sx={{ wordBreak: 'break-all', pl: 7 }}>
						오류: {deposit.lastError}
					</Typography>
				)}
				<InfoRow label="체크인">
					{checkin ? (
						<>
							<Chip
								size="small"
								label={checkin.isValid ? '유효' : '무효'}
								color={checkin.isValid ? 'success' : 'default'}
								variant={checkin.isValid ? 'filled' : 'outlined'}
							/>
							<Typography variant="body2">{checkinSourceLabel(checkin)}</Typography>
							<Typography variant="caption" color="text.secondary">
								{formatKst(checkin.checkedAt)}
							</Typography>
						</>
					) : (
						<Typography variant="body2" color="text.secondary">
							없음
						</Typography>
					)}
				</InfoRow>
			</Box>

			{hasAnyAction && (
				<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
					{canCheckin && (
						<Button size="small" variant="outlined" disabled={busy} onClick={() => onAction('checkin', view)}>
							수동 체크인
						</Button>
					)}
					{showForceMajeure && (
						<Button
							size="small"
							variant="outlined"
							disabled={busy || forceMajeureBlocked}
							onClick={() => onAction('force-majeure', view)}
						>
							불가항력 환불
						</Button>
					)}
					{canClearContactFlag && (
						<Button size="small" variant="outlined" disabled={busy} onClick={() => onAction('clear-contact-flag', view)}>
							연락처 제한 해제
						</Button>
					)}
					{(canRetryRefund || canCorrectRefund) && (
						<Button size="small" variant="contained" color="warning" disabled={busy} onClick={() => onAction('refund', view)}>
							{canCorrectRefund ? '환불 정정' : '환불 재시도'}
						</Button>
					)}
					{canForfeit && (
						<Button size="small" variant="outlined" color="error" disabled={busy} onClick={() => onAction('forfeit', view)}>
							몰수
						</Button>
					)}
				</Box>
			)}
			{showForceMajeure && forceMajeureBlocked && (
				<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
					연락처 제한 상태라 불가항력 환불은 할 수 없어요. 잘못 감지된 거라면 먼저 제한을 해제하세요.
				</Typography>
			)}
		</Paper>
	);
}
