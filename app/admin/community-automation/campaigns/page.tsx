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
	FormHelperText,
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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, isValid, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import type {
	Campaign,
	CampaignStatus,
	CommunityAutomationCategory,
	CommunityAutomationCategoryOption,
	CreateCampaignBody,
	DagTemplateId,
} from '@/app/services/admin/community-automation';
import {
	campaigns as campaignsApi,
	COMMUNITY_AUTOMATION_CATEGORY_OPTIONS,
	getCommunityAutomationCategoryLabel,
} from '@/app/services/admin/community-automation';

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

const DAG_TEMPLATE_OPTIONS: Array<{ value: DagTemplateId; label: string; helper: string }> = [
	{ value: 'post', label: '게시글 생성', helper: '새 커뮤니티 게시글을 생성합니다.' },
	{ value: 'auto_comment', label: '댓글 생성', helper: '자동화가 만든 게시글에 댓글을 생성합니다.' },
	{ value: 'target_comment', label: '특정 글 댓글', helper: '대상 게시글에 댓글을 생성합니다.' },
	{ value: 'reply', label: '대댓글 생성', helper: '대상 댓글에 답글을 생성합니다.' },
];

type CreateCampaignForm = Omit<CreateCampaignBody, 'category'> & {
	category: CommunityAutomationCategory | '';
};

function formatDisplayDate(iso: string | null) {
	if (!iso) return '-';
	return new Date(iso).toLocaleDateString('ko-KR');
}

function parseDateInput(value?: string) {
	if (!value) return null;
	const date = parseISO(value);
	return isValid(date) ? date : null;
}

function toDateInput(value: Date | null) {
	return value ? format(value, 'yyyy-MM-dd') : undefined;
}

function getDagTemplateLabel(template: string | null | undefined) {
	if (!template) return '게시글 생성';
	return DAG_TEMPLATE_OPTIONS.find((option) => option.value === template)?.label ?? template;
}

