'use client';

import { useMemo, useState } from 'react';
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
	Grid,
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
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EditIcon from '@mui/icons-material/Edit';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import RefreshIcon from '@mui/icons-material/Refresh';
import TodayIcon from '@mui/icons-material/Today';
import type {
	CommunityQuestionCalendarDay,
	CommunityQuestionCandidate,
	CommunityQuestionCountry,
	CommunityQuestionScope,
	CommunityQuestionStatus,
	CommunityQuestionTargetScope,
} from '@/app/services/admin/community-questions';
import {
	useCommunityQuestionBatch,
	useCommunityQuestionBatches,
	useCommunityQuestionCalendar,
	useCommunityQuestionMutations,
} from '@/app/admin/hooks';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const STATUS_LABELS: Record<string, string> = {
	draft: '초안',
	scheduled: '예약',
	published: '게시',
	closed: '마감',
	archived: '보관',
	generating: '생성 중',
	generated: '생성 완료',
	failed: '실패',
	partially_assigned: '일부 배정',
	assigned: '배정 완료',
	pending: '대기',
	approved: '승인',
	rejected: '폐기',
};

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
	draft: 'default',
	scheduled: 'info',
	published: 'success',
	closed: 'default',
	archived: 'default',
	generating: 'warning',
	generated: 'info',
	failed: 'error',
	partially_assigned: 'warning',
	assigned: 'success',
	pending: 'default',
	approved: 'primary',
	rejected: 'error',
};

function toDateKey(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

function addDays(date: Date, amount: number): Date {
	const next = new Date(date);
	next.setDate(next.getDate() + amount);
	return next;
}

function startOfWeek(date: Date): Date {
	const next = new Date(date);
	next.setDate(next.getDate() - next.getDay());
	return next;
}

function endOfWeek(date: Date): Date {
	return addDays(startOfWeek(date), 6);
}

function startOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth() + 1, 0);
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

