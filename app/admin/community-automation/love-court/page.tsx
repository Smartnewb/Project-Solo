'use client';
import { Button, Spinner, Chip, Modal, TextField, Label, Input, TextArea, Select, ListBox } from '@heroui/react';
import { WandSparkles as AutoFixHighIcon, CircleCheck as CheckCircleIcon, Trash2 as DeleteOutlineIcon, Gavel as GavelIcon, RefreshCw as RefreshIcon, Save as SaveIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLoveCourtMutations, useLoveCourtSubmission, useLoveCourtSubmissions, } from '@/app/admin/hooks';
import type { LoveCourtOptionStatus, LoveCourtSubmission, LoveCourtSubmissionStatus, UpdateLoveCourtOptionCandidateBody, } from '@/app/services/admin/love-court';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog';
import { useToast } from '@/shared/ui/admin/toast';
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
const STATUS_COLOR: Record<LoveCourtSubmissionStatus, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
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
const OPTION_STATUS_COLOR: Record<LoveCourtOptionStatus, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
    pending: 'default',
    generating: 'info',
    generated: 'info',
    review_required: 'warning',
    approved: 'success',
    failed: 'error',
};
const STATUS_OPTIONS: Array<{
    value: StatusFilter;
    label: string;
}> = [
    { value: 'all', label: '전체 상태' },
    { value: 'submitted', label: STATUS_LABEL.submitted },
    { value: 'queued', label: STATUS_LABEL.queued },
    { value: 'published', label: STATUS_LABEL.published },
    { value: 'closed', label: STATUS_LABEL.closed },
    { value: 'archived', label: STATUS_LABEL.archived },
    { value: 'deleted_by_operator', label: STATUS_LABEL.deleted_by_operator },
];
const OPTION_STATUS_OPTIONS: Array<{
    value: OptionStatusFilter;
    label: string;
}> = [
    { value: 'all', label: '전체 선택지' },
    { value: 'review_required', label: OPTION_STATUS_LABEL.review_required },
    { value: 'failed', label: OPTION_STATUS_LABEL.failed },
    { value: 'approved', label: OPTION_STATUS_LABEL.approved },
    { value: 'pending', label: OPTION_STATUS_LABEL.pending },
    { value: 'generating', label: OPTION_STATUS_LABEL.generating },
    { value: 'generated', label: OPTION_STATUS_LABEL.generated },
];
function formatDateTime(value: string | null | undefined): string {
    if (!value)
        return '-';
    return new Intl.DateTimeFormat('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}
function shortText(value: string | null | undefined, max = 72): string {
    if (!value)
        return '-';
    return value.length > max ? `${value.slice(0, max)}...` : value;
}
function normalizeOptions(options: UpdateLoveCourtOptionCandidateBody[]): UpdateLoveCourtOptionCandidateBody[] {
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
function StatusChip({ status }: {
    status: LoveCourtSubmissionStatus;
}) {
    return <Chip size="sm">{STATUS_LABEL[status]}</Chip>;
}
function OptionStatusChip({ status }: {
    status: LoveCourtOptionStatus;
}) {
    return (<Chip size="sm">{OPTION_STATUS_LABEL[status]}</Chip>);
}
// 운영자가 확인 후 수정할 수 있는 삭제 사유 초안 (자동 전송되지 않고 입력창에 미리 채워진다).
const DEFAULT_DELETE_REASON = '운영자 검수 기준에 따라 공개하지 않음';
export default function LoveCourtAdminPage() {
    const confirm = useConfirm();
    const toast = useToast();
    function fail(message: string) {
        setLocalError(message);
        toast.error(message);
    }
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [optionStatusFilter, setOptionStatusFilter] = useState<OptionStatusFilter>('review_required');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editOptions, setEditOptions] = useState<UpdateLoveCourtOptionCandidateBody[]>([]);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteReason, setDeleteReason] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);
    const listParams = useMemo(() => ({
        status: statusFilter === 'all' ? undefined : statusFilter,
        optionStatus: optionStatusFilter === 'all' ? undefined : optionStatusFilter,
        limit: 100,
    }), [optionStatusFilter, statusFilter]);
    const summaryParams = useMemo(() => ({ limit: 100 }), []);
    const submissionsQuery = useLoveCourtSubmissions(listParams);
    const summaryQuery = useLoveCourtSubmissions(summaryParams);
    const submissions = useMemo(() => submissionsQuery.data?.items ?? [], [submissionsQuery.data?.items]);
    const summaryItems = useMemo(() => summaryQuery.data?.items ?? [], [summaryQuery.data?.items]);
    const selectedQuery = useLoveCourtSubmission(selectedId);
    const selected = selectedQuery.data?.submission ?? submissions.find((submission) => submission.id === selectedId) ?? null;
    const mutations = useLoveCourtMutations();
    const counts = useMemo(() => summarize(summaryItems), [summaryItems]);
    const published = summaryItems.find((submission) => submission.status === 'published');
    const isBusy = mutations.updateOptions.isPending ||
        mutations.approveOptions.isPending ||
        mutations.regenerateOptions.isPending ||
        mutations.deleteSubmission.isPending ||
        mutations.generateVerdict.isPending;
    useEffect(() => {
        if (selectedId && submissions.some((submission) => submission.id === selectedId))
            return;
        setSelectedId(submissions[0]?.id ?? null);
    }, [selectedId, submissions]);
    useEffect(() => {
        if (!selected?.options) {
            setEditOptions([]);
            return;
        }
        setEditOptions([...selected.options]
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((option) => ({
            id: option.id,
            label: option.label,
            displayOrder: option.displayOrder,
        })));
    }, [selected?.id, selected?.options]);
    const queryError = submissionsQuery.error ?? summaryQuery.error ?? selectedQuery.error;
    const error = localError ?? (queryError ? getAdminErrorMessage(queryError, '불러오기 실패') : null);
    function handleStatusChange(event: React.ChangeEvent<HTMLSelectElement>) {
        setStatusFilter(event.target.value as StatusFilter);
    }
    function handleOptionStatusChange(event: React.ChangeEvent<HTMLSelectElement>) {
        setOptionStatusFilter(event.target.value as OptionStatusFilter);
    }
    function updateOptionLabel(index: number, label: string) {
        setEditOptions((prev) => prev.map((option, optionIndex) => optionIndex === index ? { ...option, label } : option));
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
        if (!selected)
            return;
        const options = normalizeOptions(editOptions);
        if (options.length < 2 || options.length > 4) {
            fail('선택지는 2-4개여야 합니다.');
            return;
        }
        setLocalError(null);
        try {
            await mutations.updateOptions.mutateAsync({
                submissionId: selected.id,
                body: { options },
            });
        }
        catch (error) {
            fail(getAdminErrorMessage(error, '선택지 저장 실패'));
        }
    }
    async function handleApprove() {
        if (!selected)
            return;
        setLocalError(null);
        try {
            await mutations.approveOptions.mutateAsync(selected.id);
        }
        catch (error) {
            fail(getAdminErrorMessage(error, '승인 실패'));
        }
    }
    async function handleRegenerate() {
        if (!selected)
            return;
        setLocalError(null);
        try {
            await mutations.regenerateOptions.mutateAsync(selected.id);
        }
        catch (error) {
            fail(getAdminErrorMessage(error, '선택지 재생성 실패'));
        }
    }
    async function handleGenerateVerdict(submission: LoveCourtSubmission) {
        if (!submission.caseId) {
            fail('Case ID가 없어 판결을 생성할 수 없습니다.');
            return;
        }
        const confirmed = await confirm({
            title: 'AI 판결 생성 후 종료',
            message: `‘${submission.title ?? submission.id}’ 재판을 즉시 종료하고 AI 판결을 생성합니다.\n다음 대기 재판이 있으면 바로 공개됩니다.`,
            confirmText: '종료 및 판결 생성',
            severity: 'error',
        });
        if (!confirmed) {
            return;
        }
        setLocalError(null);
        try {
            await mutations.generateVerdict.mutateAsync(submission.caseId);
        }
        catch (error) {
            fail(getAdminErrorMessage(error, 'AI 판결 생성 실패'));
        }
    }
    function openDelete() {
        setDeleteReason(DEFAULT_DELETE_REASON);
        setDeleteOpen(true);
    }
    function closeDelete() {
        setDeleteOpen(false);
        setDeleteReason('');
    }
    async function handleDelete() {
        if (!selected)
            return;
        const reasonMessage = deleteReason.trim();
        if (!reasonMessage) {
            fail('삭제 사유를 입력해 주세요.');
            return;
        }
        setLocalError(null);
        try {
            await mutations.deleteSubmission.mutateAsync({
                submissionId: selected.id,
                body: {
                    reasonCode: 'operator_rejected',
                    reasonMessage,
                },
            });
            closeDelete();
        }
        catch (error) {
            fail(getAdminErrorMessage(error, '삭제 실패'));
        }
    }
    return (<div>
			<div style={{ marginBottom: 16 }}>
				<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
					<section style={{ paddingInline: 16, paddingBlock: 8, minWidth: 128 }} className="rounded-xl border bg-white p-4">
						<p>
							검수 필요
						</p>
						<h2 className="text-lg font-semibold">{counts.reviewRequired}</h2>
					</section>
					<section style={{ paddingInline: 16, paddingBlock: 8, minWidth: 128 }} className="rounded-xl border bg-white p-4">
						<p>
							생성 실패
						</p>
						<h2 className="text-lg font-semibold">{counts.failed}</h2>
					</section>
					<section style={{ paddingInline: 16, paddingBlock: 8, minWidth: 128 }} className="rounded-xl border bg-white p-4">
						<p>
							공개 대기
						</p>
						<h2 className="text-lg font-semibold">{counts.queued}</h2>
					</section>
					<section style={{ paddingInline: 16, paddingBlock: 8, minWidth: 128 }} className="rounded-xl border bg-white p-4">
						<p>
							공개 중
						</p>
						<h2 className="text-lg font-semibold">{counts.published}</h2>
					</section>
				</div>
				<div style={{ flex: 1 }}></div>
				<div>
					<div style={{ minWidth: 140 }}>
						<label>상태</label>
						<Select value={statusFilter} aria-label={"상태"} onChange={(key) => {
            const value = String(key ?? "");
            (handleStatusChange)({ target: { value: value }, currentTarget: { value: value } } as never);
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
							{STATUS_OPTIONS.map((option) => (<ListBox.Item key={option.value} id={option.value} textValue={String(option.label)}>
									{option.label}
								</ListBox.Item>))}
						</ListBox></Select.Popover></Select>
					</div>
					<div style={{ minWidth: 150 }}>
						<label>선택지</label>
						<Select value={optionStatusFilter} aria-label={"선택지"} onChange={(key) => {
            const value = String(key ?? "");
            (handleOptionStatusChange)({ target: { value: value }, currentTarget: { value: value } } as never);
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
							{OPTION_STATUS_OPTIONS.map((option) => (<ListBox.Item key={option.value} id={option.value} textValue={String(option.label)}>
									{option.label}
								</ListBox.Item>))}
						</ListBox></Select.Popover></Select>
					</div>
					<span title={"새로고침"}>
						<span>
							<Button onPress={() => submissionsQuery.refetch()} isDisabled={submissionsQuery.isFetching} variant="tertiary" isIconOnly={true} aria-label={"새로고침"}>
								<RefreshIcon></RefreshIcon>
							</Button>
						</span>
					</span>
				</div>
			</div>

			{published && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
					현재 공개 중: {published.title ?? published.id} · {formatDateTime(published.publishedAt)}
				</aside>)}

			{error && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
					{error}
				</aside>)}

			<div>
				<div style={{ flex: 1, minWidth: 0 }}>
					<table className="w-full text-sm">
						<thead className="bg-gray-50 text-left">
							<tr className="border-b">
								<th scope="col" className="border-b px-4 py-3">고민</th>
								<th scope="col" className="border-b px-4 py-3">상태</th>
								<th scope="col" className="border-b px-4 py-3">선택지</th>
								<th scope="col" className="border-b px-4 py-3">큐</th>
								<th scope="col" className="border-b px-4 py-3">접수</th>
								<th scope="col" className="border-b px-4 py-3">액션</th>
							</tr>
						</thead>
						<tbody>
							{submissionsQuery.isLoading ? (<tr className="border-b">
									<td colSpan={6} style={{ paddingBlock: 48 }} className="border-b px-4 py-3">
										<Spinner size="sm"></Spinner>
									</td>
								</tr>) : submissions.length === 0 ? (<tr className="border-b">
									<td colSpan={6} style={{ paddingBlock: 48 }} className="border-b px-4 py-3">
										<p>표시할 제출건이 없습니다.</p>
									</td>
								</tr>) : (submissions.map((submission) => (<tr key={submission.id} style={{ cursor: 'pointer' }} className="border-b">
										<td style={{ maxWidth: 420 }} className="border-b px-4 py-3">
											<p>
												<Button variant="tertiary" onPress={() => setSelectedId(submission.id)}>{submission.title ?? submission.id}</Button>
											</p>
											<p>
												{shortText(submission.body)}
											</p>
										</td>
										<td className="border-b px-4 py-3">
											<StatusChip status={submission.status}></StatusChip>
										</td>
										<td className="border-b px-4 py-3">
											<div>
												<OptionStatusChip status={submission.optionStatus}></OptionStatusChip>
												<p>
													{submission.options?.length ?? 0}개
												</p>
											</div>
										</td>
										<td className="border-b px-4 py-3">
											<p>
												{submission.queuePosition ? `${submission.queuePosition}번` : '-'}
											</p>
										</td>
										<td className="border-b px-4 py-3">
											<p>{formatDateTime(submission.createdAt)}</p>
										</td>
										<td className="border-b px-4 py-3">
											<Button variant="secondary">
												보기
											</Button>
										</td>
									</tr>)))}
						</tbody>
					</table>
				</div>

				<section style={{ padding: 16 }} className="rounded-xl border bg-white p-4">
					{selected ? (<div>
							<div>
								<div style={{ minWidth: 0 }}>
									<h2 className="text-lg font-semibold">
										{selected.title ?? selected.id}
									</h2>
									<p>
										{selected.id}
									</p>
								</div>
								<div>
									<StatusChip status={selected.status}></StatusChip>
									<OptionStatusChip status={selected.optionStatus}></OptionStatusChip>
								</div>
							</div>

							<p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
								{selected.body}
							</p>

							{selected.optionGenerationError && (<aside role="alert" className="rounded-lg border p-3">{selected.optionGenerationError}</aside>)}

							<hr></hr>

							<div>
								<div>
									<p>
										선택지
									</p>
									<Button onPress={addOption} isDisabled={editOptions.length >= 4 || isBusy} variant="tertiary">
										추가
									</Button>
								</div>
								{editOptions.length === 0 ? (<p>
										선택지가 없습니다.
									</p>) : (editOptions.map((option, index) => (<div key={`${option.id ?? 'new'}-${index}`}>
											<TextField className="mb-4"><Label>{`선택지 ${index + 1} 문구`}</Label><Input value={option.label} onChange={(event) => updateOptionLabel(index, event.target.value)} {...{ maxLength: 100 }}></Input></TextField>
											<span title={"선택지 제거"}>
												<span>
													<Button onPress={() => removeOption(index)} isDisabled={editOptions.length <= 2 || isBusy} variant="tertiary" isIconOnly={true} aria-label={"선택지 제거"}>
														<DeleteOutlineIcon></DeleteOutlineIcon>
													</Button>
												</span>
											</span>
										</div>)))}
							</div>

							<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
								<Button isDisabled={!selected || editOptions.length < 2 || isBusy} onPress={handleSaveOptions} variant="secondary">{<SaveIcon></SaveIcon>}
									저장
								</Button>
								<Button isDisabled={!selected || editOptions.length < 2 || isBusy} onPress={handleApprove} variant="primary">{<CheckCircleIcon></CheckCircleIcon>}
									승인
								</Button>
								<Button isDisabled={!selected || isBusy} onPress={handleRegenerate} variant="secondary">{<AutoFixHighIcon></AutoFixHighIcon>}
									재생성
								</Button>
								{selected.status === 'published' && (<Button isDisabled={!selected.caseId || isBusy} onPress={() => handleGenerateVerdict(selected)} variant="primary">{<GavelIcon></GavelIcon>}
										AI 판결 생성 후 종료
									</Button>)}
								<Button isDisabled={!selected || isBusy} onPress={openDelete} variant="secondary">{<DeleteOutlineIcon></DeleteOutlineIcon>}
									삭제
								</Button>
							</div>

							<hr></hr>

							<div>
								<p>
									카테고리: {selected.category ?? '-'}
								</p>
								<p>
									큐 진입: {formatDateTime(selected.queueEnteredAt)}
								</p>
								<p>
									공개: {formatDateTime(selected.publishedAt)}
								</p>
								<p>
									Case ID: {selected.caseId ?? '-'}
								</p>
							</div>
						</div>) : (<div style={{ display: "flex", minHeight: 360 }}>
							<p>제출건을 선택하세요.</p>
						</div>)}
				</section>
			</div>

			<Modal.Backdrop isOpen={deleteOpen} isDismissable={!isBusy} isKeyboardDismissDisabled={isBusy} onOpenChange={next => {
            if (!next && !isBusy)
                closeDelete();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}>
				<Modal.Heading>제출건 삭제</Modal.Heading>
				<Modal.Body>
					<TextField className="mb-4"><Label>{"사유"}</Label><TextArea autoFocus value={deleteReason} onChange={(event) => setDeleteReason(event.target.value)}></TextArea></TextField>
				</Modal.Body>
				<Modal.Footer>
					<Button onPress={closeDelete} isDisabled={isBusy} variant="tertiary">
						취소
					</Button>
					<Button onPress={handleDelete} isDisabled={isBusy || !deleteReason.trim()} variant="danger">
						삭제
					</Button>
				</Modal.Footer>
			</Modal.Dialog></Modal.Container></Modal.Backdrop>
		</div>);
}
