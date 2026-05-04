'use client';

import { useCallback, useEffect, useState } from 'react';
import {
	Alert,
	Box,
	Button,
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
	Typography,
} from '@mui/material';
import type {
	Campaign,
	CampaignStatus,
	CreateCampaignBody,
	DagTemplateId,
} from '@/app/services/admin/community-automation';
import { campaigns as campaignsApi } from '@/app/services/admin/community-automation';

const STATUS_COLOR: Record<CampaignStatus, 'default' | 'success' | 'warning' | 'error'> = {
	draft: 'default',
	active: 'success',
	paused: 'warning',
	archived: 'error',
};

const STATUS_LABEL: Record<CampaignStatus, string> = {
	draft: '초안',
	active: '활성',
	paused: '일시정지',
	archived: '보관',
};

const DAG_TEMPLATES: DagTemplateId[] = ['post', 'auto_comment', 'target_comment', 'reply'];

function formatDate(iso: string | null) {
	if (!iso) return '-';
	return new Date(iso).toLocaleDateString('ko-KR');
}

export default function CampaignsPage() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [items, setItems] = useState<Campaign[]>([]);
	const [statusFilter, setStatusFilter] = useState<CampaignStatus | ''>('');

	const [createOpen, setCreateOpen] = useState(false);
	const [createForm, setCreateForm] = useState<CreateCampaignBody>({ name: '', category: '' });
	const [createLoading, setCreateLoading] = useState(false);

	const [dagOpen, setDagOpen] = useState<string | null>(null);
	const [dagCount, setDagCount] = useState(1);
	const [dagTemplate, setDagTemplate] = useState<DagTemplateId | ''>('');
	const [dagLoading, setDagLoading] = useState(false);

	const [actionLoading, setActionLoading] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await campaignsApi.list(statusFilter ? { status: statusFilter } : undefined);
			setItems(data);
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '불러오기 실패');
		} finally {
			setLoading(false);
		}
	}, [statusFilter]);

	useEffect(() => {
		load();
	}, [load]);

	async function handleCreate() {
		if (!createForm.name || !createForm.category) return;
		setCreateLoading(true);
		try {
			await campaignsApi.create(createForm);
			setCreateOpen(false);
			setCreateForm({ name: '', category: '' });
			await load();
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '생성 실패');
		} finally {
			setCreateLoading(false);
		}
	}

	async function handleStatusChange(id: string, action: 'activate' | 'pause' | 'archive') {
		setActionLoading(id + action);
		try {
			await campaignsApi[action](id);
			await load();
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '상태 변경 실패');
		} finally {
			setActionLoading(null);
		}
	}

	async function handleDagRun() {
		if (!dagOpen) return;
		setDagLoading(true);
		try {
			const result = await campaignsApi.triggerDagRun(dagOpen, {
				count: dagCount,
				dagTemplateId: dagTemplate || undefined,
			});
			alert(`DAG ${result.jobsEnqueued}개 큐 등록 완료`);
			setDagOpen(null);
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : 'DAG 실행 실패');
		} finally {
			setDagLoading(false);
		}
	}

	function getNextActions(status: CampaignStatus): Array<'activate' | 'pause' | 'archive'> {
		if (status === 'draft') return ['activate', 'archive'];
		if (status === 'active') return ['pause', 'archive'];
		if (status === 'paused') return ['activate', 'archive'];
		return [];
	}

	return (
		<Box>
			<Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
				<Box display="flex" gap={2} alignItems="center">
					<FormControl size="small" sx={{ minWidth: 140 }}>
						<InputLabel>상태 필터</InputLabel>
						<Select
							value={statusFilter}
							label="상태 필터"
							onChange={(e) => setStatusFilter(e.target.value as CampaignStatus | '')}
						>
							<MenuItem value="">전체</MenuItem>
							{(Object.keys(STATUS_LABEL) as CampaignStatus[]).map((s) => (
								<MenuItem key={s} value={s}>{STATUS_LABEL[s]}</MenuItem>
							))}
						</Select>
					</FormControl>
				</Box>
				<Button variant="contained" onClick={() => setCreateOpen(true)}>
					캠페인 생성
				</Button>
			</Box>

			{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

			{loading ? (
				<Box display="flex" justifyContent="center" py={6}>
					<CircularProgress />
				</Box>
			) : (
				<TableContainer component={Paper}>
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell>이름</TableCell>
								<TableCell>카테고리</TableCell>
								<TableCell>상태</TableCell>
								<TableCell>DAG 템플릿</TableCell>
								<TableCell>시작</TableCell>
								<TableCell>종료</TableCell>
								<TableCell>생성일</TableCell>
								<TableCell align="right">액션</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{items.length === 0 ? (
								<TableRow>
									<TableCell colSpan={8} align="center">캠페인 없음</TableCell>
								</TableRow>
							) : items.map((item) => (
								<TableRow key={item.id} hover>
									<TableCell>
										<Typography variant="body2" fontWeight={500}>{item.name}</Typography>
										<Typography variant="caption" color="text.secondary">{item.id.slice(0, 8)}…</Typography>
									</TableCell>
									<TableCell>{item.category}</TableCell>
									<TableCell>
										<Chip
											label={STATUS_LABEL[item.status]}
											color={STATUS_COLOR[item.status]}
											size="small"
										/>
									</TableCell>
									<TableCell>{item.dagTemplateId ?? '-'}</TableCell>
									<TableCell>{formatDate(item.startAt)}</TableCell>
									<TableCell>{formatDate(item.endAt)}</TableCell>
									<TableCell>{formatDate(item.createdAt)}</TableCell>
									<TableCell align="right">
										<Box display="flex" gap={0.5} justifyContent="flex-end">
											{getNextActions(item.status).map((action) => (
												<Button
													key={action}
													size="small"
													variant="outlined"
													disabled={actionLoading === item.id + action}
													onClick={() => handleStatusChange(item.id, action)}
												>
													{action === 'activate' ? '활성화' : action === 'pause' ? '일시정지' : '보관'}
												</Button>
											))}
											{item.status !== 'archived' && (
												<Button
													size="small"
													variant="contained"
													color="secondary"
													onClick={() => setDagOpen(item.id)}
												>
													DAG 실행
												</Button>
											)}
										</Box>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			{/* Create Dialog */}
			<Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
				<DialogTitle>캠페인 생성</DialogTitle>
				<DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
					<TextField
						label="이름"
						required
						value={createForm.name}
						onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
					/>
					<TextField
						label="카테고리"
						required
						value={createForm.category}
						onChange={(e) => setCreateForm((f) => ({ ...f, category: e.target.value }))}
					/>
					<FormControl>
						<InputLabel>DAG 템플릿</InputLabel>
						<Select
							value={createForm.dagTemplateId ?? ''}
							label="DAG 템플릿"
							onChange={(e) =>
								setCreateForm((f) => ({ ...f, dagTemplateId: (e.target.value as DagTemplateId) || undefined }))
							}
						>
							<MenuItem value="">기본값 (post)</MenuItem>
							{DAG_TEMPLATES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
						</Select>
					</FormControl>
					<TextField
						label="시작일 (ISO8601)"
						placeholder="2026-05-01T00:00:00Z"
						value={createForm.startAt ?? ''}
						onChange={(e) => setCreateForm((f) => ({ ...f, startAt: e.target.value || undefined }))}
					/>
					<TextField
						label="종료일 (ISO8601)"
						placeholder="2026-06-01T00:00:00Z"
						value={createForm.endAt ?? ''}
						onChange={(e) => setCreateForm((f) => ({ ...f, endAt: e.target.value || undefined }))}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setCreateOpen(false)}>취소</Button>
					<Button variant="contained" disabled={createLoading} onClick={handleCreate}>
						{createLoading ? <CircularProgress size={16} /> : '생성'}
					</Button>
				</DialogActions>
			</Dialog>

			{/* DAG Run Dialog */}
			<Dialog open={!!dagOpen} onClose={() => setDagOpen(null)} maxWidth="xs" fullWidth>
				<DialogTitle>DAG 수동 실행</DialogTitle>
				<DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
					<FormControl>
						<InputLabel>DAG 템플릿</InputLabel>
						<Select
							value={dagTemplate}
							label="DAG 템플릿"
							onChange={(e) => setDagTemplate(e.target.value as DagTemplateId | '')}
						>
							<MenuItem value="">캠페인 기본값</MenuItem>
							{DAG_TEMPLATES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
						</Select>
					</FormControl>
					<TextField
						label="실행 수 (1-10)"
						type="number"
						inputProps={{ min: 1, max: 10 }}
						value={dagCount}
						onChange={(e) => setDagCount(Math.max(1, Math.min(10, Number(e.target.value))))}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDagOpen(null)}>취소</Button>
					<Button variant="contained" disabled={dagLoading} onClick={handleDagRun}>
						{dagLoading ? <CircularProgress size={16} /> : '실행'}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
