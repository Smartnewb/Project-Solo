'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	Alert,
	Box,
	Button,
	Chip,
	CircularProgress,
	FormControl,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	Tab,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tabs,
	TextField,
	Typography,
} from '@mui/material';
import AdminService from '@/app/services/admin';
import type { MeetingRefundFailure, MeetingRoomRow, MeetingRoomStatus } from '@/app/services/admin';
import { meetingErrorMessage } from './lib/errors';
import {
	ROOM_STATUS_ORDER,
	formatKst,
	genderLabel,
	roomRegionLabel,
	roomStatusColor,
	roomStatusLabel,
	shortId,
} from './lib/format';
import { RefundFailuresTable } from './refund-failures-table';
import { RoomDetailDrawer } from './room-detail-drawer';

type TabValue = 'rooms' | 'refund-failures';
type StatusFilter = 'ALL' | MeetingRoomStatus;

const LIST_COLUMNS = ['상태', '미팅 시각', '호스트', '지역', '제목 / 장소', '생성', '방 ID'];

function matchesSearch(room: MeetingRoomRow, term: string): boolean {
	if (!term) return true;
	const haystack = [room.id, room.title, room.placeName, room.placeRegionLabel, room.hostRegionCode, room.hostUserId]
		.filter((value): value is string => typeof value === 'string' && value.length > 0)
		.join(' ')
		.toLowerCase();
	return haystack.includes(term.toLowerCase());
}

