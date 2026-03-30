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

export const featureFlags = {
	getAll: async (): Promise<FeatureFlag[]> => {
		const result = await adminGet<{ data: FeatureFlag[] }>('/admin/v2/feature-flags');
		return result.data;
	},

	toggle: async (name: string, enabled: boolean): Promise<FeatureFlag> => {
		return adminPatch<FeatureFlag>(`/admin/v2/feature-flags/${name}/toggle`, { enabled });
	},

	update: async (
		name: string,
		data: { description?: string; enabled?: boolean; allowedRoles?: string[] },
	): Promise<FeatureFlag> => {
		return adminPatch<FeatureFlag>(`/admin/v2/feature-flags/${name}`, data);
	},
};
