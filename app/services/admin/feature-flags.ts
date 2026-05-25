import { adminGet, adminPatch } from '@/shared/lib/http/admin-fetch';

export interface FeatureFlag {
	id: string;
	name: string;
	description: string;
	enabled: boolean;
	allowedRoles: string[];
	country: string | null;
	createdAt: string;
	updatedAt: string;
}

type FeatureFlagResponse = Omit<FeatureFlag, 'allowedRoles'> & {
	allowedRoles?: string[] | null;
};

function normalizeFeatureFlag(flag: FeatureFlagResponse): FeatureFlag {
	return {
		...flag,
		allowedRoles: Array.isArray(flag.allowedRoles) ? flag.allowedRoles : [],
	};
}

export const featureFlags = {
	getAll: async (): Promise<FeatureFlag[]> => {
		const result = await adminGet<{ data: FeatureFlagResponse[] | null }>('/admin/v2/feature-flags');
		return Array.isArray(result.data) ? result.data.map(normalizeFeatureFlag) : [];
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
