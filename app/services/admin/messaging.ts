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

export const pushNotificationCatalog = {
	getCatalog: async (locale: 'ko' | 'ja' | 'all' = 'all') => {
		const params: Record<string, string> = {};
		if (locale !== 'all') params.locale = locale;
		const result = await adminGet<{ data: PushNotificationCatalogResponse }>(
			'/admin/v2/messaging/push/catalog',
			params,
		);
		return result.data;
	},
};

export interface PushNotificationTemplate {
	title: string;
	body: string;
}

export interface PushNotificationVariant {
	condition: string;
	templates: Record<string, PushNotificationTemplate>;
}

export interface PushNotificationItem {
	eventType: string;
	category: string;
	dynamic: boolean;
	sampleParams: Record<string, any>;
	templates: Record<string, PushNotificationTemplate>;
	variants?: PushNotificationVariant[];
}

export interface FreshmenMilestone {
	milestone: number;
	title: string;
	templates: Record<string, { body: string }>;
}

export interface PushNotificationCatalogResponse {
	notifications: PushNotificationItem[];
	freshmenMilestones: FreshmenMilestone[];
	meta: {
		totalEventTypes: number;
		locales: string[];
		categories: string[];
		sources: string[];
	};
}

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
			const result = await adminPost<{ data: any }>('/admin/v2/messaging/push/filter-users', {
				...filters,
				page,
				limit,
			});
			return result.data;
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
			const result = await adminPost<{ data: {
				successCount: number;
				failureCount: number;
				totalCount: number;
			} }>('/admin/v2/messaging/push/send', data);
			return result.data;
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
			const res = await adminPost<{ data: GenerateQuestionsResponse }>(
				'/admin/v2/content/questions/generate',
				data,
			);
			return {
				...res.data,
				candidates: Array.isArray(res.data?.candidates) ? res.data.candidates : [],
			};
		} catch (error: any) {
			throw error;
		}
	},

	bulkCreate: async (data: BulkCreateQuestionsRequest): Promise<BulkCreateQuestionsResponse> => {
		try {
			const res = await adminPost<{ data: BulkCreateQuestionsResponse }>(
				'/admin/v2/content/questions/bulk-create',
				data,
			);
			return {
				...res.data,
				questions: Array.isArray(res.data?.questions) ? res.data.questions : [],
			};
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

			const res = await adminGet<{ data: QuestionListResponse }>('/admin/v2/content/questions', stringParams);
			const data = res.data ?? ({} as QuestionListResponse);
			return {
				questions: Array.isArray(data.questions) ? data.questions : [],
				pagination: data.pagination ?? {
					total: 0,
					page: params.page ?? 1,
					limit: params.limit ?? 15,
					totalPages: 1,
				},
			};
		} catch (error: any) {
			throw error;
		}
	},

	getDetail: async (id: string): Promise<QuestionDetail> => {
		try {
			const res = await adminGet<{ data: QuestionDetail }>(`/admin/v2/content/questions/${id}`);
			const data = res.data;
			return {
				...data,
				options: Array.isArray(data?.options) ? data.options : [],
				translations: data?.translations?.jp
					? {
							jp: {
								...data.translations.jp,
								options: Array.isArray(data.translations.jp.options)
									? data.translations.jp.options
									: [],
							},
						}
					: data?.translations,
				metadata: data?.metadata
					? {
							...data.metadata,
							keywords: Array.isArray(data.metadata.keywords) ? data.metadata.keywords : [],
						}
					: data?.metadata,
			};
		} catch (error: any) {
			throw error;
		}
	},

	update: async (id: string, data: UpdateQuestionRequest): Promise<QuestionDetail> => {
		try {
			const res = await adminPut<{ data: QuestionDetail }>(`/admin/v2/content/questions/${id}`, data);
			return res.data;
		} catch (error: any) {
			throw error;
		}
	},

	delete: async (id: string): Promise<void> => {
		try {
			await adminDelete(`/admin/v2/content/questions/${id}`);
		} catch (error: any) {
			throw error;
		}
	},

	translate: async (data: TranslateQuestionsRequest): Promise<TranslateQuestionsResponse> => {
		try {
			const res = await adminPost<{ data: TranslateQuestionsResponse }>(
				'/admin/v2/content/questions/translate',
				data,
			);
			if ('translations' in res.data) {
				return {
					...res.data,
					translations: Array.isArray(res.data.translations) ? res.data.translations : [],
				};
			}
			return {
				...res.data,
				results: Array.isArray(res.data.results) ? res.data.results : [],
			};
		} catch (error: any) {
			throw error;
		}
	},
};
