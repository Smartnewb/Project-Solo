import { adminGet, adminPost, adminPatch } from '@/shared/lib/http/admin-fetch';

export interface ReviewHistoryFilter {
	reviewType?: 'admin' | 'auto';
	reviewStatus?: 'approved' | 'rejected';
	gender?: 'MALE' | 'FEMALE';
	from?: string;
	to?: string;
	searchTerm?: string;
	universityId?: string;
	reviewedBy?: string;
	page?: number;
	limit?: number;
}

export interface ReviewHistoryItem {
	imageId: string;
	imageUrl: string;
	slotIndex: number;
	isMain: boolean;
	reviewStatus: 'approved' | 'rejected';
	reviewType: 'admin' | 'auto' | null;
	reviewedBy: string | null;
	reviewedAt: string | null;
	rejectionReason: string | null;
	user: {
		userId: string;
		name: string | null;
		gender: string | null;
		age: number | null;
	};
}

export interface VisionFaceAnnotation {
	detectionConfidence: number;
	landmarkingConfidence: number;
	joyLikelihood: string;
	sorrowLikelihood: string;
	angerLikelihood: string;
	surpriseLikelihood: string;
	underExposedLikelihood: string;
	blurredLikelihood: string;
	headwearLikelihood: string;
	rollAngle: number;
	panAngle: number;
	tiltAngle: number;
}

export interface ImageValidationResponse {
	id: string;
	photoId: string;
	visionResponse: VisionFaceAnnotation[];
	totalScore: number;
	autoDecision: string;
	decisionReason: string;
	createdAt: string;
}

export interface ReviewHistoryResponse {
	items: ReviewHistoryItem[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasMore: boolean;
	};
}

export interface PendingUsersFilter {
	gender?: 'MALE' | 'FEMALE';
	minAge?: number;
	maxAge?: number;
	universityId?: string;
	region?: string;
}

export const reports = {
	getProfileReports: async (params: URLSearchParams) => {
		try {
			;

			const page = params.get('page') || '1';
			const limit = params.get('limit') || '10';
			const status = params.get('status');

			const queryParams = new URLSearchParams();
			queryParams.append('type', 'profile');
			queryParams.append('page', page);
			queryParams.append('limit', limit);
			if (status) {
				const statusMap: Record<string, string> = {
					pending: 'PENDING',
					reviewing: 'REVIEWING',
					resolved: 'RESOLVED',
					rejected: 'DISMISSED',
				};
				queryParams.append('status', statusMap[status] || status);
			}
			const reporterName = params.get('reporterName');
			const reportedName = params.get('reportedName');
			if (reporterName) queryParams.append('reporterName', reporterName);
			if (reportedName) queryParams.append('reportedName', reportedName);

			const endpoint = `/admin/v2/reports?${queryParams.toString()}`;
			;

			const response = await adminGet<{ data: any[]; meta: any }>(endpoint);

			const transformedItems = (response.data || []).map((item: any) => ({
				id: item.id,
				reporter: {
					id: item.reporter?.id || item.reporterId,
					name: item.reporter?.name || item.reporterName || '알 수 없음',
					email: item.reporter?.email || '',
					phoneNumber: item.reporter?.phoneNumber || '',
					age: item.reporter?.age || item.reporterAge || 0,
					gender: (item.reporter?.gender || item.reporterGender || 'MALE') as 'MALE' | 'FEMALE',
					profileImageUrl: item.reporter?.profileImageUrl || '',
				},
				reported: {
					id: item.reported?.id || item.reportedId,
					name: item.reported?.name || item.reportedName || '알 수 없음',
					email: item.reported?.email || '',
					phoneNumber: item.reported?.phoneNumber || '',
					age: item.reported?.age || item.reportedAge || 0,
					gender: (item.reported?.gender || item.reportedGender || 'MALE') as 'MALE' | 'FEMALE',
					profileImageUrl: item.reported?.profileImageUrl || '',
				},
				reason: item.reason || '',
				description: item.description || null,
				evidenceImages: item.evidenceImages || [],
				status: item.status || 'pending',
				createdAt: item.createdAt,
				updatedAt: null,
			}));

			return {
				items: transformedItems,
				meta: response.meta,
			};
		} catch (error: any) {
			throw error;
		}
	},

	getProfileReportDetail: async (reportId: string) => {
		try {
			const result = await adminGet<{ data: any }>(
				`/admin/v2/reports/${reportId}`,
			);
			return result.data;
		} catch (error: any) {
			throw error;
		}
	},

	updateReportStatus: async (
		reportId: string,
		status: 'pending' | 'reviewing' | 'resolved' | 'rejected',
		adminMemo?: string,
	) => {
		try {
			const backendStatus = status === 'rejected' ? 'dismissed' : status;
			const result = await adminPatch<{ data: any }>(
				`/admin/v2/reports/${reportId}/status`,
				{ status: backendStatus, reason: adminMemo },
			);
			return result.data;
		} catch (error: any) {
			throw error;
		}
	},

	getChatHistory: async (chatRoomId: string, page: number = 1, limit: number = 50) => {
		try {
			const result = await adminGet<any>(`/admin/v2/chat/rooms/${chatRoomId}/messages`, {
				page: String(page),
				limit: String(limit),
			});
			return result;
		} catch (error: any) {
			throw error;
		}
	},

	getUserProfileImages: async (userId: string): Promise<string[]> => {
		try {
			const result = await adminGet<any>(`/admin/v2/community/users/${userId}/profile-images`);
			const images = result.images || result.data?.images || [];
			return images.map((img: any) => (typeof img === 'string' ? img : img.url));
		} catch (error: any) {
			throw error;
		}
	},
};

