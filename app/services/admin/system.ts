import axiosServer from '@/utils/axios';

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
		const params: any = { page, limit };
		if (hasToken !== undefined) params.hasToken = hasToken;
		const response = await axiosServer.get('/admin/fcm-tokens', { params });
		return response.data;
	},
};

// 대학교 및 학과 관련 API
export const universities = {
	meta: {
		getRegions: async () => {
			const response = await axiosServer.get('/admin/universities/meta/regions');
			return response.data.regions;
		},

		getTypes: async () => {
			const response = await axiosServer.get('/admin/universities/meta/types');
			return response.data.types;
		},

		getFoundations: async () => {
			const response = await axiosServer.get('/admin/universities/meta/foundations');
			return response.data.foundations;
		},
	},

	getList: async (params?: import('@/types/admin').UniversityListParams) => {
		const response = await axiosServer.get('/admin/universities', { params });
		return response.data;
	},

	getById: async (id: string): Promise<import('@/types/admin').UniversityDetail> => {
		const response = await axiosServer.get(`/admin/universities/${id}`);
		return response.data;
	},

	create: async (data: import('@/types/admin').CreateUniversityRequest) => {
		const response = await axiosServer.post('/admin/universities', data);
		return response.data;
	},

	update: async (id: string, data: import('@/types/admin').UpdateUniversityRequest) => {
		const response = await axiosServer.put(`/admin/universities/${id}`, data);
		return response.data;
	},

	delete: async (id: string) => {
		const response = await axiosServer.delete(`/admin/universities/${id}`);
		return response.data;
	},

	uploadLogo: async (id: string, file: File) => {
		const formData = new FormData();
		formData.append('logo', file);
		const response = await axiosServer.post(`/admin/universities/${id}/logo`, formData, {
			headers: { 'Content-Type': 'multipart/form-data' },
		});
		return response.data;
	},

	deleteLogo: async (id: string) => {
		const response = await axiosServer.delete(`/admin/universities/${id}/logo`);
		return response.data;
	},

	departments: {
		getList: async (
			universityId: string,
			params?: import('@/types/admin').DepartmentListParams,
		) => {
			const response = await axiosServer.get(`/admin/universities/${universityId}/departments`, {
				params,
			});
			return response.data;
		},

		getById: async (universityId: string, id: string) => {
			const response = await axiosServer.get(
				`/admin/universities/${universityId}/departments/${id}`,
			);
			return response.data;
		},

		create: async (universityId: string, data: import('@/types/admin').CreateDepartmentRequest) => {
			const response = await axiosServer.post(
				`/admin/universities/${universityId}/departments`,
				data,
			);
			return response.data;
		},

		update: async (
			universityId: string,
			id: string,
			data: import('@/types/admin').UpdateDepartmentRequest,
		) => {
			const response = await axiosServer.put(
				`/admin/universities/${universityId}/departments/${id}`,
				data,
			);
			return response.data;
		},

		delete: async (universityId: string, id: string) => {
			const response = await axiosServer.delete(
				`/admin/universities/${universityId}/departments/${id}`,
			);
			return response.data;
		},

		bulkCreate: async (
			universityId: string,
			data: import('@/types/admin').BulkCreateDepartmentsRequest,
		) => {
			const response = await axiosServer.post(
				`/admin/universities/${universityId}/departments/bulk`,
				data,
			);
			return response.data;
		},

		downloadTemplate: async (universityId: string) => {
			const response = await axiosServer.get(
				`/admin/universities/${universityId}/departments/template`,
				{
					responseType: 'blob',
				},
			);
			return response.data;
		},

		uploadCsv: async (
			universityId: string,
			file: File,
		): Promise<import('@/types/admin').UploadDepartmentsCsvResponse> => {
			const formData = new FormData();
			formData.append('file', file);
			const response = await axiosServer.post(
				`/admin/universities/${universityId}/departments/upload`,
				formData,
				{
					headers: { 'Content-Type': 'multipart/form-data' },
				},
			);
			return response.data;
		},
	},

	getUniversities: async () => {
		const response = await axiosServer.get('/admin/universities');
		return response.data;
	},

	getClusters: async (): Promise<import('@/types/admin').AdminClusterItem[]> => {
		const response = await axiosServer.get('/admin/universities/clusters');
		return response.data.clusters;
	},

	getDepartments: async (university: string) => {
		const response = await axiosServer.get('/universities/departments', {
			params: { university },
		});
		return response.data;
	},

};
