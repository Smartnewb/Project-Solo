'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import type {
	GhostListItem,
	GhostListQuery,
} from '@/app/types/ghost-injection';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { ghostInjectionKeys } from '../_shared/query-keys';
import { GhostBatchPreviewDialog } from './ghost-batch-preview-dialog';
import { GhostBulkActions } from './ghost-bulk-actions';
import { GhostBulkDeleteDialog } from './ghost-bulk-delete-dialog';
import { GhostCardView } from './ghost-card-view';
import { GhostDetailDrawer } from './ghost-detail-drawer';
import { GhostFilters } from './ghost-filters';
import { GhostSelectionBar } from './ghost-selection-bar';
import { GhostStatusDialog } from './ghost-status-dialog';
import { GhostTableView } from './ghost-table-view';
import { GhostViewToggle, type GhostView } from './ghost-view-toggle';

const DEFAULT_LIMIT = 20;
const VIEW_STORAGE_KEY = 'ghost-view';

function parseQueryFromURL(params: URLSearchParams): GhostListQuery {
	const status = params.get('status');
	const limit = Number(params.get('limit'));
	return {
		status: status === 'ACTIVE' || status === 'INACTIVE' ? status : undefined,
		schoolId: params.get('schoolId') ?? undefined,
		q: params.get('q') ?? undefined,
		limit: Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_LIMIT,
	};
}

function parseViewFromURL(params: URLSearchParams): GhostView | null {
	const view = params.get('view');
	if (view === 'table' || view === 'card') return view;
	return null;
}

function serializeQuery(query: GhostListQuery, view: GhostView): string {
	const params = new URLSearchParams();
	if (query.status) params.set('status', query.status);
	if (query.schoolId) params.set('schoolId', query.schoolId);
	if (query.q) params.set('q', query.q);
	if (query.limit && query.limit !== DEFAULT_LIMIT) params.set('limit', String(query.limit));
	params.set('view', view);
	return params.toString();
}