function formatDateTime(value?: string | null): string {
	if (!value) return '-';
	return new Intl.DateTimeFormat('ko-KR', {
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(value));
}

function dateTimeLocalValue(value?: string | null): string {
	if (!value) return '';
	const date = new Date(value);
	const offset = date.getTimezoneOffset();
	const local = new Date(date.getTime() - offset * 60_000);
	return local.toISOString().slice(0, 16);
}

function splitLines(value: string): string[] {
	return value
		.split(/\n|,/)
		.map((item) => item.trim())
		.filter(Boolean);
}

function statusChip(status?: string | null) {
	if (!status) return null;
	return (
		<Chip
			size="small"
			color={STATUS_COLORS[status] ?? 'default'}
			label={STATUS_LABELS[status] ?? status}
		/>
	);
}

function scopeLabel(scope?: CommunityQuestionTargetScope | null): string {
	if (!scope) return '전체';
	if (scope.scope === 'all') return '전체';
	if (scope.scope === 'university') return scope.universityCode ?? scope.universityId ?? '학교';
	if (scope.scope === 'region') return scope.regionCodes?.join(', ') || '지역';
	if (scope.scope === 'cluster') return scope.regionCodes?.join(', ') || '클러스터';
	return scope.scope;
}

function normalizeOptions(candidate: CommunityQuestionCandidate): string[] {
	return candidate.finalOptions?.length ? candidate.finalOptions : candidate.options;
}

function displayTitle(candidate: CommunityQuestionCandidate): string {
	return candidate.finalTitle || candidate.title;
}

function displayDescription(candidate: CommunityQuestionCandidate): string {
	return candidate.finalDescription || candidate.description || '';
}

function canAssign(candidate: CommunityQuestionCandidate): boolean {
	return candidate.status === 'approved';
}

function canEdit(candidate: CommunityQuestionCandidate): boolean {
	return candidate.status !== 'assigned' && candidate.status !== 'published';
}

interface CandidateDialogState {
	type: 'edit' | 'assign' | 'reject' | null;
	candidate: CommunityQuestionCandidate | null;
}

interface ScheduleDialogState {
	question: CommunityQuestionCalendarDay['question'] | null;
}

export default function CommunityQuestionPlannerClient() {
	const today = useMemo(() => new Date(), []);
	const [country, setCountry] = useState<CommunityQuestionCountry>('kr');
	const [scope, setScope] = useState<CommunityQuestionScope>('all');
	const [month, setMonth] = useState(() => startOfMonth(today));
	const [selectedDate, setSelectedDate] = useState(() => toDateKey(today));
	const [batchFilters, setBatchFilters] = useState(() => ({
		from: toDateKey(startOfWeek(today)),
		to: toDateKey(endOfWeek(today)),
	}));
	const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
	const [formError, setFormError] = useState<string | null>(null);
	const [dialog, setDialog] = useState<CandidateDialogState>({ type: null, candidate: null });
	const [scheduleDialog, setScheduleDialog] = useState<ScheduleDialogState>({ question: null });

	const calendarParams = useMemo(
		() => ({
			country,
			from: toDateKey(startOfMonth(month)),
			to: toDateKey(endOfMonth(month)),
			scope,
		}),
		[country, month, scope],
	);
	const batchesQuery = useCommunityQuestionBatches({ country, ...batchFilters });
	const batchQuery = useCommunityQuestionBatch(selectedBatchId);
	const calendarQuery = useCommunityQuestionCalendar(calendarParams);
	const mutations = useCommunityQuestionMutations();

	const daysByDate = useMemo(() => {
		const map = new Map<string, CommunityQuestionCalendarDay>();
		for (const day of calendarQuery.data?.days ?? []) map.set(day.date, day);
		return map;
	}, [calendarQuery.data?.days]);

	const calendarDays = useMemo(() => buildCalendarGrid(month), [month]);
	const selectedDay = daysByDate.get(selectedDate);

	const latestError =
		mutations.generateBatch.error ||
		mutations.createQuestion.error ||
		mutations.updateCandidate.error ||
		mutations.approveCandidate.error ||
		mutations.rejectCandidate.error ||
		mutations.assignCandidate.error ||
		mutations.unassignCandidate.error ||
		mutations.updateSchedule.error ||
		calendarQuery.error ||
		batchesQuery.error ||
		batchQuery.error;

	const isMutating = [
		mutations.generateBatch,
		mutations.createQuestion,
		mutations.updateCandidate,
		mutations.approveCandidate,
		mutations.rejectCandidate,
		mutations.assignCandidate,
		mutations.unassignCandidate,
		mutations.updateSchedule,
	].some((mutation) => mutation.isPending);

	const refreshAll = () => {
		calendarQuery.refetch();
		batchesQuery.refetch();
		if (selectedBatchId) batchQuery.refetch();
	};

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

	const handleGenerate = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setFormError(null);
		const form = new FormData(event.currentTarget);
		const startDate = String(form.get('startDate') || '');
		const endDate = String(form.get('endDate') || '');
		const candidatesPerDay = Number(form.get('candidatesPerDay') || 3);
		if (!startDate || !endDate) {
			setFormError('생성 기간을 입력해주세요.');
			return;
		}

		const result = await mutations.generateBatch.mutateAsync({
			country,
			startDate,
			endDate,
			targetScope: { scope },
			candidatesPerDay,
			operatorMemo: String(form.get('operatorMemo') || '').trim() || undefined,
			externalTrends: splitLines(String(form.get('externalTrends') || '')),
			includeKeywords: splitLines(String(form.get('includeKeywords') || '')),
			excludeKeywords: splitLines(String(form.get('excludeKeywords') || '')),
			seasonHints: splitLines(String(form.get('seasonHints') || '')),
		});
		setBatchFilters({ from: startDate, to: endDate });
		setSelectedBatchId(result.batchId);
	};

	const handleCreateQuestion = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setFormError(null);
		const form = new FormData(event.currentTarget);
		const title = String(form.get('title') || '').trim();
		const options = splitLines(String(form.get('options') || ''));
		if (!title || options.length < 2) {
			setFormError('질문 제목과 2개 이상의 선택지를 입력해주세요.');
			return;
		}
		await mutations.createQuestion.mutateAsync({
			title,
			description: String(form.get('description') || '').trim() || undefined,
			options,
			status: String(form.get('status') || 'scheduled') as CommunityQuestionStatus,
			categoryCode: String(form.get('categoryCode') || 'general').trim() || 'general',
			sourceTheme: String(form.get('sourceTheme') || '').trim() || undefined,
			publishAt: String(form.get('publishAt') || '') || undefined,
			closeAt: String(form.get('closeAt') || '') || undefined,
		});
		event.currentTarget.reset();
	};

	return (
		<Box>
			<Stack
				direction={{ xs: 'column', md: 'row' }}
				alignItems={{ xs: 'stretch', md: 'center' }}
				justifyContent="space-between"
				spacing={2}
				sx={{ mb: 3 }}
			>
				<Box>
					<Typography variant="h6" fontWeight={800}>
						주간 질문 생성 및 관리
					</Typography>
					<Typography variant="body2" color="text.secondary">
						LLM 후보 생성, 검수, 주간 배정, 캘린더 일정을 한 화면에서 관리합니다.
					</Typography>
				</Box>
				<Stack direction="row" spacing={1} alignItems="center">
					<FormControl size="small" sx={{ minWidth: 96 }}>
						<InputLabel>국가</InputLabel>
						<Select
							label="국가"
							value={country}
							onChange={(event) => setCountry(event.target.value as CommunityQuestionCountry)}
						>
							<MenuItem value="kr">KR</MenuItem>
							<MenuItem value="jp">JP</MenuItem>
						</Select>
					</FormControl>
					<FormControl size="small" sx={{ minWidth: 120 }}>
						<InputLabel>범위</InputLabel>
						<Select
							label="범위"
							value={scope}
							onChange={(event) => setScope(event.target.value as CommunityQuestionScope)}
						>
							<MenuItem value="all">전체</MenuItem>
							<MenuItem value="cluster">클러스터</MenuItem>
							<MenuItem value="region">지역</MenuItem>
							<MenuItem value="university">학교</MenuItem>
						</Select>
					</FormControl>
					<Tooltip title="오늘">
						<IconButton onClick={goToday}>
							<TodayIcon />
						</IconButton>
					</Tooltip>
					<Tooltip title="새로고침">
						<IconButton onClick={refreshAll}>
							<RefreshIcon />
						</IconButton>
					</Tooltip>
				</Stack>
			</Stack>

			{formError ? (
				<Alert severity="warning" sx={{ mb: 2 }} onClose={() => setFormError(null)}>
					{formError}
				</Alert>
			) : null}
			{latestError ? (
				<Alert severity="error" sx={{ mb: 2 }}>
					{getAdminErrorMessage(latestError, '커뮤니티 질문 관리 요청에 실패했습니다.')}
				</Alert>
			) : null}

			<Grid container spacing={2}>
				<Grid item xs={12} lg={4}>
					<Stack spacing={2}>
						<Paper component="form" onSubmit={handleGenerate} sx={{ p: 2 }}>
							<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
								<AutoAwesomeIcon color="primary" />
								<Typography variant="subtitle1" fontWeight={800}>
									주간 후보 생성
								</Typography>
							</Stack>
							<Stack spacing={1.5}>
								<Stack direction="row" spacing={1}>
									<TextField
										name="startDate"
										label="시작일"
										type="date"
										size="small"
										defaultValue={toDateKey(startOfWeek(today))}
										InputLabelProps={{ shrink: true }}
										fullWidth
									/>
									<TextField
										name="endDate"
										label="종료일"
										type="date"
										size="small"
										defaultValue={toDateKey(endOfWeek(today))}
										InputLabelProps={{ shrink: true }}
										fullWidth
									/>
								</Stack>
								<TextField
									name="candidatesPerDay"
									label="일별 후보 수"
									type="number"
									size="small"
									defaultValue={3}
									inputProps={{ min: 1, max: 5 }}
								/>
								<TextField
									name="operatorMemo"
									label="운영 메모"
									size="small"
									multiline
									minRows={2}
									placeholder="예: 시험 끝난 주라 회복/약속 질문 위주"
								/>
								<TextField name="externalTrends" label="외부 트렌드" size="small" multiline minRows={2} />
								<TextField name="includeKeywords" label="포함 키워드" size="small" />
								<TextField name="excludeKeywords" label="제외 키워드" size="small" />
								<TextField name="seasonHints" label="시즌 힌트" size="small" />
								<Button
									type="submit"
									variant="contained"
									startIcon={mutations.generateBatch.isPending ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
									disabled={isMutating}
								>
									후보 생성
								</Button>
							</Stack>
						</Paper>

						<Paper component="form" onSubmit={handleCreateQuestion} sx={{ p: 2 }}>
							<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
								<AddIcon color="primary" />
								<Typography variant="subtitle1" fontWeight={800}>
									수동 질문 생성
								</Typography>
							</Stack>
							<Stack spacing={1.5}>
								<TextField name="title" label="질문 제목" size="small" required />
								<TextField name="description" label="설명" size="small" multiline minRows={2} />
								<TextField
									name="options"
									label="선택지"
									size="small"
									required
									multiline
									minRows={4}
									placeholder="한 줄에 하나씩 입력"
								/>
								<Stack direction="row" spacing={1}>
									<FormControl size="small" fullWidth>
										<InputLabel>상태</InputLabel>
										<Select name="status" label="상태" defaultValue="scheduled">
											<MenuItem value="draft">초안</MenuItem>
											<MenuItem value="scheduled">예약</MenuItem>
											<MenuItem value="published">게시</MenuItem>
										</Select>
									</FormControl>
									<TextField name="categoryCode" label="카테고리" size="small" defaultValue="general" />
								</Stack>
								<TextField name="sourceTheme" label="소스 테마" size="small" />
								<Stack direction="row" spacing={1}>
									<TextField
										name="publishAt"
										label="게시 시각"
										type="datetime-local"
										size="small"
										InputLabelProps={{ shrink: true }}
										fullWidth
									/>
									<TextField
										name="closeAt"
										label="마감 시각"
										type="datetime-local"
										size="small"
										InputLabelProps={{ shrink: true }}
										fullWidth
									/>
								</Stack>
								<Button
									type="submit"
									variant="outlined"
									startIcon={mutations.createQuestion.isPending ? <CircularProgress size={16} /> : <AddIcon />}
									disabled={isMutating}
								>
									질문 생성
								</Button>
							</Stack>
						</Paper>
					</Stack>
				</Grid>

				<Grid item xs={12} lg={8}>
					<Stack spacing={2}>
						<CalendarPanel
							month={month}
							selectedDate={selectedDate}
							days={calendarDays}
							daysByDate={daysByDate}
							isFetching={calendarQuery.isFetching}
							onMoveMonth={moveMonth}
							onSelectDate={setSelectedDate}
							onOpenSchedule={(question) => setScheduleDialog({ question })}
						/>
						<SelectedDayPanel day={selectedDay} selectedDate={selectedDate} />
						<BatchPanel
							from={batchFilters.from}
							to={batchFilters.to}
							onChangeFilters={setBatchFilters}
							batches={batchesQuery.data?.items ?? []}
							selectedBatchId={selectedBatchId}
							onSelectBatch={setSelectedBatchId}
							batch={batchQuery.data ?? null}
							isLoading={batchesQuery.isLoading || batchQuery.isLoading}
							onEdit={(candidate) => setDialog({ type: 'edit', candidate })}
							onAssign={(candidate) => setDialog({ type: 'assign', candidate })}
							onReject={(candidate) => setDialog({ type: 'reject', candidate })}
							onApprove={(candidate) => mutations.approveCandidate.mutate(candidate.id)}
							onUnassign={(candidate) => mutations.unassignCandidate.mutate(candidate.id)}
							isMutating={isMutating}
						/>
					</Stack>
				</Grid>
			</Grid>

			<CandidateActionDialog
				state={dialog}
				scope={scope}
				isMutating={isMutating}
				onClose={() => setDialog({ type: null, candidate: null })}
				onSaveEdit={(candidateId, body) =>
					mutations.updateCandidate.mutateAsync({ candidateId, body })
				}
				onAssign={(candidateId, body) =>
					mutations.assignCandidate.mutateAsync({ candidateId, body })
				}
				onReject={(candidateId, body) =>
					mutations.rejectCandidate.mutateAsync({ candidateId, body })
				}
			/>
			<ScheduleDialog
				state={scheduleDialog}
				isMutating={isMutating}
				onClose={() => setScheduleDialog({ question: null })}
				onSave={(questionId, body) =>
					mutations.updateSchedule.mutateAsync({ questionId, body })
				}
			/>
		</Box>
	);
}

