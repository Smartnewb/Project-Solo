'use client';

import { useMemo } from 'react';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { aiProfileReferences } from '@/app/services/admin/ai-profile-references';
import { attachPoolKeys } from '../../_shared/query-keys';
import type {
	AgeBucket,
	ListReferencePhotosQuery,
	ListReferencePhotosResponse,
} from '@/app/types/ghost-injection';

export interface UseReferencePoolFilter {
	ageBucket?: AgeBucket;
	tagMood?: string;
	tagSetting?: string;
	tagStyle?: string;
	sortBy?: 'usage_asc' | 'curated_desc';
}

export function useReferencePool(
	filter: UseReferencePoolFilter,
	excludeIds: ReadonlySet<string> | readonly string[],
	enabled = true,
) {
	const sortedExclude = useMemo(() => [...excludeIds].sort(), [excludeIds]);

	return useInfiniteQuery({
		queryKey: attachPoolKeys.list({ ...filter }),
		enabled,
		initialPageParam: undefined as string | undefined,
		queryFn: async ({ pageParam }) => {
			const query: ListReferencePhotosQuery = {
				...filter,
				isActive: true,
				excludeIds: sortedExclude,
				limit: 30,
				cursor: pageParam,
			};
			return aiProfileReferences.listPhotos(query);
		},
		getNextPageParam: (last: ListReferencePhotosResponse) =>
			last.meta.nextCursor ?? undefined,
		staleTime: 60_000,
		gcTime: 600_000,
		placeholderData: keepPreviousData,
	});
}
