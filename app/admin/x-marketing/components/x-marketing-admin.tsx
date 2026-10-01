'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Chip, Input, Label, Link, Spinner, Switch, TextField } from '@heroui/react';
import { Plus, Trash2 } from 'lucide-react';
import {
	XMarketingAction,
	XMarketingAdminService,
	XMarketingCollectedPost,
	XMarketingDashboard,
	XMarketingRateLimit,
	XMarketingReplyCandidate,
} from '@/app/services/admin/x-marketing';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { sanitizeUrl } from '@/shared/lib/safe-url';

type View =
	| 'dashboard'
	| 'collected-posts'
	| 'reply-candidates'
	| 'own-posts'
	| 'actions'
	| 'settings';

type Props = {
	initialView: View;
};

type CollectionQueryConfig = {
	query: string;
	enabled: boolean;
	priority: number;
};

const tabs: { value: View; label: string; href: string }[] = [
	{
		value: 'dashboard',
		label: '대시보드',
		href: '/admin/x-marketing/dashboard',
	},
	{
		value: 'collected-posts',
		label: '수집 게시글',
		href: '/admin/x-marketing/collected-posts',
	},
	{
		value: 'reply-candidates',
		label: '답변 후보',
		href: '/admin/x-marketing/reply-candidates',
	},
	{
		value: 'own-posts',
		label: '독립 게시글',
		href: '/admin/x-marketing/own-posts',
	},
	{ value: 'actions', label: '액션 이력', href: '/admin/x-marketing/actions' },
	{ value: 'settings', label: '설정', href: '/admin/x-marketing/settings' },
];

const defaultCollectionQueries: CollectionQueryConfig[] = [
	{ query: '韓国語 韓国人 友達', enabled: true, priority: 10 },
	{ query: '韓国 大学生 話してみたい', enabled: true, priority: 20 },
	{ query: '韓国人 友達 作りたい', enabled: true, priority: 30 },
	{ query: '韓国語 返信 自然', enabled: true, priority: 40 },
	{ query: '韓国旅行 韓国人 友達', enabled: true, priority: 50 },
	{ query: '韓国 留学 友達', enabled: true, priority: 60 },
	{ query: '韓国 カフェ 友達', enabled: true, priority: 70 },
	{ query: '韓国ドラマ 韓国語 話したい', enabled: true, priority: 80 },
	{ query: 'KPOP 韓国語 友達', enabled: true, priority: 90 },
	{ query: '韓国人 彼氏 遠距離', enabled: true, priority: 100 },
	{ query: '日韓 遠距離 恋愛', enabled: true, priority: 110 },
	{ query: '韓国人と付き合う 韓国語', enabled: true, priority: 120 },
	{ query: '韓国 恋愛 文化', enabled: true, priority: 130 },
	{ query: '韓国語 ニュアンス 返信', enabled: true, priority: 140 },
	{ query: '韓国人と話したい', enabled: true, priority: 150 },
];

function metricValue(
	data: XMarketingDashboard | null,
	camel: keyof XMarketingDashboard,
	snake: keyof XMarketingDashboard,
) {
	return Number(data?.[camel] ?? data?.[snake] ?? 0);
}

function getList<T>(
	response: { items?: T[]; data?: { items?: T[] } } | null,
): T[] {
	return response?.items ?? response?.data?.items ?? [];
}

function postText(post: XMarketingCollectedPost) {
	return post.text_original ?? post.textOriginal ?? '';
}

function postKo(post: XMarketingCollectedPost) {
	return post.text_ko ?? post.textKo ?? '';
}

function normalizeCollectionQueries(
	settings: Record<string, unknown>,
): CollectionQueryConfig[] {
	const raw = settings.collection_queries ?? settings.collectionQueries;
	if (!Array.isArray(raw)) return defaultCollectionQueries;

	const queries = raw
		.map((item): CollectionQueryConfig | null => {
			if (!item || typeof item !== 'object') return null;
			const value = item as Partial<CollectionQueryConfig>;
			if (typeof value.query !== 'string' || value.query.trim().length === 0)
				return null;
			return {
				query: value.query,
				enabled: value.enabled !== false,
				priority: Number.isFinite(Number(value.priority))
					? Number(value.priority)
					: 100,
			};
		})
		.filter((item): item is CollectionQueryConfig => item !== null)
		.sort((a, b) => a.priority - b.priority);

	return queries.length > 0 ? queries : defaultCollectionQueries;
}