function CalendarPanel({
	month,
	selectedDate,
	days,
	daysByDate,
	isFetching,
	onMoveMonth,
	onSelectDate,
	onOpenSchedule,
}: {
	month: Date;
	selectedDate: string;
	days: Date[];
	daysByDate: Map<string, CommunityQuestionCalendarDay>;
	isFetching: boolean;
	onMoveMonth: (amount: number) => void;
	onSelectDate: (date: string) => void;
	onOpenSchedule: (question: CommunityQuestionCalendarDay['question']) => void;
}) {
	return (
		<Paper sx={{ p: 2 }}>
			<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
				<Stack direction="row" alignItems="center" spacing={1}>
					<CalendarMonthIcon color="primary" />
					<Typography variant="subtitle1" fontWeight={800}>
						주간 캘린더
					</Typography>
					{isFetching ? <CircularProgress size={18} /> : null}
				</Stack>
				<Stack direction="row" alignItems="center" spacing={1}>
					<IconButton size="small" onClick={() => onMoveMonth(-1)}>
						<ChevronLeftIcon />
					</IconButton>
					<Typography variant="body2" fontWeight={800} sx={{ minWidth: 96, textAlign: 'center' }}>
						{formatMonthLabel(month)}
					</Typography>
					<IconButton size="small" onClick={() => onMoveMonth(1)}>
						<ChevronRightIcon />
					</IconButton>
				</Stack>
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
						<Typography variant="caption" fontWeight={800}>
							{weekday}
						</Typography>
					</Box>
				))}
				{days.map((date) => {
					const key = toDateKey(date);
					const day = daysByDate.get(key);
					const question = day?.question;
					const selected = key === selectedDate;
					const inMonth = date.getMonth() === month.getMonth();
					return (
						<Box
							key={key}
							component="button"
							onClick={() => onSelectDate(key)}
							sx={{
								minHeight: 132,
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
							<Stack direction="row" justifyContent="space-between" alignItems="center">
								<Typography variant="body2" fontWeight={800}>
									{date.getDate()}
								</Typography>
								{question ? (
									<Tooltip title="일정 수정">
										<IconButton
											size="small"
											onClick={(event) => {
												event.stopPropagation();
												onOpenSchedule(question);
											}}
										>
											<EditIcon fontSize="small" />
										</IconButton>
									</Tooltip>
								) : null}
							</Stack>
							{question ? (
								<Stack spacing={0.75} sx={{ mt: 1 }}>
									{statusChip(question.status)}
									<Typography variant="caption" fontWeight={700} sx={{ display: 'block' }}>
										{question.title}
									</Typography>
									<Typography variant="caption" color="text.secondary">
										{formatDateTime(question.publishAt)}
									</Typography>
								</Stack>
							) : (
								<Stack spacing={0.75} sx={{ mt: 1 }}>
									<Chip size="small" variant="outlined" label="질문 없음" />
									<Typography variant="caption" color="text.secondary">
										후보 승인 후 배정 가능
									</Typography>
								</Stack>
							)}
							{day?.candidateSummary ? (
								<Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
									후보 대기 {day.candidateSummary.pending} · 승인 {day.candidateSummary.approved}
								</Typography>
							) : null}
						</Box>
					);
				})}
			</Box>
		</Paper>
	);
}