export default function CampaignsPage() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [items, setItems] = useState<Campaign[]>([]);
	const [categoryOptions, setCategoryOptions] = useState<CommunityAutomationCategoryOption[]>(COMMUNITY_AUTOMATION_CATEGORY_OPTIONS);
	const [statusFilter, setStatusFilter] = useState<CampaignStatus | ''>('');

	const [createOpen, setCreateOpen] = useState(false);
	const [createForm, setCreateForm] = useState<CreateCampaignForm>({ name: '', category: '' });
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
			const [data, categories] = await Promise.all([
				campaignsApi.list(statusFilter ? { status: statusFilter } : undefined),
				campaignsApi.categoryOptions(),
			]);
			setItems(data);
			setCategoryOptions(categories);
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
		if (createForm.startAt && createForm.endAt && createForm.startAt > createForm.endAt) {
			setError('종료일은 시작일과 같거나 이후여야 합니다.');
			return;
		}
		setCreateLoading(true);
		setSuccess(null);
		try {
			await campaignsApi.create({ ...createForm, category: createForm.category });
			setCreateOpen(false);
			setCreateForm({ name: '', category: '' });
			await load();
			setSuccess('캠페인을 생성했습니다.');
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '생성 실패');
		} finally {
			setCreateLoading(false);
		}
	}

	async function handleStatusChange(id: string, action: 'activate' | 'pause' | 'archive') {
		setActionLoading(id + action);
		setSuccess(null);
		try {
			await campaignsApi[action](id);
			await load();
			setSuccess('캠페인 상태를 변경했습니다.');
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '상태 변경 실패');
		} finally {
			setActionLoading(null);
		}
	}

	async function handleDagRun() {
		if (!dagOpen) return;
		setDagLoading(true);
		setSuccess(null);
		try {
			const result = await campaignsApi.triggerDagRun(dagOpen, {
				count: dagCount,
				dagTemplateId: dagTemplate || undefined,
			});
			setSuccess(`자동화 작업 ${result.jobsEnqueued}개를 큐에 등록했습니다.`);
			setDagOpen(null);
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '자동화 실행 실패');
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
			{success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

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
								<TableCell>자동화 유형</TableCell>
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
									<TableCell>{getCommunityAutomationCategoryLabel(item.category, categoryOptions)}</TableCell>
									<TableCell>
										<Chip
											label={STATUS_LABEL[item.status]}
											color={STATUS_COLOR[item.status]}
											size="small"
										/>
									</TableCell>
									<TableCell>{getDagTemplateLabel(item.dagTemplateId)}</TableCell>
									<TableCell>{formatDisplayDate(item.startAt)}</TableCell>
									<TableCell>{formatDisplayDate(item.endAt)}</TableCell>
									<TableCell>{formatDisplayDate(item.createdAt)}</TableCell>
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
													자동화 실행
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
					<FormControl required>
						<InputLabel>카테고리</InputLabel>
						<Select
							value={createForm.category}
							label="카테고리"
							onChange={(e) =>
								setCreateForm((f) => ({
									...f,
									category: e.target.value as CommunityAutomationCategory,
								}))
							}
						>
							<MenuItem value="" disabled>
								카테고리 선택
							</MenuItem>
							{categoryOptions.map((option) => (
								<MenuItem key={option.value} value={option.value}>
									{option.label}
								</MenuItem>
							))}
						</Select>
						<FormHelperText>운영 DB의 커뮤니티 카테고리 코드로 저장됩니다.</FormHelperText>
					</FormControl>
					<FormControl>
						<InputLabel>자동화 유형</InputLabel>
						<Select
							value={createForm.dagTemplateId ?? ''}
							label="자동화 유형"
							onChange={(e) =>
								setCreateForm((f) => ({ ...f, dagTemplateId: (e.target.value as DagTemplateId) || undefined }))
							}
						>
							<MenuItem value="">기본값: 게시글 생성</MenuItem>
							{DAG_TEMPLATE_OPTIONS.map((option) => (
								<MenuItem key={option.value} value={option.value}>
									<Box>
										<Typography variant="body2">{option.label}</Typography>
										<Typography variant="caption" color="text.secondary">{option.helper}</Typography>
									</Box>
								</MenuItem>
							))}
						</Select>
						<FormHelperText>생성할 커뮤니티 콘텐츠의 작업 유형입니다.</FormHelperText>
					</FormControl>
					<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
						<Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
							<DatePicker
								label="시작일"
								format="yyyy-MM-dd"
								value={parseDateInput(createForm.startAt)}
								onChange={(date) => setCreateForm((f) => ({ ...f, startAt: toDateInput(date) }))}
								slotProps={{ textField: { fullWidth: true, helperText: '비워두면 즉시 시작합니다.' } }}
							/>
							<DatePicker
								label="종료일"
								format="yyyy-MM-dd"
								value={parseDateInput(createForm.endAt)}
								minDate={parseDateInput(createForm.startAt) ?? undefined}
								onChange={(date) => setCreateForm((f) => ({ ...f, endAt: toDateInput(date) }))}
								slotProps={{ textField: { fullWidth: true, helperText: '비워두면 종료일 없이 운영합니다.' } }}
							/>
						</Box>
					</LocalizationProvider>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setCreateOpen(false)}>취소</Button>
					<Button variant="contained" disabled={createLoading} onClick={handleCreate}>
						{createLoading ? <CircularProgress size={16} /> : '생성'}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Automation Run Dialog */}
			<Dialog open={!!dagOpen} onClose={() => setDagOpen(null)} maxWidth="xs" fullWidth>
				<DialogTitle>자동화 수동 실행</DialogTitle>
				<DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
					<FormControl>
						<InputLabel>자동화 유형</InputLabel>
						<Select
							value={dagTemplate}
							label="자동화 유형"
							onChange={(e) => setDagTemplate(e.target.value as DagTemplateId | '')}
						>
							<MenuItem value="">캠페인 기본값</MenuItem>
							{DAG_TEMPLATE_OPTIONS.map((option) => (
								<MenuItem key={option.value} value={option.value}>
									{option.label}
								</MenuItem>
							))}
						</Select>
						<FormHelperText>DAG는 내부 실행 그래프 이름이라 화면에서는 자동화 유형으로 표시합니다.</FormHelperText>
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
