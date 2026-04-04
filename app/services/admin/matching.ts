import { adminGet, adminPost } from '@/shared/lib/http/admin-fetch';

export const matching = {
	// 매칭 내역 조회
	getMatchHistory: async (
		startDate: string,
		endDate: string,
		page: number = 1,
		limit: number = 10,
		name?: string,
		type?: string,
	) => {
		const params: Record<string, string> = {
			startDate,
			endDate,
			page: String(page),
			limit: String(limit),
		};

		if (name && name.trim() !== '') {
			params.name = name.trim();
		}

		if (type && type !== 'all') {
			params.type = type;
		}

		const result = await adminGet<{ data: any }>('/admin/v2/matching', params);
		return result.data;
	},

	// 중복 매칭 여부 확인
	getMatchCount: async (myId: string, matcherId: string) => {
		const result = await adminGet<{ data: any }>('/admin/v2/matching/match-count', { myId, matcherId });
		return result.data;
	},

	// 사용자 매칭 횟수 조회
	getUserMatchCount: async (
		myId: string,
		matcherId: string,
		startDate?: string,
		endDate?: string,
	) => {
		const params: Record<string, string> = { myId, matcherId };
		if (startDate) params.startDate = startDate;
		if (endDate) params.endDate = endDate;

		const result = await adminGet<{ data: any }>('/admin/v2/matching/match-count', params);
		return result.data;
	},

	// 특정 사용자가 매칭 상대로 선택된 이력 조회
	getMatcherHistory: async (
		matcherId: string,
		startDate: string,
		endDate: string,
		page: number = 1,
		limit: number = 10,
		name?: string,
	) => {
		const params: Record<string, string> = {
			matcherId,
			startDate,
			endDate,
			page: String(page),
			limit: String(limit),
		};

		if (name && name.trim() !== '') {
			params.name = name.trim();
		}

		const result = await adminGet<{ data: any }>('/admin/v2/matching', params);
		return result.data;
	},

	// 직접 매칭 생성
	createDirectMatch: async (
		requesterId: string,
		targetId: string,
		type: 'rematching' | 'scheduled',
	) => {
		const res = await adminPost<{ data: any }>('/admin/v2/matching/force', {
			userIdA: requesterId,
			userIdB: targetId,
			reason: `single-matching:${type}`,
		});
		return res.data;
	},

	// 매칭 실패 내역 조회
	getFailureLogs: async (date: string, page: number = 1, limit: number = 10, reason?: string) => {
		const params: Record<string, string> = {
			startDate: date,
			endDate: date,
			page: String(page),
			limit: String(limit),
		};

		if (reason && reason.trim() !== '') {
			params.reason = reason.trim();
		}

		const result = await adminGet<{ data: any }>('/admin/v2/matching/failure-logs', params);
		return result.data;
	},

	// 특정 사용자의 매칭 결과만 조회
	findMatches: async (userId: string, options?: any) => {
		const requestData = {
			userId,
			...options,
		};

		const result = await adminPost<{ data: any }>('/admin/v2/matching/user/read', requestData);
		return result.data;
	},

	// 매칭되지 않은 사용자 조회
	getUnmatchedUsers: async (
		page: number = 1,
		limit: number = 10,
		name?: string,
		gender?: string,
	) => {
		const params: Record<string, string> = {
			page: String(page),
			limit: String(limit),
		};
		if (name) params.name = name;
		if (gender && gender !== 'all') params.gender = gender;

		const result = await adminGet<{ data: any }>('/admin/v2/matching/unmatched-users', params);
		return result.data;
	},

	// 배치 매칭 처리
	processBatchMatching: async () => {
		const result = await adminPost<{ data: any }>('/admin/v2/matching/batch');
		return result.data;
	},

	// 단일 사용자 매칭 처리
	processSingleMatching: async (userId: string) => {
		const result = await adminPost<{ data: any }>('/admin/v2/matching/user', { userId });
		return result.data;
	},

	// 좋아요 이력 조회
	getLikeHistory: async (
		startDate: string,
		endDate: string,
		page: number = 1,
		limit: number = 10,
		name?: string,
	) => {
		const params: Record<string, string> = {
			startDate,
			endDate,
			page: String(page),
			limit: String(limit),
		};

		if (name && name.trim() !== '') {
			params.name = name.trim();
		}

		const res = await adminGet<{ data: any }>('/admin/v2/matching/likes', params);
		return res.data;
	},

	getMatchingStats: async (
		period: 'daily' | 'weekly' | 'monthly' = 'daily',
		university?: string,
	): Promise<any> => {
		try {
			const params: Record<string, string> = { period };
			if (university) params.university = university;

			const result = await adminGet<{ data: any }>('/admin/v2/matching/stats', params);
			return result.data;
		} catch (error: any) {
			if (error?.status === 404 || error?.response?.status === 404) {
				return null;
			}
			throw error;
		}
	},
};

// 강제 매칭 API
export const forceMatching = {
	// 유저 검색 (기존 /admin/users API 활용)
	searchUsers: async (params: {
		search?: string;
		gender?: 'male' | 'female';
		status?: string;
		page?: number;
		limit?: number;
	}) => {
		// API 스펙: gender는 대문자(MALE, FEMALE), filter는 UsersQuery DTO 기준(verified 등)
		const genderParam = params.gender ? params.gender.toUpperCase() : undefined;

		const queryParams: Record<string, string> = {
			filter: 'verified',
			page: String(params.page || 1),
			limit: String(params.limit || 10),
		};
		if (params.search) queryParams.search = params.search;
		if (genderParam) queryParams.gender = genderParam;

		const res = await adminGet<{ data: any }>('/admin/v2/users', queryParams);
		return res.data;
	},

	// 강제 채팅방 생성
	createForceChatRoom: async (data: { userIdA: string; userIdB: string; reason?: string }) => {
		const result = await adminPost<{ data: any }>('/admin/v2/matching/force', data);
		return result.data;
	},
};
