'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import EditNoteIcon from '@mui/icons-material/EditNote';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import TuneIcon from '@mui/icons-material/Tune';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import {
	Alert,
	Avatar,
	Box,
	Button,
	Checkbox,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Drawer,
	FormControl,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	Stack,
	Tab,
	Tabs,
	TextField,
	Typography,
} from '@mui/material';
import type {
	CommunityAutomationCategoryOption,
	Content,
	ContentStatus,
	ScheduledCommentTimelineItem,
	TargetPostDetail,
	TargetPostListQuery,
	TargetPostOpsQueue,
	TargetPostSummary,
} from '@/app/services/admin/community-automation';
import type { GhostCommentBody, GhostLikeBody } from '@/app/services/community';
import communityService from '@/app/services/community';
import {
	campaigns as campaignsApi,
	COMMUNITY_AUTOMATION_CATEGORY_OPTIONS,
	reviewQueue as reviewApi,
	targetPosts as targetPostsApi,
} from '@/app/services/admin/community-automation';
import { CommunityPostAppDetailPanel } from '@/app/admin/community/components/CommunityPostAppDetailPanel';

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

const OPS_QUEUE_TABS: Array<{ value: TargetPostOpsQueue | 'all'; label: string }> = [
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

function preview(text: string, length = 90) {
	return text.length > length ? `${text.slice(0, length)}...` : text;
}

function formatDate(value: string | null) {
	if (!value) return '-';
	return new Date(value).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' });
}

function formatRelativeTime(value: string | null) {
	if (!value) return null;
	const target = new Date(value).getTime();
	if (Number.isNaN(target)) return null;
	const diffMinutes = Math.ceil((target - Date.now()) / 60_000);
	if (diffMinutes <= 0) return '곧 발송';
	if (diffMinutes < 60) return `${diffMinutes}분 후`;
	const hours = Math.floor(diffMinutes / 60);
	const minutes = diffMinutes % 60;
	if (hours < 24) return minutes > 0 ? `${hours}시간 ${minutes}분 후` : `${hours}시간 후`;
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
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '목록을 불러오지 못했습니다.');
		} finally {
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
			if (statusDelta !== 0) return statusDelta;
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		});
	}, [selected?.automationHistory]);
	const pendingReviewCount = reviewCandidates.filter((item) => item.status === 'pending_review').length;

	const loadScheduledComments = useCallback(
		async (articleId = selectedPost?.id) => {
			if (!articleId) return;
			setScheduledCommentsLoading(true);
			try {
				const items = await targetPostsApi.listScheduledComments(articleId);
				setScheduledComments(items);
			} catch (e: unknown) {
				setError(e instanceof Error ? e.message : '예약 댓글 타임라인을 불러오지 못했습니다.');
			} finally {
				setScheduledCommentsLoading(false);
			}
		},
		[selectedPost?.id],
	);

	const pageLabel = useMemo(() => {
		const page = query.page ?? 1;
		const limit = query.limit ?? 20;
		const from = total === 0 ? 0 : (page - 1) * limit + 1;
		const to = Math.min(page * limit, total);
		return `${from}-${to} / ${total}`;
	}, [query.limit, query.page, total]);

	const visibleCategories = useMemo(
		() => categories.filter((category) => !isExcludedCategory(category)),
		[categories],
	);
	const visibleIds = useMemo(() => items.map((item) => item.id), [items]);
	const visibleIdSet = useMemo(() => new Set(visibleIds), [visibleIds]);
	const visibleSelectedIds = useMemo(
		() => selectedIds.filter((id) => visibleIdSet.has(id)),
		[selectedIds, visibleIdSet],
	);
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
		if (ids.length === 0) return;
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
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '게시글 상태 변경 실패');
		} finally {
			setActionLoading(false);
		}
	}

	async function deletePosts(ids: string[]) {
		if (ids.length === 0) return;
		const confirmed = window.confirm(`${ids.length}개 게시글을 제거하시겠습니까? 이 작업은 되돌릴 수 없습니다.`);
		if (!confirmed) return;
		setActionLoading(true);
		setError(null);
		setSuccess(null);
		try {
			await Promise.all(ids.map((id) => communityService.deleteArticle(id)));
			setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
			if (selectedPost && ids.includes(selectedPost.id)) {
				setSelected(null);
				setScheduledComments([]);
			}
			setSuccess(`${ids.length}개 게시글을 제거했습니다.`);
			await load();
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '게시글 제거 실패');
		} finally {
			setActionLoading(false);
		}
	}

	async function movePostsToCategory(ids: string[], categoryId: string) {
		if (ids.length === 0 || !categoryId) return;
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
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '게시글 카테고리 이동 실패');
		} finally {
			setActionLoading(false);
		}
	}

	async function openDetail(articleId: string) {
		setDetailLoading(true);
		setError(null);
		setSuccess(null);
		setCreatedContents([]);
		try {
			const detail = await targetPostsApi.get(articleId);
			setSelected(detail);
			await loadScheduledComments(articleId);
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '상세를 불러오지 못했습니다.');
		} finally {
			setDetailLoading(false);
		}
	}

	async function refreshDetail() {
		if (!selectedPost) return;
		const detail = await targetPostsApi.get(selectedPost.id);
		setSelected(detail);
		await loadScheduledComments(selectedPost.id);
	}

	async function createLlmDrafts() {
		if (!selectedPost) return;
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
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : 'LLM 댓글 생성 실패');
		} finally {
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
			} else if (action === 'reject') {
				await reviewApi.reject(item.id, text);
				setSuccess('댓글 후보를 거절했습니다.');
			} else if (action === 'inject') {
				const result = await reviewApi.inject(item.id, text);
				setSuccess(`댓글 후보를 수정 승인했습니다. ${formatDate(result.scheduledAt)} 발송 예정입니다.`);
			} else if (action === 'withdraw') {
				await reviewApi.withdraw(item.id, text);
				setSuccess('댓글 후보를 회수했습니다.');
			} else if (action === 'regenerate') {
				await reviewApi.regenerate(item.id);
				setSuccess('댓글 후보 재생성을 요청했습니다.');
			}
			closeReviewDialog();
			await refreshDetail();
			await load();
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '검수 처리 실패');
		} finally {
			setActionLoading(false);
		}
	}

	async function confirmReviewDialog() {
		if (!reviewDialogMode || !reviewDialogTarget) return;
		await applyReviewAction(reviewDialogTarget, reviewDialogMode, reviewDialogText);
	}

	async function createManualComment() {
		if (!selectedPost || !manualText.trim()) return;
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
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '직접 입력 댓글 생성 실패');
		} finally {
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
			if (!prev || prev.post.id !== articleId) return prev;
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
		} else {
			await refreshDetail();
			await load();
		}
		return result;
	}

	async function cancelScheduledComment(contentId: string) {
		if (!selectedPost) return;
		const items = await targetPostsApi.cancelScheduledComment(selectedPost.id, contentId);
		setScheduledComments(items);
		await refreshDetail();
		await load();
	}

	async function rescheduleScheduledComment(contentId: string, delayMinutes: number) {
		if (!selectedPost) return;
		const items = await targetPostsApi.rescheduleScheduledComment(selectedPost.id, contentId, { delayMinutes });
		setScheduledComments(items);
		await refreshDetail();
		await load();
	}

	async function promoteSelectedPostToHot() {
		if (!selectedPost) return;
		setActionLoading(true);
		setError(null);
		setSuccess(null);
		try {
			const result = await targetPostsApi.promoteToHotArticle(selectedPost.id, {
				curatorComment: hotPromotionComment.trim() || undefined,
			});
			setSuccess(`인기 게시글로 등업했습니다. hotId=${result.hotId}`);
			setHotPromotionOpen(false);
			setHotPromotionComment('');
			await refreshDetail();
			await load();
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '인기 게시글 등업 실패');
		} finally {
			setActionLoading(false);
		}
	}

	async function loadLiveCommentSuggestions() {
		if (!selectedPost) return [];
		const result = await targetPostsApi.listLiveCommentSuggestions(selectedPost.id);
		return result.suggestions;
	}

	return (
		<Box>
			<Paper sx={{ p: 1, mb: 2 }}>
				<Tabs
					value={query.opsQueue ?? 'all'}
					onChange={(_, value: TargetPostOpsQueue | 'all') =>
						setQuery((prev) => ({
							...prev,
							page: 1,
							opsQueue: value === 'all' ? undefined : value,
							sort: value === 'all' ? 'createdAt' : 'urgencyScore',
							order: 'desc',
						}))
					}
					variant="scrollable"
					scrollButtons="auto"
				>
					{OPS_QUEUE_TABS.map((tab) => {
						const count = tab.value === 'all' ? total : opsQueueCounts[tab.value] ?? 0;
						return (
							<Tab
								key={tab.value}
								value={tab.value}
								label={`${tab.label} ${formatCount(count)}`}
								sx={{ minHeight: 44, fontWeight: 800 }}
							/>
						);
					})}
				</Tabs>
			</Paper>
			<Paper sx={{ p: 2, mb: 2 }}>
				<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
					<FormControl size="small" sx={{ minWidth: 160 }}>
						<InputLabel>카테고리</InputLabel>
						<Select
							value={query.categoryId ?? ''}
							label="카테고리"
							onChange={(e) => setQuery((prev) => ({ ...prev, page: 1, categoryId: e.target.value || undefined }))}
						>
							<MenuItem value="">전체</MenuItem>
							{visibleCategories.map((category) => (
								<MenuItem key={category.id ?? category.value} value={category.id ?? ''}>
									{category.label}
								</MenuItem>
							))}
						</Select>
					</FormControl>
					<TextField
						size="small"
						label="REGION_CLUSTER"
						value={query.regionCluster ?? ''}
						onChange={(e) => setQuery((prev) => ({ ...prev, page: 1, regionCluster: e.target.value || undefined }))}
						sx={{ minWidth: 160 }}
					/>
					<FormControl size="small" sx={{ minWidth: 150 }}>
						<InputLabel>자동화 상태</InputLabel>
						<Select
							value={query.automationStatus ?? ''}
							label="자동화 상태"
							onChange={(e) => setQuery((prev) => ({ ...prev, page: 1, automationStatus: (e.target.value || undefined) as TargetPostListQuery['automationStatus'] }))}
						>
							<MenuItem value="">전체</MenuItem>
							<MenuItem value="none">미생성</MenuItem>
							<MenuItem value="pending_review">검수 대기</MenuItem>
							<MenuItem value="scheduled">예약됨</MenuItem>
							<MenuItem value="published">발행됨</MenuItem>
							<MenuItem value="withdrawn">회수됨</MenuItem>
						</Select>
					</FormControl>
					<TextField
						size="small"
						label="검색"
						value={query.search ?? ''}
						onChange={(e) => setQuery((prev) => ({ ...prev, page: 1, search: e.target.value || undefined }))}
						sx={{ minWidth: 220, flex: 1 }}
					/>
					<FormControl size="small" sx={{ minWidth: 140 }}>
						<InputLabel>정렬</InputLabel>
						<Select
							value={query.sort ?? 'createdAt'}
							label="정렬"
							onChange={(e) => setQuery((prev) => ({ ...prev, sort: e.target.value as TargetPostListQuery['sort'] }))}
						>
							<MenuItem value="createdAt">작성일</MenuItem>
							<MenuItem value="commentCount">댓글 수</MenuItem>
							<MenuItem value="likeCount">좋아요</MenuItem>
							<MenuItem value="readCount">조회</MenuItem>
							<MenuItem value="automationUpdatedAt">자동화 최신</MenuItem>
							<MenuItem value="urgencyScore">운영 우선순위</MenuItem>
						</Select>
					</FormControl>
					<Button variant="outlined" onClick={load} disabled={loading}>
						새로고침
					</Button>
				</Stack>
			</Paper>

			<Paper
				variant="outlined"
				sx={{
					p: 1.5,
					mb: 2,
					borderRadius: '16px',
					borderColor: '#E5E8EB',
					bgcolor: '#FFFFFF',
				}}
			>
				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} justifyContent="space-between">
					<Stack direction="row" spacing={1} alignItems="center">
						<Checkbox
							size="small"
							checked={allVisibleSelected}
							indeterminate={selectedCount > 0 && !allVisibleSelected}
							onChange={toggleAllVisible}
							inputProps={{ 'aria-label': '현재 페이지 게시글 전체 선택' }}
						/>
						<Typography variant="body2" color="text.secondary">
							선택 {formatCount(selectedCount)}개
						</Typography>
					</Stack>
					<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
						<FormControl size="small" sx={{ minWidth: 160 }}>
							<InputLabel>이동할 카테고리</InputLabel>
							<Select
								value={moveCategoryId}
								label="이동할 카테고리"
								onChange={(event) => setMoveCategoryId(event.target.value)}
							>
								<MenuItem value="">선택</MenuItem>
								{visibleCategories.map((category) => (
									<MenuItem key={category.id ?? category.value} value={category.id ?? ''}>
										{category.label}
									</MenuItem>
								))}
							</Select>
						</FormControl>
						<Button
							size="small"
							variant="outlined"
							disabled={actionLoading || selectedCount === 0 || !moveCategoryId}
							onClick={() => movePostsToCategory(visibleSelectedIds, moveCategoryId)}
						>
							카테고리 이동
						</Button>
						<Button size="small" variant="outlined" disabled={actionLoading || selectedCount === 0} onClick={() => applyPostVisibility(visibleSelectedIds, true)}>
							선택 가리기
						</Button>
						<Button size="small" variant="outlined" disabled={actionLoading || selectedCount === 0} onClick={() => applyPostVisibility(visibleSelectedIds, false)}>
							가리기 해제
						</Button>
						<Button size="small" color="error" variant="outlined" disabled={actionLoading || selectedCount === 0} onClick={() => deletePosts(visibleSelectedIds)}>
							선택 제거
						</Button>
					</Stack>
				</Stack>
			</Paper>

			{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
			{success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

			{loading ? (
				<Box display="flex" justifyContent="center" py={6}>
					<CircularProgress />
				</Box>
			) : (
				<Stack spacing={1.5}>
					{items.length === 0 ? (
						<Paper
							variant="outlined"
							sx={{
								p: 4,
								textAlign: 'center',
								borderRadius: '16px',
								borderColor: '#E5E8EB',
								bgcolor: '#FFFFFF',
							}}
						>
							<Typography variant="body2" color="text.secondary">대상 게시글 없음</Typography>
						</Paper>
					) : (
						<Box
							sx={{
								display: 'grid',
								gridTemplateColumns: {
									xs: '1fr',
									sm: 'repeat(2, minmax(0, 1fr))',
									md: 'repeat(3, minmax(0, 1fr))',
									lg: 'repeat(4, minmax(0, 1fr))',
									xl: 'repeat(6, minmax(0, 1fr))',
								},
								'@media (min-width: 1920px)': {
									gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
								},
								gap: 1.5,
							}}
						>
							{items.map((item) => {
								const status = item.automationStatus ?? 'none';
								const isBlinded = Boolean(item.isBlinded || item.blindedAt);
								const opsQueue = item.primaryOpsQueue ?? item.opsQueues?.[0] ?? null;
								const opsColor = getOpsQueueColor(opsQueue);
								return (
									<Paper
										key={item.id}
										variant="outlined"
										role="button"
										tabIndex={0}
										aria-label={`${item.title || '제목 없음'} 작업 열기`}
										onClick={() => openDetail(item.id)}
										onKeyDown={(event) => {
											if (event.key === 'Enter' || event.key === ' ') {
												event.preventDefault();
												openDetail(item.id);
											}
										}}
										sx={{
											borderRadius: '16px',
											borderColor: '#E5E8EB',
											bgcolor: '#FFFFFF',
											boxShadow: '0 1px 4px rgba(25, 31, 40, 0.06)',
											cursor: 'pointer',
											minWidth: 0,
											height: '100%',
											display: 'flex',
											flexDirection: 'column',
											overflow: 'hidden',
											transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
											'&:hover': {
												borderColor: '#C7B7F4',
												boxShadow: '0 8px 24px rgba(25, 31, 40, 0.10)',
												transform: 'translateY(-2px)',
											},
											'&:focus-visible': {
												outline: '3px solid #ffd1da',
												outlineOffset: 2,
											},
										}}
										>
											<Box sx={{ height: 4, bgcolor: isBlinded ? '#FF6B6B' : getStatusAccent(status) }} />
										<Stack spacing={1.2} sx={{ p: 1.6, flex: 1, minHeight: 0 }}>
											<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
												<Checkbox
													size="small"
													checked={selectedIds.includes(item.id)}
													onClick={(event) => event.stopPropagation()}
													onKeyDown={(event) => event.stopPropagation()}
													onChange={() => toggleSelected(item.id)}
													inputProps={{ 'aria-label': `${item.title || '제목 없음'} 선택` }}
													sx={{ p: 0.2, mr: -0.5 }}
												/>
												<Chip
													size="small"
													label={visibleCategories.find((category) => category.id === item.categoryId)?.label ?? item.categoryName ?? '커뮤니티'}
													sx={{
														height: 24,
														maxWidth: '68%',
														borderRadius: '9999px',
														bgcolor: '#f7f7f7',
														color: '#ff385c',
														fontWeight: 700,
														border: '1px solid #ffd1da',
														'& .MuiChip-label': {
															overflow: 'hidden',
															textOverflow: 'ellipsis',
														},
													}}
												/>
												<Chip
													label={STATUS_LABEL[status]}
													color={STATUS_COLOR[status]}
													size="small"
													sx={{ height: 24, flexShrink: 0 }}
												/>
											</Stack>
											{opsQueue && (
												<Stack spacing={0.6}>
													<Stack direction="row" spacing={0.7} alignItems="center" flexWrap="wrap" useFlexGap>
														<Chip
															size="small"
															label={OPS_QUEUE_LABEL[opsQueue]}
															sx={{
																height: 24,
																borderRadius: '9999px',
																bgcolor: opsColor.bg,
																color: opsColor.fg,
																border: `1px solid ${opsColor.border}`,
																fontWeight: 800,
															}}
														/>
														{typeof item.urgencyScore === 'number' && (
															<Chip
																size="small"
																label={`우선 ${formatCount(item.urgencyScore)}`}
																sx={{
																	height: 24,
																	borderRadius: '9999px',
																	bgcolor: '#FFFFFF',
																	color: '#4E5968',
																	border: '1px solid #E5E8EB',
																}}
															/>
														)}
													</Stack>
													{item.opsReason && (
														<Typography
															variant="caption"
															sx={{
																color: '#4E5968',
																lineHeight: 1.35,
																display: '-webkit-box',
																WebkitLineClamp: 2,
																WebkitBoxOrient: 'vertical',
																overflow: 'hidden',
															}}
														>
															{item.opsReason}
														</Typography>
													)}
												</Stack>
											)}
											{isBlinded && (
												<Alert severity="warning" sx={{ py: 0, '& .MuiAlert-message': { py: 0.5 } }}>
													<Typography variant="caption">가려진 게시글</Typography>
												</Alert>
											)}

											<Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
												<Avatar
													sx={{
														width: 34,
														height: 34,
														bgcolor: '#F8F9FA',
														color: '#49386E',
														border: '1px solid #E5E8EB',
														fontWeight: 800,
														fontSize: 12,
														flexShrink: 0,
													}}
												>
													{(item.authorName ?? item.authorId ?? '익').slice(0, 1)}
												</Avatar>
												<Box sx={{ minWidth: 0, flex: 1 }}>
													<Typography variant="body2" fontWeight={800} color="#191F28" noWrap>
														{item.authorName ?? item.authorId}
													</Typography>
													<Typography variant="caption" color="text.secondary" noWrap display="block">
														{item.authorRegionCluster ?? 'cluster 없음'} · {formatDate(item.createdAt)}
													</Typography>
												</Box>
											</Stack>

											<Box sx={{ minHeight: 128 }}>
												<Typography
													variant="subtitle1"
													fontWeight={800}
													sx={{
														lineHeight: 1.35,
														fontSize: 16,
														color: '#191F28',
														wordBreak: 'break-word',
														display: '-webkit-box',
														WebkitLineClamp: 2,
														WebkitBoxOrient: 'vertical',
														overflow: 'hidden',
													}}
												>
													{item.title || '제목 없음'}
												</Typography>
												<Typography
													variant="body2"
													sx={{
														mt: 0.8,
														color: '#4E5968',
														lineHeight: 1.55,
														display: '-webkit-box',
														WebkitLineClamp: 4,
														WebkitBoxOrient: 'vertical',
														overflow: 'hidden',
													}}
												>
													{preview(item.content, 180)}
												</Typography>
											</Box>

											{item.latestComment && (
												<Box
													sx={{
														p: 1,
														borderRadius: '12px',
														bgcolor: '#F8F9FA',
														border: '1px solid #E7E9EC',
														minHeight: 48,
													}}
												>
													<Typography variant="caption" color="text.secondary" display="block" noWrap>
														최근 댓글
													</Typography>
													<Typography
														variant="caption"
														color="#4E5968"
														sx={{
															display: '-webkit-box',
															WebkitLineClamp: 2,
															WebkitBoxOrient: 'vertical',
															overflow: 'hidden',
															lineHeight: 1.35,
														}}
													>
														{item.latestComment}
													</Typography>
												</Box>
											)}

											<Box sx={{ flex: 1 }} />

											<Stack spacing={1}>
												<Box
													sx={{
														display: 'grid',
														gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
														border: '1px solid #E7E9EC',
														borderRadius: '12px',
														overflow: 'hidden',
													}}
												>
													{[
														{ icon: <ChatBubbleOutlineIcon fontSize="small" />, value: item.commentCount },
														{ icon: <FavoriteBorderIcon fontSize="small" />, value: item.likeCount },
														{ icon: <VisibilityOutlinedIcon fontSize="small" />, value: item.readCount },
													].map((metric, index) => (
														<Stack
															key={index}
															direction="row"
															spacing={0.4}
															alignItems="center"
															justifyContent="center"
															sx={{
																minWidth: 0,
																height: 34,
																color: '#4E5968',
																borderLeft: index === 0 ? 'none' : '1px solid #E7E9EC',
															}}
														>
															{metric.icon}
															<Typography variant="caption" fontWeight={700} noWrap>
																{formatCount(metric.value)}
															</Typography>
														</Stack>
													))}
												</Box>

												<Stack direction="row" spacing={0.7} alignItems="center" justifyContent="space-between">
													<Chip
														size="small"
														label={`자동화 ${formatCount(item.automationCount)}`}
														sx={{
															height: 24,
															borderRadius: '9999px',
															bgcolor: '#FFFFFF',
															color: '#4E5968',
															border: '1px solid #E5E8EB',
														}}
													/>
													{item.automationSummary?.failed ? (
														<Chip
															size="small"
															label={`실패 ${formatCount(item.automationSummary.failed)}`}
															color="error"
															variant="outlined"
															sx={{ borderRadius: '9999px', height: 24 }}
														/>
													) : null}
													{item.reportCount > 0 && (
														<Chip
															icon={<FlagOutlinedIcon />}
															label={`신고 ${formatCount(item.reportCount)}`}
															size="small"
															color="error"
															variant="outlined"
															sx={{ borderRadius: '9999px', height: 24 }}
														/>
													)}
												</Stack>
												{item.recommendedAction && (
													<Box
														sx={{
															p: 1,
															borderRadius: '12px',
															bgcolor: opsQueue === 'risk' ? '#FFF1F0' : '#F8F9FA',
															border: `1px solid ${opsColor.border}`,
														}}
													>
														<Typography variant="caption" color="text.secondary" display="block">
															추천 액션
														</Typography>
														<Typography variant="caption" fontWeight={800} sx={{ color: opsColor.fg }}>
															{item.recommendedAction}
														</Typography>
													</Box>
												)}
											</Stack>
										</Stack>
									</Paper>
								);
							})}
						</Box>
					)}
					<Paper
						variant="outlined"
						sx={{
							display: 'flex',
							justifyContent: 'flex-end',
							alignItems: 'center',
							gap: 1,
							p: 1.5,
							borderRadius: '16px',
							borderColor: '#E5E8EB',
							bgcolor: '#FFFFFF',
						}}
					>
						<Typography variant="body2" color="text.secondary">{pageLabel}</Typography>
						<Button
							size="small"
							disabled={(query.page ?? 1) <= 1}
							onClick={() => setQuery((prev) => ({ ...prev, page: Math.max((prev.page ?? 1) - 1, 1) }))}
						>
							이전
						</Button>
						<Button
							size="small"
							disabled={(query.page ?? 1) * (query.limit ?? 20) >= total}
							onClick={() => setQuery((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))}
						>
							다음
						</Button>
					</Paper>
				</Stack>
			)}

			<Drawer
				anchor="right"
				open={Boolean(selected) || detailLoading}
				onClose={() => {
					setSelected(null);
					setScheduledComments([]);
				}}
			>
				<Box sx={{ width: { xs: '100vw', lg: 1040, xl: 1360 }, p: 3 }}>
					{detailLoading || !selected ? (
						<Box display="flex" justifyContent="center" py={8}>
							<CircularProgress />
						</Box>
					) : (
						<Stack spacing={2}>
							<Alert severity={ghostBlocked ? 'warning' : 'info'}>
								{ghostBlocked
									? '같은 REGION_CLUSTER ghost 후보 없음'
									: `같은 cluster ACTIVE ghost ${selected.ghostCandidateCount}명`}
							</Alert>
								<Box
									sx={{
										display: 'grid',
										gridTemplateColumns: { xs: '1fr', xl: 'minmax(720px, 1fr) 420px' },
										gap: 2,
										alignItems: 'start',
									}}
								>
								<CommunityPostAppDetailPanel
									post={{
										...selected.post,
										categoryName: categories.find((category) => category.id === selected.post.categoryId)?.label ?? selected.post.categoryName,
									}}
									comments={selected.comments}
									ghostCandidates={selected.ghostCandidates}
									ghostCandidateCount={selected.ghostCandidateCount}
									submitLabel="지금 고스트 댓글 달기"
									onSubmitGhostComment={createLiveGhostComment}
									onSubmitGhostLike={createLiveGhostLike}
									onReload={refreshDetail}
									scheduledComments={scheduledComments}
									scheduledCommentsLoading={scheduledCommentsLoading}
									onReloadScheduledComments={() => loadScheduledComments(selected.post.id)}
									onCancelScheduledComment={cancelScheduledComment}
									onRescheduleScheduledComment={rescheduleScheduledComment}
									onLoadLiveCommentSuggestions={loadLiveCommentSuggestions}
								/>
								<Stack spacing={1.5} sx={{ position: { xl: 'sticky' }, top: { xl: 16 } }}>
									<Paper
										variant="outlined"
										sx={{
											p: 2,
											borderRadius: '16px',
											borderColor: '#D9D6FE',
											bgcolor: '#FBFAFF',
											boxShadow: '0 12px 32px rgba(89, 37, 220, 0.08)',
										}}
									>
										<Stack spacing={1.6}>
											<Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
												<Stack direction="row" spacing={1} alignItems="center">
													<Box
														sx={{
															width: 36,
															height: 36,
															borderRadius: '12px',
															display: 'grid',
															placeItems: 'center',
															bgcolor: '#F4F3FF',
															color: '#ff385c',
														}}
													>
														<AutoAwesomeIcon fontSize="small" />
													</Box>
													<Box>
														<Typography variant="subtitle2" fontWeight={900} color="#191F28">
															LLM 댓글 후보 생성
														</Typography>
														<Typography variant="caption" color="text.secondary">
															생성 즉시 아래 후보 검수에 표시됩니다.
														</Typography>
													</Box>
												</Stack>
												<Chip size="small" label="3개" sx={{ bgcolor: '#FFFFFF', fontWeight: 800 }} />
											</Stack>
											<TextField
												size="small"
												label="톤"
												value={tone}
												onChange={(e) => setTone(e.target.value)}
												InputProps={{ startAdornment: <TuneIcon fontSize="small" sx={{ mr: 0.8, color: '#ff385c' }} /> }}
											/>
											<TextField
												size="small"
												label="추가 지시"
												placeholder="예: 질문형 1개, 공감형 1개, 분위기 전환 1개"
												value={instruction}
												onChange={(e) => setInstruction(e.target.value)}
												multiline
												minRows={2}
											/>
											<Button
												variant="contained"
												disabled={actionLoading}
												onClick={createLlmDrafts}
												startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
												sx={{
													borderRadius: '10px',
													fontWeight: 900,
													bgcolor: '#ff385c',
													'&:hover': { bgcolor: '#4A1FB8' },
												}}
											>
												후보 생성
											</Button>
										</Stack>
									</Paper>

									<Paper variant="outlined" sx={{ p: 2, borderRadius: '16px', borderColor: '#E5E8EB' }}>
										<Stack spacing={1.4}>
											<Stack direction="row" spacing={1} alignItems="center">
												<EditNoteIcon fontSize="small" sx={{ color: '#175CD3' }} />
												<Box>
													<Typography variant="subtitle2" fontWeight={900}>직접 댓글 입력</Typography>
													<Typography variant="caption" color="text.secondary">운영자가 작성한 문장도 같은 후보 검수 흐름으로 보냅니다.</Typography>
												</Box>
											</Stack>
											<TextField
												label="댓글 내용"
												value={manualText}
												onChange={(e) => setManualText(e.target.value)}
												multiline
												minRows={3}
											/>
											<Button
												variant="outlined"
												disabled={actionLoading || !manualText.trim()}
												onClick={createManualComment}
												sx={{ borderRadius: '10px', fontWeight: 800 }}
											>
												후보에 추가
											</Button>
										</Stack>
									</Paper>

									<Paper variant="outlined" sx={{ p: 2, borderRadius: '16px', borderColor: '#E5E8EB' }}>
										<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} justifyContent="space-between">
											<Box>
												<Typography variant="subtitle2" fontWeight={900}>게시글 제어</Typography>
												<Typography variant="caption" color="text.secondary">
													노출 상태를 이 화면에서 바로 처리합니다.
												</Typography>
											</Box>
											<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
												<Button
													size="small"
													variant="contained"
													disabled={actionLoading}
													startIcon={<WhatshotIcon />}
													onClick={() => setHotPromotionOpen(true)}
													sx={{ boxShadow: 'none', fontWeight: 800 }}
												>
													인기글 등업
												</Button>
												<Button size="small" variant="outlined" disabled={actionLoading} onClick={() => applyPostVisibility([selected.post.id], true)}>
													가리기
												</Button>
												<Button size="small" variant="outlined" disabled={actionLoading} onClick={() => applyPostVisibility([selected.post.id], false)}>
													해제
												</Button>
												<Button size="small" color="error" variant="outlined" disabled={actionLoading} onClick={() => deletePosts([selected.post.id])}>
													제거
												</Button>
											</Stack>
										</Stack>
									</Paper>
								</Stack>
							</Box>

							<Paper
								variant="outlined"
								sx={{
									p: 2,
									borderRadius: '16px',
									borderColor: pendingReviewCount > 0 ? '#FEDF89' : '#E5E8EB',
									bgcolor: '#FFFFFF',
								}}
							>
								<Stack spacing={1.6}>
									<Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }} justifyContent="space-between">
										<Box>
											<Typography variant="subtitle1" fontWeight={900} color="#191F28">
												후보 검수
											</Typography>
											<Typography variant="body2" color="text.secondary">
												별도 검수 큐로 이동하지 않고 이 게시글 안에서 생성, 수정, 승인까지 완료합니다.
											</Typography>
											<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
												승인하면 즉시 발행하지 않고 서버 타이밍 정책에 따라 발송 예약되며, 예약 시각은 각 후보 카드에 표시됩니다.
											</Typography>
										</Box>
										<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
											<Chip label={`검수 대기 ${formatCount(pendingReviewCount)}`} color={pendingReviewCount > 0 ? 'warning' : 'default'} sx={{ fontWeight: 800 }} />
											<Chip label={`전체 후보 ${formatCount(reviewCandidates.length)}`} variant="outlined" sx={{ fontWeight: 800 }} />
											{createdContents.length > 0 && (
												<Chip label={`방금 생성 ${formatCount(createdContents.length)}`} color="success" variant="outlined" sx={{ fontWeight: 800 }} />
											)}
										</Stack>
									</Stack>
									{reviewCandidates.length === 0 ? (
										<Box sx={{ p: 3, borderRadius: '14px', bgcolor: '#F8F9FA', textAlign: 'center' }}>
											<Typography variant="body2" color="text.secondary">
												아직 이 게시글에 생성된 댓글 후보가 없습니다.
											</Typography>
										</Box>
									) : (
										<Box
											sx={{
												display: 'grid',
												gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
												gap: 1.2,
											}}
										>
											{reviewCandidates.map((item) => {
												const text = item.finalText ?? item.generatedText ?? '';
												const isActionable = item.status === 'pending_review' || item.status === 'quality_failed' || item.status === 'draft';
												const timingText = getCandidateTimingText(item);
												return (
													<Paper
														key={item.id}
														variant="outlined"
														sx={{
															p: 1.5,
															borderRadius: '14px',
															borderColor: item.status === 'pending_review' ? '#FEDF89' : '#E5E8EB',
															bgcolor: item.status === 'pending_review' ? '#FFFCF5' : '#FFFFFF',
															minWidth: 0,
														}}
													>
														<Stack spacing={1.2}>
															<Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
																<Stack spacing={0.5} minWidth={0}>
																	<Stack direction="row" spacing={0.8} alignItems="center" minWidth={0}>
																		<Chip label={STATUS_LABEL[item.status]} color={STATUS_COLOR[item.status]} size="small" sx={{ fontWeight: 800 }} />
																		<Typography variant="caption" color="text.secondary" noWrap>
																			생성 {formatDate(item.createdAt)}
																		</Typography>
																	</Stack>
																	{timingText && (
																		<Typography
																			variant="caption"
																			sx={{
																				color: item.status === 'scheduled' ? '#175CD3' : 'text.secondary',
																				fontWeight: item.status === 'scheduled' ? 800 : 600,
																				lineHeight: 1.35,
																				wordBreak: 'keep-all',
																			}}
																		>
																			{timingText}
																		</Typography>
																	)}
																</Stack>
																{item.targetType && (
																	<Chip size="small" label={item.targetType} variant="outlined" sx={{ height: 24 }} />
																)}
															</Stack>
															<Typography
																variant="body2"
																sx={{
																	color: '#191F28',
																	lineHeight: 1.65,
																	whiteSpace: 'pre-wrap',
																	wordBreak: 'break-word',
																}}
															>
																{text || '-'}
															</Typography>
															{item.qualityScores && (
																<Stack direction="row" spacing={0.7} flexWrap="wrap" useFlexGap>
																	{Object.entries(item.qualityScores)
																		.filter(([, value]) => value !== undefined)
																		.slice(0, 4)
																		.map(([key, value]) => (
																			<Chip
																				key={key}
																				size="small"
																				label={`${key} ${value}`}
																				sx={{
																					height: 23,
																					bgcolor: '#F8F9FA',
																					border: '1px solid #E5E8EB',
																					fontSize: 11,
																				}}
																			/>
																		))}
																</Stack>
															)}
															<Stack direction="row" spacing={0.7} flexWrap="wrap" useFlexGap justifyContent="flex-end">
																<Button
																	size="small"
																	variant="contained"
																	color="success"
																	disabled={actionLoading || !isActionable}
																	onClick={() => applyReviewAction(item, 'approve')}
																	startIcon={<CheckCircleOutlineIcon />}
																>
																	승인
																</Button>
																<Button
																	size="small"
																	variant="outlined"
																	disabled={actionLoading || !isActionable}
																	onClick={() => openReviewDialog('inject', item, text)}
																>
																	수정승인
																</Button>
																<Button
																	size="small"
																	variant="outlined"
																	color="error"
																	disabled={actionLoading || !isActionable}
																	onClick={() => openReviewDialog('reject', item)}
																>
																	거절
																</Button>
																<Button
																	size="small"
																	variant="outlined"
																	disabled={actionLoading}
																	onClick={() => openReviewDialog('regenerate', item)}
																	startIcon={<RestartAltIcon />}
																>
																	재생성
																</Button>
																<Button
																	size="small"
																	variant="outlined"
																	color="warning"
																	disabled={actionLoading || item.status === 'withdrawn'}
																	onClick={() => openReviewDialog('withdraw', item)}
																>
																	회수
																</Button>
															</Stack>
														</Stack>
													</Paper>
												);
											})}
										</Box>
									)}
								</Stack>
							</Paper>
						</Stack>
					)}
				</Box>
				</Drawer>
				<Dialog
					open={hotPromotionOpen}
					onClose={() => !actionLoading && setHotPromotionOpen(false)}
					maxWidth="sm"
					fullWidth
				>
					<DialogTitle sx={{ fontWeight: 900 }}>인기 게시글로 등업할까요?</DialogTitle>
					<DialogContent sx={{ pt: '12px !important' }}>
						<Stack spacing={1.5}>
							<Typography variant="body2" color="text.secondary">
								원본 게시글은 그대로 두고 hot_articles 참조만 추가합니다. 확인하면 앱 인기 탭에 이 게시글이 노출됩니다.
							</Typography>
							<TextField
								label="큐레이터 코멘트"
								placeholder="선택 입력"
								value={hotPromotionComment}
								onChange={(event) => setHotPromotionComment(event.target.value)}
								inputProps={{ maxLength: 255 }}
								fullWidth
							/>
						</Stack>
					</DialogContent>
					<DialogActions sx={{ px: 3, pb: 2 }}>
						<Button disabled={actionLoading} onClick={() => setHotPromotionOpen(false)}>
							취소
						</Button>
						<Button
							variant="contained"
							color="warning"
							disabled={actionLoading}
							startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <WhatshotIcon />}
							onClick={promoteSelectedPostToHot}
							sx={{ fontWeight: 800 }}
						>
							인기글 등업
						</Button>
					</DialogActions>
				</Dialog>
				<Dialog open={Boolean(reviewDialogMode)} onClose={closeReviewDialog} maxWidth="sm" fullWidth>
				<DialogTitle sx={{ fontWeight: 900 }}>
					{reviewDialogMode === 'inject'
						? '댓글 수정 승인'
						: reviewDialogMode === 'reject'
							? '댓글 후보 거절'
							: reviewDialogMode === 'withdraw'
								? '댓글 후보 회수'
								: reviewDialogMode === 'regenerate'
									? '댓글 후보 재생성'
									: ''}
				</DialogTitle>
				<DialogContent sx={{ pt: '12px !important' }}>
					{reviewDialogMode === 'regenerate' ? (
						<Typography variant="body2" color="text.secondary">
							이 후보를 기준으로 재생성을 요청합니다. 현재 상태는 상세 후보 목록에서 다시 확인할 수 있습니다.
						</Typography>
					) : (
						<TextField
							label={reviewDialogMode === 'inject' ? '최종 댓글 텍스트' : '사유'}
							value={reviewDialogText}
							onChange={(event) => setReviewDialogText(event.target.value)}
							multiline
							minRows={reviewDialogMode === 'inject' ? 6 : 3}
							fullWidth
						/>
					)}
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button onClick={closeReviewDialog}>취소</Button>
					<Button
						variant="contained"
						disabled={actionLoading || (reviewDialogMode === 'inject' && !reviewDialogText.trim())}
						onClick={confirmReviewDialog}
						sx={{ fontWeight: 800 }}
					>
						{actionLoading ? <CircularProgress size={16} color="inherit" /> : '확인'}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
