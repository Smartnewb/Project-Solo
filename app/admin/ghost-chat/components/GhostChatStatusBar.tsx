'use client';

import { Box, Button, Chip, Paper, Typography } from '@mui/material';
import type { GhostChatConnectionState } from '@/app/types/ghost-chat';

interface GhostChatStatusBarProps {
	pendingCount: number;
	activeCount: number;
	idleCount: number;
	closedCount: number;
	connectionState: GhostChatConnectionState;
	lastEventAt: string | null;
	onReconnect: () => void;
}

const connectionLabels: Record<GhostChatConnectionState, string> = {
	connected: '실시간 연결됨',
	connecting: '연결 중',
	reconnecting: '재연결 중',
	closed: '연결 종료',
	error: '연결 오류',
};

const connectionColors: Record<
	GhostChatConnectionState,
	'success' | 'info' | 'warning' | 'default' | 'error'
> = {
	connected: 'success',
	connecting: 'info',
	reconnecting: 'warning',
	closed: 'default',
	error: 'error',
};

function CountChip({ label, value }: { label: string; value: number }) {
	return (
		<Chip
			label={`${label} ${value}`}
			size="small"
			variant="outlined"
			sx={{ height: 28, fontWeight: 600 }}
		/>
	);
}

export default function GhostChatStatusBar({
	pendingCount,
	activeCount,
	idleCount,
	closedCount,
	connectionState,
	lastEventAt,
	onReconnect,
}: GhostChatStatusBarProps) {
	return (
		<Paper
			elevation={0}
			sx={{
				p: 1.5,
				border: 1,
				borderColor: 'divider',
				borderRadius: 2,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				gap: 2,
				flexWrap: 'wrap',
			}}
		>
			<Box sx={{ minWidth: 220 }}>
				<Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
					Ghost Chat Control Room
				</Typography>
				<Typography variant="caption" color="text.secondary">
					마지막 이벤트 {lastEventAt ? new Date(lastEventAt).toLocaleTimeString('ko-KR') : '없음'}
				</Typography>
			</Box>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
				<CountChip label="대기" value={pendingCount} />
				<CountChip label="진행" value={activeCount} />
				<CountChip label="응답 없음" value={idleCount} />
				<CountChip label="종료" value={closedCount} />
				<Chip
					label={connectionLabels[connectionState]}
					color={connectionColors[connectionState]}
					size="small"
					sx={{ height: 28, fontWeight: 700 }}
				/>
				{connectionState !== 'connected' && (
					<Button size="small" variant="outlined" onClick={onReconnect}>
						재연결
					</Button>
				)}
			</Box>
		</Paper>
	);
}
