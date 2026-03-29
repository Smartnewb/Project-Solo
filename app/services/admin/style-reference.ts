// app/services/admin/style-reference.ts
import { adminGet, adminPost, adminDelete } from '@/shared/lib/http/admin-fetch';
import type { StyleCategory, StyleGender } from '@/app/admin/style-reference/constants';

export interface StyleReferenceItem {
	id: string;
	imageUrl: string;
	thumbnailUrl: string | null;
	tags: string[];
	category: StyleCategory;
	gender: StyleGender;
	sortOrder: number;
	isActive: boolean;
	createdAt: string;
}

export interface StyleReferenceListResponse {
	items: StyleReferenceItem[];
	total: number;
	page: number;
	pageSize: number;
	hasMore: boolean;
}

export interface StyleReferenceStatsItem {
	gender: 'MALE' | 'FEMALE';
	category: 'VIBE' | 'FASHION' | 'COLOR_TONE';
	count: number;
	activeCount: number;
}

export interface StyleReferenceStats {
	stats: StyleReferenceStatsItem[];
}

export interface CreateStyleReferenceRequest {
	imageUrl: string;
	thumbnailUrl?: string;
	tags?: string[];
	category: StyleCategory;
	gender: StyleGender;
	sortOrder?: number;
}

export interface BulkCreateResult {
	created: number;
	analyzed: number;
	errors: string[];
}

export interface StyleReferenceListParams {
	page?: number;
	pageSize?: number;
	gender?: 'MALE' | 'FEMALE';
	category?: 'VIBE' | 'FASHION' | 'COLOR_TONE';
}

export const styleReference = {
	getList: async (params: StyleReferenceListParams = {}): Promise<StyleReferenceListResponse> => {
		const queryParams: Record<string, string> = {};
		if (params.page != null) queryParams.page = String(params.page);
		if (params.pageSize != null) queryParams.pageSize = String(params.pageSize);
		if (params.gender) queryParams.gender = params.gender;
		if (params.category) queryParams.category = params.category;
		return adminGet<StyleReferenceListResponse>('/v4/admin/style-reference', queryParams);
	},

	create: async (data: CreateStyleReferenceRequest): Promise<StyleReferenceItem> => {
		return adminPost<StyleReferenceItem>('/v4/admin/style-reference', data);
	},

	bulkCreate: async (items: CreateStyleReferenceRequest[]): Promise<BulkCreateResult> => {
		return adminPost<BulkCreateResult>('/v4/admin/style-reference/bulk', { items });
	},

	deactivate: async (id: string): Promise<{ success: boolean }> => {
		return adminDelete<{ success: boolean }>(`/v4/admin/style-reference/${id}`);
	},

	reactivate: async (id: string): Promise<{ success: boolean }> => {
		return adminPost<{ success: boolean }>(`/v4/admin/style-reference/${id}/reactivate`);
	},

	getStats: async (): Promise<StyleReferenceStats> => {
		return adminGet<StyleReferenceStats>('/v4/admin/style-reference/stats');
	},
};