export default function XMarketingAdmin({ initialView }: Props) {
	const [view, setView] = useState<View>(initialView);
	const [dashboard, setDashboard] = useState<XMarketingDashboard | null>(null);
	const [collectedPosts, setCollectedPosts] = useState<
		XMarketingCollectedPost[]
	>([]);
	const [replyCandidates, setReplyCandidates] = useState<
		XMarketingReplyCandidate[]
	>([]);
	const [ownPosts, setOwnPosts] = useState<XMarketingCollectedPost[]>([]);
	const [actions, setActions] = useState<XMarketingAction[]>([]);
	const [rateLimits, setRateLimits] = useState<XMarketingRateLimit[]>([]);
	const [settings, setSettings] = useState<Record<string, unknown>>({});
	const [query, setQuery] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [actionPending, setActionPending] = useState(false);
	const actionLock = useRef(false);

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
				setCollectedPosts(
					getList(
						await XMarketingAdminService.getCollectedPosts({
							limit: 20,
							search: query,
						}),
					),
				);
			}
			if (view === 'reply-candidates' || view === 'dashboard') {
				setReplyCandidates(
					getList(
						await XMarketingAdminService.getReplyCandidates({
							limit: 20,
							search: query,
						}),
					),
				);
			}
			if (view === 'own-posts') {
				setOwnPosts(
					getList(
						await XMarketingAdminService.getPosts({ limit: 20, search: query }),
					),
				);
			}
			if (view === 'actions') {
				setActions(
					getList(
						await XMarketingAdminService.getActions({
							limit: 30,
							search: query,
						}),
					),
				);
			}
			if (view === 'settings') {
				setSettings(await XMarketingAdminService.getSettings());
			}
		} catch (err) {
			setError(
				getAdminErrorMessage(err, 'X 마케팅 데이터를 불러오지 못했습니다.'),
			);
		} finally {
			setLoading(false);
		}
	}, [query, view]);

	useEffect(() => {
		void load();
	}, [load]);

	const metrics = useMemo(
		() => [
			{
				label: '수집',
				value: metricValue(dashboard, 'collectedCount', 'collected_count'),
			},
			{
				label: '후보',
				value: metricValue(dashboard, 'candidateCount', 'candidate_count'),
			},
			{
				label: '승인',
				value: metricValue(dashboard, 'approvedCount', 'approved_count'),
			},
			{
				label: '게시/답글',
				value:
					metricValue(dashboard, 'ownPostCount', 'own_post_count') +
					metricValue(dashboard, 'replyCount', 'reply_count'),
			},
			{
				label: '좋아요',
				value: metricValue(dashboard, 'likeCount', 'like_count'),
			},
			{
				label: 'UTM 클릭',
				value: metricValue(dashboard, 'linkClicks', 'link_clicks'),
			},
			{ label: '가입', value: metricValue(dashboard, 'signups', 'signups') },
		],
		[dashboard],
	);

	const runAction = async (action: () => Promise<unknown>, failure: string) => {
        if (actionLock.current) return;
        actionLock.current = true;
        setActionPending(true);
        setError(null);
        try { await action(); await load(); }
        catch (err) { setError(getAdminErrorMessage(err, failure)); }
        finally { actionLock.current = false; setActionPending(false); }
    };
    const handleCollect = () => runAction(() => XMarketingAdminService.collect({query: query || undefined, priority: 100}), '수동 수집 요청에 실패했습니다.');
    const handleGenerate = (id: string) => runAction(() => XMarketingAdminService.generateReplyCandidate(id), '답변 후보 생성에 실패했습니다.');
    const handleApprove = (id: string) => runAction(() => XMarketingAdminService.approveReplyCandidate(id), '답변 후보 승인에 실패했습니다.');
    const handleReject = (id: string) => runAction(() => XMarketingAdminService.rejectReplyCandidate(id, '운영자 거절'), '답변 후보 거절에 실패했습니다.');

    const busy = loading || actionPending;
    return <main className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">X 마케팅 관리</h1><p className="mt-1 text-sm text-gray-600">수집, 답변 후보, 승인 이력, API window 리밋, UTM 성과를 한 화면에서 검수합니다.</p></div><div className="flex flex-wrap gap-2"><Chip>마케팅 &gt; X 마케팅 관리</Chip><Chip color="warning">Human-in-the-loop</Chip></div></header>
        <nav aria-label="X 마케팅 메뉴" className="flex flex-wrap gap-x-5 gap-y-2 border-b">{tabs.map(tab => <Link key={tab.value} href={tab.href} aria-current={view === tab.value ? 'page' : undefined} className={`rounded-none py-3 text-sm text-gray-800 ${view === tab.value ? 'border-b-2 border-[#7A4AE2] font-bold' : ''}`}>{tab.label}</Link>)}</nav>
        <div className="flex flex-wrap items-end gap-3"><TextField className="w-full md:w-96" isDisabled={actionPending}><Label>검색/수집 쿼리</Label><Input value={query} onChange={event => setQuery(event.target.value)}/></TextField><Button variant="secondary" onPress={() => void load()} isDisabled={busy}>새로고침</Button><Button onPress={() => void handleCollect()} isDisabled={busy}>수동 수집 실행</Button>{busy && <Spinner aria-label="X 마케팅 처리 중" size="sm"/>}</div>
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {['dashboard','collected-posts','reply-candidates'].includes(view) && <dl className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">{metrics.map(metric => <div key={metric.label} className="rounded-xl border bg-white p-4"><dt className="text-sm text-gray-600">{metric.label}</dt><dd className="mt-1 text-2xl font-bold tabular-nums">{metric.value.toLocaleString()}</dd></div>)}</dl>}
        {view === 'dashboard' && <div className="grid items-start gap-4 lg:grid-cols-[7fr_5fr]"><CollectedPostsCard posts={collectedPosts.slice(0,5)} onGenerate={handleGenerate} busy={busy}/><RateLimitCard rateLimits={rateLimits}/></div>}
        {view === 'collected-posts' && <CollectedPostsCard posts={collectedPosts} onGenerate={handleGenerate} busy={busy}/>}
        {view === 'reply-candidates' && <ReplyCandidatesCard candidates={replyCandidates} onApprove={handleApprove} onReject={handleReject} busy={busy}/>}
        {view === 'own-posts' && <PostsCard posts={ownPosts}/>}
        {view === 'actions' && <ActionsCard actions={actions}/>}
        {view === 'settings' && <SettingsCard settings={settings} rateLimits={rateLimits} onSaved={load}/>}
    </main>;
}

