'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
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
	excludeIds: string[],
	enabled = true,
) {
	const sortedExclude = [...excludeIds].sort();
	const queryFilter: Record<string, unknown> = {
		...filter,
		excludeKey: sortedExclude.join(','),
	};

	return useInfiniteQuery({
		queryKey: attachPoolKeys.list(queryFilter),
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
		staleTime: 10_000,
	});
}
