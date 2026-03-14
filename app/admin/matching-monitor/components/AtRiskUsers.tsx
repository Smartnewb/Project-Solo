'use client';

import { useState, useMemo } from 'react';
import {
	Box,
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
	ToggleButton,
	ToggleButtonGroup,
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import type { AtRiskUsers as AtRiskUsersType } from '../types';

export default function AtRiskUsersSection({
	data,
	onUserClick,
}: {
	data: AtRiskUsersType;
	onUserClick: (userId: string) => void;
}) {
	const [riskPeriod, setRiskPeriod] = useState<'3d' | '7d'>('3d');
	const users = riskPeriod === '3d' ? data.riskUsers3d : data.riskUsers7d;

	const reasonData = useMemo(
		() =>
			data.topFailureReasons.map((r) => ({
				name: r.reason.length > 20 ? `${r.reason.slice(0, 20)}...` : r.reason,
				fullName: r.reason,
				count: r.count,
			})),
		[data.topFailureReasons],
	);

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
			<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
				<Card sx={{ flex: 1, minWidth: 160, textAlign: 'center' }}>
					<CardContent>
						<Typography variant="caption" color="text.secondary">
							3일+ 연속 실패
						</Typography>
						<Typography variant="h4" fontWeight={700} color="warning.main">
							{data.riskUsers3d.length}
						</Typography>
					</CardContent>
				</Card>
				<Card sx={{ flex: 1, minWidth: 160, textAlign: 'center' }}>
					<CardContent>
						<Typography variant="caption" color="text.secondary">
							7일+ 연속 실패
						</Typography>
						<Typography variant="h4" fontWeight={700} color="error.main">
							{data.riskUsers7d.length}
						</Typography>
					</CardContent>
				</Card>
				<Card sx={{ flex: 1, minWidth: 160, textAlign: 'center' }}>
					<CardContent>
						<Typography variant="caption" color="text.secondary">
							24h 후보 0명
						</Typography>
						<Typography variant="h4" fontWeight={700} color="error.main">
							{data.zeroCandidateUsers}
						</Typography>
					</CardContent>
				</Card>
			</Box>

			<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
				<Card sx={{ flex: 2, minWidth: 400 }}>
					<CardContent>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
							<Typography variant="subtitle1" fontWeight={700}>
								위험 유저 목록
							</Typography>
							<ToggleButtonGroup
								size="small"
								exclusive
								value={riskPeriod}
								onChange={(_, v) => v && setRiskPeriod(v)}
							>
								<ToggleButton value="3d">3일+</ToggleButton>
								<ToggleButton value="7d">7일+</ToggleButton>
							</ToggleButtonGroup>
						</Box>
						<TableContainer sx={{ maxHeight: 400 }}>
							<Table size="small" stickyHeader>
								<TableHead>
									<TableRow>
										<TableCell>유저 ID</TableCell>
										<TableCell align="right">연속 실패일</TableCell>
										<TableCell>마지막 실패 사유</TableCell>
										<TableCell>시각</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{users.length === 0 ? (
										<TableRow>
											<TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
												위험 유저 없음
											</TableCell>
										</TableRow>
									) : (
										users.map((user) => (
											<TableRow
												key={user.userId}
												hover
												sx={{ cursor: 'pointer' }}
												onClick={() => onUserClick(user.userId)}
											>
												<TableCell>
													<Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
														{user.userId.slice(0, 8)}...
													</Typography>
												</TableCell>
												<TableCell align="right">
													<Chip
														label={`${user.consecutiveFailureDays}일`}
														size="small"
														color={user.consecutiveFailureDays >= 7 ? 'error' : 'warning'}
													/>
												</TableCell>
												<TableCell>
													<Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
														{user.lastFailureReason}
													</Typography>
												</TableCell>
												<TableCell>
													<Typography variant="caption">
														{format(new Date(user.lastFailedAt), 'MM/dd HH:mm')}
													</Typography>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</TableContainer>
					</CardContent>
				</Card>

				<Card sx={{ flex: 1, minWidth: 300 }}>
					<CardContent>
						<Typography variant="subtitle1" fontWeight={700} gutterBottom>
							상위 실패 사유
						</Typography>
						{reasonData.length > 0 ? (
							<ResponsiveContainer width="100%" height={350}>
								<BarChart data={reasonData} layout="vertical" margin={{ left: 10, right: 10 }}>
									<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
									<XAxis type="number" tick={{ fontSize: 12 }} />
									<YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
									<Tooltip
										formatter={(value: number) => [value.toLocaleString(), '건수']}
										labelFormatter={(label: string, payload: any[]) =>
											payload?.[0]?.payload?.fullName || label
										}
									/>
									<Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
								</BarChart>
							</ResponsiveContainer>
						) : (
							<Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
								데이터 없음
							</Typography>
						)}
					</CardContent>
				</Card>
			</Box>
		</Box>
	);
}