function CollectedPostsCard({posts,onGenerate,busy}: {posts:XMarketingCollectedPost[];onGenerate:(id:string)=>Promise<void>;busy:boolean}) {
    return <Card className="border bg-white"><Card.Content className="space-y-4"><h2 className="text-base font-bold">수집 게시글 검토</h2><div className="divide-y">{posts.map(post => {
        const url = sanitizeUrl(post.url, {allowRelative:false});
        return <article key={post.id} className="flex flex-wrap justify-between gap-3 py-4 first:pt-0"><div className="min-w-0 flex-1"><h3 className="text-sm font-bold">@{post.username ?? 'unknown'}</h3><p className="mt-1 whitespace-pre-wrap break-words text-sm">{postText(post)}</p>{postKo(post) && <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{postKo(post)}</p>}</div><div className="flex flex-wrap items-start gap-2"><Chip size="sm">{post.status ?? 'collected'}</Chip><Button size="sm" variant="secondary" isDisabled={busy} onPress={() => void onGenerate(post.id)}>후보 생성</Button>{url && <Link href={url} target="_blank" rel="noopener noreferrer">X 열기</Link>}</div></article>;
    })}</div>{!posts.length && <p className="text-sm text-gray-600">수집된 게시글이 없습니다.</p>}</Card.Content></Card>;
}
function ReplyCandidatesCard({candidates,onApprove,onReject,busy}: {candidates:XMarketingReplyCandidate[];onApprove:(id:string)=>Promise<void>;onReject:(id:string)=>Promise<void>;busy:boolean}) {
    return <Card className="border bg-white"><Card.Content className="space-y-4"><h2 className="text-base font-bold">AI 답변 후보 검수</h2><div className="divide-y">{candidates.map(candidate => {
        const url = sanitizeUrl(candidate.target_url,{allowRelative:false});
        return <article key={candidate.id} className="space-y-2 py-4 first:pt-0"><p className="text-sm text-gray-600">대상 @{candidate.target_username ?? 'unknown'} · {candidate.tone} · risk {candidate.risk}</p><p className="whitespace-pre-wrap text-sm text-gray-600">{candidate.target_text_original}</p><p className="whitespace-pre-wrap font-bold">{candidate.edited_ja_text ?? candidate.ja_text}</p><p className="whitespace-pre-wrap text-sm">{candidate.edited_ko_meaning ?? candidate.ko_meaning}</p><div className="flex flex-wrap items-center gap-2"><Chip size="sm">{candidate.status ?? 'candidate_generated'}</Chip><Button size="sm" isDisabled={busy} onPress={() => void onApprove(candidate.id)}>승인</Button><Button size="sm" variant="secondary" isDisabled={busy} onPress={() => void onReject(candidate.id)}>거절</Button>{url && <Link href={url} target="_blank" rel="noopener noreferrer">X 열기</Link>}</div></article>;
    })}</div>{!candidates.length && <p className="text-sm text-gray-600">답변 후보가 없습니다.</p>}</Card.Content></Card>;
}
function RateLimitCard({rateLimits}:{rateLimits:XMarketingRateLimit[]}) {
    return <Card className="border bg-white"><Card.Content className="space-y-4"><h2 className="text-base font-bold">X API 현재 window 리밋</h2><div className="divide-y">{rateLimits.map(limit => <article key={limit.id} className="py-3 first:pt-0"><div className="flex flex-wrap justify-between gap-2 text-sm"><h3 className="break-all font-bold">{limit.endpoint}</h3><p className="tabular-nums">{limit.remaining_count ?? '-'} / {limit.limit_count ?? '-'}</p></div><p className="text-sm text-gray-600">reset {limit.reset_at ?? '-'} · {limit.seconds_to_reset ?? '-'}초</p>{limit.last_failure_reason && <p className="text-sm text-red-700">{limit.last_failure_reason}</p>}</article>)}</div>{!rateLimits.length && <p className="text-sm text-gray-600">저장된 리밋 스냅샷이 없습니다.</p>}</Card.Content></Card>;
}
function PostsCard({posts}:{posts:XMarketingCollectedPost[]}) {
    return <Card className="border bg-white"><Card.Content className="space-y-4"><h2 className="text-base font-bold">작성한 독립 게시글</h2><div className="divide-y">{posts.map(post => <article key={post.id} className="space-y-2 py-4 first:pt-0"><h3 className="text-sm font-bold">{post.tweet_id ?? post.tweetId ?? 'draft'}</h3><p className="whitespace-pre-wrap break-words text-sm">{postText(post)}</p><Chip size="sm">{post.status ?? 'approved'}</Chip></article>)}</div>{!posts.length && <p className="text-sm text-gray-600">작성한 게시글 기록이 없습니다.</p>}</Card.Content></Card>;
}
function ActionsCard({actions}:{actions:XMarketingAction[]}) {
    return <Card className="border bg-white"><Card.Content className="space-y-4"><h2 className="text-base font-bold">운영 액션 이력</h2><div className="divide-y">{actions.map(action => <article key={action.id} className="space-y-1 py-3 first:pt-0"><div className="flex flex-wrap justify-between gap-2"><h3 className="text-sm font-bold">{action.action_type}</h3><Chip size="sm">{action.status ?? 'recorded'}</Chip></div><p className="break-words text-sm text-gray-600">{action.target_type} · {action.tweet_id ?? action.id} · {action.created_at}</p></article>)}</div>{!actions.length && <p className="text-sm text-gray-600">액션 이력이 없습니다.</p>}</Card.Content></Card>;
}

