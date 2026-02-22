import type {
	ActionLogsResponse,
	AdminCardNewsItem,
	AdminCardNewsListResponse,
	AdminLikesParams,
	AdminLikesResponse,
	AdminSometimeArticleDetail,
	AdminSometimeArticleItem,
	AdminSometimeArticleListResponse,
	AppleRefundListParams,
	AppleRefundListResponse,
	BackgroundPreset,
	BackgroundPresetsResponse,
	Banner,
	BannerPosition,
	CooldownStatusResponse,
	CreateBannerRequest,
	CreateCardNewsRequest,
	CreatePresetRequest,
	CreateSometimeArticleRequest,
	DeletedFemalesListResponse,
	DormantLikeDetailResponse,
	DormantLikesDashboardResponse,
	EligibleChatRoomsResponse,
	ProcessLikesRequest,
	ProcessLikesResponse,
	ProcessRefundRequest,
	ProcessRefundResponse,
	PublishCardNewsRequest,
	PublishCardNewsResponse,
	RefundPreviewRequest,
	RefundPreviewResponse,
	RefundUserSearchResponse,
	RestoreFemaleResponse,
	SleepFemaleResponse,
	UpdateBannerOrderRequest,
	UpdateBannerRequest,
	UpdateCardNewsRequest,
	UpdateSometimeArticleRequest,
	UploadAndCreatePresetRequest,
	UploadImageResponse,
	ViewProfileRequest,
	ViewProfileResponse,
} from '@/types/admin';
import axiosServer, { axiosMultipart, axiosNextGen } from '@/utils/axios';

// 상단에 타입 정의 추가
interface StatItem {
	grade: string;
	count: number;
	percentage: number;
}

interface GenderStatItem {
	gender: string;
	stats: StatItem[];
}

interface FormattedData {
	total: number;
	stats: StatItem[];
	genderStats: GenderStatItem[];
}

const getCountryHeader = (): string => {
	if (typeof window !== 'undefined') {
		return localStorage.getItem('admin_selected_country') || 'kr';
	}
	return 'kr';
};

const auth = {
	cleanup: () => {
		localStorage.removeItem('user');
		localStorage.removeItem('isAdmin');
	},
};

