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
		const res = await adminGet<{ data: StyleReferenceListResponse }>('/admin/v2/style-reference', queryParams);
		return res.data;
	},

	create: async (data: CreateStyleReferenceRequest): Promise<StyleReferenceItem> => {
		const res = await adminPost<{ data: StyleReferenceItem }>('/admin/v2/style-reference', data);
		return res.data;
	},

	bulkCreate: async (items: CreateStyleReferenceRequest[]): Promise<BulkCreateResult> => {
		const res = await adminPost<{ data: BulkCreateResult }>('/admin/v2/style-reference/bulk', { items });
		return res.data;
	},

	deactivate: async (id: string): Promise<{ success: boolean }> => {
		const res = await adminDelete<{ data: { success: boolean } }>(`/admin/v2/style-reference/${id}`);
		return res.data;
	},

	reactivate: async (id: string): Promise<{ success: boolean }> => {
		const res = await adminPost<{ data: { success: boolean } }>(`/admin/v2/style-reference/${id}/reactivate`);
		return res.data;
	},

	getStats: async (): Promise<StyleReferenceStats> => {
		const res = await adminGet<{ data: StyleReferenceStats }>('/admin/v2/style-reference/stats');
		return res.data;
	},
};