export default function MeetingAdminClient() {
	const [tab, setTab] = useState<TabValue>('rooms');
	const [rooms, setRooms] = useState<MeetingRoomRow[]>([]);
	const [roomsLoading, setRoomsLoading] = useState(true);
	const [roomsError, setRoomsError] = useState<string | null>(null);
	const [failures, setFailures] = useState<MeetingRefundFailure[]>([]);
	const [failuresLoading, setFailuresLoading] = useState(true);
	const [failuresError, setFailuresError] = useState<string | null>(null);
	const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
	const [search, setSearch] = useState('');
	const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
	// 상세에서 처리(환불·취소 등)가 끝나면 방 목록과 환불 실패 목록을 같이 새로 읽는다.
	const [refreshKey, setRefreshKey] = useState(0);

	const fetchRooms = useCallback(async () => {
		setRoomsLoading(true);
		setRoomsError(null);
		try {
			setRooms(await AdminService.meeting.listRooms());
		} catch (fetchError) {
			setRoomsError(meetingErrorMessage(fetchError, '미팅 방 목록을 불러오지 못했어요.'));
			setRooms([]);
		} finally {
			setRoomsLoading(false);
		}
	}, []);

	const fetchFailures = useCallback(async () => {
		setFailuresLoading(true);
		setFailuresError(null);
		try {
			setFailures(await AdminService.meeting.listRefundFailures());
		} catch (fetchError) {
			setFailuresError(meetingErrorMessage(fetchError, '환불 실패 목록을 불러오지 못했어요.'));
			setFailures([]);
		} finally {
			setFailuresLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchRooms();
		fetchFailures();
	}, [fetchRooms, fetchFailures, refreshKey]);

	const handleChanged = useCallback(() => {
		setRefreshKey((current) => current + 1);
	}, []);

	const filteredRooms = useMemo(() => {
		const term = search.trim();
		return rooms.filter(
			(room) => (statusFilter === 'ALL' || room.status === statusFilter) && matchesSearch(room, term),
		);
	}, [rooms, statusFilter, search]);

	return (
		<Box sx={{ p: 3 }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 2 }}>
				<Box>
					<Typography variant="h5" fontWeight={700}>
						2:2 미팅
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
						미팅 방과 보증금을 확인하고 체크인·환불·취소를 처리해요. 시각은 모두 한국 시간(KST), 금액은 원화예요.
					</Typography>
				</Box>
				<Button variant="outlined" size="small" sx={{ flexShrink: 0, whiteSpace: 'nowrap' }} onClick={handleChanged} disabled={roomsLoading || failuresLoading}>
					새로고침
				</Button>
			</Box>

			<Paper variant="outlined">
				<Tabs
					value={tab}
					onChange={(_event, value: TabValue) => setTab(value)}
					sx={{ borderBottom: 1, borderColor: 'divider' }}
				>
					<Tab value="rooms" label="미팅 방" />
					<Tab
						value="refund-failures"
						label={
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								환불 실패
								{failures.length > 0 && <Chip size="small" color="error" label={failures.length} />}
							</Box>
						}
					/>
				</Tabs>

				{tab === 'rooms' ? (
					<Box>
						<Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', p: 2 }}>
							<FormControl size="small" sx={{ minWidth: 160 }}>
								<InputLabel id="meeting-status-filter-label">상태</InputLabel>
								<Select
									labelId="meeting-status-filter-label"
									label="상태"
									value={statusFilter}
									onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
								>
									<MenuItem value="ALL">전체</MenuItem>
									{ROOM_STATUS_ORDER.map((status) => (
										<MenuItem key={status} value={status}>
											{roomStatusLabel(status)}
										</MenuItem>
									))}
								</Select>
							</FormControl>
							<TextField
								size="small"
								label="검색 (방 ID·제목·장소·호스트 ID)"
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								sx={{ minWidth: { xs: '100%', sm: 300 } }}
							/>
							<Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
								{filteredRooms.length.toLocaleString('ko-KR')}개 / 전체 {rooms.length.toLocaleString('ko-KR')}개 (최근 100개)
							</Typography>
						</Box>

						{roomsError && (
							<Alert severity="error" sx={{ mx: 2, mb: 2 }} onClose={() => setRoomsError(null)}>
								{roomsError}
							</Alert>
						)}

						<TableContainer>
							<Table size="small">
								<TableHead>
									<TableRow sx={{ bgcolor: 'grey.50' }}>
										{LIST_COLUMNS.map((heading) => (
											<TableCell key={heading} sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
												{heading}
											</TableCell>
										))}
									</TableRow>
								</TableHead>
								<TableBody>
									{roomsLoading ? (
										<TableRow>
											<TableCell colSpan={LIST_COLUMNS.length} align="center" sx={{ py: 6 }}>
												<CircularProgress size={28} />
											</TableCell>
										</TableRow>
									) : filteredRooms.length === 0 ? (
										<TableRow>
											<TableCell colSpan={LIST_COLUMNS.length} align="center" sx={{ py: 6, color: 'text.secondary' }}>
												미팅 방이 없어요.
											</TableCell>
										</TableRow>
									) : (
										filteredRooms.map((room) => (
											<TableRow
												key={room.id}
												hover
												sx={{ cursor: 'pointer' }}
												onClick={() => setSelectedRoomId(room.id)}
												data-testid={`meeting-room-row-${room.id}`}
											>
												<TableCell>
													<Chip
														size="small"
														label={roomStatusLabel(room.status)}
														color={roomStatusColor(room.status)}
														variant={room.status === 'CANCELED' ? 'filled' : 'outlined'}
													/>
												</TableCell>
												<TableCell sx={{ whiteSpace: 'nowrap' }}>{formatKst(room.scheduledAt)}</TableCell>
												<TableCell>{genderLabel(room.hostGender)}</TableCell>
												<TableCell sx={{ whiteSpace: 'nowrap' }}>{roomRegionLabel(room)}</TableCell>
												<TableCell sx={{ maxWidth: 320 }}>
													<Typography variant="body2" noWrap>
														{room.title || '제목 없음'}
													</Typography>
													<Typography variant="caption" color="text.secondary" noWrap display="block">
														{room.placeName || '장소 미정'}
													</Typography>
												</TableCell>
												<TableCell sx={{ whiteSpace: 'nowrap' }}>{formatKst(room.createdAt)}</TableCell>
												<TableCell>
													<Typography variant="caption" sx={{ fontFamily: 'monospace' }} title={room.id}>
														{shortId(room.id)}
													</Typography>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</TableContainer>
					</Box>
				) : (
					<RefundFailuresTable
						items={failures}
						loading={failuresLoading}
						error={failuresError}
						onDismissError={() => setFailuresError(null)}
						onOpenRoom={setSelectedRoomId}
						onChanged={handleChanged}
					/>
				)}
			</Paper>

			<RoomDetailDrawer roomId={selectedRoomId} onClose={() => setSelectedRoomId(null)} onChanged={handleChanged} />
		</Box>
	);
}
