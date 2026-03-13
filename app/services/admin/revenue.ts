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
			console.log('구슬 일괄 지급 요청:', data);

			const formData = new FormData();

			if (data.phoneNumbers && data.phoneNumbers.length > 0) {
				formData.append('phoneNumbers', JSON.stringify(data.phoneNumbers));
			}

			if (data.csvFile) {
				console.log('CSV File 정보:', {
					name: data.csvFile.name,
					type: data.csvFile.type,
					size: data.csvFile.size,
					lastModified: data.csvFile.lastModified,
				});

				formData.append('csvFile', data.csvFile);
			}

			formData.append('gemAmount', data.gemAmount.toString());
			formData.append('message', data.message);

			console.log('FormData 내용 확인:', {
				csvFile: formData.get('csvFile'),
				phoneNumbers: formData.get('phoneNumbers'),
				gemAmount: formData.get('gemAmount'),
				message: formData.get('message'),
			});

			const responseData = await adminRequest<{ success: boolean; message?: string }>('/admin/gems/bulk-grant', {
				method: 'POST',
				body: formData,
			});
			console.log('구슬 일괄 지급 응답:', responseData);
			return responseData;
		} catch (error: any) {
			console.error('구슬 일괄 지급 중 오류:', error);
			console.error('오류 상세 정보:', error.message);
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
			console.log('미접속 여성 유저 목록 조회 요청:', { limit, offset });
			const response = await axiosServer.get('/admin/female-retention', {
				params: { limit, offset },
			});
			console.log('미접속 여성 유저 목록 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('미접속 여성 유저 목록 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	// 개별 유저에 대해 1회성 패스워드 발급
	issueTemporaryPassword: async (userId: string) => {
		try {
			console.log('임시 패스워드 발급 요청:', userId);
			const response = await axiosServer.post(`/admin/female-retention/${userId}`);
			console.log('임시 패스워드 발급 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('임시 패스워드 발급 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
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
			console.error('사용자 검색 중 오류:', error);
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
			console.error('환불 가능 채팅방 조회 중 오류:', error);
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
			console.error('환불 미리보기 중 오류:', error);
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
			console.error('환불 처리 중 오류:', error);
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
			console.error('iOS 환불 내역 조회 중 오류:', error);
			throw error;
		}
	},

	getDetail: async (id: string) => {
		try {
			const response = await axiosServer.get(`/admin/apple-refund/${id}`);
			return response.data;
		} catch (error: any) {
			console.error('iOS 환불 상세 조회 중 오류:', error);
			throw error;
		}
	},

	syncRefundStatus: async () => {
		try {
			const response = await axiosServer.post('/admin/apple-refund/sync');
			return response.data;
		} catch (error: any) {
			console.error('iOS 환불 상태 동기화 중 오류:', error);
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
			console.error('파묘 계정 대시보드 조회 중 오류:', error);
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
			console.error('미확인 좋아요 목록 조회 중 오류:', error);
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
			console.error('쿨다운 상태 조회 중 오류:', error);
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
			console.error('좋아요 처리 중 오류:', error);
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
			console.error('처리 이력 조회 중 오류:', error);
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
			console.error('프로필 조회 트리거 중 오류:', error);
			throw error;
		}
	},
};
