'use client';

import { type ReactNode, useMemo } from 'react';
import {
	Badge,
	Box,
	Button,
	ButtonGroup,
	Chip,
	Paper,
	Stack,
	Typography,
} from '@mui/material';
import {
	AccessTime as AccessTimeIcon,
	AssignmentInd as AssignmentIndIcon,
	Forum as ForumIcon,
	Inbox as InboxIcon,
	NotificationsActive as NotificationsActiveIcon,
} from '@mui/icons-material';
import type { GhostChatSession } from '@/app/types/ghost-chat';
import { GHOST_CHAT_STATE_LABELS } from '@/app/types/ghost-chat';

type GhostQueueTab = 'queue' | 'mine';

interface GhostSessionQueueProps {
	sessions: GhostChatSession[];
	selectedSessionId: string | null;
	newSessionIds: Set<string>;
	unreadMap: Record<string, number>;
	activeTab: GhostQueueTab;
	onTabChange: (tab: GhostQueueTab) => void;
	onSelectSession: (id: string) => void;
	onAssignSession: (id: string) => void | Promise<void>;
	currentAdminId?: string | null;
	assigningSessionId?: string | null;
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

function needsAdminReply(session: GhostChatSession, unreadCount: number) {
	if (session.state === 'PENDING') return true;
	if (unreadCount > 0) return true;
	if (!session.lastUserMessageAt) return false;
	if (!session.lastAdminMessageAt) return session.state === 'ACTIVE';
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

function GhostSessionCard({
	session,
	selected,
	isNew,
	unreadCount,
	onSelect,
	onAssign,
	assigning,
	currentAdminId,
}: {
	session: GhostChatSession;
	selected: boolean;
	isNew: boolean;
	unreadCount: number;
	onSelect: () => void;
	onAssign: () => void;
	assigning: boolean;
	currentAdminId?: string | null;
}) {
	const canAssign = session.state === 'PENDING';
	const isClosed = session.state === 'CLOSED';
	const isMine = Boolean(currentAdminId && session.assignedAdminId === currentAdminId);
	const replyNeeded = needsAdminReply(session, unreadCount);
	const lastUserLabel = session.lastUserMessageAt
		? `유저 ${elapsedLabel(session.lastUserMessageAt)}`
		: '유저 메시지 없음';
	const responseChip = replyNeeded
		? { label: session.state === 'PENDING' ? '배정 필요' : '응답 필요', color: 'error' as const }
		: { label: session.state === 'ACTIVE' ? '운영 중' : '확인 완료', color: 'default' as const };
	const adminLabel =
		(isMine && '내 담당') ||
		session.assignedAdminId ||
		(session.state === 'ACTIVE' && !currentAdminId ? '담당자 확인 필요' : '미배정');

	return (
		<Paper
			elevation={selected ? 3 : 0}
			onClick={onSelect}
			sx={{
				position: 'relative',
				p: 1.5,
				cursor: 'pointer',
				border: selected ? '2px solid' : '1px solid',
				borderColor: selected ? 'primary.main' : isNew ? 'warning.main' : 'divider',
				borderLeft: '5px solid',
				borderLeftColor: stateAccentColors[session.state],
				borderRadius: 1.5,
				bgcolor: selected ? 'action.selected' : isNew ? 'warning.50' : 'background.paper',
				transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease',
				'&:hover': { bgcolor: selected ? undefined : 'action.hover' },
			}}
		>
			<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
				<Box sx={{ flex: 1, minWidth: 0 }}>
					<Stack direction="row" spacing={0.75} sx={{ mb: 0.75, flexWrap: 'wrap', rowGap: 0.5 }}>
						<Chip
							label={GHOST_CHAT_STATE_LABELS[session.state]}
							color={stateColors[session.state]}
							size="small"
							sx={{ height: 22, fontSize: '0.7rem', fontWeight: 800 }}
						/>
						<Chip
							label={responseChip.label}
							color={responseChip.color}
							size="small"
							variant={replyNeeded ? 'filled' : 'outlined'}
							sx={{ height: 22, fontSize: '0.7rem', fontWeight: 800 }}
						/>
						{isNew && <Chip label="NEW" color="warning" size="small" sx={{ height: 22, fontWeight: 800 }} />}
					</Stack>
					<Typography variant="subtitle2" sx={{ fontWeight: 800 }} noWrap>
						Ghost {shortId(session.id)}
					</Typography>
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
						마지막 유저
					</Typography>
					<Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
						{lastUserLabel}
					</Typography>
				</Box>
				<Box sx={{ minWidth: 0 }}>
					<Typography variant="caption" color="text.secondary" noWrap>
						생성
					</Typography>
					<Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
						{compactDateTime(session.createdAt)}
					</Typography>
				</Box>
			</Box>

			<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.75, mb: 1 }}>
				<Typography variant="caption" color="text.secondary" noWrap>
					대상 {shortId(session.targetUserId)}
				</Typography>
				<Typography variant="caption" color="text.secondary" noWrap>
					채팅방 {shortId(session.chatRoomId)}
				</Typography>
				<Typography variant="caption" color="text.secondary" noWrap>
					매치 {shortId(session.matchId)}
				</Typography>
				<Typography variant="caption" color="text.secondary" noWrap>
					담당 {adminLabel}
				</Typography>
			</Box>

			<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
				<Chip label={`유저 ${session.userMessageCount}`} size="small" variant="outlined" />
				<Chip label={`Ghost ${session.adminMessageCount}`} size="small" variant="outlined" />
				<Box sx={{ flex: 1 }} />
				<Button
					size="small"
					variant={canAssign ? 'contained' : 'outlined'}
					disabled={isClosed || assigning}
					onClick={(event) => {
						event.stopPropagation();
						if (canAssign) {
							void onAssign();
							return;
						}
						onSelect();
					}}
				>
					{canAssign ? '배정받기' : '열기'}
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
	activeTab,
	onTabChange,
	onSelectSession,
	onAssignSession,
	currentAdminId,
	assigningSessionId,
}: GhostSessionQueueProps) {
	const queueStats = useMemo(() => {
		const pending = sessions.filter((session) => session.state === 'PENDING').length;
		const mine = sessions.filter(
			(session) =>
				currentAdminId &&
				session.state === 'ACTIVE' &&
				session.assignedAdminId === currentAdminId,
		).length;
		const needsReply = sessions.filter((session) => needsAdminReply(session, unreadMap[session.id] ?? 0)).length;
		return { total: sessions.length, pending, mine, needsReply };
	}, [currentAdminId, sessions, unreadMap]);

	const filteredSessions = useMemo(() => {
		const filtered = sessions.filter((session) => {
			if (activeTab === 'mine') {
				if (!currentAdminId) return false;
				return session.state === 'ACTIVE' && session.assignedAdminId === currentAdminId;
			}
			return true;
		});
		return filtered.sort(sortForQueue);
	}, [activeTab, currentAdminId, sessions]);

	return (
		<Box
			sx={{
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				borderRight: { md: 1 },
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
						<Typography variant="subtitle2" sx={{ fontWeight: 900 }} noWrap>
							운영 세션 큐
						</Typography>
						<Typography variant="caption" color="text.secondary" noWrap>
							응답 필요 세션을 우선 확인하세요.
						</Typography>
					</Box>
					<Chip label={`${queueStats.total}건`} size="small" variant="outlined" sx={{ fontWeight: 800 }} />
				</Box>
				<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 0.75, mb: 1.25 }}>
					<StatPill
						label="응답 필요"
						value={queueStats.needsReply}
						icon={<NotificationsActiveIcon fontSize="small" />}
						color="error.main"
					/>
					<StatPill
						label="미배정"
						value={queueStats.pending}
						icon={<AccessTimeIcon fontSize="small" />}
						color="warning.main"
					/>
					<StatPill
						label="내 담당"
						value={queueStats.mine}
						icon={<AssignmentIndIcon fontSize="small" />}
						color="success.main"
					/>
				</Box>
				<ButtonGroup size="small" fullWidth>
					<Button
						variant={activeTab === 'queue' ? 'contained' : 'outlined'}
						onClick={() => onTabChange('queue')}
						startIcon={<ForumIcon fontSize="small" />}
					>
						대기
					</Button>
					<Button
						variant={activeTab === 'mine' ? 'contained' : 'outlined'}
						onClick={() => onTabChange('mine')}
						startIcon={<AssignmentIndIcon fontSize="small" />}
					>
						내 담당
					</Button>
				</ButtonGroup>
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
						<Typography variant="body2">
							{activeTab === 'mine' && !currentAdminId
								? '관리자 세션 정보를 불러오는 중입니다.'
								: '표시할 Ghost Chat 세션이 없습니다.'}
						</Typography>
					</Box>
				) : (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
						{filteredSessions.map((session) => (
							<GhostSessionCard
								key={session.id}
								session={session}
								selected={selectedSessionId === session.id}
								isNew={newSessionIds.has(session.id)}
								unreadCount={unreadMap[session.id] ?? 0}
								onSelect={() => onSelectSession(session.id)}
								onAssign={() => onAssignSession(session.id)}
								assigning={assigningSessionId === session.id}
								currentAdminId={currentAdminId}
							/>
						))}
					</Box>
				)}
			</Box>
		</Box>
	);
}
