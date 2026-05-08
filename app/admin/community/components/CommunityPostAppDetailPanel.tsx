'use client';

import SendIcon from '@mui/icons-material/Send';
import {
	Alert,
	Avatar,
	Box,
	Button,
	Chip,
	CircularProgress,
	Divider,
	FormControl,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	Stack,
	Tab,
	Tabs,
	TextField,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import type {
	LiveCommentSuggestion,
	ScheduledCommentTimelineItem,
} from '@/app/services/admin/community-automation';
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

export function CommunityPostAppDetailPanel({
	post,
	comments,
	ghostCandidates = [],
	ghostCandidateCount,
	submitLabel = '지금 고스트 댓글 달기',
	onSubmitGhostComment,
	onSubmitGhostLike,
	onReload,
	scheduledComments = [],
	scheduledCommentsLoading = false,
	onReloadScheduledComments,
	onCancelScheduledComment,
	onRescheduleScheduledComment,
	onLoadLiveCommentSuggestions,
}: CommunityPostAppDetailPanelProps) {
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

	const sortedComments = useMemo(
		() =>
			[...localComments].sort((a, b) => {
				const left = a.createdAt ? new Date(a.createdAt).getTime() : 0;
				const right = b.createdAt ? new Date(b.createdAt).getTime() : 0;
				return left - right;
			}),
		[localComments],
	);

	const blinded = Boolean(post.isBlinded || post.blindedAt);
	const deleted = Boolean(post.isDeleted || post.deletedAt);
	const canSubmit = content.trim().length > 0 && (mode === 'auto' || selectedGhostId);
	const canSubmitSuggestion = mode === 'auto' || selectedGhostId;
	const timelineEnabled = Boolean(onReloadScheduledComments || onCancelScheduledComment || onRescheduleScheduledComment);
	const likeEnabled = Boolean(onSubmitGhostLike);

	async function submit(options?: { contentOverride?: string; delayMinutesOverride?: number }) {
		const nextContent = options?.contentOverride?.trim() ?? content.trim();
		const nextDelayMinutes = options?.delayMinutesOverride;
		if (!nextContent || (mode === 'manual' && !selectedGhostId)) return;
		setSubmitting(true);
		setError(null);
		setSuccess(null);
		try {
			const result = await onSubmitGhostComment(post.id, {
				content: nextContent,
				ghostAccountId: mode === 'manual' ? selectedGhostId : undefined,
				delayMinutes:
					nextDelayMinutes ?? (deliveryMode === 'delay' ? delayMinutes : undefined),
			});
			if (result.comment) {
				setLocalComments((prev) => [...prev, result.comment as CommentLike]);
			}
			setContent('');
			const ghostLabel = result.ghost.name ?? result.ghost.ghostUserId;
			if (result.scheduledComment) {
				setSuccess(
					`${ghostLabel} 계정으로 ${result.scheduledComment.delayMinutes}분 후 댓글 발송을 예약했습니다.`,
				);
				await onReloadScheduledComments?.();
				setOperationTab('timeline');
			} else {
				setSuccess(
					result.selectionMode === 'manual'
						? `${ghostLabel} 계정으로 댓글을 작성했습니다.`
						: `${ghostLabel} 계정이 자동 선택되었습니다.`,
				);
			}
			try {
				await onReload?.();
			} catch (reloadError) {
				setError(
					reloadError instanceof Error
						? `댓글은 작성됐지만 재조회에 실패했습니다. ${reloadError.message}`
						: '댓글은 작성됐지만 재조회에 실패했습니다.',
				);
			}
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '댓글 작성에 실패했습니다.');
		} finally {
			setSubmitting(false);
		}
	}

	async function loadLiveCommentSuggestions() {
		if (!onLoadLiveCommentSuggestions) return;
		setSuggestionsLoading(true);
		setError(null);
		setSuccess(null);
		try {
			const items = await onLoadLiveCommentSuggestions();
			setSuggestions(items);
			setSuccess('댓글 후보 3개를 추천했습니다.');
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '댓글 후보 추천에 실패했습니다.');
		} finally {
			setSuggestionsLoading(false);
		}
	}

	async function submitSuggestion(suggestion: LiveCommentSuggestion, delayMinutesOverride?: number) {
		const actionKey = `${suggestion.tone}:${delayMinutesOverride ?? 'now'}`;
		setSuggestionActionKey(actionKey);
		try {
			await submit({ contentOverride: suggestion.content, delayMinutesOverride });
		} finally {
			setSuggestionActionKey(null);
		}
	}

	async function submitLike() {
		if (!onSubmitGhostLike) return;
		if (mode === 'manual' && !selectedGhostId) return;
		if (likeAction === 'comment' && !targetCommentId) return;
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
				setSuccess(
					`${ghostLabel} 계정으로 ${result.scheduledLike.delayMinutes}분 후 ${
						result.scheduledLike.targetCommentId ? '댓글' : '게시글'
					} 좋아요 발송을 예약했습니다.`,
				);
				await onReloadScheduledComments?.();
				setOperationTab('timeline');
			} else if (result.like) {
				setSuccess(
					result.selectionMode === 'manual'
						? `${ghostLabel} 계정으로 좋아요를 발송했습니다.`
						: `${ghostLabel} 계정이 자동 선택되어 좋아요를 발송했습니다.`,
				);
				try {
					await onReload?.();
				} catch {
					// Show success even if reload fails
				}
			}
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '좋아요 발송에 실패했습니다.');
		} finally {
			setSubmitting(false);
		}
	}

	async function cancelScheduledComment(contentId: string) {
		if (!onCancelScheduledComment) return;
		setTimelineActionId(contentId);
		setError(null);
		setSuccess(null);
		try {
			await onCancelScheduledComment(contentId);
			setSuccess('예약 댓글을 취소했습니다.');
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '예약 댓글 취소에 실패했습니다.');
		} finally {
			setTimelineActionId(null);
		}
	}

	async function rescheduleScheduledComment(contentId: string) {
		if (!onRescheduleScheduledComment) return;
		const nextDelayMinutes = timelineDelayMinutesById[contentId] ?? 30;
		setTimelineActionId(contentId);
		setError(null);
		setSuccess(null);
		try {
			await onRescheduleScheduledComment(contentId, nextDelayMinutes);
			setSuccess(`${nextDelayMinutes}분 후 발송으로 변경했습니다.`);
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '예약 댓글 시간 변경에 실패했습니다.');
		} finally {
			setTimelineActionId(null);
		}
	}

	return (
		<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '360px 1fr' }, gap: 3 }}>
			<Paper
				variant="outlined"
				sx={{
					borderRadius: 4,
					overflow: 'hidden',
					bgcolor: '#FFFFFF',
					borderColor: '#E5E8EB',
					boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
					maxWidth: 390,
					mx: { xs: 'auto', md: 0 },
					width: '100%',
				}}
			>
				<Box sx={{ bgcolor: '#FFFFFF', color: '#191F28', px: 2, py: 1.4, borderBottom: '1px solid #E7E9EC' }}>
					<Typography variant="subtitle2" fontWeight={800}>커뮤니티</Typography>
				</Box>
				<Box sx={{ p: 2, background: 'linear-gradient(to bottom, #FFFFFF, #F5F1FF)' }}>
					<Stack direction="row" spacing={1.2} alignItems="center">
						<Avatar sx={{ width: 36, height: 36, bgcolor: '#f7f7f7', color: '#ff385c', fontWeight: 700 }}>
							{(post.authorName ?? post.nickname ?? '익').slice(0, 1)}
						</Avatar>
						<Box sx={{ minWidth: 0, flex: 1 }}>
							<Typography variant="body2" fontWeight={700} color="#191F28" noWrap>
								{post.nickname ?? post.authorName ?? '익명'}
							</Typography>
							<Typography variant="caption" color="text.secondary" noWrap>
								{post.categoryName ?? post.categoryId ?? '커뮤니티'} · {post.createdAt ? safeToLocaleString(post.createdAt) : '-'}
							</Typography>
						</Box>
					</Stack>
					<Typography variant="h6" fontWeight={800} sx={{ mt: 2, lineHeight: 1.35, color: '#191F28' }}>
						{post.title ?? '제목 없음'}
					</Typography>
					<Typography variant="body2" sx={{ mt: 1.2, whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#4E5968' }}>
						{post.content}
					</Typography>
					<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
						<Chip size="small" label={`좋아요 ${formatCount(post.likeCount)}`} variant="outlined" sx={{ borderRadius: '9999px', bgcolor: '#FFFFFF', borderColor: '#E4E2E2' }} />
						<Chip size="small" label={`댓글 ${formatCount(post.commentCount ?? sortedComments.length)}`} variant="outlined" sx={{ borderRadius: '9999px', bgcolor: '#FFFFFF', borderColor: '#E4E2E2' }} />
						<Chip size="small" label={`조회 ${formatCount(post.readCount)}`} variant="outlined" sx={{ borderRadius: '9999px', bgcolor: '#FFFFFF', borderColor: '#E4E2E2' }} />
						<Chip size="small" label={`신고 ${formatCount(post.reportCount)}`} color={post.reportCount ? 'error' : 'default'} variant="outlined" sx={{ borderRadius: '9999px', bgcolor: '#FFFFFF' }} />
					</Stack>
					{(blinded || deleted) && (
						<Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
							{blinded && <Chip size="small" color="warning" label="블라인드" />}
							{deleted && <Chip size="small" color="error" label="삭제됨" />}
						</Stack>
					)}
				</Box>
				<Divider />
				<Box sx={{ p: 2, maxHeight: 420, overflow: 'auto', bgcolor: '#FFFFFF' }}>
					<Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5, color: '#191F28' }}>
						댓글 {sortedComments.length}
					</Typography>
					<Stack spacing={1.2}>
						{sortedComments.length === 0 ? (
							<Typography variant="body2" color="text.secondary">댓글 없음</Typography>
						) : (
							sortedComments.map((comment) => {
								const isReply = Boolean(comment.parentId);
								const isBlinded = Boolean(comment.isBlinded || comment.blindedAt);
								return (
									<Box key={comment.id} sx={{ ml: isReply ? 3 : 0 }}>
										<Stack direction="row" spacing={1} alignItems="flex-start">
											<Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: '#f7f7f7', color: '#ff385c', fontWeight: 700 }}>
												{getCommentAuthor(comment).slice(0, 1)}
											</Avatar>
											<Box sx={{ minWidth: 0, flex: 1 }}>
												<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
													<Typography variant="caption" fontWeight={700}>
														{getCommentAuthor(comment)}
													</Typography>
													{isReply && <Chip size="small" label="대댓글" sx={{ height: 18, fontSize: 10 }} />}
													{isBlinded && <Chip size="small" color="warning" label="블라인드" sx={{ height: 18, fontSize: 10 }} />}
												</Stack>
												<Typography
													variant="body2"
													sx={{
														whiteSpace: 'pre-wrap',
														color: isBlinded ? 'text.disabled' : 'text.primary',
														textDecoration: isBlinded ? 'line-through' : 'none',
													}}
												>
													{comment.content}
												</Typography>
												<Typography variant="caption" color="text.secondary">
													{comment.createdAt ? safeToLocaleString(comment.createdAt) : '-'}
												</Typography>
											</Box>
										</Stack>
									</Box>
								);
							})
						)}
					</Stack>
				</Box>
			</Paper>

			<Stack spacing={2}>
				<Paper variant="outlined" sx={{ p: 2, borderRadius: '16px', borderColor: '#E5E8EB', bgcolor: '#FFFFFF' }}>
					{timelineEnabled && (
						<Tabs
							value={operationTab}
							onChange={(_, value) => setOperationTab(value)}
							sx={{ minHeight: 40, mb: 2, borderBottom: '1px solid #E7E9EC' }}
						>
							<Tab value="compose" label="댓글 작성" sx={{ minHeight: 40, fontWeight: 700 }} />
							<Tab value="like" label="좋아요" sx={{ minHeight: 40, fontWeight: 700 }} />
							<Tab value="timeline" label="예약 타임라인" sx={{ minHeight: 40, fontWeight: 700 }} />
						</Tabs>
					)}

					{operationTab === 'compose' && (
						<>
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between">
						<Box>
							<Typography variant="subtitle1" fontWeight={800} color="#191F28">고스트 실시간 댓글</Typography>
							<Typography variant="caption" color="text.secondary">
								ACTIVE 후보 {ghostCandidateCount ?? ghostCandidates.length}명
							</Typography>
						</Box>
						<ToggleButtonGroup
							size="small"
							exclusive
							value={mode}
							onChange={(_, value) => value && setMode(value)}
							sx={{
								'& .MuiToggleButton-root.Mui-selected': {
									bgcolor: '#f7f7f7',
									color: '#ff385c',
									fontWeight: 700,
								},
							}}
						>
							<ToggleButton value="auto">자동 선택</ToggleButton>
							<ToggleButton value="manual">직접 선택</ToggleButton>
						</ToggleButtonGroup>
					</Stack>

					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
						<ToggleButtonGroup
							size="small"
							exclusive
							value={deliveryMode}
							onChange={(_, value) => value && setDeliveryMode(value)}
							sx={{
								'& .MuiToggleButton-root.Mui-selected': {
									bgcolor: '#f7f7f7',
									color: '#ff385c',
									fontWeight: 700,
								},
							}}
						>
							<ToggleButton value="now">즉시 발송</ToggleButton>
							<ToggleButton value="delay">지연 발송</ToggleButton>
						</ToggleButtonGroup>
						{deliveryMode === 'delay' && (
							<FormControl size="small" sx={{ minWidth: 150 }}>
								<InputLabel>발송 지연</InputLabel>
								<Select
									label="발송 지연"
									value={delayMinutes}
									onChange={(event) => setDelayMinutes(Number(event.target.value))}
								>
									{Array.from({ length: 36 }, (_, index) => (index + 1) * 5).map((minutes) => (
										<MenuItem key={minutes} value={minutes}>
											{minutes}분 후
										</MenuItem>
									))}
								</Select>
							</FormControl>
						)}
					</Stack>

					{mode === 'manual' && (
						<FormControl fullWidth size="small" sx={{ mt: 2 }}>
							<InputLabel>고스트 계정</InputLabel>
							<Select
								label="고스트 계정"
								value={selectedGhostId}
								onChange={(event) => setSelectedGhostId(event.target.value)}
							>
								{ghostCandidates.map((candidate) => {
									const ghostAccountId = getGhostAccountId(candidate);
									return (
										<MenuItem key={ghostAccountId} value={ghostAccountId}>
											{candidate.name ?? candidate.ghostUserId}
											{candidate.regionCluster ? ` · ${candidate.regionCluster}` : ''}
											{candidate.hasArticleComment ? ' · 이미 댓글 있음' : ''}
										</MenuItem>
									);
								})}
							</Select>
						</FormControl>
					)}

					{onLoadLiveCommentSuggestions && (
						<Box sx={{ mt: 2 }}>
							<Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
								<Typography variant="subtitle2" fontWeight={800} color="#191F28">
									댓글 후보
								</Typography>
								<Button
									size="small"
									variant="outlined"
									disabled={suggestionsLoading}
									onClick={loadLiveCommentSuggestions}
								>
									{suggestionsLoading ? <CircularProgress size={14} /> : '댓글 후보 3개 추천'}
								</Button>
							</Stack>
							{suggestions.length > 0 && (
								<Stack spacing={1} sx={{ mt: 1 }}>
									{suggestions.map((suggestion) => {
										const nowKey = `${suggestion.tone}:now`;
										const delay15Key = `${suggestion.tone}:15`;
										const delay30Key = `${suggestion.tone}:30`;
										return (
											<Paper
												key={suggestion.tone}
												variant="outlined"
												sx={{ p: 1.3, borderColor: '#E5E8EB', bgcolor: '#FBFCFD' }}
											>
												<Stack spacing={1}>
													<Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
														<Chip
															size="small"
															label={LIVE_COMMENT_TONE_LABEL[suggestion.tone]}
															sx={{ height: 22, fontWeight: 700, bgcolor: '#f7f7f7', color: '#ff385c' }}
														/>
														<Typography variant="caption" color="text.secondary">
															{suggestion.reason}
														</Typography>
													</Stack>
													<Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
														{suggestion.content}
													</Typography>
													<Stack direction="row" spacing={0.7} flexWrap="wrap" useFlexGap>
														<Button
															size="small"
															variant="contained"
															disabled={!canSubmitSuggestion || Boolean(suggestionActionKey)}
															onClick={() => submitSuggestion(suggestion)}
															sx={{ boxShadow: 'none' }}
														>
															{suggestionActionKey === nowKey ? <CircularProgress size={14} color="inherit" /> : '즉시 발송'}
														</Button>
														<Button
															size="small"
															variant="outlined"
															disabled={!canSubmitSuggestion || Boolean(suggestionActionKey)}
															onClick={() => submitSuggestion(suggestion, 15)}
														>
															{suggestionActionKey === delay15Key ? <CircularProgress size={14} /> : '15분 후'}
														</Button>
														<Button
															size="small"
															variant="outlined"
															disabled={!canSubmitSuggestion || Boolean(suggestionActionKey)}
															onClick={() => submitSuggestion(suggestion, 30)}
														>
															{suggestionActionKey === delay30Key ? <CircularProgress size={14} /> : '30분 후'}
														</Button>
														<Button
															size="small"
															color="inherit"
															onClick={() => {
																setContent(suggestion.content);
																setDeliveryMode('now');
															}}
														>
															직접 수정
														</Button>
													</Stack>
												</Stack>
											</Paper>
										);
									})}
								</Stack>
							)}
						</Box>
					)}
					<TextField
						fullWidth
						multiline
						minRows={4}
						label="댓글 내용"
						value={content}
						onChange={(event) => setContent(event.target.value)}
						sx={{ mt: 2 }}
					/>
					<Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
						<Button
							variant="contained"
							startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
							disabled={!canSubmit || submitting}
							onClick={() => submit()}
							sx={{
								borderRadius: '9999px',
								bgcolor: '#ff385c',
								boxShadow: 'none',
								fontWeight: 700,
								'&:hover': { bgcolor: '#e00b41', boxShadow: 'none' },
							}}
						>
							{deliveryMode === 'delay' ? `${delayMinutes}분 후 발송 예약` : submitLabel}
						</Button>
						<Typography variant="caption" color="text.secondary">
							{deliveryMode === 'delay' ? '예약 시점에 선택된 고스트로 발송' : '최상위 댓글만 작성'}
						</Typography>
					</Stack>
						</>
					)}
					{operationTab === 'like' && likeEnabled && (
						<>
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between">
						<Box>
							<Typography variant="subtitle1" fontWeight={800} color="#191F28">고스트 좋아요</Typography>
							<Typography variant="caption" color="text.secondary">
								ACTIVE 후보 {ghostCandidateCount ?? ghostCandidates.length}명
							</Typography>
						</Box>
						<ToggleButtonGroup
							size="small"
							exclusive
							value={mode}
							onChange={(_, value) => value && setMode(value)}
							sx={{
								'& .MuiToggleButton-root.Mui-selected': {
									bgcolor: '#f7f7f7',
									color: '#ff385c',
									fontWeight: 700,
								},
							}}
						>
							<ToggleButton value="auto">자동 선택</ToggleButton>
							<ToggleButton value="manual">직접 선택</ToggleButton>
						</ToggleButtonGroup>
					</Stack>

					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
						<ToggleButtonGroup
							size="small"
							exclusive
							value={likeAction}
							onChange={(_, value) => value && setLikeAction(value)}
							sx={{
								'& .MuiToggleButton-root.Mui-selected': {
									bgcolor: '#f7f7f7',
									color: '#ff385c',
									fontWeight: 700,
								},
							}}
						>
							<ToggleButton value="article">게시글 좋아요</ToggleButton>
							<ToggleButton value="comment">댓글 좋아요</ToggleButton>
						</ToggleButtonGroup>
						<ToggleButtonGroup
							size="small"
							exclusive
							value={deliveryMode}
							onChange={(_, value) => value && setDeliveryMode(value)}
							sx={{
								'& .MuiToggleButton-root.Mui-selected': {
									bgcolor: '#f7f7f7',
									color: '#ff385c',
									fontWeight: 700,
								},
							}}
						>
							<ToggleButton value="now">즉시 발송</ToggleButton>
							<ToggleButton value="delay">지연 발송</ToggleButton>
						</ToggleButtonGroup>
						{deliveryMode === 'delay' && (
							<FormControl size="small" sx={{ minWidth: 150 }}>
								<InputLabel>발송 지연</InputLabel>
								<Select
									label="발송 지연"
									value={delayMinutes}
									onChange={(event) => setDelayMinutes(Number(event.target.value))}
								>
									{Array.from({ length: 36 }, (_, index) => (index + 1) * 5).map((minutes) => (
										<MenuItem key={minutes} value={minutes}>
											{minutes}분 후
										</MenuItem>
									))}
								</Select>
							</FormControl>
						)}
					</Stack>

					{mode === 'manual' && (
						<FormControl fullWidth size="small" sx={{ mt: 2 }}>
							<InputLabel>고스트 계정</InputLabel>
							<Select
								label="고스트 계정"
								value={selectedGhostId}
								onChange={(event) => setSelectedGhostId(event.target.value)}
							>
								{ghostCandidates.map((candidate) => {
									const ghostAccountId = getGhostAccountId(candidate);
									return (
										<MenuItem key={ghostAccountId} value={ghostAccountId}>
											{candidate.name ?? candidate.ghostUserId}
											{candidate.regionCluster ? ` · ${candidate.regionCluster}` : ''}
										</MenuItem>
									);
								})}
							</Select>
						</FormControl>
					)}

					{likeAction === 'comment' && (
						<FormControl fullWidth size="small" sx={{ mt: 2 }}>
							<InputLabel>대상 댓글</InputLabel>
							<Select
								label="대상 댓글"
								value={targetCommentId}
								onChange={(event) => setTargetCommentId(event.target.value)}
							>
								{sortedComments
									.filter((c) => !c.isBlinded && !c.isDeleted)
									.map((comment) => (
										<MenuItem key={comment.id} value={comment.id}>
											{getCommentAuthor(comment)}: {comment.content.slice(0, 40)}
											{comment.content.length > 40 ? '...' : ''}
										</MenuItem>
									))}
							</Select>
						</FormControl>
					)}

					<Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
						<Button
							variant="contained"
							startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
							disabled={submitting || (mode === 'manual' && !selectedGhostId) || (likeAction === 'comment' && !targetCommentId)}
							onClick={submitLike}
							sx={{
								borderRadius: '9999px',
								bgcolor: '#E91E63',
								boxShadow: 'none',
								fontWeight: 700,
								'&:hover': { bgcolor: '#C2185B', boxShadow: 'none' },
							}}
						>
							{deliveryMode === 'delay'
								? `${delayMinutes}분 후 좋아요 예약`
								: likeAction === 'article'
									? '게시글 좋아요 발송'
									: '댓글 좋아요 발송'}
						</Button>
						<Typography variant="caption" color="text.secondary">
							{deliveryMode === 'delay' ? '예약 시점에 선택된 고스트로 발송' : '즉시 좋아요 발송'}
						</Typography>
					</Stack>
						</>
					)}
					{operationTab === 'timeline' && timelineEnabled && (
						<Stack spacing={1.3}>
							<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
								<Box>
									<Typography variant="subtitle1" fontWeight={800} color="#191F28">
										예약 타임라인
									</Typography>
									<Typography variant="caption" color="text.secondary">
										DB 상태 기준으로 예약/발화/취소 작업을 표시합니다.
									</Typography>
								</Box>
								<Button
									size="small"
									variant="outlined"
									disabled={scheduledCommentsLoading}
									onClick={() => onReloadScheduledComments?.()}
								>
									새로고침
								</Button>
							</Stack>
							{scheduledCommentsLoading ? (
								<Box display="flex" justifyContent="center" py={4}>
									<CircularProgress size={24} />
								</Box>
							) : scheduledComments.length === 0 ? (
								<Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderColor: '#E5E8EB', bgcolor: '#F8F9FA' }}>
									<Typography variant="body2" color="text.secondary">
										예약된 작업이 없습니다.
									</Typography>
								</Paper>
							) : (
								scheduledComments.map((item) => {
									const isScheduled = item.status === 'scheduled';
									const isLike = item.targetType === 'ARTICLE_LIKE' || item.targetType === 'COMMENT_LIKE';
									const targetTypeLabel = item.targetType ? SCHEDULED_TARGET_TYPE_LABEL[item.targetType] ?? item.targetType : '작업';
									const itemDelayMinutes = timelineDelayMinutesById[item.contentId] ?? 30;
									const actionLoading = timelineActionId === item.contentId;
									const likeIcon = item.targetType === 'ARTICLE_LIKE' ? '❤️' : item.targetType === 'COMMENT_LIKE' ? '💬❤️' : null;
									return (
										<Paper key={item.contentId} variant="outlined" sx={{ p: 1.5, borderColor: '#E5E8EB', bgcolor: '#FFFFFF' }}>
											<Stack spacing={1}>
												<Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
													<Box sx={{ minWidth: 0 }}>
														<Chip
															size="small"
															label={targetTypeLabel}
															variant="outlined"
															sx={{ height: 22, mb: 0.7, fontWeight: 700 }}
														/>
														<Typography variant="body2" fontWeight={700} sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
															{likeIcon ? `${likeIcon} ` : ''}{item.content || (isLike ? '좋아요' : '')}
														</Typography>
														<Typography variant="caption" color="text.secondary" noWrap display="block">
															{item.ghostName ?? item.ghostUserId ?? item.ghostAccountId ?? 'ghost 미지정'}
														</Typography>
													</Box>
													<Chip size="small" label={SCHEDULED_COMMENT_STATUS_LABEL[item.status]} color={item.status === 'published' ? 'success' : item.status === 'quality_failed' ? 'error' : 'default'} />
												</Stack>
												<Stack direction="row" spacing={0.7} flexWrap="wrap" useFlexGap>
													<Typography variant="caption" color="text.secondary">
														예약 {item.scheduledAt ? safeToLocaleString(item.scheduledAt) : '-'}
													</Typography>
													<Typography variant="caption" color="text.secondary">
														발화 {item.publishedAt ? safeToLocaleString(item.publishedAt) : '-'}
													</Typography>
													{item.rejectionReason && (
														<Typography variant="caption" color="error">
															{item.rejectionReason}
														</Typography>
													)}
												</Stack>
												{item.healthFlags.length > 0 && (
													<Stack direction="row" spacing={0.7} flexWrap="wrap" useFlexGap>
														{item.healthFlags.map((flag) => (
															<Chip
																key={flag}
																size="small"
																color={flag === 'delayed' || flag === 'revalidation_failed' ? 'error' : 'warning'}
																label={SCHEDULED_COMMENT_HEALTH_LABEL[flag]}
																sx={{ height: 22 }}
															/>
														))}
													</Stack>
												)}
												{isScheduled && (
													<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
														<Button
															size="small"
															color="error"
															variant="outlined"
															disabled={actionLoading}
															onClick={() => cancelScheduledComment(item.contentId)}
														>
															취소
														</Button>
														<FormControl size="small" sx={{ minWidth: 130 }}>
															<InputLabel>변경 시간</InputLabel>
															<Select
																label="변경 시간"
																value={itemDelayMinutes}
																onChange={(event) =>
																	setTimelineDelayMinutesById((prev) => ({
																		...prev,
																		[item.contentId]: Number(event.target.value),
																	}))
																}
															>
																{Array.from({ length: 36 }, (_, index) => (index + 1) * 5).map((minutes) => (
																	<MenuItem key={minutes} value={minutes}>
																		{minutes}분 후
																	</MenuItem>
																))}
															</Select>
														</FormControl>
														<Button
															size="small"
															variant="contained"
															disabled={actionLoading}
															onClick={() => rescheduleScheduledComment(item.contentId)}
															sx={{ boxShadow: 'none' }}
														>
															시간 변경
														</Button>
													</Stack>
												)}
											</Stack>
										</Paper>
									);
								})
							)}
						</Stack>
					)}
					{error && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>{error}</Alert>}
					{success && <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
				</Paper>
			</Stack>
		</Box>
	);
}
