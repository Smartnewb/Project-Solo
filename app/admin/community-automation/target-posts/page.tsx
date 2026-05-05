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
							{categories.map((category) => (
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
					) : items.map((item) => {
						const status = item.automationStatus ?? 'none';
						return (
							<Paper
								key={item.id}
								variant="outlined"
								sx={{
									p: { xs: 2, md: '15px 17px' },
									borderRadius: '16px',
									borderColor: '#E5E8EB',
									bgcolor: '#FFFFFF',
									boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
								}}
							>
								<Stack spacing={1.5}>
									<Stack
										direction={{ xs: 'column', sm: 'row' }}
										spacing={1.5}
										justifyContent="space-between"
										alignItems={{ xs: 'stretch', sm: 'flex-start' }}
									>
										<Stack direction="row" spacing={1.2} sx={{ minWidth: 0, flex: 1 }}>
											<Avatar
												sx={{
													width: 42,
													height: 42,
													bgcolor: '#F2EDFF',
													color: '#7A4AE2',
													fontWeight: 700,
													fontSize: 14,
												}}
											>
												{(item.authorName ?? item.authorId ?? '익').slice(0, 1)}
											</Avatar>
											<Box sx={{ minWidth: 0, flex: 1 }}>
												<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
													<Chip
														size="small"
														label={categories.find((category) => category.id === item.categoryId)?.label ?? item.categoryName ?? '커뮤니티'}
														sx={{
															height: 24,
															borderRadius: '9999px',
															bgcolor: '#F7F3FF',
															color: '#7A4AE2',
															fontWeight: 700,
															border: '1px solid #E2D5FF',
														}}
													/>
													<Chip label={STATUS_LABEL[status]} color={STATUS_COLOR[status]} size="small" sx={{ height: 24 }} />
													<Typography variant="caption" color="text.secondary">
														{formatDate(item.createdAt)}
													</Typography>
												</Stack>
												<Typography
													variant="h6"
													fontWeight={800}
													sx={{
														mt: 0.8,
														lineHeight: 1.35,
														fontSize: 18,
														color: '#191F28',
														wordBreak: 'break-word',
													}}
												>
													{item.title || '제목 없음'}
												</Typography>
												<Typography
													variant="body2"
													sx={{
														mt: 0.6,
														color: '#4E5968',
														lineHeight: 1.6,
														display: '-webkit-box',
														WebkitLineClamp: 2,
														WebkitBoxOrient: 'vertical',
														overflow: 'hidden',
													}}
												>
													{preview(item.content, 150)}
												</Typography>
											</Box>
										</Stack>
										<Button
											variant="contained"
											onClick={() => openDetail(item.id)}
											sx={{
												minHeight: 40,
												borderRadius: '9999px',
												bgcolor: '#7A4AE2',
												boxShadow: 'none',
												fontWeight: 700,
												px: 2.5,
												'&:hover': { bgcolor: '#6B3FD4', boxShadow: 'none' },
											}}
										>
											작업
										</Button>
									</Stack>

									<Box sx={{ height: 1, bgcolor: '#E7E9EC' }} />

									<Stack
										direction={{ xs: 'column', md: 'row' }}
										spacing={1.2}
										justifyContent="space-between"
										alignItems={{ md: 'center' }}
									>
										<Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
											<Chip
												icon={<ChatBubbleOutlineIcon />}
												label={`댓글 ${formatCount(item.commentCount)}`}
												size="small"
												variant="outlined"
												sx={{ borderRadius: '9999px', borderColor: '#E4E2E2' }}
											/>
											<Chip
												icon={<FavoriteBorderIcon />}
												label={`좋아요 ${formatCount(item.likeCount)}`}
												size="small"
												variant="outlined"
												sx={{ borderRadius: '9999px', borderColor: '#E4E2E2' }}
											/>
											<Chip
												icon={<VisibilityOutlinedIcon />}
												label={`조회 ${formatCount(item.readCount)}`}
												size="small"
												variant="outlined"
												sx={{ borderRadius: '9999px', borderColor: '#E4E2E2' }}
											/>
											<Chip
												icon={<FlagOutlinedIcon />}
												label={`신고 ${formatCount(item.reportCount)}`}
												size="small"
												color={item.reportCount > 0 ? 'error' : 'default'}
												variant="outlined"
												sx={{ borderRadius: '9999px', borderColor: item.reportCount > 0 ? undefined : '#E4E2E2' }}
											/>
										</Stack>
										<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
											<Typography variant="caption" color="text.secondary">
												작성자 {item.authorRegionCluster ?? 'cluster 없음'}
											</Typography>
											<Typography variant="caption" color="text.secondary">
												{item.authorRegion ?? '지역 없음'}
											</Typography>
											<Chip
												size="small"
												label={`자동화 누적 ${formatCount(item.automationCount)}`}
												sx={{
													height: 24,
													borderRadius: '9999px',
													bgcolor: '#F8F9FA',
													color: '#4E5968',
													border: '1px solid #E5E8EB',
												}}
											/>
										</Stack>
									</Stack>
								</Stack>
							</Paper>
						);
					})}
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