export function GhostsClient() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [query, setQuery] = useState<GhostListQuery>(() => parseQueryFromURL(searchParams));
	const [view, setView] = useState<GhostView>(() => {
		const fromUrl = parseViewFromURL(searchParams);
		if (fromUrl) return fromUrl;
		if (typeof window !== 'undefined') {
			const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
			if (stored === 'card' || stored === 'table') return stored;
		}
		return 'table';
	});
	const [createOpen, setCreateOpen] = useState(false);
	const [selectedGhostId, setSelectedGhostId] = useState<string | null>(
		() => searchParams.get('ghostAccountId'),
	);
	const [statusTarget, setStatusTarget] = useState<GhostListItem | null>(null);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

	useEffect(() => {
		const nextQs = serializeQuery(query, view);
		if (nextQs !== searchParams.toString()) {
			router.replace(`?${nextQs}`, { scroll: false });
		}
	}, [query, view, router, searchParams]);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			window.localStorage.setItem(VIEW_STORAGE_KEY, view);
		}
	}, [view]);

	const listQuery = useInfiniteQuery({
		queryKey: ghostInjectionKeys.ghostList(query),
		initialPageParam: 1,
		queryFn: ({ pageParam }) => ghostInjection.listGhosts({ ...query, page: pageParam }),
		getNextPageParam: (lastPage) =>
			lastPage.meta.hasNextPage ? lastPage.meta.currentPage + 1 : undefined,
		placeholderData: keepPreviousData,
	});

	const pages = listQuery.data?.pages;
	const items = useMemo(() => pages?.flatMap((page) => page.items) ?? [], [pages]);
	const total = pages?.[0]?.meta?.totalItems ?? 0;
	const sentinelRef = useRef<HTMLDivElement | null>(null);
	const fetchNextRef = useRef(listQuery.fetchNextPage);
	const hasNextRef = useRef(listQuery.hasNextPage);
	const isFetchingNextRef = useRef(listQuery.isFetchingNextPage);
	fetchNextRef.current = listQuery.fetchNextPage;
	hasNextRef.current = listQuery.hasNextPage;
	isFetchingNextRef.current = listQuery.isFetchingNextPage;

	useEffect(() => {
		const el = sentinelRef.current;
		if (!el) return;

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting && hasNextRef.current && !isFetchingNextRef.current) {
						fetchNextRef.current();
					}
				}
			},
			{ rootMargin: '480px 0px' },
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	const selectedSchoolLabel = useMemo(() => {
		if (!query.schoolId) return undefined;
		return items.find((item) => item.university?.id === query.schoolId)?.university?.name;
	}, [items, query.schoolId]);

	const selectedItems = useMemo(
		() => items.filter((item) => selectedIds.has(item.ghostAccountId)),
		[items, selectedIds],
	);

	const toggleSelect = useCallback((id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}, []);

	const toggleSelectAll = useCallback(() => {
		setSelectedIds((prev) => {
			const allOnPage = items.every((item) => prev.has(item.ghostAccountId));
			if (allOnPage) {
				const next = new Set(prev);
				items.forEach((item) => next.delete(item.ghostAccountId));
				return next;
			}
			const next = new Set(prev);
			items.forEach((item) => next.add(item.ghostAccountId));
			return next;
		});
	}, [items]);

	const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

	const handleBulkDeleteComplete = useCallback((succeededIds: string[]) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			succeededIds.forEach((id) => next.delete(id));
			return next;
		});
	}, []);

	return (
		<section className="space-y-4 px-6 py-8">
			<header className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold text-slate-900">가상 프로필 관리 (유저 위장)</h1>
					<p className="mt-1 text-sm text-slate-500">
						유저에게 <strong>실제 유저처럼</strong> 노출되는 가상 계정을 조회·생성·수정·비활성화합니다. AI 채팅용이 아님. 모든 변경은 감사 로그에 기록됩니다.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<GhostViewToggle value={view} onChange={setView} />
					<Button onClick={() => setCreateOpen(true)}>
						<Plus className="mr-1 h-4 w-4" /> 프로필 생성
					</Button>
				</div>
			</header>

			<GhostFilters query={query} onChange={setQuery} />

			{query.schoolId ? (
				<div className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 px-4 py-2">
					<p className="text-xs text-amber-800">
						학교 필터가 적용되어 있습니다. 이 학교의 가상 프로필을 일괄 비활성화할 수 있습니다.
					</p>
					<GhostBulkActions schoolId={query.schoolId} schoolLabel={selectedSchoolLabel} />
				</div>
			) : null}

			{listQuery.isError ? (
				<Alert variant="destructive">
					<AlertDescription>
						가상 프로필 목록을 불러오지 못했습니다.
					</AlertDescription>
				</Alert>
			) : null}

			<GhostSelectionBar
				count={selectedIds.size}
				onClear={clearSelection}
				onBulkDelete={() => setBulkDeleteOpen(true)}
			/>

			{view === 'table' ? (
				<GhostTableView
					items={items}
					isLoading={listQuery.isLoading}
					onRowClick={(ghost) => setSelectedGhostId(ghost.ghostAccountId)}
					onToggleStatus={setStatusTarget}
					selectedIds={selectedIds}
					onToggleSelect={toggleSelect}
					onToggleSelectAll={toggleSelectAll}
				/>
			) : (
				<GhostCardView
					items={items}
					isLoading={listQuery.isLoading}
					isFetchingNextPage={listQuery.isFetchingNextPage}
					onCardClick={(ghost) => setSelectedGhostId(ghost.ghostAccountId)}
					onToggleStatus={setStatusTarget}
					selectedIds={selectedIds}
					onToggleSelect={toggleSelect}
				/>
			)}

			<div ref={sentinelRef} className="h-8" />

			<div className="flex items-center justify-center text-xs text-slate-500">
				{listQuery.isFetchingNextPage ? (
					<div className="flex items-center gap-2">
						<Loader2 className="h-4 w-4 animate-spin" />
						<span>추가 프로필을 불러오는 중…</span>
					</div>
				) : listQuery.hasNextPage ? (
					<span>
						{items.length}/{total}명 표시 중
					</span>
				) : total > 0 ? (
					<span>
						전체 <span className="font-semibold text-slate-800">{total}</span>명 표시 완료
					</span>
				) : null}
			</div>

			<GhostBatchPreviewDialog open={createOpen} onOpenChange={setCreateOpen} />
			<GhostDetailDrawer
				key={selectedGhostId ?? 'closed'}
				ghostAccountId={selectedGhostId}
				onClose={() => setSelectedGhostId(null)}
			/>
			<GhostStatusDialog ghost={statusTarget} onClose={() => setStatusTarget(null)} />
			<GhostBulkDeleteDialog
				open={bulkDeleteOpen}
				onOpenChange={setBulkDeleteOpen}
				selected={selectedItems}
				onComplete={handleBulkDeleteComplete}
			/>
		</section>
	);
}
