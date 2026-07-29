import { adminDelete, adminGet, adminPatch, adminPost, adminRequest } from '@/shared/lib/http/admin-fetch';
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

// ─── 구슬 가격·할인·환급 정책 ─────────────────────────────
// 백엔드 소스: solo-nestjs-api src/admin/v2/gems/gems-v2.controller.ts

export type GemScopeCountry = 'kr' | 'jp';
export type GemScopeGender = 'MALE' | 'FEMALE';

export interface GemPriceRow {
	id: number;
	featureType: string;
	countryCode: string | null;
	gender: string | null;
	price: number;
	isActive: boolean;
	memo: string | null;
	/** 낙관적 락. 수정 시 그대로 되돌려보낸다. */
	version: number;
	updatedAt: string;
}

export interface GemDiscountRow {
	id: number;
	featureType: string;
	countryCode: string | null;
	gender: string | null;
	discountAmount: number;
	startsAt: string;
	endsAt: string;
	memo: string;
	createdBy: string;
	canceledAt: string | null;
}

export interface GemRefundPolicyRow {
	id: number;
	policyKey: string;
	value: number;
	label: string;
	description: string | null;
	version: number;
	updatedAt: string;
}

export interface GemPriceChangeRow {
	id: number;
	targetType: 'PRICE' | 'DISCOUNT' | string;
	targetId: number;
	featureType: string;
	countryCode: string | null;
	gender: string | null;
	beforeValue: unknown;
	afterValue: unknown;
	changedBy: string;
	memo: string | null;
	createdAt: string;
}

