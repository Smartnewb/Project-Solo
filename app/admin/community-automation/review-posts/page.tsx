'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	Alert,
	Box,
	Button,
	Checkbox,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	InputLabel,
	ListItemText,
	MenuItem,
	Paper,
	Select,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import type {
	CommunityReviewPostJob,
	ReviewPostJobStatus,
	ReviewSourceStat,
	ReviewSourceType,
} from '@/app/services/admin/community-automation';
import { reviewSources as reviewSourcesApi } from '@/app/services/admin/community-automation';

const SOURCE_TYPE_OPTIONS: Array<{ value: ReviewSourceType; label: string }> = [
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
	if (!value) return '-';
	return new Date(value).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' });
}

function dateTimeLocalInput(offsetMinutes = 0) {
	const date = new Date(Date.now() + offsetMinutes * 60_000);
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
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '리뷰 자동작성 데이터를 불러오지 못했습니다.');
		} finally {
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
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : 'Qdrant 동기화 실패');
		} finally {
			setActionLoading(false);
		}
	}

	async function createReviewPost(options?: { publishNow?: boolean }) {
		if (!seedText.trim()) {
			setError('리뷰 글 방향을 입력해 주세요.');
			return;
		}
		const nextScheduledAt = options?.publishNow ? dateTimeLocalInput(0) : scheduledAt;
		if (!nextScheduledAt) {
			setError('발행 예약 시간을 선택해 주세요.');
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
			setSuccess(
				options?.publishNow
					? '리뷰 게시글을 지금 작성했습니다.'
					: `${formatDateTime(job.scheduledAt)} 발행 예약 리뷰를 생성했습니다.`,
			);
			await load();
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '리뷰 예약 생성 실패');
		} finally {
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
		if (!editingJob) return;
		if (!editTitle.trim() || !editContent.trim()) {
			setError('제목과 본문을 모두 입력해 주세요.');
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
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '리뷰 수정 실패');
		} finally {
			setActionLoading(false);
		}
	}

	return (
		<Box>
			<Stack spacing={2.5}>
				<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ md: 'center' }}>
					<Box>
						<Typography variant="h6" fontWeight={900} color="#191F28">
							리뷰 자동작성
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Qdrant에 동기화된 실제 리뷰를 RAG/few-shot으로 참고해 리뷰 게시글을 예약하거나 지금 작성합니다.
						</Typography>
					</Box>
					<Button variant="outlined" disabled={actionLoading} onClick={syncQdrant}>
						Qdrant 동기화
					</Button>
				</Stack>

				{error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
				{success && <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>}

				<Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems="stretch">
					<Paper variant="outlined" sx={{ p: 2, borderRadius: '16px', borderColor: '#E5E8EB', flex: 1.05 }}>
						<Stack spacing={1.5}>
							<Box>
								<Typography variant="subtitle1" fontWeight={900}>
									리뷰 글 예약 생성
								</Typography>
								<Typography variant="caption" color="text.secondary">
									시간 단위 예약이 가능하며, 지금 작성은 즉시 리뷰 게시글로 발행합니다.
								</Typography>
							</Box>
							<TextField
								label="리뷰 글 방향"
								placeholder="예: 수도권 대학생들이 공감할 만한 소개팅 후기, 부담 없이 읽히는 톤"
								value={seedText}
								onChange={(event) => setSeedText(event.target.value)}
								multiline
								minRows={4}
								fullWidth
							/>
							<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
								<FormControl fullWidth size="small">
									<InputLabel id="review-source-types-label">원본</InputLabel>
									<Select
										labelId="review-source-types-label"
										multiple
										label="원본"
										value={sourceTypes}
										onChange={(event) => setSourceTypes(event.target.value as ReviewSourceType[])}
										renderValue={(selected) => selected.map(sourceLabel).join(', ')}
									>
										{SOURCE_TYPE_OPTIONS.map((option) => (
											<MenuItem key={option.value} value={option.value}>
												<Checkbox checked={sourceTypes.includes(option.value)} />
												<ListItemText primary={option.label} />
											</MenuItem>
										))}
									</Select>
								</FormControl>
								<TextField
									label="최소 평점"
									type="number"
									size="small"
									value={minRating}
									onChange={(event) => setMinRating(Math.max(1, Math.min(5, Number(event.target.value) || 1)))}
									inputProps={{ min: 1, max: 5 }}
									sx={{ width: { xs: '100%', sm: 140 } }}
								/>
								<TextField
									label="발행 예약 시간"
									type="datetime-local"
									size="small"
									value={scheduledAt}
									onChange={(event) => setScheduledAt(event.target.value)}
									inputProps={{ min: minScheduleAt }}
									InputLabelProps={{ shrink: true }}
									sx={{ width: { xs: '100%', sm: 230 } }}
								/>
							</Stack>
							<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
								<Button
									variant="contained"
									disabled={actionLoading || !seedText.trim() || !scheduledAt}
									onClick={() => createReviewPost()}
									sx={{ fontWeight: 800, borderRadius: '10px' }}
								>
									예약 생성
								</Button>
								<Button
									variant="outlined"
									disabled={actionLoading || !seedText.trim()}
									onClick={() => createReviewPost({ publishNow: true })}
									sx={{ fontWeight: 800, borderRadius: '10px' }}
								>
									지금 작성
								</Button>
							</Stack>
						</Stack>
					</Paper>

					<Paper variant="outlined" sx={{ p: 2, borderRadius: '16px', borderColor: '#E5E8EB', flex: 0.95 }}>
						<Stack spacing={1.5}>
							<Box>
								<Typography variant="subtitle1" fontWeight={900}>
									리뷰 원본 상태
								</Typography>
								<Typography variant="caption" color="text.secondary">
									승인 및 임베딩된 원본만 RAG 검색에 안정적으로 사용됩니다.
								</Typography>
							</Box>
							<Stack spacing={1}>
								{SOURCE_TYPE_OPTIONS.map((option) => (
									<Box key={option.value} sx={{ p: 1.2, border: '1px solid #E5E8EB', borderRadius: '12px' }}>
										<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
											<Typography variant="body2" fontWeight={800}>{option.label}</Typography>
											<Stack direction="row" spacing={0.7} flexWrap="wrap" useFlexGap justifyContent="flex-end">
												<Chip size="small" label={`승인 ${statCount(stats, option.value, 'approved')}`} />
												<Chip size="small" color="success" variant="outlined" label={`임베딩 ${statCount(stats, option.value, 'approved', 'embedded')}`} />
												<Chip size="small" color="warning" variant="outlined" label={`대기 ${statCount(stats, option.value, 'approved', 'pending')}`} />
											</Stack>
										</Stack>
									</Box>
								))}
							</Stack>
						</Stack>
					</Paper>
				</Stack>

				<Paper variant="outlined" sx={{ p: 2, borderRadius: '16px', borderColor: '#E5E8EB' }}>
					<Stack spacing={1.5}>
						<Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ md: 'center' }}>
							<Box>
								<Typography variant="subtitle1" fontWeight={900}>
									리뷰 예약 작업
								</Typography>
								<Typography variant="caption" color="text.secondary">
									매분 서버 스케줄러가 예약일이 지난 작업을 리뷰 게시글로 발행합니다.
								</Typography>
							</Box>
							<Stack direction="row" spacing={1}>
								<FormControl size="small" sx={{ minWidth: 140 }}>
									<InputLabel id="review-job-status-label">상태</InputLabel>
									<Select
										labelId="review-job-status-label"
										label="상태"
										value={statusFilter}
										onChange={(event) => setStatusFilter(event.target.value as ReviewPostJobStatus | 'all')}
									>
										<MenuItem value="all">전체</MenuItem>
										<MenuItem value="scheduled">예약됨</MenuItem>
										<MenuItem value="published">발행됨</MenuItem>
										<MenuItem value="failed">실패</MenuItem>
										<MenuItem value="cancelled">취소됨</MenuItem>
									</Select>
								</FormControl>
								<Button variant="outlined" disabled={loading} onClick={load}>새로고침</Button>
							</Stack>
						</Stack>

						{loading ? (
							<Box display="flex" justifyContent="center" py={5}>
								<CircularProgress />
							</Box>
						) : jobs.length === 0 ? (
							<Box sx={{ p: 3, bgcolor: '#F8F9FA', border: '1px solid #E5E8EB', borderRadius: '12px', textAlign: 'center' }}>
								<Typography variant="body2" color="text.secondary">
									리뷰 예약 작업이 없습니다.
								</Typography>
							</Box>
						) : (
							<Stack spacing={1}>
								{jobs.map((job) => (
									<Box key={job.id} sx={{ p: 1.5, border: '1px solid #E5E8EB', borderRadius: '12px' }}>
										<Stack spacing={1}>
											<Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ md: 'flex-start' }}>
												<Box sx={{ minWidth: 0 }}>
													<Typography variant="subtitle2" fontWeight={900} sx={{ wordBreak: 'keep-all' }}>
														{job.title}
													</Typography>
													<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
														{job.content}
													</Typography>
												</Box>
												<Stack direction="row" spacing={0.7} alignItems="center">
													{job.status !== 'published' && (
														<Button size="small" variant="outlined" onClick={() => openEditDialog(job)}>
															수정
														</Button>
													)}
													<Chip size="small" color={JOB_STATUS_COLOR[job.status]} label={JOB_STATUS_LABEL[job.status]} sx={{ fontWeight: 800 }} />
												</Stack>
											</Stack>
											<Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
												<Chip size="small" variant="outlined" label={`예약 ${formatDateTime(job.scheduledAt)}`} />
												<Chip size="small" variant="outlined" label={`발행 ${formatDateTime(job.publishedAt)}`} />
												<Chip size="small" variant="outlined" label={`RAG ${job.sourceDocumentIds.length}건`} />
												{job.publishedArticleId && <Chip size="small" color="success" variant="outlined" label={`게시글 ${job.publishedArticleId}`} />}
												{job.errorMessage && <Chip size="small" color="error" label={job.errorMessage} />}
											</Stack>
										</Stack>
									</Box>
								))}
							</Stack>
						)}
					</Stack>
				</Paper>
			</Stack>
			<Dialog open={Boolean(editingJob)} onClose={closeEditDialog} maxWidth="md" fullWidth>
				<DialogTitle sx={{ fontWeight: 900 }}>리뷰 내용 수정</DialogTitle>
				<DialogContent sx={{ pt: '12px !important' }}>
					<Stack spacing={1.5}>
						<TextField
							label="제목"
							value={editTitle}
							onChange={(event) => setEditTitle(event.target.value)}
							inputProps={{ maxLength: 30 }}
							helperText={`${editTitle.length}/30`}
							fullWidth
						/>
						<TextField
							label="본문"
							value={editContent}
							onChange={(event) => setEditContent(event.target.value)}
							multiline
							minRows={8}
							fullWidth
						/>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={closeEditDialog} disabled={actionLoading}>취소</Button>
					<Button variant="contained" onClick={saveEdit} disabled={actionLoading || !editTitle.trim() || !editContent.trim()}>
						저장
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
