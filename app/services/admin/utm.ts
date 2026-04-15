import { adminGet, adminPost, adminPatch, adminDelete } from '@/shared/lib/http/admin-fetch';

type WrappedPayload<T> = { data: T };

interface RawSummaryRow {
	eventType?: string;
	count?: number;
	changePercent?: number | null;
}

const SUMMARY_EVENT_TO_KEY = {
	page_visit: 'pageVisit',
	signup: 'signup',
	profile_approved: 'profileApproved',
	first_purchase: 'firstPurchase',
} as const satisfies Record<string, keyof UtmDashboardSummary>;

function isWrappedPayload<T>(value: unknown): value is WrappedPayload<T> {
	return typeof value === 'object' && value !== null && 'data' in value;
}

function unwrapPayload<T>(value: T | WrappedPayload<T>): T {
	return isWrappedPayload<T>(value) ? value.data : value;
}

function normalizeMetric(metric?: { count?: number; change?: number | null } | null) {
	return {
		count: metric?.count ?? 0,
		change: metric?.change ?? null,
	};
}

function normalizeSummary(payload: unknown): UtmDashboardSummary {
	if (Array.isArray(payload)) {
		const summary: UtmDashboardSummary = {
			pageVisit: { count: 0, change: null },
			signup: { count: 0, change: null },
			profileApproved: { count: 0, change: null },
			firstPurchase: { count: 0, change: null },
		};

		for (const row of payload as RawSummaryRow[]) {
			if (!row?.eventType) continue;
			const key = SUMMARY_EVENT_TO_KEY[row.eventType as keyof typeof SUMMARY_EVENT_TO_KEY];
			if (!key) continue;
			summary[key] = {
				count: row.count ?? 0,
				change: row.changePercent ?? null,
			};
		}

		return summary;
	}

	if (typeof payload === 'object' && payload !== null) {
		const raw = payload as Partial<UtmDashboardSummary>;
		return {
			pageVisit: normalizeMetric(raw.pageVisit),
			signup: normalizeMetric(raw.signup),
			profileApproved: normalizeMetric(raw.profileApproved),
			firstPurchase: normalizeMetric(raw.firstPurchase),
		};
	}

	throw new Error('Unexpected UTM summary response shape');
}

function normalizeArrayPayload<T>(
	payload: unknown,
	mapper: (item: unknown) => T,
	errorMessage: string,
): T[] {
	if (!Array.isArray(payload)) {
		throw new Error(errorMessage);
	}

	return payload.map(mapper);
}

function normalizeChannelRow(row: unknown): UtmChannelRow {
	const raw = (row ?? {}) as Partial<UtmChannelRow>;
	return {
		source: raw.source ?? '',
		clicks: raw.clicks ?? 0,
		signups: raw.signups ?? 0,
		signupRate: raw.signupRate ?? 0,
		approved: raw.approved ?? 0,
		purchases: raw.purchases ?? 0,
		purchaseRate: raw.purchaseRate ?? 0,
	};
}

function normalizeFunnelStep(step: unknown): UtmFunnelStep {
	const raw = (step ?? {}) as Partial<UtmFunnelStep>;
	return {
		step: raw.step ?? '',
		count: raw.count ?? 0,
		rate: raw.rate ?? 0,
	};
}

function normalizeCampaignRow(row: unknown): UtmCampaignRow {
	const raw = (row ?? {}) as Partial<UtmCampaignRow>;
	return {
		campaign: raw.campaign ?? '',
		clicks: raw.clicks ?? 0,
		signups: raw.signups ?? 0,
		purchases: raw.purchases ?? 0,
	};
}

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
		return adminGet<{ data: UtmLink[]; total: number }>('/admin/v2/utm/links', query);
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
		const result = await adminGet<UtmDashboardSummary | RawSummaryRow[] | WrappedPayload<UtmDashboardSummary | RawSummaryRow[]>>('/admin/v2/utm/dashboard', params);
		return normalizeSummary(unwrapPayload(result));
	},

	getFunnel: async (startDate: string, endDate: string, utmSource?: string, utmCampaign?: string) => {
		const params: Record<string, string> = { startDate, endDate };
		if (utmSource) params.utmSource = utmSource;
		if (utmCampaign) params.utmCampaign = utmCampaign;
		const result = await adminGet<UtmFunnelStep[] | WrappedPayload<UtmFunnelStep[]>>('/admin/v2/utm/dashboard/funnel', params);
		return normalizeArrayPayload(unwrapPayload(result), normalizeFunnelStep, 'Unexpected UTM funnel response shape');
	},

	getChannels: async (startDate: string, endDate: string) => {
		const result = await adminGet<UtmChannelRow[] | WrappedPayload<UtmChannelRow[]>>('/admin/v2/utm/dashboard/channels', { startDate, endDate });
		return normalizeArrayPayload(unwrapPayload(result), normalizeChannelRow, 'Unexpected UTM channel response shape');
	},

	getCampaigns: async (source: string, startDate: string, endDate: string) => {
		const result = await adminGet<UtmCampaignRow[] | WrappedPayload<UtmCampaignRow[]>>(`/admin/v2/utm/dashboard/campaigns/${source}`, { startDate, endDate });
		return normalizeArrayPayload(unwrapPayload(result), normalizeCampaignRow, 'Unexpected UTM campaign response shape');
	},
};
