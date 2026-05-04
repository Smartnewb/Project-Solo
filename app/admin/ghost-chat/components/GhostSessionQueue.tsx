'use client';

import { useMemo } from 'react';
import {
	Badge,
	Box,
	Button,
	ButtonGroup,
	Chip,
	Paper,
	Typography,
} from '@mui/material';
import { Inbox as InboxIcon } from '@mui/icons-material';
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
	const adminLabel =
		session.assignedAdminId ?? (session.state === 'ACTIVE' && !currentAdminId ? '담당자 확인 필요' : '미배정');

	return (
		<Paper
			elevation={selected ? 3 : 0}
			onClick={onSelect}
			sx={{
				p: 1.5,
				cursor: 'pointer',
				border: selected ? '2px solid' : '1px solid',
				borderColor: selected ? 'primary.main' : isNew ? 'warning.main' : 'divider',
				borderRadius: 2,
				bgcolor: isNew ? 'warning.50' : 'background.paper',
				transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
				'&:hover': { bgcolor: selected ? undefined : 'action.hover' },
			}}
		>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
				<Chip
					label={GHOST_CHAT_STATE_LABELS[session.state]}
					color={stateColors[session.state]}
					size="small"
					sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700 }}
				/>
				<Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 700 }} noWrap>
					Ghost {shortId(session.id)}
				</Typography>
				{unreadCount > 0 && <Badge badgeContent={unreadCount} color="error" sx={{ mr: 0.5 }} />}
				{isNew && <Chip label="NEW" color="warning" size="small" sx={{ height: 20 }} />}
			</Box>

			<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.75, mb: 1 }}>
				<Typography variant="caption" color="text.secondary">
					대상 {shortId(session.targetUserId)}
				</Typography>
				<Typography variant="caption" color="text.secondary">
					채팅방 {shortId(session.chatRoomId)}
				</Typography>
				<Typography variant="caption" color="text.secondary">
					매치 {shortId(session.matchId)}
				</Typography>
				<Typography variant="caption" color="text.secondary">
					생성 {elapsedLabel(session.createdAt)}
				</Typography>
			</Box>

			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
				<Chip label={`유저 ${session.userMessageCount}`} size="small" variant="outlined" />
				<Chip label={`Ghost ${session.adminMessageCount}`} size="small" variant="outlined" />
				<Typography variant="caption" color="text.secondary" noWrap sx={{ flex: 1 }}>
					담당 {adminLabel}
				</Typography>
			</Box>

			<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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
			<Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
				<ButtonGroup size="small" fullWidth>
					<Button
						variant={activeTab === 'queue' ? 'contained' : 'outlined'}
						onClick={() => onTabChange('queue')}
					>
						대기
					</Button>
					<Button
						variant={activeTab === 'mine' ? 'contained' : 'outlined'}
						onClick={() => onTabChange('mine')}
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
