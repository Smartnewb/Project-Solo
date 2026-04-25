'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import type { AgeBucket, ReferencePhotoListItem } from '@/app/types/ghost-injection';
import { PoolFilterBar } from './pool-filter-bar';
import { PoolPhotoCard } from './pool-photo-card';
import { useReferencePool } from './use-reference-pool';
import type { PoolFilterState } from './use-ghost-batch-setup';

interface PoolBrowserProps {
	ageBucket: AgeBucket | null;
	filter: PoolFilterState;
	onFilterChange: (next: PoolFilterState) => void;
	usedPhotoIds: Set<string>;
	onPickPhoto: (photo: ReferencePhotoListItem) => void;
	enabled: boolean;
}

export function PoolBrowser({
	ageBucket,
	filter,
	onFilterChange,
	usedPhotoIds,
	onPickPhoto,
	enabled,
}: PoolBrowserProps) {
	const query = useReferencePool(
		{
			ageBucket: ageBucket ?? undefined,
			tagMood: filter.tagMood,
			tagStyle: filter.tagStyle,
			tagSetting: filter.tagSetting,
			sortBy: filter.sortBy,
		},
		usedPhotoIds,
		enabled,
	);

	const sentinelRef = useRef<HTMLDivElement | null>(null);
	const fetchNextRef = useRef(query.fetchNextPage);
	const hasNextRef = useRef(query.hasNextPage);
	const isFetchingRef = useRef(query.isFetchingNextPage);
	fetchNextRef.current = query.fetchNextPage;
	hasNextRef.current = query.hasNextPage;
	isFetchingRef.current = query.isFetchingNextPage;

	useEffect(() => {
		const el = sentinelRef.current;
		if (!el) return;
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting && hasNextRef.current && !isFetchingRef.current) {
						fetchNextRef.current();
					}
				}
			},
			{ rootMargin: '120px' },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	const pages = query.data?.pages;
	const facets = pages?.[0]?.facets;
	const totalAvailable = pages?.[0]?.meta.totalItems ?? 0;
	const items = useMemo(() => pages?.flatMap((p) => p.items) ?? [], [pages]);

	const renderBody = () => {
		if (!enabled) return <EmptyState text="이미지 소스를 '참조 풀'로 선택하세요." />;
		if (query.isLoading) return <LoadingState />;
		if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;
		if (items.length === 0) return <EmptyState text="조건에 맞는 사진이 없습니다." />;
		return (
			<>
				<div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
					{items.map((photo) => {
						const used = usedPhotoIds.has(photo.id);
						return (
							<PoolPhotoCard
								key={photo.id}
								photo={photo}
								disabled={used}
								selected={used}
								onClick={() => onPickPhoto(photo)}
							/>
						);
					})}
				</div>
				<div ref={sentinelRef} className="h-6" />
				{query.isFetchingNextPage ? (
					<div className="flex justify-center py-2">
						<Loader2 className="h-4 w-4 animate-spin text-slate-400" />
					</div>
				) : null}
			</>
		);
	};

	return (
		<div className="flex h-full flex-col border-r">
			<div className="flex items-center justify-between border-b px-3 py-2">
				<h3 className="text-sm font-semibold text-slate-900">참조 풀</h3>
				<span className="text-xs text-slate-500 tabular-nums">
					{items.length}/{totalAvailable}장
				</span>
			</div>
			<PoolFilterBar value={filter} facets={facets} onChange={onFilterChange} />
			<div className="flex-1 overflow-y-auto p-3">{renderBody()}</div>
		</div>
	);
}

function LoadingState() {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-2 py-12 text-slate-500">
			<Loader2 className="h-6 w-6 animate-spin" />
			<p className="text-xs">불러오는 중…</p>
		</div>
	);
}

function EmptyState({ text }: { text: string }) {
	return (
		<div className="flex h-full items-center justify-center py-12 text-xs text-slate-500">
			{text}
		</div>
	);
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-2 py-12 text-slate-500">
			<p className="text-xs text-red-600">풀 조회에 실패했습니다.</p>
			<Button size="sm" variant="outline" onClick={onRetry}>
				다시 시도
			</Button>
		</div>
	);
}
