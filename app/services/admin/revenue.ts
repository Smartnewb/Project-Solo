import { adminGet, adminPost, adminRequest } from '@/shared/lib/http/admin-fetch';
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
import axiosServer from '@/utils/axios';

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

			const responseData = await adminRequest<{ data: {
				success: boolean;
				message?: string;
				totalProcessed?: number;
				successCount?: number;
				failedCount?: number;
				errors?: Array<{ identifier: string; reason: string }>;
				pushNotificationResult?: { pushSuccessCount: number; pushFailureCount: number };
			} }>('/admin/v2/gems/bulk-grant', {
				method: 'POST',
				body: formData,
			});
			;
			return responseData.data;
		} catch (error: any) {
			throw error;
		}
	},
};

export const gemPricing = {
	getAll: async () => {
		const res = await adminGet<{ data: any }>('/admin/v2/gems/pricing');
		return res.data;
	},
};

export const femaleRetention = {
	// 3일 이상 미접속 여성 유저 리스트 조회
	getInactiveUsers: async (limit: number = 20, offset: number = 0) => {
		try {
			;
			const res = await adminGet<{ data: any }>('/admin/v2/retention/female-retention', { limit: String(limit), offset: String(offset) });
			;
			return res.data;
		} catch (error: any) {
			throw error;
		}
	},

	// 개별 유저에 대해 1회성 패스워드 발급
	issueTemporaryPassword: async (userId: string) => {
		try {
			;
			const response = await axiosServer.post(`/admin/v2/retention/female-retention/${userId}`);
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
			const res = await adminGet<{ data: RefundUserSearchResponse }>('/admin/v2/payments/chat-refund/users/search', { name });
			return res.data;
		} catch (error: any) {
			throw error;
		}
	},

	getEligibleRooms: async (userId: string) => {
		try {
			const country = getCountryHeader();
			const response = await axiosServer.get<EligibleChatRoomsResponse>(
				`/admin/v2/payments/chat-refund/users/${userId}/eligible-rooms`,
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
			const res = await adminPost<{ data: RefundPreviewResponse }>('/admin/v2/payments/chat-refund/preview', data);
			return res.data;
		} catch (error: any) {
			throw error;
		}
	},

	processRefund: async (data: ProcessRefundRequest) => {
		try {
			const res = await adminPost<{ data: ProcessRefundResponse }>('/admin/v2/payments/chat-refund/process', data);
			return res.data;
		} catch (error: any) {
			throw error;
		}
	},
};

export const appleRefund = {
	getList: async (params: AppleRefundListParams = {}) => {
		try {
			const response = await axiosServer.get<AppleRefundListResponse>('/admin/v2/apple-refund', {
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
			const response = await axiosServer.get(`/admin/v2/apple-refund/${id}`);
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	syncRefundStatus: async () => {
		try {
			const response = await axiosServer.post('/admin/v2/apple-refund/sync');
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},
};

export const likes = {
	getList: async (params: AdminLikesParams): Promise<AdminLikesResponse> => {
		const res = await adminGet<{ data: AdminLikesResponse }>('/admin/v2/matching/likes', params as Record<string, string>);
		return res.data;
	},
};

export const dormantLikes = {
	getDashboard: async (page: number = 1, limit: number = 20, inactiveDays: number = 0) => {
		try {
			const res = await adminGet<{ data: DormantLikesDashboardResponse }>(
				'/admin/v2/retention/dormant-likes',
				{ page: String(page), limit: String(limit), inactiveDays: String(inactiveDays) },
			);
			return res.data;
		} catch (error: any) {
			throw error;
		}
	},

	getPendingLikes: async (userId: string) => {
		try {
			const response = await axiosServer.get<DormantLikeDetailResponse[]>(
				`/admin/v2/retention/dormant-likes/${userId}`,
			);
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	getCooldownStatus: async (userId: string) => {
		try {
			const response = await axiosServer.get<CooldownStatusResponse>(
				`/admin/v2/retention/dormant-likes/${userId}/cooldown`,
			);
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	processLikes: async (data: ProcessLikesRequest) => {
		try {
			const res = await adminPost<{ data: ProcessLikesResponse }>(
				'/admin/v2/retention/dormant-likes/process',
				data,
			);
			return res.data;
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
			const params: Record<string, string> = { page: String(page), limit: String(limit) };
			if (filters?.adminUserId) params.adminUserId = filters.adminUserId;
			if (filters?.dormantUserId) params.dormantUserId = filters.dormantUserId;
			if (filters?.batchId) params.batchId = filters.batchId;
			const res = await adminGet<{ data: ActionLogsResponse }>('/admin/v2/retention/dormant-likes/logs', params);
			return res.data;
		} catch (error: any) {
			throw error;
		}
	},

	viewProfile: async (data: ViewProfileRequest) => {
		try {
			const res = await adminPost<{ data: ViewProfileResponse }>(
				'/admin/v2/retention/dormant-likes/view-profile',
				data,
			);
			return res.data;
		} catch (error: any) {
			throw error;
		}
	},
};
