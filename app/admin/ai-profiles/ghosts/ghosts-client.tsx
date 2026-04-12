'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import type {
	GhostListItem,
	GhostListQuery,
} from '@/app/types/ghost-injection';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { ghostInjectionKeys } from '../_shared/query-keys';
import { GhostBatchCreateDialog } from './ghost-batch-create-dialog';
import { GhostBulkActions } from './ghost-bulk-actions';
import { GhostCardView } from './ghost-card-view';
import { GhostDetailDrawer } from './ghost-detail-drawer';
import { GhostFilters } from './ghost-filters';
import { GhostStatusDialog } from './ghost-status-dialog';
import { GhostTableView } from './ghost-table-view';
import { GhostViewToggle, type GhostView } from './ghost-view-toggle';

const DEFAULT_LIMIT = 20;
const VIEW_STORAGE_KEY = 'ghost-view';

function parseQueryFromURL(params: URLSearchParams): GhostListQuery {
	const status = params.get('status');
	const page = Number(params.get('page'));
	const limit = Number(params.get('limit'));
	return {
		status: status === 'ACTIVE' || status === 'INACTIVE' ? status : undefined,
		schoolId: params.get('schoolId') ?? undefined,
		archetypeId: params.get('archetypeId') ?? undefined,
		q: params.get('q') ?? undefined,
		page: Number.isFinite(page) && page > 0 ? page : 1,
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
	if (query.archetypeId) params.set('archetypeId', query.archetypeId);
	if (query.q) params.set('q', query.q);
	if (query.page && query.page > 1) params.set('page', String(query.page));
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
	const [selectedGhostId, setSelectedGhostId] = useState<string | null>(null);
	const [statusTarget, setStatusTarget] = useState<GhostListItem | null>(null);

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

	const listQuery = useQuery({
		queryKey: ghostInjectionKeys.ghostList(query),
		queryFn: () => ghostInjection.listGhosts(query),
		placeholderData: keepPreviousData,
	});

	const items = listQuery.data?.items ?? [];
	const total = listQuery.data?.total ?? 0;
	const page = query.page ?? 1;
	const limit = query.limit ?? DEFAULT_LIMIT;
	const totalPages = Math.max(1, Math.ceil(total / limit));

	const selectedSchoolLabel = useMemo(() => {
		if (!query.schoolId) return undefined;
		return items.find((item) => item.university?.id === query.schoolId)?.university?.name;
	}, [items, query.schoolId]);

	return (
		<section className="space-y-4 px-6 py-8">
			<header className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold text-slate-900">가상 프로필 관리</h1>
					<p className="mt-1 text-sm text-slate-500">
						가상 프로필을 조회·생성·수정·비활성화합니다. 모든 변경은 감사 로그에 기록됩니다.
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

			{view === 'table' ? (
				<GhostTableView
					items={items}
					isLoading={listQuery.isLoading}
					onRowClick={(ghost) => setSelectedGhostId(ghost.ghostAccountId)}
					onToggleStatus={setStatusTarget}
				/>
			) : (
				<GhostCardView
					items={items}
					isLoading={listQuery.isLoading}
					onCardClick={(ghost) => setSelectedGhostId(ghost.ghostAccountId)}
					onToggleStatus={setStatusTarget}
				/>
			)}

			<div className="flex items-center justify-between text-xs text-slate-500">
				<div>
					전체 <span className="font-semibold text-slate-800">{total}</span>명 · Page {page} /{' '}
					{totalPages}
				</div>
				<div className="flex items-center gap-1">
					<Button
						variant="outline"
						size="sm"
						disabled={page <= 1 || listQuery.isFetching}
						onClick={() => setQuery((prev) => ({ ...prev, page: Math.max(1, (prev.page ?? 1) - 1) }))}
					>
						<ChevronLeft className="h-4 w-4" /> 이전
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled={page >= totalPages || listQuery.isFetching}
						onClick={() =>
							setQuery((prev) => ({ ...prev, page: Math.min(totalPages, (prev.page ?? 1) + 1) }))
						}
					>
						다음 <ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			</div>

			<GhostBatchCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
			<GhostDetailDrawer
				key={selectedGhostId ?? 'closed'}
				ghostAccountId={selectedGhostId}
				onClose={() => setSelectedGhostId(null)}
			/>
			<GhostStatusDialog ghost={statusTarget} onClose={() => setStatusTarget(null)} />
		</section>
	);
}
