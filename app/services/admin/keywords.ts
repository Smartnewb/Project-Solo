import { adminGet, adminPost, adminPatch, adminDelete } from '@/shared/lib/http/admin-fetch';

export const KEYWORD_CATEGORIES = {
	HOBBY: '취미',
	FOOD: '음식',
	MUSIC: '음악',
	TRAVEL: '여행',
	SPORT: '운동',
	CULTURE: '문화',
	LIFESTYLE: '라이프',
	STUDY: '학업',
	OTHER: '기타',
} as const;

export type KeywordCategory = keyof typeof KEYWORD_CATEGORIES;

export interface KeywordItem {
	keyword: string;
	normalizedKeyword: string;
	category: KeywordCategory;
	userCount: number;
	iconUrl: string | null;
	firstCreatedAt: string;
}

export interface KeywordsResponse {
	items: KeywordItem[];
	total: number;
	page: number;
	pageSize: number;
	hasMore: boolean;
}

export const keywords = {
	getAll: async (params: { page?: number; pageSize?: number; search?: string }) => {
		const queryParams: Record<string, string> = {};
		if (params.page != null) queryParams.page = String(params.page);
		if (params.pageSize != null) queryParams.pageSize = String(params.pageSize);
		if (params.search) queryParams.search = params.search;
		const res = await adminGet<{ data: KeywordsResponse }>('/admin/v2/keywords', queryParams);
		return res.data;
	},

	updateIcon: async (normalizedKeyword: string, iconUrl: string) => {
		const res = await adminPatch<{ data: { success: boolean } }>(
			'/admin/v2/keywords/icon',
			{ normalizedKeyword, iconUrl },
		);
		return res.data;
	},

	updateName: async (oldKeyword: string, newKeyword: string) => {
		const res = await adminPatch<{ data: { updatedCount: number } }>(
			'/admin/v2/keywords/name',
			{ oldKeyword, newKeyword },
		);
		return res.data;
	},

	updateCategory: async (normalizedKeyword: string, category: KeywordCategory) => {
		const res = await adminPatch<{ data: { updatedCount: number } }>(
			'/admin/v2/keywords/category',
			{ normalizedKeyword, category },
		);
		return res.data;
	},

	delete: async (keyword: string) => {
		const encoded = encodeURIComponent(keyword);
		const res = await adminDelete<{ data: { deletedCount: number } }>(
			`/admin/v2/keywords/${encoded}`,
		);
		return res.data;
	},

	generateIcon: async (keyword: string) => {
		const res = await adminPost<{ data: { queued: boolean; keyword: string } }>(
			'/admin/v2/keywords/icon/generate',
			{ keyword },
		);
		return res.data;
	},

	generateIconWithPrompt: async (keyword: string, prompt: string) => {
		const res = await adminPost<{ data: { queued: boolean; keyword: string } }>(
			'/admin/v2/keywords/icon/generate-with-prompt',
			{ keyword, prompt },
		);
		return res.data;
	},

	generateIconBatch: async () => {
		const res = await adminPost<{ data: { queued: number; skipped: number } }>(
			'/admin/v2/keywords/icon/generate-batch',
		);
		return res.data;
	},

	getIconQueueStats: async () => {
		const res = await adminGet<{ data: { waiting: number; active: number; completed: number; failed: number } }>(
			'/admin/v2/keywords/icon/queue-stats',
		);
		return res.data;
	},
};
