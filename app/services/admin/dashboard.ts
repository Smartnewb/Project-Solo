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
			;
			return response.data;
		} catch (error) {
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
			;
			return response.data;
		} catch (error) {
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
			;
			return response.data;
		} catch (error) {
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
			;
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

			;
			;

			return response.data;
		} catch (error) {
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
			;
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

			;
			;

			return response.data;
		} catch (error) {
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
			;
			return response.data;
		} catch (error) {
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
			;
			;

			if (response.data && response.data.universities && response.data.universities.length > 0) {
				;
				;

				const firstUni = response.data.universities[0];
				;
				;
				;
				;
				;
				;
				;
			}

			return response.data;
		} catch (error) {
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
			throw error;
		}
	},

	getCustomPeriodWithdrawalCount: async (startDate: string, endDate: string) => {
		try {
			;
			const response = await axiosServer.post('/admin/stats/withdrawals/custom-period', {
				startDate,
				endDate,
			});
			return response.data;
		} catch (error) {
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
			throw error;
		}
	},

	getCustomPeriodWithdrawalTrend: async (startDate: string, endDate: string, region?: string, useCluster?: boolean) => {
		try {
			;
			const requestData: any = {
				startDate,
				endDate,
			};
			if (region) requestData.region = region;
			if (useCluster !== undefined) requestData.useCluster = useCluster;

			const response = await axiosServer.post('/admin/stats/withdrawals/trend/custom-period', requestData);
			return response.data;
		} catch (error) {
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
			throw error;
		}
	},

	getChurnRate: async () => {
		try {
			const response = await axiosServer.get('/admin/stats/withdrawals/churn-rate');
			return response.data;
		} catch (error) {
			throw error;
		}
	},
};

export const dashboardV2 = {
	getSummary: async (startDate?: string, endDate?: string) => {
		// V2 ADAPTER
		const params: any = {};
		if (startDate) params.startDate = startDate;
		if (endDate) params.endDate = endDate;
		const response = await axiosServer.get('/admin/v2/dashboard/summary', { params });
		return response.data.data;
	},

	getRevenue: async () => {
		// V2 ADAPTER
		const response = await axiosServer.get('/admin/v2/dashboard/revenue');
		return response.data.data;
	},

	getSignups: async (date?: string) => {
		// V2 ADAPTER
		const params: any = {};
		if (date) params.date = date;
		const response = await axiosServer.get('/admin/v2/dashboard/signups', { params });
		return response.data.data;
	},

	getStatsOverview: async (startDate?: string, endDate?: string) => {
		// V2 ADAPTER
		const params: any = {};
		if (startDate) params.startDate = startDate;
		if (endDate) params.endDate = endDate;
		const response = await axiosServer.get('/admin/v2/stats/overview', { params });
		return response.data.data;
	},

	getRetention: async (startDate?: string, endDate?: string) => {
		// V2 ADAPTER
		const params: any = {};
		if (startDate) params.startDate = startDate;
		if (endDate) params.endDate = endDate;
		const response = await axiosServer.get('/admin/v2/stats/retention', { params });
		return response.data.data;
	},
};

export const kpiReport = {
	getLatest: async (): Promise<import('@/app/admin/kpi-report/types').KpiReport> => {
		try {
			return await adminGet<import('@/app/admin/kpi-report/types').KpiReport>('/admin/kpi-report/latest');
		} catch (error: any) {
			throw error;
		}
	},

	getByWeek: async (year: number, week: number): Promise<import('@/app/admin/kpi-report/types').KpiReport> => {
		try {
			return await adminGet<import('@/app/admin/kpi-report/types').KpiReport>(`/admin/kpi-report/${year}/${week}`);
		} catch (error: any) {
			throw error;
		}
	},

	getDefinitions: async () => {
		try {
			return await adminGet('/admin/kpi-report/definitions');
		} catch (error: any) {
			throw error;
		}
	},

	generate: async (year?: number, week?: number): Promise<import('@/app/admin/kpi-report/types').KpiReport> => {
		try {
			return await adminPost<import('@/app/admin/kpi-report/types').KpiReport>('/admin/kpi-report/generate', { year, week });
		} catch (error: any) {
			throw error;
		}
	},
};
