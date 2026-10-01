'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	Alert,
	Box,
	Button,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	Drawer,
	IconButton,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from '@mui/material';
import { X } from 'lucide-react';
import AdminService from '@/app/services/admin';
import type { MeetingRoomDetail, MeetingRoomMember, MeetingTeamSide } from '@/app/services/admin';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog';
import { useToast } from '@/shared/ui/admin/toast';
import { meetingErrorMessage } from './lib/errors';
import {
	COMPANY_CANCEL_REFUND_STATUSES,
	LIVE_ROOM_STATUSES,
	cancelGradeLabel,
	canceledReasonLabel,
	formatKrw,
	formatKst,
	genderLabel,
	roomRegionLabel,
	roomStatusColor,
	roomStatusLabel,
	sideLabel,
} from './lib/format';
import { MemberCard, memberDisplayName, type MemberAction, type MemberView } from './member-card';

interface RoomDetailDrawerProps {
	roomId: string | null;
	onClose: () => void;
	/** 처리(환불·취소 등)가 끝나면 호출. 목록을 새로 읽는 용도. */
	onChanged: () => void;
}

type CancelStep = 'closed' | 'reason' | 'final';

const SIDE_ORDER: MeetingTeamSide[] = ['HOST', 'GUEST'];

function groupBySide(views: MemberView[]): { side: MeetingTeamSide; views: MemberView[] }[] {
	return SIDE_ORDER.map((side) => ({
		side,
		// 남아 있는 멤버 먼저, 나간 멤버는 뒤로.
		views: views
			.filter((view) => view.member.side === side)
			.sort((a, b) => Number(Boolean(a.member.leftAt)) - Number(Boolean(b.member.leftAt))),
	})).filter((group) => group.views.length > 0);
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<Box>
			<Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
				{label}
			</Typography>
			<Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
				{value ?? '-'}
			</Typography>
		</Box>
	);
}

