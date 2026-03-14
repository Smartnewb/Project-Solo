import axiosServer from '@/utils/axios';
import { adminRequest } from '@/shared/lib/http/admin-fetch';
import type {
	ActionLogsResponse,
	AdminLikesParams,
	AdminLikesResponse,
	AppleRefundListParams,
	AppleRefundListResponse,
	CooldownStatusResponse,
	DormantLikeDetailResponse,
	DormantLikesDashboardResponse,
	EligibleChatRoomsResponse,
	ProcessLikesRequest,
	ProcessLikesResponse,
	ProcessRefundRequest,
	ProcessRefundResponse,
	RefundPreviewRequest,
	RefundPreviewResponse,
	RefundUserSearchResponse,
	ViewProfileRequest,
	ViewProfileResponse,
} from '@/types/admin';
import { getCountryHeader } from './_shared';

// 구슬 관리 API
export const gems = {
	// 구슬 일괄 지급 및 푸시 알림 발송 (v2.0.0 - 전화번호 기반)
	bulkGrant: async (data: {
		phoneNumbers?: string[];
		csvFile?: File;
		gemAmount: number;
		message: string;
	}) => {
		try {
			;

			const formData = new FormData();

			if (data.phoneNumbers && data.phoneNumbers.length > 0) {
				formData.append('phoneNumbers', JSON.stringify(data.phoneNumbers));
			}

			if (data.csvFile) {
				;

				formData.append('csvFile', data.csvFile);
			}

			formData.append('gemAmount', data.gemAmount.toString());
			formData.append('message', data.message);

			;

			const responseData = await adminRequest<{
				success: boolean;
				message?: string;
				totalProcessed?: number;
				successCount?: number;
				failedCount?: number;
				errors?: Array<{ identifier: string; reason: string }>;
				pushNotificationResult?: { pushSuccessCount: number; pushFailureCount: number };
			}>('/admin/gems/bulk-grant', {
				method: 'POST',
				body: formData,
			});
			;
			return responseData;
		} catch (error: any) {
			throw error;
		}
	},
};

export const gemPricing = {
	getAll: async () => {
		const response = await axiosServer.get('/admin/gem-pricing');
		return response.data;
	},
};

export const femaleRetention = {
	// 3일 이상 미접속 여성 유저 리스트 조회
	getInactiveUsers: async (limit: number = 20, offset: number = 0) => {
		try {
			;
			const response = await axiosServer.get('/admin/female-retention', {
				params: { limit, offset },
			});
			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	// 개별 유저에 대해 1회성 패스워드 발급
	issueTemporaryPassword: async (userId: string) => {
		try {
			;
			const response = await axiosServer.post(`/admin/female-retention/${userId}`);
			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},
};

export const chatRefund = {
	searchUsers: async (name: string) => {
		try {
			const country = getCountryHeader();
			const response = await axiosServer.get<RefundUserSearchResponse>(
				'/admin/refund/users/search',
				{
					params: { name },
					headers: { 'X-Country': country },
				},
			);
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	getEligibleRooms: async (userId: string) => {
		try {
			const country = getCountryHeader();
			const response = await axiosServer.get<EligibleChatRoomsResponse>(
				`/admin/refund/users/${userId}/eligible-rooms`,
				{
					headers: { 'X-Country': country },
				},
			);
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	previewRefund: async (data: RefundPreviewRequest) => {
		try {
			const country = getCountryHeader();
			const response = await axiosServer.post<RefundPreviewResponse>(
				'/admin/refund/preview',
				data,
				{
					headers: { 'X-Country': country },
				},
			);
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	processRefund: async (data: ProcessRefundRequest) => {
		try {
			const country = getCountryHeader();
			const response = await axiosServer.post<ProcessRefundResponse>(
				'/admin/refund/process',
				data,
				{
					headers: { 'X-Country': country },
				},
			);
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},
};

export const appleRefund = {
	getList: async (params: AppleRefundListParams = {}) => {
		try {
			const response = await axiosServer.get<AppleRefundListResponse>('/admin/apple-refund', {
				params: {
					page: params.page || 1,
					limit: params.limit || 20,
					...(params.status && { status: params.status }),
					...(params.startDate && { startDate: params.startDate }),
					...(params.endDate && { endDate: params.endDate }),
					...(params.searchTerm && { searchTerm: params.searchTerm }),
				},
			});
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	getDetail: async (id: string) => {
		try {
			const response = await axiosServer.get(`/admin/apple-refund/${id}`);
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	syncRefundStatus: async () => {
		try {
			const response = await axiosServer.post('/admin/apple-refund/sync');
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},
};

export const likes = {
	getList: async (params: AdminLikesParams): Promise<AdminLikesResponse> => {
		const response = await axiosServer.get('/admin/likes', { params });
		return response.data;
	},
};

export const dormantLikes = {
	getDashboard: async (page: number = 1, limit: number = 20, inactiveDays: number = 0) => {
		try {
			const response = await axiosServer.get<DormantLikesDashboardResponse>(
				'/admin/dormant-likes',
				{
					params: { page, limit, inactiveDays },
				},
			);
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	getPendingLikes: async (userId: string) => {
		try {
			const response = await axiosServer.get<DormantLikeDetailResponse[]>(
				`/admin/dormant-likes/${userId}`,
			);
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	getCooldownStatus: async (userId: string) => {
		try {
			const response = await axiosServer.get<CooldownStatusResponse>(
				`/admin/dormant-likes/${userId}/cooldown`,
			);
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	processLikes: async (data: ProcessLikesRequest) => {
		try {
			const response = await axiosServer.post<ProcessLikesResponse>(
				'/admin/dormant-likes/process',
				data,
			);
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	getActionLogs: async (
		page: number = 1,
		limit: number = 20,
		filters?: {
			adminUserId?: string;
			dormantUserId?: string;
			batchId?: string;
		},
	) => {
		try {
			const response = await axiosServer.get<ActionLogsResponse>('/admin/dormant-likes/logs', {
				params: { page, limit, ...filters },
			});
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	viewProfile: async (data: ViewProfileRequest) => {
		try {
			const response = await axiosServer.post<ViewProfileResponse>(
				'/admin/dormant-likes/view-profile',
				data,
			);
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},
};
