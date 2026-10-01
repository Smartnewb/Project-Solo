'use client';
import { Button, Spinner, Chip, Modal, TextField, Label, Input, TextArea, Select, ListBox } from '@heroui/react';
import { Plus as AddIcon, Sparkles as AutoAwesomeIcon, CalendarDays as CalendarMonthIcon, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, Pencil as EditIcon, CalendarX as EventBusyIcon, RefreshCw as RefreshIcon, CalendarCheck as TodayIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { CommunityQuestionCalendarDay, CommunityQuestionCandidate, CommunityQuestionCountry, CommunityQuestionScope, CommunityQuestionStatus, CommunityQuestionTargetScope, } from '@/app/services/admin/community-questions';
import { useCommunityQuestionBatch, useCommunityQuestionBatches, useCommunityQuestionCalendar, useCommunityQuestionMutations, } from '@/app/admin/hooks';
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
    if (!value)
        return '-';
    return new Intl.DateTimeFormat('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}
function dateTimeLocalValue(value?: string | null): string {
    if (!value)
        return '';
    const date = new Date(value);
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
}
function splitLines(value: string): string[] {
    return value
        .split(/\n|,/)
        .map((item) => item.trim())
        .filter(Boolean);
}
function statusChip(status?: string | null) {
    if (!status)
        return null;
    return (<Chip size="sm">{STATUS_LABELS[status] ?? status}</Chip>);
}
function scopeLabel(scope?: CommunityQuestionTargetScope | null): string {
    if (!scope)
        return '전체';
    if (scope.scope === 'all')
        return '전체';
    if (scope.scope === 'university')
        return scope.universityCode ?? scope.universityId ?? '학교';
    if (scope.scope === 'region')
        return scope.regionCodes?.join(', ') || '지역';
    if (scope.scope === 'cluster')
        return scope.regionCodes?.join(', ') || '클러스터';
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
    const calendarParams = useMemo(() => ({
        country,
        from: toDateKey(startOfMonth(month)),
        to: toDateKey(endOfMonth(month)),
        scope,
    }), [country, month, scope]);
    const batchesQuery = useCommunityQuestionBatches({ country, ...batchFilters });
    const batchQuery = useCommunityQuestionBatch(selectedBatchId);
    const calendarQuery = useCommunityQuestionCalendar(calendarParams);
    const mutations = useCommunityQuestionMutations();
    const daysByDate = useMemo(() => {
        const map = new Map<string, CommunityQuestionCalendarDay>();
        for (const day of calendarQuery.data?.days ?? [])
            map.set(day.date, day);
        return map;
    }, [calendarQuery.data?.days]);
    const calendarDays = useMemo(() => buildCalendarGrid(month), [month]);
    const selectedDay = daysByDate.get(selectedDate);
    const latestError = mutations.generateBatch.error ||
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
        if (selectedBatchId)
            batchQuery.refetch();
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
    return (<div>
			<div style={{ marginBottom: 24 }}>
				<div>
					<h2 className="text-lg font-semibold">
						주간 질문 생성 및 관리
					</h2>
					<p>
						LLM 후보 생성, 검수, 주간 배정, 캘린더 일정을 한 화면에서 관리합니다.
					</p>
				</div>
				<div>
					<div style={{ minWidth: 96 }}>
						<label>국가</label>
						<Select value={country} aria-label={"국가"} onChange={(key) => {
            const value = String(key ?? "");
            setCountry(value as CommunityQuestionCountry);
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
							<ListBox.Item id={"kr"} textValue={"KR"}>KR</ListBox.Item>
							<ListBox.Item id={"jp"} textValue={"JP"}>JP</ListBox.Item>
						</ListBox></Select.Popover></Select>
					</div>
					<div style={{ minWidth: 120 }}>
						<label>범위</label>
						<Select value={scope} aria-label={"범위"} onChange={(key) => {
            const value = String(key ?? "");
            setScope(value as CommunityQuestionScope);
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
							<ListBox.Item id={"all"} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
							<ListBox.Item id={"cluster"} textValue={"\uD074\uB7EC\uC2A4\uD130"}>클러스터</ListBox.Item>
							<ListBox.Item id={"region"} textValue={"\uC9C0\uC5ED"}>지역</ListBox.Item>
							<ListBox.Item id={"university"} textValue={"\uD559\uAD50"}>학교</ListBox.Item>
						</ListBox></Select.Popover></Select>
					</div>
					<span title={"오늘"}>
						<Button onPress={goToday} variant="tertiary" isIconOnly={true} aria-label={"오늘"}>
							<TodayIcon></TodayIcon>
						</Button>
					</span>
					<span title={"새로고침"}>
						<Button onPress={refreshAll} variant="tertiary" isIconOnly={true} aria-label={"새로고침"}>
							<RefreshIcon></RefreshIcon>
						</Button>
					</span>
				</div>
			</div>

			{formError ? (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
					{formError}
				</aside>) : null}
			{latestError ? (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
					{getAdminErrorMessage(latestError, '커뮤니티 질문 관리 요청에 실패했습니다.')}
				</aside>) : null}

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div className="min-w-0">
					<div>
						<form onSubmit={handleGenerate} style={{ padding: 16 }} className="rounded-xl border bg-white p-4">
							<div style={{ marginBottom: 16 }}>
								<AutoAwesomeIcon></AutoAwesomeIcon>
								<p>
									주간 후보 생성
								</p>
							</div>
							<div>
								<div>
									<TextField className="mb-4"><Label>{"시작일"}</Label><Input name="startDate" type="date" defaultValue={toDateKey(startOfWeek(today))}></Input></TextField>
									<TextField className="mb-4"><Label>{"종료일"}</Label><Input name="endDate" type="date" defaultValue={toDateKey(endOfWeek(today))}></Input></TextField>
								</div>
								<TextField className="mb-4"><Label>{"일별 후보 수"}</Label><Input name="candidatesPerDay" type="number" defaultValue={3} {...{ min: 1, max: 5 }}></Input></TextField>
								<TextField className="mb-4"><Label>{"운영 메모"}</Label><TextArea name="operatorMemo" placeholder="예: 시험 끝난 주라 회복/약속 질문 위주"></TextArea></TextField>
								<TextField className="mb-4"><Label>{"외부 트렌드"}</Label><TextArea name="externalTrends"></TextArea></TextField>
								<TextField className="mb-4"><Label>{"포함 키워드"}</Label><Input name="includeKeywords"></Input></TextField>
								<TextField className="mb-4"><Label>{"제외 키워드"}</Label><Input name="excludeKeywords"></Input></TextField>
								<TextField className="mb-4"><Label>{"시즌 힌트"}</Label><Input name="seasonHints"></Input></TextField>
								<Button type="submit" isDisabled={isMutating} variant="primary">{mutations.generateBatch.isPending ? <Spinner size="sm"></Spinner> : <AutoAwesomeIcon></AutoAwesomeIcon>}
									후보 생성
								</Button>
							</div>
						</form>

						<form onSubmit={handleCreateQuestion} style={{ padding: 16 }} className="rounded-xl border bg-white p-4">
							<div style={{ marginBottom: 16 }}>
								<AddIcon></AddIcon>
								<p>
									수동 질문 생성
								</p>
							</div>
							<div>
								<TextField isRequired={true} className="mb-4"><Label>{"질문 제목"}</Label><Input name="title" required></Input></TextField>
								<TextField className="mb-4"><Label>{"설명"}</Label><TextArea name="description"></TextArea></TextField>
								<TextField isRequired={true} className="mb-4"><Label>{"선택지"}</Label><TextArea name="options" required placeholder="한 줄에 하나씩 입력"></TextArea></TextField>
								<div>
									<div>
										<label>상태</label>
										<Select name="status" defaultValue="scheduled" aria-label={"상태"} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
											<ListBox.Item id={"draft"} textValue={"\uCD08\uC548"}>초안</ListBox.Item>
											<ListBox.Item id={"scheduled"} textValue={"\uC608\uC57D"}>예약</ListBox.Item>
											<ListBox.Item id={"published"} textValue={"\uAC8C\uC2DC"}>게시</ListBox.Item>
										</ListBox></Select.Popover></Select>
									</div>
									<TextField className="mb-4"><Label>{"카테고리"}</Label><Input name="categoryCode" defaultValue="general"></Input></TextField>
								</div>
								<TextField className="mb-4"><Label>{"소스 테마"}</Label><Input name="sourceTheme"></Input></TextField>
								<div>
									<TextField className="mb-4"><Label>{"게시 시각"}</Label><Input name="publishAt" type="datetime-local"></Input></TextField>
									<TextField className="mb-4"><Label>{"마감 시각"}</Label><Input name="closeAt" type="datetime-local"></Input></TextField>
								</div>
								<Button type="submit" isDisabled={isMutating} variant="secondary">{mutations.createQuestion.isPending ? <Spinner size="sm"></Spinner> : <AddIcon></AddIcon>}
									질문 생성
								</Button>
							</div>
						</form>
					</div>
				</div>

				<div className="min-w-0">
					<div>
						<CalendarPanel month={month} selectedDate={selectedDate} days={calendarDays} daysByDate={daysByDate} isFetching={calendarQuery.isFetching} onMoveMonth={moveMonth} onSelectDate={setSelectedDate} onOpenSchedule={(question) => setScheduleDialog({ question })}></CalendarPanel>
						<SelectedDayPanel day={selectedDay} selectedDate={selectedDate}></SelectedDayPanel>
						<BatchPanel from={batchFilters.from} to={batchFilters.to} onChangeFilters={setBatchFilters} batches={batchesQuery.data?.items ?? []} selectedBatchId={selectedBatchId} onSelectBatch={setSelectedBatchId} batch={batchQuery.data ?? null} isLoading={batchesQuery.isLoading || batchQuery.isLoading} onEdit={(candidate) => setDialog({ type: 'edit', candidate })} onAssign={(candidate) => setDialog({ type: 'assign', candidate })} onReject={(candidate) => setDialog({ type: 'reject', candidate })} onApprove={(candidate) => mutations.approveCandidate.mutate(candidate.id)} onUnassign={(candidate) => mutations.unassignCandidate.mutate(candidate.id)} isMutating={isMutating}></BatchPanel>
					</div>
				</div>
			</div>

			<CandidateActionDialog state={dialog} scope={scope} isMutating={isMutating} onClose={() => setDialog({ type: null, candidate: null })} onSaveEdit={(candidateId, body) => mutations.updateCandidate.mutateAsync({ candidateId, body })} onAssign={(candidateId, body) => mutations.assignCandidate.mutateAsync({ candidateId, body })} onReject={(candidateId, body) => mutations.rejectCandidate.mutateAsync({ candidateId, body })}></CandidateActionDialog>
			<ScheduleDialog state={scheduleDialog} isMutating={isMutating} onClose={() => setScheduleDialog({ question: null })} onSave={(questionId, body) => mutations.updateSchedule.mutateAsync({ questionId, body })}></ScheduleDialog>
		</div>);
}
function CalendarPanel({ month, selectedDate, days, daysByDate, isFetching, onMoveMonth, onSelectDate, onOpenSchedule, }: {
    month: Date;
    selectedDate: string;
    days: Date[];
    daysByDate: Map<string, CommunityQuestionCalendarDay>;
    isFetching: boolean;
    onMoveMonth: (amount: number) => void;
    onSelectDate: (date: string) => void;
    onOpenSchedule: (question: CommunityQuestionCalendarDay['question']) => void;
}) {
    return (<section style={{ padding: 16 }} className="rounded-xl border bg-white p-4">
			<div style={{ marginBottom: 16 }}>
				<div>
					<CalendarMonthIcon></CalendarMonthIcon>
					<p>
						주간 캘린더
					</p>
					{isFetching ? <Spinner size="sm"></Spinner> : null}
				</div>
				<div>
					<Button onPress={() => onMoveMonth(-1)} variant="tertiary" isIconOnly={true}>
						<ChevronLeftIcon></ChevronLeftIcon>
					</Button>
					<p style={{ minWidth: 96, textAlign: 'center' }}>
						{formatMonthLabel(month)}
					</p>
					<Button onPress={() => onMoveMonth(1)} variant="tertiary" isIconOnly={true}>
						<ChevronRightIcon></ChevronRightIcon>
					</Button>
				</div>
			</div>
			<div style={{ display: 'grid', border: '1px solid', borderRadius: 1, overflow: 'hidden' }}>
				{WEEKDAYS.map((weekday) => (<div key={weekday} style={{ padding: 8, backgroundColor: '#f9fafb' }}>
						<p>
							{weekday}
						</p>
					</div>))}
				{days.map((date) => {
            const key = toDateKey(date);
            const day = daysByDate.get(key);
            const question = day?.question;
            const selected = key === selectedDate;
            const inMonth = date.getMonth() === month.getMonth();
            return (<div key={key}  style={{ minHeight: 132, padding: 8, textAlign: 'left', border: 0, backgroundColor: selected ? 'primary.50' : 'background.paper', color: inMonth ? 'text.primary' : 'text.disabled', cursor: 'pointer' }}><Button variant="tertiary" onPress={() => onSelectDate(key)}>날짜 선택</Button>
							<div>
								<p>
									{date.getDate()}
								</p>
								{question ? (<span title={"일정 수정"}>
										<Button onClick={(event) => {
                        event.stopPropagation();
                        onOpenSchedule(question);
                    }} variant="tertiary" isIconOnly={true} aria-label={"일정 수정"}>
											<EditIcon></EditIcon>
										</Button>
									</span>) : null}
							</div>
							{question ? (<div style={{ marginTop: 8 }}>
									{statusChip(question.status)}
									<p style={{ display: 'block' }}>
										{question.title}
									</p>
									<p>
										{formatDateTime(question.publishAt)}
									</p>
								</div>) : (<div style={{ marginTop: 8 }}>
									<Chip size="sm">{"질문 없음"}</Chip>
									<p>
										후보 승인 후 배정 가능
									</p>
								</div>)}
							{day?.candidateSummary ? (<p style={{ marginTop: 8, display: 'block' }}>
									후보 대기 {day.candidateSummary.pending} · 승인 {day.candidateSummary.approved}
								</p>) : null}
						</div>);
        })}
			</div>
		</section>);
}
function SelectedDayPanel({ day, selectedDate, }: {
    day?: CommunityQuestionCalendarDay;
    selectedDate: string;
}) {
    const question = day?.question;
    return (<section style={{ padding: 16 }} className="rounded-xl border bg-white p-4">
			<p style={{ marginBottom: 8 }}>
				{selectedDate} 일정
			</p>
			{question ? (<div>
					<div>
						{statusChip(question.status)}
						<Chip size="sm">{scopeLabel(question.targetScope)}</Chip>
						<Chip size="sm">{question.sourceType ?? 'source 없음'}</Chip>
					</div>
					<p>
						{question.title}
					</p>
					<p>
						게시 {formatDateTime(question.publishAt)} · 마감 {formatDateTime(question.closeAt)}
					</p>
				</div>) : (<div>
					<EventBusyIcon></EventBusyIcon>
					<p>선택한 날짜에 배정된 질문이 없습니다.</p>
				</div>)}
		</section>);
}
function BatchPanel({ from, to, onChangeFilters, batches, selectedBatchId, onSelectBatch, batch, isLoading, onEdit, onAssign, onReject, onApprove, onUnassign, isMutating, }: {
    from: string;
    to: string;
    onChangeFilters: (value: {
        from: string;
        to: string;
    }) => void;
    batches: Array<{
        id: string;
        startDate: string;
        endDate: string;
        status: string;
        generatedCount: number;
        assignedCount: number;
        createdAt?: string;
    }>;
    selectedBatchId: string | null;
    onSelectBatch: (id: string) => void;
    batch: {
        weeklyTheme?: string | null;
        days: Array<{
            date: string;
            dayTheme?: string | null;
            candidates: CommunityQuestionCandidate[];
        }>;
    } | null;
    isLoading: boolean;
    onEdit: (candidate: CommunityQuestionCandidate) => void;
    onAssign: (candidate: CommunityQuestionCandidate) => void;
    onReject: (candidate: CommunityQuestionCandidate) => void;
    onApprove: (candidate: CommunityQuestionCandidate) => void;
    onUnassign: (candidate: CommunityQuestionCandidate) => void;
    isMutating: boolean;
}) {
    return (<section style={{ padding: 16 }} className="rounded-xl border bg-white p-4">
			<div style={{ marginBottom: 16 }}>
				<p>
					후보 batch
				</p>
				<div>
					<TextField className="mb-4"><Label>{"From"}</Label><Input type="date" value={from} onChange={(event) => onChangeFilters({ from: event.target.value, to })}></Input></TextField>
					<TextField className="mb-4"><Label>{"To"}</Label><Input type="date" value={to} onChange={(event) => onChangeFilters({ from, to: event.target.value })}></Input></TextField>
				</div>
			</div>
			{isLoading ? (<div style={{ paddingBlock: 32, textAlign: 'center' }}>
					<Spinner size="sm"></Spinner>
				</div>) : (<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div className="min-w-0">
						<div>
							{batches.length === 0 ? (<p>
									조회 기간에 생성된 batch가 없습니다.
								</p>) : (batches.map((item) => (<Button variant="tertiary" key={item.id} onPress={() => onSelectBatch(item.id)} style={{ padding: 12, textAlign: 'left', cursor: 'pointer', backgroundColor: selectedBatchId === item.id ? 'primary.50' : 'background.paper' }} className="rounded-xl border bg-white p-4">
										<div>
											<div>
												<p>
													{item.startDate} ~ {item.endDate}
												</p>
												{statusChip(item.status)}
											</div>
											<p>
												후보 {item.generatedCount} · 배정 {item.assignedCount}
											</p>
										</div>
									</Button>)))}
						</div>
					</div>
					<div className="min-w-0">
						{batch ? (<div>
								{batch.weeklyTheme ? (<aside role="alert" className="rounded-lg border p-3">{batch.weeklyTheme}</aside>) : null}
								{batch.days.map((day) => (<div key={day.date}>
										<p style={{ marginBottom: 8 }}>
											{day.date}
											{day.dayTheme ? ` · ${day.dayTheme}` : ''}
										</p>
										<div>
											{day.candidates.map((candidate) => (<CandidateRow key={candidate.id} candidate={candidate} onEdit={onEdit} onAssign={onAssign} onReject={onReject} onApprove={onApprove} onUnassign={onUnassign} isMutating={isMutating}></CandidateRow>))}
										</div>
									</div>))}
							</div>) : (<div style={{ paddingBlock: 40, textAlign: 'center', color: "#6b7280" }}>
								왼쪽에서 batch를 선택하면 후보를 검수할 수 있습니다.
							</div>)}
					</div>
				</div>)}
		</section>);
}
function CandidateRow({ candidate, onEdit, onAssign, onReject, onApprove, onUnassign, isMutating, }: {
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
    return (<section style={{ padding: 12 }} className="rounded-xl border bg-white p-4">
			<div>
				<div>
					<div style={{ minWidth: 0 }}>
						<div>
							{statusChip(candidate.status)}
							{candidate.scores?.totalScore ? (<Chip size="sm">{`점수 ${candidate.scores.totalScore}`}</Chip>) : null}
							{candidate.riskFlags?.map((flag) => (<Chip key={flag} size="sm">{flag}</Chip>))}
						</div>
						<p style={{ marginTop: 6 }}>
							{displayTitle(candidate)}
						</p>
						{displayDescription(candidate) ? (<p>
								{displayDescription(candidate)}
							</p>) : null}
					</div>
					<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
						<Button isDisabled={!canEdit(candidate) || isMutating} onPress={() => onEdit(candidate)} variant="secondary">
							수정
						</Button>
						<Button isDisabled={candidate.status !== 'pending' || hardRisk || isMutating} onPress={() => onApprove(candidate)} variant="secondary">
							승인
						</Button>
						<Button isDisabled={candidate.status === 'assigned' || isMutating} onPress={() => onReject(candidate)} variant="secondary">
							폐기
						</Button>
						<Button isDisabled={!canAssign(candidate) || isMutating} onPress={() => onAssign(candidate)} variant="primary">
							배정
						</Button>
						<Button isDisabled={candidate.status !== 'assigned' || isMutating} onPress={() => onUnassign(candidate)} variant="tertiary">
							배정 취소
						</Button>
					</div>
				</div>
				<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
					{options.map((option) => (<Chip key={option} size="sm">{option}</Chip>))}
				</div>
				{candidate.rejectionReason ? (<p>
						폐기 사유: {candidate.rejectionReason}
					</p>) : null}
			</div>
		</section>);
}
function CandidateActionDialog({ state, scope, isMutating, onClose, onSaveEdit, onAssign, onReject, }: {
    state: CandidateDialogState;
    scope: CommunityQuestionScope;
    isMutating: boolean;
    onClose: () => void;
    onSaveEdit: (candidateId: string, body: {
        title?: string;
        description?: string;
        options?: string[];
        targetDate?: string;
        sourceTheme?: string;
    }) => Promise<unknown>;
    onAssign: (candidateId: string, body: {
        publishAt: string;
        closeAt: string;
        targetScope: CommunityQuestionTargetScope;
        categoryCode?: string;
    }) => Promise<unknown>;
    onReject: (candidateId: string, body: {
        reason: string;
    }) => Promise<unknown>;
}) {
    const candidate = state.candidate;
    const open = !!state.type && !!candidate;
    const title = state.type === 'edit' ? '후보 수정' : state.type === 'assign' ? '후보 배정' : '후보 폐기';
    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!candidate || !state.type)
            return;
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
    return (<Modal.Backdrop isOpen={open} onOpenChange={next => {
            if (!next)
                !isMutating && onClose();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}>
			<form onSubmit={submit}>
				<Modal.Heading>{title}</Modal.Heading>
				<Modal.Body>
					{candidate ? (<div style={{ marginTop: 8 }}>
							<p>
								{displayTitle(candidate)}
							</p>
							{state.type === 'edit' ? (<>
									<TextField isRequired={true} className="mb-4"><Label>{"제목"}</Label><Input name="title" defaultValue={displayTitle(candidate)} required></Input></TextField>
									<TextField className="mb-4"><Label>{"설명"}</Label><TextArea name="description" defaultValue={displayDescription(candidate)}></TextArea></TextField>
									<TextField isRequired={true} className="mb-4"><Label>{"선택지"}</Label><TextArea name="options" defaultValue={normalizeOptions(candidate).join('\n')} required></TextArea></TextField>
									<div>
										<TextField className="mb-4"><Label>{"대상 날짜"}</Label><Input name="targetDate" type="date" defaultValue={candidate.targetDate ?? ''}></Input></TextField>
										<TextField className="mb-4"><Label>{"테마"}</Label><Input name="sourceTheme" defaultValue={candidate.sourceTheme ?? ''}></Input></TextField>
									</div>
								</>) : null}
							{state.type === 'assign' ? (<>
									<TextField isRequired={true} className="mb-4"><Label>{"게시 시각"}</Label><Input name="publishAt" type="datetime-local" required defaultValue={candidate.targetDate ? `${candidate.targetDate}T18:00` : ''}></Input></TextField>
									<TextField isRequired={true} className="mb-4"><Label>{"마감 시각"}</Label><Input name="closeAt" type="datetime-local" required defaultValue={candidate.targetDate ? `${candidate.targetDate}T23:59` : ''}></Input></TextField>
									<TextField className="mb-4"><Label>{"카테고리"}</Label><Input name="categoryCode" defaultValue="general"></Input></TextField>
									<aside role="alert" className="rounded-lg border p-3">현재 화면의 scope({scopeLabel({ scope })})로 배정됩니다.</aside>
								</>) : null}
							{state.type === 'reject' ? (<TextField isRequired={true} className="mb-4"><Label>{"폐기 사유"}</Label><TextArea name="reason" required></TextArea></TextField>) : null}
						</div>) : null}
				</Modal.Body>
				<Modal.Footer>
					<Button onPress={onClose} isDisabled={isMutating} variant="tertiary">
						취소
					</Button>
					<Button type="submit" isDisabled={isMutating} variant="primary">
						{isMutating ? '처리 중...' : '저장'}
					</Button>
				</Modal.Footer>
			</form>
		</Modal.Dialog></Modal.Container></Modal.Backdrop>);
}
function ScheduleDialog({ state, isMutating, onClose, onSave, }: {
    state: ScheduleDialogState;
    isMutating: boolean;
    onClose: () => void;
    onSave: (questionId: string, body: {
        publishAt?: string;
        closeAt: string;
    }) => Promise<unknown>;
}) {
    const question = state.question;
    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!question)
            return;
        const form = new FormData(event.currentTarget);
        await onSave(question.id, {
            publishAt: String(form.get('publishAt') || '') || undefined,
            closeAt: String(form.get('closeAt') || ''),
        });
        onClose();
    };
    return (<Modal.Backdrop isOpen={!!question} onOpenChange={next => {
            if (!next)
                !isMutating && onClose();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}>
			<form onSubmit={submit}>
				<Modal.Heading>질문 일정 수정</Modal.Heading>
				<Modal.Body>
					{question ? (<div style={{ marginTop: 8 }}>
							<p>
								{question.title}
							</p>
							<TextField className="mb-4"><Label>{"게시 시각"}</Label><Input name="publishAt" type="datetime-local" defaultValue={dateTimeLocalValue(question.publishAt)} disabled={question.status === 'published'}></Input></TextField>
							<TextField isRequired={true} className="mb-4"><Label>{"마감 시각"}</Label><Input name="closeAt" type="datetime-local" required defaultValue={dateTimeLocalValue(question.closeAt)}></Input></TextField>
							{question.status === 'published' ? (<aside role="alert" className="rounded-lg border p-3">게시된 질문은 게시 시각을 변경할 수 없습니다.</aside>) : null}
						</div>) : null}
				</Modal.Body>
				<Modal.Footer>
					<Button onPress={onClose} isDisabled={isMutating} variant="tertiary">
						취소
					</Button>
					<Button type="submit" isDisabled={isMutating} variant="primary">
						저장
					</Button>
				</Modal.Footer>
			</form>
		</Modal.Dialog></Modal.Container></Modal.Backdrop>);
}