function SelectedDayPanel({
	day,
	selectedDate,
}: {
	day?: CommunityQuestionCalendarDay;
	selectedDate: string;
}) {
	const question = day?.question;
	return (
		<Paper sx={{ p: 2 }}>
			<Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
				{selectedDate} 일정
			</Typography>
			{question ? (
				<Stack spacing={1}>
					<Stack direction="row" spacing={1} alignItems="center">
						{statusChip(question.status)}
						<Chip size="small" variant="outlined" label={scopeLabel(question.targetScope)} />
						<Chip size="small" variant="outlined" label={question.sourceType ?? 'source 없음'} />
					</Stack>
					<Typography variant="body1" fontWeight={800}>
						{question.title}
					</Typography>
					<Typography variant="body2" color="text.secondary">
						게시 {formatDateTime(question.publishAt)} · 마감 {formatDateTime(question.closeAt)}
					</Typography>
				</Stack>
			) : (
				<Stack direction="row" alignItems="center" spacing={1} color="text.secondary">
					<EventBusyIcon fontSize="small" />
					<Typography variant="body2">선택한 날짜에 배정된 질문이 없습니다.</Typography>
				</Stack>
			)}
		</Paper>
	);
}

function BatchPanel({
	from,
	to,
	onChangeFilters,
	batches,
	selectedBatchId,
	onSelectBatch,
	batch,
	isLoading,
	onEdit,
	onAssign,
	onReject,
	onApprove,
	onUnassign,
	isMutating,
}: {
	from: string;
	to: string;
	onChangeFilters: (value: { from: string; to: string }) => void;
	batches: Array<{ id: string; startDate: string; endDate: string; status: string; generatedCount: number; assignedCount: number; createdAt?: string }>;
	selectedBatchId: string | null;
	onSelectBatch: (id: string) => void;
	batch: { weeklyTheme?: string | null; days: Array<{ date: string; dayTheme?: string | null; candidates: CommunityQuestionCandidate[] }> } | null;
	isLoading: boolean;
	onEdit: (candidate: CommunityQuestionCandidate) => void;
	onAssign: (candidate: CommunityQuestionCandidate) => void;
	onReject: (candidate: CommunityQuestionCandidate) => void;
	onApprove: (candidate: CommunityQuestionCandidate) => void;
	onUnassign: (candidate: CommunityQuestionCandidate) => void;
	isMutating: boolean;
}) {
	return (
		<Paper sx={{ p: 2 }}>
			<Stack
				direction={{ xs: 'column', sm: 'row' }}
				justifyContent="space-between"
				alignItems={{ xs: 'stretch', sm: 'center' }}
				spacing={1}
				sx={{ mb: 2 }}
			>
				<Typography variant="subtitle1" fontWeight={800}>
					후보 batch
				</Typography>
				<Stack direction="row" spacing={1}>
					<TextField
						type="date"
						size="small"
						label="From"
						value={from}
						onChange={(event) => onChangeFilters({ from: event.target.value, to })}
						InputLabelProps={{ shrink: true }}
					/>
					<TextField
						type="date"
						size="small"
						label="To"
						value={to}
						onChange={(event) => onChangeFilters({ from, to: event.target.value })}
						InputLabelProps={{ shrink: true }}
					/>
				</Stack>
			</Stack>
			{isLoading ? (
				<Box sx={{ py: 4, textAlign: 'center' }}>
					<CircularProgress />
				</Box>
			) : (
				<Grid container spacing={2}>
					<Grid item xs={12} md={4}>
						<Stack spacing={1}>
							{batches.length === 0 ? (
								<Typography variant="body2" color="text.secondary">
									조회 기간에 생성된 batch가 없습니다.
								</Typography>
							) : (
								batches.map((item) => (
									<Paper
										key={item.id}
										component="button"
										onClick={() => onSelectBatch(item.id)}
										variant="outlined"
										sx={{
											p: 1.5,
											textAlign: 'left',
											cursor: 'pointer',
											borderColor: selectedBatchId === item.id ? 'primary.main' : 'divider',
											bgcolor: selectedBatchId === item.id ? 'primary.50' : 'background.paper',
										}}
									>
										<Stack spacing={0.75}>
											<Stack direction="row" justifyContent="space-between" alignItems="center">
												<Typography variant="body2" fontWeight={800}>
													{item.startDate} ~ {item.endDate}
												</Typography>
												{statusChip(item.status)}
											</Stack>
											<Typography variant="caption" color="text.secondary">
												후보 {item.generatedCount} · 배정 {item.assignedCount}
											</Typography>
										</Stack>
									</Paper>
								))
							)}
						</Stack>
					</Grid>
					<Grid item xs={12} md={8}>
						{batch ? (
							<Stack spacing={2}>
								{batch.weeklyTheme ? (
									<Alert severity="info">{batch.weeklyTheme}</Alert>
								) : null}
								{batch.days.map((day) => (
									<Box key={day.date}>
										<Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
											{day.date}
											{day.dayTheme ? ` · ${day.dayTheme}` : ''}
										</Typography>
										<Stack spacing={1}>
											{day.candidates.map((candidate) => (
												<CandidateRow
													key={candidate.id}
													candidate={candidate}
													onEdit={onEdit}
													onAssign={onAssign}
													onReject={onReject}
													onApprove={onApprove}
													onUnassign={onUnassign}
													isMutating={isMutating}
												/>
											))}
										</Stack>
									</Box>
								))}
							</Stack>
						) : (
							<Box sx={{ py: 5, textAlign: 'center', color: 'text.secondary' }}>
								왼쪽에서 batch를 선택하면 후보를 검수할 수 있습니다.
							</Box>
						)}
					</Grid>
				</Grid>
			)}
		</Paper>
	);
}