export const userReview = {
	getPendingUsers: async (
		page: number = 1,
		limit: number = 20,
		search?: string,
		filters?: PendingUsersFilter,
		excludeUserIds?: string[],
	) => {
		try {
			;

			const stringParams: Record<string, string> = {
				page: String(page),
				limit: String(limit),
			};
			if (search) stringParams.search = search;
			if (filters?.gender) stringParams.gender = filters.gender;
			if (filters?.minAge) stringParams.minAge = String(filters.minAge);
			if (filters?.maxAge) stringParams.maxAge = String(filters.maxAge);
			if (filters?.universityId) stringParams.universityId = filters.universityId;
			if (filters?.region) stringParams.region = filters.region;
			if (excludeUserIds && excludeUserIds.length > 0) {
				stringParams.excludeUserIds = excludeUserIds.join(',');
			}

			const result = await adminGet<{ data: any; meta: any }>('/admin/v2/profile-review/pending', stringParams);

			;
			return { data: result.data, meta: result.meta };
		} catch (error: any) {
			throw error;
		}
	},

	getUserDetail: async (userId: string) => {
		try {
			;

			const result = await adminGet<{ data: any }>(`/admin/v2/profile-review/users/${userId}`);

			;
			return result.data;
		} catch (error: any) {
			throw error;
		}
	},

	approveUser: async (userId: string) => {
		try {
			;

			const result = await adminPost<{ data: any }>(`/admin/v2/profile-review/users/${userId}/approve-profile`);

			;
			return result.data;
		} catch (error: any) {
			throw error;
		}
	},

	rejectUser: async (userId: string, category: string, reason: string) => {
		try {
			;

			const result = await adminPost<{ data: any }>(`/admin/v2/profile-review/users/${userId}/reject-profile`, {
				category,
				reason,
			});

			;
			return result.data;
		} catch (error: any) {
			throw error;
		}
	},

	bulkRejectUsers: async (
		userIds: string[],
		category: string,
		reason: string,
		onProgress?: (current: number, total: number) => void,
	) => {
		const results: Array<{ userId: string; success: boolean; error?: string }> = [];

		for (let i = 0; i < userIds.length; i++) {
			const userId = userIds[i];
			try {
				await userReview.rejectUser(userId, category, reason);
				results.push({ userId, success: true });
				onProgress?.(i + 1, userIds.length);
			} catch (error: any) {
				results.push({
					userId,
					success: false,
					error: error.response?.data?.message || error.message,
				});
				onProgress?.(i + 1, userIds.length);
			}
		}

		return results;
	},

	updateUserRank: async (
		userId: string,
		rank: 'S' | 'A' | 'B' | 'C' | 'UNKNOWN',
		emitEvent: boolean = false,
	) => {
		try {
			;

			const url = `/admin/v2/profile-review/users/${userId}/rank${emitEvent ? '?emitEvent=true' : ''}`;
			const result = await adminPatch<{ data: any }>(url, { rank });

			;
			return result.data;
		} catch (error: any) {
			throw error;
		}
	},

	getImageValidation: async (imageId: string) => {
		const result = await adminGet<any>(`/admin/v2/profile-images/${imageId}/validation`);
		return result;
	},

	getReviewHistory: async (filters: ReviewHistoryFilter = {}): Promise<ReviewHistoryResponse> => {
		try {
			const stringParams: Record<string, string> = {};
			if (filters.page) stringParams.page = String(filters.page);
			if (filters.limit) stringParams.limit = String(filters.limit);
			if (filters.reviewStatus) {
				const reviewTypeMap: Record<string, string> = { approved: 'approval', rejected: 'rejection' };
				stringParams.reviewType = reviewTypeMap[filters.reviewStatus] || filters.reviewStatus;
			}
			if (filters.gender) stringParams.gender = filters.gender;
			if (filters.from) stringParams.from = filters.from;
			if (filters.to) stringParams.to = filters.to;
			if (filters.reviewedBy) stringParams.reviewer = filters.reviewedBy;

			const response = await adminGet<{ data: any[]; meta: any }>('/admin/v2/profile-review/history', stringParams);

			const rawItems = response.data;
			const meta = response.meta;
			const data = (rawItems || []).map((item: any) => ({
				imageId: item.imageId,
				imageUrl: item.url,
				slotIndex: item.slotIndex ?? 0,
				isMain: item.isMain ?? false,
				reviewStatus: item.reviewStatus,
				reviewType: item.reviewType ?? null,
				reviewedBy: item.reviewerName ?? item.reviewedBy ?? null,
				reviewedAt: item.reviewedAt,
				rejectionReason: item.reason,
				user: {
					userId: item.userId,
					name: item.userName,
					gender: item.gender,
					age: item.age,
				},
			}));
			return {
				items: data,
				pagination: {
					page: meta.page,
					limit: meta.limit,
					total: meta.total,
					totalPages: meta.totalPages,
					hasMore: meta.page < meta.totalPages,
				},
			};
		} catch (error: any) {
			throw error;
		}
	},
};

