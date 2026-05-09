'use client';

import { type ReactNode, useMemo } from 'react';
import {
	Avatar,
	Badge,
	Box,
	Button,
	Chip,
	Paper,
	Stack,
	Typography,
} from '@mui/material';
import {
	Forum as ForumIcon,
	Inbox as InboxIcon,
	NotificationsActive as NotificationsActiveIcon,
	PeopleAlt as PeopleAltIcon,
	Schedule as ScheduleIcon,
} from '@mui/icons-material';
import type { GhostChatSession, GhostChatTimelineMessage } from '@/app/types/ghost-chat';
import { GHOST_CHAT_STATE_LABELS } from '@/app/types/ghost-chat';

interface TargetProfilePreview {
	name: string;
	subtitle: string;
	photoUrl?: string | null;
	tags?: string[];
}

interface GhostSessionQueueProps {
	sessions: GhostChatSession[];
	selectedSessionId: string | null;
	newSessionIds: Set<string>;
	unreadMap: Record<string, number>;
	variant?: 'rail' | 'grid';
	getPreviewMessages?: (sessionId: string) => GhostChatTimelineMessage[];
	getTargetProfilePreview?: (sessionId: string) => TargetProfilePreview | null;
	onSelectSession: (id: string) => void;
}

const stateColors: Record<GhostChatSession['state'], 'warning' | 'success' | 'info' | 'default'> = {
	PENDING: 'warning',
	ACTIVE: 'success',
	IDLE: 'info',
	CLOSED: 'default',
};

const stateAccentColors: Record<GhostChatSession['state'], string> = {
	PENDING: 'warning.main',
	ACTIVE: 'success.main',
	IDLE: 'info.main',
	CLOSED: 'grey.400',
};

function shortId(id: string) {
	return id.length > 10 ? `${id.slice(0, 6)}...${id.slice(-4)}` : id;
}

