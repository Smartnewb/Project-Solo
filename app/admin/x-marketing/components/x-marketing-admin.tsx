'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Divider,
	Grid,
	Stack,
	Tab,
	Tabs,
	TextField,
	Typography,
} from '@mui/material';
import {
	XMarketingAction,
	XMarketingAdminService,
	XMarketingCollectedPost,
	XMarketingDashboard,
	XMarketingRateLimit,
	XMarketingReplyCandidate,
} from '@/app/services/admin/x-marketing';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';

type View = 'dashboard' | 'collected-posts' | 'reply-candidates' | 'own-posts' | 'actions' | 'settings';

type Props = {
	initialView: View;
};

const tabs: { value: View; label: string; href: string }[] = [
	{ value: 'dashboard', label: '대시보드', href: '/admin/x-marketing/dashboard' },
	{ value: 'collected-posts', label: '수집 게시글', href: '/admin/x-marketing/collected-posts' },
	{ value: 'reply-candidates', label: '답변 후보', href: '/admin/x-marketing/reply-candidates' },
	{ value: 'own-posts', label: '독립 게시글', href: '/admin/x-marketing/own-posts' },
	{ value: 'actions', label: '액션 이력', href: '/admin/x-marketing/actions' },
	{ value: 'settings', label: '설정', href: '/admin/x-marketing/settings' },
];

function metricValue(data: XMarketingDashboard | null, camel: keyof XMarketingDashboard, snake: keyof XMarketingDashboard) {
	return Number(data?.[camel] ?? data?.[snake] ?? 0);
}

function getList<T>(response: { items?: T[]; data?: { items?: T[] } } | null): T[] {
	return response?.items ?? response?.data?.items ?? [];
}

function postText(post: XMarketingCollectedPost) {
	return post.text_original ?? post.textOriginal ?? '';
}

function postKo(post: XMarketingCollectedPost) {
	return post.text_ko ?? post.textKo ?? '';
}

