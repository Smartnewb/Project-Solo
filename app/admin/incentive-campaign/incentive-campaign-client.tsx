'use client';

import { useMemo, useState } from 'react';
import {
	Avatar,
	Box,
	Button,
	Chip,
	CircularProgress,
	Divider,
	IconButton,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tooltip,
	Typography,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import RefreshIcon from '@mui/icons-material/Refresh';
import TodayIcon from '@mui/icons-material/Today';
import type {
	CampaignCalendarAssignment,
	CampaignCalendarDay,
} from '@/app/services/admin/incentive-campaign';
import { useIncentiveCampaignCalendar } from '@/app/admin/hooks';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function toDateKey(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

function startOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addDays(date: Date, amount: number): Date {
	const next = new Date(date);
	next.setDate(next.getDate() + amount);
	return next;
}

function buildCalendarGrid(month: Date): Date[] {
	const first = startOfMonth(month);
	const last = endOfMonth(month);
	const gridStart = addDays(first, -first.getDay());
	const gridEnd = addDays(last, 6 - last.getDay());
	const days: Date[] = [];

	for (let cursor = gridStart; cursor <= gridEnd; cursor = addDays(cursor, 1)) {
		days.push(cursor);
	}

	return days;
}

function formatMonthLabel(date: Date): string {
	return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

function formatDateTime(value: string | null): string {
	if (!value) return '-';
	return new Intl.DateTimeFormat('ko-KR', {
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(value));
}

function maskPhone(phone: string | null): string {
	if (!phone) return '-';
	return phone.replace(/(\d{3})\d+(\d{4})/, '$1****$2');
}

function shortId(id: string | null): string {
	if (!id) return '-';
	return id.length <= 12 ? id : `${id.slice(0, 8)}...${id.slice(-4)}`;
}

function summarizeMonth(days: CampaignCalendarDay[]) {
	return days.reduce(
		(acc, day) => {
			acc.assignments += day.totalAssignments;
			acc.likes += day.totalLikesSent;
			acc.assignedFemales += day.uniqueFemalesAssigned;
			acc.participatedFemales += day.uniqueFemalesParticipated;
			return acc;
		},
		{ assignments: 0, likes: 0, assignedFemales: 0, participatedFemales: 0 },
	);
}

function AssignmentRows({ assignments }: { assignments: CampaignCalendarAssignment[] }) {
	return (
		<Table size="small">
			<TableHead>
				<TableRow>
					<TableCell>남성 프로필</TableCell>
					<TableCell>학교/학과</TableCell>
					<TableCell>상태</TableCell>
					<TableCell>좋아요 시각</TableCell>
					<TableCell>좋아요 ID</TableCell>
				</TableRow>
			</TableHead>
			<TableBody>
				{assignments.map((assignment) => (
					<TableRow key={assignment.id} hover>
						<TableCell>
							<Stack direction="row" spacing={1.5} alignItems="center">
								<Avatar
									src={assignment.maleProfile.profileImageUrl ?? undefined}
									alt={assignment.maleProfile.name}
									sx={{ width: 44, height: 44 }}
								/>
								<Box>
									<Typography variant="body2" fontWeight={700}>
										{assignment.maleProfile.name} ({assignment.maleProfile.age})
									</Typography>
									<Typography variant="caption" color="text.secondary">
										{assignment.maleProfile.rank ?? 'rank 없음'} · {shortId(assignment.maleProfile.userId)}
									</Typography>
								</Box>
							</Stack>
						</TableCell>
						<TableCell>
							<Typography variant="body2">
								{assignment.maleProfile.universityName ?? '-'}
							</Typography>
							<Typography variant="caption" color="text.secondary">
								{assignment.maleProfile.departmentName ?? '-'}
							</Typography>
						</TableCell>
						<TableCell>
							<Chip
								size="small"
								color={assignment.isLiked ? 'success' : 'default'}
								label={assignment.isLiked ? '발송 완료' : '미발송'}
							/>
						</TableCell>
						<TableCell>{formatDateTime(assignment.likedAt)}</TableCell>
						<TableCell>
							<Tooltip title={assignment.matchLikeId ?? ''}>
								<span>{shortId(assignment.matchLikeId)}</span>
							</Tooltip>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

export default function IncentiveCampaignClient() {
	const today = useMemo(() => new Date(), []);
	const [month, setMonth] = useState(() => startOfMonth(today));
	const [selectedDate, setSelectedDate] = useState(() => toDateKey(today));

	const startDate = toDateKey(startOfMonth(month));
	const endDate = toDateKey(endOfMonth(month));
	const query = useIncentiveCampaignCalendar(startDate, endDate);

	const daysByDate = useMemo(() => {
		const map = new Map<string, CampaignCalendarDay>();
		for (const day of query.data?.days ?? []) map.set(day.date, day);
		return map;
	}, [query.data?.days]);

	const calendarDays = useMemo(() => buildCalendarGrid(month), [month]);
	const monthSummary = summarizeMonth(query.data?.days ?? []);
	const selectedDay = daysByDate.get(selectedDate);

	const moveMonth = (amount: number) => {
		const next = new Date(month.getFullYear(), month.getMonth() + amount, 1);
		setMonth(next);
		setSelectedDate(toDateKey(next));
	};

	const goToday = () => {
		const now = new Date();
		setMonth(startOfMonth(now));
		setSelectedDate(toDateKey(now));
	};

	return (
		<Box>
			<Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center' }}>
				<Box>
					<Typography variant="h5" fontWeight={800}>
						인센티브 캠페인 관제
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
						일별 여성 배정, 남성 프로필, 좋아요 발송 상태를 확인합니다.
					</Typography>
				</Box>
				<Stack direction="row" spacing={1}>
					<Tooltip title="오늘">
						<IconButton onClick={goToday}>
							<TodayIcon />
						</IconButton>
					</Tooltip>
					<Tooltip title="새로고침">
						<IconButton onClick={() => query.refetch()}>
							<RefreshIcon />
						</IconButton>
					</Tooltip>
				</Stack>
			</Box>

			<Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
				{[
					['배정', monthSummary.assignments],
					['좋아요 발송', monthSummary.likes],
					['배정 여성', monthSummary.assignedFemales],
					['참여 여성', monthSummary.participatedFemales],
				].map(([label, value]) => (
					<Paper key={label} sx={{ p: 2, flex: 1 }}>
						<Typography variant="body2" color="text.secondary">
							{label}
						</Typography>
						<Typography variant="h5" fontWeight={800}>
							{Number(value).toLocaleString()}
						</Typography>
					</Paper>
				))}
			</Stack>

			{query.error ? (
				<Paper sx={{ p: 2, mb: 3, color: 'error.main' }}>
					{getAdminErrorMessage(query.error, '캠페인 캘린더를 불러오지 못했습니다.')}
				</Paper>
			) : null}

			<Paper sx={{ p: 2, mb: 3 }}>
				<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
					<IconButton onClick={() => moveMonth(-1)}>
						<ChevronLeftIcon />
					</IconButton>
					<Typography variant="h6" fontWeight={800}>
						{formatMonthLabel(month)}
					</Typography>
					<IconButton onClick={() => moveMonth(1)}>
						<ChevronRightIcon />
					</IconButton>
				</Stack>

				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
						border: '1px solid',
						borderColor: 'divider',
						borderRadius: 1,
						overflow: 'hidden',
					}}
				>
					{WEEKDAYS.map((weekday) => (
						<Box key={weekday} sx={{ p: 1, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
							<Typography variant="caption" fontWeight={700}>
								{weekday}
							</Typography>
						</Box>
					))}
					{calendarDays.map((date) => {
						const key = toDateKey(date);
						const day = daysByDate.get(key);
						const inMonth = date.getMonth() === month.getMonth();
						const selected = key === selectedDate;
						return (
							<Box
								key={key}
								component="button"
								onClick={() => setSelectedDate(key)}
								sx={{
									minHeight: 112,
									p: 1,
									textAlign: 'left',
									border: 0,
									borderRight: '1px solid',
									borderBottom: '1px solid',
									borderColor: 'divider',
									bgcolor: selected ? 'primary.50' : 'background.paper',
									color: inMonth ? 'text.primary' : 'text.disabled',
									cursor: 'pointer',
									'&:hover': { bgcolor: selected ? 'primary.50' : 'grey.50' },
								}}
							>
								<Typography variant="body2" fontWeight={800}>
									{date.getDate()}
								</Typography>
								<Stack spacing={0.5} sx={{ mt: 1 }}>
									<Chip size="small" label={`배정 ${day?.totalAssignments ?? 0}`} />
									<Chip size="small" color={(day?.totalLikesSent ?? 0) > 0 ? 'success' : 'default'} label={`좋아요 ${day?.totalLikesSent ?? 0}`} />
									<Typography variant="caption" color="text.secondary">
										여성 {day?.uniqueFemalesAssigned ?? 0}명
									</Typography>
								</Stack>
							</Box>
						);
					})}
				</Box>
			</Paper>

			<Paper sx={{ p: 2 }}>
				<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
					<Box>
						<Typography variant="h6" fontWeight={800}>
							{selectedDate} 상세
						</Typography>
						<Typography variant="body2" color="text.secondary">
							배정 {selectedDay?.totalAssignments ?? 0}건 · 좋아요 {selectedDay?.totalLikesSent ?? 0}건
						</Typography>
					</Box>
					{query.isFetching ? <CircularProgress size={22} /> : null}
				</Stack>

				{query.isLoading ? (
					<Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
						<CircularProgress />
					</Box>
				) : !selectedDay || selectedDay.femaleGroups.length === 0 ? (
					<Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
						해당 날짜에 배정된 항목이 없습니다.
					</Box>
				) : (
					<Stack spacing={2}>
						{selectedDay.femaleGroups.map((group) => (
							<Box key={group.femaleUser.userId}>
								<Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
									<Avatar sx={{ width: 36, height: 36 }}>
										{group.femaleUser.name.slice(0, 1)}
									</Avatar>
									<Box sx={{ flex: 1 }}>
										<Typography variant="subtitle2" fontWeight={800}>
											{group.femaleUser.name}
										</Typography>
										<Typography variant="caption" color="text.secondary">
											{maskPhone(group.femaleUser.phoneNumber)} · {shortId(group.femaleUser.userId)}
										</Typography>
									</Box>
									<Chip
										size="small"
										label={`${group.assignments.filter((a) => a.isLiked).length}/${group.assignments.length} 발송`}
										color={group.assignments.some((a) => a.isLiked) ? 'success' : 'default'}
									/>
								</Stack>
								<TableContainer>
									<AssignmentRows assignments={group.assignments} />
								</TableContainer>
								<Divider sx={{ mt: 2 }} />
							</Box>
						))}
					</Stack>
				)}
			</Paper>
		</Box>
	);
}
