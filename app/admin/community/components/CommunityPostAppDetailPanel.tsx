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
	TextField,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import type { GhostCommentBody, GhostCommentResult } from '@/app/services/community';
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
	onReload?: () => Promise<void>;
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

export function CommunityPostAppDetailPanel({
	post,
	comments,
	ghostCandidates = [],
	ghostCandidateCount,
	submitLabel = '지금 고스트 댓글 달기',
	onSubmitGhostComment,
	onReload,
}: CommunityPostAppDetailPanelProps) {
	const [localComments, setLocalComments] = useState<CommentLike[]>(comments);
	const [mode, setMode] = useState<'auto' | 'manual'>('auto');
	const [selectedGhostId, setSelectedGhostId] = useState('');
	const [content, setContent] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

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

	async function submit() {
		if (!canSubmit) return;
		setSubmitting(true);
		setError(null);
		setSuccess(null);
		try {
			const result = await onSubmitGhostComment(post.id, {
				content: content.trim(),
				ghostAccountId: mode === 'manual' ? selectedGhostId : undefined,
			});
			setLocalComments((prev) => [...prev, result.comment]);
			setContent('');
			setSuccess(
				result.selectionMode === 'manual'
					? `${result.ghost.name ?? result.ghost.ghostUserId} 계정으로 댓글을 작성했습니다.`
					: `${result.ghost.name ?? result.ghost.ghostUserId} 계정이 자동 선택되었습니다.`,
			);
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

	return (
		<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '360px 1fr' }, gap: 3 }}>
			<Paper
				variant="outlined"
				sx={{
					borderRadius: 4,
					overflow: 'hidden',
					bgcolor: '#f8fafc',
					maxWidth: 390,
					mx: { xs: 'auto', md: 0 },
					width: '100%',
				}}
			>
				<Box sx={{ bgcolor: '#111827', color: 'white', px: 2, py: 1.2 }}>
					<Typography variant="subtitle2" fontWeight={700}>커뮤니티</Typography>
				</Box>
				<Box sx={{ p: 2, bgcolor: 'white' }}>
					<Stack direction="row" spacing={1.2} alignItems="center">
						<Avatar sx={{ width: 36, height: 36 }}>
							{(post.authorName ?? post.nickname ?? '익').slice(0, 1)}
						</Avatar>
						<Box sx={{ minWidth: 0, flex: 1 }}>
							<Typography variant="body2" fontWeight={700} noWrap>
								{post.nickname ?? post.authorName ?? '익명'}
							</Typography>
							<Typography variant="caption" color="text.secondary" noWrap>
								{post.categoryName ?? post.categoryId ?? '커뮤니티'} · {post.createdAt ? safeToLocaleString(post.createdAt) : '-'}
							</Typography>
						</Box>
					</Stack>
					<Typography variant="h6" fontWeight={800} sx={{ mt: 2, lineHeight: 1.35 }}>
						{post.title ?? '제목 없음'}
					</Typography>
					<Typography variant="body2" sx={{ mt: 1.2, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
						{post.content}
					</Typography>
					<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
						<Chip size="small" label={`좋아요 ${formatCount(post.likeCount)}`} />
						<Chip size="small" label={`댓글 ${formatCount(post.commentCount ?? sortedComments.length)}`} />
						<Chip size="small" label={`조회 ${formatCount(post.readCount)}`} />
						<Chip size="small" label={`신고 ${formatCount(post.reportCount)}`} color={post.reportCount ? 'error' : 'default'} />
					</Stack>
					{(blinded || deleted) && (
						<Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
							{blinded && <Chip size="small" color="warning" label="블라인드" />}
							{deleted && <Chip size="small" color="error" label="삭제됨" />}
						</Stack>
					)}
				</Box>
				<Divider />
				<Box sx={{ p: 2, maxHeight: 420, overflow: 'auto' }}>
					<Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>
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
											<Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
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
				<Paper variant="outlined" sx={{ p: 2 }}>
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between">
						<Box>
							<Typography variant="subtitle1" fontWeight={800}>고스트 실시간 댓글</Typography>
							<Typography variant="caption" color="text.secondary">
								ACTIVE 후보 {ghostCandidateCount ?? ghostCandidates.length}명
							</Typography>
						</Box>
						<ToggleButtonGroup
							size="small"
							exclusive
							value={mode}
							onChange={(_, value) => value && setMode(value)}
						>
							<ToggleButton value="auto">자동 선택</ToggleButton>
							<ToggleButton value="manual">직접 선택</ToggleButton>
						</ToggleButtonGroup>
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
							onClick={submit}
						>
							{submitLabel}
						</Button>
						<Typography variant="caption" color="text.secondary">
							최상위 댓글만 작성
						</Typography>
					</Stack>
					{error && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>{error}</Alert>}
					{success && <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
				</Paper>
			</Stack>
		</Box>
	);
}
