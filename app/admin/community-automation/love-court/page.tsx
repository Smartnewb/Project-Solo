'use client';

import { useEffect, useMemo, useState } from 'react';
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
	Divider,
	FormControl,
	IconButton,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	Stack,
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
import type { SelectChangeEvent } from '@mui/material/Select';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import {
	useLoveCourtMutations,
	useLoveCourtSubmission,
	useLoveCourtSubmissions,
} from '@/app/admin/hooks';
import type {
	LoveCourtOptionStatus,
	LoveCourtSubmission,
	LoveCourtSubmissionStatus,
	UpdateLoveCourtOptionCandidateBody,
} from '@/app/services/admin/love-court';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';

type StatusFilter = 'all' | LoveCourtSubmissionStatus;
type OptionStatusFilter = 'all' | LoveCourtOptionStatus;

const STATUS_LABEL: Record<LoveCourtSubmissionStatus, string> = {
	submitted: '접수',
	queued: '공개 대기',
	published: '공개 중',
	closed: '종료',
	archived: '보관',
	deleted_by_operator: '삭제',
};

const STATUS_COLOR: Record<
	LoveCourtSubmissionStatus,
	'default' | 'warning' | 'success' | 'error' | 'info'
> = {
	submitted: 'default',
	queued: 'info',
	published: 'success',
	closed: 'default',
	archived: 'default',
	deleted_by_operator: 'error',
};

const OPTION_STATUS_LABEL: Record<LoveCourtOptionStatus, string> = {
	pending: '생성 대기',
	generating: '생성 중',
	generated: '생성 완료',
	review_required: '검수 필요',
	approved: '승인',
	failed: '생성 실패',
};

const OPTION_STATUS_COLOR: Record<
	LoveCourtOptionStatus,
	'default' | 'warning' | 'success' | 'error' | 'info'
> = {
	pending: 'default',
	generating: 'info',
	generated: 'info',
	review_required: 'warning',
	approved: 'success',
	failed: 'error',
};

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
	{ value: 'all', label: '전체 상태' },
	{ value: 'submitted', label: STATUS_LABEL.submitted },
	{ value: 'queued', label: STATUS_LABEL.queued },
	{ value: 'published', label: STATUS_LABEL.published },
	{ value: 'closed', label: STATUS_LABEL.closed },
	{ value: 'archived', label: STATUS_LABEL.archived },
	{ value: 'deleted_by_operator', label: STATUS_LABEL.deleted_by_operator },
];

const OPTION_STATUS_OPTIONS: Array<{ value: OptionStatusFilter; label: string }> = [
	{ value: 'all', label: '전체 선택지' },
	{ value: 'review_required', label: OPTION_STATUS_LABEL.review_required },
	{ value: 'failed', label: OPTION_STATUS_LABEL.failed },
	{ value: 'approved', label: OPTION_STATUS_LABEL.approved },
	{ value: 'pending', label: OPTION_STATUS_LABEL.pending },
	{ value: 'generating', label: OPTION_STATUS_LABEL.generating },
	{ value: 'generated', label: OPTION_STATUS_LABEL.generated },
];

