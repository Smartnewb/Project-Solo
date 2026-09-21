import {
	adminGet,
	adminPost,
	type AdminQueryParams,
} from '@/shared/lib/http/admin-fetch';
import type {
	AutoMatchReferenceBody,
	AutoMatchReferenceResponse,
	ListReferencePhotosQuery,
	ListReferencePhotosResponse,
} from '@/app/types/ghost-injection';

const BASE = '/admin/ghost-injection/reference-photos';

export const aiProfileReferences = {
	listPhotos: (query: ListReferencePhotosQuery = {}) => {
		const { excludeIds, ...rest } = query;
		const params: AdminQueryParams = { ...rest };
		if (excludeIds && excludeIds.length > 0) {
			params.excludeIds = excludeIds.join(',');
		}
		return adminGet<ListReferencePhotosResponse>(BASE, params);
	},

	autoMatch: (body: AutoMatchReferenceBody) =>
		adminPost<AutoMatchReferenceResponse>(`${BASE}/auto-match`, body),
};

export type AiProfileReferencesService = typeof aiProfileReferences;
