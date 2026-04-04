import { adminGet, adminPost, adminPut } from '@/shared/lib/http/admin-fetch';

interface V2Response<T> {
	data: T;
}

export interface VersionUpdate {
	id: string;
	version: string;
	metadata: {
		description: string[];
	};
	shouldUpdate: boolean;
	createdAt: string;
}

export interface CreateVersionUpdateRequest {
	version: string;
	metadata: {
		description: string[];
	};
	shouldUpdate: boolean;
}

export interface UpdateVersionUpdateRequest {
	version?: string;
	metadata?: {
		description: string[];
	};
	shouldUpdate?: boolean;
}

const versionService = {
	createVersionUpdate: async (data: CreateVersionUpdateRequest): Promise<VersionUpdate> => {
		const response = await adminPost<V2Response<VersionUpdate>>('/admin/v2/version-updates', data);
		return response.data;
	},

	getAllVersionUpdates: async (): Promise<VersionUpdate[]> => {
		const response = await adminGet<V2Response<VersionUpdate[]>>('/admin/v2/version-updates');
		return response.data;
	},

	getVersionUpdate: async (id: string): Promise<VersionUpdate> => {
		const response = await adminGet<V2Response<VersionUpdate>>(`/admin/v2/version-updates/${id}`);
		return response.data;
	},

	getLatestVersionUpdate: async (): Promise<VersionUpdate> => {
		const response = await adminGet<V2Response<VersionUpdate>>('/admin/v2/version-updates/latest');
		return response.data;
	},

	updateVersionUpdate: async (id: string, data: UpdateVersionUpdateRequest): Promise<VersionUpdate> => {
		const response = await adminPut<V2Response<VersionUpdate>>(`/admin/v2/version-updates/${id}`, data);
		return response.data;
	},
};

export default versionService;
