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
		return adminGet<FeatureFlag[]>('/admin/feature-flags');
	},

	toggle: async (name: string, enabled: boolean): Promise<FeatureFlag> => {
		return adminPatch<FeatureFlag>(`/admin/feature-flags/${name}/toggle`, { enabled });
	},

	update: async (
		name: string,
		data: { description?: string; enabled?: boolean; allowedRoles?: string[] },
	): Promise<FeatureFlag> => {
		return adminPatch<FeatureFlag>(`/admin/feature-flags/${name}`, data);
	},
};
