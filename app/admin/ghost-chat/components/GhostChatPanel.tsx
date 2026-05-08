'use client';

import { useMemo, useState } from 'react';
import {
	Alert,
	Avatar,
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
	Tooltip,
	Typography,
} from '@mui/material';
import {
	AutoAwesome as AutoAwesomeIcon,
	ArrowBack as ArrowBackIcon,
	Close as CloseIcon,
	OpenInFull as OpenInFullIcon,
	ScheduleSend as ScheduleSendIcon,
	Send as SendIcon,
} from '@mui/icons-material';
import type { GhostChatSession, GhostChatSessionContext, GhostChatTimelineMessage } from '@/app/types/ghost-chat';
import { GHOST_CHAT_STATE_LABELS } from '@/app/types/ghost-chat';
import GhostChatConfirmDialog from './GhostChatConfirmDialog';

interface GhostChatPanelProps {
	session: GhostChatSession | null;
	context?: GhostChatSessionContext | null;
	messages: GhostChatTimelineMessage[];
	loading: boolean;
	messagesLoading: boolean;
	actionLoading: boolean;
	onAssign: (id: string) => Promise<void> | void;
	onSendMessage: (id: string, content: string) => Promise<void>;
	onClose: (id: string) => Promise<void> | void;
	onBack?: () => void;
	onOpenFullScreen?: () => void;
	fullScreenMode?: boolean;
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

function compactProfileLabel(profile: GhostChatSessionContext['ghost'] | NonNullable<GhostChatSessionContext['target']> | null | undefined) {
	if (!profile) return '프로필 로딩 중';
	return [profile.age ? `${profile.age}세` : null, profile.university?.name, profile.department?.name, profile.mbti]
		.filter(Boolean)
		.join(' · ');
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
	context,
	messages,
	loading,
	messagesLoading,
	actionLoading,
	onAssign,
	onSendMessage,
	onClose,
	onBack,
	onOpenFullScreen,
	fullScreenMode = false,
}: GhostChatPanelProps) {
	const [draft, setDraft] = useState('');
	const [localError, setLocalError] = useState<string | null>(null);
	const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);

	const timeline = useMemo(() => (session ? buildTimeline(session) : []), [session]);
	const recentMessages = useMemo(() => messages.slice(-6).reverse(), [messages]);
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
						현재 열린 채팅
					</Typography>
					<Chip
						label={GHOST_CHAT_STATE_LABELS[session.state]}
						color={stateColors[session.state]}
						size="small"
					/>
					{onOpenFullScreen && (
						<Tooltip title="전체 화면에서 대응">
							<IconButton size="small" onClick={onOpenFullScreen} aria-label="전체 화면에서 대응">
								<OpenInFullIcon fontSize="small" />
							</IconButton>
						</Tooltip>
					)}
				</Box>
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
						gap: 1,
						mb: 1.5,
					}}
				>
					<Paper elevation={0} sx={{ p: 1.25, border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<Avatar
								src={context?.ghost.primaryPhotoUrl ?? undefined}
								alt={context?.ghost.anonymousName ?? 'Ghost'}
								sx={{ width: 40, height: 40 }}
							>
								{context?.ghost.anonymousName?.charAt(0) ?? 'G'}
							</Avatar>
							<Box sx={{ minWidth: 0 }}>
								<Typography variant="caption" color="text.secondary">
									Ghost 프로필
								</Typography>
								<Typography variant="subtitle2" sx={{ fontWeight: 800 }} noWrap>
									{context?.ghost.anonymousName ?? `Ghost ${shortId(session.ghostAccountId)}`}
								</Typography>
								<Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
									{compactProfileLabel(context?.ghost)}
								</Typography>
							</Box>
						</Box>
					</Paper>
					<Paper elevation={0} sx={{ p: 1.25, border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<Avatar sx={{ width: 40, height: 40 }}>
								{context?.target?.gender?.charAt(0) ?? 'U'}
							</Avatar>
							<Box sx={{ minWidth: 0 }}>
								<Typography variant="caption" color="text.secondary">
									상대 유저
								</Typography>
								<Typography variant="subtitle2" sx={{ fontWeight: 800 }} noWrap>
									{shortId(session.targetUserId)}
								</Typography>
								<Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
									{compactProfileLabel(context?.target)}
								</Typography>
							</Box>
						</Box>
					</Paper>
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

			<Box
				sx={{
					flex: 1,
					minHeight: 0,
					display: 'grid',
					gridTemplateColumns: fullScreenMode ? { xs: '1fr', lg: '1fr 320px' } : '1fr',
					overflow: 'hidden',
					bgcolor: 'grey.50',
				}}
			>
				<Box sx={{ minHeight: 0, overflowY: 'auto', p: 2 }}>
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
				{fullScreenMode && (
					<Box
						sx={{
							display: { xs: 'none', lg: 'flex' },
							flexDirection: 'column',
							gap: 1.25,
							p: 2,
							borderLeft: 1,
							borderColor: 'divider',
							bgcolor: 'background.paper',
							overflowY: 'auto',
						}}
					>
						<Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
							최근 채팅 내역
						</Typography>
						{recentMessages.length === 0 ? (
							<Typography variant="body2" color="text.secondary">
								최근 메시지가 없습니다.
							</Typography>
						) : (
							recentMessages.map((message) => (
								<Paper
									key={message.id}
									elevation={0}
									sx={{ p: 1, border: 1, borderColor: 'divider', borderRadius: 1.5 }}
								>
									<Typography variant="caption" sx={{ fontWeight: 800 }}>
										{senderLabels[message.senderType]} · {formatTime(message.createdAt)}
									</Typography>
									<Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
										{message.content?.trim() || `[${message.messageType}]`}
									</Typography>
								</Paper>
							))
						)}
						<Divider />
						<Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
							AI 응답 지원
						</Typography>
						<Typography variant="caption" color="text.secondary">
							RAG Fusion, Qdrant 검색, Gemini 2.5 Flash 초안 생성은 백엔드 API가 연결되면 이 영역에서 검수 후 전송/예약 전송으로 확장합니다.
						</Typography>
						<Box sx={{ display: 'flex', gap: 1 }}>
							<Button size="small" variant="outlined" disabled startIcon={<AutoAwesomeIcon fontSize="small" />}>
								초안 생성
							</Button>
							<Button size="small" variant="outlined" disabled startIcon={<ScheduleSendIcon fontSize="small" />}>
								예약 전송
							</Button>
						</Box>
					</Box>
				)}
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