function SettingsCard({
	settings,
	rateLimits,
	onSaved,
}: {
	settings: Record<string, unknown>;
	rateLimits: XMarketingRateLimit[];
	onSaved: () => Promise<void>;
}) {
	const [collectionQueries, setCollectionQueries] = useState<
		CollectionQueryConfig[]
	>(normalizeCollectionQueries(settings));
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	useEffect(() => {
		setCollectionQueries(normalizeCollectionQueries(settings));
	}, [settings]);

	const updateQuery = (index: number, next: Partial<CollectionQueryConfig>) => {
		setCollectionQueries((current) =>
			current.map((item, itemIndex) =>
				itemIndex === index ? { ...item, ...next } : item,
			),
		);
	};

	const addQuery = () => {
		setCollectionQueries((current) => [
			...current,
			{
				query: '',
				enabled: true,
				priority: Math.max(0, ...current.map((item) => item.priority)) + 10,
			},
		]);
	};

	const removeQuery = (index: number) => {
		setCollectionQueries((current) =>
			current.filter((_, itemIndex) => itemIndex !== index),
		);
	};

	const saveQueries = async () => {
		setSaving(true);
		setSaveError(null);
		try {
			const normalized = collectionQueries
				.map((item) => ({
					query: item.query.trim(),
					enabled: item.enabled,
					priority: Number.isFinite(Number(item.priority))
						? Number(item.priority)
						: 100,
				}))
				.filter((item) => item.query.length > 0)
				.sort((a, b) => a.priority - b.priority);

			await XMarketingAdminService.updateSettings({
				collection_queries: normalized,
			});
			await onSaved();
		} catch (err) {
			setSaveError(getAdminErrorMessage(err, '수집 쿼리 저장에 실패했습니다.'));
		} finally {
			setSaving(false);
		}
	};

    return <div className="grid items-start gap-4 lg:grid-cols-[7fr_5fr]"><Card className="border bg-white"><Card.Content className="space-y-4"><header className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-base font-bold">수집 쿼리</h2><p className="mt-1 text-sm text-gray-600">우선순위가 낮은 숫자일수록 먼저 수집합니다.</p></div><div className="flex gap-2"><Button variant="secondary" onPress={addQuery} isDisabled={saving}><Plus size={16} aria-hidden/>쿼리 추가</Button><Button onPress={() => void saveQueries()} isDisabled={saving}>{saving && <Spinner size="sm" aria-hidden/>}저장</Button></div></header><p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">자동 답글/자동 좋아요는 kill switch와 2차 확인 없이 켜지지 않아야 합니다.</p>{saveError && <p role="alert" className="text-sm text-red-700">{saveError}</p>}<div className="divide-y">{collectionQueries.map((item,index) => <div key={index} className="flex flex-wrap items-end gap-3 py-3 first:pt-0"><Switch aria-label={`쿼리 ${index+1} 활성`} isSelected={item.enabled} isDisabled={saving} onChange={enabled => updateQuery(index,{enabled})}><Switch.Content><Switch.Control><Switch.Thumb/></Switch.Control><Label>{item.enabled ? 'ON':'OFF'}</Label></Switch.Content></Switch><TextField className="min-w-40 flex-1" isDisabled={saving}><Label>수집 쿼리 {index+1}</Label><Input value={item.query} onChange={event => updateQuery(index,{query:event.target.value})}/></TextField><TextField className="w-28" isDisabled={saving}><Label>우선순위 {index+1}</Label><Input type="number" value={String(item.priority)} onChange={event => updateQuery(index,{priority:Number(event.target.value)})}/></TextField><Button isIconOnly variant="secondary" aria-label={`쿼리 ${index+1} 삭제`} isDisabled={saving} onPress={() => removeQuery(index)}><Trash2 size={18}/></Button></div>)}</div></Card.Content></Card><RateLimitCard rateLimits={rateLimits}/></div>;
}
