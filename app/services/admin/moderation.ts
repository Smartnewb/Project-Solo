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
			console.log('프로필 신고 목록 조회 시작');

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

			const endpoint = `/admin/community/reports?${queryParams.toString()}`;
			console.log('API 엔드포인트:', endpoint);

			const response = await axiosServer.get(endpoint);
			console.log('프로필 신고 목록 응답:', response.data);

			const transformedItems = (response.data.items || []).map((item: any) => ({
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
				meta: response.data.meta,
			};
		} catch (error: any) {
			console.error('프로필 신고 목록 조회 중 오류:', error);
			throw error;
		}
	},

	getProfileReportDetail: async (reportId: string) => {
		try {
			const response = await axiosServer.get(
				`/admin/community/reports/profiles/${reportId}/detail`,
			);
			return response.data;
		} catch (error: any) {
			console.error('프로필 신고 상세 조회 중 오류:', error);
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
				`/admin/community/reports/profiles/${reportId}/status`,
				{ status, adminMemo },
			);
			return response.data;
		} catch (error: any) {
			console.error('신고 상태 변경 중 오류:', error);
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
			console.error('채팅 내역 조회 중 오류:', error);
			throw error;
		}
	},

	getUserProfileImages: async (userId: string) => {
		try {
			const response = await axiosServer.get(`/admin/community/users/${userId}/profile-images`);
			return response.data.images || [];
		} catch (error: any) {
			console.error('프로필 이미지 조회 중 오류:', error);
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
			console.log('심사 대기 유저 목록 조회 요청:', {
				page,
				limit,
				search,
				filters,
				excludeUserIds: excludeUserIds?.length ?? 0,
			});

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

			const response = await axiosServer.get('/admin/profile-images/pending', {
				params,
			});

			console.log('심사 대기 유저 목록 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('심사 대기 유저 목록 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	getUserDetail: async (userId: string) => {
		try {
			console.log('유저 상세 정보 조회 요청:', userId);

			const response = await axiosServer.get(`/admin/user-review/${userId}`);

			console.log('유저 상세 정보 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('유저 상세 정보 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	approveUser: async (userId: string) => {
		try {
			console.log('유저 승인 요청:', userId);

			const response = await axiosServer.post(`/admin/profile-images/users/${userId}/approve`);

			console.log('유저 승인 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('유저 승인 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	rejectUser: async (userId: string, category: string, reason: string) => {
		try {
			console.log('유저 반려 요청:', { userId, category, reason });

			const response = await axiosServer.post(`/admin/user-review/${userId}/reject`, {
				category,
				reason,
			});

			console.log('유저 반려 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('유저 반려 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
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
				console.error(`유저 ${userId} 반려 실패:`, error);
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
			console.log('유저 Rank 업데이트 요청:', { userId, rank, emitEvent });

			const response = await axiosServer.patch(
				`/admin/profiles/${userId}/rank`,
				{ rank },
				{ params: { emitEvent } },
			);

			console.log('유저 Rank 업데이트 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('유저 Rank 업데이트 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
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

			const response = await axiosServer.get('/admin/profile-images/review-history', {
				params,
			});

			return response.data;
		} catch (error: any) {
			console.error('심사 이력 조회 중 오류:', error);
			throw error;
		}
	},
};

export const profileImages = {
	getPendingProfileImages: async () => {
		try {
			console.log('심사 대기 중인 프로필 이미지 목록 조회 요청');

			const response = await axiosServer.get('/admin/profile-images/pending');

			console.log('심사 대기 중인 프로필 이미지 목록 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('심사 대기 중인 프로필 이미지 목록 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	approveProfileImage: async (userId: string) => {
		try {
			console.log('프로필 이미지 승인 요청:', userId);

			const response = await axiosServer.post(`/admin/profile-images/users/${userId}/approve`);

			console.log('프로필 이미지 승인 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('프로필 이미지 승인 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	rejectProfileImage: async (userId: string, rejectionReason: string) => {
		try {
			console.log('프로필 이미지 거절 요청:', { userId, rejectionReason });

			const response = await axiosServer.post(`/admin/profile-images/users/${userId}/reject`, {
				rejectionReason,
			});

			console.log('프로필 이미지 거절 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('프로필 이미지 거절 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	approveIndividualImage: async (imageId: string) => {
		try {
			console.log('개별 프로필 이미지 승인 요청:', imageId);

			const response = await axiosServer.post(`/admin/profile-images/${imageId}/approve`);

			console.log('개별 프로필 이미지 승인 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('개별 프로필 이미지 승인 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	rejectIndividualImage: async (imageId: string, rejectionReason: string) => {
		try {
			console.log('개별 프로필 이미지 거절 요청:', {
				imageId,
				rejectionReason,
			});

			const response = await axiosServer.post(`/admin/profile-images/${imageId}/reject`, {
				rejectionReason,
			});

			console.log('개별 프로필 이미지 거절 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('개별 프로필 이미지 거절 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	setMainImage: async (userId: string, imageId: string) => {
		try {
			console.log('대표 사진 변경 요청:', { userId, imageId });

			const response = await axiosServer.post(
				`/admin/profile-images/users/${userId}/set-main/${imageId}`,
			);

			console.log('대표 사진 변경 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('대표 사진 변경 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},
};