export default function XMarketingAdmin({ initialView }: Props) {
	const [view, setView] = useState<View>(initialView);
	const [dashboard, setDashboard] = useState<XMarketingDashboard | null>(null);
	const [collectedPosts, setCollectedPosts] = useState<XMarketingCollectedPost[]>([]);
	const [replyCandidates, setReplyCandidates] = useState<XMarketingReplyCandidate[]>([]);
	const [ownPosts, setOwnPosts] = useState<XMarketingCollectedPost[]>([]);
	const [actions, setActions] = useState<XMarketingAction[]>([]);
	const [rateLimits, setRateLimits] = useState<XMarketingRateLimit[]>([]);
	const [settings, setSettings] = useState<Record<string, unknown>>({});
	const [query, setQuery] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => setView(initialView), [initialView]);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const [dashboardResult, rateLimitResult] = await Promise.all([
				XMarketingAdminService.getDashboard(),
				XMarketingAdminService.getRateLimits(),
			]);
			setDashboard(dashboardResult);
			setRateLimits(rateLimitResult);

			if (view === 'collected-posts' || view === 'dashboard') {
				setCollectedPosts(getList(await XMarketingAdminService.getCollectedPosts({ limit: 20, search: query })));
			}
			if (view === 'reply-candidates' || view === 'dashboard') {
				setReplyCandidates(getList(await XMarketingAdminService.getReplyCandidates({ limit: 20, search: query })));
			}
			if (view === 'own-posts') {
				setOwnPosts(getList(await XMarketingAdminService.getPosts({ limit: 20, search: query })));
			}
			if (view === 'actions') {
				setActions(getList(await XMarketingAdminService.getActions({ limit: 30, search: query })));
			}
			if (view === 'settings') {
				setSettings(await XMarketingAdminService.getSettings());
			}
		} catch (err) {
			setError(getAdminErrorMessage(err, 'X 마케팅 데이터를 불러오지 못했습니다.'));
		} finally {
			setLoading(false);
		}
	}, [query, view]);

	useEffect(() => {
		void load();
	}, [load]);

	const metrics = useMemo(
		() => [
			{ label: '수집', value: metricValue(dashboard, 'collectedCount', 'collected_count') },
			{ label: '후보', value: metricValue(dashboard, 'candidateCount', 'candidate_count') },
			{ label: '승인', value: metricValue(dashboard, 'approvedCount', 'approved_count') },
			{ label: '게시/답글', value: metricValue(dashboard, 'ownPostCount', 'own_post_count') + metricValue(dashboard, 'replyCount', 'reply_count') },
			{ label: '좋아요', value: metricValue(dashboard, 'likeCount', 'like_count') },
			{ label: 'UTM 클릭', value: metricValue(dashboard, 'linkClicks', 'link_clicks') },
			{ label: '가입', value: metricValue(dashboard, 'signups', 'signups') },
		],
		[dashboard],
	);

	const handleCollect = async () => {
		setError(null);
		try {
			await XMarketingAdminService.collect({ query: query || undefined, priority: 100 });
			await load();
		} catch (err) {
			setError(getAdminErrorMessage(err, '수동 수집 요청에 실패했습니다.'));
		}
	};

	const handleGenerate = async (postId: string) => {
		await XMarketingAdminService.generateReplyCandidate(postId);
		await load();
	};

	const handleApprove = async (candidateId: string) => {
		await XMarketingAdminService.approveReplyCandidate(candidateId);
		await load();
	};

	const handleReject = async (candidateId: string) => {
		await XMarketingAdminService.rejectReplyCandidate(candidateId, '운영자 거절');
		await load();
	};

	return (
		<Box>
			<Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2} sx={{ mb: 3 }}>
				<Box>
					<Typography variant="h5" fontWeight={700}>
						X 마케팅 관리
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
						수집, 답변 후보, 승인 이력, API window 리밋, UTM 성과를 한 화면에서 검수합니다.
					</Typography>
				</Box>
				<Stack direction="row" gap={1} flexWrap="wrap">
					<Chip size="small" label="마케팅 > X 마케팅 관리" />
					<Chip size="small" color="warning" label="Human-in-the-loop" />
				</Stack>
			</Stack>

			<Tabs value={view} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
				{tabs.map((tab) => (
					<Tab key={tab.value} value={tab.value} label={tab.label} component={Link} href={tab.href} />
				))}
			</Tabs>

			<Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} sx={{ mb: 3 }}>
				<TextField
					size="small"
					label="검색/수집 쿼리"
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					sx={{ minWidth: { xs: '100%', md: 360 } }}
				/>
				<Button variant="outlined" onClick={() => void load()} disabled={loading}>
					새로고침
				</Button>
				<Button variant="contained" onClick={() => void handleCollect()} disabled={loading}>
					수동 수집 실행
				</Button>
			</Stack>

			{error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

			{(view === 'dashboard' || view === 'collected-posts' || view === 'reply-candidates') && (
				<Grid container spacing={2} sx={{ mb: 3 }}>
					{metrics.map((metric) => (
						<Grid item xs={6} md={3} lg={1.7} key={metric.label}>
							<Card variant="outlined">
								<CardContent>
									<Typography variant="caption" color="text.secondary">{metric.label}</Typography>
									<Typography variant="h5" fontWeight={700}>{metric.value.toLocaleString()}</Typography>
								</CardContent>
							</Card>
						</Grid>
					))}
				</Grid>
			)}

			{view === 'dashboard' && (
				<Grid container spacing={2}>
					<Grid item xs={12} lg={7}>
						<CollectedPostsCard posts={collectedPosts.slice(0, 5)} onGenerate={handleGenerate} />
					</Grid>
					<Grid item xs={12} lg={5}>
						<RateLimitCard rateLimits={rateLimits} />
					</Grid>
				</Grid>
			)}

			{view === 'collected-posts' && <CollectedPostsCard posts={collectedPosts} onGenerate={handleGenerate} />}
			{view === 'reply-candidates' && (
				<ReplyCandidatesCard candidates={replyCandidates} onApprove={handleApprove} onReject={handleReject} />
			)}
			{view === 'own-posts' && <PostsCard posts={ownPosts} />}
			{view === 'actions' && <ActionsCard actions={actions} />}
			{view === 'settings' && <SettingsCard settings={settings} rateLimits={rateLimits} />}
		</Box>
	);
}

function CollectedPostsCard({
	posts,
	onGenerate,
}: {
	posts: XMarketingCollectedPost[];
	onGenerate: (id: string) => Promise<void>;
}) {
	return (
		<Card variant="outlined">
			<CardContent>
				<Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>수집 게시글 검토</Typography>
				<Stack divider={<Divider flexItem />} spacing={2}>
					{posts.map((post) => (
						<Box key={post.id}>
							<Stack direction="row" justifyContent="space-between" gap={2}>
								<Box>
									<Typography variant="body2" fontWeight={700}>@{post.username ?? 'unknown'}</Typography>
									<Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 0.75 }}>{postText(post)}</Typography>
									{postKo(post) && <Typography variant="caption" color="text.secondary">{postKo(post)}</Typography>}
								</Box>
								<Stack alignItems="flex-end" gap={1}>
									<Chip size="small" label={post.status ?? 'collected'} />
									<Button size="small" variant="outlined" onClick={() => void onGenerate(post.id)}>
										후보 생성
									</Button>
									{post.url && <Button size="small" href={post.url} target="_blank">X 열기</Button>}
								</Stack>
							</Stack>
						</Box>
					))}
					{posts.length === 0 && <Typography color="text.secondary">수집된 게시글이 없습니다.</Typography>}
				</Stack>
			</CardContent>
		</Card>
	);
}

