import { adminGet, adminPost, adminPatch, adminDelete } from '@/shared/lib/http/admin-fetch';

export interface UtmLink {
	id: string;
	name: string;
	utmSource: string;
	utmMedium: string;
	utmCampaign: string;
	utmContent: string | null;
	utmTerm?: string | null;
	utmId?: string | null;
	utmSourcePlatform?: string | null;
	utmCreativeFormat?: string | null;
	utmMarketingTactic?: string | null;
	destinationType: string;
	destinationUrl: string;
	shortCode: string;
	shortUrl?: string;
	memo: string | null;
	createdAt: string;
	clickCount?: number;
	signupCount?: number;
	externalSource?: string | null;
	externalId?: string | null;
	adAccountId?: string | null;
	campaignId?: string | null;
	adsetId?: string | null;
	adGroupId?: string | null;
	adId?: string | null;
	creativeId?: string | null;
	bindings?: UtmPlatformBinding[];
}

export interface UtmPlatformBinding {
	platform: string;
	adAccountId?: string | null;
	campaignId?: string | null;
	campaignName?: string | null;
	adsetId?: string | null;
	adsetName?: string | null;
	adGroupId?: string | null;
	adGroupName?: string | null;
	adId?: string | null;
	adName?: string | null;
	creativeId?: string | null;
	creativeName?: string | null;
	keywordId?: string | null;
	criterionId?: string | null;
	placement?: string | null;
	siteSourceName?: string | null;
}

export interface UtmDrilldownRow {
	key: string;
	label: string;
	platform?: string | null;
	utmLinkId?: string | null;
	clicks: number;
	signups: number;
	profileApproved: number;
	purchases: number;
	signupRate: number;
	purchaseRate: number;
}

export interface UtmConversionExportRow {
	platform: string;
	conversionType: string;
	eventId?: string | null;
	attributionId?: string | null;
	status: string;
	attempts: number;
	lastError?: string | null;
	nextRetryAt?: string | null;
}

export interface UtmConversionExportResponse {
	rows: UtmConversionExportRow[];
	countsByStatus: Record<string, number>;
}

export interface UtmLinkFlow {
	link: UtmLink | null;
	bindings: UtmPlatformBinding[];
	touches: Array<{
		id: string;
		attributionId: string;
		touchId?: string | null;
		utmSource?: string | null;
		utmCampaign?: string | null;
		utmContent?: string | null;
		utmId?: string | null;
		createdAt: string;
	}>;
	conversions: Array<{
		id: string;
		eventName: string;
		eventId?: string | null;
		attributionId: string;
		occurredAt: string;
	}>;
	exports: UtmConversionExportRow[];
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
	content?: string;
	clicks: number;
	signups: number;
	purchases: number;
	signupRate?: number;
	purchaseRate?: number;
}

export interface UtmAttributionHealth {
	metaCapi: {
		total: number;
		sent: number;
		failed: number;
		pending: number;
		skipped: number;
		successRate: number;
	};
	dedup: {
		eligibleEvents: number;
		totalAttributionRows: number;
		eventIdCoverageRate: number;
	};
	linkage: {
		totalConversions: number;
		linkedConversions: number;
		attributionIdCoverageRate: number;
	};
	ga4Firebase: {
		trustTier: string;
		status: string;
	};
	skan: {
		reportingDelayHours: string;
	};
}

export interface UtmDashboardSurfaces {
	metaDeliveryActions: {
		spend: number | null;
		impressions: number | null;
		linkClicks: number | null;
		metaRegistrations: number;
		metaPurchases: number;
		source: string;
		status: string;
		countsByStatus: Record<string, number>;
		note: string;
	};
	webUtmTraffic: {
		total: number;
		redirect: number;
		pageVisit: number;
		setup: number;
		internal: number;
		bot: number;
		external: number;
		repeat: number;
		uniqueTouch: number;
		monitoredCore: number;
		extraMonitored: number;
	};
	appSignupCohort: {
		dbSignups: number;
		approved: number;
		purchasers: number;
		payments: number;
		revenue: number;
		coreSignups: number;
		extraSignups: number;
		coverage: {
			attributionId: number;
			paymentEventId: number;
		};
		includeExtraMonitored: boolean;
	};
}

export interface UtmReconciliationRow {
	id: string;
	userId: string;
	attributionId: string | null;
	touchId: string | null;
	utmLinkId: string | null;
	sessionId: string | null;
	signupEventId: string | null;
	paymentEventId: string | null;
	fbclid: string | null;
	fbc: string | null;
	fbp: string | null;
	osName: string;
	appBundleId: string | null;
	appVersion: string;
	platform: string;
	preFixPostFix: string;
	utmSource: string | null;
	utmCampaign: string | null;
	userStatus: string | null;
	hasPayment: boolean;
	amount: number;
	currency: string | null;
	metaCapi: {
		status: string;
		eventsReceived: number;
		error: string | null;
	};
	createdAt: string;
}

