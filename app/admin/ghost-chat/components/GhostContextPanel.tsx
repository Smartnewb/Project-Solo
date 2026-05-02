'use client';

import { Box, Chip, Divider, Paper, Typography } from '@mui/material';
import type { GhostChatSession } from '@/app/types/ghost-chat';

interface GhostContextPanelProps {
	session: GhostChatSession | null;
}

function FieldRow({ label, value }: { label: string; value: string | number | null }) {
	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
			<Typography variant="caption" color="text.secondary">
				{label}
			</Typography>
			<Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
				{value ?? '없음'}
			</Typography>
		</Box>
	);
}

function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
			<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
				{title}
			</Typography>
			{children}
		</Box>
	);
}

export default function GhostContextPanel({ session }: GhostContextPanelProps) {
	if (!session) {
		return (
			<Box
				sx={{
					height: '100%',
					borderLeft: { md: 1 },
					borderColor: 'divider',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					color: 'text.secondary',
					p: 2,
					textAlign: 'center',
				}}
			>
				<Typography variant="body2">세션을 선택하면 운영 컨텍스트가 표시됩니다.</Typography>
			</Box>
		);
	}

	return (
		<Box
			sx={{
				height: '100%',
				borderLeft: { md: 1 },
				borderColor: 'divider',
				overflowY: 'auto',
				p: 2,
				display: 'flex',
				flexDirection: 'column',
				gap: 2,
			}}
		>
			<Typography variant="h6" sx={{ fontWeight: 700 }}>
				컨텍스트
			</Typography>

			<Paper elevation={0} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
				<Section title="Ghost 프로필">
					<FieldRow label="ghostAccountId" value={session.ghostAccountId} />
					<FieldRow label="ghostUserId" value={session.ghostUserId} />
					<Typography variant="body2" color="text.secondary">
						프로필 컨텍스트 API 연결 필요
					</Typography>
				</Section>
			</Paper>

			<Paper elevation={0} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
				<Section title="Target 유저">
					<FieldRow label="targetUserId" value={session.targetUserId} />
					<FieldRow label="matchId" value={session.matchId} />
					<FieldRow label="chatRoomId" value={session.chatRoomId} />
				</Section>
			</Paper>

			<Paper elevation={0} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
				<Section title="운영 안전장치">
					<FieldRow label="assignedAdminId" value={session.assignedAdminId} />
					<FieldRow label="assignedAt" value={session.assignedAt} />
					<FieldRow label="userMessageCount" value={session.userMessageCount} />
					<FieldRow label="adminMessageCount" value={session.adminMessageCount} />
					<FieldRow label="closedReason" value={session.closedReason} />
				</Section>
			</Paper>

			<Paper elevation={0} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
				<Section title="API 보완 필요">
					<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
						<Chip label="GET /sessions/:id/messages" size="small" variant="outlined" />
						<Chip label="GET /sessions/:id/context" size="small" variant="outlined" />
						<Chip label="new_message SSE" size="small" variant="outlined" />
					</Box>
				</Section>
			</Paper>

			<Divider />
			<Typography variant="caption" color="text.secondary">
				현재 API에 없는 이름, 나이, 학교 등 프로필 사실은 표시하지 않습니다.
			</Typography>
		</Box>
	);
}
