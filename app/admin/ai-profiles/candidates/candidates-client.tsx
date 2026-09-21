'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import type {
	CandidateListQuery,
	GhostCandidateStatus,
} from '@/app/types/ghost-injection';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { isCheckable } from '../_shared/candidate-utils';
import { Pager } from '../_shared/pager';
import { ghostInjectionKeys } from '../_shared/query-keys';
import { CandidateActionDialog, type CandidateAction } from './candidate-action-dialog';
import { CandidateFilters } from './candidate-filters';
import { CandidateGenerateDialog } from './candidate-generate-dialog';
import { CandidateTableView } from './candidate-table-view';

const DEFAULT_LIMIT = 20;
const VALID_STATUSES: GhostCandidateStatus[] = ['PENDING', 'QUEUED', 'SENT', 'CANCELED'];
const VALID_SORTS = ['createdAt', 'updatedAt'] as const;
type ValidSort = (typeof VALID_SORTS)[number];

function isStatus(value: string | null): value is GhostCandidateStatus {
	return value !== null && (VALID_STATUSES as string[]).includes(value);
}

function isSort(value: string | null): value is ValidSort {
	return value !== null && (VALID_SORTS as readonly string[]).includes(value);
}

function parseQueryFromURL(params: URLSearchParams): CandidateListQuery {
	const status = params.get('status');
	const weekYear = params.get('weekYear');
	const page = Number(params.get('page'));
	const limit = Number(params.get('limit'));
	const sort = params.get('sort');
	const order = params.get('order');
	return {
		status: isStatus(status) ? status : undefined,
		weekYear: weekYear ?? undefined,
		page: Number.isFinite(page) && page > 0 ? page : 1,
		limit: Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_LIMIT,
		sort: isSort(sort) ? sort : undefined,
		order: order === 'asc' || order === 'desc' ? order : undefined,
	};
}

function serializeQuery(query: CandidateListQuery): string {
	const params = new URLSearchParams();
	if (query.status) params.set('status', query.status);
	if (query.weekYear) params.set('weekYear', query.weekYear);
	if (query.page && query.page > 1) params.set('page', String(query.page));
	if (query.limit && query.limit !== DEFAULT_LIMIT) params.set('limit', String(query.limit));
	if (query.sort) params.set('sort', query.sort);
	if (query.order) params.set('order', query.order);
	return params.toString();
}

export function CandidatesClient() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [query, setQuery] = useState<CandidateListQuery>(() => parseQueryFromURL(searchParams));
	const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
	const [actionDialog, setActionDialog] = useState<{ open: boolean; action: CandidateAction }>({
		open: false,
		action: 'approve',
	});
	const isFirstRender = useRef(true);

	useEffect(() => {
		const nextQs = serializeQuery(query);
		if (nextQs !== searchParams.toString()) {
			router.replace(nextQs ? `?${nextQs}` : '?', { scroll: false });
		}
	}, [query, router, searchParams]);

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}
		setSelectedIds(new Set());
	}, [query]);

	const listQuery = useQuery({
		queryKey: ghostInjectionKeys.candidateList(query),
		queryFn: () => ghostInjection.listCandidates(query),
		placeholderData: keepPreviousData,
	});

	const items = listQuery.data?.items ?? [];
	const total = listQuery.data?.meta?.totalItems ?? 0;
	const page = query.page ?? 1;
	const limit = query.limit ?? DEFAULT_LIMIT;
	const totalPages = Math.max(1, Math.ceil(total / limit));
	const selectedCount = selectedIds.size;

	const selectedIdsArray = useMemo(() => Array.from(selectedIds), [selectedIds]);

	const handleToggleOne = (candidateId: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(candidateId)) next.delete(candidateId);
			else next.add(candidateId);
			return next;
		});
	};

	const handleToggleAll = (checked: boolean) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			const checkable = items.filter(isCheckable);
			if (checked) {
				for (const item of checkable) next.add(item.candidateId);
			} else {
				for (const item of checkable) next.delete(item.candidateId);
			}
			return next;
		});
	};

	const openAction = (action: CandidateAction) => {
		if (selectedCount === 0) return;
		setActionDialog({ open: true, action });
	};

	const closeActionDialog = () => setActionDialog((prev) => ({ ...prev, open: false }));

	return (
		<section className="space-y-4 px-6 py-8">
			<header className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold text-slate-900">매칭 후보</h1>
					<p className="mt-1 text-sm text-slate-500">
						주간 가상 매칭 후보를 생성·검토·승인/취소합니다. 모든 변경은 감사 로그에 기록됩니다.
					</p>
				</div>
			</header>

			<div className="flex flex-wrap items-end gap-3">
				<div className="flex-1 min-w-[280px]">
					<CandidateFilters query={query} onChange={setQuery} disabled={listQuery.isFetching} />
				</div>
				<div className="flex items-center gap-2 pb-1">
					<Button
						variant="outline"
						onClick={() => openAction('approve')}
						disabled={selectedCount === 0}
					>
						선택 승인 ({selectedCount})
					</Button>
					<Button
						variant="destructive"
						onClick={() => openAction('cancel')}
						disabled={selectedCount === 0}
					>
						선택 취소 ({selectedCount})
					</Button>
					<CandidateGenerateDialog />
				</div>
			</div>

			{listQuery.isError ? (
				<Alert variant="destructive">
					<AlertDescription>
						{getAdminErrorMessage(listQuery.error)}
					</AlertDescription>
				</Alert>
			) : null}

			<CandidateTableView
				items={items}
				isLoading={listQuery.isLoading}
				selectedIds={selectedIds}
				onToggleOne={handleToggleOne}
				onToggleAll={handleToggleAll}
			/>

			<Pager
				page={page}
				totalPages={totalPages}
				total={total}
				totalUnit="건"
				disabled={listQuery.isFetching}
				onPrev={() =>
					setQuery((prev) => ({ ...prev, page: Math.max(1, (prev.page ?? 1) - 1) }))
				}
				onNext={() =>
					setQuery((prev) => ({ ...prev, page: Math.min(totalPages, (prev.page ?? 1) + 1) }))
				}
			/>

			<CandidateActionDialog
				open={actionDialog.open}
				action={actionDialog.action}
				candidateIds={selectedIdsArray}
				onClose={closeActionDialog}
			/>
		</section>
	);
}
