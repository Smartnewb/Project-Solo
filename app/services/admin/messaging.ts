import axiosServer from '@/utils/axios';
import type {
	BulkCreateQuestionsRequest,
	BulkCreateQuestionsResponse,
	GenerateQuestionsRequest,
	GenerateQuestionsResponse,
	GetQuestionsParams,
	QuestionDetail,
	QuestionListResponse,
	TranslateQuestionsRequest,
	TranslateQuestionsResponse,
	UpdateQuestionRequest,
} from '@/types/moment';

export const pushNotifications = {
	filterUsers: async (
		filters: {
			isDormant?: boolean;
			gender?: string;
			universities?: string[];
			regions?: string[];
			ranks?: string[];
			phoneNumber?: string;
			hasPreferences?: boolean;
		},
		page: number = 1,
		limit: number = 20,
	) => {
		try {
			const response = await axiosServer.post('/admin/push-notifications/filter-users', {
				...filters,
				page,
				limit,
			});
			return response.data;
		} catch (error) {
			console.error('사용자 필터링 중 오류:', error);
			throw error;
		}
	},

	sendBulkNotification: async (data: {
		userIds: string[];
		title: string;
		message: string;
	}): Promise<{
		successCount: number;
		failureCount: number;
		totalCount: number;
	}> => {
		try {
			const response = await axiosServer.post('/admin/notifications/bulk', data);
			return response.data;
		} catch (error) {
			console.error('대량 푸시 알림 발송 중 오류:', error);
			throw error;
		}
	},
};

// AI 채팅 관리 API
export const aiChat = {
	// AI 채팅 세션 목록 조회
	getSessions: async (params: {
		startDate?: string;
		endDate?: string;
		category?: string;
		isActive?: boolean;
		status?: string;
		userId?: string;
		page?: number;
		limit?: number;
	}) => {
		try {
			const queryParams = new URLSearchParams();
			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined && value !== null && value !== '') {
					queryParams.append(key, String(value));
				}
			});

			const response = await axiosServer.get(`/admin/ai-chat/sessions?${queryParams.toString()}`);
			;
			return response.data;
		} catch (error) {
			console.error('AI 채팅 세션 목록 조회 중 오류:', error);
			throw error;
		}
	},

	// AI 채팅 메시지 상세 조회
	getMessages: async (sessionId: string) => {
		try {
			const response = await axiosServer.get(`/admin/ai-chat/messages?sessionId=${sessionId}`);
			;
			return response.data;
		} catch (error) {
			console.error('AI 채팅 메시지 상세 조회 중 오류:', error);
			throw error;
		}
	},
};

export const momentQuestions = {
	generate: async (data: GenerateQuestionsRequest): Promise<GenerateQuestionsResponse> => {
		try {
			;
			const response = await axiosServer.post<GenerateQuestionsResponse>(
				'/admin/questions/generate',
				data,
			);
			;
			return response.data;
		} catch (error: any) {
			console.error('질문 생성 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	bulkCreate: async (data: BulkCreateQuestionsRequest): Promise<BulkCreateQuestionsResponse> => {
		try {
			;
			const response = await axiosServer.post<BulkCreateQuestionsResponse>(
				'/admin/questions/bulk-create',
				data,
			);
			;
			return response.data;
		} catch (error: any) {
			console.error('질문 대량 저장 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	getList: async (params: GetQuestionsParams = {}): Promise<QuestionListResponse> => {
		try {
			;
			const queryParams: Record<string, string | number | boolean> = {};

			if (params.dimension) queryParams.dimension = params.dimension;
			if (params.schema) queryParams.schema = params.schema;
			if (params.isActive !== undefined) queryParams.isActive = params.isActive;
			if (params.search) queryParams.search = params.search;
			if (params.page) queryParams.page = params.page;
			if (params.limit) queryParams.limit = params.limit;
			if (params.translationStatus) queryParams.translationStatus = params.translationStatus;

			const response = await axiosServer.get<QuestionListResponse>('/admin/questions', {
				params: queryParams,
			});
			;
			return response.data;
		} catch (error: any) {
			console.error('질문 목록 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	getDetail: async (id: string): Promise<QuestionDetail> => {
		try {
			;
			const response = await axiosServer.get<QuestionDetail>(`/admin/questions/${id}`);
			;
			return response.data;
		} catch (error: any) {
			console.error('질문 상세 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	update: async (id: string, data: UpdateQuestionRequest): Promise<QuestionDetail> => {
		try {
			;
			const response = await axiosServer.put<QuestionDetail>(`/admin/questions/${id}`, data);
			;
			return response.data;
		} catch (error: any) {
			console.error('질문 수정 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	delete: async (id: string): Promise<void> => {
		try {
			;
			await axiosServer.delete(`/admin/questions/${id}`);
			;
		} catch (error: any) {
			console.error('질문 삭제 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	translate: async (data: TranslateQuestionsRequest): Promise<TranslateQuestionsResponse> => {
		try {
			;
			const response = await axiosServer.post<TranslateQuestionsResponse>(
				'/admin/questions/translate',
				data,
			);
			;
			return response.data;
		} catch (error: any) {
			console.error('질문 번역 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},
};