const stats = {
	getTotalUsersCount: async (region?: string, includeDeleted?: boolean, useCluster?: boolean) => {
		try {
			const params: any = {};
			if (region) params.region = region;
			if (includeDeleted !== undefined) params.includeDeleted = String(includeDeleted);
			if (useCluster !== undefined) params.useCluster = String(useCluster);

			const response = await axiosServer.get('/admin/stats/users/total', {
				params,
			});
			console.log('총 회원 수 API 응답:', response.data);

			// 실제 사용자 수를 반환하도록 수정
			// 임시 수정: 실제 사용자 수를 임의로 설정 (API가 완성되면 제거)
			return { totalUsers: response.data.totalUsers }; // 임시 값으로 설정
		} catch (error) {
			console.error('총 회원 수 조회 중 오류:', error);
			return { totalUsers: 120 }; // 오류 발생 시 기본값 반환
		}
	},
	getDailySignupCount: async (region?: string, includeDeleted?: boolean, useCluster?: boolean) => {
		try {
			const params: any = {};
			if (region) params.region = region;
			if (includeDeleted !== undefined) params.includeDeleted = String(includeDeleted);
			if (useCluster !== undefined) params.useCluster = String(useCluster);

			const response = await axiosServer.get('/admin/stats/users/daily', {
				params,
			});
			console.log('오늘 가입한 회원 수 API 응답:', response.data);
			return response.data || { dailySignups: 4 };
		} catch (error) {
			console.error('오늘 가입한 회원 수 조회 중 오류:', error);
			return { dailySignups: 4 }; // 오류 발생 시 기본값 반환
		}
	},
	getWeeklySignupCount: async (region?: string, includeDeleted?: boolean, useCluster?: boolean) => {
		try {
			const params: any = {};
			if (region) params.region = region;
			if (includeDeleted !== undefined) params.includeDeleted = String(includeDeleted);
			if (useCluster !== undefined) params.useCluster = String(useCluster);

			const response = await axiosServer.get('/admin/stats/users/weekly', {
				params,
			});
			console.log('이번 주 가입한 회원 수 API 응답:', response.data);
			return response.data || { weeklySignups: 12 };
		} catch (error) {
			console.error('이번 주 가입한 회원 수 조회 중 오류:', error);
			return { weeklySignups: 12 }; // 오류 발생 시 기본값 반환
		}
	},
	getDailySignupTrend: async (region?: string, includeDeleted?: boolean, useCluster?: boolean) => {
		try {
			const params: any = {};
			if (region) params.region = region;
			if (includeDeleted !== undefined) params.includeDeleted = String(includeDeleted);
			if (useCluster !== undefined) params.useCluster = String(useCluster);

			const response = await axiosServer.get('/admin/stats/users/trend/daily', {
				params,
			});
			return response.data;
		} catch (error) {
			console.error('일별 회원가입 추이 조회 중 오류:', error);
			throw error;
		}
	},
	getWeeklySignupTrend: async (region?: string, includeDeleted?: boolean, useCluster?: boolean) => {
		try {
			const params: any = {};
			if (region) params.region = region;
			if (includeDeleted !== undefined) params.includeDeleted = String(includeDeleted);
			if (useCluster !== undefined) params.useCluster = String(useCluster);

			const response = await axiosServer.get('/admin/stats/users/trend/weekly', { params });
			return response.data;
		} catch (error) {
			console.error('주별 회원가입 추이 조회 중 오류:', error);
			throw error;
		}
	},
	getMonthlySignupTrend: async (
		region?: string,
		includeDeleted?: boolean,
		useCluster?: boolean,
	) => {
		try {
			const params: any = {};
			if (region) params.region = region;
			if (includeDeleted !== undefined) params.includeDeleted = String(includeDeleted);
			if (useCluster !== undefined) params.useCluster = String(useCluster);

			const response = await axiosServer.get('/admin/stats/users/trend/monthly', { params });
			return response.data;
		} catch (error) {
			console.error('월별 회원가입 추이 조회 중 오류:', error);
			throw error;
		}
	},

	// 사용자 지정 기간 회원가입자 수 조회
	getCustomPeriodSignupCount: async (
		startDate: string,
		endDate: string,
		region?: string,
		includeDeleted?: boolean,
		useCluster?: boolean,
	) => {
		try {
			console.log('사용자 지정 기간 조회:', startDate, endDate, region, includeDeleted, useCluster);
			const requestData: any = {
				startDate,
				endDate,
			};

			if (region) {
				requestData.region = region;
			}

			if (includeDeleted !== undefined) {
				requestData.includeDeleted = includeDeleted;
			}

			if (useCluster !== undefined) {
				requestData.useCluster = useCluster;
			}

			const response = await axiosServer.post('/admin/stats/users/custom-period', requestData);

			// 응답 로깅
			console.log('원본 API 응답:', response);
			console.log('응답 데이터:', response.data);

			return response.data;
		} catch (error) {
			console.error('사용자 지정 기간 회원가입자 수 조회 중 오류:', error);
			throw error;
		}
	},

	// 사용자 지정 기간 회원가입 추이 조회
	getCustomPeriodSignupTrend: async (
		startDate: string,
		endDate: string,
		region?: string,
		includeDeleted?: boolean,
		useCluster?: boolean,
	) => {
		try {
			console.log(
				'사용자 지정 기간 추이 조회:',
				startDate,
				endDate,
				region,
				includeDeleted,
				useCluster,
			);
			const requestData: any = {
				startDate,
				endDate,
			};

			if (region) {
				requestData.region = region;
			}

			if (includeDeleted !== undefined) {
				requestData.includeDeleted = includeDeleted;
			}

			if (useCluster !== undefined) {
				requestData.useCluster = useCluster;
			}

			const response = await axiosServer.post(
				'/admin/stats/users/trend/custom-period',
				requestData,
			);

			// 응답 로깅
			console.log('추이 원본 API 응답:', response);
			console.log('추이 응답 데이터:', response.data);

			return response.data;
		} catch (error) {
			console.error('사용자 지정 기간 회원가입 추이 조회 중 오류:', error);
			throw error;
		}
	},

	// 성별 통계 조회
	getGenderStats: async (region?: string, includeDeleted?: boolean, useCluster?: boolean) => {
		try {
			const params: any = {};
			if (region) params.region = region;
			if (includeDeleted !== undefined) params.includeDeleted = String(includeDeleted);
			if (useCluster !== undefined) params.useCluster = String(useCluster);

			const response = await axiosServer.get('/admin/stats/users/gender', {
				params,
			});
			console.log('성별 통계 API 응답:', response.data);

			// 임시 데이터 생성
			const mockData = {
				maleCount: 60,
				femaleCount: 60,
				totalCount: 120,
				malePercentage: 50,
				femalePercentage: 50,
				genderRatio: '1:1',
			};

			return response.data || mockData;
		} catch (error) {
			console.error('성별 통계 조회 중 오류:', error);

			// 오류 발생 시 기본값 반환
			return {
				maleCount: 60,
				femaleCount: 60,
				totalCount: 120,
				malePercentage: 50,
				femalePercentage: 50,
				genderRatio: '1:1',
			};
		}
	},

	// 대학별 통계 조회
	getUniversityStats: async (region?: string, includeDeleted?: boolean, useCluster?: boolean) => {
		try {
			const params: any = {};
			if (region) params.region = region;
			if (includeDeleted !== undefined) params.includeDeleted = String(includeDeleted);
			if (useCluster !== undefined) params.useCluster = String(useCluster);

			const response = await axiosServer.get('/admin/stats/users/universities', { params });
			console.log('서비스에서 받은 대학별 통계 데이터:', response.data);
			console.log('서비스에서 받은 데이터 구조:', JSON.stringify(response.data, null, 2));

			// 대학명 확인
			if (response.data && response.data.universities && response.data.universities.length > 0) {
				console.log('첫 번째 대학 데이터:', response.data.universities[0]);
				console.log('대학 데이터 키:', Object.keys(response.data.universities[0]));

				// 데이터 값 확인
				const firstUni = response.data.universities[0];
				console.log('첫 번째 대학 상세 데이터:');
				console.log('- 대학명:', firstUni.universityName);
				console.log('- 전체 회원수:', firstUni.totalCount);
				console.log('- 남성 회원수:', firstUni.maleCount);
				console.log('- 여성 회원수:', firstUni.femaleCount);
				console.log('- 사용자 비율:', firstUni.percentage);
				console.log('- 성비:', firstUni.genderRatio);
			}

			return response.data;
		} catch (error) {
			console.error('대학별 통계 조회 중 오류:', error);
			throw error;
		}
	},

	// 회원 탈퇴 통계 API
	// 총 탈퇴자 수 조회
	getTotalWithdrawalsCount: async (region?: string, useCluster?: boolean) => {
		try {
			const params: any = {};
			if (region) params.region = region;
			if (useCluster !== undefined) params.useCluster = useCluster;

			const response = await axiosServer.get('/admin/stats/withdrawals/total', {
				params,
			});
			return response.data || { totalWithdrawals: 0 };
		} catch (error) {
			console.error('총 탈퇴자 수 조회 중 오류:', error);
			return { totalWithdrawals: 0 }; // 오류 발생 시 기본값 반환
		}
	},

	// 일간 탈퇴자 수 조회
	getDailyWithdrawalCount: async (region?: string, useCluster?: boolean) => {
		try {
			const params: any = {};
			if (region) params.region = region;
			if (useCluster !== undefined) params.useCluster = useCluster;

			const response = await axiosServer.get('/admin/stats/withdrawals/daily', {
				params,
			});
			return response.data || { dailyWithdrawals: 0 };
		} catch (error) {
			console.error('오늘 탈퇴한 회원 수 조회 중 오류:', error);
			return { dailyWithdrawals: 0 }; // 오류 발생 시 기본값 반환
		}
	},

	// 주간 탈퇴자 수 조회
	getWeeklyWithdrawalCount: async () => {
		try {
			const response = await axiosServer.get('/admin/stats/withdrawals/weekly');
			return response.data || { weeklyWithdrawals: 0 };
		} catch (error) {
			console.error('이번 주 탈퇴한 회원 수 조회 중 오류:', error);
			return { weeklyWithdrawals: 0 }; // 오류 발생 시 기본값 반환
		}
	},

	// 월간 탈퇴자 수 조회
	getMonthlyWithdrawalCount: async () => {
		try {
			const response = await axiosServer.get('/admin/stats/withdrawals/monthly');
			return response.data || { monthlyWithdrawals: 0 };
		} catch (error) {
			console.error('이번 달 탈퇴한 회원 수 조회 중 오류:', error);
			return { monthlyWithdrawals: 0 }; // 오류 발생 시 기본값 반환
		}
	},

	// 사용자 지정 기간 탈퇴자 수 조회
	getCustomPeriodWithdrawalCount: async (startDate: string, endDate: string) => {
		try {
			console.log('사용자 지정 기간 탈퇴자 수 조회:', startDate, endDate);
			const response = await axiosServer.post('/admin/stats/withdrawals/custom-period', {
				startDate,
				endDate,
			});
			return response.data || { customPeriodWithdrawals: 0 };
		} catch (error) {
			console.error('사용자 지정 기간 탈퇴자 수 조회 중 오류:', error);
			return { customPeriodWithdrawals: 0 }; // 오류 발생 시 기본값 반환
		}
	},

	// 일별 탈퇴 추이 조회
	getDailyWithdrawalTrend: async () => {
		try {
			const response = await axiosServer.get('/admin/stats/withdrawals/trend/daily');
			return response.data || { data: [] };
		} catch (error) {
			console.error('일별 탈퇴 추이 조회 중 오류:', error);
			return { data: [] }; // 오류 발생 시 기본값 반환
		}
	},

	// 주별 탈퇴 추이 조회
	getWeeklyWithdrawalTrend: async () => {
		try {
			const response = await axiosServer.get('/admin/stats/withdrawals/trend/weekly');
			return response.data || { data: [] };
		} catch (error) {
			console.error('주별 탈퇴 추이 조회 중 오류:', error);
			return { data: [] }; // 오류 발생 시 기본값 반환
		}
	},

	// 월별 탈퇴 추이 조회
	getMonthlyWithdrawalTrend: async () => {
		try {
			const response = await axiosServer.get('/admin/stats/withdrawals/trend/monthly');
			return response.data || { data: [] };
		} catch (error) {
			console.error('월별 탈퇴 추이 조회 중 오류:', error);
			return { data: [] }; // 오류 발생 시 기본값 반환
		}
	},

	// 사용자 지정 기간 탈퇴 추이 조회
	getCustomPeriodWithdrawalTrend: async (startDate: string, endDate: string) => {
		try {
			console.log('사용자 지정 기간 탈퇴 추이 조회:', startDate, endDate);
			const response = await axiosServer.post('/admin/stats/withdrawals/trend/custom-period', {
				startDate,
				endDate,
			});
			return response.data || { data: [] };
		} catch (error) {
			console.error('사용자 지정 기간 탈퇴 추이 조회 중 오류:', error);
			return { data: [] }; // 오류 발생 시 기본값 반환
		}
	},

	// 탈퇴 사유 통계 조회
	getWithdrawalReasonStats: async (startDate?: string, endDate?: string) => {
		try {
			const params: any = {};
			if (startDate) params.startDate = startDate;
			if (endDate) params.endDate = endDate;

			const response = await axiosServer.get('/admin/stats/withdrawals/reasons', { params });
			return response.data || { reasons: [] };
		} catch (error) {
			console.error('탈퇴 사유 통계 조회 중 오류:', error);
			return { reasons: [] }; // 오류 발생 시 기본값 반환
		}
	},

	// 이탈률 조회
	getChurnRate: async () => {
		try {
			const response = await axiosServer.get('/admin/stats/withdrawals/churn-rate');
			return (
				response.data || {
					dailyChurnRate: 0,
					weeklyChurnRate: 0,
					monthlyChurnRate: 0,
				}
			);
		} catch (error) {
			console.error('이탈률 조회 중 오류:', error);
			return { dailyChurnRate: 0, weeklyChurnRate: 0, monthlyChurnRate: 0 }; // 오류 발생 시 기본값 반환
		}
	},
};
// 유저 외모 등급 관련 API
const userAppearance = {
	// 외모 등급 정보를 포함한 유저 목록 조회
	getUsersWithAppearanceGrade: async (params: {
		page?: number;
		limit?: number;
		gender?: 'MALE' | 'FEMALE';
		appearanceGrade?: 'S' | 'A' | 'B' | 'C' | 'UNKNOWN';
		universityName?: string;
		minAge?: number;
		maxAge?: number;
		searchTerm?: string;
		region?: string;
		useCluster?: boolean;
		isLongTermInactive?: boolean;
		hasPreferences?: boolean;
		includeDeleted?: boolean;
		userStatus?: 'pending' | 'approved' | 'rejected';
	}) => {
		try {
			console.log('유저 목록 조회 요청 파라미터:', JSON.stringify(params, null, 2));

			// URL 파라미터 구성
			const queryParams = new URLSearchParams();

			if (params.page) queryParams.append('page', params.page.toString());
			if (params.limit) queryParams.append('limit', params.limit.toString());
			if (params.gender) {
				console.log('성별 파라미터 전송 전:', params.gender);
				queryParams.append('gender', params.gender);
			}

			// 외모 등급 파라미터 처리
			if (params.appearanceGrade) {
				console.log('외모 등급 파라미터 전송 전:', params.appearanceGrade);
				queryParams.append('appearanceGrade', params.appearanceGrade);
			}

			if (params.universityName) queryParams.append('universityName', params.universityName);
			if (params.minAge) queryParams.append('minAge', params.minAge.toString());
			if (params.maxAge) queryParams.append('maxAge', params.maxAge.toString());
			if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
			if (params.region) queryParams.append('region', params.region);
			if (params.useCluster !== undefined)
				queryParams.append('useCluster', params.useCluster.toString());
			if (params.isLongTermInactive !== undefined)
				queryParams.append('isLongTermInactive', params.isLongTermInactive.toString());
			if (params.hasPreferences !== undefined)
				queryParams.append('hasPreferences', params.hasPreferences.toString());
			if (params.includeDeleted !== undefined)
				queryParams.append('includeDeleted', params.includeDeleted.toString());
			if (params.userStatus) queryParams.append('userStatus', params.userStatus);

			const url = `/admin/users/appearance?${queryParams.toString()}`;
			console.log('최종 API 요청 URL:', url);
			console.log('최종 쿼리 파라미터:', queryParams.toString());

			try {
				const response = await axiosServer.get(url);
				console.log('API 응답 상태:', response.status);
				console.log('API 응답 헤더:', response.headers);
				return response.data;
			} catch (error: any) {
				console.error('API 요청 실패:', error.message);
				console.error('에러 응답:', error.response?.data);
				console.error('에러 상태 코드:', error.response?.status);
				console.error('에러 헤더:', error.response?.headers);
				throw error;
			}
		} catch (error: any) {
			console.error('외모 등급 정보를 포함한 유저 목록 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			console.error('오류 상태 코드:', error.response?.status);
			console.error('요청 파라미터:', params);
			throw error;
		}
	},

	// 미분류 유저 목록 조회
	getUnclassifiedUsers: async (page: number, limit: number, region?: string) => {
		try {
			const params = new URLSearchParams();
			params.append('page', page.toString());
			params.append('limit', limit.toString());
			if (region) params.append('region', region);

			const response = await axiosServer.get(
				`/admin/users/appearance/unclassified?${params.toString()}`,
			);

			// 응답 데이터 로깅
			console.log('미분류 사용자 데이터 샘플:', response.data?.items?.slice(0, 2));

			return response.data;
		} catch (error) {
			console.error('미분류 유저 목록 조회 중 오류:', error);
			throw error;
		}
	},

	// 유저 외모 등급 설정
	setUserAppearanceGrade: async (userId: string, grade: 'S' | 'A' | 'B' | 'C' | 'UNKNOWN') => {
		console.log('등급 설정 요청:', { userId, grade });

		if (!userId) {
			throw new Error('유저 ID가 없습니다.');
		}

		if (!grade) {
			throw new Error('등급이 없습니다.');
		}

		try {
			const response = await axiosServer.patch(`/admin/users/appearance/${userId}`, { grade });
			console.log('등급 설정 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('유저 외모 등급 설정 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	// 유저 외모 등급 일괄 설정
	bulkSetUserAppearanceGrade: async (
		userIds: string[],
		grade: 'S' | 'A' | 'B' | 'C' | 'UNKNOWN',
	) => {
		console.log('일괄 등급 설정 요청:', { userIds: userIds.length, grade });

		try {
			const response = await axiosServer.patch('/admin/users/appearance/bulk', {
				userIds,
				grade,
			});
			return response.data;
		} catch (error) {
			console.error('유저 외모 등급 일괄 설정 중 오류:', error);
			throw error;
		}
	},

	// 유저 상세 정보 조회
	getUserDetails: async (userId: string) => {
		try {
			console.log('유저 상세 정보 조회 시작:', userId);

			const endpoint = `/admin/user-review/${userId}`;
			console.log(`API 엔드포인트: ${endpoint}`);

			const response = await axiosServer.get(endpoint);
			console.log('유저 상세 정보 응답:', response.data);

			const data = response.data;

			if (
				data.profileImageUrls &&
				Array.isArray(data.profileImageUrls) &&
				data.profileImageUrls.length > 0
			) {
				data.profileImages = data.profileImageUrls.map((url: string, index: number) => ({
					id: `${userId}-${index}`,
					url: url,
					order: index,
					isMain: index === 0,
				}));
				data.profileImageUrl = data.profileImageUrls[0];
			}

			return data;
		} catch (error: any) {
			console.error('유저 상세 정보 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	// 재매칭 티켓 조회
	getUserTickets: async (userId: string) => {
		try {
			console.log('재매칭 티켓 조회 시작:', userId);
			const endpoint = `/admin/tickets/user/${userId}`;
			console.log(`API 엔드포인트: ${endpoint}`);

			const response = await axiosServer.get(endpoint);
			console.log('재매칭 티켓 조회 응답:', response.data);

			return response.data;
		} catch (error: any) {
			console.error('재매칭 티켓 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);

			// 오류 발생 시 예외 던지기
			throw error;
		}
	},

	// 재매칭 티켓 생성
	createUserTickets: async (userId: string, count: number) => {
		try {
			console.log('재매칭 티켓 생성 시작:', { userId, count });
			const endpoint = `/admin/tickets`;
			console.log(`API 엔드포인트: ${endpoint}`);

			const response = await axiosServer.post(endpoint, {
				userId,
				count,
			});
			console.log('재매칭 티켓 생성 응답:', response.data);

			return response.data;
		} catch (error: any) {
			console.error('재매칭 티켓 생성 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);

			// 오류 발생 시 예외 던지기
			throw error;
		}
	},

	// 재매칭 티켓 제거
	deleteUserTickets: async (userId: string, count: number) => {
		try {
			console.log('재매칭 티켓 제거 시작:', { userId, count });
			const endpoint = `/admin/tickets`;
			console.log(`API 엔드포인트: ${endpoint}`);

			const response = await axiosServer.delete(endpoint, {
				data: {
					userId,
					count,
				},
			});
			console.log('재매칭 티켓 제거 응답:', response.data);

			return response.data;
		} catch (error: any) {
			console.error('재매칭 티켓 제거 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);

			// 오류 발생 시 예외 던지기
			throw error;
		}
	},

	// 구슬 조회
	getUserGems: async (userId: string) => {
		try {
			console.log('사용자 구슬 조회 시작:', userId);
			const endpoint = `/admin/gems/users/${userId}/balance`;

			const response = await axiosServer.get(endpoint);
			console.log('사용자 구슬 조회 응답:', response.data);

			return response.data;
		} catch (error: any) {
			console.error('사용자 구슬 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	// 구슬 추가
	addUserGems: async (userId: string, amount: number) => {
		try {
			console.log('사용자 구슬 추가 시작:', { userId, amount });
			const endpoint = `/admin/gems/users/${userId}/add`;

			const response = await axiosServer.post(endpoint, { amount });

			console.log('사용자 구슬 추가 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('사용자 구슬 추가 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	// 구슬 제거
	removeUserGems: async (userId: string, amount: number) => {
		try {
			console.log('사용자 구슬 제거 시작:', { userId, amount });
			const endpoint = `/admin/gems/users/${userId}/deduct`;

			const response = await axiosServer.post(endpoint, { amount });

			console.log('사용자 구슬 제거 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('사용자 구슬 제거 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	// 유저 프로필 직접 수정
	updateUserProfile: async (userId: string, profileData: any) => {
		try {
			console.log('유저 프로필 수정 시작:', userId);
			console.log('프로필 수정 데이터:', profileData);

			// API 엔드포인트 (API 문서에서 확인한 정확한 경로)
			const endpoint = `/admin/users/detail/profile`;
			console.log(`API 엔드포인트: ${endpoint}`);

			// 요청 데이터 구성 (API 스키마에 맞게 조정)
			const requestData = {
				userId: userId,
				name: profileData.name,
				email: profileData.email,
				phoneNumber: profileData.phoneNumber,
				instagramId: profileData.instagramId,
				mbti: profileData.mbti,
			};

			console.log('API 요청 데이터:', requestData);

			const response = await axiosServer.post(endpoint, requestData);
			console.log('유저 프로필 수정 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('유저 프로필 수정 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);

			// 오류 발생 시 예외 던지기
			throw error;
		}
	},

	// 계정 상태 변경 (활성화/비활성화/정지)
	updateAccountStatus: async (
		userId: string,
		status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
		reason?: string,
	) => {
		try {
			console.log('계정 상태 변경 요청:', { userId, status, reason });

			const response = await axiosServer.post('/admin/users/detail/status', {
				userId,
				status,
				reason,
			});

			console.log('계정 상태 변경 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('계정 상태 변경 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	// 경고 메시지 발송
	sendWarningMessage: async (userId: string, message: string) => {
		try {
			console.log('경고 메시지 발송 요청:', { userId, message });

			const response = await axiosServer.post('/admin/users/detail/warning', {
				userId,
				message,
			});

			console.log('경고 메시지 발송 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('경고 메시지 발송 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	// 이메일 발송
	sendEmailNotification: async (userId: string, subject: string, message: string) => {
		try {
			console.log('이메일 발송 요청:', { userId, subject, message });

			const response = await axiosServer.post('/admin/notification/email', {
				userId,
				subject,
				message,
			});

			console.log('이메일 발송 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('이메일 발송 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	// SMS 발송
	sendSmsNotification: async (userId: string, message: string) => {
		try {
			console.log('SMS 발송 요청:', { userId, message });

			const response = await axiosServer.post('/admin/notification/sms', {
				userId,
				message,
			});

			console.log('SMS 발송 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('SMS 발송 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	// 강제 로그아웃
	forceLogout: async (userId: string) => {
		try {
			console.log('강제 로그아웃 요청:', { userId });

			const response = await axiosServer.post('/admin/users/detail/logout', {
				userId,
			});

			console.log('강제 로그아웃 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('강제 로그아웃 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	// 프로필 수정 요청 발송
	sendProfileUpdateRequest: async (userId: string, message: string) => {
		try {
			console.log('프로필 수정 요청 발송:', { userId, message });

			const response = await axiosServer.post('/admin/users/detail/profile-update-request', {
				userId,
				message,
			});

			console.log('프로필 수정 요청 발송 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('프로필 수정 요청 발송 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	// 인스타그램 오류 상태 설정
	setInstagramError: async (userId: string) => {
		try {
			console.log('인스타그램 오류 상태 설정 요청:', { userId });

			const response = await axiosServer.post('/admin/users/detail/instagram-error', {
				userId,
			});

			console.log('인스타그램 오류 상태 설정 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('인스타그램 오류 상태 설정 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	// 인스타그램 오류 상태 해제
	resetInstagramError: async (userId: string) => {
		try {
			console.log('인스타그램 오류 상태 해제 요청:', { userId });

			const response = await axiosServer.post('/admin/users/detail/instagram-reset', {
				userId,
			});

			console.log('인스타그램 오류 상태 해제 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('인스타그램 오류 상태 해제 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	// 외모 등급 통계 조회
	getAppearanceGradeStats: async (region?: string, useCluster?: boolean) => {
		try {
			console.log('외모 등급 통계 API 호출 시작');

			// API 엔드포인트 - API 문서에 명시된 경로 사용
			const endpoint = '/admin/users/appearance/stats';
			console.log(`API 엔드포인트: ${endpoint}`);

			// 토큰 확인
			const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
			console.log('토큰 존재 여부:', !!token);

			// 캐싱 방지를 위한 타임스탬프 추가
			const timestamp = new Date().getTime();

			// 쿼리 파라미터 구성
			const params = new URLSearchParams();
			params.append('_t', timestamp.toString());
			if (region) params.append('region', region);
			if (useCluster !== undefined) params.append('useCluster', useCluster.toString());

			// API 호출 (캐싱 방지를 위한 쿼리 파라미터 추가)
			const finalUrl = `${endpoint}?${params.toString()}`;
			console.log('API 요청 URL:', finalUrl);
			console.log('API 요청 헤더:', {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			});

			// 테스트 데이터 (API 응답 예시)
			const testData = {
				all: {
					S: 623,
					A: 622,
					B: 619,
					C: 619,
					UNKNOWN: 619,
					total: 3102,
				},
				male: {
					S: 289,
					A: 308,
					B: 310,
					C: 311,
					UNKNOWN: 326,
					total: 1544,
				},
				female: {
					S: 334,
					A: 314,
					B: 309,
					C: 308,
					UNKNOWN: 293,
					total: 1558,
				},
			};

			let responseData;

			try {
				// Axios를 사용한 API 호출
				const response = await axiosServer.get(finalUrl);
				console.log('Axios API 응답 상태 코드:', response.status);
				console.log('Axios API 응답 데이터 전체:', response.data);
				console.log('Axios API 응답 데이터 (JSON):', JSON.stringify(response.data, null, 2));

				// 응답 데이터가 비어있거나 형식이 맞지 않는 경우 테스트 데이터 사용
				if (!response.data || Object.keys(response.data).length === 0) {
					console.log('API 응답이 비어있어 테스트 데이터를 사용합니다.');
					responseData = testData;
				} else {
					responseData = response.data;
				}
			} catch (error) {
				console.error('API 호출 오류:', error);
				console.log('API 호출 오류로 테스트 데이터를 사용합니다.');
				responseData = testData;
			}

			console.log('처리할 응답 데이터:', responseData);

			// 응답 데이터 구조 변환
			const formattedData: FormattedData = {
				total: 0,
				stats: [],
				genderStats: [],
			};

			// 응답 데이터가 객체인지 확인
			if (typeof responseData === 'object' && responseData !== null) {
				console.log('응답 데이터 처리 시작');
				console.log('응답 데이터 구조:', Object.keys(responseData));

				// 새로운 API 응답 구조 처리 (제공된 예시 구조)
				if (responseData.all && responseData.male && responseData.female) {
					console.log('새로운 API 응답 구조 감지');

					// 전체 통계 처리
					const allStats = responseData.all;
					formattedData.total = allStats.total || 0;

					// 등급별 통계 처리
					const grades = ['S', 'A', 'B', 'C', 'UNKNOWN'];
					formattedData.stats = grades.map((grade) => {
						const count = allStats[grade] || 0;
						const percentage = allStats.total > 0 ? (count / allStats.total) * 100 : 0;

						return {
							grade,
							count,
							percentage,
						};
					});

					// 성별 통계 처리
					formattedData.genderStats = [
						{
							gender: 'MALE',
							stats: grades.map((grade) => {
								const count = responseData.male[grade] || 0;
								const percentage =
									responseData.male.total > 0 ? (count / responseData.male.total) * 100 : 0;

								return {
									grade,
									count,
									percentage,
								};
							}),
						},
						{
							gender: 'FEMALE',
							stats: grades.map((grade) => {
								const count = responseData.female[grade] || 0;
								const percentage =
									responseData.female.total > 0 ? (count / responseData.female.total) * 100 : 0;

								return {
									grade,
									count,
									percentage,
								};
							}),
						},
					];

					console.log('처리된 전체 통계:', formattedData.stats);
					console.log('처리된 성별 통계:', formattedData.genderStats);
				} else {
					console.log('기존 API 응답 구조 처리 시도');

					// 총 사용자 수 처리
					if ('total' in responseData) {
						formattedData.total = responseData.total || 0;
					} else if ('data' in responseData && 'total' in responseData.data) {
						formattedData.total = responseData.data.total || 0;
					}
					console.log('총 사용자 수 (처리 후):', formattedData.total);

					// 등급별 통계 처리
					let statsData = [];
					if (Array.isArray(responseData.stats)) {
						statsData = responseData.stats;
					} else if (responseData.data && Array.isArray(responseData.data.stats)) {
						statsData = responseData.data.stats;
					}

					console.log('등급별 통계 데이터:', statsData);

					// 백분율 계산이 되어 있지 않은 경우 계산
					formattedData.stats = statsData.map(
						(stat: { count: number; percentage: number; grade: string }) => {
							const count = stat.count || 0;
							let percentage = stat.percentage;

							if (typeof percentage !== 'number' && formattedData.total > 0) {
								percentage = (count / formattedData.total) * 100;
							}

							return {
								grade: stat.grade,
								count: count,
								percentage: percentage || 0,
							};
						},
					);

					console.log('처리된 등급별 통계:', formattedData.stats);

					// 성별 통계 처리
					let genderStatsData = [];
					if (Array.isArray(responseData.genderStats)) {
						genderStatsData = responseData.genderStats;
					} else if (responseData.data && Array.isArray(responseData.data.genderStats)) {
						genderStatsData = responseData.data.genderStats;
					}

					console.log('성별 통계 데이터:', genderStatsData);

					formattedData.genderStats = genderStatsData.map(
						(genderStat: { stats: any[]; gender: string }) => {
							// 각 성별별 총 사용자 수 계산
							const genderStatsArray = Array.isArray(genderStat.stats) ? genderStat.stats : [];
							const genderTotal = genderStatsArray.reduce(
								(sum: number, stat: { count: number }) => sum + (stat.count || 0),
								0,
							);

							// 백분율 계산이 되어 있지 않은 경우 계산
							const stats = genderStatsArray.map(
								(stat: { count: number; percentage: number; grade: string }) => {
									const count = stat.count || 0;
									let percentage = stat.percentage;

									if (typeof percentage !== 'number' && genderTotal > 0) {
										percentage = (count / genderTotal) * 100;
									}

									return {
										grade: stat.grade,
										count: count,
										percentage: percentage || 0,
									};
								},
							);

							return {
								gender: genderStat.gender,
								stats,
							};
						},
					);

					console.log('처리된 성별 통계:', formattedData.genderStats);
				}
			} else {
				console.error('응답 데이터가 객체가 아닙니다:', responseData);
			}

			// 모든 등급이 포함되어 있는지 확인하고, 없는 등급은 추가
			const allGrades = ['S', 'A', 'B', 'C', 'UNKNOWN'];

			// 전체 통계에 모든 등급 포함
			allGrades.forEach((grade) => {
				if (!formattedData.stats.some((stat) => stat.grade === grade)) {
					formattedData.stats.push({
						grade,
						count: 0,
						percentage: 0,
					});
				}
			});

			// 성별 통계에 모든 등급 포함
			formattedData.genderStats.forEach((genderStat) => {
				allGrades.forEach((grade) => {
					if (!genderStat.stats.some((stat) => stat.grade === grade)) {
						genderStat.stats.push({
							grade,
							count: 0,
							percentage: 0,
						});
					}
				});
			});

			console.log('변환된 데이터:', formattedData);
			return formattedData;
		} catch (error: any) {
			console.error('외모 등급 통계 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			console.error('오류 상태 코드:', error.response?.status);

			// 테스트 데이터 (API 응답 예시)
			const testData = {
				all: {
					S: 623,
					A: 622,
					B: 619,
					C: 619,
					UNKNOWN: 619,
					total: 3102,
				},
				male: {
					S: 289,
					A: 308,
					B: 310,
					C: 311,
					UNKNOWN: 326,
					total: 1544,
				},
				female: {
					S: 334,
					A: 314,
					B: 309,
					C: 308,
					UNKNOWN: 293,
					total: 1558,
				},
			};

			console.log('오류 발생으로 테스트 데이터 반환');

			// 테스트 데이터를 formattedData 형식으로 변환
			const formattedData = {
				total: testData.all.total,
				stats: [
					{
						grade: 'S',
						count: testData.all.S,
						percentage: (testData.all.S / testData.all.total) * 100,
					},
					{
						grade: 'A',
						count: testData.all.A,
						percentage: (testData.all.A / testData.all.total) * 100,
					},
					{
						grade: 'B',
						count: testData.all.B,
						percentage: (testData.all.B / testData.all.total) * 100,
					},
					{
						grade: 'C',
						count: testData.all.C,
						percentage: (testData.all.C / testData.all.total) * 100,
					},
					{
						grade: 'UNKNOWN',
						count: testData.all.UNKNOWN,
						percentage: (testData.all.UNKNOWN / testData.all.total) * 100,
					},
				],
				genderStats: [
					{
						gender: 'MALE',
						stats: [
							{
								grade: 'S',
								count: testData.male.S,
								percentage: (testData.male.S / testData.male.total) * 100,
							},
							{
								grade: 'A',
								count: testData.male.A,
								percentage: (testData.male.A / testData.male.total) * 100,
							},
							{
								grade: 'B',
								count: testData.male.B,
								percentage: (testData.male.B / testData.male.total) * 100,
							},
							{
								grade: 'C',
								count: testData.male.C,
								percentage: (testData.male.C / testData.male.total) * 100,
							},
							{
								grade: 'UNKNOWN',
								count: testData.male.UNKNOWN,
								percentage: (testData.male.UNKNOWN / testData.male.total) * 100,
							},
						],
					},
					{
						gender: 'FEMALE',
						stats: [
							{
								grade: 'S',
								count: testData.female.S,
								percentage: (testData.female.S / testData.female.total) * 100,
							},
							{
								grade: 'A',
								count: testData.female.A,
								percentage: (testData.female.A / testData.female.total) * 100,
							},
							{
								grade: 'B',
								count: testData.female.B,
								percentage: (testData.female.B / testData.female.total) * 100,
							},
							{
								grade: 'C',
								count: testData.female.C,
								percentage: (testData.female.C / testData.female.total) * 100,
							},
							{
								grade: 'UNKNOWN',
								count: testData.female.UNKNOWN,
								percentage: (testData.female.UNKNOWN / testData.female.total) * 100,
							},
						],
					},
				],
			};

			return formattedData;
		}
	},
	deleteUser: async (
		userId: string,
		sendEmail: boolean = false,
		addToBlacklist: boolean = false,
	) => {
		try {
			const response = await axiosServer.delete(`/admin/users/${userId}`, {
				data: {
					sendEmail,
					addToBlacklist,
				},
			});
			return response.data;
		} catch (error: any) {
			throw error.response?.data || error;
		}
	},

	// 중복 휴대폰 번호로 가입한 사용자 조회
	getDuplicatePhoneUsers: async () => {
		try {
			console.log('중복 휴대폰 번호 사용자 조회 요청');

			const response = await axiosServer.get('/admin/users/duplicate-phone');

			console.log('중복 휴대폰 번호 사용자 조회 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('중복 휴대폰 번호 사용자 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	// 대학교 인증 사용자 조회
	getVerifiedUsers: async (params: {
		page?: number;
		limit?: number;
		name?: string;
		university?: string;
	}) => {
		try {
			console.log('대학교 인증 사용자 조회 요청:', params);

			const queryParams = new URLSearchParams();
			if (params.page) queryParams.append('page', params.page.toString());
			if (params.limit) queryParams.append('limit', params.limit.toString());
			if (params.name) queryParams.append('name', params.name);
			if (params.university) queryParams.append('university', params.university);

			const response = await axiosServer.get(`/admin/users/verified?${queryParams.toString()}`);

			console.log('대학교 인증 사용자 조회 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('대학교 인증 사용자 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	// 대학교 인증 신청 사용자 조회
	getUniversityVerificationPending: async (params: {
		page?: number;
		limit?: number;
		name?: string;
		university?: string;
	}) => {
		try {
			console.log('대학교 인증 신청 사용자 조회 요청:', params);

			const queryParams = new URLSearchParams();
			if (params.page) queryParams.append('page', params.page.toString());
			if (params.limit) queryParams.append('limit', params.limit.toString());
			if (params.name) queryParams.append('name', params.name);
			if (params.university) queryParams.append('university', params.university);

			const response = await axiosServer.get(
				`/admin/university-verification/pending?${queryParams.toString()}`,
			);

			console.log('대학교 인증 신청 사용자 조회 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('대학교 인증 신청 사용자 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	// 대학교 인증 승인
	approveUniversityVerification: async (userId: string) => {
		try {
			console.log('대학교 인증 승인 요청:', userId);

			const response = await axiosServer.post('/admin/university-verification/approve', {
				userId,
			});

			console.log('대학교 인증 승인 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('대학교 인증 승인 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	// 대학교 인증 거절
	rejectUniversityVerification: async (userId: string) => {
		try {
			console.log('대학교 인증 거절 요청:', userId);

			const response = await axiosServer.post('/admin/university-verification/reject', {
				userId,
			});

			console.log('대학교 인증 거절 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('대학교 인증 거절 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	getBlacklistUsers: async (region?: string) => {
		try {
			console.log('블랙리스트 사용자 목록 조회 요청');

			const params = new URLSearchParams();
			if (region) params.append('region', region);

			const response = await axiosServer.get(`/admin/users/blacklist?${params.toString()}`);

			console.log('블랙리스트 사용자 목록 조회 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('블랙리스트 사용자 목록 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	releaseFromBlacklist: async (userId: string) => {
		try {
			console.log('블랙리스트 해제 요청:', { userId });

			const response = await axiosServer.patch(`/admin/users/${userId}/blacklist/release`);

			console.log('블랙리스트 해제 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('블랙리스트 해제 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	// 유저 검색 (탈퇴회원 포함) - 비밀번호 초기화용
	searchUsersForReset: async (params: {
		name?: string;
		phoneNumber?: string;
		page?: number;
		limit?: number;
	}) => {
		try {
			const response = await axiosServer.get('/admin/users/search', {
				params: {
					name: params.name || undefined,
					phoneNumber: params.phoneNumber || undefined,
					page: params.page || 1,
					limit: params.limit || 10,
				},
			});
			return response.data;
		} catch (error: any) {
			console.error('유저 검색 중 오류:', error);
			throw error;
		}
	},

	// 비밀번호 초기화
	resetPassword: async (userId: string) => {
		try {
			console.log('비밀번호 초기화 요청:', { userId });

			const response = await axiosServer.patch(`/admin/users/${userId}/reset-password`);

			console.log('비밀번호 초기화 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('비밀번호 초기화 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	// 재심사 요청 사용자 조회
	getReapplyUsers: async (page: number = 1, limit: number = 10, region?: string, name?: string) => {
		try {
			console.log('재심사 요청 사용자 조회 요청:', {
				page,
				limit,
				region,
				name,
			});

			const params: any = { page, limit };
			if (region) params.region = region;
			if (name) params.name = name;

			const response = await axiosServer.get('/admin/users/approval/reapply', {
				params,
			});

			console.log('재심사 요청 사용자 조회 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('재심사 요청 사용자 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	// 승인 대기 사용자 조회
	getPendingUsers: async (page: number = 1, limit: number = 10, region?: string, name?: string) => {
		try {
			console.log('승인 대기 사용자 조회 요청:', { page, limit, region, name });

			const params: any = { page, limit };
			if (region) params.region = region;
			if (name) params.name = name;

			const response = await axiosServer.get('/admin/users/approval/pending', {
				params,
			});

			console.log('승인 대기 사용자 조회 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('승인 대기 사용자 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	// 승인 거부 사용자 조회
	getRejectedUsers: async (
		page: number = 1,
		limit: number = 10,
		region?: string,
		name?: string,
	) => {
		try {
			console.log('승인 거부 사용자 조회 요청:', { page, limit, region, name });

			const params: any = { page, limit };
			if (region) params.region = region;
			if (name) params.name = name;

			const response = await axiosServer.get('/admin/users/approval/rejected', {
				params,
			});

			console.log('승인 거부 사용자 조회 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('승인 거부 사용자 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	revokeUserApproval: async (userId: string, revokeReason: string) => {
		try {
			console.log('사용자 승인 취소 요청:', { userId, revokeReason });

			const response = await axiosServer.patch(`/admin/users/approval/${userId}/revoke-approval`, {
				revokeReason,
			});

			console.log('사용자 승인 취소 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('사용자 승인 취소 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},
};

const profileImages = {
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

// 심사 이력 관련 타입
export interface ReviewHistoryFilter {
	reviewType?: 'admin' | 'auto';
	result?: 'approved' | 'rejected';
	gender?: 'MALE' | 'FEMALE';
	startDate?: string;
	endDate?: string;
	search?: string;
	page?: number;
	limit?: number;
}

export interface ReviewHistoryItem {
	id: string;
	imageUrl: string;
	userId: string;
	userName: string;
	gender: 'MALE' | 'FEMALE';
	age: number;
	slotIndex: number;
	isMain: boolean;
	result: 'approved' | 'rejected';
	reviewType: 'admin' | 'auto';
	rejectionCategory?: string;
	rejectionReason?: string;
	reviewerName?: string;
	reviewedAt: string;
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

const userReview = {
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

	getReviewHistory: async (filters: ReviewHistoryFilter = {}): Promise<ReviewHistoryResponse> => {
		try {
			const params: Record<string, any> = {};
			if (filters.page) params.page = filters.page;
			if (filters.limit) params.limit = filters.limit;
			if (filters.reviewType) params.reviewType = filters.reviewType;
			if (filters.result) params.result = filters.result;
			if (filters.gender) params.gender = filters.gender;
			if (filters.startDate) params.startDate = filters.startDate;
			if (filters.endDate) params.endDate = filters.endDate;
			if (filters.search) params.search = filters.search;

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

// 대학교 및 학과 관련 API
const universities = {
	meta: {
		getRegions: async () => {
			const response = await axiosServer.get('/admin/universities/meta/regions');
			return response.data.regions;
		},

		getTypes: async () => {
			const response = await axiosServer.get('/admin/universities/meta/types');
			return response.data.types;
		},

		getFoundations: async () => {
			const response = await axiosServer.get('/admin/universities/meta/foundations');
			return response.data.foundations;
		},
	},

	getList: async (params?: import('@/types/admin').UniversityListParams) => {
		const response = await axiosServer.get('/admin/universities', { params });
		return response.data;
	},

	getById: async (id: string): Promise<import('@/types/admin').UniversityDetail> => {
		const response = await axiosServer.get(`/admin/universities/${id}`);
		return response.data;
	},

	create: async (data: import('@/types/admin').CreateUniversityRequest) => {
		const response = await axiosServer.post('/admin/universities', data);
		return response.data;
	},

	update: async (id: string, data: import('@/types/admin').UpdateUniversityRequest) => {
		const response = await axiosServer.put(`/admin/universities/${id}`, data);
		return response.data;
	},

	delete: async (id: string) => {
		const response = await axiosServer.delete(`/admin/universities/${id}`);
		return response.data;
	},

	uploadLogo: async (id: string, file: File) => {
		const formData = new FormData();
		formData.append('logo', file);
		const response = await axiosServer.post(`/admin/universities/${id}/logo`, formData, {
			headers: { 'Content-Type': 'multipart/form-data' },
		});
		return response.data;
	},

	deleteLogo: async (id: string) => {
		const response = await axiosServer.delete(`/admin/universities/${id}/logo`);
		return response.data;
	},

	departments: {
		getList: async (
			universityId: string,
			params?: import('@/types/admin').DepartmentListParams,
		) => {
			const response = await axiosServer.get(`/admin/universities/${universityId}/departments`, {
				params,
			});
			return response.data;
		},

		getById: async (universityId: string, id: string) => {
			const response = await axiosServer.get(
				`/admin/universities/${universityId}/departments/${id}`,
			);
			return response.data;
		},

		create: async (universityId: string, data: import('@/types/admin').CreateDepartmentRequest) => {
			const response = await axiosServer.post(
				`/admin/universities/${universityId}/departments`,
				data,
			);
			return response.data;
		},

		update: async (
			universityId: string,
			id: string,
			data: import('@/types/admin').UpdateDepartmentRequest,
		) => {
			const response = await axiosServer.put(
				`/admin/universities/${universityId}/departments/${id}`,
				data,
			);
			return response.data;
		},

		delete: async (universityId: string, id: string) => {
			const response = await axiosServer.delete(
				`/admin/universities/${universityId}/departments/${id}`,
			);
			return response.data;
		},

		bulkCreate: async (
			universityId: string,
			data: import('@/types/admin').BulkCreateDepartmentsRequest,
		) => {
			const response = await axiosServer.post(
				`/admin/universities/${universityId}/departments/bulk`,
				data,
			);
			return response.data;
		},

		downloadTemplate: async (universityId: string) => {
			const response = await axiosServer.get(
				`/admin/universities/${universityId}/departments/template`,
				{
					responseType: 'blob',
				},
			);
			return response.data;
		},

		uploadCsv: async (
			universityId: string,
			file: File,
		): Promise<import('@/types/admin').UploadDepartmentsCsvResponse> => {
			const formData = new FormData();
			formData.append('file', file);
			const response = await axiosServer.post(
				`/admin/universities/${universityId}/departments/upload`,
				formData,
				{
					headers: { 'Content-Type': 'multipart/form-data' },
				},
			);
			return response.data;
		},
	},

	getUniversities: async () => {
		const response = await axiosServer.get('/admin/universities');
		return response.data;
	},

	getDepartments: async (university: string) => {
		const response = await axiosServer.get('/universities/departments', {
			params: { university },
		});
		return response.data;
	},

	_legacyGetDepartments: async (university: string) => {
		try {
			const response = await axiosServer.get('/universities/departments', {
				params: { university },
			});
			return response.data;
		} catch (error: any) {
			console.error('학과 목록 조회 중 오류:', error);

			const departmentsByUniversity: { [key: string]: string[] } = {
				'건양대학교(메디컬캠퍼스)': [
					'간호학과',
					'물리치료학과',
					'방사선학과',
					'병원경영학과',
					'안경광학과',
					'응급구조학과',
					'의공학과',
					'의료IT공학과',
					'의료공간디자인학과',
					'의료신소재학과',
					'의약바이오학과',
					'인공지능학과',
					'임상병리학과',
					'작업치료학과',
					'제약생명공학과',
					'치위생학과',
				],
				대전대학교: [
					'AI소프트웨어학부',
					'간호학과',
					'건축공학과',
					'건축학과(4)',
					'경영학부',
					'경찰학과',
					'공연예술영상콘텐츠학과',
					'군사학과',
					'디지털헬스케어학과',
					'물리치료학과',
					'물류통상학과',
					'반도체공학과',
					'법행정학부',
					'보건의료경영학과',
					'뷰티디자인학과',
					'비즈니스영어학과',
					'비즈니스일본어학과',
					'사회복지학과',
					'산업·광고심리학과',
					'상담학과',
					'소방방재학과',
					'스포츠건강재활학과',
					'스포츠운동과학과',
					'식품영양학과',
					'웹툰애니메이션학과',
					'응급구조학과',
					'임상병리학과',
					'재난안전공학과',
					'정보보안학과',
					'정보통신공학과',
					'중등특수교육과',
					'커뮤니케이션디자인학과',
					'컴퓨터공학과',
					'토목환경공학과',
					'패션디자인·비즈니스학과',
					'한의예과',
					'협화리버럴아츠칼리지',
					'협화커뮤니티칼리지',
					'화장품학과',
				],
				목원대학교: [
					'AI응용학과',
					'건축학부',
					'게임소프트웨어공학과',
					'게임콘텐츠학과',
					'경영학부',
					'경찰법학과',
					'경찰행정학부',
					'공연콘텐츠학과',
					'관현악학부',
					'광고홍보커뮤니케이션학부',
					'국악과',
					'국어교육과',
					'국际예술·한국어학부',
					'금융경제학과',
					'도시공학과',
					'도자디자인학과',
					'마케팅빅데이터학과',
					'미술교육과',
					'미술학부',
					'보건의료행정학과',
					'부동산금융보험학과',
					'사회복지학과',
					'산업디자인학과',
					'생물산업학부',
					'섬유·패션디자인학과',
					'소방방재학과',
					'수학교육과',
					'스포츠건강관리학과',
					'시각커뮤니케이션디자인학과',
					'식품제약학부',
					'신학과',
					'실용음악학부',
					'애니메이션학과',
					'역사학과',
					'연극영화영상학부',
					'영어교육과',
					'영어학과',
					'외식조리·제과제빵학과',
					'웹툰학과',
					'유아교육과',
					'음악교육과',
					'응급구조학과',
					'입체조형학부',
					'자율전공학부',
					'전기전자공학과',
					'창의예술자율전공학부',
					'컴퓨터공학과',
					'피아노학부',
					'항공호텔관광경영학과',
					'화장품학과',
				],
				배재대학교: [
					'IT경영정보학과',
					'간호학과',
					'건축학과',
					'경영학과',
					'경찰법학부',
					'공연예술학과',
					'관광경영학과',
					'광고사진영상학과',
					'국어국문한국어교육학과',
					'글로벌비즈니스학과',
					'글로벌자율융합학부(글로벌IT)',
					'글로벌자율융합학부(글로벌경영)',
					'글로벌자율융합학부(직무한국어번역)',
					'글로벌자율융합학부(한류문화콘텐츠)',
					'드론로봇공학과',
					'디자인학부(산업디자인)',
					'디자인학부(커뮤니케이션디자인)',
					'레저스포츠학부(스포츠마케팅)',
					'레저스포츠학부(스포츠지도·건강재활)',
					'미디어콘텐츠학과',
					'보건의료복지학과',
					'뷰티케어학과',
					'생명공학과',
					'소프트웨어공학부(게임공학)',
					'소프트웨어공학부(소프트웨어학)',
					'소프트웨어공학부(정보보안학)',
					'소프트웨어공학부(컴퓨터공학)',
					'스마트배터리학과',
					'식품영양학과',
					'실내건축학과',
					'심리상담학과',
					'아트앤웹툰학부(게임애니메이션)',
					'아트앤웹툰학부(아트앤웹툰)',
					'외식조리학과',
					'원예산림학과',
					'유아교육과',
					'의류패션학과',
					'일본학과',
					'자율전공학부',
					'전기전자공학과',
					'조경학과',
					'철도건설공학과',
					'평생교육융합학부(지역소상공비즈니스)',
					'평생교육융합학부(토털라이프스타일링)',
					'평생교육융합학부(토털라이프케어)',
					'항공서비스학과',
					'행정학과',
					'호텔항공경영학과',
				],
				우송대학교: [
					'AI·빅데이터학과',
					'간호학과',
					'글로벌조리학부 Lyfe조리전공',
					'글로벌조리학부 글로벌외식창업전공',
					'글로벌조리학부 글로벌조리전공',
					'글로벌호텔매니지먼트학과',
					'동물의료관리학과',
					'물류시스템학과',
					'물리치료학과',
					'보건의료경영학과',
					'뷰티디자인경영학과',
					'사회복지학과',
					'소방·안전학부',
					'소프트웨어학부 컴퓨터·소프트웨어전공',
					'소프트웨어학부 컴퓨터공학전공',
					'솔브릿지경영학부',
					'스포츠건강재활학과',
					'언어치료·청각재활학과',
					'외식조리영양학과',
					'외식조리학부 외식·조리경영전공',
					'외식조리학부 외식조리전공',
					'외식조리학부 제과제빵·조리전공',
					'외식조리학부 한식·조리과학전공',
					'유아교육과',
					'융합경영학부 경영학전공',
					'융합경영학부 글로벌융합비즈니스학과',
					'응급구조학과',
					'자유전공학부',
					'작업치료학과',
					'철도건설시스템학부 건축공학전공',
					'철도건설시스템학부 글로벌철도학과',
					'철도건설시스템학부 철도건설시스템전공',
					'철도경영학과',
					'철도시스템학부 철도소프트웨어전공',
					'철도시스템학부 철도전기시스템전공',
					'철도차량시스템학과',
					'테크노미디어융합학부 게임멀티미디어전공',
					'테크노미디어융합학부 글로벌미디어영상학과',
					'테크노미디어융합학부 미디어디자인·영상전공',
					'호텔관광경영학과',
					'휴먼디지털인터페이스학부',
				],
				한남대학교: [
					'AI융합학과',
					'간호학과',
					'건축공학전공',
					'건축학과(5년제)',
					'경영정보학과',
					'경영학과',
					'경제학과',
					'경찰학과',
					'교육학과',
					'국어교육과',
					'국어국문·창작학과',
					'기계공학과',
					'기독교학과',
					'린튼글로벌스쿨',
					'멀티미디어공학과',
					'무역물류학과',
					'문헌정보학과',
					'미디어영상학과',
					'미술교육과',
					'바이오제약공학과',
					'법학부',
					'빅데이터응용학과',
					'사학과',
					'사회복지학과',
					'사회적경제기업학과',
					'산업경영공학과',
					'상담심리학과',
					'생명시스템과학과',
					'수학과',
					'수학교육과',
					'스포츠과학과',
					'식품영양학과',
					'신소재공학과',
					'아동복지학과',
					'역사교육과',
					'영어교육과',
					'영어영문학과',
					'융합디자인학과',
					'응용영어콘텐츠학과',
					'일어일문학전공',
					'자율전공학부',
					'전기전자공학과',
					'정보통신공학과',
					'정치·언론학과',
					'중국경제통상학과',
					'컴퓨터공학과',
					'토목환경공학전공',
					'패션디자인학과',
					'프랑스어문학전공',
					'행정학과',
					'호텔항공경영학과',
					'화학공학과',
					'화학과',
					'회계학과',
					'회화과',
				],
				충남대학교: [
					'간호학과',
					'건설공학교육과',
					'건축학과(5)',
					'경영학부',
					'경제학과',
					'고고학과',
					'공공안전융합전공',
					'관현악과',
					'교육학과',
					'국사학과',
					'국어교육과',
					'국어국문학과',
					'국토안보학전공',
					'기계공학교육과',
					'기계공학부',
					'기술교육과',
					'농업경제학과',
					'도시·자치융합학과',
					'독어독문학과',
					'동물자원생명과학과',
					'디자인창의학과',
					'리더십과조직과학전공',
					'메카트로닉스공학과',
					'무역학과',
					'무용학과',
					'문헌정보학과',
					'문화와사회융합전공',
					'물리학과',
					'미생물·분자생명과학과',
					'반도체융합학과',
					'불어불문학과',
					'사학과',
					'사회복지학과',
					'사회학과',
					'산림환경자원학과',
					'생명정보융합학과',
					'생물과학과',
					'생물환경화학과',
					'생화학과',
					'소비자학과',
					'수의예과',
					'수학과',
					'수학교육과',
					'스마트시티건축공학과',
					'스포츠과학과',
					'식물자원학과',
					'식품공학과',
					'식품영양학과',
					'신소재공학과',
					'심리학과',
					'약학과',
					'언론정보학과',
					'언어학과',
					'에너지공학과',
					'영어교육과',
					'영어영문학과',
					'원예학과',
					'유기재료공학과',
					'음악과',
					'응용생물학과',
					'응용화학공학과',
					'의류학과',
					'의예과',
					'인공지능학과',
					'일어일문학과',
					'자율운항시스템공학과',
					'자율전공융합학부',
					'전기공학과',
					'전자공학과',
					'정보통계학과',
					'정치외교학과',
					'조소과',
					'중어중문학과',
					'지역환경토목학과',
					'지질환경과학과',
					'천문우주과학과',
					'철학과',
					'체육교육과',
					'컴퓨터융합학부',
					'토목공학과',
					'한문학과',
					'항공우주공학과',
					'해양안보학전공',
					'해양환경과학과',
					'행정학부',
					'화학공학교육과',
					'화학과',
					'환경공학과',
					'환경소재공학과',
					'회화과',
				],
				KAIST: [
					'기술경영학부',
					'기술경영학부(IT경영학)',
					'건설및환경공학과',
					'기계공학과',
					'바이오및뇌공학과',
					'반도체시스템공학과',
					'산업디자인학과',
					'산업및시스템공학과',
					'생명화학공학과',
					'신소재공학과',
					'원자력및양자공학과',
					'전기및전자공학부',
					'전산학부',
					'항공우주공학과',
					'새내기과정학부(공학계열)',
					'새내기과정학부(인문사회계열)',
					'새내기과정학부(자연계열)',
					'융합인재학부',
					'뇌인지과학과',
					'생명과학과',
					'디지털인문사회과학부',
					'물리학과',
					'수리과학과',
					'화학과',
				],
				한밭대학교: [
					'건설환경공학과',
					'건축공학과',
					'건축학과(5년제)',
					'경제학과',
					'공공행정학과',
					'기계공학과',
					'기계소재융합시스템공학과 (야)',
					'도시공학과',
					'모바일융합공학과',
					'반도체시스템공학과',
					'산업경영공학과',
					'산업디자인학과',
					'설비공학과',
					'스포츠건강과학과 (야)',
					'시각•영상디자인학과',
					'신소재공학과',
					'영어영문학과',
					'융합경영학과',
					'융합건설시스템학과 (야)',
					'인공지능소프트웨어학과',
					'일본어과',
					'자율전공학부',
					'전기공학과',
					'전기시스템공학과 (야)',
					'전자공학과',
					'정보통신공학과',
					'중국어과',
					'지능미디어공학과',
					'창의융합학과',
					'컴퓨터공학과',
					'화학생명공학과',
					'회계세무부동산학과 (야)',
					'회계세무학과',
				],
				을지대학교: ['의예과'],
				대전과학기술대학교: [
					'간호학과(4년제)',
					'경찰경호학과',
					'광고홍보디자인학과',
					'글로벌산업학과',
					'도시건설과',
					'문헌정보과 (야)',
					'물리치료과',
					'미래문화콘텐츠과',
					'반려동물학과',
					'보건복지상담과',
					'부동산재테크과',
					'부동산행정정보학과',
					'뷰티디자인계열',
					'사회복지학과',
					'스포츠건강관리학과',
					'식물생활조경학과',
					'실내건축디자인과',
					'외식조리제빵계열',
					'유아교육과',
					'임상병리과',
					'전기과',
					'컴퓨터공학&그래픽과',
					'컴퓨터소프트웨어공학과',
					'케어복지상담과 (야)',
					'치위생과',
				],
				대전보건대학교: [
					'HiT자율전공학부',
					'간호학과(4년제)',
					'경찰과학수사학과',
					'국방응급의료과',
					'물리치료학과',
					'바이오의약과',
					'반려동물과',
					'방사선학과',
					'보건의료행정학과',
					'뷰티케어과',
					'사회복지학과',
					'스포츠건강관리과',
					'안경광학과',
					'유아교육학과',
					'응급구조학과',
					'의무부사관과(응급구조학전공)',
					'임상병리학과',
					'작업치료학과',
					'장례지도과',
					'재난소방·건설안전과',
					'치기공학과',
					'치위생학과',
					'컴퓨터정보학과',
					'패션컬러·스타일리스트과',
					'호텔조리&제과제빵과',
					'환경안전보건학과',
				],
				우송정보대학: [
					'AI응용과',
					'K-뷰티학부',
					'K-베이커리학부',
					'K-푸드조리과',
					'e-스포츠과',
					'간호학과',
					'글로벌실용예술학부',
					'동물보건과',
					'리모델링건축과',
					'만화웹툰과',
					'반려동물학부',
					'보건의료행정과',
					'뷰티디자인학부',
					'사회복지과',
					'산업안전과 (야)',
					'스마트자동차기계학부',
					'스마트팩토리과',
					'외식조리학부',
					'유아교육과',
					'일본외식조리학부',
					'자율전공학부',
					'재난소방안전관리과',
					'제과제빵과',
					'창업조리제빵과',
					'철도전기안전과',
					'철도차량운전과',
					'철도토목안전과 (야)',
					'호텔관광과',
				],
			};

			// 대학교명에 따라 학과 목록 반환
			// 건양대학교(메디컬캠퍼스)의 경우 건양대학교로 키 변환
			const universityKey =
				university === '건양대학교(메디컬캠퍼스)' ? '건양대학교(메디컬캠퍼스)' : university;

			// 해당 대학교의 학과 목록이 있으면 반환, 없으면 기본 학과 목록 반환
			return (
				departmentsByUniversity[universityKey] || [
					'컴퓨터공학과',
					'소프트웨어학과',
					'정보통신공학과',
					'전자공학과',
					'기계공학과',
					'건축공학과',
					'경영학과',
					'경제학과',
					'심리학과',
					'사회학과',
					'국어국문학과',
					'영어영문학과',
					'화학과',
					'물리학과',
					'생명과학과',
				]
			);
		}
	},
};

// 매칭 관련 API
const matching = {
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
			console.log('매칭 내역 조회 요청:', {
				startDate,
				endDate,
				page,
				limit,
				name,
				type,
			});

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

			console.log('매칭 내역 조회 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('매칭 내역 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	// 중복 매칭 여부 확인
	getMatchCount: async (myId: string, matcherId: string) => {
		try {
			console.log('중복 매칭 여부 확인 요청:', { myId, matcherId });

			const response = await axiosServer.get('/admin/matching/match-count', {
				params: { myId, matcherId },
			});

			console.log('중복 매칭 여부 확인 응답:', response.data);
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
			console.log('사용자 매칭 횟수 조회 요청:', {
				myId,
				matcherId,
				startDate,
				endDate,
			});

			const params: any = { myId, matcherId };
			if (startDate) params.startDate = startDate;
			if (endDate) params.endDate = endDate;

			const response = await axiosServer.get('/admin/matching/match-count', {
				params,
			});

			console.log('사용자 매칭 횟수 조회 응답:', response.data);
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
			console.log('매칭 상대 이력 조회 요청:', {
				matcherId,
				startDate,
				endDate,
				page,
				limit,
				name,
			});

			// 파라미터 객체 생성
			const params: any = { matcherId, startDate, endDate, page, limit };

			// 이름 검색어가 있는 경우 추가
			if (name && name.trim() !== '') {
				params.name = name.trim();
			}

			const response = await axiosServer.get('/admin/matching/matcher-history', { params });

			console.log('매칭 상대 이력 조회 응답:', response.data);
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
			console.log('직접 매칭 생성 요청:', { requesterId, targetId, type });

			const response = await axiosServer.post('/admin/matching/direct-match', {
				requesterId,
				targetId,
				type,
			});

			console.log('직접 매칭 생성 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('직접 매칭 생성 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	// 매칭 실패 내역 조회
	getFailureLogs: async (date: string, page: number = 1, limit: number = 10, name?: string) => {
		try {
			console.log('매칭 실패 내역 조회 요청:', { date, page, limit, name });

			// 파라미터 객체 생성
			const params: any = { date, page, limit };

			// 이름 검색어가 있는 경우 추가
			if (name && name.trim() !== '') {
				params.name = name.trim();
			}

			const response = await axiosServer.get('/admin/matching/failure-logs', {
				params,
			});

			console.log('매칭 실패 내역 조회 응답:', response.data);
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
			console.log('사용자 매칭 결과 조회 요청:', { userId, options });

			const requestData = {
				userId,
				...options,
			};

			const response = await axiosServer.post('/admin/matching/user/read', requestData);
			console.log('사용자 매칭 결과 응답:', response.data);

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
			console.log('매칭되지 않은 사용자 조회 요청:', {
				page,
				limit,
				name,
				gender,
			});

			const params: any = { page, limit };
			if (name) params.name = name;
			if (gender && gender !== 'all') params.gender = gender;

			const response = await axiosServer.get('/admin/matching/unmatched-users', {
				params,
			});
			console.log('매칭되지 않은 사용자 응답:', response.data);

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
			console.log('배치 매칭 처리 요청');

			const response = await axiosServer.post('/admin/matching/batch');
			console.log('배치 매칭 처리 응답:', response.data);

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
			console.log('단일 사용자 매칭 처리 요청:', userId);

			const requestData = {
				userId,
			};

			const response = await axiosServer.post('/admin/matching/user', requestData);
			console.log('단일 사용자 매칭 처리 응답:', response.data);

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
			console.log('좋아요 이력 조회 요청:', {
				startDate,
				endDate,
				page,
				limit,
				name,
			});

			// 파라미터 객체 생성
			const params: any = { startDate, endDate, page, limit };

			// 이름 검색어가 있는 경우 추가
			if (name && name.trim() !== '') {
				params.name = name.trim();
			}

			const response = await axiosServer.get('/admin/matching/like-history', {
				params,
			});

			console.log('좋아요 이력 조회 응답:', response.data);
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
			console.log('매칭 통계 조회 요청:', { period, university });

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

const reports = {
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

const pushNotifications = {
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
const aiChat = {
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
			console.log('AI 채팅 세션 목록 조회 응답:', response.data);
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
			console.log('AI 채팅 메시지 상세 조회 응답:', response.data);
			return response.data;
		} catch (error) {
			console.error('AI 채팅 메시지 상세 조회 중 오류:', error);
			throw error;
		}
	},
};

// 배경 프리셋 관련 API
const backgroundPresets = {
	getActive: async (): Promise<BackgroundPresetsResponse> => {
		try {
			console.log('활성 배경 프리셋 목록 조회 요청');
			const response = await axiosNextGen.get<BackgroundPresetsResponse>(
				'/admin/background-presets/active',
			);
			console.log('활성 배경 프리셋 목록 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('활성 배경 프리셋 목록 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	upload: async (imageFile: File): Promise<UploadImageResponse> => {
		try {
			console.log('=== 배경 이미지 업로드 시작 ===');
			console.log('File 정보:', {
				name: imageFile.name,
				type: imageFile.type,
				size: imageFile.size,
				lastModified: imageFile.lastModified,
			});

			const formData = new FormData();
			formData.append('image', imageFile);

			const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
			const baseURL = process.env.NEXT_PUBLIC_NEXT_GEN_API_URL || 'http://localhost:8044/api';
			const url = `${baseURL}/admin/background-presets/upload`;

			console.log('요청 URL:', url);
			console.log('Authorization 토큰 존재:', !!token);

			const response = await fetch(url, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: 'application/json',
					'x-country': getCountryHeader(),
				},
				body: formData,
				credentials: 'include',
			});

			console.log('응답 상태:', response.status, response.statusText);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
				console.error('업로드 실패 응답:', errorData);
				throw new Error(errorData.message || `HTTP ${response.status}`);
			}

			const data = await response.json();
			console.log('배경 이미지 업로드 성공:', data);
			console.log('=== 배경 이미지 업로드 종료 ===');
			return data;
		} catch (error: any) {
			console.error('배경 이미지 업로드 중 오류:', error);
			console.error('오류 상세 정보:', error.message);
			throw error;
		}
	},

	uploadAndCreate: async (
		imageFile: File,
		data: UploadAndCreatePresetRequest,
	): Promise<BackgroundPreset> => {
		try {
			console.log('배경 프리셋 통합 생성 요청:', data);
			console.log('File 정보:', {
				name: imageFile.name,
				type: imageFile.type,
				size: imageFile.size,
				lastModified: imageFile.lastModified,
			});

			const formData = new FormData();
			formData.append('image', imageFile);
			formData.append('name', data.name);
			formData.append('displayName', data.displayName);
			if (data.order !== undefined) {
				formData.append('order', data.order.toString());
			}

			const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
			const baseURL = process.env.NEXT_PUBLIC_NEXT_GEN_API_URL || 'http://localhost:8044/api';

			const response = await fetch(`${baseURL}/admin/background-presets/upload-and-create`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'x-country': getCountryHeader(),
				},
				body: formData,
				credentials: 'include',
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
				throw new Error(errorData.message || `HTTP ${response.status}`);
			}

			const responseData = await response.json();
			console.log('배경 프리셋 통합 생성 응답:', responseData);
			return responseData;
		} catch (error: any) {
			console.error('배경 프리셋 통합 생성 중 오류:', error);
			console.error('오류 상세 정보:', error.message);
			throw error;
		}
	},

	create: async (data: CreatePresetRequest): Promise<BackgroundPreset> => {
		try {
			console.log('배경 프리셋 생성 요청:', data);
			const response = await axiosNextGen.post('/admin/background-presets', data);
			console.log('배경 프리셋 생성 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('배경 프리셋 생성 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	update: async (id: string, data: Partial<CreatePresetRequest>): Promise<BackgroundPreset> => {
		try {
			console.log('배경 프리셋 수정 요청:', { id, data });
			const response = await axiosNextGen.put(`/admin/background-presets/${id}`, data);
			console.log('배경 프리셋 수정 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('배경 프리셋 수정 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	delete: async (id: string): Promise<void> => {
		try {
			console.log('배경 프리셋 삭제 요청:', id);
			await axiosNextGen.delete(`/admin/background-presets/${id}`);
			console.log('배경 프리셋 삭제 완료');
		} catch (error: any) {
			console.error('배경 프리셋 삭제 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},
};

// 카드뉴스 관련 API
const cardNews = {
	uploadSectionImage: async (imageFile: File): Promise<UploadImageResponse> => {
		try {
			console.log('섹션 이미지 업로드 요청');
			console.log('File 정보:', {
				name: imageFile.name,
				type: imageFile.type,
				size: imageFile.size,
				lastModified: imageFile.lastModified,
			});

			const formData = new FormData();
			formData.append('image', imageFile);

			const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
			const baseURL = process.env.NEXT_PUBLIC_NEXT_GEN_API_URL || 'http://localhost:8044/api';

			const response = await fetch(`${baseURL}/admin/background-presets/upload`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'x-country': getCountryHeader(),
				},
				body: formData,
				credentials: 'include',
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
				throw new Error(errorData.message || `HTTP ${response.status}`);
			}

			const data = await response.json();
			console.log('섹션 이미지 업로드 응답:', data);
			return data;
		} catch (error: any) {
			console.error('섹션 이미지 업로드 중 오류:', error);
			console.error('오류 상세 정보:', error.message);
			throw error;
		}
	},

	create: async (data: CreateCardNewsRequest): Promise<AdminCardNewsItem> => {
		try {
			console.log('카드뉴스 생성 요청:', data);
			const response = await axiosNextGen.post<AdminCardNewsItem>('/admin/posts/card-news', data);
			console.log('카드뉴스 생성 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('카드뉴스 생성 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	get: async (id: string): Promise<AdminCardNewsItem> => {
		try {
			console.log('카드뉴스 조회 요청:', id);
			const response = await axiosNextGen.get<AdminCardNewsItem>(`/admin/posts/card-news/${id}`);
			console.log('카드뉴스 조회 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('카드뉴스 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	getList: async (page: number = 1, limit: number = 20): Promise<AdminCardNewsListResponse> => {
		try {
			console.log('카드뉴스 목록 조회 요청:', { page, limit });
			const response = await axiosNextGen.get<AdminCardNewsListResponse>('/admin/posts/card-news', {
				params: {
					page,
					limit,
				},
			});
			console.log('카드뉴스 목록 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('카드뉴스 목록 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	update: async (id: string, data: UpdateCardNewsRequest): Promise<AdminCardNewsItem> => {
		try {
			console.log('카드뉴스 수정 요청:', { id, data });
			const response = await axiosNextGen.put<AdminCardNewsItem>(
				`/admin/posts/card-news/${id}`,
				data,
			);
			console.log('카드뉴스 수정 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('카드뉴스 수정 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	delete: async (id: string): Promise<void> => {
		try {
			console.log('카드뉴스 삭제 요청:', id);
			await axiosNextGen.delete(`/admin/posts/card-news/${id}`);
			console.log('카드뉴스 삭제 완료');
		} catch (error: any) {
			console.error('카드뉴스 삭제 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	publish: async (id: string, data?: PublishCardNewsRequest): Promise<PublishCardNewsResponse> => {
		try {
			console.log('카드뉴스 발행 요청:', id, data);
			const response = await axiosNextGen.post<PublishCardNewsResponse>(
				`/admin/posts/card-news/${id}/publish`,
				data || {},
			);
			console.log('카드뉴스 발행 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('카드뉴스 발행 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	getCategories: async () => {
		try {
			console.log('카테고리 목록 조회 요청');
			const response = await axiosNextGen.get('/articles/category/list');
			console.log('카테고리 목록 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('카테고리 목록 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},
};

// 여성 유저 리텐션 관리 API
const femaleRetention = {
	// 3일 이상 미접속 여성 유저 리스트 조회
	getInactiveUsers: async (limit: number = 20, offset: number = 0) => {
		try {
			console.log('미접속 여성 유저 목록 조회 요청:', { limit, offset });
			const response = await axiosServer.get('/admin/female-retention', {
				params: { limit, offset },
			});
			console.log('미접속 여성 유저 목록 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('미접속 여성 유저 목록 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	// 개별 유저에 대해 1회성 패스워드 발급
	issueTemporaryPassword: async (userId: string) => {
		try {
			console.log('임시 패스워드 발급 요청:', userId);
			const response = await axiosServer.post(`/admin/female-retention/${userId}`);
			console.log('임시 패스워드 발급 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('임시 패스워드 발급 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},
};

// 구슬 관리 API
const gems = {
	// 구슬 일괄 지급 및 푸시 알림 발송 (v2.0.0 - 전화번호 기반)
	bulkGrant: async (data: {
		phoneNumbers?: string[];
		csvFile?: File;
		gemAmount: number;
		message: string;
	}) => {
		try {
			console.log('구슬 일괄 지급 요청:', data);

			const formData = new FormData();

			if (data.phoneNumbers && data.phoneNumbers.length > 0) {
				formData.append('phoneNumbers', JSON.stringify(data.phoneNumbers));
			}

			if (data.csvFile) {
				console.log('CSV File 정보:', {
					name: data.csvFile.name,
					type: data.csvFile.type,
					size: data.csvFile.size,
					lastModified: data.csvFile.lastModified,
				});

				formData.append('csvFile', data.csvFile);
			}

			formData.append('gemAmount', data.gemAmount.toString());
			formData.append('message', data.message);

			console.log('FormData 내용 확인:', {
				csvFile: formData.get('csvFile'),
				phoneNumbers: formData.get('phoneNumbers'),
				gemAmount: formData.get('gemAmount'),
				message: formData.get('message'),
			});

			// fetch API로 직접 요청
			const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
			const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8045/api';

			const response = await fetch(`${baseURL}/admin/gems/bulk-grant`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'x-country': getCountryHeader(),
				},
				body: formData,
				credentials: 'include',
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
				throw new Error(errorData.message || `HTTP ${response.status}`);
			}

			const responseData = await response.json();
			console.log('구슬 일괄 지급 응답:', responseData);
			return responseData;
		} catch (error: any) {
			console.error('구슬 일괄 지급 중 오류:', error);
			console.error('오류 상세 정보:', error.message);
			throw error;
		}
	},
};

const deletedFemales = {
	getList: async (page: number = 1, limit: number = 20) => {
		try {
			const response = await axiosServer.get<DeletedFemalesListResponse>('/admin/deleted-females', {
				params: { page, limit },
			});
			return response.data;
		} catch (error: any) {
			console.error('탈퇴 여성 회원 목록 조회 중 오류:', error);
			throw error;
		}
	},

	restore: async (id: string) => {
		try {
			const response = await axiosServer.patch<RestoreFemaleResponse>(
				`/admin/deleted-females/${id}/restore`,
			);
			return response.data;
		} catch (error: any) {
			console.error('회원 복구 중 오류:', error);
			throw error;
		}
	},

	sleep: async (id: string) => {
		try {
			const response = await axiosServer.patch<SleepFemaleResponse>(
				`/admin/deleted-females/${id}/sleep`,
			);
			return response.data;
		} catch (error: any) {
			console.error('회원 재탈퇴 처리 중 오류:', error);
			throw error;
		}
	},
};

const banners = {
	getList: async (position?: BannerPosition): Promise<Banner[]> => {
		try {
			const params = position ? { position } : {};
			const response = await axiosServer.get<Banner[]>('/admin/banners', {
				params,
			});
			return response.data;
		} catch (error: any) {
			console.error('배너 목록 조회 중 오류:', error);
			throw error;
		}
	},

	create: async (imageFile: File, data: CreateBannerRequest): Promise<Banner> => {
		try {
			const formData = new FormData();
			formData.append('image', imageFile);
			formData.append('position', data.position);
			if (data.actionUrl) formData.append('actionUrl', data.actionUrl);
			if (data.startDate) formData.append('startDate', data.startDate);
			if (data.endDate) formData.append('endDate', data.endDate);

			const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
			const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8045/api';

			const response = await fetch(`${baseURL}/admin/banners`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'x-country': getCountryHeader(),
				},
				body: formData,
				credentials: 'include',
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ message: '배너 등록 실패' }));
				throw new Error(errorData.message || `HTTP ${response.status}`);
			}

			return response.json();
		} catch (error: any) {
			console.error('배너 등록 중 오류:', error);
			throw error;
		}
	},

	update: async (id: string, data: UpdateBannerRequest): Promise<Banner> => {
		try {
			const response = await axiosServer.patch<Banner>(`/admin/banners/${id}`, data);
			return response.data;
		} catch (error: any) {
			console.error('배너 수정 중 오류:', error);
			throw error;
		}
	},

	delete: async (id: string): Promise<void> => {
		try {
			await axiosServer.delete(`/admin/banners/${id}`);
		} catch (error: any) {
			console.error('배너 삭제 중 오류:', error);
			throw error;
		}
	},

	updateOrder: async (data: UpdateBannerOrderRequest): Promise<Banner[]> => {
		try {
			const response = await axiosServer.patch<Banner[]>('/admin/banners/order/bulk', data);
			return response.data;
		} catch (error: any) {
			console.error('배너 순서 변경 중 오류:', error);
			throw error;
		}
	},
};

const dormantLikes = {
	getDashboard: async (page: number = 1, limit: number = 20, inactiveDays: number = 0) => {
		try {
			const response = await axiosServer.get<DormantLikesDashboardResponse>(
				'/admin/dormant-likes',
				{
					params: { page, limit, inactiveDays },
				},
			);
			return response.data;
		} catch (error: any) {
			console.error('파묘 계정 대시보드 조회 중 오류:', error);
			throw error;
		}
	},

	getPendingLikes: async (userId: string) => {
		try {
			const response = await axiosServer.get<DormantLikeDetailResponse[]>(
				`/admin/dormant-likes/${userId}`,
			);
			return response.data;
		} catch (error: any) {
			console.error('미확인 좋아요 목록 조회 중 오류:', error);
			throw error;
		}
	},

	getCooldownStatus: async (userId: string) => {
		try {
			const response = await axiosServer.get<CooldownStatusResponse>(
				`/admin/dormant-likes/${userId}/cooldown`,
			);
			return response.data;
		} catch (error: any) {
			console.error('쿨다운 상태 조회 중 오류:', error);
			throw error;
		}
	},

	processLikes: async (data: ProcessLikesRequest) => {
		try {
			const response = await axiosServer.post<ProcessLikesResponse>(
				'/admin/dormant-likes/process',
				data,
			);
			return response.data;
		} catch (error: any) {
			console.error('좋아요 처리 중 오류:', error);
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
			const response = await axiosServer.get<ActionLogsResponse>('/admin/dormant-likes/logs', {
				params: { page, limit, ...filters },
			});
			return response.data;
		} catch (error: any) {
			console.error('처리 이력 조회 중 오류:', error);
			throw error;
		}
	},

	viewProfile: async (data: ViewProfileRequest) => {
		try {
			const response = await axiosServer.post<ViewProfileResponse>(
				'/admin/dormant-likes/view-profile',
				data,
			);
			return response.data;
		} catch (error: any) {
			console.error('프로필 조회 트리거 중 오류:', error);
			throw error;
		}
	},
};

const chatRefund = {
	searchUsers: async (name: string) => {
		try {
			const country = getCountryHeader();
			const response = await axiosServer.get<RefundUserSearchResponse>(
				'/admin/refund/users/search',
				{
					params: { name },
					headers: { 'X-Country': country },
				},
			);
			return response.data;
		} catch (error: any) {
			console.error('사용자 검색 중 오류:', error);
			throw error;
		}
	},

	getEligibleRooms: async (userId: string) => {
		try {
			const country = getCountryHeader();
			const response = await axiosServer.get<EligibleChatRoomsResponse>(
				`/admin/refund/users/${userId}/eligible-rooms`,
				{
					headers: { 'X-Country': country },
				},
			);
			return response.data;
		} catch (error: any) {
			console.error('환불 가능 채팅방 조회 중 오류:', error);
			throw error;
		}
	},

	previewRefund: async (data: RefundPreviewRequest) => {
		try {
			const country = getCountryHeader();
			const response = await axiosServer.post<RefundPreviewResponse>(
				'/admin/refund/preview',
				data,
				{
					headers: { 'X-Country': country },
				},
			);
			return response.data;
		} catch (error: any) {
			console.error('환불 미리보기 중 오류:', error);
			throw error;
		}
	},

	processRefund: async (data: ProcessRefundRequest) => {
		try {
			const country = getCountryHeader();
			const response = await axiosServer.post<ProcessRefundResponse>(
				'/admin/refund/process',
				data,
				{
					headers: { 'X-Country': country },
				},
			);
			return response.data;
		} catch (error: any) {
			console.error('환불 처리 중 오류:', error);
			throw error;
		}
	},
};

const appleRefund = {
	getList: async (params: AppleRefundListParams = {}) => {
		try {
			const response = await axiosServer.get<AppleRefundListResponse>('/admin/apple-refund', {
				params: {
					page: params.page || 1,
					limit: params.limit || 20,
					...(params.status && { status: params.status }),
					...(params.startDate && { startDate: params.startDate }),
					...(params.endDate && { endDate: params.endDate }),
					...(params.searchTerm && { searchTerm: params.searchTerm }),
				},
			});
			return response.data;
		} catch (error: any) {
			console.error('iOS 환불 내역 조회 중 오류:', error);
			throw error;
		}
	},

	getDetail: async (id: string) => {
		try {
			const response = await axiosServer.get(`/admin/apple-refund/${id}`);
			return response.data;
		} catch (error: any) {
			console.error('iOS 환불 상세 조회 중 오류:', error);
			throw error;
		}
	},

	syncRefundStatus: async () => {
		try {
			const response = await axiosServer.post('/admin/apple-refund/sync');
			return response.data;
		} catch (error: any) {
			console.error('iOS 환불 상태 동기화 중 오류:', error);
			throw error;
		}
	},
};

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

const likes = {
	getList: async (params: AdminLikesParams): Promise<AdminLikesResponse> => {
		const response = await axiosServer.get('/admin/likes', { params });
		return response.data;
	},
};

const sometimeArticles = {
  uploadImage: async (imageFile: File): Promise<UploadImageResponse> => {
    try {
      console.log("썸타임 이야기 이미지 업로드 요청");
      console.log("File 정보:", {
        name: imageFile.name,
        type: imageFile.type,
        size: imageFile.size,
      });

      const formData = new FormData();
      formData.append("image", imageFile);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken")
          : null;
      const baseURL =
        process.env.NEXT_PUBLIC_NEXT_GEN_API_URL || "http://localhost:8044/api";

      const response = await fetch(
        `${baseURL}/admin/sometime-articles/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "x-country": getCountryHeader(),
          },
          body: formData,
          credentials: "include",
        },
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Upload failed" }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("썸타임 이야기 이미지 업로드 응답:", data);
      return data;
    } catch (error: any) {
      console.error("썸타임 이야기 이미지 업로드 중 오류:", error);
      throw error;
    }
  },

  getList: async (params?: {
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<AdminSometimeArticleListResponse> => {
    try {
      console.log("썸타임 이야기 목록 조회 요청:", params);
      const response =
        await axiosNextGen.get<AdminSometimeArticleListResponse>(
          "/admin/sometime-articles",
          { params },
        );
      console.log("썸타임 이야기 목록 응답:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("썸타임 이야기 목록 조회 중 오류:", error);
      console.error("오류 상세 정보:", error.response?.data || error.message);
      throw error;
    }
  },

  get: async (id: string): Promise<AdminSometimeArticleDetail> => {
    try {
      console.log("썸타임 이야기 조회 요청:", id);
      const response = await axiosNextGen.get<AdminSometimeArticleDetail>(
        `/admin/sometime-articles/${id}`,
      );
      console.log("썸타임 이야기 조회 응답:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("썸타임 이야기 조회 중 오류:", error);
      console.error("오류 상세 정보:", error.response?.data || error.message);
      throw error;
    }
  },

  create: async (
    data: CreateSometimeArticleRequest,
  ): Promise<AdminSometimeArticleDetail> => {
    try {
      console.log("썸타임 이야기 생성 요청:", data);
      const response = await axiosNextGen.post<AdminSometimeArticleDetail>(
        "/admin/sometime-articles",
        data,
      );
      console.log("썸타임 이야기 생성 응답:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("썸타임 이야기 생성 중 오류:", error);
      console.error("오류 상세 정보:", error.response?.data || error.message);
      throw error;
    }
  },

  update: async (
    id: string,
    data: UpdateSometimeArticleRequest,
  ): Promise<AdminSometimeArticleDetail> => {
    try {
      console.log("썸타임 이야기 수정 요청:", { id, data });
      const response = await axiosNextGen.patch<AdminSometimeArticleDetail>(
        `/admin/sometime-articles/${id}`,
        data,
      );
      console.log("썸타임 이야기 수정 응답:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("썸타임 이야기 수정 중 오류:", error);
      console.error("오류 상세 정보:", error.response?.data || error.message);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      console.log("썸타임 이야기 삭제 요청:", id);
      await axiosNextGen.delete(`/admin/sometime-articles/${id}`);
      console.log("썸타임 이야기 삭제 완료");
    } catch (error: any) {
      console.error("썸타임 이야기 삭제 중 오류:", error);
      console.error("오류 상세 정보:", error.response?.data || error.message);
      throw error;
    }
  },
};

const momentQuestions = {
	generate: async (data: GenerateQuestionsRequest): Promise<GenerateQuestionsResponse> => {
		try {
			console.log('질문 생성 요청:', data);
			const response = await axiosServer.post<GenerateQuestionsResponse>(
				'/admin/questions/generate',
				data,
			);
			console.log('질문 생성 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('질문 생성 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	bulkCreate: async (data: BulkCreateQuestionsRequest): Promise<BulkCreateQuestionsResponse> => {
		try {
			console.log('질문 대량 저장 요청:', data);
			const response = await axiosServer.post<BulkCreateQuestionsResponse>(
				'/admin/questions/bulk-create',
				data,
			);
			console.log('질문 대량 저장 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('질문 대량 저장 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	getList: async (params: GetQuestionsParams = {}): Promise<QuestionListResponse> => {
		try {
			console.log('질문 목록 조회 요청:', params);
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
			console.log('질문 목록 조회 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('질문 목록 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	getDetail: async (id: string): Promise<QuestionDetail> => {
		try {
			console.log('질문 상세 조회 요청:', id);
			const response = await axiosServer.get<QuestionDetail>(`/admin/questions/${id}`);
			console.log('질문 상세 조회 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('질문 상세 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	update: async (id: string, data: UpdateQuestionRequest): Promise<QuestionDetail> => {
		try {
			console.log('질문 수정 요청:', { id, data });
			const response = await axiosServer.put<QuestionDetail>(`/admin/questions/${id}`, data);
			console.log('질문 수정 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('질문 수정 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	delete: async (id: string): Promise<void> => {
		try {
			console.log('질문 삭제 요청:', id);
			await axiosServer.delete(`/admin/questions/${id}`);
			console.log('질문 삭제 완료');
		} catch (error: any) {
			console.error('질문 삭제 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	translate: async (data: TranslateQuestionsRequest): Promise<TranslateQuestionsResponse> => {
		try {
			console.log('질문 번역 요청:', data);
			const response = await axiosServer.post<TranslateQuestionsResponse>(
				'/admin/questions/translate',
				data,
			);
			console.log('질문 번역 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('질문 번역 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},
};

const userEngagement = {
	getStats: async (startDate?: string, endDate?: string, includeDeleted?: boolean) => {
		try {
			const params: Record<string, string> = {};
			if (startDate) params.startDate = startDate;
			if (endDate) params.endDate = endDate;
			if (includeDeleted !== undefined) params.includeDeleted = String(includeDeleted);

			const response = await axiosServer.get('/admin/stats/user-engagement', {
				params,
			});
			return response.data;
		} catch (error: any) {
			console.error('유저 참여 통계 조회 중 오류:', error);
			throw error;
		}
	},
};

// 강제 매칭 API
const forceMatching = {
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

const kpiReport = {
	getLatest: async () => {
		try {
			const response = await axiosServer.get('/kpi-report/latest');
			return response.data;
		} catch (error: any) {
			console.error('최신 KPI 리포트 조회 중 오류:', error);
			throw error;
		}
	},

	getByWeek: async (year: number, week: number) => {
		try {
			const response = await axiosServer.get(`/kpi-report/${year}/${week}`);
			return response.data;
		} catch (error: any) {
			console.error('주간 KPI 리포트 조회 중 오류:', error);
			throw error;
		}
	},

	getDefinitions: async () => {
		try {
			const response = await axiosServer.get('/kpi-report/definitions');
			return response.data;
		} catch (error: any) {
			console.error('KPI 정의 조회 중 오류:', error);
			throw error;
		}
	},

	generate: async (year?: number, week?: number) => {
		try {
			const response = await axiosServer.post('/kpi-report/generate', { year, week });
			return response.data;
		} catch (error: any) {
			console.error('KPI 리포트 생성 중 오류:', error);
			throw error;
		}
	},
};

// ==================== 앱 리뷰 ====================
export interface AppReviewItem {
	pk: string;
	store: 'APP_STORE' | 'PLAY_STORE';
	reviewId: string;
	rating: number;
	title: string;
	body: string;
	author: string;
	appVersion: string;
	language: string;
	createdAt: string;
	collectedAt: string;
}

export interface AppReviewsResponse {
	items: AppReviewItem[];
	nextCursor: string | null;
	totalScannedCount: number;
}

export interface AppReviewStatsResponse {
	totalCount: number;
	averageRating: number;
	byStore: { store: string; count: number; averageRating: number }[];
	ratingDistribution: { rating: number; count: number }[];
	lastCollectedAt: string;
}

export interface AppReviewsParams {
	store?: 'APP_STORE' | 'PLAY_STORE';
	rating?: number;
	startDate?: string;
	endDate?: string;
	limit?: number;
	cursor?: string;
}

const appReviews = {
	getList: async (params: AppReviewsParams = {}): Promise<AppReviewsResponse> => {
		try {
			const response = await axiosServer.get('/admin/app-reviews', { params });
			return response.data;
		} catch (error: any) {
			console.error('앱 리뷰 목록 조회 중 오류:', error);
			throw error;
		}
	},

	getStats: async (): Promise<AppReviewStatsResponse> => {
		try {
			const response = await axiosServer.get('/admin/app-reviews/stats');
			return response.data;
		} catch (error: any) {
			console.error('앱 리뷰 통계 조회 중 오류:', error);
			throw error;
		}
	},
};

const AdminService = {
	auth,
	stats,
	userAppearance,
	universities,
	matching,
	reports,
	profileImages,
	userReview,
	pushNotifications,
	aiChat,
	backgroundPresets,
	cardNews,
	femaleRetention,
	gems,
	deletedFemales,
	banners,
	dormantLikes,
	chatRefund,
	appleRefund,
	likes,
	momentQuestions,
	sometimeArticles,
	userEngagement,
	forceMatching,
	kpiReport,
	appReviews,
	getProfileReports: reports.getProfileReports,
};

export default AdminService;
