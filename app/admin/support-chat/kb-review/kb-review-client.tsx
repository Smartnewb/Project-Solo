'use client';

import { useState, useCallback, useEffect } from 'react';
import {
	Box,
	Stack,
	Typography,
	TextField,
	Button,
	Chip,
	Paper,
	Divider,
	CircularProgress,
	Alert,
} from '@mui/material';

type KbCategory = 'new' | 'update' | 'covered';
type KbStatus = 'pending' | 'approved' | 'rejected';

interface KbCandidate {
	id: string;
	clusterLabel: string;
	representativeQ: string;
	frequency: number;
	category: KbCategory;
	matchedKbRef: string | null;
	kbAnswer: string | null;
	operatorAnswer: string | null;
	proposedQa: { question: string; answer: string } | null;
	language: string;
	domain: string;
	status: KbStatus;
}

function CategoryChip({ category }: { category: KbCategory }) {
	if (category === 'new') {
		return <Chip size="small" color="success" label="신규" />;
	}
	if (category === 'update') {
		return <Chip size="small" color="warning" label="갱신" />;
	}
	return <Chip size="small" color="default" label="커버됨" />;
}

interface CandidateCardProps {
	candidate: KbCandidate;
	onRefresh: () => void;
}

function CandidateCard({ candidate, onRefresh }: CandidateCardProps) {
	const {
		id,
		clusterLabel,
		representativeQ,
		frequency,
		category,
		kbAnswer,
		operatorAnswer,
		proposedQa,
		language,
		domain,
	} = candidate;

	const initialQ = proposedQa?.question ?? representativeQ;
	const initialA = proposedQa?.answer ?? operatorAnswer ?? '';

	const [editedQuestion, setEditedQuestion] = useState(initialQ);
	const [editedAnswer, setEditedAnswer] = useState(initialA);
	const [acting, setActing] = useState<'approve' | 'approve-edit' | 'reject' | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);

	const postAction = useCallback(
		async (type: 'approve' | 'approve-edit' | 'reject') => {
			setActing(type);
			setActionError(null);
			try {
				const isReject = type === 'reject';
				const url = isReject
					? `/api/admin/kb-candidates/${id}/reject`
					: `/api/admin/kb-candidates/${id}/approve`;

				const body =
					type === 'approve-edit'
						? JSON.stringify({ editedQuestion, editedAnswer })
						: undefined;

				const res = await fetch(url, {
					method: 'POST',
					headers: body ? { 'Content-Type': 'application/json' } : undefined,
					body,
				});

				if (!res.ok) {
					const data = await res.json().catch(() => ({}));
					setActionError(data?.error ?? `요청 실패 (HTTP ${res.status})`);
					return;
				}

				onRefresh();
			} catch (e) {
				setActionError(e instanceof Error ? e.message : '네트워크 오류');
			} finally {
				setActing(null);
			}
		},
		[id, editedQuestion, editedAnswer, onRefresh],
	);

	const isActing = acting !== null;

	return (
		<Paper variant="outlined" sx={{ p: 2.5 }}>
			<Stack spacing={2}>
				{/* Header row */}
				<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
					<CategoryChip category={category} />
					<Chip size="small" variant="outlined" label={language.toUpperCase()} />
					<Chip size="small" variant="outlined" label={`domain: ${domain}`} />
					<Chip size="small" variant="outlined" label={`빈도 ${frequency}회`} />
					{clusterLabel && (
						<Chip size="small" variant="outlined" label={clusterLabel} />
					)}
				</Stack>

				{/* Representative question */}
				<Box>
					<Typography variant="caption" color="text.secondary">
						대표 질문
					</Typography>
					<Typography variant="body2" fontWeight={600} sx={{ mt: 0.25 }}>
						{representativeQ}
					</Typography>
				</Box>

				{/* For 'update' category: side-by-side diff of KB answer vs operator answer */}
				{category === 'update' && (kbAnswer || operatorAnswer) && (
					<Box>
						<Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
							기존 KB vs 운영자 답변 비교
						</Typography>
						<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
							<Box
								sx={{
									flex: 1,
									border: 1,
									borderColor: 'divider',
									borderRadius: 1,
									p: 1.5,
								}}
							>
								<Typography variant="caption" color="text.secondary" fontWeight={600}>
									기존 KB 답변
								</Typography>
								<Typography
									variant="body2"
									sx={{ mt: 0.5, whiteSpace: 'pre-wrap', color: 'text.secondary' }}
								>
									{kbAnswer ?? '(없음)'}
								</Typography>
							</Box>
							<Box
								sx={{
									flex: 1,
									border: 2,
									borderColor: 'warning.main',
									borderRadius: 1,
									p: 1.5,
									bgcolor: 'warning.50',
								}}
							>
								<Typography variant="caption" color="warning.dark" fontWeight={600}>
									운영자 답변 (변경안)
								</Typography>
								<Typography
									variant="body2"
									sx={{ mt: 0.5, whiteSpace: 'pre-wrap', color: 'text.primary' }}
								>
									{operatorAnswer ?? '(없음)'}
								</Typography>
							</Box>
						</Stack>
					</Box>
				)}

				<Divider />

				{/* Editable proposed Q-A */}
				<Box>
					<Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
						제안 Q-A (수정 후 승인 시 반영)
					</Typography>
					<Stack spacing={1.5}>
						<TextField
							label="질문"
							multiline
							minRows={2}
							fullWidth
							size="small"
							value={editedQuestion}
							onChange={(e) => setEditedQuestion(e.target.value)}
							disabled={isActing}
						/>
						<TextField
							label="답변"
							multiline
							minRows={3}
							fullWidth
							size="small"
							value={editedAnswer}
							onChange={(e) => setEditedAnswer(e.target.value)}
							disabled={isActing}
						/>
					</Stack>
				</Box>

				{actionError && <Alert severity="error" sx={{ py: 0 }}>{actionError}</Alert>}

				{/* Action buttons */}
				<Stack direction="row" spacing={1}>
					<Button
						variant="contained"
						color="success"
						size="small"
						disabled={isActing}
						startIcon={acting === 'approve' ? <CircularProgress size={14} color="inherit" /> : undefined}
						onClick={() => postAction('approve')}
					>
						승인
					</Button>
					<Button
						variant="contained"
						color="primary"
						size="small"
						disabled={isActing || (!editedQuestion.trim() && !editedAnswer.trim())}
						startIcon={
							acting === 'approve-edit' ? <CircularProgress size={14} color="inherit" /> : undefined
						}
						onClick={() => postAction('approve-edit')}
					>
						수정 후 승인
					</Button>
					<Button
						variant="outlined"
						color="error"
						size="small"
						disabled={isActing}
						startIcon={acting === 'reject' ? <CircularProgress size={14} color="inherit" /> : undefined}
						onClick={() => postAction('reject')}
					>
						기각
					</Button>
				</Stack>
			</Stack>
		</Paper>
	);
}

