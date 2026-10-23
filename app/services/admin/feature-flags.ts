import { adminGet, adminPatch } from '@/shared/lib/http/admin-fetch';

export interface FeatureFlag {
	id: string;
	name: string;
	description: string;
	enabled: boolean;
	allowedRoles: string[];
	allowedUserIds: string[];
	allowTestUsers: boolean;
	rolloutPercentage: number;
	country: string | null;
	createdAt: string | null;
	updatedAt: string | null;
}

export interface FeatureFlagChange {
	id: string;
	flagName: string;
	action: string;
	diff: { before?: Record<string, unknown>; after?: Record<string, unknown> } | null;
	adminUserId: string;
	adminName: string | null;
	createdAt: string;
}

type FeatureFlagResponse = Omit<
	FeatureFlag,
	'allowedRoles' | 'allowedUserIds' | 'allowTestUsers' | 'rolloutPercentage'
> & {
	allowedRoles?: string[] | null;
	allowedUserIds?: string[] | null;
	allowTestUsers?: boolean | null;
	rolloutPercentage?: number | null;
};

function normalizeFeatureFlag(flag: FeatureFlagResponse): FeatureFlag {
	return {
		...flag,
		description: flag.description ?? '',
		allowedRoles: Array.isArray(flag.allowedRoles) ? flag.allowedRoles : [],
		allowedUserIds: Array.isArray(flag.allowedUserIds) ? flag.allowedUserIds : [],
		allowTestUsers: flag.allowTestUsers === true,
		rolloutPercentage: typeof flag.rolloutPercentage === 'number' ? flag.rolloutPercentage : 0,
	};
}

export const featureFlags = {
	getAll: async (): Promise<FeatureFlag[]> => {
		const result = await adminGet<{ data: FeatureFlagResponse[] | null }>('/admin/v2/feature-flags');
		return Array.isArray(result.data) ? result.data.map(normalizeFeatureFlag) : [];
	},

	getChanges: async (limit = 50): Promise<FeatureFlagChange[]> => {
		const result = await adminGet<{ data: FeatureFlagChange[] | null }>(
			'/admin/v2/feature-flags/changes',
			{ limit },
		);
		return Array.isArray(result.data) ? result.data : [];
	},

	toggle: async (name: string, enabled: boolean): Promise<FeatureFlag> => {
		const res = await adminPatch<{ data: FeatureFlagResponse }>(`/admin/v2/feature-flags/${name}/toggle`, { enabled });
		return normalizeFeatureFlag(res.data);
	},

	update: async (
		name: string,
		data: { description?: string; enabled?: boolean; allowedRoles?: string[] },
	): Promise<FeatureFlag> => {
		const res = await adminPatch<{ data: FeatureFlagResponse }>(`/admin/v2/feature-flags/${name}`, data);
		return normalizeFeatureFlag(res.data);
	},
};
