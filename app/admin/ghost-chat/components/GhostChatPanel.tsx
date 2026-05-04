'use client';

import { useMemo, useState } from 'react';
import {
	Alert,
	Box,
	Button,
	Chip,
	CircularProgress,
	Divider,
	IconButton,
	List,
	ListItem,
	Paper,
	TextField,
	Typography,
} from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	Close as CloseIcon,
	Send as SendIcon,
} from '@mui/icons-material';
import type { GhostChatSession, GhostChatTimelineMessage } from '@/app/types/ghost-chat';
import { GHOST_CHAT_STATE_LABELS } from '@/app/types/ghost-chat';
import GhostChatConfirmDialog from './GhostChatConfirmDialog';

interface GhostChatPanelProps {
	session: GhostChatSession | null;
	messages: GhostChatTimelineMessage[];
	loading: boolean;
	messagesLoading: boolean;
	actionLoading: boolean;
	onAssign: (id: string) => Promise<void> | void;
	onSendMessage: (id: string, content: string) => Promise<void>;
	onClose: (id: string) => Promise<void> | void;
	onBack?: () => void;
}

type ConfirmMode = 'first-send' | 'close' | null;

const stateColors: Record<GhostChatSession['state'], 'warning' | 'success' | 'info' | 'default'> = {
	PENDING: 'warning',
	ACTIVE: 'success',
	IDLE: 'info',
	CLOSED: 'default',
};

function shortId(id: string) {
	return id.length > 10 ? `${id.slice(0, 6)}...${id.slice(-4)}` : id;
}

function formatTime(dateString: string | null) {
	if (!dateString) return null;
	return new Date(dateString).toLocaleString('ko-KR', {
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	});
}

function buildTimeline(session: GhostChatSession) {
	return [
		{ label: '세션 생성됨', at: session.createdAt },
		{ label: '관리자 배정됨', at: session.assignedAt },
		{ label: '첫 유저 메시지', at: session.firstUserMessageAt },
		{ label: '마지막 유저 메시지', at: session.lastUserMessageAt },
		{ label: '마지막 Ghost 메시지', at: session.lastAdminMessageAt },
		{ label: '세션 종료됨', at: session.closedAt },
	].filter((item) => item.at);
}

const senderLabels: Record<GhostChatTimelineMessage['senderType'], string> = {
	TARGET_USER: '상대 유저',
	GHOST: 'Ghost',
	SYSTEM: '시스템',
};

function getComposerBlockedReason(session: GhostChatSession) {
	if (session.state === 'PENDING') return '먼저 세션을 본인에게 배정해야 메시지를 보낼 수 있습니다.';
	if (session.state === 'IDLE') return '응답 없음 상태입니다. 세션을 새로고침한 뒤 전송 여부를 확인하세요.';
	if (session.state === 'CLOSED') return '종료된 세션에는 메시지를 보낼 수 없습니다.';
	return null;
}

