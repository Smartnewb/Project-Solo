'use client';

import { useState, useEffect, useCallback } from 'react';
import {
	Box,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	TextField,
	InputAdornment,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	Chip,
	Skeleton,
	Tooltip,
	TablePagination,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AdminService from '@/app/services/admin';
import { patchAdminAxios } from '@/shared/lib/http/admin-axios-interceptor';
import type { CareLog } from '@/app/services/admin/care';

const ACTION_LABELS: Record<string, { label: string; color: string; bg: string }> = {
	like: { label: '좋아요', color: '#db2777', bg: '#fce7f3' },
	mutual_like: { label: '상호좋아요', color: '#2563eb', bg: '#dbeafe' },
	open_chat: { label: '채팅방 개설', color: '#059669', bg: '#d1fae5' },
};

function CareLogsContent() {
	const [logs, setLogs] = useState<CareLog[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
	const [actionFilter, setActionFilter] = useState<string>('');
	const [searchInput, setSearchInput] = useState('');
	const [searchTerm, setSearchTerm] = useState('');

	useEffect(() => {
		const unpatch = patchAdminAxios();
		return () => unpatch();
	}, []);

	const fetchLogs = useCallback(
		async (page: number = 1) => {
			try {
				setLoading(true);
				setError(null);
				const params: {
					page: number;
					limit: number;
					action?: string;
					targetUserId?: string;
				} = {
					page,
					limit: 20,
				};
				if (actionFilter) params.action = actionFilter;
				if (searchTerm) params.targetUserId = searchTerm;
				const data = await AdminService.care.getLogs(params);
				setLogs(data.items);
				setPagination({ page: data.page, limit: data.limit, total: data.total });
			} catch (err: any) {
				setError(
					err.response?.data?.message || '케어 이력을 불러올 수 없습니다.',
				);
			} finally {
				setLoading(false);
			}
		},
		[actionFilter, searchTerm],
	);

	useEffect(() => {
		fetchLogs();
	}, [fetchLogs]);

	// debounce 검색
	useEffect(() => {
		const timer = setTimeout(() => {
			setSearchTerm(searchInput);
		}, 300);
		return () => clearTimeout(timer);
	}, [searchInput]);

	return (
		<Box sx={{ p: 3 }}>
			<Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
				케어 이력
			</Typography>

			<Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
				<FormControl size="small" sx={{ minWidth: 140 }}>
					<InputLabel>액션 타입</InputLabel>
					<Select
						value={actionFilter}
						label="액션 타입"
						onChange={(e) => setActionFilter(e.target.value)}
					>
						<MenuItem value="">전체</MenuItem>
						<MenuItem value="like">좋아요</MenuItem>
						<MenuItem value="mutual_like">상호좋아요</MenuItem>
						<MenuItem value="open_chat">채팅방 개설</MenuItem>
					</Select>
				</FormControl>
				<TextField
					size="small"
					placeholder="대상 유저 ID 검색..."
					value={searchInput}
					onChange={(e) => setSearchInput(e.target.value)}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon sx={{ fontSize: 18, color: '#9ca3af' }} />
							</InputAdornment>
						),
					}}
					sx={{ flex: 1 }}
				/>
			</Box>

			{error && (
				<Typography color="error" sx={{ mb: 2 }}>
					{error}
				</Typography>
			)}

			<TableContainer component={Paper} variant="outlined">
				<Table size="small">
					<TableHead>
						<TableRow sx={{ bgcolor: '#f9fafb' }}>
							<TableCell sx={{ fontWeight: 600 }}>일시</TableCell>
							<TableCell sx={{ fontWeight: 600 }}>대상 유저</TableCell>
							<TableCell sx={{ fontWeight: 600 }}>파트너</TableCell>
							<TableCell sx={{ fontWeight: 600 }}>액션</TableCell>
							<TableCell sx={{ fontWeight: 600 }}>편지 내용</TableCell>
							<TableCell sx={{ fontWeight: 600 }}>실행 어드민</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{loading
							? [1, 2, 3].map((i) => (
									<TableRow key={i}>
										{[1, 2, 3, 4, 5, 6].map((j) => (
											<TableCell key={j}>
												<Skeleton variant="text" />
											</TableCell>
										))}
									</TableRow>
								))
							: logs.length === 0
								? (
										<TableRow>
											<TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
												<Typography
													color="text.secondary"
													sx={{ fontSize: 13 }}
												>
													케어 이력이 없습니다
												</Typography>
											</TableCell>
										</TableRow>
									)
								: logs.map((log) => {
										const actionInfo = ACTION_LABELS[log.action] || {
											label: log.action,
											color: '#666',
											bg: '#f3f4f6',
										};
										return (
											<TableRow key={log.id} hover>
												<TableCell
													sx={{
														fontSize: 12,
														color: '#666',
														whiteSpace: 'nowrap',
													}}
												>
													{new Date(log.created_at).toLocaleDateString(
														'ko-KR',
														{
															month: 'numeric',
															day: 'numeric',
															hour: '2-digit',
															minute: '2-digit',
														},
													)}
												</TableCell>
												<TableCell sx={{ fontWeight: 500, fontSize: 13 }}>
													{log.target_name}
												</TableCell>
												<TableCell sx={{ fontWeight: 500, fontSize: 13 }}>
													{log.partner_name}
												</TableCell>
												<TableCell>
													<Chip
														label={actionInfo.label}
														size="small"
														sx={{
															bgcolor: actionInfo.bg,
															color: actionInfo.color,
															fontWeight: 600,
															fontSize: 10,
															height: 22,
														}}
													/>
												</TableCell>
												<TableCell
													sx={{ maxWidth: 200, fontSize: 12, color: '#666' }}
												>
													<Tooltip title={log.letter_content} arrow>
														<Typography
															noWrap
															sx={{
																fontSize: 12,
																color: '#666',
																maxWidth: 200,
															}}
														>
															{log.letter_content}
														</Typography>
													</Tooltip>
												</TableCell>
												<TableCell sx={{ fontSize: 12, color: '#666' }}>
													{log.admin_name}
												</TableCell>
											</TableRow>
										);
									})}
					</TableBody>
				</Table>
			</TableContainer>

			{!loading && logs.length > 0 && (
				<TablePagination
					component="div"
					count={pagination.total}
					page={pagination.page - 1}
					onPageChange={(_, newPage) => fetchLogs(newPage + 1)}
					rowsPerPage={pagination.limit}
					rowsPerPageOptions={[20]}
					labelDisplayedRows={({ from, to, count }) =>
						`${from}-${to} / 총 ${count}건`
					}
				/>
			)}
		</Box>
	);
}

export default function CareLogsV2() {
	return <CareLogsContent />;
}
