import { adminGet, adminPost, adminPut } from '@/shared/lib/http/admin-fetch';

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
		return adminPost<VersionUpdate>('/admin/version-updates', data);
	},

	getAllVersionUpdates: async (): Promise<VersionUpdate[]> => {
		return adminGet<VersionUpdate[]>('/admin/version-updates');
	},

	getVersionUpdate: async (id: string): Promise<VersionUpdate> => {
		return adminGet<VersionUpdate>(`/admin/version-updates/${id}`);
	},

	getLatestVersionUpdate: async (): Promise<VersionUpdate> => {
		return adminGet<VersionUpdate>('/admin/version-updates/latest');
	},

	updateVersionUpdate: async (id: string, data: UpdateVersionUpdateRequest): Promise<{ success: boolean; message: string }> => {
		return adminPut<{ success: boolean; message: string }>(`/admin/version-updates/${id}`, data);
	},
};

export default versionService;
