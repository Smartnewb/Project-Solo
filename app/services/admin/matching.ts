import axiosServer from '@/utils/axios';
import { getCountryHeader } from './_shared';

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
		try {
			;

			// 파라미터 객체 생성
			const params: any = { startDate, endDate, page, limit };

			// 이름 검색어가 있는 경우 추가
			if (name && name.trim() !== '') {
				params.name = name.trim();
			}

			// 매칭 타입이 있는 경우 추가
			if (type && type !== 'all') {
				params.type = type;
			}

			const response = await axiosServer.get('/admin/matching/match-history', {
				params,
			});

			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	// 중복 매칭 여부 확인
	getMatchCount: async (myId: string, matcherId: string) => {
		try {
			;

			const response = await axiosServer.get('/admin/matching/match-count', {
				params: { myId, matcherId },
			});

			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	// 사용자 매칭 횟수 조회
	getUserMatchCount: async (
		myId: string,
		matcherId: string,
		startDate?: string,
		endDate?: string,
	) => {
		try {
			;

			const params: any = { myId, matcherId };
			if (startDate) params.startDate = startDate;
			if (endDate) params.endDate = endDate;

			const response = await axiosServer.get('/admin/matching/match-count', {
				params,
			});

			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
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
		try {
			;

			// 파라미터 객체 생성
			const params: any = { matcherId, startDate, endDate, page, limit };

			// 이름 검색어가 있는 경우 추가
			if (name && name.trim() !== '') {
				params.name = name.trim();
			}

			const response = await axiosServer.get('/admin/matching/match-history', { params });

			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	// 직접 매칭 생성
	createDirectMatch: async (
		requesterId: string,
		targetId: string,
		type: 'rematching' | 'scheduled',
	) => {
		try {
			;

			const response = await axiosServer.post('/admin/matching/direct-match', {
				requesterId,
				targetId,
				type,
			});

			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	// 매칭 실패 내역 조회
	getFailureLogs: async (date: string, page: number = 1, limit: number = 10, reason?: string) => {
		try {
			;

			// 백엔드 DTO: { startDate, endDate, page, limit, reason }
			const params: any = {
				startDate: date,
				endDate: date,
				page,
				limit,
			};

			// 사유 검색어가 있는 경우 추가
			if (reason && reason.trim() !== '') {
				params.reason = reason.trim();
			}

			const response = await axiosServer.get('/admin/matching/failure-logs', {
				params,
			});

			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	// 특정 사용자의 매칭 결과만 조회
	findMatches: async (userId: string, options?: any) => {
		try {
			;

			const requestData = {
				userId,
				...options,
			};

			const response = await axiosServer.post('/admin/matching/user/read', requestData);
			;

			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	// 매칭되지 않은 사용자 조회
	getUnmatchedUsers: async (
		page: number = 1,
		limit: number = 10,
		name?: string,
		gender?: string,
	) => {
		try {
			;

			const params: any = { page, limit };
			if (name) params.name = name;
			if (gender && gender !== 'all') params.gender = gender;

			const response = await axiosServer.get('/admin/matching/unmatched-users', {
				params,
			});
			;

			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	// 배치 매칭 처리
	processBatchMatching: async () => {
		try {
			;

			const response = await axiosServer.post('/admin/matching/batch');
			;

			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	// 단일 사용자 매칭 처리
	processSingleMatching: async (userId: string) => {
		try {
			;

			const requestData = {
				userId,
			};

			const response = await axiosServer.post('/admin/matching/user', requestData);
			;

			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	// 좋아요 이력 조회
	getLikeHistory: async (
		startDate: string,
		endDate: string,
		page: number = 1,
		limit: number = 10,
		name?: string,
	) => {
		try {
			;

			// 파라미터 객체 생성
			const params: any = { startDate, endDate, page, limit };

			// 이름 검색어가 있는 경우 추가
			if (name && name.trim() !== '') {
				params.name = name.trim();
			}

			const response = await axiosServer.get('/admin/matching/like-history', {
				params,
			});

			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	getMatchingStats: async (
		period: 'daily' | 'weekly' | 'monthly' = 'daily',
		university?: string,
	): Promise<Record<string, number> | null> => {
		try {
			const response = await axiosServer.get('/admin/matching/stats', {
				params: { period, university },
			});
			return response.data;
		} catch (error: any) {
			if (error?.response?.status === 404) {
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
		try {
			const country = getCountryHeader();
			// API 스펙: gender는 대문자(MALE, FEMALE), status는 소문자(approved)
			const genderParam = params.gender ? params.gender.toUpperCase() : undefined;
			const statusParam = (params.status || 'approved').toLowerCase();

			const response = await axiosServer.get('/admin/users', {
				params: {
					search: params.search,
					gender: genderParam,
					status: statusParam,
					page: params.page || 1,
					limit: params.limit || 10,
				},
				headers: { 'X-Country': country },
			});
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	// 강제 채팅방 생성
	createForceChatRoom: async (data: { userIdA: string; userIdB: string; reason?: string }) => {
		try {
			const country = getCountryHeader();
			const response = await axiosServer.post('/admin/force-chat-room', data, {
				headers: { 'X-Country': country },
			});
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},
};
