'use client';

import { Box, Card, CardContent, Typography } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import FavoriteIcon from '@mui/icons-material/Favorite';
import HandshakeIcon from '@mui/icons-material/Handshake';
import ChatIcon from '@mui/icons-material/Chat';
import type { PoolOverview, MatchRate, PostMatchFunnel } from '../types';

interface KpiCardProps {
	icon: React.ReactNode;
	label: string;
	value: string | number;
	sub?: string;
	bgColor: string;
}

function KpiCard({ icon, label, value, sub, bgColor }: KpiCardProps) {
	return (
		<Card sx={{ flex: 1, minWidth: 200 }}>
			<CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
				<Box
					sx={{
						p: 1.5,
						borderRadius: 2,
						backgroundColor: bgColor,
						display: 'flex',
						alignItems: 'center',
					}}
				>
					{icon}
				</Box>
				<Box>
					<Typography variant="body2" color="text.secondary">
						{label}
					</Typography>
					<Typography variant="h5" fontWeight={700}>
						{value}
					</Typography>
					{sub && (
						<Typography variant="caption" color="text.secondary">
							{sub}
						</Typography>
					)}
				</Box>
			</CardContent>
		</Card>
	);
}

interface Props {
	pool: PoolOverview;
	matchRate: MatchRate;
	funnel: PostMatchFunnel;
}

export default function KpiCards({ pool, matchRate, funnel }: Props) {
	return (
		<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
			<KpiCard
				icon={<GroupIcon sx={{ color: '#3b82f6' }} />}
				label="전체 적격 유저"
				value={pool.totalEligible.toLocaleString()}
				sub={`활성 ${pool.activeUsers30d.toLocaleString()}명`}
				bgColor="#eff6ff"
			/>
			<KpiCard
				icon={<FavoriteIcon sx={{ color: '#ec4899' }} />}
				label="매칭 생성"
				value={matchRate.totalCreated.toLocaleString()}
				sub={`스케줄드 ${matchRate.scheduledCount} / 일반 ${matchRate.normalCount}`}
				bgColor="#fdf2f8"
			/>
			<KpiCard
				icon={<HandshakeIcon sx={{ color: '#f59e0b' }} />}
				label="상호 수락률"
				value={`${funnel.mutualAcceptRate}%`}
				sub={`${funnel.mutualAccepted}건 수락`}
				bgColor="#fffbeb"
			/>
			<KpiCard
				icon={<ChatIcon sx={{ color: '#10b981' }} />}
				label="채팅 개설률"
				value={`${funnel.chatOpenRate}%`}
				sub={`활성 채팅방 ${funnel.chatRoomsActive}개`}
				bgColor="#ecfdf5"
			/>
		</Box>
	);
}
