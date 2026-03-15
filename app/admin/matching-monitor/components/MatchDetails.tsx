'use client';

import {
	Card,
	CardContent,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Chip,
	Tooltip,
} from '@mui/material';
import { format } from 'date-fns';
import type { MatchDetail } from '../types';

const LIKE_STATUS_CONFIG: Record<string, { label: string; color: 'default' | 'success' | 'warning' | 'error' }> = {
	PENDING: { label: '대기', color: 'warning' },
	ACCEPTED: { label: '수락', color: 'success' },
	EXPIRED: { label: '만료', color: 'default' },
	REJECTED: { label: '거절', color: 'error' },
};

const MATCH_TYPE_LABEL: Record<string, string> = {
	scheduled: '스케줄드',
	rematching: '리매칭',
	profile_viewer: 'PV',
	admin: '어드민',
};

const ACTIVITY_LABEL: Record<string, { label: string; color: string }> = {
	mutual: { label: '양방향', color: '#16a34a' },
	one_sided: { label: '일방', color: '#f59e0b' },
	inactive: { label: '미활동', color: '#9ca3af' },
};

export default function MatchDetailsSection({ data }: { data: MatchDetail[] }) {
	return (
		<Card>
			<CardContent>
				<Typography variant="subtitle1" fontWeight={700} gutterBottom>
					매칭 상세 ({data.length}건)
				</Typography>
				<TableContainer sx={{ maxHeight: 500 }}>
					<Table size="small" stickyHeader>
						<TableHead>
							<TableRow>
								<TableCell>시각</TableCell>
								<TableCell>유형</TableCell>
								<TableCell>남성</TableCell>
								<TableCell>여성</TableCell>
								<TableCell>좋아요</TableCell>
								<TableCell>편지</TableCell>
								<TableCell>채팅</TableCell>
								<TableCell>24h 활동</TableCell>
								<TableCell align="right">메시지</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{data.length === 0 ? (
								<TableRow>
									<TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
										데이터 없음
									</TableCell>
								</TableRow>
							) : (
								data.map((item) => {
									const likeConfig = item.likeStatus ? LIKE_STATUS_CONFIG[item.likeStatus] : null;
									const activityConfig = item.activity24hStatus ? ACTIVITY_LABEL[item.activity24hStatus] : null;

									return (
										<TableRow key={item.connectionId}>
											<TableCell>
												<Tooltip title={item.connectionId} arrow>
													<Typography variant="caption">
														{format(new Date(item.publishedAt), 'MM/dd HH:mm')}
													</Typography>
												</Tooltip>
											</TableCell>
											<TableCell>
												<Chip
													label={MATCH_TYPE_LABEL[item.matchType] || item.matchType}
													size="small"
													variant="outlined"
												/>
											</TableCell>
											<TableCell>
												<Typography variant="body2">{item.maleName}</Typography>
											</TableCell>
											<TableCell>
												<Typography variant="body2">{item.femaleName}</Typography>
											</TableCell>
											<TableCell>
												{likeConfig ? (
													<Chip label={likeConfig.label} size="small" color={likeConfig.color} />
												) : (
													<Typography variant="caption" color="text.secondary">-</Typography>
												)}
											</TableCell>
											<TableCell>
												{item.hasLetter ? (
													<Chip label="O" size="small" sx={{ bgcolor: '#eff6ff', color: '#3b82f6', fontWeight: 700 }} />
												) : (
													<Typography variant="caption" color="text.secondary">-</Typography>
												)}
											</TableCell>
											<TableCell>
												{item.hasChatRoom ? (
													<Chip
														label={item.chatActive ? '활성' : '비활성'}
														size="small"
														color={item.chatActive ? 'success' : 'default'}
													/>
												) : (
													<Typography variant="caption" color="text.secondary">-</Typography>
												)}
											</TableCell>
											<TableCell>
												{activityConfig ? (
													<Typography variant="body2" fontWeight={600} color={activityConfig.color}>
														{activityConfig.label}
													</Typography>
												) : (
													<Typography variant="caption" color="text.secondary">-</Typography>
												)}
											</TableCell>
											<TableCell align="right">
												{item.messageCount > 0 ? (
													<Tooltip title={item.lastMessageAt ? format(new Date(item.lastMessageAt), 'MM/dd HH:mm') : ''} arrow>
														<Typography variant="body2" fontWeight={600}>
															{item.messageCount}
														</Typography>
													</Tooltip>
												) : (
													<Typography variant="caption" color="text.secondary">0</Typography>
												)}
											</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</TableContainer>
			</CardContent>
		</Card>
	);
}
