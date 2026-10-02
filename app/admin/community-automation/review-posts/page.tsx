'use client';
import { Button, Spinner, Chip, Modal, TextField, Label, Input, TextArea, Description, Select, ListBox } from '@heroui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CommunityReviewPostJob, ReviewPostJobStatus, ReviewSourceStat, ReviewSourceType, } from '@/app/services/admin/community-automation';
import { reviewSources as reviewSourcesApi } from '@/app/services/admin/community-automation';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog';
import { useToast } from '@/shared/ui/admin/toast';
const SOURCE_TYPE_OPTIONS: Array<{
    value: ReviewSourceType;
    label: string;
}> = [
    { value: 'APP_STORE', label: 'App Store' },
    { value: 'PLAY_STORE', label: 'Play Store' },
    { value: 'YEONPICK', label: 'Yeonpick' },
];
const JOB_STATUS_LABEL: Record<ReviewPostJobStatus, string> = {
    draft: '초안',
    scheduled: '예약됨',
    published: '발행됨',
    failed: '실패',
    cancelled: '취소됨',
};
const JOB_STATUS_COLOR: Record<ReviewPostJobStatus, 'default' | 'info' | 'success' | 'error' | 'warning'> = {
    draft: 'default',
    scheduled: 'info',
    published: 'success',
    failed: 'error',
    cancelled: 'warning',
};
function formatDateTime(value: string | null) {
    if (!value)
        return '-';
    return new Date(value).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' });
}
function dateTimeLocalInput(offsetMinutes = 0) {
    const date = new Date(Date.now() + offsetMinutes * 60000);
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function toIsoFromDateTimeLocal(value: string) {
    return new Date(value).toISOString();
}
function sourceLabel(value: string) {
    return SOURCE_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
function statCount(stats: ReviewSourceStat[], sourceType: ReviewSourceType, safetyStatus: string, embeddingStatus?: string) {
    return stats
        .filter((item) => item.sourceType === sourceType)
        .filter((item) => item.safetyStatus === safetyStatus)
        .filter((item) => !embeddingStatus || item.embeddingStatus === embeddingStatus)
        .reduce((sum, item) => sum + Number(item.count ?? 0), 0);
}
export default function ReviewPostsPage() {
    const confirm = useConfirm();
    const toast = useToast();
    // 에러는 페이지 배너와 함께 토스트로도 알린다 (모달에 가려져 보이지 않기 때문).
    function fail(e: unknown, fallback: string) {
        const message = e instanceof Error ? e.message : fallback;
        setError(message);
        toast.error(message);
    }
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [stats, setStats] = useState<ReviewSourceStat[]>([]);
    const [jobs, setJobs] = useState<CommunityReviewPostJob[]>([]);
    const [statusFilter, setStatusFilter] = useState<ReviewPostJobStatus | 'all'>('all');
    const [seedText, setSeedText] = useState('');
    const [sourceTypes, setSourceTypes] = useState<ReviewSourceType[]>(['APP_STORE', 'PLAY_STORE', 'YEONPICK']);
    const [minRating, setMinRating] = useState(4);
    const [scheduledAt, setScheduledAt] = useState(dateTimeLocalInput(24 * 60));
    const [editingJob, setEditingJob] = useState<CommunityReviewPostJob | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const minScheduleAt = useMemo(() => dateTimeLocalInput(0), []);
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [nextStats, nextJobs] = await Promise.all([
                reviewSourcesApi.stats(),
                reviewSourcesApi.listPostJobs(statusFilter === 'all' ? undefined : statusFilter),
            ]);
            setStats(nextStats);
            setJobs(nextJobs);
        }
        catch (e: unknown) {
            setError(e instanceof Error ? e.message : '리뷰 자동작성 데이터를 불러오지 못했습니다.');
        }
        finally {
            setLoading(false);
        }
    }, [statusFilter]);
    useEffect(() => {
        load();
    }, [load]);
    async function syncQdrant() {
        setActionLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const result = await reviewSourcesApi.syncQdrant(100);
            setSuccess(`Qdrant 동기화 완료: 임베딩 ${result.embedded}건, 실패 ${result.failed}건`);
            await load();
        }
        catch (e: unknown) {
            fail(e, 'Qdrant 동기화 실패');
        }
        finally {
            setActionLoading(false);
        }
    }
    async function createReviewPost(options?: {
        publishNow?: boolean;
    }) {
        if (!seedText.trim()) {
            setError('리뷰 글 방향을 입력해 주세요.');
            return;
        }
        const nextScheduledAt = options?.publishNow ? dateTimeLocalInput(0) : scheduledAt;
        if (!nextScheduledAt) {
            setError('발행 예약 시간을 선택해 주세요.');
            return;
        }
        if (options?.publishNow) {
            const ok = await confirm({
                title: '리뷰 게시글 지금 작성',
                message: '리뷰 게시글을 즉시 발행합니다.\n발행 후에는 앱에 바로 노출됩니다.',
                confirmText: '지금 작성',
                severity: 'warning',
            });
            if (!ok)
                return;
        }
        setActionLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const job = await reviewSourcesApi.createPostJob({
                seedText: seedText.trim(),
                sourceTypes,
                minRating,
                scheduledAt: toIsoFromDateTimeLocal(nextScheduledAt),
            });
            setSeedText('');
            setSuccess(options?.publishNow
                ? '리뷰 게시글을 지금 작성했습니다.'
                : `${formatDateTime(job.scheduledAt)} 발행 예약 리뷰를 생성했습니다.`);
            await load();
        }
        catch (e: unknown) {
            fail(e, '리뷰 예약 생성 실패');
        }
        finally {
            setActionLoading(false);
        }
    }
    function openEditDialog(job: CommunityReviewPostJob) {
        setEditingJob(job);
        setEditTitle(job.title);
        setEditContent(job.content);
    }
    function closeEditDialog() {
        setEditingJob(null);
        setEditTitle('');
        setEditContent('');
    }
    async function saveEdit() {
        if (!editingJob)
            return;
        if (!editTitle.trim() || !editContent.trim()) {
            fail(null, '제목과 본문을 모두 입력해 주세요.');
            return;
        }
        setActionLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await reviewSourcesApi.updatePostJob(editingJob.id, {
                title: editTitle.trim(),
                content: editContent.trim(),
            });
            setSuccess('리뷰 내용을 수정했습니다.');
            closeEditDialog();
            await load();
        }
        catch (e: unknown) {
            fail(e, '리뷰 수정 실패');
        }
        finally {
            setActionLoading(false);
        }
    }
    return (<div>
			<div>
				<div>
					<div>
						<h2 className="text-lg font-semibold">
							리뷰 자동작성
						</h2>
						<p>
							Qdrant에 동기화된 실제 리뷰를 RAG/few-shot으로 참고해 리뷰 게시글을 예약하거나 지금 작성합니다.
						</p>
					</div>
					<Button isDisabled={actionLoading} onPress={syncQdrant} variant="secondary">
						Qdrant 동기화
					</Button>
				</div>

				{error && <aside role="alert" className="rounded-lg border p-3">{error}</aside>}
				{success && <aside role="alert" className="rounded-lg border p-3">{success}</aside>}

				<div>
					<section style={{ padding: 16, borderRadius: '16px', flex: 1.05 }} className="rounded-xl border bg-white p-4">
						<div>
							<div>
								<p>
									리뷰 글 예약 생성
								</p>
								<p>
									시간 단위 예약이 가능하며, 지금 작성은 즉시 리뷰 게시글로 발행합니다.
								</p>
							</div>
							<TextField className="mb-4"><Label>{"리뷰 글 방향"}</Label><TextArea placeholder="예: 수도권 대학생들이 공감할 만한 소개팅 후기, 부담 없이 읽히는 톤" value={seedText} onChange={(event) => setSeedText(event.target.value)}></TextArea></TextField>
							<div>
								<div>
									<label id="review-source-types-label">원본</label>
									<Select value={sourceTypes} aria-label={"원본"} selectionMode="multiple" onChange={keys => setSourceTypes(Array.from(Array.from(keys, value => ({ value: value })), option => option.value as ReviewSourceType))} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
										{SOURCE_TYPE_OPTIONS.map((option) => (<ListBox.Item key={option.value} id={option.value} textValue={String(option.label)}>
												{option.label}
											</ListBox.Item>))}
									</ListBox></Select.Popover></Select>
								</div>
								<TextField className="mb-4"><Label>{"최소 평점"}</Label><Input type="number" value={minRating} onChange={(event) => setMinRating(Math.max(1, Math.min(5, Number(event.target.value) || 1)))} {...{ min: 1, max: 5 }}></Input></TextField>
								<TextField className="mb-4"><Label>{"발행 예약 시간"}</Label><Input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} {...{ min: minScheduleAt }}></Input></TextField>
							</div>
							<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
								<Button isDisabled={actionLoading || !seedText.trim() || !scheduledAt} onPress={() => createReviewPost()} variant="primary" style={{ fontWeight: 800, borderRadius: '10px' }}>
									예약 생성
								</Button>
								<Button isDisabled={actionLoading || !seedText.trim()} onPress={() => createReviewPost({ publishNow: true })} variant="secondary" style={{ fontWeight: 800, borderRadius: '10px' }}>
									지금 작성
								</Button>
							</div>
						</div>
					</section>

					<section style={{ padding: 16, borderRadius: '16px', flex: 0.95 }} className="rounded-xl border bg-white p-4">
						<div>
							<div>
								<p>
									리뷰 원본 상태
								</p>
								<p>
									승인 및 임베딩된 원본만 RAG 검색에 안정적으로 사용됩니다.
								</p>
							</div>
							<div>
								{SOURCE_TYPE_OPTIONS.map((option) => (<div key={option.value} style={{ padding: 9.6, border: '1px solid #E5E8EB', borderRadius: '12px' }}>
										<div>
											<p>{option.label}</p>
											<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
												<Chip size="sm">{`승인 ${statCount(stats, option.value, 'approved')}`}</Chip>
												<Chip size="sm">{`임베딩 ${statCount(stats, option.value, 'approved', 'embedded')}`}</Chip>
												<Chip size="sm">{`대기 ${statCount(stats, option.value, 'approved', 'pending')}`}</Chip>
											</div>
										</div>
									</div>))}
							</div>
						</div>
					</section>
				</div>

				<section style={{ padding: 16, borderRadius: '16px' }} className="rounded-xl border bg-white p-4">
					<div>
						<div>
							<div>
								<p>
									리뷰 예약 작업
								</p>
								<p>
									매분 서버 스케줄러가 예약일이 지난 작업을 리뷰 게시글로 발행합니다.
								</p>
							</div>
							<div>
								<div style={{ minWidth: 140 }}>
									<label id="review-job-status-label">상태</label>
									<Select value={statusFilter} aria-label={"상태"} onChange={(key) => {
            const value = String(key ?? "");
            setStatusFilter(value as ReviewPostJobStatus | 'all');
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
										<ListBox.Item id={"all"} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
										<ListBox.Item id={"scheduled"} textValue={"\uC608\uC57D\uB428"}>예약됨</ListBox.Item>
										<ListBox.Item id={"published"} textValue={"\uBC1C\uD589\uB428"}>발행됨</ListBox.Item>
										<ListBox.Item id={"failed"} textValue={"\uC2E4\uD328"}>실패</ListBox.Item>
										<ListBox.Item id={"cancelled"} textValue={"\uCDE8\uC18C\uB428"}>취소됨</ListBox.Item>
									</ListBox></Select.Popover></Select>
								</div>
								<Button isDisabled={loading} onPress={load} variant="secondary">새로고침</Button>
							</div>
						</div>

						{loading ? (<div style={{ display: "flex", paddingBlock: 40 }}>
								<Spinner size="sm"></Spinner>
							</div>) : jobs.length === 0 ? (<div style={{ padding: 24, backgroundColor: '#F8F9FA', border: '1px solid #E5E8EB', borderRadius: '12px', textAlign: 'center' }}>
								<p>
									리뷰 예약 작업이 없습니다.
								</p>
							</div>) : (<div>
								{jobs.map((job) => (<div key={job.id} style={{ padding: 12, border: '1px solid #E5E8EB', borderRadius: '12px' }}>
										<div>
											<div>
												<div style={{ minWidth: 0 }}>
													<p style={{ wordBreak: 'keep-all' }}>
														{job.title}
													</p>
													<p style={{ marginTop: 4, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
														{job.content}
													</p>
												</div>
												<div>
													{job.status !== 'published' && (<Button onPress={() => openEditDialog(job)} variant="secondary">
															수정
														</Button>)}
													<Chip size="sm">{JOB_STATUS_LABEL[job.status]}</Chip>
												</div>
											</div>
											<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
												<Chip size="sm">{`예약 ${formatDateTime(job.scheduledAt)}`}</Chip>
												<Chip size="sm">{`발행 ${formatDateTime(job.publishedAt)}`}</Chip>
												<Chip size="sm">{`RAG ${job.sourceDocumentIds.length}건`}</Chip>
												{job.publishedArticleId && <Chip size="sm">{`게시글 ${job.publishedArticleId}`}</Chip>}
												{job.errorMessage && <Chip size="sm">{job.errorMessage}</Chip>}
											</div>
										</div>
									</div>))}
							</div>)}
					</div>
				</section>
			</div>
			<Modal.Backdrop isOpen={Boolean(editingJob)} isDismissable={!actionLoading} isKeyboardDismissDisabled={actionLoading} onOpenChange={next => {
            if (!next && !actionLoading)
                closeEditDialog();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 900, minWidth: 0 }}>
				<Modal.Heading style={{ fontWeight: 900 }}>리뷰 내용 수정</Modal.Heading>
				<Modal.Body style={{ paddingTop: '12px' }}>
					<div>
						<TextField className="mb-4"><Label>{"제목"}</Label><Input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} {...{ maxLength: 30 }}></Input><Description>{`${editTitle.length}/30`}</Description></TextField>
						<TextField className="mb-4"><Label>{"본문"}</Label><TextArea value={editContent} onChange={(event) => setEditContent(event.target.value)}></TextArea></TextField>
					</div>
				</Modal.Body>
				<Modal.Footer>
					<Button onPress={closeEditDialog} isDisabled={actionLoading} variant="tertiary">취소</Button>
					<Button onPress={saveEdit} isDisabled={actionLoading || !editTitle.trim() || !editContent.trim()} variant="primary">
						저장
					</Button>
				</Modal.Footer>
			</Modal.Dialog></Modal.Container></Modal.Backdrop>
		</div>);
}
