import axiosServer from '@/utils/axios';

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
		const res = await axiosServer.get('/admin/feature-flags');
		return res.data;
	},

	toggle: async (name: string, enabled: boolean): Promise<FeatureFlag> => {
		const res = await axiosServer.patch(`/admin/feature-flags/${name}/toggle`, { enabled });
		return res.data;
	},

	update: async (
		name: string,
		data: { description?: string; enabled?: boolean; allowedRoles?: string[] },
	): Promise<FeatureFlag> => {
		const res = await axiosServer.patch(`/admin/feature-flags/${name}`, data);
		return res.data;
	},
};
