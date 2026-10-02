'use client';
import { Button, Spinner, Chip, Modal, Tabs, Drawer, TextField, Label, Input, TextArea, Select, ListBox, Checkbox } from '@heroui/react';
import { Sparkles as AutoAwesomeIcon, CircleCheck as CheckCircleOutlineIcon, MessageSquare as ChatBubbleOutlineIcon, NotebookPen as EditNoteIcon, Heart as FavoriteBorderIcon, Flag as FlagOutlinedIcon, RotateCcw as RestartAltIcon, SlidersHorizontal as TuneIcon, Eye as VisibilityOutlinedIcon, Flame as WhatshotIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CreateActivityBody, CreateActivityResult, CommunityAutomationCategoryOption, Content, ContentStatus, ScheduledCommentTimelineItem, TargetPostDetail, TargetPostListQuery, TargetPostOpsQueue, TargetPostSummary, } from '@/app/services/admin/community-automation';
import type { GhostCommentBody, GhostLikeBody } from '@/app/services/community';
import communityService from '@/app/services/community';
import { activities as activitiesApi, campaigns as campaignsApi, COMMUNITY_AUTOMATION_CATEGORY_OPTIONS, CommunityAutomationCategory, reviewQueue as reviewApi, targetPosts as targetPostsApi, } from '@/app/services/admin/community-automation';
import { CommunityPostAppDetailPanel } from '@/app/admin/community/components/CommunityPostAppDetailPanel';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog';
import { useToast } from '@/shared/ui/admin/toast';
const STATUS_LABEL: Record<ContentStatus | 'none', string> = {
    none: '미생성',
    draft: '초안',
    pending_review: '검수 대기',
    approved: '승인',
    scheduled: '발송 예약',
    published: '발행됨',
    rejected: '거절됨',
    quality_failed: '품질 실패',
    withdrawn: '회수됨',
};
const STATUS_COLOR: Record<ContentStatus | 'none', 'default' | 'warning' | 'success' | 'error' | 'info'> = {
    none: 'default',
    draft: 'default',
    pending_review: 'warning',
    approved: 'info',
    scheduled: 'info',
    published: 'success',
    rejected: 'error',
    quality_failed: 'error',
    withdrawn: 'default',
};
const OPS_QUEUE_TABS: Array<{
    value: TargetPostOpsQueue | 'all';
    label: string;
}> = [
    { value: 'all', label: '전체' },
    { value: 'risk', label: '위험' },
    { value: 'ghost_touched', label: '고스트 개입됨' },
    { value: 'warming_up', label: '불씨 있음' },
    { value: 'needs_comment', label: '댓글 유도 필요' },
    { value: 'neglected', label: '방치됨' },
];
const OPS_QUEUE_LABEL: Record<TargetPostOpsQueue, string> = {
    needs_comment: '댓글 유도 필요',
    warming_up: '불씨 있음',
    risk: '위험',
    neglected: '방치됨',
    ghost_touched: '고스트 개입됨',
};
const EXCLUDED_CATEGORY_TOKENS = [
    'notice',
    'announcement',
    'cardnews',
    'card-news',
    'card_news',
    'longform',
    'long-form',
    'long_form',
    '공지',
    '카드뉴스',
    '롱폼',
];
type ReviewDialogMode = 'reject' | 'inject' | 'withdraw' | 'regenerate' | null;
const DEFAULT_ACTIVITY_FORM: CreateActivityBody = {
    type: 'POST',
    instruction: '',
    category: CommunityAutomationCategory.GENERAL,
    referenceMode: 'auto',
    referenceLimit: 3,
};
function preview(text: string, length = 90) {
    return text.length > length ? `${text.slice(0, length)}...` : text;
}
function formatDate(value: string | null) {
    if (!value)
        return '-';
    return new Date(value).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' });
}
function formatRelativeTime(value: string | null) {
    if (!value)
        return null;
    const target = new Date(value).getTime();
    if (Number.isNaN(target))
        return null;
    const diffMinutes = Math.ceil((target - Date.now()) / 60000);
    if (diffMinutes <= 0)
        return '곧 발송';
    if (diffMinutes < 60)
        return `${diffMinutes}분 후`;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    if (hours < 24)
        return minutes > 0 ? `${hours}시간 ${minutes}분 후` : `${hours}시간 후`;
    const days = Math.floor(hours / 24);
    const remainHours = hours % 24;
    return remainHours > 0 ? `${days}일 ${remainHours}시간 후` : `${days}일 후`;
}
function getCandidateTimingText(item: Content) {
    if (item.status === 'scheduled') {
        const relative = formatRelativeTime(item.scheduledAt);
        return item.scheduledAt
            ? `${formatDate(item.scheduledAt)} 발송 예정${relative ? ` · ${relative}` : ''}`
            : '발송 예약 시간이 아직 내려오지 않았습니다';
    }
    if (item.status === 'published' && item.publishedAt) {
        return `${formatDate(item.publishedAt)} 발행 완료`;
    }
    if (item.reviewedAt && (item.status === 'rejected' || item.status === 'withdrawn')) {
        return `${formatDate(item.reviewedAt)} 검수 처리`;
    }
    return null;
}
function formatCount(value: number) {
    return new Intl.NumberFormat('ko-KR').format(value);
}
function isExcludedCategory(category: CommunityAutomationCategoryOption) {
    const normalized = `${category.id ?? ''} ${category.value ?? ''} ${category.label ?? ''}`.toLowerCase();
    return EXCLUDED_CATEGORY_TOKENS.some((token) => normalized.includes(token));
}
function getStatusAccent(status: ContentStatus | 'none') {
    switch (status) {
        case 'pending_review':
            return '#FFB02E';
        case 'published':
            return '#22C55E';
        case 'rejected':
        case 'quality_failed':
            return '#FF6B6B';
        case 'scheduled':
        case 'approved':
            return '#ff385c';
        default:
            return '#D0D5DD';
    }
}
function getOpsQueueColor(queue: TargetPostOpsQueue | null | undefined) {
    switch (queue) {
        case 'risk':
            return { bg: '#FFF1F0', fg: '#B42318', border: '#FDA29B' };
        case 'ghost_touched':
            return { bg: '#F4F3FF', fg: '#ff385c', border: '#D9D6FE' };
        case 'warming_up':
            return { bg: '#ECFDF3', fg: '#027A48', border: '#ABEFC6' };
        case 'needs_comment':
            return { bg: '#EFF8FF', fg: '#175CD3', border: '#B2DDFF' };
        case 'neglected':
            return { bg: '#FFFAEB', fg: '#B54708', border: '#FEDF89' };
        default:
            return { bg: '#F8F9FA', fg: '#4E5968', border: '#E5E8EB' };
    }
}
export default function TargetPostsPage() {
    const confirm = useConfirm();
    const toast = useToast();
    // 에러는 페이지 배너와 함께 토스트로도 알린다 (드로어/모달에 가려져 보이지 않기 때문).
    function fail(e: unknown, fallback: string) {
        const message = e instanceof Error ? e.message : fallback;
        setError(message);
        toast.error(message);
    }
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [items, setItems] = useState<TargetPostSummary[]>([]);
    const [total, setTotal] = useState(0);
    const [opsQueueCounts, setOpsQueueCounts] = useState<Partial<Record<TargetPostOpsQueue, number>>>({});
    const [categories, setCategories] = useState<CommunityAutomationCategoryOption[]>(COMMUNITY_AUTOMATION_CATEGORY_OPTIONS);
    const [query, setQuery] = useState<TargetPostListQuery>({ page: 1, limit: 20, sort: 'createdAt', order: 'desc' });
    const [selected, setSelected] = useState<TargetPostDetail | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [moveCategoryId, setMoveCategoryId] = useState('');
    const [scheduledComments, setScheduledComments] = useState<ScheduledCommentTimelineItem[]>([]);
    const [scheduledCommentsLoading, setScheduledCommentsLoading] = useState(false);
    const [tone, setTone] = useState('자연스러운 대학생 말투');
    const [instruction, setInstruction] = useState('');
    const [manualText, setManualText] = useState('');
    const [createdContents, setCreatedContents] = useState<Content[]>([]);
    const [reviewDialogMode, setReviewDialogMode] = useState<ReviewDialogMode>(null);
    const [reviewDialogTarget, setReviewDialogTarget] = useState<Content | null>(null);
    const [reviewDialogText, setReviewDialogText] = useState('');
    const [hotPromotionOpen, setHotPromotionOpen] = useState(false);
    const [hotPromotionComment, setHotPromotionComment] = useState('');
    const [activityDialogOpen, setActivityDialogOpen] = useState(false);
    const [activityForm, setActivityForm] = useState<CreateActivityBody>(DEFAULT_ACTIVITY_FORM);
    const [manualReferenceInput, setManualReferenceInput] = useState('');
    const [activityResult, setActivityResult] = useState<CreateActivityResult | null>(null);
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [result, categoryOptions] = await Promise.all([
                targetPostsApi.list(query),
                campaignsApi.categoryOptions(),
            ]);
            setItems(result.items);
            setTotal(result.total);
            setOpsQueueCounts(result.opsQueueCounts ?? {});
            setCategories(categoryOptions);
        }
        catch (e: unknown) {
            setError(e instanceof Error ? e.message : '목록을 불러오지 못했습니다.');
        }
        finally {
            setLoading(false);
        }
    }, [query]);
    useEffect(() => {
        load();
    }, [load]);
    useEffect(() => {
        setSelectedIds([]);
    }, [
        query.automationStatus,
        query.categoryId,
        query.limit,
        query.opsQueue,
        query.order,
        query.page,
        query.regionCluster,
        query.search,
        query.sort,
    ]);
    const selectedPost = selected?.post ?? null;
    const ghostBlocked = selected ? selected.ghostCandidateCount === 0 : false;
    const regionCluster = selected?.defaults.defaultRegionCluster ?? '';
    const reviewCandidates = useMemo(() => {
        return [...(selected?.automationHistory ?? [])].sort((a, b) => {
            const priority: Record<ContentStatus, number> = {
                pending_review: 0,
                quality_failed: 1,
                draft: 2,
                approved: 3,
                scheduled: 4,
                published: 5,
                rejected: 6,
                withdrawn: 7,
            };
            const statusDelta = priority[a.status] - priority[b.status];
            if (statusDelta !== 0)
                return statusDelta;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [selected?.automationHistory]);
    const pendingReviewCount = reviewCandidates.filter((item) => item.status === 'pending_review').length;
    const loadScheduledComments = useCallback(async (articleId = selectedPost?.id) => {
        if (!articleId)
            return;
        setScheduledCommentsLoading(true);
        try {
            const items = await targetPostsApi.listScheduledComments(articleId);
            setScheduledComments(items);
        }
        catch (e: unknown) {
            fail(e, '예약 댓글 타임라인을 불러오지 못했습니다.');
        }
        finally {
            setScheduledCommentsLoading(false);
        }
    }, [selectedPost?.id]);
    const pageLabel = useMemo(() => {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const from = total === 0 ? 0 : (page - 1) * limit + 1;
        const to = Math.min(page * limit, total);
        return `${from}-${to} / ${total}`;
    }, [query.limit, query.page, total]);
    const visibleCategories = useMemo(() => categories.filter((category) => !isExcludedCategory(category)), [categories]);
    const visibleIds = useMemo(() => items.map((item) => item.id), [items]);
    const visibleIdSet = useMemo(() => new Set(visibleIds), [visibleIds]);
    const visibleSelectedIds = useMemo(() => selectedIds.filter((id) => visibleIdSet.has(id)), [selectedIds, visibleIdSet]);
    const selectedCount = visibleSelectedIds.length;
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    function toggleSelected(id: string) {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]));
    }
    function toggleAllVisible() {
        setSelectedIds((prev) => {
            if (allVisibleSelected) {
                return prev.filter((id) => !visibleIds.includes(id));
            }
            return Array.from(new Set([...prev, ...visibleIds]));
        });
    }
    async function applyPostVisibility(ids: string[], isBlinded: boolean) {
        if (ids.length === 0)
            return;
        setActionLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await Promise.all(ids.map((id) => communityService.blindArticle(id, isBlinded)));
            setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
            setSuccess(`${ids.length}개 게시글을 ${isBlinded ? '가리기' : '가리기 해제'} 처리했습니다.`);
            if (selectedPost && ids.includes(selectedPost.id)) {
                await refreshDetail();
            }
            await load();
        }
        catch (e: unknown) {
            fail(e, '게시글 상태 변경 실패');
        }
        finally {
            setActionLoading(false);
        }
    }
    async function deletePosts(ids: string[]) {
        if (ids.length === 0)
            return;
        const targetTitle = ids.length === 1
            ? (selectedPost?.id === ids[0] ? selectedPost.title : items.find((item) => item.id === ids[0])?.title) || '제목 없음'
            : null;
        const confirmed = await confirm({
            title: '게시글 제거',
            message: targetTitle !== null
                ? `‘${targetTitle}’ 게시글을 제거합니다.\n이 작업은 되돌릴 수 없습니다.`
                : `선택한 게시글 ${ids.length}개를 제거합니다.\n이 작업은 되돌릴 수 없습니다.`,
            confirmText: '제거',
            severity: 'error',
        });
        if (!confirmed)
            return;
        setActionLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await Promise.all(ids.map((id) => communityService.deleteArticle(id)));
            setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
            if (selectedPost && ids.includes(selectedPost.id)) {
                closeDetail();
            }
            setSuccess(`${ids.length}개 게시글을 제거했습니다.`);
            await load();
        }
        catch (e: unknown) {
            fail(e, '게시글 제거 실패');
        }
        finally {
            setActionLoading(false);
        }
    }
    async function movePostsToCategory(ids: string[], categoryId: string) {
        if (ids.length === 0 || !categoryId)
            return;
        setActionLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await Promise.all(ids.map((id) => communityService.moveArticleCategory(id, categoryId)));
            setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
            const categoryLabel = visibleCategories.find((category) => category.id === categoryId)?.label ?? '선택한 카테고리';
            setSuccess(`${ids.length}개 게시글을 ${categoryLabel}(으)로 이동했습니다.`);
            setMoveCategoryId('');
            if (selectedPost && ids.includes(selectedPost.id)) {
                await refreshDetail();
            }
            await load();
        }
        catch (e: unknown) {
            fail(e, '게시글 카테고리 이동 실패');
        }
        finally {
            setActionLoading(false);
        }
    }
    function resetDetailInputs() {
        setTone('자연스러운 대학생 말투');
        setInstruction('');
        setManualText('');
        setHotPromotionComment('');
    }
    function closeDetail() {
        setSelected(null);
        setScheduledComments([]);
        resetDetailInputs();
    }
    async function openDetail(articleId: string) {
        setDetailLoading(true);
        setError(null);
        setSuccess(null);
        setCreatedContents([]);
        resetDetailInputs();
        try {
            const detail = await targetPostsApi.get(articleId);
            setSelected(detail);
            await loadScheduledComments(articleId);
        }
        catch (e: unknown) {
            fail(e, '상세를 불러오지 못했습니다.');
        }
        finally {
            setDetailLoading(false);
        }
    }
    async function refreshDetail() {
        if (!selectedPost)
            return;
        const detail = await targetPostsApi.get(selectedPost.id);
        setSelected(detail);
        await loadScheduledComments(selectedPost.id);
    }
    async function createLlmDrafts() {
        if (!selectedPost)
            return;
        setActionLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const result = await targetPostsApi.createLlmDraft(selectedPost.id, {
                count: 3,
                tone,
                instruction: instruction || undefined,
                regionCluster: regionCluster || undefined,
            });
            setCreatedContents(result.items ?? []);
            setSuccess(`LLM 댓글 후보 ${(result.items ?? []).length}개를 후보 검수에 생성했습니다.`);
            await refreshDetail();
            await load();
        }
        catch (e: unknown) {
            fail(e, 'LLM 댓글 생성 실패');
        }
        finally {
            setActionLoading(false);
        }
    }
    function openReviewDialog(mode: ReviewDialogMode, item: Content, prefill = '') {
        setReviewDialogMode(mode);
        setReviewDialogTarget(item);
        setReviewDialogText(prefill);
    }
    function closeReviewDialog() {
        setReviewDialogMode(null);
        setReviewDialogTarget(null);
        setReviewDialogText('');
    }
    async function applyReviewAction(item: Content, action: 'approve' | 'reject' | 'inject' | 'withdraw' | 'regenerate', text = '') {
        setActionLoading(true);
        setError(null);
        setSuccess(null);
        try {
            if (action === 'approve') {
                const result = await reviewApi.approve(item.id);
                setSuccess(`댓글 후보를 승인했습니다. ${formatDate(result.scheduledAt)} 발송 예정입니다.`);
            }
            else if (action === 'reject') {
                await reviewApi.reject(item.id, text);
                setSuccess('댓글 후보를 거절했습니다.');
            }
            else if (action === 'inject') {
                const result = await reviewApi.inject(item.id, text);
                setSuccess(`댓글 후보를 수정 승인했습니다. ${formatDate(result.scheduledAt)} 발송 예정입니다.`);
            }
            else if (action === 'withdraw') {
                await reviewApi.withdraw(item.id, text);
                setSuccess('댓글 후보를 회수했습니다.');
            }
            else if (action === 'regenerate') {
                await reviewApi.regenerate(item.id);
                setSuccess('댓글 후보 재생성을 요청했습니다.');
            }
            closeReviewDialog();
            await refreshDetail();
            await load();
        }
        catch (e: unknown) {
            fail(e, '검수 처리 실패');
        }
        finally {
            setActionLoading(false);
        }
    }
    async function confirmReviewDialog() {
        if (!reviewDialogMode || !reviewDialogTarget)
            return;
        await applyReviewAction(reviewDialogTarget, reviewDialogMode, reviewDialogText);
    }
    async function createManualComment() {
        if (!selectedPost || !manualText.trim())
            return;
        setActionLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const result = await targetPostsApi.createManualComment(selectedPost.id, {
                text: manualText,
                regionCluster: regionCluster || undefined,
            });
            setCreatedContents(result.item ? [result.item] : []);
            setManualText('');
            setSuccess('직접 입력 댓글을 후보 검수에 생성했습니다.');
            await refreshDetail();
            await load();
        }
        catch (e: unknown) {
            fail(e, '직접 입력 댓글 생성 실패');
        }
        finally {
            setActionLoading(false);
        }
    }
    async function createLiveGhostComment(articleId: string, body: GhostCommentBody) {
        const result = await targetPostsApi.createLiveGhostComment(articleId, body);
        if (!result.comment) {
            await loadScheduledComments(articleId);
            await load();
            return result;
        }
        const liveComment = {
            id: result.comment.id,
            articleId,
            parentId: result.comment.parentId ?? null,
            authorId: result.comment.authorId ?? result.comment.userId,
            authorName: result.comment.authorName ?? result.comment.nickname ?? null,
            content: result.comment.content,
            createdAt: String(result.comment.createdAt),
        };
        setSelected((prev) => {
            if (!prev || prev.post.id !== articleId)
                return prev;
            return {
                ...prev,
                post: {
                    ...prev.post,
                    commentCount: prev.post.commentCount + 1,
                },
                comments: [...prev.comments, liveComment],
            };
        });
        await load();
        return result;
    }
    async function createLiveGhostLike(articleId: string, body: GhostLikeBody) {
        const result = await targetPostsApi.createLiveGhostLike(articleId, body);
        if (result.scheduledLike) {
            await loadScheduledComments(articleId);
            await load();
        }
        else {
            await refreshDetail();
            await load();
        }
        return result;
    }
    async function cancelScheduledComment(contentId: string) {
        if (!selectedPost)
            return;
        const items = await targetPostsApi.cancelScheduledComment(selectedPost.id, contentId);
        setScheduledComments(items);
        await refreshDetail();
        await load();
    }
    async function rescheduleScheduledComment(contentId: string, delayMinutes: number) {
        if (!selectedPost)
            return;
        const items = await targetPostsApi.rescheduleScheduledComment(selectedPost.id, contentId, { delayMinutes });
        setScheduledComments(items);
        await refreshDetail();
        await load();
    }
    async function promoteSelectedPostToHot() {
        if (!selectedPost)
            return;
        setActionLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const result = await targetPostsApi.promoteToHotArticle(selectedPost.id, {
                curatorComment: hotPromotionComment.trim() || undefined,
            });
            setSuccess(`인기 게시글로 등업했습니다. hotId=${result.hotId}`);
            closeHotPromotion();
            await refreshDetail();
            await load();
        }
        catch (e: unknown) {
            fail(e, '인기 게시글 등업 실패');
        }
        finally {
            setActionLoading(false);
        }
    }
    function openHotPromotion() {
        setHotPromotionComment('');
        setHotPromotionOpen(true);
    }
    function closeHotPromotion() {
        setHotPromotionOpen(false);
        setHotPromotionComment('');
    }
    async function loadLiveCommentSuggestions() {
        if (!selectedPost)
            return [];
        const result = await targetPostsApi.listLiveCommentSuggestions(selectedPost.id);
        return result.suggestions;
    }
    function openActivityDialog() {
        const defaultCategory = visibleCategories[0]?.id ?? visibleCategories[0]?.value ?? CommunityAutomationCategory.GENERAL;
        setActivityForm({
            ...DEFAULT_ACTIVITY_FORM,
            category: defaultCategory,
            regionCluster: query.regionCluster,
        });
        setManualReferenceInput('');
        setActivityResult(null);
        setActivityDialogOpen(true);
    }
    async function createActivity() {
        if (!activityForm.instruction.trim() || !activityForm.category)
            return;
        setActionLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const referenceArticleIds = activityForm.referenceMode === 'manual'
                ? manualReferenceInput
                    .split(',')
                    .map((id) => id.trim())
                    .filter(Boolean)
                : undefined;
            const result = await activitiesApi.create({
                ...activityForm,
                instruction: activityForm.instruction.trim(),
                regionCluster: activityForm.regionCluster?.trim() || undefined,
                ghostAccountId: activityForm.ghostAccountId?.trim() || undefined,
                referenceArticleIds,
            });
            setActivityResult(result);
            setSuccess('AI 게시글 초안을 검수 대기에 생성했습니다.');
            await load();
        }
        catch (e: unknown) {
            fail(e, 'AI 활동 생성 실패');
        }
        finally {
            setActionLoading(false);
        }
    }
    return (<div>
			<section style={{ padding: 8, marginBottom: 16 }} className="rounded-xl border bg-white p-4">
				<Tabs selectedKey={query.opsQueue ?? 'all'} onSelectionChange={value => setQuery((prev) => ({
            ...prev,
            page: 1,
            opsQueue: value === 'all' ? undefined : value as TargetPostOpsQueue,
            sort: value === 'all' ? 'createdAt' : 'urgencyScore',
            order: 'desc',
        }))}><Tabs.List aria-label="관리 항목">
					{OPS_QUEUE_TABS.map((tab) => {
            const count = tab.value === 'all' ? total : opsQueueCounts[tab.value] ?? 0;
            return (<Tabs.Tab key={tab.value} style={{ minHeight: 44, fontWeight: 800 }} id={tab.value}>{`${tab.label} ${formatCount(count)}`}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>);
        })}
				</Tabs.List></Tabs>
			</section>
			<section style={{ padding: 16, marginBottom: 16 }} className="rounded-xl border bg-white p-4">
				<div>
					<div style={{ minWidth: 160 }}>
						<label>카테고리</label>
						<Select value={query.categoryId ?? ''} aria-label={"카테고리"} onChange={(key) => {
            const value = String(key ?? "");
            setQuery((prev) => ({ ...prev, page: 1, categoryId: value || undefined }));
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
							<ListBox.Item id={""} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
							{visibleCategories.map((category) => (<ListBox.Item key={category.id ?? category.value} id={category.id ?? ''} textValue={String(category.label)}>
									{category.label}
								</ListBox.Item>))}
						</ListBox></Select.Popover></Select>
					</div>
					<TextField className="mb-4"><Label>{"REGION_CLUSTER"}</Label><Input value={query.regionCluster ?? ''} onChange={(e) => setQuery((prev) => ({ ...prev, page: 1, regionCluster: e.target.value || undefined }))}></Input></TextField>
					<div style={{ minWidth: 150 }}>
						<label>자동화 상태</label>
						<Select value={query.automationStatus ?? ''} aria-label={"자동화 상태"} onChange={(key) => {
            const value = String(key ?? "");
            setQuery((prev) => ({ ...prev, page: 1, automationStatus: (value || undefined) as TargetPostListQuery['automationStatus'] }));
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
							<ListBox.Item id={""} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
							<ListBox.Item id={"none"} textValue={"\uBBF8\uC0DD\uC131"}>미생성</ListBox.Item>
							<ListBox.Item id={"pending_review"} textValue={"\uAC80\uC218 \uB300\uAE30"}>검수 대기</ListBox.Item>
							<ListBox.Item id={"scheduled"} textValue={"\uC608\uC57D\uB428"}>예약됨</ListBox.Item>
							<ListBox.Item id={"published"} textValue={"\uBC1C\uD589\uB428"}>발행됨</ListBox.Item>
							<ListBox.Item id={"withdrawn"} textValue={"\uD68C\uC218\uB428"}>회수됨</ListBox.Item>
						</ListBox></Select.Popover></Select>
					</div>
					<TextField className="mb-4"><Label>{"검색"}</Label><Input value={query.search ?? ''} onChange={(e) => setQuery((prev) => ({ ...prev, page: 1, search: e.target.value || undefined }))}></Input></TextField>
					<div style={{ minWidth: 140 }}>
						<label>정렬</label>
						<Select value={query.sort ?? 'createdAt'} aria-label={"정렬"} onChange={(key) => {
            const value = String(key ?? "");
            setQuery((prev) => ({ ...prev, sort: value as TargetPostListQuery['sort'] }));
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
							<ListBox.Item id={"createdAt"} textValue={"\uC791\uC131\uC77C"}>작성일</ListBox.Item>
							<ListBox.Item id={"commentCount"} textValue={"\uB313\uAE00 \uC218"}>댓글 수</ListBox.Item>
							<ListBox.Item id={"likeCount"} textValue={"\uC88B\uC544\uC694"}>좋아요</ListBox.Item>
							<ListBox.Item id={"readCount"} textValue={"\uC870\uD68C"}>조회</ListBox.Item>
							<ListBox.Item id={"automationUpdatedAt"} textValue={"\uC790\uB3D9\uD654 \uCD5C\uC2E0"}>자동화 최신</ListBox.Item>
							<ListBox.Item id={"urgencyScore"} textValue={"\uC6B4\uC601 \uC6B0\uC120\uC21C\uC704"}>운영 우선순위</ListBox.Item>
						</ListBox></Select.Popover></Select>
					</div>
					<Button onPress={load} isDisabled={loading} variant="secondary">
						새로고침
					</Button>
					<Button onPress={openActivityDialog} variant="primary" style={{ fontWeight: 900, backgroundColor: '#7A4AE2', boxShadow: 'none' }}>{<AutoAwesomeIcon></AutoAwesomeIcon>}
						AI 활동 추가
					</Button>
				</div>
			</section>

			<section style={{ padding: 12, marginBottom: 16, borderRadius: '16px', backgroundColor: '#FFFFFF' }} className="rounded-xl border bg-white p-4">
				<div>
					<div>
						<Checkbox isSelected={allVisibleSelected} {...{ 'aria-label': '현재 페이지 게시글 전체 선택' }} isIndeterminate={selectedCount > 0 && !allVisibleSelected} onChange={checked => toggleAllVisible()}><Checkbox.Content><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control></Checkbox.Content></Checkbox>
						<p>
							선택 {formatCount(selectedCount)}개
						</p>
					</div>
					<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
						<div style={{ minWidth: 160 }}>
							<label>이동할 카테고리</label>
							<Select value={moveCategoryId} aria-label={"이동할 카테고리"} onChange={(key) => {
            const value = String(key ?? "");
            setMoveCategoryId(value);
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
								<ListBox.Item id={""} textValue={"\uC120\uD0DD"}>선택</ListBox.Item>
								{visibleCategories.map((category) => (<ListBox.Item key={category.id ?? category.value} id={category.id ?? ''} textValue={String(category.label)}>
										{category.label}
									</ListBox.Item>))}
							</ListBox></Select.Popover></Select>
						</div>
						<Button isDisabled={actionLoading || selectedCount === 0 || !moveCategoryId} onPress={() => movePostsToCategory(visibleSelectedIds, moveCategoryId)} variant="secondary">
							카테고리 이동
						</Button>
						<Button isDisabled={actionLoading || selectedCount === 0} onPress={() => applyPostVisibility(visibleSelectedIds, true)} variant="secondary">
							선택 가리기
						</Button>
						<Button isDisabled={actionLoading || selectedCount === 0} onPress={() => applyPostVisibility(visibleSelectedIds, false)} variant="secondary">
							가리기 해제
						</Button>
						<Button isDisabled={actionLoading || selectedCount === 0} onPress={() => deletePosts(visibleSelectedIds)} variant="secondary">
							선택 제거
						</Button>
					</div>
				</div>
			</section>

			{error && <aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>{error}</aside>}
			{success && <aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>{success}</aside>}

			{loading ? (<div style={{ display: "flex", paddingBlock: 48 }}>
					<Spinner size="sm"></Spinner>
				</div>) : (<div>
					{items.length === 0 ? (<section style={{ padding: 32, textAlign: 'center', borderRadius: '16px', backgroundColor: '#FFFFFF' }} className="rounded-xl border bg-white p-4">
							<p>대상 게시글 없음</p>
						</section>) : (<div style={{ display: 'grid', gap: 12 }}>
							{items.map((item) => {
                    const status = item.automationStatus ?? 'none';
                    const isBlinded = Boolean(item.isBlinded || item.blindedAt);
                    const opsQueue = item.primaryOpsQueue ?? item.opsQueues?.[0] ?? null;
                    const opsColor = getOpsQueueColor(opsQueue);
                    return (<section key={item.id}      style={{ borderRadius: '16px', backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(25, 31, 40, 0.06)', cursor: 'pointer', minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease' }} className="rounded-xl border bg-white p-4"><Button variant="tertiary" onPress={() => openDetail(item.id)}>작업 열기</Button>
											<div style={{ height: 4, backgroundColor: isBlinded ? '#FF6B6B' : getStatusAccent(status) }}></div>
										<div style={{ padding: 12.8, flex: 1, minHeight: 0 }}>
											<div>
												<Checkbox isSelected={selectedIds.includes(item.id)} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()} {...{ 'aria-label': `${item.title || '제목 없음'} 선택` }} style={{ padding: 1.6, marginRight: -0.5 }} onChange={checked => toggleSelected(item.id)}><Checkbox.Content><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control></Checkbox.Content></Checkbox>
												<Chip size="sm">{visibleCategories.find((category) => category.id === item.categoryId)?.label ?? item.categoryName ?? '커뮤니티'}</Chip>
												<Chip size="sm">{STATUS_LABEL[status]}</Chip>
											</div>
											{opsQueue && (<div>
													<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
														<Chip size="sm">{OPS_QUEUE_LABEL[opsQueue]}</Chip>
														{typeof item.urgencyScore === 'number' && (<Chip size="sm">{`우선 ${formatCount(item.urgencyScore)}`}</Chip>)}
													</div>
													{item.opsReason && (<p style={{ color: '#4E5968', lineHeight: 1.35, display: '-webkit-box', overflow: 'hidden' }}>
															{item.opsReason}
														</p>)}
												</div>)}
											{isBlinded && (<aside role="alert" className="rounded-lg border p-3" style={{ paddingBlock: 0 }}>
													<p>가려진 게시글</p>
												</aside>)}

											<div style={{ minWidth: 0 }}>
												<span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
													{(item.authorName ?? item.authorId ?? '익').slice(0, 1)}
												</span>
												<div style={{ minWidth: 0, flex: 1 }}>
													<p>
														{item.authorName ?? item.authorId}
													</p>
													<p>
														{item.authorRegionCluster ?? 'cluster 없음'} · {formatDate(item.createdAt)}
													</p>
												</div>
											</div>

											<div style={{ minHeight: 128 }}>
												<p style={{ lineHeight: 1.35, fontSize: 16, color: '#191F28', wordBreak: 'break-word', display: '-webkit-box', overflow: 'hidden' }}>
													{item.title || '제목 없음'}
												</p>
												<p style={{ marginTop: 6.4, color: '#4E5968', lineHeight: 1.55, display: '-webkit-box', overflow: 'hidden' }}>
													{preview(item.content, 180)}
												</p>
											</div>

											{item.latestComment && (<div style={{ padding: 8, borderRadius: '12px', backgroundColor: '#F8F9FA', border: '1px solid #E7E9EC', minHeight: 48 }}>
													<p>
														최근 댓글
													</p>
													<p style={{ display: '-webkit-box', overflow: 'hidden', lineHeight: 1.35 }}>
														{item.latestComment}
													</p>
												</div>)}

											<div style={{ flex: 1 }}></div>

											<div>
												<div style={{ display: 'grid', border: '1px solid #E7E9EC', borderRadius: '12px', overflow: 'hidden' }}>
													{[
                            { icon: <ChatBubbleOutlineIcon></ChatBubbleOutlineIcon>, value: item.commentCount },
                            { icon: <FavoriteBorderIcon></FavoriteBorderIcon>, value: item.likeCount },
                            { icon: <VisibilityOutlinedIcon></VisibilityOutlinedIcon>, value: item.readCount },
                        ].map((metric, index) => (<div key={index} style={{ minWidth: 0, height: 34, color: '#4E5968' }}>
															{metric.icon}
															<p>
																{formatCount(metric.value)}
															</p>
														</div>))}
												</div>

												<div>
													<Chip size="sm">{`자동화 ${formatCount(item.automationCount)}`}</Chip>
													{item.automationSummary?.failed ? (<Chip size="sm">{`실패 ${formatCount(item.automationSummary.failed)}`}</Chip>) : null}
													{item.reportCount > 0 && (<Chip size="sm">{`신고 ${formatCount(item.reportCount)}`}</Chip>)}
												</div>
												{item.recommendedAction && (<div style={{ padding: 8, borderRadius: '12px', backgroundColor: opsQueue === 'risk' ? '#FFF1F0' : '#F8F9FA', border: `1px solid ${opsColor.border}` }}>
														<p>
															추천 액션
														</p>
														<p style={{ color: opsColor.fg }}>
															{item.recommendedAction}
														</p>
													</div>)}
											</div>
										</div>
									</section>);
                })}
						</div>)}
					<section style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, padding: 12, borderRadius: '16px', backgroundColor: '#FFFFFF' }} className="rounded-xl border bg-white p-4">
						<p>{pageLabel}</p>
						<Button isDisabled={(query.page ?? 1) <= 1} onPress={() => setQuery((prev) => ({ ...prev, page: Math.max((prev.page ?? 1) - 1, 1) }))} variant="tertiary">
							이전
						</Button>
						<Button isDisabled={(query.page ?? 1) * (query.limit ?? 20) >= total} onPress={() => setQuery((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))} variant="tertiary">
							다음
						</Button>
					</section>
				</div>)}

			<Drawer.Backdrop isOpen={Boolean(selected) || detailLoading} onOpenChange={open => {
            if (!open) {
                closeDetail();
            }
        }}><Drawer.Content placement="right" className="w-full"><Drawer.Dialog style={{ width: 'min(960px, 100vw)', maxWidth: '100%', height: '100%', minWidth: 0 }} aria-label="게시글 자동 활동 상세" className="overflow-y-auto">
				<Drawer.Header>
					<Drawer.Heading>게시글 자동 활동 상세</Drawer.Heading>
					<Drawer.CloseTrigger aria-label="닫기" />
				</Drawer.Header>
				<div style={{ padding: 24 }}>
					{detailLoading || !selected ? (<div style={{ display: "flex", paddingBlock: 64 }}>
							<Spinner size="sm"></Spinner>
						</div>) : (<div>
							<aside role="alert" className="rounded-lg border p-3">
								{ghostBlocked
                ? '같은 REGION_CLUSTER ghost 후보 없음'
                : `같은 cluster ACTIVE ghost ${selected.ghostCandidateCount}명`}
							</aside>
								<div style={{ display: 'grid', gap: 16, alignItems: 'start' }}>
								<CommunityPostAppDetailPanel post={{
                ...selected.post,
                categoryName: categories.find((category) => category.id === selected.post.categoryId)?.label ?? selected.post.categoryName,
            }} comments={selected.comments} ghostCandidates={selected.ghostCandidates} ghostCandidateCount={selected.ghostCandidateCount} submitLabel="지금 AI 댓글 달기" onSubmitGhostComment={createLiveGhostComment} onSubmitGhostLike={createLiveGhostLike} onReload={refreshDetail} scheduledComments={scheduledComments} scheduledCommentsLoading={scheduledCommentsLoading} onReloadScheduledComments={() => loadScheduledComments(selected.post.id)} onCancelScheduledComment={cancelScheduledComment} onRescheduleScheduledComment={rescheduleScheduledComment} onLoadLiveCommentSuggestions={loadLiveCommentSuggestions}></CommunityPostAppDetailPanel>
								<div>
									<section style={{ padding: 16, borderRadius: '16px', backgroundColor: '#FBFAFF', boxShadow: '0 12px 32px rgba(89, 37, 220, 0.08)' }} className="rounded-xl border bg-white p-4">
										<div>
											<div>
												<div>
													<div style={{ width: 36, height: 36, borderRadius: '12px', display: 'grid', backgroundColor: '#F4F3FF', color: '#ff385c' }}>
														<AutoAwesomeIcon></AutoAwesomeIcon>
													</div>
													<div>
														<p>
															LLM 댓글 후보 생성
														</p>
														<p>
															생성 즉시 아래 후보 검수에 표시됩니다.
														</p>
													</div>
												</div>
												<Chip size="sm">{"3개"}</Chip>
											</div>
											<TextField className="mb-4"><Label>{"톤"}</Label><Input value={tone} onChange={(e) => setTone(e.target.value)}></Input></TextField>
											<TextField className="mb-4"><Label>{"추가 지시"}</Label><TextArea placeholder="예: 질문형 1개, 공감형 1개, 분위기 전환 1개" value={instruction} onChange={(e) => setInstruction(e.target.value)}></TextArea></TextField>
											<Button isDisabled={actionLoading} onPress={createLlmDrafts} variant="primary" style={{ borderRadius: '10px', fontWeight: 900, backgroundColor: '#7A4AE2' }}>{actionLoading ? <Spinner size="sm"></Spinner> : <AutoAwesomeIcon></AutoAwesomeIcon>}
												후보 생성
											</Button>
										</div>
									</section>

									<section style={{ padding: 16, borderRadius: '16px' }} className="rounded-xl border bg-white p-4">
										<div>
											<div>
												<EditNoteIcon style={{ color: '#175CD3' }}></EditNoteIcon>
												<div>
													<p>직접 댓글 입력</p>
													<p>운영자가 작성한 문장도 같은 후보 검수 흐름으로 보냅니다.</p>
												</div>
											</div>
											<TextField className="mb-4"><Label>{"댓글 내용"}</Label><TextArea value={manualText} onChange={(e) => setManualText(e.target.value)}></TextArea></TextField>
											<Button isDisabled={actionLoading || !manualText.trim()} onPress={createManualComment} variant="secondary" style={{ borderRadius: '10px', fontWeight: 800 }}>
												후보에 추가
											</Button>
										</div>
									</section>

									<section style={{ padding: 16, borderRadius: '16px' }} className="rounded-xl border bg-white p-4">
										<div>
											<div>
												<p>게시글 제어</p>
												<p>
													노출 상태를 이 화면에서 바로 처리합니다.
												</p>
											</div>
											<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
												<Button isDisabled={actionLoading} onPress={openHotPromotion} variant="primary" style={{ boxShadow: 'none', fontWeight: 800 }}>{<WhatshotIcon></WhatshotIcon>}
													인기글 등업
												</Button>
												<Button isDisabled={actionLoading} onPress={() => applyPostVisibility([selected.post.id], true)} variant="secondary">
													가리기
												</Button>
												<Button isDisabled={actionLoading} onPress={() => applyPostVisibility([selected.post.id], false)} variant="secondary">
													해제
												</Button>
												<Button isDisabled={actionLoading} onPress={() => deletePosts([selected.post.id])} variant="secondary">
													제거
												</Button>
											</div>
										</div>
									</section>
								</div>
							</div>

							<section style={{ padding: 16, borderRadius: '16px', backgroundColor: '#FFFFFF' }} className="rounded-xl border bg-white p-4">
								<div>
									<div>
										<div>
											<p>
												후보 검수
											</p>
											<p>
												별도 검수 큐로 이동하지 않고 이 게시글 안에서 생성, 수정, 승인까지 완료합니다.
											</p>
											<p style={{ display: 'block', marginTop: 4 }}>
												승인하면 즉시 발행하지 않고 서버 타이밍 정책에 따라 발송 예약되며, 예약 시각은 각 후보 카드에 표시됩니다.
											</p>
										</div>
										<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
											<Chip size="sm">{`검수 대기 ${formatCount(pendingReviewCount)}`}</Chip>
											<Chip size="sm">{`전체 후보 ${formatCount(reviewCandidates.length)}`}</Chip>
											{createdContents.length > 0 && (<Chip size="sm">{`방금 생성 ${formatCount(createdContents.length)}`}</Chip>)}
										</div>
									</div>
									{reviewCandidates.length === 0 ? (<div style={{ padding: 24, borderRadius: '14px', backgroundColor: '#F8F9FA', textAlign: 'center' }}>
											<p>
												아직 이 게시글에 생성된 댓글 후보가 없습니다.
											</p>
										</div>) : (<div style={{ display: 'grid', gap: 9.6 }}>
											{reviewCandidates.map((item) => {
                    const text = item.finalText ?? item.generatedText ?? '';
                    const isActionable = item.status === 'pending_review' || item.status === 'quality_failed' || item.status === 'draft';
                    const timingText = getCandidateTimingText(item);
                    return (<section key={item.id} style={{ padding: 12, borderRadius: '14px', backgroundColor: item.status === 'pending_review' ? '#FFFCF5' : '#FFFFFF', minWidth: 0 }} className="rounded-xl border bg-white p-4">
														<div>
															<div>
																<div style={{ minWidth: 0 }}>
																	<div style={{ minWidth: 0 }}>
																		<Chip size="sm">{STATUS_LABEL[item.status]}</Chip>
																		<p>
																			생성 {formatDate(item.createdAt)}
																		</p>
																	</div>
																	{timingText && (<p style={{ color: item.status === 'scheduled' ? '#175CD3' : '#6b7280', fontWeight: item.status === 'scheduled' ? 800 : 600, lineHeight: 1.35, wordBreak: 'keep-all' }}>
																			{timingText}
																		</p>)}
																</div>
																{item.targetType && (<Chip size="sm">{item.targetType}</Chip>)}
															</div>
															<p style={{ color: '#191F28', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
																{text || '-'}
															</p>
															{item.qualityScores && (<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
																	{Object.entries(item.qualityScores)
                                .filter(([, value]) => value !== undefined)
                                .slice(0, 4)
                                .map(([key, value]) => (<Chip key={key} size="sm">{`${key} ${value}`}</Chip>))}
																</div>)}
															<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
																<Button isDisabled={actionLoading || !isActionable} onPress={() => applyReviewAction(item, 'approve')} variant="primary">{<CheckCircleOutlineIcon></CheckCircleOutlineIcon>}
																	승인
																</Button>
																<Button isDisabled={actionLoading || !isActionable} onPress={() => openReviewDialog('inject', item, text)} variant="secondary">
																	수정승인
																</Button>
																<Button isDisabled={actionLoading || !isActionable} onPress={() => openReviewDialog('reject', item)} variant="secondary">
																	거절
																</Button>
																<Button isDisabled={actionLoading} onPress={() => openReviewDialog('regenerate', item)} variant="secondary">{<RestartAltIcon></RestartAltIcon>}
																	재생성
																</Button>
																<Button isDisabled={actionLoading || item.status === 'withdrawn'} onPress={() => openReviewDialog('withdraw', item)} variant="secondary">
																	회수
																</Button>
															</div>
														</div>
													</section>);
                })}
										</div>)}
								</div>
							</section>
						</div>)}
				</div>
				</Drawer.Dialog></Drawer.Content></Drawer.Backdrop>
				<Modal.Backdrop isOpen={activityDialogOpen} isDismissable={!actionLoading} isKeyboardDismissDisabled={actionLoading} onOpenChange={next => {
            if (!next && !actionLoading)
                setActivityDialogOpen(false);
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}>
					<Modal.Heading style={{ fontWeight: 900 }}>AI 활동 추가</Modal.Heading>
					<Modal.Body style={{ paddingTop: '12px' }}>
						<div>
							<div>
								<label>활동 유형</label>
								<Select value={activityForm.type} aria-label={"활동 유형"} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
									<ListBox.Item id={"POST"} textValue={"\uAE00\uC4F0\uAE30"}>글쓰기</ListBox.Item>
								</ListBox></Select.Popover></Select>
							</div>
							<TextField className="mb-4"><Label>{"작성 방향"}</Label><TextArea placeholder="예: 시험기간에 다들 공감할 수 있는 일상 글" value={activityForm.instruction} onChange={(event) => setActivityForm((prev) => ({ ...prev, instruction: event.target.value }))}></TextArea></TextField>
							<div>
								<div>
									<label>카테고리</label>
									<Select value={activityForm.category} aria-label={"카테고리"} onChange={(key) => {
            const value = String(key ?? "");
            setActivityForm((prev) => ({ ...prev, category: value }));
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
										{visibleCategories.map((category) => (<ListBox.Item key={category.id ?? category.value} id={category.id ?? category.value} textValue={String(category.label)}>
												{category.label}
											</ListBox.Item>))}
									</ListBox></Select.Popover></Select>
								</div>
								<TextField className="mb-4"><Label>{"REGION_CLUSTER"}</Label><Input value={activityForm.regionCluster ?? ''} onChange={(event) => setActivityForm((prev) => ({ ...prev, regionCluster: event.target.value }))}></Input></TextField>
							</div>
							<TextField className="mb-4"><Label>{"Ghost 계정 ID"}</Label><Input placeholder="선택 입력" value={activityForm.ghostAccountId ?? ''} onChange={(event) => setActivityForm((prev) => ({ ...prev, ghostAccountId: event.target.value }))}></Input></TextField>
							<div>
								<div>
									<label>참고 방식</label>
									<Select value={activityForm.referenceMode} aria-label={"참고 방식"} onChange={(key) => {
            const value = String(key ?? "");
            setActivityForm((prev) => ({
                ...prev,
                referenceMode: value as CreateActivityBody['referenceMode'],
            }));
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
										<ListBox.Item id={"auto"} textValue={"\uAE30\uC874 \uAC8C\uC2DC\uAE00 \uC790\uB3D9 \uCC38\uACE0"}>기존 게시글 자동 참고</ListBox.Item>
										<ListBox.Item id={"manual"} textValue={"\uAC8C\uC2DC\uAE00 ID \uC9C1\uC811 \uC9C0\uC815"}>게시글 ID 직접 지정</ListBox.Item>
									</ListBox></Select.Popover></Select>
								</div>
								<div style={{ minWidth: 120 }}>
									<label>참고 수</label>
									<Select value={activityForm.referenceLimit ?? 3} aria-label={"참고 수"} onChange={(key) => {
            const value = String(key ?? "");
            setActivityForm((prev) => ({ ...prev, referenceLimit: Number(value) }));
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
										{[1, 2, 3, 4, 5].map((count) => (<ListBox.Item key={count} id={count} textValue={String(count) + (" " + "\uAC1C")}>
												{count}개
											</ListBox.Item>))}
									</ListBox></Select.Popover></Select>
								</div>
							</div>
							{activityForm.referenceMode === 'manual' && (<TextField className="mb-4"><Label>{"참고 게시글 ID"}</Label><Input placeholder="쉼표로 구분" value={manualReferenceInput} onChange={(event) => setManualReferenceInput(event.target.value)}></Input></TextField>)}
							{activityResult && (<aside role="alert" className="rounded-lg border p-3">
									초안이 검수 대기에 생성되었습니다. 참고된 게시글 {activityResult.meta.referenceCount}개
								</aside>)}
							{activityResult?.references.length ? (<div>
									<p>
										참고된 게시글
									</p>
									{activityResult.references.map((reference) => (<Chip key={reference.id} size="sm">{`${reference.title} · ${formatDate(reference.createdAt)}`}</Chip>))}
								</div>) : null}
						</div>
					</Modal.Body>
					<Modal.Footer style={{ paddingInline: 24, paddingBottom: 16 }}>
						<Button isDisabled={actionLoading} onPress={() => setActivityDialogOpen(false)} variant="tertiary">
							닫기
						</Button>
						<Button isDisabled={actionLoading || !activityForm.instruction.trim() || !activityForm.category} onPress={createActivity} variant="primary" style={{ fontWeight: 900, backgroundColor: '#7A4AE2' }}>{actionLoading ? <Spinner size="sm"></Spinner> : <AutoAwesomeIcon></AutoAwesomeIcon>}
							검수 대기에 생성
						</Button>
					</Modal.Footer>
				</Modal.Dialog></Modal.Container></Modal.Backdrop>
				<Modal.Backdrop isOpen={hotPromotionOpen} isDismissable={!actionLoading} isKeyboardDismissDisabled={actionLoading} onOpenChange={next => {
            if (!next && !actionLoading)
                closeHotPromotion();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}>
					<Modal.Heading style={{ fontWeight: 900 }}>인기 게시글로 등업할까요?</Modal.Heading>
					<Modal.Body style={{ paddingTop: '12px' }}>
						<div>
							<p>
								원본 게시글은 그대로 두고 hot_articles 참조만 추가합니다. 확인하면 앱 인기 탭에 이 게시글이 노출됩니다.
							</p>
							<TextField className="mb-4"><Label>{"큐레이터 코멘트"}</Label><Input placeholder="선택 입력" value={hotPromotionComment} onChange={(event) => setHotPromotionComment(event.target.value)} {...{ maxLength: 255 }}></Input></TextField>
						</div>
					</Modal.Body>
					<Modal.Footer style={{ paddingInline: 24, paddingBottom: 16 }}>
						<Button isDisabled={actionLoading} onPress={closeHotPromotion} variant="tertiary">
							취소
						</Button>
						<Button isDisabled={actionLoading} onPress={promoteSelectedPostToHot} variant="primary" style={{ fontWeight: 800 }}>{actionLoading ? <Spinner size="sm"></Spinner> : <WhatshotIcon></WhatshotIcon>}
							인기글 등업
						</Button>
					</Modal.Footer>
				</Modal.Dialog></Modal.Container></Modal.Backdrop>
				<Modal.Backdrop isOpen={Boolean(reviewDialogMode)} isDismissable={!actionLoading} isKeyboardDismissDisabled={actionLoading} onOpenChange={next => {
            if (!next && !actionLoading)
                closeReviewDialog();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}>
				<Modal.Heading style={{ fontWeight: 900 }}>
					{reviewDialogMode === 'inject'
            ? '댓글 수정 승인'
            : reviewDialogMode === 'reject'
                ? '댓글 후보 거절'
                : reviewDialogMode === 'withdraw'
                    ? '댓글 후보 회수'
                    : reviewDialogMode === 'regenerate'
                        ? '댓글 후보 재생성'
                        : ''}
				</Modal.Heading>
				<Modal.Body style={{ paddingTop: '12px' }}>
					{reviewDialogMode === 'regenerate' ? (<p>
							이 후보를 기준으로 재생성을 요청합니다. 현재 상태는 상세 후보 목록에서 다시 확인할 수 있습니다.
						</p>) : (<TextField className="mb-4"><Label>{reviewDialogMode === 'inject' ? '최종 댓글 텍스트' : '사유'}</Label><TextArea value={reviewDialogText} onChange={(event) => setReviewDialogText(event.target.value)}></TextArea></TextField>)}
				</Modal.Body>
				<Modal.Footer style={{ paddingInline: 24, paddingBottom: 16 }}>
					<Button isDisabled={actionLoading} onPress={closeReviewDialog} variant="tertiary">취소</Button>
					<Button isDisabled={actionLoading || (reviewDialogMode !== 'regenerate' && !reviewDialogText.trim())} onPress={confirmReviewDialog} variant={reviewDialogMode === 'reject' || reviewDialogMode === 'withdraw' ? 'danger' : 'primary'} style={{ fontWeight: 800 }}>
						{actionLoading ? <Spinner size="sm"></Spinner> : '확인'}
					</Button>
				</Modal.Footer>
			</Modal.Dialog></Modal.Container></Modal.Backdrop>
		</div>);
}
