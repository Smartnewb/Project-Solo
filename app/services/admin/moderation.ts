import axiosServer from '@/utils/axios';

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

// 유저 심사 관련 API
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
				queryParams.append('status', status === 'pending' ? 'pending' : 'processed');
			}

			const endpoint = `/admin/v2/reports?${queryParams.toString()}`;
			;

			const response = await axiosServer.get(endpoint);
			;

			const transformedItems = (response.data.data || []).map((item: any) => ({
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
				meta: response.data.meta,  // v2: meta lives at response.data.meta
			};
		} catch (error: any) {
			throw error;
		}
	},

	getProfileReportDetail: async (reportId: string) => {
		try {
			const response = await axiosServer.get(
				`/admin/v2/reports/${reportId}`,
			);
			return response.data.data;
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
			const response = await axiosServer.patch(
				`/admin/v2/reports/${reportId}/status`,
				{ status, adminMemo },
			);
			return response.data.data;
		} catch (error: any) {
			throw error;
		}
	},

	getChatHistory: async (chatRoomId: string, page: number = 1, limit: number = 50) => {
		try {
			const response = await axiosServer.get(`/admin/community/chat/${chatRoomId}/messages`, {
				params: { page, limit },
			});
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	getUserProfileImages: async (userId: string) => {
		try {
			const response = await axiosServer.get(`/admin/community/users/${userId}/profile-images`);
			return response.data.images || [];
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

			const params: Record<string, any> = { page, limit };
			if (search) params.search = search;
			if (filters?.gender) params.gender = filters.gender;
			if (filters?.minAge) params.minAge = filters.minAge;
			if (filters?.maxAge) params.maxAge = filters.maxAge;
			if (filters?.universityId) params.universityId = filters.universityId;
			if (filters?.region) params.region = filters.region;
			if (excludeUserIds && excludeUserIds.length > 0) {
				params.excludeUserIds = excludeUserIds.join(',');
			}

			const response = await axiosServer.get('/admin/v2/profile-review/pending', {
				params,
			});

			;
			return { data: response.data.data, meta: response.data.meta };
		} catch (error: any) {
			throw error;
		}
	},

	getUserDetail: async (userId: string) => {
		try {
			;

			const response = await axiosServer.get(`/admin/v2/profile-review/users/${userId}`);

			;
			return response.data.data;
		} catch (error: any) {
			throw error;
		}
	},

	approveUser: async (userId: string) => {
		try {
			;

			const response = await axiosServer.post(`/admin/v2/profile-review/users/${userId}/approve-profile`);

			;
			return response.data.data;
		} catch (error: any) {
			throw error;
		}
	},

	rejectUser: async (userId: string, category: string, reason: string) => {
		try {
			;

			const response = await axiosServer.post(`/admin/v2/profile-review/users/${userId}/reject-profile`, {
				category,
				reason,
			});

			;
			return response.data.data;
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

			const response = await axiosServer.patch(
				`/admin/v2/profile-review/users/${userId}/rank`,
				{ rank },
				{ params: { emitEvent } },
			);

			;
			return response.data.data;
		} catch (error: any) {
			throw error;
		}
	},

	getImageValidation: async (imageId: string) => {
		const response = await axiosServer.get(`/admin/profile-images/${imageId}/validation`);
		return response.data;
	},

	getReviewHistory: async (filters: ReviewHistoryFilter = {}): Promise<ReviewHistoryResponse> => {
		try {
			const params: Record<string, any> = {};
			if (filters.page) params.page = filters.page;
			if (filters.limit) params.limit = filters.limit;
			if (filters.reviewType) params.reviewType = filters.reviewType;
			if (filters.reviewStatus) params.reviewStatus = filters.reviewStatus;
			if (filters.gender) params.gender = filters.gender;
			if (filters.from) params.from = filters.from;
			if (filters.to) params.to = filters.to;
			if (filters.searchTerm) params.searchTerm = filters.searchTerm;
			if (filters.universityId) params.universityId = filters.universityId;
			if (filters.reviewedBy) params.reviewedBy = filters.reviewedBy;

			const response = await axiosServer.get('/admin/v2/profile-review/history', {
				params,
			});

			const rawItems = response.data.data;
			const meta = response.data.meta;
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

			const response = await axiosServer.get('/admin/v2/profile-review/pending');

			;
			return { data: response.data.data, meta: response.data.meta };
		} catch (error: any) {
			throw error;
		}
	},

	approveProfileImage: async (userId: string) => {
		try {
			;

			const response = await axiosServer.post(`/admin/v2/profile-review/users/${userId}/approve-profile`);

			;
			return response.data.data;
		} catch (error: any) {
			throw error;
		}
	},

	rejectProfileImage: async (userId: string, rejectionReason: string) => {
		try {
			;

			const response = await axiosServer.post(`/admin/v2/profile-review/users/${userId}/reject-profile`, {
				rejectionReason,
			});

			;
			return response.data.data;
		} catch (error: any) {
			throw error;
		}
	},

	approveIndividualImage: async (imageId: string) => {
		try {
			;

			const response = await axiosServer.post(`/admin/v2/profile-review/images/${imageId}/action`, {
				action: 'approve',
			});

			;
			return response.data.data;
		} catch (error: any) {
			throw error;
		}
	},

	rejectIndividualImage: async (imageId: string, rejectionReason: string) => {
		try {
			;

			const response = await axiosServer.post(`/admin/v2/profile-review/images/${imageId}/action`, {
				action: 'reject',
				reason: rejectionReason,
			});

			;
			return response.data.data;
		} catch (error: any) {
			throw error;
		}
	},

	setMainImage: async (userId: string, imageId: string) => {
		try {
			;

			const response = await axiosServer.post(
				`/admin/v2/profile-review/images/${imageId}/action`,
				{ action: 'setMain' },
			);

			;
			return response.data.data;
		} catch (error: any) {
			throw error;
		}
	},
};
