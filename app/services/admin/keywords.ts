import axiosServer from '@/utils/axios';
import { getCountryHeader } from './_shared';

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
		const country = getCountryHeader();
		const response = await axiosServer.get<KeywordsResponse>('/v4/admin/keywords', {
			params,
			headers: { 'X-Country': country },
		});
		return response.data;
	},

	updateIcon: async (normalizedKeyword: string, iconUrl: string) => {
		const country = getCountryHeader();
		const response = await axiosServer.patch<{ success: boolean }>(
			'/v4/admin/keywords/icon',
			{ normalizedKeyword, iconUrl },
			{ headers: { 'X-Country': country } },
		);
		return response.data;
	},

	updateName: async (oldKeyword: string, newKeyword: string) => {
		const country = getCountryHeader();
		const response = await axiosServer.patch<{ updatedCount: number }>(
			'/v4/admin/keywords/name',
			{ oldKeyword, newKeyword },
			{ headers: { 'X-Country': country } },
		);
		return response.data;
	},

	updateCategory: async (normalizedKeyword: string, category: KeywordCategory) => {
		const country = getCountryHeader();
		const response = await axiosServer.patch<{ updatedCount: number }>(
			'/v4/admin/keywords/category',
			{ normalizedKeyword, category },
			{ headers: { 'X-Country': country } },
		);
		return response.data;
	},

	delete: async (keyword: string) => {
		const country = getCountryHeader();
		const encoded = encodeURIComponent(keyword);
		const response = await axiosServer.delete<{ deletedCount: number }>(
			`/v4/admin/keywords/${encoded}`,
			{ headers: { 'X-Country': country } },
		);
		return response.data;
	},
};