export interface UtmReconciliationResponse {
	rows: UtmReconciliationRow[];
	breakdown: {
		platform: Array<{ key: string; count: number }>;
		appVersion: Array<{ key: string; count: number }>;
		preFixPostFix: Array<{ key: string; count: number }>;
	};
	coverage: {
		total: number;
		withAttributionId: number;
		withSignupEventId: number;
		withPayment: number;
		withPaymentEventId: number;
		withMetaCapiEvent: number;
	};
}

type UtmLinkQuery = {
	page?: number;
	search?: string;
	utmSource?: string;
	utmCampaign?: string;
	utmContent?: string;
	utmTerm?: string;
	platform?: string;
	campaignId?: string;
	adsetId?: string;
	adGroupId?: string;
	adId?: string;
	creativeId?: string;
};

type ConversionExportQuery = {
	startDate: string;
	endDate: string;
	platform?: string;
	conversionType?: string;
	status?: string;
};

type SurfacesQuery = {
	startDate: string;
	endDate: string;
	includeExtraMonitored?: boolean;
};

type CreateUtmLinkInput = {
	name: string;
	utmSource: string;
	utmMedium: string;
	utmCampaign: string;
	utmContent?: string;
	utmTerm?: string;
	utmId?: string;
	utmSourcePlatform?: string;
	utmCreativeFormat?: string;
	utmMarketingTactic?: string;
	destinationType: string;
	memo?: string;
	platformBindings?: UtmPlatformBinding[];
};

export const utm = {
	getLinks: async (params?: UtmLinkQuery) => {
		const query: Record<string, string> = {};
		for (const [key, value] of Object.entries(params ?? {})) {
			if (value != null && value !== '') query[key] = String(value);
		}
		return adminGet<{ data: UtmLink[]; meta: { total: number; page: number; limit: number } }>('/admin/v2/utm/links', query);
	},

	createLink: async (data: CreateUtmLinkInput) => {
		const result = await adminPost<{ data: UtmLink }>('/admin/v2/utm/links', data);
		return result.data;
	},

	updateLink: async (id: string, data: Partial<CreateUtmLinkInput>) => {
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
		const result = await adminGet<{ data: UtmCampaignRow[] }>(`/admin/v2/utm/dashboard/campaigns/${encodeURIComponent(source)}`, { startDate, endDate });
		return result.data;
	},

	getContents: async (source: string, campaign: string, startDate: string, endDate: string) => {
		const result = await adminGet<{ data: UtmCampaignRow[] }>(
			`/admin/v2/utm/dashboard/campaigns/${encodeURIComponent(source)}/${encodeURIComponent(campaign)}/contents`,
			{ startDate, endDate },
		);
		return result.data;
	},

	getAttributionHealth: async (startDate: string, endDate: string) => {
		const result = await adminGet<{ data: UtmAttributionHealth }>('/admin/v2/utm/dashboard/attribution-health', { startDate, endDate });
		return result.data;
	},

	getSurfaces: async (params: SurfacesQuery) => {
		const result = await adminGet<{ data: UtmDashboardSurfaces }>('/admin/v2/utm/dashboard/surfaces', {
			startDate: params.startDate,
			endDate: params.endDate,
			includeExtraMonitored: params.includeExtraMonitored ? 'true' : 'false',
		});
		return result.data;
	},

	getReconciliation: async (startDate: string, endDate: string) => {
		const result = await adminGet<{ data: UtmReconciliationResponse }>('/admin/v2/utm/dashboard/reconciliation', { startDate, endDate });
		return result.data;
	},

	getDrilldown: async (params: Record<string, string>) => {
		const result = await adminGet<{ data: UtmDrilldownRow[] }>('/admin/v2/utm/dashboard/drilldown', params);
		return result.data;
	},

	getLinkFlow: async (utmLinkId: string, params: Record<string, string>) => {
		const result = await adminGet<{ data: UtmLinkFlow }>(`/admin/v2/utm/dashboard/links/${utmLinkId}/flow`, params);
		return result.data;
	},

	getPlatformBindings: async (params: Record<string, string>) => {
		const result = await adminGet<{ data: UtmPlatformBinding[] }>('/admin/v2/utm/dashboard/platform-bindings', params);
		return result.data;
	},

	getConversionExports: async (params: ConversionExportQuery) => {
		const result = await adminGet<{ data: UtmConversionExportResponse }>('/admin/v2/utm/dashboard/conversion-exports', params);
		return result.data;
	},
};