function CandidateRow({
	candidate,
	onEdit,
	onAssign,
	onReject,
	onApprove,
	onUnassign,
	isMutating,
}: {
	candidate: CommunityQuestionCandidate;
	onEdit: (candidate: CommunityQuestionCandidate) => void;
	onAssign: (candidate: CommunityQuestionCandidate) => void;
	onReject: (candidate: CommunityQuestionCandidate) => void;
	onApprove: (candidate: CommunityQuestionCandidate) => void;
	onUnassign: (candidate: CommunityQuestionCandidate) => void;
	isMutating: boolean;
}) {
	const options = normalizeOptions(candidate);
	const hardRisk = (candidate.riskFlags ?? []).some((flag) => flag.toLowerCase().includes('hard'));
	return (
		<Paper variant="outlined" sx={{ p: 1.5 }}>
			<Stack spacing={1}>
				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between">
					<Box sx={{ minWidth: 0 }}>
						<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
							{statusChip(candidate.status)}
							{candidate.scores?.totalScore ? (
								<Chip size="small" variant="outlined" label={`점수 ${candidate.scores.totalScore}`} />
							) : null}
							{candidate.riskFlags?.map((flag) => (
								<Chip key={flag} size="small" color={flag.toLowerCase().includes('hard') ? 'error' : 'warning'} label={flag} />
							))}
						</Stack>
						<Typography variant="body2" fontWeight={800} sx={{ mt: 0.75 }}>
							{displayTitle(candidate)}
						</Typography>
						{displayDescription(candidate) ? (
							<Typography variant="caption" color="text.secondary">
								{displayDescription(candidate)}
							</Typography>
						) : null}
					</Box>
					<Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
						<Button size="small" variant="outlined" disabled={!canEdit(candidate) || isMutating} onClick={() => onEdit(candidate)}>
							수정
						</Button>
						<Button size="small" variant="outlined" disabled={candidate.status !== 'pending' || hardRisk || isMutating} onClick={() => onApprove(candidate)}>
							승인
						</Button>
						<Button size="small" color="error" variant="outlined" disabled={candidate.status === 'assigned' || isMutating} onClick={() => onReject(candidate)}>
							폐기
						</Button>
						<Button size="small" variant="contained" disabled={!canAssign(candidate) || isMutating} onClick={() => onAssign(candidate)}>
							배정
						</Button>
						<Button size="small" color="warning" disabled={candidate.status !== 'assigned' || isMutating} onClick={() => onUnassign(candidate)}>
							배정 취소
						</Button>
					</Stack>
				</Stack>
				<Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
					{options.map((option) => (
						<Chip key={option} size="small" label={option} />
					))}
				</Stack>
				{candidate.rejectionReason ? (
					<Typography variant="caption" color="error">
						폐기 사유: {candidate.rejectionReason}
					</Typography>
				) : null}
			</Stack>
		</Paper>
	);
}