export const gemPricing = {
	getAll: async () => {
		const res = await adminGet<{ data: any }>('/admin/v2/gems/pricing');
		return res.data;
	},

	listPrices: async () => {
		const res = await adminGet<{
			data: { prices: GemPriceRow[]; missingFeatureTypes: string[] };
		}>('/admin/v2/gems/prices');
		return res.data;
	},

	createPrice: async (body: {
		featureType: string;
		countryCode?: GemScopeCountry;
		gender?: GemScopeGender;
		price: number;
		memo: string;
		confirmFree?: boolean;
	}) => {
		const res = await adminPost<{ data: GemPriceRow }>('/admin/v2/gems/prices', body);
		return res.data;
	},

	updatePrice: async (
		id: number,
		body: {
			price: number;
			memo: string;
			version: number;
			confirmFree?: boolean;
			confirmLargeChange?: boolean;
		},
	) => {
		const res = await adminPatch<{ data: GemPriceRow }>(`/admin/v2/gems/prices/${id}`, body);
		return res.data;
	},

	setPriceActive: async (id: number, body: { isActive: boolean; memo: string }) => {
		const res = await adminPatch<{ data: GemPriceRow }>(
			`/admin/v2/gems/prices/${id}/active`,
			body,
		);
		return res.data;
	},

	listDiscounts: async (params?: { featureType?: string; includeExpired?: boolean }) => {
		const res = await adminGet<{ data: GemDiscountRow[] }>('/admin/v2/gems/discounts', {
			featureType: params?.featureType,
			includeExpired: params?.includeExpired ? 'true' : undefined,
		});
		return res.data;
	},

	createDiscount: async (body: {
		featureType: string;
		countryCode?: GemScopeCountry;
		gender?: GemScopeGender;
		discountAmount: number;
		/** ISO8601 (UTC). datetime-local 입력은 new Date(v).toISOString() 으로 변환한다. */
		startsAt: string;
		endsAt: string;
		memo: string;
		confirmFree?: boolean;
	}) => {
		const res = await adminPost<{ data: GemDiscountRow }>('/admin/v2/gems/discounts', body);
		return res.data;
	},

	/** 행 삭제가 아니라 canceledAt 세팅. 지난 할인도 CS 근거로 남는다. */
	cancelDiscount: async (id: number) => {
		const res = await adminDelete<{ data: GemDiscountRow }>(`/admin/v2/gems/discounts/${id}`);
		return res.data;
	},

	listRefundPolicies: async () => {
		const res = await adminGet<{ data: GemRefundPolicyRow[] }>('/admin/v2/gems/refund-policies');
		return res.data;
	},

	updateRefundPolicy: async (
		policyKey: string,
		body: { value: number; memo: string; version: number; confirmLargeChange?: boolean },
	) => {
		const res = await adminPatch<{ data: GemRefundPolicyRow }>(
			`/admin/v2/gems/refund-policies/${policyKey}`,
			body,
		);
		return res.data;
	},

	listChanges: async (featureType?: string) => {
		const res = await adminGet<{ data: GemPriceChangeRow[] }>('/admin/v2/gems/price-changes', {
			featureType,
		});
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
			const response = await adminPost<{ data: any }>(`/admin/v2/retention/female-retention/${userId}`);
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
			const result = await adminGet<{ data: EligibleChatRoomsResponse }>(
				`/admin/v2/payments/chat-refund/users/${userId}/eligible-rooms`,
			);
			return result.data;
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
			const queryParams: Record<string, string> = {
				page: String(params.page || 1),
				limit: String(params.limit || 20),
			};
			if (params.status) queryParams.refundStatus = params.status;
			if (params.startDate) queryParams.startDate = params.startDate;
			if (params.endDate) queryParams.endDate = params.endDate;
			if (params.searchTerm) queryParams.transactionId = params.searchTerm;

			const result = await adminGet<{ data: { items: any[]; total: number; page: number; limit: number; totalPages: number } }>('/admin/v2/apple-refund', queryParams);
			return {
				items: (result.data.items ?? []).map((item) => ({
					...item,
					originalTransactionId: item.originalTransactionId ?? item.transactionId,
					purchaseDate: item.purchaseDate ?? item.paidAt,
					refundDate: item.refundDate ?? item.refundedAt,
					updatedAt: item.updatedAt ?? item.createdAt,
				})),
				meta: {
					page: result.data.page,
					limit: result.data.limit,
					totalCount: result.data.total,
					totalPages: result.data.totalPages,
					hasNext: result.data.page < result.data.totalPages,
					hasPrev: result.data.page > 1,
				},
			} satisfies AppleRefundListResponse;
		} catch (error: any) {
			throw error;
		}
	},

	getDetail: async (id: string) => {
		try {
			const response = await adminGet<{ data: any }>(`/admin/v2/apple-refund/${id}`);
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	syncRefundStatus: async (body?: { paymentId: string; reason: string; adminNote?: string }) => {
		try {
			const response = await adminPost<{ data: any }>('/admin/v2/apple-refund/sync', body);
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},
};

export const likes = {
	getList: async (params: AdminLikesParams): Promise<AdminLikesResponse> => {
		const query: Record<string, string> = {};
		if (params.page != null) query.page = String(params.page);
		if (params.limit != null) query.limit = String(params.limit);
		if (params.status) query.status = params.status;
		if (params.hasLetter != null) query.hasLetter = String(params.hasLetter);
		if (params.isMutualLike != null) query.isMutualLike = String(params.isMutualLike);
		if (params.senderUserId) query.senderUserId = params.senderUserId;
		if (params.forwardUserId) query.forwardUserId = params.forwardUserId;
		if (params.searchName) query.searchName = params.searchName;
		if (params.startDate) query.startDate = params.startDate;
		if (params.endDate) query.endDate = params.endDate;
		if (params.sortBy) query.sortBy = params.sortBy;
		if (params.sortOrder) query.sortOrder = params.sortOrder;
		const res = await adminGet<{ data: AdminLikesResponse }>('/admin/v2/matching/likes', query);
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
			const response = await adminGet<{ data: DormantLikeDetailResponse[] }>(
				`/admin/v2/retention/dormant-likes/${userId}`,
			);
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	getCooldownStatus: async (userId: string) => {
		try {
			const response = await adminGet<{ data: CooldownStatusResponse }>(
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
