import { adminGet, adminPost, adminPatch, adminDelete } from '@/shared/lib/http/admin-fetch';

export interface UtmLink {
	id: string;
	name: string;
	utmSource: string;
	utmMedium: string;
	utmCampaign: string;
	utmContent: string | null;
	destinationType: string;
	destinationUrl: string;
	shortCode: string;
	shortUrl?: string;
	memo: string | null;
	createdAt: string;
	clickCount?: number;
	signupCount?: number;
}

export interface UtmDashboardSummary {
	pageVisit: { count: number; change: number | null };
	signup: { count: number; change: number | null };
	profileApproved: { count: number; change: number | null };
	firstPurchase: { count: number; change: number | null };
}

export interface UtmFunnelStep {
	step: string;
	count: number;
	rate: number;
}

export interface UtmChannelRow {
	source: string;
	clicks: number;
	signups: number;
	signupRate: number;
	approved: number;
	purchases: number;
	purchaseRate: number;
}

export interface UtmCampaignRow {
	campaign: string;
	clicks: number;
	signups: number;
	purchases: number;
}

export const utm = {
	getLinks: async (params?: { page?: number; search?: string; utmSource?: string }) => {
		const query: Record<string, string> = {};
		if (params?.page != null) query.page = String(params.page);
		if (params?.search) query.search = params.search;
		if (params?.utmSource) query.utmSource = params.utmSource;
		return adminGet<{ data: UtmLink[]; meta: { total: number; page: number; limit: number } }>('/admin/v2/utm/links', query);
	},

	createLink: async (data: {
		name: string;
		utmSource: string;
		utmMedium: string;
		utmCampaign: string;
		utmContent?: string;
		destinationType: string;
		memo?: string;
	}) => {
		const result = await adminPost<{ data: UtmLink }>('/admin/v2/utm/links', data);
		return result.data;
	},

	updateLink: async (id: string, data: { name?: string; memo?: string }) => {
		const result = await adminPatch<{ data: UtmLink }>(`/admin/v2/utm/links/${id}`, data);
		return result.data;
	},

	deleteLink: async (id: string) => {
		await adminDelete(`/admin/v2/utm/links/${id}`);
	},

	getSummary: async (startDate: string, endDate: string, utmSource?: string, utmCampaign?: string) => {
		const params: Record<string, string> = { startDate, endDate };
		if (utmSource) params.utmSource = utmSource;
		if (utmCampaign) params.utmCampaign = utmCampaign;
		const result = await adminGet<{ data: UtmDashboardSummary }>('/admin/v2/utm/dashboard', params);
		return result.data;
	},

	getFunnel: async (startDate: string, endDate: string, utmSource?: string, utmCampaign?: string) => {
		const params: Record<string, string> = { startDate, endDate };
		if (utmSource) params.utmSource = utmSource;
		if (utmCampaign) params.utmCampaign = utmCampaign;
		const result = await adminGet<{ data: UtmFunnelStep[] }>('/admin/v2/utm/dashboard/funnel', params);
		return result.data;
	},

	getChannels: async (startDate: string, endDate: string) => {
		const result = await adminGet<{ data: UtmChannelRow[] }>('/admin/v2/utm/dashboard/channels', { startDate, endDate });
		return result.data;
	},

	getCampaigns: async (source: string, startDate: string, endDate: string) => {
		const result = await adminGet<{ data: UtmCampaignRow[] }>(`/admin/v2/utm/dashboard/campaigns/${source}`, { startDate, endDate });
		return result.data;
	},
};