export default function KbReviewClient() {
	const [candidates, setCandidates] = useState<KbCandidate[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchCandidates = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch('/api/admin/kb-candidates');
			const data = await res.json();
			if (!res.ok) {
				setError(data?.error ?? `목록 조회 실패 (HTTP ${res.status})`);
				return;
			}
			const items: KbCandidate[] = Array.isArray(data) ? data : (data?.items ?? []);
			setCandidates(items);
		} catch (e) {
			setError(e instanceof Error ? e.message : '네트워크 오류');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchCandidates();
	}, [fetchCandidates]);

	return (
		<Box sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column', gap: 2 }}>
			{/* Page header */}
			<Box>
				<Stack direction="row" alignItems="center" justifyContent="space-between">
					<Box>
						<Typography variant="h5" fontWeight={700}>
							KB 검수 큐
						</Typography>
						<Typography variant="body2" color="text.secondary">
							운영자 답변 클러스터를 검토하고 KB에 반영할 항목을 승인 또는 기각합니다.
						</Typography>
					</Box>
					<Button
						variant="outlined"
						size="small"
						disabled={loading}
						startIcon={loading ? <CircularProgress size={14} /> : undefined}
						onClick={fetchCandidates}
					>
						새로고침
					</Button>
				</Stack>
			</Box>

			{/* Error state */}
			{error && <Alert severity="error">{error}</Alert>}

			{/* Loading state */}
			{loading && (
				<Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
					<CircularProgress />
				</Box>
			)}

			{/* Empty state */}
			{!loading && !error && candidates.length === 0 && (
				<Paper
					variant="outlined"
					sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}
				>
					<Typography variant="body1">검수 대기 항목이 없습니다.</Typography>
				</Paper>
			)}

			{/* Candidate list */}
			{!loading && candidates.length > 0 && (
				<Box sx={{ flex: 1, overflow: 'auto' }}>
					<Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
						대기 중 {candidates.length}건
					</Typography>
					<Stack spacing={2}>
						{candidates.map((c) => (
							<CandidateCard key={c.id} candidate={c} onRefresh={fetchCandidates} />
						))}
					</Stack>
				</Box>
			)}
		</Box>
	);
}
