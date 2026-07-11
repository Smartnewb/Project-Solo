'use client';

import { useCallback, useEffect, useState } from 'react';
import {
	Alert,
	Box,
	Button,
	Checkbox,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Tooltip,
	Typography,
} from '@mui/material';
import type { Content, ContentStatus } from '@/app/services/admin/community-automation';
import { reviewQueue as reviewApi } from '@/app/services/admin/community-automation';

const STATUS_COLOR: Record<ContentStatus, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
	draft: 'default',
	pending_review: 'warning',
	approved: 'info',
	scheduled: 'info',
	published: 'success',
	rejected: 'error',
	quality_failed: 'error',
	withdrawn: 'default',
};

const STATUS_LABEL: Record<ContentStatus, string> = {
	draft: '초안',
	pending_review: '검수 대기',
	approved: '승인',
	scheduled: '예약됨',
	published: '발화됨',
	rejected: '거절됨',
	quality_failed: '품질 실패',
	withdrawn: '회수됨',
};

type DialogMode = 'reject' | 'inject' | 'withdraw' | 'regenerate' | null;

export default function ReviewQueuePage() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [items, setItems] = useState<Content[]>([]);

	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | 'withdraw'>('approve');
	const [bulkLoading, setBulkLoading] = useState(false);

	const [dialogMode, setDialogMode] = useState<DialogMode>(null);
	const [dialogTarget, setDialogTarget] = useState<string | null>(null);
	const [dialogText, setDialogText] = useState('');
	const [dialogLoading, setDialogLoading] = useState(false);

	const [actionLoading, setActionLoading] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await reviewApi.list();
			setItems(data);
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '불러오기 실패');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	function openDialog(mode: DialogMode, id: string, prefill = '') {
		setDialogMode(mode);
		setDialogTarget(id);
		setDialogText(prefill);
	}

	async function handleDialogConfirm() {
		if (!dialogTarget || !dialogMode) return;
		setDialogLoading(true);
		try {
			if (dialogMode === 'reject') await reviewApi.reject(dialogTarget, dialogText);
			else if (dialogMode === 'inject') await reviewApi.inject(dialogTarget, dialogText);
			else if (dialogMode === 'withdraw') await reviewApi.withdraw(dialogTarget, dialogText);
			else if (dialogMode === 'regenerate') await reviewApi.regenerate(dialogTarget);
			setDialogMode(null);
			setDialogTarget(null);
			await load();
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '처리 실패');
		} finally {
			setDialogLoading(false);
		}
	}

	async function handleApprove(id: string) {
		setActionLoading(id);
		try {
			await reviewApi.approve(id);
			await load();
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '승인 실패');
		} finally {
			setActionLoading(null);
		}
	}

	async function handleBulk() {
		if (selected.size === 0) return;
		setBulkLoading(true);
		try {
			const result = await reviewApi.bulk({
				contentIds: Array.from(selected),
				action: bulkAction,
			});
			const msg = `완료: ${result.succeeded.length}개, 실패: ${result.failed.length}개`;
			alert(msg);
			setSelected(new Set());
			await load();
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '일괄 처리 실패');
		} finally {
			setBulkLoading(false);
		}
	}

	function toggleSelect(id: string) {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	}

	function toggleSelectAll() {
		if (selected.size === items.length) {
			setSelected(new Set());
		} else {
			setSelected(new Set(items.map((i) => i.id)));
		}
	}

	const dialogTitle: Record<NonNullable<DialogMode>, string> = {
		reject: '거절 사유',
		inject: '텍스트 수정 후 승인',
		withdraw: '회수 사유',
		regenerate: '재생성 확인',
	};

	return (
		<Box>
			{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

			{selected.size > 0 && (
				<Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
					<Typography variant="body2">{selected.size}개 선택됨</Typography>
					<FormControl size="small" sx={{ minWidth: 120 }}>
						<InputLabel>일괄 액션</InputLabel>
						<Select
							value={bulkAction}
							label="일괄 액션"
							onChange={(e) => setBulkAction(e.target.value as typeof bulkAction)}
						>
							<MenuItem value="approve">일괄 승인</MenuItem>
							<MenuItem value="reject">일괄 거절</MenuItem>
							<MenuItem value="withdraw">일괄 회수</MenuItem>
						</Select>
					</FormControl>
					<Button variant="contained" disabled={bulkLoading} onClick={handleBulk}>
						{bulkLoading ? <CircularProgress size={16} /> : '실행'}
					</Button>
					<Button onClick={() => setSelected(new Set())}>선택 해제</Button>
				</Paper>
			)}

			{loading ? (
				<Box display="flex" justifyContent="center" py={6}>
					<CircularProgress />
				</Box>
			) : (
				<TableContainer component={Paper}>
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell padding="checkbox">
									<Checkbox
										indeterminate={selected.size > 0 && selected.size < items.length}
										checked={items.length > 0 && selected.size === items.length}
										onChange={toggleSelectAll}
									/>
								</TableCell>
								<TableCell>내용 미리보기</TableCell>
								<TableCell>타입</TableCell>
								<TableCell>상태</TableCell>
								<TableCell>품질 점수</TableCell>
								<TableCell>생성일</TableCell>
								<TableCell align="right">액션</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{items.length === 0 ? (
								<TableRow>
									<TableCell colSpan={7} align="center">검수 대기 콘텐츠 없음</TableCell>
								</TableRow>
							) : items.map((item) => (
								<TableRow key={item.id} hover selected={selected.has(item.id)}>
									<TableCell padding="checkbox">
										<Checkbox checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)} />
									</TableCell>
									<TableCell sx={{ maxWidth: 240 }}>
										<Tooltip title={item.finalText ?? item.generatedText ?? ''}>
											<Typography variant="body2" noWrap>
												{(item.finalText ?? item.generatedText ?? '-').slice(0, 60)}
											</Typography>
										</Tooltip>
									</TableCell>
									<TableCell>{item.targetType ?? '-'}</TableCell>
									<TableCell>
										<Chip
											label={STATUS_LABEL[item.status]}
											color={STATUS_COLOR[item.status]}
											size="small"
										/>
									</TableCell>
									<TableCell>
										{item.qualityScores
											? Object.entries(item.qualityScores)
												.filter(([, v]) => v !== undefined)
												.slice(0, 2)
												.map(([k, v]) => `${k}:${v}`)
												.join(' | ')
											: '-'}
									</TableCell>
									<TableCell>
										{new Date(item.createdAt).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}
									</TableCell>
									<TableCell align="right">
										<Box display="flex" gap={0.5} justifyContent="flex-end" flexWrap="wrap">
											<Button
												size="small"
												variant="contained"
												color="success"
												disabled={actionLoading === item.id}
												onClick={() => handleApprove(item.id)}
											>
												승인
											</Button>
											<Button
												size="small"
												variant="outlined"
												onClick={() => openDialog('inject', item.id, item.finalText ?? item.generatedText ?? '')}
											>
												수정승인
											</Button>
											<Button
												size="small"
												variant="outlined"
												color="error"
												onClick={() => openDialog('reject', item.id)}
											>
												거절
											</Button>
											<Button
												size="small"
												variant="outlined"
												onClick={() => openDialog('regenerate', item.id)}
											>
												재생성
											</Button>
											<Button
												size="small"
												variant="outlined"
												color="warning"
												onClick={() => openDialog('withdraw', item.id)}
											>
												회수
											</Button>
										</Box>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			<Dialog open={!!dialogMode} onClose={() => setDialogMode(null)} maxWidth="sm" fullWidth>
				<DialogTitle>{dialogMode ? dialogTitle[dialogMode] : ''}</DialogTitle>
				<DialogContent sx={{ pt: '16px !important' }}>
					{dialogMode === 'regenerate' ? (
						<Typography>이 콘텐츠를 회수하고 새 DAG run을 시작하시겠습니까?</Typography>
					) : (
						<TextField
							label={dialogMode === 'inject' ? '최종 텍스트' : '사유'}
							multiline
							rows={dialogMode === 'inject' ? 6 : 3}
							fullWidth
							value={dialogText}
							onChange={(e) => setDialogText(e.target.value)}
						/>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDialogMode(null)}>취소</Button>
					<Button variant="contained" disabled={dialogLoading} onClick={handleDialogConfirm}>
						{dialogLoading ? <CircularProgress size={16} /> : '확인'}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
