import axiosServer from '@/utils/axios';
import { adminGet, adminPost } from '@/shared/lib/http/admin-fetch';
import type { FormattedData } from './_shared';

export const stats = {
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
			return response.data;
		} catch (error) {
			console.error('총 회원 수 조회 중 오류:', error);
			throw error;
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
			return response.data;
		} catch (error) {
			console.error('오늘 가입한 회원 수 조회 중 오류:', error);
			throw error;
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
			return response.data;
		} catch (error) {
			console.error('이번 주 가입한 회원 수 조회 중 오류:', error);
			throw error;
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

			console.log('원본 API 응답:', response);
			console.log('응답 데이터:', response.data);

			return response.data;
		} catch (error) {
			console.error('사용자 지정 기간 회원가입자 수 조회 중 오류:', error);
			throw error;
		}
	},

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

			console.log('추이 원본 API 응답:', response);
			console.log('추이 응답 데이터:', response.data);

			return response.data;
		} catch (error) {
			console.error('사용자 지정 기간 회원가입 추이 조회 중 오류:', error);
			throw error;
		}
	},

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
			return response.data;
		} catch (error) {
			console.error('성별 통계 조회 중 오류:', error);
			throw error;
		}
	},

	getUniversityStats: async (region?: string, includeDeleted?: boolean, useCluster?: boolean) => {
		try {
			const params: any = {};
			if (region) params.region = region;
			if (includeDeleted !== undefined) params.includeDeleted = String(includeDeleted);
			if (useCluster !== undefined) params.useCluster = String(useCluster);

			const response = await axiosServer.get('/admin/stats/users/universities', { params });
			console.log('서비스에서 받은 대학별 통계 데이터:', response.data);
			console.log('서비스에서 받은 데이터 구조:', JSON.stringify(response.data, null, 2));

			if (response.data && response.data.universities && response.data.universities.length > 0) {
				console.log('첫 번째 대학 데이터:', response.data.universities[0]);
				console.log('대학 데이터 키:', Object.keys(response.data.universities[0]));

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

	getTotalWithdrawalsCount: async (region?: string, useCluster?: boolean) => {
		try {
			const params: any = {};
			if (region) params.region = region;
			if (useCluster !== undefined) params.useCluster = String(useCluster);

			const response = await axiosServer.get('/admin/stats/withdrawals/total', {
				params,
			});
			return response.data;
		} catch (error) {
			console.error('총 탈퇴자 수 조회 중 오류:', error);
			throw error;
		}
	},

	getDailyWithdrawalCount: async (region?: string, useCluster?: boolean) => {
		try {
			const params: any = {};
			if (region) params.region = region;
			if (useCluster !== undefined) params.useCluster = String(useCluster);

			const response = await axiosServer.get('/admin/stats/withdrawals/daily', {
				params,
			});
			return response.data;
		} catch (error) {
			console.error('오늘 탈퇴한 회원 수 조회 중 오류:', error);
			throw error;
		}
	},

	getWeeklyWithdrawalCount: async (region?: string, useCluster?: boolean) => {
		try {
			const params: any = {};
			if (region) params.region = region;
			if (useCluster !== undefined) params.useCluster = String(useCluster);

			const response = await axiosServer.get('/admin/stats/withdrawals/weekly', { params });
			return response.data;
		} catch (error) {
			console.error('이번 주 탈퇴한 회원 수 조회 중 오류:', error);
			throw error;
		}
	},

	getMonthlyWithdrawalCount: async (region?: string, useCluster?: boolean) => {
		try {
			const params: any = {};
			if (region) params.region = region;
			if (useCluster !== undefined) params.useCluster = String(useCluster);

			const response = await axiosServer.get('/admin/stats/withdrawals/monthly', { params });
			return response.data;
		} catch (error) {
			console.error('이번 달 탈퇴한 회원 수 조회 중 오류:', error);
			throw error;
		}
	},

	getCustomPeriodWithdrawalCount: async (startDate: string, endDate: string) => {
		try {
			console.log('사용자 지정 기간 탈퇴자 수 조회:', startDate, endDate);
			const response = await axiosServer.post('/admin/stats/withdrawals/custom-period', {
				startDate,
				endDate,
			});
			return response.data;
		} catch (error) {
			console.error('사용자 지정 기간 탈퇴자 수 조회 중 오류:', error);
			throw error;
		}
	},

	getDailyWithdrawalTrend: async (region?: string, useCluster?: boolean) => {
		try {
			const params: any = {};
			if (region) params.region = region;
			if (useCluster !== undefined) params.useCluster = String(useCluster);

			const response = await axiosServer.get('/admin/stats/withdrawals/trend/daily', { params });
			return response.data;
		} catch (error) {
			console.error('일별 탈퇴 추이 조회 중 오류:', error);
			throw error;
		}
	},

	getWeeklyWithdrawalTrend: async (region?: string, useCluster?: boolean) => {
		try {
			const params: any = {};
			if (region) params.region = region;
			if (useCluster !== undefined) params.useCluster = String(useCluster);

			const response = await axiosServer.get('/admin/stats/withdrawals/trend/weekly', { params });
			return response.data;
		} catch (error) {
			console.error('주별 탈퇴 추이 조회 중 오류:', error);
			throw error;
		}
	},

	getMonthlyWithdrawalTrend: async (region?: string, useCluster?: boolean) => {
		try {
			const params: any = {};
			if (region) params.region = region;
			if (useCluster !== undefined) params.useCluster = String(useCluster);

			const response = await axiosServer.get('/admin/stats/withdrawals/trend/monthly', { params });
			return response.data;
		} catch (error) {
			console.error('월별 탈퇴 추이 조회 중 오류:', error);
			throw error;
		}
	},

	getCustomPeriodWithdrawalTrend: async (startDate: string, endDate: string, region?: string, useCluster?: boolean) => {
		try {
			console.log('사용자 지정 기간 탈퇴 추이 조회:', startDate, endDate);
			const requestData: any = {
				startDate,
				endDate,
			};
			if (region) requestData.region = region;
			if (useCluster !== undefined) requestData.useCluster = useCluster;

			const response = await axiosServer.post('/admin/stats/withdrawals/trend/custom-period', requestData);
			return response.data;
		} catch (error) {
			console.error('사용자 지정 기간 탈퇴 추이 조회 중 오류:', error);
			throw error;
		}
	},

	getWithdrawalReasonStats: async (startDate?: string, endDate?: string) => {
		try {
			const params: any = {};
			if (startDate) params.startDate = startDate;
			if (endDate) params.endDate = endDate;

			const response = await axiosServer.get('/admin/stats/withdrawals/reasons', { params });
			return response.data;
		} catch (error) {
			console.error('탈퇴 사유 통계 조회 중 오류:', error);
			throw error;
		}
	},

	getChurnRate: async () => {
		try {
			const response = await axiosServer.get('/admin/stats/withdrawals/churn-rate');
			return response.data;
		} catch (error) {
			console.error('이탈률 조회 중 오류:', error);
			throw error;
		}
	},
};

export const kpiReport = {
	getLatest: async () => {
		try {
			return await adminGet('/admin/kpi-report/latest');
		} catch (error: any) {
			console.error('최신 KPI 리포트 조회 중 오류:', error);
			throw error;
		}
	},

	getByWeek: async (year: number, week: number) => {
		try {
			return await adminGet(`/admin/kpi-report/${year}/${week}`);
		} catch (error: any) {
			console.error('주간 KPI 리포트 조회 중 오류:', error);
			throw error;
		}
	},

	getDefinitions: async () => {
		try {
			return await adminGet('/admin/kpi-report/definitions');
		} catch (error: any) {
			console.error('KPI 정의 조회 중 오류:', error);
			throw error;
		}
	},

	generate: async (year?: number, week?: number) => {
		try {
			return await adminPost('/admin/kpi-report/generate', { year, week });
		} catch (error: any) {
			console.error('KPI 리포트 생성 중 오류:', error);
			throw error;
		}
	},
};
