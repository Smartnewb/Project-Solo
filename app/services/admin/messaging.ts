import { adminGet, adminPost, adminPut, adminDelete } from '@/shared/lib/http/admin-fetch';
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
			const result = await adminPost<any>('/admin/push-notifications/filter-users', {
				...filters,
				page,
				limit,
			});
			return result;
		} catch (error) {
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
			const result = await adminPost<{
				successCount: number;
				failureCount: number;
				totalCount: number;
			}>('/admin/notifications/bulk', data);
			return result;
		} catch (error) {
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
			const stringParams: Record<string, string> = {};
			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined && value !== null && value !== '') {
					stringParams[key] = String(value);
				}
			});

			const result = await adminGet<{ data: any }>('/admin/v2/ai-chat/sessions', stringParams);
			return result.data;
		} catch (error) {
			throw error;
		}
	},

	// AI 채팅 메시지 상세 조회
	getMessages: async (sessionId: string) => {
		try {
			const result = await adminGet<{ data: any }>(`/admin/v2/ai-chat/sessions/${sessionId}/messages`);
			const raw = result.data ?? {};
			return {
				messages: raw.items || [],
				totalCount: raw.totalCount || 0,
				session: null,
			};
		} catch (error) {
			throw error;
		}
	},
};

export const momentQuestions = {
	generate: async (data: GenerateQuestionsRequest): Promise<GenerateQuestionsResponse> => {
		try {
			const result = await adminPost<GenerateQuestionsResponse>(
				'/admin/questions/generate',
				data,
			);
			return result;
		} catch (error: any) {
			throw error;
		}
	},

	bulkCreate: async (data: BulkCreateQuestionsRequest): Promise<BulkCreateQuestionsResponse> => {
		try {
			const result = await adminPost<BulkCreateQuestionsResponse>(
				'/admin/questions/bulk-create',
				data,
			);
			return result;
		} catch (error: any) {
			throw error;
		}
	},

	getList: async (params: GetQuestionsParams = {}): Promise<QuestionListResponse> => {
		try {
			const stringParams: Record<string, string> = {};

			if (params.dimension) stringParams.dimension = params.dimension;
			if (params.schema) stringParams.schema = params.schema;
			if (params.isActive !== undefined) stringParams.isActive = String(params.isActive);
			if (params.search) stringParams.search = params.search;
			if (params.page) stringParams.page = String(params.page);
			if (params.limit) stringParams.limit = String(params.limit);
			if (params.translationStatus) stringParams.translationStatus = params.translationStatus;

			const result = await adminGet<QuestionListResponse>('/admin/questions', stringParams);
			return result;
		} catch (error: any) {
			throw error;
		}
	},

	getDetail: async (id: string): Promise<QuestionDetail> => {
		try {
			const result = await adminGet<QuestionDetail>(`/admin/questions/${id}`);
			return result;
		} catch (error: any) {
			throw error;
		}
	},

	update: async (id: string, data: UpdateQuestionRequest): Promise<QuestionDetail> => {
		try {
			const result = await adminPut<QuestionDetail>(`/admin/questions/${id}`, data);
			return result;
		} catch (error: any) {
			throw error;
		}
	},

	delete: async (id: string): Promise<void> => {
		try {
			await adminDelete(`/admin/questions/${id}`);
		} catch (error: any) {
			throw error;
		}
	},

	translate: async (data: TranslateQuestionsRequest): Promise<TranslateQuestionsResponse> => {
		try {
			const result = await adminPost<TranslateQuestionsResponse>(
				'/admin/questions/translate',
				data,
			);
			return result;
		} catch (error: any) {
			throw error;
		}
	},
};
