'use client';

import { Box, Card, CardContent, Typography } from '@mui/material';
import type { ChatEngagement as ChatEngagementType } from '../types';

export default function ChatEngagementSection({ data }: { data: ChatEngagementType }) {
	return (
		<Card>
			<CardContent>
				<Typography variant="subtitle1" fontWeight={700} gutterBottom>
					채팅 품질
				</Typography>
				<Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
					<Metric label="총 채팅방" value={data.totalRooms} />
					<Metric label="메시지 있는 방" value={data.roomsWithMessages} sub={`${data.messageRate}%`} />
					<Metric label="양방향 대화" value={data.mutualChatRooms} sub={`${data.mutualChatRate}%`} />
					<Metric
						label="방당 평균 메시지"
						value={data.avgMessagesPerRoom != null ? data.avgMessagesPerRoom.toFixed(1) : '-'}
					/>
					<Metric
						label="첫 메시지까지"
						value={data.avgMinutesToFirstMessage != null ? `${data.avgMinutesToFirstMessage.toFixed(0)}분` : '-'}
					/>
					<Metric label="총 메시지" value={data.totalMessages} />
				</Box>
			</CardContent>
		</Card>
	);
}

function Metric({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
	return (
		<Box sx={{ textAlign: 'center', minWidth: 100 }}>
			<Typography variant="caption" color="text.secondary">
				{label}
			</Typography>
			<Typography variant="h5" fontWeight={700}>
				{typeof value === 'number' ? value.toLocaleString() : value}
			</Typography>
			{sub && (
				<Typography variant="caption" color="text.secondary">
					{sub}
				</Typography>
			)}
		</Box>
	);
}
