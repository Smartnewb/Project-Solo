'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
	Alert,
	Avatar,
	Box,
	Button,
	Chip,
	CircularProgress,
	Divider,
	Drawer,
	FormControl,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import type {
	CommunityAutomationCategoryOption,
	Content,
	ContentStatus,
	TargetPostDetail,
	TargetPostListQuery,
	TargetPostSummary,
} from '@/app/services/admin/community-automation';
import type { GhostCommentBody } from '@/app/services/community';
import {
	campaigns as campaignsApi,
	COMMUNITY_AUTOMATION_CATEGORY_OPTIONS,
	targetPosts as targetPostsApi,
} from '@/app/services/admin/community-automation';
import { CommunityPostAppDetailPanel } from '@/app/admin/community/components/CommunityPostAppDetailPanel';

const STATUS_LABEL: Record<ContentStatus | 'none', string> = {
	none: '미생성',
	draft: '초안',
	pending_review: '검수 대기',
	approved: '승인',
	scheduled: '예약됨',
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

function preview(text: string, length = 90) {
	return text.length > length ? `${text.slice(0, length)}...` : text;
}

function formatDate(value: string | null) {
	if (!value) return '-';
	return new Date(value).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' });
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
			return '#7A4AE2';
		default:
			return '#D0D5DD';
	}
}

export default function TargetPostsPage() {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [detailLoading, setDetailLoading] = useState(false);
	const [actionLoading, setActionLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [items, setItems] = useState<TargetPostSummary[]>([]);
	const [total, setTotal] = useState(0);
	const [categories, setCategories] = useState<CommunityAutomationCategoryOption[]>(COMMUNITY_AUTOMATION_CATEGORY_OPTIONS);
	const [query, setQuery] = useState<TargetPostListQuery>({ page: 1, limit: 20, sort: 'createdAt', order: 'desc' });
	const [selected, setSelected] = useState<TargetPostDetail | null>(null);
	const [tone, setTone] = useState('자연스러운 대학생 말투');
	const [instruction, setInstruction] = useState('');
	const [manualText, setManualText] = useState('');
	const [createdContents, setCreatedContents] = useState<Content[]>([]);

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

	const selectedPost = selected?.post ?? null;
	const ghostBlocked = selected ? selected.ghostCandidateCount === 0 : false;
	const regionCluster = selected?.defaults.defaultRegionCluster ?? '';

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

	async function openDetail(articleId: string) {
		setDetailLoading(true);
		setError(null);
		setSuccess(null);
		setCreatedContents([]);
		try {
			const detail = await targetPostsApi.get(articleId);
			setSelected(detail);
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
			setSuccess(`LLM 댓글 후보 ${(result.items ?? []).length}개를 검수 큐에 생성했습니다.`);
			await refreshDetail();
			await load();
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : 'LLM 댓글 생성 실패');
		} finally {
			setActionLoading(false);
		}
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
			setSuccess('직접 입력 댓글을 검수 큐에 생성했습니다.');
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

	return (
		<Box>
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
						</Select>
					</FormControl>
					<Button variant="outlined" onClick={load} disabled={loading}>
						새로고침
					</Button>
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
												outline: '3px solid #E2D5FF',
												outlineOffset: 2,
											},
										}}
									>
										<Box sx={{ height: 4, bgcolor: getStatusAccent(status) }} />
										<Stack spacing={1.2} sx={{ p: 1.6, flex: 1, minHeight: 0 }}>
											<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
												<Chip
													size="small"
													label={visibleCategories.find((category) => category.id === item.categoryId)?.label ?? item.categoryName ?? '커뮤니티'}
													sx={{
														height: 24,
														maxWidth: '68%',
														borderRadius: '9999px',
														bgcolor: '#F7F3FF',
														color: '#7A4AE2',
														fontWeight: 700,
														border: '1px solid #E2D5FF',
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

			<Drawer anchor="right" open={Boolean(selected) || detailLoading} onClose={() => setSelected(null)}>
				<Box sx={{ width: { xs: '100vw', lg: 1040 }, p: 3 }}>
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
								onReload={refreshDetail}
							/>
							<Divider />
							<Stack spacing={1.5}>
								<Typography variant="subtitle2">LLM 댓글 후보 3개 생성</Typography>
								<TextField size="small" label="톤" value={tone} onChange={(e) => setTone(e.target.value)} />
								<TextField
									size="small"
									label="추가 지시"
									value={instruction}
									onChange={(e) => setInstruction(e.target.value)}
									multiline
									minRows={2}
								/>
								<Button variant="contained" disabled={actionLoading} onClick={createLlmDrafts}>
									{actionLoading ? <CircularProgress size={16} /> : 'LLM 후보 생성'}
								</Button>
							</Stack>
							<Stack spacing={1.5}>
								<Typography variant="subtitle2">직접 입력 댓글</Typography>
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
								>
									직접 입력 검수 큐 생성
								</Button>
							</Stack>
							{createdContents.length > 0 && (
								<Alert
									severity="success"
									action={<Button color="inherit" size="small" onClick={() => router.push('/admin/community-automation/review-queue')}>검수 큐</Button>}
								>
									{createdContents.length}개 생성됨
								</Alert>
							)}
						</Stack>
					)}
				</Box>
			</Drawer>
		</Box>
	);
}
