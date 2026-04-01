import { adminGet, adminPost, adminPut, adminDelete, adminRequest, buildAdminProxyUrl } from '@/shared/lib/http/admin-fetch';

// ==================== FCM 토큰 현황 ====================
export interface FcmTokenSummary {
	totalUsers: number;
	withToken: number;
	withoutToken: number;
	iosCount: number;
	androidCount: number;
	activeUserTokenRate: number;
}

export interface FcmTokenMeta {
	platform: 'ios' | 'android';
	deviceId: string;
	isActive: boolean;
	createdAt: string;
}

export interface FcmTokenProfile {
	name: string;
	gender: 'male' | 'female' | null;
	age: number | null;
	rank: 'S' | 'A' | 'B' | 'C' | 'UNKNOWN';
	title: string | null;
	isApproved: boolean;
}

export interface FcmTokenUserItem {
	userId: string;
	email: string | null;
	name: string;
	phoneNumber: string;
	lastLoginAt: string | null;
	profile: FcmTokenProfile | null;
	tokens: FcmTokenMeta[];
}

export interface FcmTokensResponse {
	summary: FcmTokenSummary;
	items: FcmTokenUserItem[];
	meta: {
		currentPage: number;
		itemsPerPage: number;
		totalItems: number;
		hasNextPage: boolean;
		hasPreviousPage: boolean;
	};
}

export const fcmTokens = {
	getTokens: async (page: number = 1, limit: number = 20, hasToken?: boolean): Promise<FcmTokensResponse> => {
		const params: Record<string, string> = { page: String(page), limit: String(limit) };
		if (hasToken !== undefined) params.hasToken = String(hasToken);
		const result = await adminGet<{ data: FcmTokensResponse }>('/admin/v2/fcm-tokens', params);
		return result.data;
	},
};

// 대학교 및 학과 관련 API
export const universities = {
	meta: {
		getRegions: async () => {
			const result = await adminGet<{ data: { regions: any[] } }>('/admin/v2/universities/meta/regions');
			return result.data.regions;
		},

		getTypes: async () => {
			const result = await adminGet<{ data: { types: any[] } }>('/admin/v2/universities/meta/types');
			return result.data.types;
		},

		getFoundations: async () => {
			const result = await adminGet<{ data: { foundations: any[] } }>('/admin/v2/universities/meta/foundations');
			return result.data.foundations;
		},
	},

	getList: async (params?: import('@/types/admin').UniversityListParams) => {
		const stringParams: Record<string, string> = {};
		if (params) {
			for (const [k, v] of Object.entries(params)) {
				if (v != null) stringParams[k] = String(v);
			}
		}
		const result = await adminGet<{ data: any }>('/admin/v2/universities', stringParams);
		return result.data;
	},

	getById: async (id: string): Promise<import('@/types/admin').UniversityDetail> => {
		const result = await adminGet<{ data: import('@/types/admin').UniversityDetail }>(`/admin/v2/universities/${id}`);
		return result.data;
	},

	create: async (data: import('@/types/admin').CreateUniversityRequest) => {
		const result = await adminPost<{ data: any }>('/admin/v2/universities', data);
		return result.data;
	},

	update: async (id: string, data: import('@/types/admin').UpdateUniversityRequest) => {
		const result = await adminPut<{ data: any }>(`/admin/v2/universities/${id}`, data);
		return result.data;
	},

	delete: async (id: string) => {
		const result = await adminDelete<{ data: any }>(`/admin/v2/universities/${id}`);
		return result.data;
	},

	uploadLogo: async (id: string, file: File) => {
		const formData = new FormData();
		formData.append('logo', file);
		const result = await adminRequest<{ data: any }>(
			`/admin/v2/universities/${id}/logo`,
			{ method: 'POST', body: formData },
		);
		return result.data;
	},

	deleteLogo: async (id: string) => {
		const result = await adminDelete<{ data: any }>(`/admin/v2/universities/${id}/logo`);
		return result.data;
	},

	departments: {
		getList: async (
			universityId: string,
			params?: import('@/types/admin').DepartmentListParams,
		) => {
			const stringParams: Record<string, string> = {};
			if (params) {
				for (const [k, v] of Object.entries(params)) {
					if (v != null) stringParams[k] = String(v);
				}
			}
			const result = await adminGet<{ data: any }>(`/admin/v2/universities/${universityId}/departments`, stringParams);
			return result.data;
		},

		getById: async (universityId: string, id: string) => {
			const result = await adminGet<{ data: any }>(
				`/admin/v2/universities/${universityId}/departments/${id}`,
			);
			return result.data;
		},

		create: async (universityId: string, data: import('@/types/admin').CreateDepartmentRequest) => {
			const result = await adminPost<{ data: any }>(
				`/admin/v2/universities/${universityId}/departments`,
				data,
			);
			return result.data;
		},

		update: async (
			universityId: string,
			id: string,
			data: import('@/types/admin').UpdateDepartmentRequest,
		) => {
			const result = await adminPut<{ data: any }>(
				`/admin/v2/universities/${universityId}/departments/${id}`,
				data,
			);
			return result.data;
		},

		delete: async (universityId: string, id: string) => {
			const result = await adminDelete<{ data: any }>(
				`/admin/v2/universities/${universityId}/departments/${id}`,
			);
			return result.data;
		},

		bulkCreate: async (
			universityId: string,
			data: import('@/types/admin').BulkCreateDepartmentsRequest,
		) => {
			const result = await adminPost<{ data: any }>(
				`/admin/v2/universities/${universityId}/departments/bulk`,
				data,
			);
			return result.data;
		},

		downloadTemplate: async (universityId: string) => {
			const url = buildAdminProxyUrl(`/admin/v2/universities/${universityId}/departments/template`);
			const res = await fetch(url);
			if (!res.ok) throw new Error(`Failed to download template: ${res.status}`);
			return res.blob();
		},

		uploadCsv: async (
			universityId: string,
			file: File,
		): Promise<import('@/types/admin').UploadDepartmentsCsvResponse> => {
			const formData = new FormData();
			formData.append('file', file);
			const result = await adminRequest<{ data: import('@/types/admin').UploadDepartmentsCsvResponse }>(
				`/admin/v2/universities/${universityId}/departments/upload`,
				{ method: 'POST', body: formData },
			);
			return result.data;
		},
	},

	getUniversities: async () => {
		const result = await adminGet<{ data: any }>('/admin/v2/universities');
		return result.data;
	},

	getClusters: async (): Promise<import('@/types/admin').AdminClusterItem[]> => {
		const result = await adminGet<{ data: { clusters: any[] } }>('/admin/v2/universities/clusters');
		return result.data.clusters;
	},

	getDepartments: async (university: string) => {
		const result = await adminGet<{ data: any }>('/admin/v2/universities/departments', { university });
		return result.data;
	},

};