function CandidateActionDialog({
	state,
	scope,
	isMutating,
	onClose,
	onSaveEdit,
	onAssign,
	onReject,
}: {
	state: CandidateDialogState;
	scope: CommunityQuestionScope;
	isMutating: boolean;
	onClose: () => void;
	onSaveEdit: (candidateId: string, body: { title?: string; description?: string; options?: string[]; targetDate?: string; sourceTheme?: string }) => Promise<unknown>;
	onAssign: (candidateId: string, body: { publishAt: string; closeAt: string; targetScope: CommunityQuestionTargetScope; categoryCode?: string }) => Promise<unknown>;
	onReject: (candidateId: string, body: { reason: string }) => Promise<unknown>;
}) {
	const candidate = state.candidate;
	const open = !!state.type && !!candidate;
	const title =
		state.type === 'edit' ? '후보 수정' : state.type === 'assign' ? '후보 배정' : '후보 폐기';

	const submit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!candidate || !state.type) return;
		const form = new FormData(event.currentTarget);
		if (state.type === 'edit') {
			await onSaveEdit(candidate.id, {
				title: String(form.get('title') || '').trim(),
				description: String(form.get('description') || '').trim(),
				options: splitLines(String(form.get('options') || '')),
				targetDate: String(form.get('targetDate') || '') || undefined,
				sourceTheme: String(form.get('sourceTheme') || '').trim() || undefined,
			});
		}
		if (state.type === 'assign') {
			await onAssign(candidate.id, {
				publishAt: String(form.get('publishAt') || ''),
				closeAt: String(form.get('closeAt') || ''),
				targetScope: { scope },
				categoryCode: String(form.get('categoryCode') || 'general').trim() || 'general',
			});
		}
		if (state.type === 'reject') {
			await onReject(candidate.id, {
				reason: String(form.get('reason') || '').trim(),
			});
		}
		onClose();
	};

	return (
		<Dialog open={open} onClose={isMutating ? undefined : onClose} fullWidth maxWidth="sm">
			<Box component="form" onSubmit={submit}>
				<DialogTitle>{title}</DialogTitle>
				<DialogContent>
					{candidate ? (
						<Stack spacing={2} sx={{ mt: 1 }}>
							<Typography variant="body2" color="text.secondary">
								{displayTitle(candidate)}
							</Typography>
							{state.type === 'edit' ? (
								<>
									<TextField name="title" label="제목" defaultValue={displayTitle(candidate)} required />
									<TextField
										name="description"
										label="설명"
										defaultValue={displayDescription(candidate)}
										multiline
										minRows={2}
									/>
									<TextField
										name="options"
										label="선택지"
										defaultValue={normalizeOptions(candidate).join('\n')}
										required
										multiline
										minRows={4}
									/>
									<Stack direction="row" spacing={1}>
										<TextField
											name="targetDate"
											label="대상 날짜"
											type="date"
											defaultValue={candidate.targetDate ?? ''}
											InputLabelProps={{ shrink: true }}
											fullWidth
										/>
										<TextField name="sourceTheme" label="테마" defaultValue={candidate.sourceTheme ?? ''} fullWidth />
									</Stack>
								</>
							) : null}
							{state.type === 'assign' ? (
								<>
									<TextField
										name="publishAt"
										label="게시 시각"
										type="datetime-local"
										required
										defaultValue={candidate.targetDate ? `${candidate.targetDate}T18:00` : ''}
										InputLabelProps={{ shrink: true }}
									/>
									<TextField
										name="closeAt"
										label="마감 시각"
										type="datetime-local"
										required
										defaultValue={candidate.targetDate ? `${candidate.targetDate}T23:59` : ''}
										InputLabelProps={{ shrink: true }}
									/>
									<TextField name="categoryCode" label="카테고리" defaultValue="general" />
									<Alert severity="info">현재 화면의 scope({scopeLabel({ scope })})로 배정됩니다.</Alert>
								</>
							) : null}
							{state.type === 'reject' ? (
								<TextField name="reason" label="폐기 사유" required multiline minRows={3} />
							) : null}
						</Stack>
					) : null}
				</DialogContent>
				<DialogActions>
					<Button onClick={onClose} disabled={isMutating}>
						취소
					</Button>
					<Button type="submit" variant="contained" disabled={isMutating}>
						{isMutating ? '처리 중...' : '저장'}
					</Button>
				</DialogActions>
			</Box>
		</Dialog>
	);
}