function formatDateTime(value: string | null | undefined): string {
	if (!value) return '-';
	return new Intl.DateTimeFormat('ko-KR', {
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(value));
}

function shortText(value: string | null | undefined, max = 72): string {
	if (!value) return '-';
	return value.length > max ? `${value.slice(0, max)}...` : value;
}

function normalizeOptions(
	options: UpdateLoveCourtOptionCandidateBody[],
): UpdateLoveCourtOptionCandidateBody[] {
	return options
		.map((option, index) => ({
			id: option.id,
			label: option.label.replace(/\s+/g, ' ').trim(),
			displayOrder: index,
		}))
		.filter((option) => option.label.length > 0);
}

function summarize(items: LoveCourtSubmission[]) {
	return {
		reviewRequired: items.filter((item) => item.optionStatus === 'review_required').length,
		failed: items.filter((item) => item.optionStatus === 'failed').length,
		queued: items.filter((item) => item.status === 'queued').length,
		published: items.filter((item) => item.status === 'published').length,
	};
}

function StatusChip({ status }: { status: LoveCourtSubmissionStatus }) {
	return <Chip size="small" color={STATUS_COLOR[status]} label={STATUS_LABEL[status]} />;
}

function OptionStatusChip({ status }: { status: LoveCourtOptionStatus }) {
	return (
		<Chip size="small" color={OPTION_STATUS_COLOR[status]} label={OPTION_STATUS_LABEL[status]} />
	);
}

export default function LoveCourtAdminPage() {
	const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
	const [optionStatusFilter, setOptionStatusFilter] =
		useState<OptionStatusFilter>('review_required');
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [editOptions, setEditOptions] = useState<UpdateLoveCourtOptionCandidateBody[]>([]);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deleteReason, setDeleteReason] = useState('');
	const [localError, setLocalError] = useState<string | null>(null);

	const listParams = useMemo(
		() => ({
			status: statusFilter === 'all' ? undefined : statusFilter,
			optionStatus: optionStatusFilter === 'all' ? undefined : optionStatusFilter,
			limit: 100,
		}),
		[optionStatusFilter, statusFilter],
	);
	const summaryParams = useMemo(() => ({ limit: 100 }), []);

	const submissionsQuery = useLoveCourtSubmissions(listParams);
	const summaryQuery = useLoveCourtSubmissions(summaryParams);
	const submissions = useMemo(
		() => submissionsQuery.data?.items ?? [],
		[submissionsQuery.data?.items],
	);
	const summaryItems = useMemo(
		() => summaryQuery.data?.items ?? [],
		[summaryQuery.data?.items],
	);
	const selectedQuery = useLoveCourtSubmission(selectedId);
	const selected =
		selectedQuery.data?.submission ?? submissions.find((submission) => submission.id === selectedId) ?? null;
	const mutations = useLoveCourtMutations();
	const counts = useMemo(() => summarize(summaryItems), [summaryItems]);
	const published = summaryItems.find((submission) => submission.status === 'published');
	const isBusy =
		mutations.updateOptions.isPending ||
		mutations.approveOptions.isPending ||
		mutations.regenerateOptions.isPending ||
		mutations.deleteSubmission.isPending;

	useEffect(() => {
		if (selectedId && submissions.some((submission) => submission.id === selectedId)) return;
		setSelectedId(submissions[0]?.id ?? null);
	}, [selectedId, submissions]);

	useEffect(() => {
		if (!selected?.options) {
			setEditOptions([]);
			return;
		}
		setEditOptions(
			[...selected.options]
				.sort((a, b) => a.displayOrder - b.displayOrder)
				.map((option) => ({
					id: option.id,
					label: option.label,
					displayOrder: option.displayOrder,
				})),
		);
	}, [selected?.id, selected?.options]);

	const queryError = submissionsQuery.error ?? summaryQuery.error ?? selectedQuery.error;
	const error = localError ?? (queryError ? getAdminErrorMessage(queryError, '불러오기 실패') : null);

	function handleStatusChange(event: SelectChangeEvent) {
		setStatusFilter(event.target.value as StatusFilter);
	}

	function handleOptionStatusChange(event: SelectChangeEvent) {
		setOptionStatusFilter(event.target.value as OptionStatusFilter);
	}

	function updateOptionLabel(index: number, label: string) {
		setEditOptions((prev) =>
			prev.map((option, optionIndex) =>
				optionIndex === index ? { ...option, label } : option,
			),
		);
	}

	function removeOption(index: number) {
		setEditOptions((prev) => prev.filter((_, optionIndex) => optionIndex !== index));
	}

	function addOption() {
		setEditOptions((prev) => [
			...prev,
			{ label: '', displayOrder: prev.length },
		]);
	}

	async function handleSaveOptions() {
		if (!selected) return;
		const options = normalizeOptions(editOptions);
		if (options.length < 2 || options.length > 4) {
			setLocalError('선택지는 2-4개여야 합니다.');
			return;
		}
		setLocalError(null);
		try {
			await mutations.updateOptions.mutateAsync({
				submissionId: selected.id,
				body: { options },
			});
		} catch (error) {
			setLocalError(getAdminErrorMessage(error, '선택지 저장 실패'));
		}
	}

	async function handleApprove() {
		if (!selected) return;
		setLocalError(null);
		try {
			await mutations.approveOptions.mutateAsync(selected.id);
		} catch (error) {
			setLocalError(getAdminErrorMessage(error, '승인 실패'));
		}
	}

	async function handleRegenerate() {
		if (!selected) return;
		setLocalError(null);
		try {
			await mutations.regenerateOptions.mutateAsync(selected.id);
		} catch (error) {
			setLocalError(getAdminErrorMessage(error, '선택지 재생성 실패'));
		}
	}

	async function handleDelete() {
		if (!selected) return;
		setLocalError(null);
		try {
			await mutations.deleteSubmission.mutateAsync({
				submissionId: selected.id,
				body: {
					reasonCode: 'operator_rejected',
					reasonMessage: deleteReason || '운영자 검수 기준에 따라 공개하지 않음',
				},
			});
			setDeleteOpen(false);
			setDeleteReason('');
		} catch (error) {
			setLocalError(getAdminErrorMessage(error, '삭제 실패'));
		}
	}

	return (
		<Box>
			<Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems={{ lg: 'center' }} mb={2}>
				<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
					<Paper variant="outlined" sx={{ px: 2, py: 1, minWidth: 128 }}>
						<Typography variant="caption" color="text.secondary">
							검수 필요
						</Typography>
						<Typography variant="h6">{counts.reviewRequired}</Typography>
					</Paper>
					<Paper variant="outlined" sx={{ px: 2, py: 1, minWidth: 128 }}>
						<Typography variant="caption" color="text.secondary">
							생성 실패
						</Typography>
						<Typography variant="h6">{counts.failed}</Typography>
					</Paper>
					<Paper variant="outlined" sx={{ px: 2, py: 1, minWidth: 128 }}>
						<Typography variant="caption" color="text.secondary">
							공개 대기
						</Typography>
						<Typography variant="h6">{counts.queued}</Typography>
					</Paper>
					<Paper variant="outlined" sx={{ px: 2, py: 1, minWidth: 128 }}>
						<Typography variant="caption" color="text.secondary">
							공개 중
						</Typography>
						<Typography variant="h6">{counts.published}</Typography>
					</Paper>
				</Stack>
				<Box flex={1} />
				<Stack direction="row" spacing={1} alignItems="center">
					<FormControl size="small" sx={{ minWidth: 140 }}>
						<InputLabel>상태</InputLabel>
						<Select value={statusFilter} label="상태" onChange={handleStatusChange}>
							{STATUS_OPTIONS.map((option) => (
								<MenuItem key={option.value} value={option.value}>
									{option.label}
								</MenuItem>
							))}
						</Select>
					</FormControl>
					<FormControl size="small" sx={{ minWidth: 150 }}>
						<InputLabel>선택지</InputLabel>
						<Select
							value={optionStatusFilter}
							label="선택지"
							onChange={handleOptionStatusChange}
						>
							{OPTION_STATUS_OPTIONS.map((option) => (
								<MenuItem key={option.value} value={option.value}>
									{option.label}
								</MenuItem>
							))}
						</Select>
					</FormControl>
					<Tooltip title="새로고침">
						<span>
							<IconButton onClick={() => submissionsQuery.refetch()} disabled={submissionsQuery.isFetching}>
								<RefreshIcon />
							</IconButton>
						</span>
					</Tooltip>
				</Stack>
			</Stack>

			{published && (
				<Alert severity="success" sx={{ mb: 2 }}>
					현재 공개 중: {published.title ?? published.id} · {formatDateTime(published.publishedAt)}
				</Alert>
			)}

			{error && (
				<Alert severity="error" sx={{ mb: 2 }} onClose={() => setLocalError(null)}>
					{error}
				</Alert>
			)}

			<Stack direction={{ xs: 'column', xl: 'row' }} spacing={2} alignItems="stretch">
				<TableContainer component={Paper} sx={{ flex: 1, minWidth: 0 }}>
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell>고민</TableCell>
								<TableCell>상태</TableCell>
								<TableCell>선택지</TableCell>
								<TableCell>큐</TableCell>
								<TableCell>접수</TableCell>
								<TableCell align="right">액션</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{submissionsQuery.isLoading ? (
								<TableRow>
									<TableCell colSpan={6} align="center" sx={{ py: 6 }}>
										<CircularProgress />
									</TableCell>
								</TableRow>
							) : submissions.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6} align="center" sx={{ py: 6 }}>
										<Typography color="text.secondary">표시할 제출건이 없습니다.</Typography>
									</TableCell>
								</TableRow>
							) : (
								submissions.map((submission) => (
									<TableRow
										key={submission.id}
										hover
										selected={submission.id === selectedId}
										onClick={() => setSelectedId(submission.id)}
										sx={{ cursor: 'pointer' }}
									>
										<TableCell sx={{ maxWidth: 420 }}>
											<Typography variant="body2" fontWeight={700} noWrap>
												{submission.title ?? submission.id}
											</Typography>
											<Typography variant="caption" color="text.secondary">
												{shortText(submission.body)}
											</Typography>
										</TableCell>
										<TableCell>
											<StatusChip status={submission.status} />
										</TableCell>
										<TableCell>
											<Stack spacing={0.5}>
												<OptionStatusChip status={submission.optionStatus} />
												<Typography variant="caption" color="text.secondary">
													{submission.options?.length ?? 0}개
												</Typography>
											</Stack>
										</TableCell>
										<TableCell>
											<Typography variant="body2">
												{submission.queuePosition ? `${submission.queuePosition}번` : '-'}
											</Typography>
										</TableCell>
										<TableCell>
											<Typography variant="body2">{formatDateTime(submission.createdAt)}</Typography>
										</TableCell>
										<TableCell align="right">
											<Button size="small" variant="outlined">
												보기
											</Button>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</TableContainer>

				<Paper variant="outlined" sx={{ width: { xs: '100%', xl: 520 }, p: 2 }}>
					{selected ? (
						<Stack spacing={2}>
							<Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
								<Box minWidth={0}>
									<Typography variant="h6" fontWeight={700}>
										{selected.title ?? selected.id}
									</Typography>
									<Typography variant="caption" color="text.secondary">
										{selected.id}
									</Typography>
								</Box>
								<Stack direction="row" spacing={0.75}>
									<StatusChip status={selected.status} />
									<OptionStatusChip status={selected.optionStatus} />
								</Stack>
							</Stack>

							<Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
								{selected.body}
							</Typography>

							{selected.optionGenerationError && (
								<Alert severity="error">{selected.optionGenerationError}</Alert>
							)}

							<Divider />

							<Stack spacing={1.25}>
								<Stack direction="row" justifyContent="space-between" alignItems="center">
									<Typography variant="subtitle2" fontWeight={700}>
										선택지
									</Typography>
									<Button size="small" onClick={addOption} disabled={editOptions.length >= 4 || isBusy}>
										추가
									</Button>
								</Stack>
								{editOptions.length === 0 ? (
									<Typography variant="body2" color="text.secondary">
										선택지가 없습니다.
									</Typography>
								) : (
									editOptions.map((option, index) => (
										<Stack key={`${option.id ?? 'new'}-${index}`} direction="row" spacing={1} alignItems="center">
											<TextField
												size="small"
												fullWidth
												value={option.label}
												onChange={(event) => updateOptionLabel(index, event.target.value)}
												inputProps={{ maxLength: 100 }}
											/>
											<Tooltip title="선택지 제거">
												<span>
													<IconButton
														size="small"
														onClick={() => removeOption(index)}
														disabled={editOptions.length <= 2 || isBusy}
													>
														<DeleteOutlineIcon fontSize="small" />
													</IconButton>
												</span>
											</Tooltip>
										</Stack>
									))
								)}
							</Stack>

							<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
								<Button
									variant="outlined"
									startIcon={<SaveIcon />}
									disabled={!selected || editOptions.length < 2 || isBusy}
									onClick={handleSaveOptions}
								>
									저장
								</Button>
								<Button
									variant="contained"
									color="success"
									startIcon={<CheckCircleIcon />}
									disabled={!selected || editOptions.length < 2 || isBusy}
									onClick={handleApprove}
								>
									승인
								</Button>
								<Button
									variant="outlined"
									startIcon={<AutoFixHighIcon />}
									disabled={!selected || isBusy}
									onClick={handleRegenerate}
								>
									재생성
								</Button>
								<Button
									variant="outlined"
									color="error"
									startIcon={<DeleteOutlineIcon />}
									disabled={!selected || isBusy}
									onClick={() => setDeleteOpen(true)}
								>
									삭제
								</Button>
							</Stack>

							<Divider />

							<Stack spacing={0.75}>
								<Typography variant="caption" color="text.secondary">
									카테고리: {selected.category ?? '-'}
								</Typography>
								<Typography variant="caption" color="text.secondary">
									큐 진입: {formatDateTime(selected.queueEnteredAt)}
								</Typography>
								<Typography variant="caption" color="text.secondary">
									공개: {formatDateTime(selected.publishedAt)}
								</Typography>
								<Typography variant="caption" color="text.secondary">
									Case ID: {selected.caseId ?? '-'}
								</Typography>
							</Stack>
						</Stack>
					) : (
						<Box display="flex" alignItems="center" justifyContent="center" minHeight={360}>
							<Typography color="text.secondary">제출건을 선택하세요.</Typography>
						</Box>
					)}
				</Paper>
			</Stack>

			<Dialog open={deleteOpen} onClose={() => !isBusy && setDeleteOpen(false)} fullWidth maxWidth="sm">
				<DialogTitle>제출건 삭제</DialogTitle>
				<DialogContent>
					<TextField
						autoFocus
						margin="dense"
						fullWidth
						multiline
						minRows={3}
						label="사유"
						value={deleteReason}
						onChange={(event) => setDeleteReason(event.target.value)}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDeleteOpen(false)} disabled={isBusy}>
						취소
					</Button>
					<Button color="error" variant="contained" onClick={handleDelete} disabled={isBusy}>
						삭제
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