export default function GhostChatPanel({
	session,
	messages,
	loading,
	messagesLoading,
	actionLoading,
	onAssign,
	onSendMessage,
	onClose,
	onBack,
}: GhostChatPanelProps) {
	const [draft, setDraft] = useState('');
	const [localError, setLocalError] = useState<string | null>(null);
	const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);

	const timeline = useMemo(() => (session ? buildTimeline(session) : []), [session]);
	const canSend = Boolean(session && session.state === 'ACTIVE' && draft.trim() && !actionLoading);
	const canClose = Boolean(session && session.state !== 'CLOSED' && !actionLoading);
	const composerBlockedReason = session ? getComposerBlockedReason(session) : null;

	const sendDraft = async () => {
		if (!session) return;
		try {
			setLocalError(null);
			await onSendMessage(session.id, draft);
			setDraft('');
		} catch (err) {
			setLocalError(err instanceof Error ? err.message : 'Ghost 메시지 전송에 실패했습니다.');
		}
	};

	const handleSend = () => {
		if (!session || !draft.trim()) return;
		if (session.adminMessageCount === 0) {
			setConfirmMode('first-send');
			return;
		}
		void sendDraft();
	};

	const handleClose = () => {
		if (!session) return;
		setConfirmMode('close');
	};

	const handleAssign = async () => {
		if (!session) return;
		try {
			setLocalError(null);
			await onAssign(session.id);
		} catch (err) {
			setLocalError(err instanceof Error ? err.message : 'Ghost Chat 세션 배정에 실패했습니다.');
		}
	};

	const handleConfirm = async () => {
		if (!session || !confirmMode) return;
		if (confirmMode === 'first-send') {
			setConfirmMode(null);
			await sendDraft();
			return;
		}
		try {
			setLocalError(null);
			await onClose(session.id);
			setConfirmMode(null);
		} catch (err) {
			setLocalError(err instanceof Error ? err.message : 'Ghost Chat 세션 종료에 실패했습니다.');
		}
	};

	if (loading && !session) {
		return (
			<Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<CircularProgress size={28} />
			</Box>
		);
	}

	if (!session) {
		return (
			<Box
				sx={{
					height: '100%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					color: 'text.secondary',
				}}
			>
				<Typography variant="body1">세션을 선택하세요</Typography>
			</Box>
		);
	}

	return (
		<Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
			<Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
					{onBack && (
						<IconButton size="small" onClick={onBack} aria-label="목록으로 돌아가기">
							<ArrowBackIcon fontSize="small" />
						</IconButton>
					)}
					<Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }} noWrap>
						Ghost {shortId(session.id)}
					</Typography>
					<Chip
						label={GHOST_CHAT_STATE_LABELS[session.state]}
						color={stateColors[session.state]}
						size="small"
					/>
				</Box>
				<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
					<Chip label={`chatRoomId ${shortId(session.chatRoomId)}`} size="small" variant="outlined" />
					<Chip label={`matchId ${shortId(session.matchId)}`} size="small" variant="outlined" />
				</Box>
				<Box sx={{ display: 'flex', gap: 1 }}>
					{session.state === 'PENDING' && (
						<Button
							size="small"
							variant="contained"
							disabled={actionLoading}
							onClick={handleAssign}
						>
							내가 배정받기
						</Button>
					)}
					<Button
						size="small"
						variant="outlined"
						color="error"
						startIcon={<CloseIcon />}
						disabled={!canClose}
						onClick={handleClose}
					>
						종료
					</Button>
				</Box>
			</Box>

			<Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 2, bgcolor: 'grey.50' }}>
				{localError && (
					<Alert severity="error" sx={{ mb: 2 }} onClose={() => setLocalError(null)}>
						{localError}
					</Alert>
				)}
				{messagesLoading && (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
						<CircularProgress size={22} />
					</Box>
				)}
				<List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
					{messages.map((message) => {
						const isGhost = message.senderType === 'GHOST';
						const isSystem = message.senderType === 'SYSTEM';
						const body =
							message.content?.trim() ||
							(message.mediaUrl ? `[${message.messageType}] ${message.mediaUrl}` : null) ||
							`[${message.messageType}]`;

						return (
							<ListItem
								key={message.id}
								disablePadding
								sx={{
									justifyContent: isSystem ? 'center' : isGhost ? 'flex-end' : 'flex-start',
								}}
							>
								<Paper
									elevation={0}
									sx={{
										p: 1.25,
										maxWidth: isSystem ? '92%' : '78%',
										minWidth: 160,
										border: 1,
										borderColor: isGhost ? 'primary.light' : 'divider',
										borderRadius: 2,
										bgcolor: isSystem
											? 'grey.100'
											: isGhost
												? 'rgba(25, 118, 210, 0.08)'
												: 'background.paper',
									}}
								>
									<Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
										<Typography variant="caption" sx={{ fontWeight: 700 }}>
											{senderLabels[message.senderType]}
										</Typography>
										<Typography variant="caption" color="text.secondary">
											{formatTime(message.createdAt)}
										</Typography>
									</Box>
									<Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
										{body}
									</Typography>
								</Paper>
							</ListItem>
						);
					})}
					{!messagesLoading && messages.length === 0 && (
						<ListItem disablePadding>
							<Paper
								elevation={0}
								sx={{
									p: 1.25,
									width: '100%',
									border: 1,
									borderColor: 'divider',
									borderRadius: 2,
								}}
							>
								<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
									아직 표시할 메시지가 없습니다.
								</Typography>
								<Typography variant="caption" color="text.secondary">
									세션 이벤트 {timeline.length}건
								</Typography>
							</Paper>
						</ListItem>
					)}
				</List>
			</Box>

			<Divider />
			<Box sx={{ p: 2 }}>
				{composerBlockedReason && (
					<Alert severity="info" sx={{ mb: 1.5 }}>
						{composerBlockedReason}
					</Alert>
				)}
				<TextField
					label="Ghost persona로 전송"
					value={draft}
					onChange={(event) => setDraft(event.target.value)}
					fullWidth
					multiline
					minRows={2}
					maxRows={5}
					disabled={!session || session.state !== 'ACTIVE' || actionLoading}
					placeholder={session.state === 'ACTIVE' ? 'Ghost 명의로 보낼 메시지 입력' : composerBlockedReason ?? 'ACTIVE 세션에서만 전송할 수 있습니다.'}
					onKeyDown={(event) => {
						if (event.key === 'Enter' && !event.shiftKey) {
							event.preventDefault();
							handleSend();
						}
					}}
				/>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
					<Typography variant="caption" color="text.secondary">
						유저 {session.userMessageCount}건 · Ghost {session.adminMessageCount}건 · 종료 {formatTime(session.closedAt) ?? '아님'}
					</Typography>
					<Button
						variant="contained"
						endIcon={<SendIcon />}
						disabled={!canSend}
						onClick={handleSend}
					>
						전송
					</Button>
				</Box>
			</Box>

			<GhostChatConfirmDialog
				open={confirmMode === 'first-send'}
				title="Ghost 메시지 전송 확인"
				description="이 메시지는 Ghost 프로필 명의로 유저에게 전송됩니다. 계속 전송할까요?"
				confirmLabel="전송"
				loading={actionLoading}
				onCancel={() => setConfirmMode(null)}
				onConfirm={handleConfirm}
			/>
			<GhostChatConfirmDialog
				open={confirmMode === 'close'}
				title="대화 종료"
				description="종료 후 이 세션에서는 메시지를 보낼 수 없습니다."
				confirmLabel="종료"
				confirmColor="error"
				loading={actionLoading}
				onCancel={() => setConfirmMode(null)}
				onConfirm={handleConfirm}
			/>
		</Box>
	);
}
