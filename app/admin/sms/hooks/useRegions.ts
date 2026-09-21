'use client';

import { useQuery } from '@tanstack/react-query';
import { universities as universitiesService } from '@/app/services/admin/system';
import type { RegionMetaItem, UniversityItem, UniversityListResponse } from '@/types/admin';

export interface RegionOption {
	code: string;
	name: string;
}

export interface UniversityOption {
	id: string;
	name: string;
	region?: string;
}

export const useRegions = () =>
	useQuery<RegionOption[]>({
		queryKey: ['admin', 'universities', 'regions'],
		queryFn: async () => {
			const regions = (await universitiesService.meta.getRegions()) as RegionMetaItem[];
			return regions.map((r) => ({
				code: r.code,
				name: r.nameLocal ?? r.name ?? r.code,
			}));
		},
		staleTime: Number.POSITIVE_INFINITY,
	});

export const useUniversitiesByRegions = (regionCodes: string[]) => {
	const sortedKey = [...regionCodes].sort();
	return useQuery<UniversityOption[]>({
		queryKey: ['admin', 'universities', 'by-regions', sortedKey],
		queryFn: async () => {
			const results = (await Promise.all(
				regionCodes.map((code) =>
					universitiesService.getList({ region: code, limit: 100, isActive: true }),
				),
			)) as UniversityListResponse[];
			const all = results.flatMap((r) => r?.items ?? []);
			return all.map((u: UniversityItem) => ({
				id: u.id,
				name: u.name,
				region: u.region,
			}));
		},
		enabled: regionCodes.length > 0,
		staleTime: 5 * 60_000,
	});
};