function elapsedLabel(dateString: string | null) {
	if (!dateString) return '기록 없음';
	const diffMs = Date.now() - new Date(dateString).getTime();
	const minutes = Math.max(0, Math.floor(diffMs / 60000));
	if (minutes < 1) return '방금';
	if (minutes < 60) return `${minutes}분 전`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}시간 전`;
	return `${Math.floor(hours / 24)}일 전`;
}

function compactDateTime(dateString: string | null) {
	if (!dateString) return '기록 없음';
	return new Intl.DateTimeFormat('ko-KR', {
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(dateString));
}

function sortForQueue(a: GhostChatSession, b: GhostChatSession) {
	if (a.state === 'PENDING' && b.state === 'PENDING') {
		return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
	}
	if (a.state === 'ACTIVE' && b.state === 'ACTIVE') {
		const aTime = new Date(a.lastUserMessageAt ?? a.updatedAt).getTime();
		const bTime = new Date(b.lastUserMessageAt ?? b.updatedAt).getTime();
		return bTime - aTime;
	}
	return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

function senderLabel(senderType: GhostChatTimelineMessage['senderType']) {
	if (senderType === 'GHOST') return 'Ghost';
	if (senderType === 'TARGET_USER') return '상대';
	return '시스템';
}

function needsAdminReply(session: GhostChatSession, unreadCount: number) {
	if (unreadCount > 0) return true;
	if (!session.lastUserMessageAt) return false;
	if (!session.lastAdminMessageAt) return session.state !== 'CLOSED';
	return new Date(session.lastUserMessageAt).getTime() > new Date(session.lastAdminMessageAt).getTime();
}

function StatPill({
	label,
	value,
	icon,
	color,
}: {
	label: string;
	value: number;
	icon: ReactNode;
	color: string;
}) {
	return (
		<Box
			sx={{
				display: 'flex',
				alignItems: 'center',
				gap: 0.75,
				minWidth: 0,
				px: 1,
				py: 0.75,
				border: 1,
				borderColor: 'divider',
				borderRadius: 1.5,
				bgcolor: 'background.paper',
			}}
		>
			<Box sx={{ color, display: 'flex', flexShrink: 0 }}>{icon}</Box>
			<Box sx={{ minWidth: 0 }}>
				<Typography variant="caption" color="text.secondary" noWrap>
					{label}
				</Typography>
				<Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
					{value}
				</Typography>
			</Box>
		</Box>
	);
}

function MessagePreviewBubble({ message }: { message: GhostChatTimelineMessage }) {
	const isGhost = message.senderType === 'GHOST';
	const isSystem = message.senderType === 'SYSTEM';
	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: isGhost ? 'flex-end' : 'flex-start',
				px: 0.25,
			}}
		>
			<Box
				sx={{
					maxWidth: '86%',
					px: 1,
					py: 0.75,
					borderRadius: isGhost ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
					border: 1,
					borderColor: isGhost ? 'primary.light' : 'divider',
					bgcolor: isSystem ? 'grey.100' : isGhost ? 'rgba(25, 118, 210, 0.08)' : 'background.paper',
					boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
				}}
			>
				<Typography
					variant="caption"
					color={isGhost ? 'primary.main' : 'text.secondary'}
					sx={{ display: 'block', fontWeight: 800, lineHeight: 1.1, mb: 0.25 }}
				>
					{senderLabel(message.senderType)}
				</Typography>
				<Typography
					variant="caption"
					color="text.primary"
					sx={{
						display: '-webkit-box',
						WebkitLineClamp: 2,
						WebkitBoxOrient: 'vertical',
						overflow: 'hidden',
						lineHeight: 1.35,
						wordBreak: 'break-word',
					}}
				>
					{message.content ?? (message.messageType === 'image' ? '이미지 메시지' : '메시지 본문 없음')}
				</Typography>
			</Box>
		</Box>
	);
}

function GhostSessionCard({
	session,
	selected,
	isNew,
	unreadCount,
	previewMessages,
	targetProfile,
	onSelect,
}: {
	session: GhostChatSession;
	selected: boolean;
	isNew: boolean;
	unreadCount: number;
	previewMessages: GhostChatTimelineMessage[];
	targetProfile: TargetProfilePreview | null;
	onSelect: () => void;
}) {
	const isClosed = session.state === 'CLOSED';
	const replyNeeded = needsAdminReply(session, unreadCount);
	const lastUserLabel = session.lastUserMessageAt
		? elapsedLabel(session.lastUserMessageAt)
		: '대기 중';
	const lastGhostLabel = session.lastAdminMessageAt
		? elapsedLabel(session.lastAdminMessageAt)
		: '아직 없음';
	const responseChip = replyNeeded
		? { label: '응답 필요', color: 'error' as const }
		: { label: session.state === 'CLOSED' ? '종료됨' : '흐름 안정', color: 'default' as const };
	const displayName = targetProfile?.name ?? '상대 프로필';
	const subtitle = targetProfile?.subtitle ?? `상대 ${shortId(session.targetUserId)}`;

	return (
		<Paper
			elevation={selected ? 3 : 0}
			onClick={onSelect}
			sx={{
				position: 'relative',
				p: 1.5,
				minHeight: 440,
				display: 'flex',
				flexDirection: 'column',
				cursor: 'pointer',
				border: selected ? '2px solid' : '1px solid',
				borderColor: selected ? 'primary.main' : isNew ? 'warning.main' : 'divider',
				borderTop: '4px solid',
				borderTopColor: replyNeeded ? 'error.main' : stateAccentColors[session.state],
				borderRadius: 1,
				bgcolor: selected ? 'action.selected' : isNew ? 'warning.50' : 'background.paper',
				transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease',
				'&:hover': { bgcolor: selected ? undefined : 'action.hover' },
			}}
		>
			<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, mb: 1 }}>
				<Avatar
					src={targetProfile?.photoUrl ?? undefined}
					alt={displayName}
					sx={{ width: 44, height: 44, flexShrink: 0, fontWeight: 800 }}
				>
					{displayName.charAt(0)}
				</Avatar>
				<Box sx={{ flex: 1, minWidth: 0 }}>
					<Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, minWidth: 0 }}>
						<Typography variant="subtitle2" sx={{ fontWeight: 900, minWidth: 0 }} noWrap>
							{displayName}
						</Typography>
						<Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
							{lastUserLabel}
						</Typography>
					</Box>
					<Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mb: 0.75 }}>
						{subtitle}
					</Typography>
					<Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
						{(targetProfile?.tags ?? []).slice(0, 2).map((tag) => (
							<Chip key={tag} label={tag} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
						))}
						<Chip
							label={responseChip.label}
							color={responseChip.color}
							size="small"
							variant={replyNeeded ? 'filled' : 'outlined'}
							sx={{ height: 22, fontSize: '0.7rem', fontWeight: 800 }}
						/>
						{isNew && <Chip label="NEW" color="warning" size="small" sx={{ height: 22, fontWeight: 800 }} />}
					</Stack>
				</Box>
				{unreadCount > 0 && <Badge badgeContent={unreadCount} color="error" sx={{ mt: 0.5, mr: 0.5 }} />}
			</Box>

			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: '1fr 1fr',
					gap: 0.75,
					mb: 1,
					px: 1,
					py: 0.75,
					borderRadius: 1,
					bgcolor: 'action.hover',
				}}
			>
				<Box sx={{ minWidth: 0 }}>
					<Typography variant="caption" color="text.secondary" noWrap>
						상태
					</Typography>
					<Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
						{GHOST_CHAT_STATE_LABELS[session.state]}
					</Typography>
				</Box>
				<Box sx={{ minWidth: 0 }}>
					<Typography variant="caption" color="text.secondary" noWrap>
						최근 Ghost
					</Typography>
					<Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
						{lastGhostLabel}
					</Typography>
				</Box>
			</Box>

			<Box
				sx={{
					flex: 1,
					minHeight: 228,
					display: 'flex',
					flexDirection: 'column',
					gap: 0.6,
					mb: 1.25,
					p: 0.75,
					borderRadius: 1,
					bgcolor: 'grey.50',
					border: 1,
					borderColor: 'divider',
				}}
			>
				<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, px: 0.25 }}>
					최근 채팅 6개
				</Typography>
				{previewMessages.length > 0 ? (
					previewMessages.slice(-6).map((message) => (
						<MessagePreviewBubble key={message.id} message={message} />
					))
				) : (
					<Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1 }}>
						<Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
							목록 API에 메시지 본문이 없어 선택 시 대화 내용을 확인할 수 있습니다.
						</Typography>
					</Box>
				)}
			</Box>

			<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.75, mb: 1 }}>
				<Typography variant="caption" color="text.secondary" noWrap>
					상대 {shortId(session.targetUserId)}
				</Typography>
				<Typography variant="caption" color="text.secondary" noWrap>
					매치 {shortId(session.matchId)}
				</Typography>
				<Typography variant="caption" color="text.secondary" noWrap>
					생성 {compactDateTime(session.createdAt)}
				</Typography>
			</Box>

			<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
				<Chip label={`유저 ${session.userMessageCount}`} size="small" variant="outlined" />
				<Chip label={`Ghost ${session.adminMessageCount}`} size="small" variant="outlined" />
				<Box sx={{ flex: 1 }} />
				<Button
					size="small"
					variant={selected ? 'contained' : 'outlined'}
					disabled={isClosed}
					onClick={(event) => {
						event.stopPropagation();
						onSelect();
					}}
				>
					열기
				</Button>
			</Box>
		</Paper>
	);
}

export default function GhostSessionQueue({
	sessions,
	selectedSessionId,
	newSessionIds,
	unreadMap,
	variant = 'rail',
	getPreviewMessages,
	getTargetProfilePreview,
	onSelectSession,
}: GhostSessionQueueProps) {
	const queueStats = useMemo(() => {
		const active = sessions.filter((session) => session.state !== 'CLOSED').length;
		const needsReply = sessions.filter((session) => needsAdminReply(session, unreadMap[session.id] ?? 0)).length;
		const recentlyUpdated = sessions.filter((session) => {
			const updatedAt = new Date(session.updatedAt).getTime();
			return Number.isFinite(updatedAt) && Date.now() - updatedAt < 1000 * 60 * 60 * 24;
		}).length;
		return { total: sessions.length, active, needsReply, recentlyUpdated };
	}, [sessions, unreadMap]);

	const filteredSessions = useMemo(() => {
		return sessions.filter((session) => session.state !== 'CLOSED').sort(sortForQueue);
	}, [sessions]);

	return (
		<Box
			sx={{
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				borderRight: { md: variant === 'rail' ? 1 : 0 },
				borderBottom: { md: variant === 'grid' ? 1 : 0 },
				borderColor: 'divider',
			}}
		>
			<Box
				sx={{
					p: 1.5,
					borderBottom: 1,
					borderColor: 'divider',
					bgcolor: 'grey.50',
				}}
			>
				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.25 }}>
					<Box sx={{ minWidth: 0 }}>
						<Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }} noWrap>
							고스트 챗 관리
						</Typography>
						<Typography variant="caption" color="text.secondary" noWrap>
							채팅방 단위로 한눈에 보고 바로 대응합니다.
						</Typography>
					</Box>
					<Chip label={`전체 ${queueStats.total}건`} size="small" variant="outlined" sx={{ fontWeight: 800 }} />
				</Box>
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns:
							variant === 'grid'
								? { xs: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }
								: 'repeat(3, minmax(0, 1fr))',
						gap: 0.75,
						mb: 1.25,
					}}
				>
					<StatPill
						label="응답 필요"
						value={queueStats.needsReply}
						icon={<NotificationsActiveIcon fontSize="small" />}
						color="error.main"
					/>
					<StatPill
						label="열린 채팅"
						value={queueStats.active}
						icon={<ForumIcon fontSize="small" />}
						color="primary.main"
					/>
					<StatPill
						label="24h 활동"
						value={queueStats.recentlyUpdated}
						icon={<ScheduleIcon fontSize="small" />}
						color="success.main"
					/>
				</Box>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'text.secondary' }}>
					<PeopleAltIcon fontSize="small" />
					<Typography variant="caption" noWrap>
						Ghost/상대/최근 메시지 상태를 카드 테이블에서 바로 스캔합니다.
					</Typography>
				</Box>
			</Box>

			<Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 1.5 }}>
				{filteredSessions.length === 0 ? (
					<Box
						sx={{
							height: '100%',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							color: 'text.secondary',
							textAlign: 'center',
							gap: 1,
						}}
					>
						<InboxIcon sx={{ fontSize: 42, opacity: 0.45 }} />
						<Typography variant="body2">표시할 Ghost Chat 채팅방이 없습니다.</Typography>
					</Box>
				) : (
					<Box
						sx={{
							display: 'grid',
							gridTemplateColumns:
								variant === 'grid'
									? {
										xs: '1fr',
										sm: 'repeat(auto-fit, minmax(308px, 1fr))',
										xl: 'repeat(auto-fit, minmax(292px, 1fr))',
									}
									: '1fr',
							maxWidth: variant === 'grid' ? 'calc(6 * 292px + 5 * 10px)' : undefined,
							width: '100%',
							gap: 1.25,
						}}
					>
						{filteredSessions.map((session) => (
							<GhostSessionCard
								key={session.id}
								session={session}
								selected={selectedSessionId === session.id}
								isNew={newSessionIds.has(session.id)}
								unreadCount={unreadMap[session.id] ?? 0}
								previewMessages={getPreviewMessages?.(session.id) ?? []}
								targetProfile={getTargetProfilePreview?.(session.id) ?? null}
								onSelect={() => onSelectSession(session.id)}
							/>
						))}
					</Box>
				)}
			</Box>
		</Box>
	);
}
