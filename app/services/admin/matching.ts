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
			console.error('매칭 내역 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			console.error('[디버그] 요청 전체 URL:', `${error.config?.baseURL || ''}${error.config?.url || ''}`);
			console.error('[디버그] 요청 파라미터:', JSON.stringify(error.config?.params));
			console.error('[디버그] 응답 상태 코드:', error.response?.status);
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
			console.error('중복 매칭 여부 확인 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
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
			console.error('사용자 매칭 횟수 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
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
			console.error('매칭 상대 이력 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
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
			console.error('직접 매칭 생성 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
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
			console.error('매칭 실패 내역 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
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
			console.error('사용자 매칭 결과 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
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
			console.error('매칭되지 않은 사용자 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
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
			console.error('배치 매칭 처리 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
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
			console.error('단일 사용자 매칭 처리 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
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
			console.error('좋아요 이력 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	// 매칭 통계 조회 (임시 데이터)
	getMatchingStats: async (
		period: 'daily' | 'weekly' | 'monthly' = 'daily',
		university?: string,
	) => {
		try {
			;

			// 실제 API가 구현되면 아래 코드로 대체
			// const response = await axiosServer.get('/admin/matching/stats', {
			//   params: { period, university }
			// });
			// return response.data;

			// 임시 데이터 반환
			const baseStats = {
				totalMatchRate: 75.5,
				maleMatchRate: 70.2,
				femaleMatchRate: 80.8,
				totalRematchRate: 45.3,
				maleRematchRate: 48.6,
				femaleRematchRate: 42.0,
				maleSecondRematchRate: 25.4,
				femaleSecondRematchRate: 22.8,
				maleThirdRematchRate: 12.3,
				femaleThirdRematchRate: 10.5,
			};

			// 대학별 통계 (임시 데이터)
			const universityStats: Record<string, any> = {
				충남대학교: {
					totalMatchRate: 78.2,
					maleMatchRate: 72.5,
					femaleMatchRate: 83.9,
					totalRematchRate: 42.1,
					maleRematchRate: 45.3,
					femaleRematchRate: 39.0,
					maleSecondRematchRate: 23.1,
					femaleSecondRematchRate: 20.5,
					maleThirdRematchRate: 11.2,
					femaleThirdRematchRate: 9.8,
				},
				KAIST: {
					totalMatchRate: 72.8,
					maleMatchRate: 68.4,
					femaleMatchRate: 77.2,
					totalRematchRate: 48.5,
					maleRematchRate: 51.2,
					femaleRematchRate: 45.8,
					maleSecondRematchRate: 27.6,
					femaleSecondRematchRate: 24.3,
					maleThirdRematchRate: 13.5,
					femaleThirdRematchRate: 11.2,
				},
				한밭대학교: {
					totalMatchRate: 76.1,
					maleMatchRate: 71.3,
					femaleMatchRate: 81.0,
					totalRematchRate: 44.7,
					maleRematchRate: 47.8,
					femaleRematchRate: 41.6,
					maleSecondRematchRate: 24.9,
					femaleSecondRematchRate: 21.7,
					maleThirdRematchRate: 12.0,
					femaleThirdRematchRate: 10.1,
				},
				한남대학교: {
					totalMatchRate: 77.3,
					maleMatchRate: 72.0,
					femaleMatchRate: 82.6,
					totalRematchRate: 43.5,
					maleRematchRate: 46.7,
					femaleRematchRate: 40.3,
					maleSecondRematchRate: 24.0,
					femaleSecondRematchRate: 21.0,
					maleThirdRematchRate: 11.7,
					femaleThirdRematchRate: 9.9,
				},
				배재대학교: {
					totalMatchRate: 74.8,
					maleMatchRate: 69.5,
					femaleMatchRate: 80.1,
					totalRematchRate: 46.0,
					maleRematchRate: 49.2,
					femaleRematchRate: 42.8,
					maleSecondRematchRate: 25.8,
					femaleSecondRematchRate: 22.5,
					maleThirdRematchRate: 12.6,
					femaleThirdRematchRate: 10.7,
				},
			};

			// 기간별 변동 (임시 데이터)
			const periodModifier = {
				daily: 1,
				weekly: 0.95,
				monthly: 0.9,
			};

			// 대학이 지정된 경우 해당 대학 통계 반환, 없으면 기본 통계 반환
			const stats =
				university && universityStats[university] ? universityStats[university] : baseStats;

			// 기간별 변동 적용
			const modifier = periodModifier[period];
			const result: Record<string, number> = {};

			Object.entries(stats).forEach(([key, value]) => {
				result[key] = parseFloat(((value as number) * modifier).toFixed(1));
			});

			return result;
		} catch (error: any) {
			console.error('매칭 통계 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
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
			console.error('유저 검색 중 오류:', error);
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
			console.error('강제 채팅방 생성 중 오류:', error);
			throw error;
		}
	},
};
