'use client';
import { Button, Spinner, Chip, Tabs, TextField, Label, TextArea, Select, ListBox } from '@heroui/react';
import { Send as SendIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { LiveCommentSuggestion, ScheduledCommentTimelineItem, } from '@/app/services/admin/community-automation';
import type { GhostCommentBody, GhostCommentResult, GhostLikeBody, GhostLikeResult } from '@/app/services/community';
import { safeToLocaleString } from '@/app/utils/formatters';
type CommentLike = {
    id: string;
    articleId?: string;
    userId?: string;
    authorId?: string;
    authorName?: string | null;
    nickname?: string | null;
    content: string;
    parentId?: string | null;
    createdAt?: string | Date;
    isBlinded?: boolean;
    isDeleted?: boolean;
    blindedAt?: string | Date | null;
    deletedAt?: string | Date | null;
};
type GhostCandidateLike = {
    id?: string;
    ghostAccountId?: string;
    ghostUserId: string;
    name?: string | null;
    region?: string | null;
    regionCluster?: string | null;
    recentCommentCount?: number;
    hasArticleComment?: boolean;
};
type PostLike = {
    id: string;
    title?: string | null;
    content: string;
    authorId?: string | null;
    authorName?: string | null;
    nickname?: string | null;
    categoryName?: string | null;
    categoryId?: string | null;
    createdAt?: string | Date;
    likeCount?: number;
    commentCount?: number;
    readCount?: number;
    reportCount?: number;
    isBlinded?: boolean;
    isDeleted?: boolean;
    blindedAt?: string | Date | null;
    deletedAt?: string | Date | null;
};
interface CommunityPostAppDetailPanelProps {
    post: PostLike;
    comments: CommentLike[];
    ghostCandidates?: GhostCandidateLike[];
    ghostCandidateCount?: number;
    submitLabel?: string;
    onSubmitGhostComment: (articleId: string, body: GhostCommentBody) => Promise<GhostCommentResult>;
    onSubmitGhostLike?: (articleId: string, body: GhostLikeBody) => Promise<GhostLikeResult>;
    onReload?: () => Promise<void>;
    scheduledComments?: ScheduledCommentTimelineItem[];
    scheduledCommentsLoading?: boolean;
    onReloadScheduledComments?: () => Promise<void>;
    onCancelScheduledComment?: (contentId: string) => Promise<void>;
    onRescheduleScheduledComment?: (contentId: string, delayMinutes: number) => Promise<void>;
    onLoadLiveCommentSuggestions?: () => Promise<LiveCommentSuggestion[]>;
}
function getGhostAccountId(candidate: GhostCandidateLike) {
    return candidate.ghostAccountId ?? candidate.id ?? '';
}
function getCommentAuthor(comment: CommentLike) {
    return comment.authorName ?? comment.nickname ?? comment.authorId ?? comment.userId ?? '익명';
}
function formatCount(value: number | undefined) {
    return new Intl.NumberFormat('ko-KR').format(value ?? 0);
}
const SCHEDULED_COMMENT_STATUS_LABEL: Record<ScheduledCommentTimelineItem['status'], string> = {
    scheduled: '예약됨',
    published: '발화됨',
    quality_failed: '실패',
    withdrawn: '취소됨',
};
const SCHEDULED_COMMENT_HEALTH_LABEL: Record<ScheduledCommentTimelineItem['healthFlags'][number], string> = {
    due_soon: '5분 이내',
    delayed: '지연됨',
    revalidation_failed: '재검증 실패',
};
const SCHEDULED_TARGET_TYPE_LABEL: Record<string, string> = {
    COMMENT: '댓글',
    REPLY: '답글',
    ARTICLE_LIKE: '게시글 좋아요',
    COMMENT_LIKE: '댓글 좋아요',
};
const LIVE_COMMENT_TONE_LABEL: Record<LiveCommentSuggestion['tone'], string> = {
    empathetic: '공감형',
    question: '질문형',
    mood_shift: '분위기 전환형',
};
export function CommunityPostAppDetailPanel({ post, comments, ghostCandidates = [], ghostCandidateCount, submitLabel = '지금 AI 댓글 달기', onSubmitGhostComment, onSubmitGhostLike, onReload, scheduledComments = [], scheduledCommentsLoading = false, onReloadScheduledComments, onCancelScheduledComment, onRescheduleScheduledComment, onLoadLiveCommentSuggestions, }: CommunityPostAppDetailPanelProps) {
    const [localComments, setLocalComments] = useState<CommentLike[]>(comments);
    const [operationTab, setOperationTab] = useState<'compose' | 'like' | 'timeline'>('compose');
    const [mode, setMode] = useState<'auto' | 'manual'>('auto');
    const [deliveryMode, setDeliveryMode] = useState<'now' | 'delay'>('now');
    const [delayMinutes, setDelayMinutes] = useState(30);
    const [timelineDelayMinutesById, setTimelineDelayMinutesById] = useState<Record<string, number>>({});
    const [selectedGhostId, setSelectedGhostId] = useState('');
    const [content, setContent] = useState('');
    const [suggestions, setSuggestions] = useState<LiveCommentSuggestion[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [suggestionActionKey, setSuggestionActionKey] = useState<string | null>(null);
    const [timelineActionId, setTimelineActionId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [likeAction, setLikeAction] = useState<'article' | 'comment'>('article');
    const [targetCommentId, setTargetCommentId] = useState('');
    useEffect(() => {
        setLocalComments(comments);
    }, [comments]);
    const sortedComments = useMemo(() => [...localComments].sort((a, b) => {
        const left = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const right = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return left - right;
    }), [localComments]);
    const blinded = Boolean(post.isBlinded || post.blindedAt);
    const deleted = Boolean(post.isDeleted || post.deletedAt);
    const canSubmit = content.trim().length > 0 && (mode === 'auto' || selectedGhostId);
    const canSubmitSuggestion = mode === 'auto' || selectedGhostId;
    const timelineEnabled = Boolean(onReloadScheduledComments || onCancelScheduledComment || onRescheduleScheduledComment);
    const likeEnabled = Boolean(onSubmitGhostLike);
    async function submit(options?: {
        contentOverride?: string;
        delayMinutesOverride?: number;
    }) {
        const nextContent = options?.contentOverride?.trim() ?? content.trim();
        const nextDelayMinutes = options?.delayMinutesOverride;
        if (!nextContent || (mode === 'manual' && !selectedGhostId))
            return;
        setSubmitting(true);
        setError(null);
        setSuccess(null);
        try {
            const result = await onSubmitGhostComment(post.id, {
                content: nextContent,
                ghostAccountId: mode === 'manual' ? selectedGhostId : undefined,
                delayMinutes: nextDelayMinutes ?? (deliveryMode === 'delay' ? delayMinutes : undefined),
            });
            if (result.comment) {
                setLocalComments((prev) => [...prev, result.comment as CommentLike]);
            }
            setContent('');
            const ghostLabel = result.ghost.name ?? result.ghost.ghostUserId;
            if (result.scheduledComment) {
                setSuccess(`${ghostLabel} 계정으로 ${result.scheduledComment.delayMinutes}분 후 댓글 발송을 예약했습니다.`);
                await onReloadScheduledComments?.();
                setOperationTab('timeline');
            }
            else {
                setSuccess(result.selectionMode === 'manual'
                    ? `${ghostLabel} 계정으로 댓글을 작성했습니다.`
                    : `${ghostLabel} 계정이 자동 선택되었습니다.`);
            }
            try {
                await onReload?.();
            }
            catch (reloadError) {
                setError(reloadError instanceof Error
                    ? `댓글은 작성됐지만 재조회에 실패했습니다. ${reloadError.message}`
                    : '댓글은 작성됐지만 재조회에 실패했습니다.');
            }
        }
        catch (e: unknown) {
            setError(e instanceof Error ? e.message : '댓글 작성에 실패했습니다.');
        }
        finally {
            setSubmitting(false);
        }
    }
    async function loadLiveCommentSuggestions() {
        if (!onLoadLiveCommentSuggestions)
            return;
        setSuggestionsLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const items = await onLoadLiveCommentSuggestions();
            setSuggestions(items);
            setSuccess('댓글 후보 3개를 추천했습니다.');
        }
        catch (e: unknown) {
            setError(e instanceof Error ? e.message : '댓글 후보 추천에 실패했습니다.');
        }
        finally {
            setSuggestionsLoading(false);
        }
    }
    async function submitSuggestion(suggestion: LiveCommentSuggestion, delayMinutesOverride?: number) {
        const actionKey = `${suggestion.tone}:${delayMinutesOverride ?? 'now'}`;
        setSuggestionActionKey(actionKey);
        try {
            await submit({ contentOverride: suggestion.content, delayMinutesOverride });
        }
        finally {
            setSuggestionActionKey(null);
        }
    }
    async function submitLike() {
        if (!onSubmitGhostLike)
            return;
        if (mode === 'manual' && !selectedGhostId)
            return;
        if (likeAction === 'comment' && !targetCommentId)
            return;
        setSubmitting(true);
        setError(null);
        setSuccess(null);
        try {
            const result = await onSubmitGhostLike(post.id, {
                ghostAccountId: mode === 'manual' ? selectedGhostId : undefined,
                delayMinutes: deliveryMode === 'delay' ? delayMinutes : undefined,
                targetCommentId: likeAction === 'comment' ? targetCommentId : null,
            });
            const ghostLabel = result.ghost.name ?? result.ghost.ghostUserId;
            if (result.scheduledLike) {
                setSuccess(`${ghostLabel} 계정으로 ${result.scheduledLike.delayMinutes}분 후 ${result.scheduledLike.targetCommentId ? '댓글' : '게시글'} 좋아요 발송을 예약했습니다.`);
                await onReloadScheduledComments?.();
                setOperationTab('timeline');
            }
            else if (result.like) {
                setSuccess(result.selectionMode === 'manual'
                    ? `${ghostLabel} 계정으로 좋아요를 발송했습니다.`
                    : `${ghostLabel} 계정이 자동 선택되어 좋아요를 발송했습니다.`);
                try {
                    await onReload?.();
                }
                catch {
                    // Show success even if reload fails
                }
            }
        }
        catch (e: unknown) {
            setError(e instanceof Error ? e.message : '좋아요 발송에 실패했습니다.');
        }
        finally {
            setSubmitting(false);
        }
    }
    async function cancelScheduledComment(contentId: string) {
        if (!onCancelScheduledComment)
            return;
        setTimelineActionId(contentId);
        setError(null);
        setSuccess(null);
        try {
            await onCancelScheduledComment(contentId);
            setSuccess('예약 댓글을 취소했습니다.');
        }
        catch (e: unknown) {
            setError(e instanceof Error ? e.message : '예약 댓글 취소에 실패했습니다.');
        }
        finally {
            setTimelineActionId(null);
        }
    }
    async function rescheduleScheduledComment(contentId: string) {
        if (!onRescheduleScheduledComment)
            return;
        const nextDelayMinutes = timelineDelayMinutesById[contentId] ?? 30;
        setTimelineActionId(contentId);
        setError(null);
        setSuccess(null);
        try {
            await onRescheduleScheduledComment(contentId, nextDelayMinutes);
            setSuccess(`${nextDelayMinutes}분 후 발송으로 변경했습니다.`);
        }
        catch (e: unknown) {
            setError(e instanceof Error ? e.message : '예약 댓글 시간 변경에 실패했습니다.');
        }
        finally {
            setTimelineActionId(null);
        }
    }
    return (<div className="grid items-start gap-6 lg:grid-cols-[390px_minmax(0,1fr)]">
			<section style={{ borderRadius: 4, overflow: 'hidden', backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)', maxWidth: 390, width: '100%' }} className="rounded-xl border bg-white p-4">
				<div style={{ backgroundColor: '#FFFFFF', color: '#191F28', paddingInline: 16, paddingBlock: 11.2 }}>
					<p>커뮤니티</p>
				</div>
				<div style={{ padding: 16 }}>
					<div>
						<span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
							{(post.authorName ?? post.nickname ?? '익').slice(0, 1)}
						</span>
						<div style={{ minWidth: 0, flex: 1 }}>
							<p>
								{post.nickname ?? post.authorName ?? '익명'}
							</p>
							<p>
								{post.categoryName ?? post.categoryId ?? '커뮤니티'} · {post.createdAt ? safeToLocaleString(post.createdAt) : '-'}
							</p>
						</div>
					</div>
					<h2 className="text-lg font-semibold" style={{ marginTop: 16, lineHeight: 1.35, color: '#191F28' }}>
						{post.title ?? '제목 없음'}
					</h2>
					<p style={{ marginTop: 9.6, whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#4E5968' }}>
						{post.content}
					</p>
					<div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
						<Chip size="sm">{`좋아요 ${formatCount(post.likeCount)}`}</Chip>
						<Chip size="sm">{`댓글 ${formatCount(post.commentCount ?? sortedComments.length)}`}</Chip>
						<Chip size="sm">{`조회 ${formatCount(post.readCount)}`}</Chip>
						<Chip size="sm">{`신고 ${formatCount(post.reportCount)}`}</Chip>
					</div>
					{(blinded || deleted) && (<div style={{ marginTop: 12 }}>
							{blinded && <Chip size="sm">{"블라인드"}</Chip>}
							{deleted && <Chip size="sm">{"삭제됨"}</Chip>}
						</div>)}
				</div>
				<hr></hr>
				<div style={{ padding: 16, maxHeight: 420, overflow: 'auto', backgroundColor: '#FFFFFF' }}>
					<p style={{ marginBottom: 12, color: '#191F28' }}>
						댓글 {sortedComments.length}
					</p>
					<div>
						{sortedComments.length === 0 ? (<p>댓글 없음</p>) : (sortedComments.map((comment) => {
            const isReply = Boolean(comment.parentId);
            const isBlinded = Boolean(comment.isBlinded || comment.blindedAt);
            return (<div key={comment.id} style={{ marginLeft: isReply ? 3 : 0 }}>
										<div>
											<span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
												{getCommentAuthor(comment).slice(0, 1)}
											</span>
											<div style={{ minWidth: 0, flex: 1 }}>
												<div>
													<p>
														{getCommentAuthor(comment)}
													</p>
													{isReply && <Chip size="sm">{"대댓글"}</Chip>}
													{isBlinded && <Chip size="sm">{"블라인드"}</Chip>}
												</div>
												<p style={{ whiteSpace: 'pre-wrap', color: isBlinded ? 'text.disabled' : 'text.primary' }}>
													{comment.content}
												</p>
												<p>
													{comment.createdAt ? safeToLocaleString(comment.createdAt) : '-'}
												</p>
											</div>
										</div>
									</div>);
        }))}
					</div>
				</div>
			</section>

			<div className="min-w-0">
				<section style={{ padding: 16, borderRadius: '16px', backgroundColor: '#FFFFFF' }} className="rounded-xl border bg-white p-4">
					{timelineEnabled && (<Tabs style={{ minHeight: 40, marginBottom: 16 }} selectedKey={operationTab} onSelectionChange={value => setOperationTab(value as typeof operationTab)}><Tabs.List aria-label="관리 항목">
							<Tabs.Tab style={{ minHeight: 40, fontWeight: 700 }} id={"compose"}>{"AI 댓글"}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
							<Tabs.Tab style={{ minHeight: 40, fontWeight: 700 }} id={"like"}>{"좋아요"}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
							<Tabs.Tab style={{ minHeight: 40, fontWeight: 700 }} id={"timeline"}>{"예약 타임라인"}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
						</Tabs.List></Tabs>)}

					{operationTab === 'compose' && (<>
					<div>
						<div>
							<p>AI 댓글 활동</p>
							<p>
								ACTIVE 후보 {ghostCandidateCount ?? ghostCandidates.length}명
							</p>
						</div>
						<div className="flex flex-wrap gap-2">
							<Button aria-pressed={mode === "auto"} variant={mode === "auto" ? "primary" : "secondary"} onPress={() => setMode("auto")}>자동 선택</Button>
							<Button aria-pressed={mode === "manual"} variant={mode === "manual" ? "primary" : "secondary"} onPress={() => setMode("manual")}>직접 선택</Button>
						</div>
					</div>

					<div style={{ marginTop: 16 }}>
						<div className="flex flex-wrap gap-2">
							<Button aria-pressed={deliveryMode === "now"} variant={deliveryMode === "now" ? "primary" : "secondary"} onPress={() => setDeliveryMode("now")}>즉시 발송</Button>
							<Button aria-pressed={deliveryMode === "delay"} variant={deliveryMode === "delay" ? "primary" : "secondary"} onPress={() => setDeliveryMode("delay")}>지연 발송</Button>
						</div>
						{deliveryMode === 'delay' && (<div style={{ minWidth: 150 }}>
								<label>발송 지연</label>
								<Select value={delayMinutes} aria-label={"발송 지연"} onChange={(key) => {
                    const value = String(key ?? "");
                    setDelayMinutes(Number(value));
                }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
									{Array.from({ length: 36 }, (_, index) => (index + 1) * 5).map((minutes) => (<ListBox.Item key={minutes} id={minutes} textValue={String(minutes) + (" " + "\uBD84 \uD6C4")}>
											{minutes}분 후
										</ListBox.Item>))}
								</ListBox></Select.Popover></Select>
							</div>)}
					</div>

					{mode === 'manual' && (<div style={{ marginTop: 16 }}>
							<label>고스트 계정</label>
							<Select value={selectedGhostId} aria-label={"고스트 계정"} onChange={(key) => {
                    const value = String(key ?? "");
                    setSelectedGhostId(value);
                }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
								{ghostCandidates.map((candidate) => {
                    const ghostAccountId = getGhostAccountId(candidate);
                    return (<ListBox.Item key={ghostAccountId} id={ghostAccountId} textValue={String(candidate.name ?? candidate.ghostUserId) + (" " + String(candidate.regionCluster ? ` · ${candidate.regionCluster}` : '')) + (" " + String(candidate.hasArticleComment ? ' · 이미 댓글 있음' : ''))}>
											{candidate.name ?? candidate.ghostUserId}
											{candidate.regionCluster ? ` · ${candidate.regionCluster}` : ''}
											{candidate.hasArticleComment ? ' · 이미 댓글 있음' : ''}
										</ListBox.Item>);
                })}
							</ListBox></Select.Popover></Select>
						</div>)}

					{onLoadLiveCommentSuggestions && (<div style={{ marginTop: 16 }}>
							<div>
								<p>
									댓글 후보
								</p>
								<Button isDisabled={suggestionsLoading} onPress={loadLiveCommentSuggestions} variant="secondary">
									{suggestionsLoading ? <Spinner size="sm"></Spinner> : '댓글 후보 3개 추천'}
								</Button>
							</div>
							{suggestions.length > 0 && (<div style={{ marginTop: 8 }}>
									{suggestions.map((suggestion) => {
                        const nowKey = `${suggestion.tone}:now`;
                        const delay15Key = `${suggestion.tone}:15`;
                        const delay30Key = `${suggestion.tone}:30`;
                        return (<section key={suggestion.tone} style={{ padding: 10.4, backgroundColor: '#FBFCFD' }} className="rounded-xl border bg-white p-4">
												<div>
													<div>
														<Chip size="sm">{LIVE_COMMENT_TONE_LABEL[suggestion.tone]}</Chip>
														<p>
															{suggestion.reason}
														</p>
													</div>
													<p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
														{suggestion.content}
													</p>
													<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
														<Button isDisabled={!canSubmitSuggestion || Boolean(suggestionActionKey)} onPress={() => submitSuggestion(suggestion)} variant="primary" style={{ boxShadow: 'none' }}>
															{suggestionActionKey === nowKey ? <Spinner size="sm"></Spinner> : '즉시 발송'}
														</Button>
														<Button isDisabled={!canSubmitSuggestion || Boolean(suggestionActionKey)} onPress={() => submitSuggestion(suggestion, 15)} variant="secondary">
															{suggestionActionKey === delay15Key ? <Spinner size="sm"></Spinner> : '15분 후'}
														</Button>
														<Button isDisabled={!canSubmitSuggestion || Boolean(suggestionActionKey)} onPress={() => submitSuggestion(suggestion, 30)} variant="secondary">
															{suggestionActionKey === delay30Key ? <Spinner size="sm"></Spinner> : '30분 후'}
														</Button>
														<Button onPress={() => {
                                setContent(suggestion.content);
                                setDeliveryMode('now');
                            }} variant="tertiary">
															직접 수정
														</Button>
													</div>
												</div>
											</section>);
                    })}
								</div>)}
						</div>)}
					<TextField className="mb-4"><Label>{"댓글 내용"}</Label><TextArea value={content} onChange={(event) => setContent(event.target.value)}></TextArea></TextField>
					<div style={{ marginTop: 12 }}>
						<Button isDisabled={!canSubmit || submitting} onPress={() => submit()} variant="primary" style={{ borderRadius: '9999px', backgroundColor: '#7A4AE2', boxShadow: 'none', fontWeight: 700 }}>{submitting ? <Spinner size="sm"></Spinner> : <SendIcon></SendIcon>}
							{deliveryMode === 'delay' ? `${delayMinutes}분 후 발송 예약` : submitLabel}
						</Button>
						<p>
							{deliveryMode === 'delay' ? '예약 시점에 선택된 고스트로 발송' : '최상위 댓글만 작성'}
						</p>
					</div>
						</>)}
					{operationTab === 'like' && likeEnabled && (<>
					<div>
						<div>
							<p>AI 좋아요 활동</p>
							<p>
								ACTIVE 후보 {ghostCandidateCount ?? ghostCandidates.length}명
							</p>
						</div>
						<div className="flex flex-wrap gap-2">
							<Button aria-pressed={mode === "auto"} variant={mode === "auto" ? "primary" : "secondary"} onPress={() => setMode("auto")}>자동 선택</Button>
							<Button aria-pressed={mode === "manual"} variant={mode === "manual" ? "primary" : "secondary"} onPress={() => setMode("manual")}>직접 선택</Button>
						</div>
					</div>

					<div style={{ marginTop: 16 }}>
						<div className="flex flex-wrap gap-2">
							<Button aria-pressed={likeAction === "article"} variant={likeAction === "article" ? "primary" : "secondary"} onPress={() => setLikeAction("article")}>게시글 좋아요</Button>
							<Button aria-pressed={likeAction === "comment"} variant={likeAction === "comment" ? "primary" : "secondary"} onPress={() => setLikeAction("comment")}>댓글 좋아요</Button>
						</div>
						<div className="flex flex-wrap gap-2">
							<Button aria-pressed={deliveryMode === "now"} variant={deliveryMode === "now" ? "primary" : "secondary"} onPress={() => setDeliveryMode("now")}>즉시 발송</Button>
							<Button aria-pressed={deliveryMode === "delay"} variant={deliveryMode === "delay" ? "primary" : "secondary"} onPress={() => setDeliveryMode("delay")}>지연 발송</Button>
						</div>
						{deliveryMode === 'delay' && (<div style={{ minWidth: 150 }}>
								<label>발송 지연</label>
								<Select value={delayMinutes} aria-label={"발송 지연"} onChange={(key) => {
                    const value = String(key ?? "");
                    setDelayMinutes(Number(value));
                }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
									{Array.from({ length: 36 }, (_, index) => (index + 1) * 5).map((minutes) => (<ListBox.Item key={minutes} id={minutes} textValue={String(minutes) + (" " + "\uBD84 \uD6C4")}>
											{minutes}분 후
										</ListBox.Item>))}
								</ListBox></Select.Popover></Select>
							</div>)}
					</div>

					{mode === 'manual' && (<div style={{ marginTop: 16 }}>
							<label>고스트 계정</label>
							<Select value={selectedGhostId} aria-label={"고스트 계정"} onChange={(key) => {
                    const value = String(key ?? "");
                    setSelectedGhostId(value);
                }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
								{ghostCandidates.map((candidate) => {
                    const ghostAccountId = getGhostAccountId(candidate);
                    return (<ListBox.Item key={ghostAccountId} id={ghostAccountId} textValue={String(candidate.name ?? candidate.ghostUserId) + (" " + String(candidate.regionCluster ? ` · ${candidate.regionCluster}` : ''))}>
											{candidate.name ?? candidate.ghostUserId}
											{candidate.regionCluster ? ` · ${candidate.regionCluster}` : ''}
										</ListBox.Item>);
                })}
							</ListBox></Select.Popover></Select>
						</div>)}

					{likeAction === 'comment' && (<div style={{ marginTop: 16 }}>
							<label>대상 댓글</label>
							<Select value={targetCommentId} aria-label={"대상 댓글"} onChange={(key) => {
                    const value = String(key ?? "");
                    setTargetCommentId(value);
                }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
								{sortedComments
                    .filter((c) => !c.isBlinded && !c.isDeleted)
                    .map((comment) => (<ListBox.Item key={comment.id} id={comment.id} textValue={String(getCommentAuthor(comment)) + (" " + ":") + (" " + String(comment.content.slice(0, 40))) + (" " + String(comment.content.length > 40 ? '...' : ''))}>
											{getCommentAuthor(comment)}: {comment.content.slice(0, 40)}
											{comment.content.length > 40 ? '...' : ''}
										</ListBox.Item>))}
							</ListBox></Select.Popover></Select>
						</div>)}

					<div style={{ marginTop: 16 }}>
						<Button isDisabled={submitting || (mode === 'manual' && !selectedGhostId) || (likeAction === 'comment' && !targetCommentId)} onPress={submitLike} variant="primary" style={{ borderRadius: '9999px', backgroundColor: '#E91E63', boxShadow: 'none', fontWeight: 700 }}>{submitting ? <Spinner size="sm"></Spinner> : <SendIcon></SendIcon>}
							{deliveryMode === 'delay'
                ? `${delayMinutes}분 후 좋아요 예약`
                : likeAction === 'article'
                    ? '게시글 좋아요 발송'
                    : '댓글 좋아요 발송'}
						</Button>
						<p>
							{deliveryMode === 'delay' ? '예약 시점에 선택된 고스트로 발송' : '즉시 좋아요 발송'}
						</p>
					</div>
						</>)}
					{operationTab === 'timeline' && timelineEnabled && (<div>
							<div>
								<div>
									<p>
										예약 타임라인
									</p>
									<p>
										DB 상태 기준으로 예약/발화/취소 작업을 표시합니다.
									</p>
								</div>
								<Button isDisabled={scheduledCommentsLoading} onPress={() => onReloadScheduledComments?.()} variant="secondary">
									새로고침
								</Button>
							</div>
							{scheduledCommentsLoading ? (<div style={{ display: "flex", paddingBlock: 32 }}>
									<Spinner size="sm"></Spinner>
								</div>) : scheduledComments.length === 0 ? (<section style={{ padding: 24, textAlign: 'center', backgroundColor: '#F8F9FA' }} className="rounded-xl border bg-white p-4">
									<p>
										예약된 작업이 없습니다.
									</p>
								</section>) : (scheduledComments.map((item) => {
                const isScheduled = item.status === 'scheduled';
                const isLike = item.targetType === 'ARTICLE_LIKE' || item.targetType === 'COMMENT_LIKE';
                const targetTypeLabel = item.targetType ? SCHEDULED_TARGET_TYPE_LABEL[item.targetType] ?? item.targetType : '작업';
                const itemDelayMinutes = timelineDelayMinutesById[item.contentId] ?? 30;
                const actionLoading = timelineActionId === item.contentId;
                const likeIcon = item.targetType === 'ARTICLE_LIKE' ? '❤️' : item.targetType === 'COMMENT_LIKE' ? '💬❤️' : null;
                return (<section key={item.contentId} style={{ padding: 12, backgroundColor: '#FFFFFF' }} className="rounded-xl border bg-white p-4">
											<div>
												<div>
													<div style={{ minWidth: 0 }}>
														<Chip size="sm">{targetTypeLabel}</Chip>
														<p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
															{likeIcon ? `${likeIcon} ` : ''}{item.content || (isLike ? '좋아요' : '')}
														</p>
														<p>
															{item.ghostName ?? item.ghostUserId ?? item.ghostAccountId ?? 'ghost 미지정'}
														</p>
													</div>
													<Chip size="sm">{SCHEDULED_COMMENT_STATUS_LABEL[item.status]}</Chip>
												</div>
												<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
													<p>
														예약 {item.scheduledAt ? safeToLocaleString(item.scheduledAt) : '-'}
													</p>
													<p>
														발화 {item.publishedAt ? safeToLocaleString(item.publishedAt) : '-'}
													</p>
													{item.rejectionReason && (<p>
															{item.rejectionReason}
														</p>)}
												</div>
												{item.healthFlags.length > 0 && (<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
														{item.healthFlags.map((flag) => (<Chip key={flag} size="sm">{SCHEDULED_COMMENT_HEALTH_LABEL[flag]}</Chip>))}
													</div>)}
												{isScheduled && (<div>
														<Button isDisabled={actionLoading} onPress={() => cancelScheduledComment(item.contentId)} variant="secondary">
															취소
														</Button>
														<div style={{ minWidth: 130 }}>
															<label>변경 시간</label>
															<Select value={itemDelayMinutes} aria-label={"변경 시간"} onChange={(key) => {
                            const value = String(key ?? "");
                            setTimelineDelayMinutesById((prev) => ({
                                ...prev,
                                [item.contentId]: Number(value),
                            }));
                        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
																{Array.from({ length: 36 }, (_, index) => (index + 1) * 5).map((minutes) => (<ListBox.Item key={minutes} id={minutes} textValue={String(minutes) + (" " + "\uBD84 \uD6C4")}>
																		{minutes}분 후
																	</ListBox.Item>))}
															</ListBox></Select.Popover></Select>
														</div>
														<Button isDisabled={actionLoading} onPress={() => rescheduleScheduledComment(item.contentId)} variant="primary" style={{ boxShadow: 'none' }}>
															시간 변경
														</Button>
													</div>)}
											</div>
										</section>);
            }))}
						</div>)}
					{error && <aside role="alert" className="rounded-lg border p-3" style={{ marginTop: 16 }}>{error}</aside>}
					{success && <aside role="alert" className="rounded-lg border p-3" style={{ marginTop: 16 }}>{success}</aside>}
				</section>
			</div>
		</div>);
}