function ScheduleDialog({
	state,
	isMutating,
	onClose,
	onSave,
}: {
	state: ScheduleDialogState;
	isMutating: boolean;
	onClose: () => void;
	onSave: (questionId: string, body: { publishAt?: string; closeAt: string }) => Promise<unknown>;
}) {
	const question = state.question;
	const submit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!question) return;
		const form = new FormData(event.currentTarget);
		await onSave(question.id, {
			publishAt: String(form.get('publishAt') || '') || undefined,
			closeAt: String(form.get('closeAt') || ''),
		});
		onClose();
	};

	return (
		<Dialog open={!!question} onClose={isMutating ? undefined : onClose} fullWidth maxWidth="sm">
			<Box component="form" onSubmit={submit}>
				<DialogTitle>질문 일정 수정</DialogTitle>
				<DialogContent>
					{question ? (
						<Stack spacing={2} sx={{ mt: 1 }}>
							<Typography variant="body2" fontWeight={800}>
								{question.title}
							</Typography>
							<TextField
								name="publishAt"
								label="게시 시각"
								type="datetime-local"
								defaultValue={dateTimeLocalValue(question.publishAt)}
								disabled={question.status === 'published'}
								InputLabelProps={{ shrink: true }}
							/>
							<TextField
								name="closeAt"
								label="마감 시각"
								type="datetime-local"
								required
								defaultValue={dateTimeLocalValue(question.closeAt)}
								InputLabelProps={{ shrink: true }}
							/>
							{question.status === 'published' ? (
								<Alert severity="warning">게시된 질문은 게시 시각을 변경할 수 없습니다.</Alert>
							) : null}
						</Stack>
					) : null}
				</DialogContent>
				<DialogActions>
					<Button onClick={onClose} disabled={isMutating}>
						취소
					</Button>
					<Button type="submit" variant="contained" disabled={isMutating}>
						저장
					</Button>
				</DialogActions>
			</Box>
		</Dialog>
	);
}