export const profileImages = {
	getPendingProfileImages: async () => {
		try {
			;

			const result = await adminGet<{ data: any; meta: any }>('/admin/v2/profile-review/pending');

			;
			return { data: result.data, meta: result.meta };
		} catch (error: any) {
			throw error;
		}
	},

	approveProfileImage: async (userId: string) => {
		try {
			;

			const result = await adminPost<{ data: any }>(`/admin/v2/profile-review/users/${userId}/approve-profile`);

			;
			return result.data;
		} catch (error: any) {
			throw error;
		}
	},

	rejectProfileImage: async (userId: string, rejectionReason: string) => {
		try {
			;

			const result = await adminPost<{ data: any }>(`/admin/v2/profile-review/users/${userId}/reject-profile`, {
				category: 'image',
				reason: rejectionReason,
			});

			;
			return result.data;
		} catch (error: any) {
			throw error;
		}
	},

	approveIndividualImage: async (imageId: string) => {
		try {
			;

			const result = await adminPost<{ data: any }>(`/admin/v2/profile-review/images/${imageId}/action`, {
				action: 'approve',
			});

			;
			return result.data;
		} catch (error: any) {
			throw error;
		}
	},

	rejectIndividualImage: async (imageId: string, rejectionReason: string) => {
		try {
			;

			const result = await adminPost<{ data: any }>(`/admin/v2/profile-review/images/${imageId}/action`, {
				action: 'reject',
				reason: rejectionReason,
			});

			;
			return result.data;
		} catch (error: any) {
			throw error;
		}
	},

	setMainImage: async (userId: string, imageId: string) => {
		try {
			;

			const result = await adminPost<{ data: any }>(
				`/admin/v2/profile-review/images/${imageId}/action`,
				{ action: 'setMain' },
			);

			;
			return result.data;
		} catch (error: any) {
			throw error;
		}
	},
};