function ReplyCandidatesCard({
	candidates,
	onApprove,
	onReject,
}: {
	candidates: XMarketingReplyCandidate[];
	onApprove: (id: string) => Promise<void>;
	onReject: (id: string) => Promise<void>;
}) {
	return (
		<Card variant="outlined">
			<CardContent>
				<Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>AI 답변 후보 검수</Typography>
				<Stack divider={<Divider flexItem />} spacing={2}>
					{candidates.map((candidate) => (
						<Box key={candidate.id}>
							<Typography variant="caption" color="text.secondary">
								대상 @{candidate.target_username ?? 'unknown'} · {candidate.tone} · risk {candidate.risk}
							</Typography>
							<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
								{candidate.target_text_original}
							</Typography>
							<Typography variant="body1" fontWeight={700} sx={{ mt: 1 }}>
								{candidate.edited_ja_text ?? candidate.ja_text}
							</Typography>
							<Typography variant="body2" sx={{ mt: 0.5 }}>
								{candidate.edited_ko_meaning ?? candidate.ko_meaning}
							</Typography>
							<Stack direction="row" gap={1} sx={{ mt: 1.5 }}>
								<Chip size="small" label={candidate.status ?? 'candidate_generated'} />
								<Button size="small" variant="contained" onClick={() => void onApprove(candidate.id)}>
									승인
								</Button>
								<Button size="small" color="inherit" onClick={() => void onReject(candidate.id)}>
									거절
								</Button>
								{candidate.target_url && <Button size="small" href={candidate.target_url} target="_blank">X 열기</Button>}
							</Stack>
						</Box>
					))}
					{candidates.length === 0 && <Typography color="text.secondary">답변 후보가 없습니다.</Typography>}
				</Stack>
			</CardContent>
		</Card>
	);
}

function RateLimitCard({ rateLimits }: { rateLimits: XMarketingRateLimit[] }) {
	return (
		<Card variant="outlined">
			<CardContent>
				<Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>X API 현재 window 리밋</Typography>
				<Stack divider={<Divider flexItem />} spacing={1.5}>
					{rateLimits.map((limit) => (
						<Box key={limit.id}>
							<Stack direction="row" justifyContent="space-between" gap={2}>
								<Typography variant="body2" fontWeight={700}>{limit.endpoint}</Typography>
								<Typography variant="body2">{limit.remaining_count ?? '-'} / {limit.limit_count ?? '-'}</Typography>
							</Stack>
							<Typography variant="caption" color="text.secondary">
								reset {limit.reset_at ?? '-'} · {limit.seconds_to_reset ?? '-'}초
							</Typography>
							{limit.last_failure_reason && <Typography variant="caption" color="error.main">{limit.last_failure_reason}</Typography>}
						</Box>
					))}
					{rateLimits.length === 0 && <Typography color="text.secondary">저장된 리밋 스냅샷이 없습니다.</Typography>}
				</Stack>
			</CardContent>
		</Card>
	);
}

function PostsCard({ posts }: { posts: XMarketingCollectedPost[] }) {
	return (
		<Card variant="outlined">
			<CardContent>
				<Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>작성한 독립 게시글</Typography>
				<Stack divider={<Divider flexItem />} spacing={2}>
					{posts.map((post) => (
						<Box key={post.id}>
							<Typography variant="body2" fontWeight={700}>{post.tweet_id ?? post.tweetId ?? 'draft'}</Typography>
							<Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{postText(post)}</Typography>
							<Chip size="small" label={post.status ?? 'approved'} sx={{ mt: 1 }} />
						</Box>
					))}
					{posts.length === 0 && <Typography color="text.secondary">작성한 게시글 기록이 없습니다.</Typography>}
				</Stack>
			</CardContent>
		</Card>
	);
}

function ActionsCard({ actions }: { actions: XMarketingAction[] }) {
	return (
		<Card variant="outlined">
			<CardContent>
				<Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>운영 액션 이력</Typography>
				<Stack divider={<Divider flexItem />} spacing={1.5}>
					{actions.map((action) => (
						<Box key={action.id}>
							<Stack direction="row" justifyContent="space-between" gap={2}>
								<Typography variant="body2" fontWeight={700}>{action.action_type}</Typography>
								<Chip size="small" label={action.status ?? 'recorded'} />
							</Stack>
							<Typography variant="caption" color="text.secondary">
								{action.target_type} · {action.tweet_id ?? action.id} · {action.created_at}
							</Typography>
						</Box>
					))}
					{actions.length === 0 && <Typography color="text.secondary">액션 이력이 없습니다.</Typography>}
				</Stack>
			</CardContent>
		</Card>
	);
}

function SettingsCard({
	settings,
	rateLimits,
}: {
	settings: Record<string, unknown>;
	rateLimits: XMarketingRateLimit[];
}) {
	return (
		<Grid container spacing={2}>
			<Grid item xs={12} lg={7}>
				<Card variant="outlined">
					<CardContent>
						<Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>운영 설정</Typography>
						<Alert severity="warning" sx={{ mb: 2 }}>
							자동 답글/자동 좋아요는 kill switch와 2차 확인 없이 켜지지 않아야 합니다.
						</Alert>
						<Box component="pre" sx={{ m: 0, p: 2, bgcolor: 'grey.50', overflow: 'auto', fontSize: 12 }}>
							{JSON.stringify(settings, null, 2)}
						</Box>
					</CardContent>
				</Card>
			</Grid>
			<Grid item xs={12} lg={5}>
				<RateLimitCard rateLimits={rateLimits} />
			</Grid>
		</Grid>
	);
}