export function RoomDetailDrawer({ roomId, onClose, onChanged }: RoomDetailDrawerProps) {
	const confirm = useConfirm();
	const toast = useToast();

	const [detail, setDetail] = useState<MeetingRoomDetail | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [busyMemberId, setBusyMemberId] = useState<string | null>(null);

	const [forceMajeureTarget, setForceMajeureTarget] = useState<MemberView | null>(null);
	const [forceMajeureNote, setForceMajeureNote] = useState('');

	const [cancelStep, setCancelStep] = useState<CancelStep>('closed');
	const [cancelReason, setCancelReason] = useState('');
	const [canceling, setCanceling] = useState(false);

	const load = useCallback(async (id: string) => {
		setLoading(true);
		setError(null);
		try {
			setDetail(await AdminService.meeting.getRoom(id));
		} catch (loadError) {
			setError(meetingErrorMessage(loadError, '미팅 방 상세를 불러오지 못했어요.'));
			setDetail(null);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		setForceMajeureTarget(null);
		setForceMajeureNote('');
		setCancelStep('closed');
		setCancelReason('');
		if (!roomId) {
			setDetail(null);
			setError(null);
			return;
		}
		setDetail(null);
		load(roomId);
	}, [roomId, load]);

	const memberViews = useMemo<MemberView[]>(() => {
		if (!detail) return [];
		const depositByMember = new Map(detail.deposits.map((deposit) => [deposit.memberId, deposit]));
		const checkinByMember = new Map(detail.checkins.map((checkin) => [checkin.memberId, checkin]));
		return detail.members.map((member) => ({
			member,
			deposit: depositByMember.get(member.memberId) ?? null,
			checkin: checkinByMember.get(member.memberId) ?? null,
		}));
	}, [detail]);

	const sides = useMemo(() => groupBySide(memberViews), [memberViews]);

	const memberNameByUserId = useMemo(() => {
		const map = new Map<string, string>();
		for (const member of detail?.members ?? []) map.set(member.userId, memberDisplayName(member));
		return map;
	}, [detail]);

	// 회사 사정 취소 때 서버가 환불하는 보증금(자리 넘긴 사람·연락처 제한 멤버 포함).
	const companyCancelRefunds = useMemo(() => {
		const deposits = (detail?.deposits ?? []).filter((deposit) => COMPANY_CANCEL_REFUND_STATUSES.has(deposit.status));
		return {
			count: deposits.length,
			amount: deposits.reduce((sum, deposit) => sum + Math.max(deposit.amount - deposit.refundedAmount, 0), 0),
		};
	}, [detail]);

	const afterChange = async () => {
		onChanged();
		if (roomId) await load(roomId);
	};

	const runMemberAction = async (member: MeetingRoomMember, work: () => Promise<string>, failMessage: string) => {
		setBusyMemberId(member.memberId);
		try {
			toast.success(await work());
		} catch (actionError) {
			toast.error(meetingErrorMessage(actionError, failMessage));
		} finally {
			setBusyMemberId(null);
			// 실패해도 서버에서 일부 바뀌었을 수 있어(예: 환불 실패 기록) 항상 다시 읽는다.
			await afterChange();
		}
	};

	const handleMemberAction = async (action: MemberAction, view: MemberView) => {
		if (!roomId || busyMemberId) return;
		const { member, deposit } = view;
		const name = memberDisplayName(member);

		if (action === 'checkin') {
			const ok = await confirm({
				title: '수동 체크인',
				message: `${name} 님을 도착한 것으로 처리할게요. 정산 때 참석으로 계산돼요.`,
				confirmText: '체크인 처리',
			});
			if (!ok) return;
			await runMemberAction(
				member,
				async () => {
					// 수동 체크인만 userId 로 부른다.
					await AdminService.meeting.manualCheckin(roomId, member.userId);
					return `${name} 님을 수동 체크인했어요.`;
				},
				'수동 체크인에 실패했어요.',
			);
			return;
		}

		if (action === 'force-majeure') {
			setForceMajeureTarget(view);
			setForceMajeureNote('');
			return;
		}

		if (action === 'clear-contact-flag') {
			const ok = await confirm({
				title: '연락처 제한 해제',
				message: `${name} 님의 연락처 공유 감지를 이 방에서 해제할게요. 이의신청이 맞다고 확인됐을 때만 해제하세요. 해제하면 환불 제한이 풀려요.`,
				confirmText: '해제',
				severity: 'warning',
			});
			if (!ok) return;
			await runMemberAction(
				member,
				async () => {
					const { count } = await AdminService.meeting.clearContactFlag(roomId, member.memberId);
					return `연락처 제한을 해제했어요. (메시지 ${count.toLocaleString('ko-KR')}건)`;
				},
				'연락처 제한 해제에 실패했어요.',
			);
			return;
		}

		if (action === 'forfeit') {
			const ok = await confirm({
				title: '보증금 몰수',
				message: `${name} 님의 보증금 ${formatKrw(deposit?.amount)}을 몰수할게요. 돌려주지 않고 정산이 끝나요. 되돌릴 수 없어요.`,
				confirmText: '몰수',
				severity: 'error',
			});
			if (!ok) return;
			await runMemberAction(
				member,
				async () => {
					await AdminService.meeting.forfeit(roomId, member.memberId);
					return `${name} 님의 보증금을 몰수했어요.`;
				},
				'몰수에 실패했어요.',
			);
			return;
		}

		if (action === 'refund') {
			const correction = deposit?.status === 'FORFEITED' || deposit?.status === 'PARTIALLY_REFUNDED';
			const remaining = Math.max((deposit?.amount ?? 0) - (deposit?.refundedAmount ?? 0), 0);
			const ok = await confirm({
				title: correction ? '환불 정정' : '환불 다시 시도',
				message: `${name} 님에게 남은 금액 ${formatKrw(remaining)}을 환불할게요. ${correction ? '오감지 또는 잘못된 정산으로 환불해야 하는지 먼저 확인하세요. ' : ''}결제사(PortOne)에 환불 요청이 바로 나가요.`,
				confirmText: correction ? '환불 정정' : '환불 재시도',
				severity: 'warning',
			});
			if (!ok) return;
			await runMemberAction(
				member,
				async () => {
					const { amount } = await AdminService.meeting.refund(roomId, member.memberId);
					return `${name} 님에게 환불했어요. (${formatKrw(amount)})`;
				},
				'환불 재시도에 실패했어요.',
			);
		}
	};

	const handleForceMajeureSubmit = async () => {
		if (!roomId || !forceMajeureTarget) return;
		const target = forceMajeureTarget;
		const name = memberDisplayName(target.member);
		const note = forceMajeureNote.trim();
		setForceMajeureTarget(null);
		await runMemberAction(
			target.member,
			async () => {
				await AdminService.meeting.forceMajeure(roomId, target.member.memberId, note || undefined);
				return `${name} 님을 불가항력으로 처리하고 전액 환불했어요.`;
			},
			'불가항력 환불에 실패했어요.',
		);
	};

	const handleCancelSubmit = async () => {
		if (!roomId) return;
		const reason = cancelReason.trim();
		if (!reason) return;
		setCanceling(true);
		try {
			await AdminService.meeting.cancelRoom(roomId, reason);
			toast.success('미팅을 취소하고 참가자 전원에게 전액 환불했어요.');
			setCancelStep('closed');
			setCancelReason('');
		} catch (cancelError) {
			toast.error(meetingErrorMessage(cancelError, '미팅 취소에 실패했어요.'));
		} finally {
			setCanceling(false);
			// 실패해도 방은 이미 취소되고 일부 환불만 실패했을 수 있어 항상 다시 읽는다.
			await afterChange();
		}
	};

	const room = detail?.room ?? null;
	const canCompanyCancel = Boolean(room && LIVE_ROOM_STATUSES.has(room.status));
	const paidCount = detail
		? detail.deposits.filter((deposit) => deposit.status === 'PAID_PENDING_SETTLEMENT').length
		: 0;
	const forceMajeureBeforeStart =
		room?.status === 'CONFIRMED' && new Date(room.scheduledAt).getTime() > Date.now();

	return (
		<Drawer anchor="right" open={Boolean(roomId)} onClose={onClose}>
			<Box sx={{ width: { xs: '100vw', md: 760 }, p: { xs: 2, sm: 3 } }} data-testid="meeting-room-detail">
				<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
					<Box sx={{ flex: 1, minWidth: 0 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
							<Typography variant="h6" fontWeight={700}>
								{room?.title || '미팅 방'}
							</Typography>
							{room && (
								<Chip
									size="small"
									label={roomStatusLabel(room.status)}
									color={roomStatusColor(room.status)}
									variant={room.status === 'CANCELED' ? 'filled' : 'outlined'}
								/>
							)}
						</Box>
						<Typography
							variant="caption"
							color="text.secondary"
							sx={{ fontFamily: 'monospace', wordBreak: 'break-all', display: 'block', mt: 0.5 }}
						>
							{roomId}
						</Typography>
					</Box>
					{canCompanyCancel && (
						<Button
							variant="contained"
							color="error"
							size="small"
							disabled={canceling || loading || Boolean(busyMemberId)}
							onClick={() => setCancelStep('reason')}
							sx={{ flexShrink: 0 }}
						>
							회사 사정 취소
						</Button>
					)}
					<IconButton aria-label="상세 닫기" onClick={onClose} size="small">
						<X size={18} />
					</IconButton>
				</Box>

				{loading && !detail ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
						<CircularProgress />
					</Box>
				) : error ? (
					<Alert
						severity="error"
						sx={{ mt: 2 }}
						action={
							roomId ? (
								<Button color="inherit" size="small" onClick={() => load(roomId)}>
									다시 시도
								</Button>
							) : undefined
						}
					>
						{error}
					</Alert>
				) : room && detail ? (
					<Box sx={{ mt: 2, display: 'grid', gap: 3 }}>
						<Box
							sx={{
								display: 'grid',
								gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' },
								gap: 1.5,
								p: 2,
								bgcolor: 'grey.50',
								borderRadius: 1,
							}}
						>
							<Field label="미팅 시각 (KST)" value={formatKst(room.scheduledAt)} />
							<Field label="호스트 성별" value={genderLabel(room.hostGender)} />
							<Field label="지역" value={roomRegionLabel(room)} />
							<Field label="장소" value={room.placeName || '미정'} />
							<Field label="결제 마감" value={formatKst(room.depositDueAt)} />
							<Field label="생성" value={formatKst(room.createdAt)} />
							{room.status === 'CANCELED' && (
								<Field label="취소 사유" value={canceledReasonLabel(room.canceledReason)} />
							)}
							<Field label="호스트 유저 ID" value={room.hostUserId} />
						</Box>

						<Box>
							<Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
								참가자 {detail.members.length}명
								<Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
									결제 완료 {paidCount}명
								</Typography>
							</Typography>
							{memberViews.length === 0 ? (
								<Typography variant="body2" color="text.secondary">
									참가자가 없어요.
								</Typography>
							) : (
								<Box sx={{ display: 'grid', gap: 2 }}>
									{sides.map(({ side, views }) => (
										<Box key={side}>
											<Typography variant="overline" color="text.secondary">
												{sideLabel(side)} 팀 · {views.length}명
											</Typography>
											<Box sx={{ display: 'grid', gap: 1.5, mt: 0.5 }}>
												{views.map((view) => (
													<MemberCard
														key={view.member.memberId}
														view={view}
														roomStatus={room.status}
														busy={busyMemberId === view.member.memberId}
														onAction={handleMemberAction}
													/>
												))}
											</Box>
										</Box>
									))}
								</Box>
							)}
						</Box>

						<Divider />

						<Box>
							<Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
								취소 기록 {detail.cancelLogs.length}건
							</Typography>
							{detail.cancelLogs.length === 0 ? (
								<Typography variant="body2" color="text.secondary">
									취소 기록이 없어요.
								</Typography>
							) : (
								<Table size="small">
									<TableHead>
										<TableRow>
											<TableCell sx={{ fontWeight: 600 }}>시각</TableCell>
											<TableCell sx={{ fontWeight: 600 }}>참가자</TableCell>
											<TableCell sx={{ fontWeight: 600 }}>종류</TableCell>
											<TableCell sx={{ fontWeight: 600 }}>사유</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{detail.cancelLogs.map((log) => (
											<TableRow key={log.id}>
												<TableCell sx={{ whiteSpace: 'nowrap' }}>{formatKst(log.createdAt)}</TableCell>
												<TableCell>
													<Typography variant="body2">{memberNameByUserId.get(log.userId) ?? '이름 없음'}</Typography>
													<Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
														{log.userId}
													</Typography>
												</TableCell>
												<TableCell>
													<Chip size="small" variant="outlined" label={cancelGradeLabel(log.grade)} />
													{log.exempt && (
														<Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
															{log.exemptReason ? `제재 제외 · ${log.exemptReason}` : '제재 제외'}
														</Typography>
													)}
												</TableCell>
												<TableCell sx={{ wordBreak: 'break-all' }}>{log.reason || '-'}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</Box>
					</Box>
				) : null}
			</Box>

			<Dialog open={Boolean(forceMajeureTarget)} onClose={() => setForceMajeureTarget(null)} maxWidth="xs" fullWidth>
				<DialogTitle sx={{ fontWeight: 700 }}>불가항력 환불</DialogTitle>
				<DialogContent>
					<Typography variant="body2" sx={{ mb: 1 }}>
						{forceMajeureTarget ? memberDisplayName(forceMajeureTarget.member) : ''} 님에게{' '}
						{formatKrw(forceMajeureTarget?.deposit?.amount)}을 전액 환불하고 자리를 비울게요.
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
						{forceMajeureBeforeStart
							? '미팅 시작 전이라 빈자리를 다시 모집해요. 대체 마감(전날 18시)이 지났다면 미팅이 바로 취소될 수 있어요.'
							: '이미 시작한 미팅이라 정산에서만 빠져요.'}
					</Typography>
					<TextField
						autoFocus
						fullWidth
						multiline
						minRows={2}
						label="메모 (선택)"
						placeholder="예: 병원 진단서 확인"
						value={forceMajeureNote}
						onChange={(event) => setForceMajeureNote(event.target.value)}
					/>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button color="inherit" onClick={() => setForceMajeureTarget(null)}>
						닫기
					</Button>
					<Button variant="contained" onClick={handleForceMajeureSubmit}>
						전액 환불
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog
				open={cancelStep !== 'closed'}
				onClose={() => {
					if (!canceling) setCancelStep('closed');
				}}
				maxWidth="xs"
				fullWidth
			>
				{cancelStep === 'final' ? (
					<>
						<DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>정말 취소할까요?</DialogTitle>
						<DialogContent>
							<Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
								참가자 전원에게 전액 환불돼요.
							</Typography>
							<Typography variant="body2" color="text.secondary">
								보증금 {companyCancelRefunds.count}건, 합계 {formatKrw(companyCancelRefunds.amount)}을 결제사에 바로 환불 요청하고 방을
								취소해요. 되돌릴 수 없어요.
							</Typography>
							<Typography variant="body2" sx={{ mt: 2, wordBreak: 'break-all' }}>
								사유: {cancelReason.trim()}
							</Typography>
						</DialogContent>
						<DialogActions sx={{ px: 3, pb: 2 }}>
							<Button color="inherit" disabled={canceling} onClick={() => setCancelStep('reason')}>
								뒤로
							</Button>
							<Button variant="contained" color="error" disabled={canceling} onClick={handleCancelSubmit}>
								{canceling ? <CircularProgress size={18} color="inherit" /> : '취소하고 전액 환불'}
							</Button>
						</DialogActions>
					</>
				) : (
					<>
						<DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>회사 사정으로 미팅 취소</DialogTitle>
						<DialogContent>
							<Alert severity="error" sx={{ mb: 2 }}>
								참가자 전원에게 전액 환불돼요. 자리를 넘긴 사람과 연락처 제한 멤버도 모두 돌려받아요.
							</Alert>
							<TextField
								autoFocus
								fullWidth
								multiline
								minRows={2}
								required
								label="취소 사유"
								placeholder="예: 장소 사정으로 진행 불가"
								value={cancelReason}
								onChange={(event) => setCancelReason(event.target.value)}
							/>
						</DialogContent>
						<DialogActions sx={{ px: 3, pb: 2 }}>
							<Button color="inherit" onClick={() => setCancelStep('closed')}>
								닫기
							</Button>
							<Button
								variant="contained"
								color="error"
								disabled={!cancelReason.trim()}
								onClick={() => setCancelStep('final')}
							>
								다음
							</Button>
						</DialogActions>
					</>
				)}
			</Dialog>
		</Drawer>
	);
}
