import axiosServer from '@/utils/axios';
import { adminGet, adminPost } from '@/shared/lib/http/admin-fetch';
import type { FormattedData } from './_shared';

export const stats = {
	getTotalUsersCount: async (region?: string, includeDeleted?: boolean, useCluster?: boolean) => {
		try {
			const params: any = {};
			if (region) params.region = region;
			if (includeDeleted !== undefined) params.includeDeleted = includeDeleted;

			const response = await axiosServer.get('/admin/v2/stats/users', {
				params,
			});
			return response.data.data;
		} catch (error) {
			throw error;
		}
	},
	getDailySignupCount: async (region?: string, includeDeleted?: boolean, useCluster?: boolean) => {
		try {
			const params: any = { period: 'daily' };
			if (region) params.region = region;
			if (includeDeleted !== undefined) params.includeDeleted = includeDeleted;

			const response = await axiosServer.get('/admin/v2/stats/users', {
				params,
			});
			return response.data.data;
		} catch (error) {
			throw error;
		}
	},
	getWeeklySignupCount: async (region?: string, includeDeleted?: boolean, useCluster?: boolean) => {
		try {
			const params: any = { period: 'weekly' };
			if (region) params.region = region;
			if (includeDeleted !== undefined) params.includeDeleted = includeDeleted;

			const response = await axiosServer.get('/admin/v2/stats/users', {
				params,
			});
			return response.data.data;
		} catch (error) {
			throw error;
		}
	},
	getDailySignupTrend: async (region?: string, includeDeleted?: boolean, useCluster?: boolean) => {
		try {
			const params: any = { period: 'daily' };
			if (region) params.region = region;
			if (includeDeleted !== undefined) params.includeDeleted = includeDeleted;

			const response = await axiosServer.get('/admin/v2/stats/users/trend', {
				params,
			});
			return response.data.data;
		} catch (error) {
			throw error;
		}
	},
	getWeeklySignupTrend: async (region?: string, includeDeleted?: boolean, useCluster?: boolean) => {
		try {
			const params: any = { period: 'weekly' };
			if (region) params.region = region;
			if (includeDeleted !== undefined) params.includeDeleted = includeDeleted;

			const response = await axiosServer.get('/admin/v2/stats/users/trend', { params });
			return response.data.data;
		} catch (error) {
			throw error;
		}
	},
	getMonthlySignupTrend: async (region?: string, includeDeleted?: boolean, useCluster?: boolean) => {
		try {
			const params: any = { period: 'monthly' };
			if (region) params.region = region;
			if (includeDeleted !== undefined) params.includeDeleted = includeDeleted;

			const response = await axiosServer.get('/admin/v2/stats/users/trend', { params });
			return response.data.data;
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
			const params: any = {
				from: startDate,
				to: endDate,
			};

			if (region) {
				params.region = region;
			}

			const response = await axiosServer.get('/admin/v2/stats/users', { params });

			return response.data.data;
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
			const params: any = {
				period: 'daily',
				from: startDate,
				to: endDate,
			};

			if (region) {
				params.region = region;
			}

			const response = await axiosServer.get('/admin/v2/stats/users/trend', { params });

			return response.data.data;
		} catch (error) {
			throw error;
		}
	},

	getGenderStats: async (region?: string, includeDeleted?: boolean, useCluster?: boolean) => {
		try {
			const params: any = {};
			if (region) params.region = region;

			const response = await axiosServer.get('/admin/v2/stats/users', {
				params,
			});
			return response.data.data;
		} catch (error) {
			throw error;
		}
	},

	getUniversityStats: async (region?: string, includeDeleted?: boolean, useCluster?: boolean) => {
		try {
			const params: any = {};
			if (region) params.region = region;

			const response = await axiosServer.get('/admin/v2/stats/users', { params });

			return response.data.data;
		} catch (error) {
			throw error;
		}
	},

	getTotalWithdrawalsCount: async (region?: string, useCluster?: boolean) => {
		try {
			const params: any = {};
			if (region) params.region = region;

			const response = await axiosServer.get('/admin/v2/stats/withdrawals', {
				params,
			});
			return response.data.data;
		} catch (error) {
			throw error;
		}
	},

	getDailyWithdrawalCount: async (region?: string, useCluster?: boolean) => {
		try {
			const params: any = { period: 'daily' };
			if (region) params.region = region;

			const response = await axiosServer.get('/admin/v2/stats/withdrawals', {
				params,
			});
			return response.data.data;
		} catch (error) {
			throw error;
		}
	},

	getWeeklyWithdrawalCount: async (region?: string, useCluster?: boolean) => {
		try {
			const params: any = { period: 'weekly' };
			if (region) params.region = region;

			const response = await axiosServer.get('/admin/v2/stats/withdrawals', { params });
			return response.data.data;
		} catch (error) {
			throw error;
		}
	},

	getMonthlyWithdrawalCount: async (region?: string, useCluster?: boolean) => {
		try {
			const params: any = { period: 'monthly' };
			if (region) params.region = region;

			const response = await axiosServer.get('/admin/v2/stats/withdrawals', { params });
			return response.data.data;
		} catch (error) {
			throw error;
		}
	},

	getCustomPeriodWithdrawalCount: async (startDate: string, endDate: string) => {
		try {
			const response = await axiosServer.get('/admin/v2/stats/withdrawals', {
				params: { from: startDate, to: endDate },
			});
			return response.data.data;
		} catch (error) {
			throw error;
		}
	},

	getDailyWithdrawalTrend: async (region?: string, useCluster?: boolean) => {
		try {
			const params: any = { period: 'daily' };
			if (region) params.region = region;

			const response = await axiosServer.get('/admin/v2/stats/withdrawals', { params });
			return response.data.data;
		} catch (error) {
			throw error;
		}
	},

	getWeeklyWithdrawalTrend: async (region?: string, useCluster?: boolean) => {
		try {
			const params: any = { period: 'weekly' };
			if (region) params.region = region;

			const response = await axiosServer.get('/admin/v2/stats/withdrawals', { params });
			return response.data.data;
		} catch (error) {
			throw error;
		}
	},

	getMonthlyWithdrawalTrend: async (region?: string, useCluster?: boolean) => {
		try {
			const params: any = { period: 'monthly' };
			if (region) params.region = region;

			const response = await axiosServer.get('/admin/v2/stats/withdrawals', { params });
			return response.data.data;
		} catch (error) {
			throw error;
		}
	},

	getCustomPeriodWithdrawalTrend: async (startDate: string, endDate: string, region?: string, useCluster?: boolean) => {
		try {
			const params: any = {
				from: startDate,
				to: endDate,
			};
			if (region) params.region = region;

			const response = await axiosServer.get('/admin/v2/stats/withdrawals', { params });
			return response.data.data;
		} catch (error) {
			throw error;
		}
	},

	getWithdrawalReasonStats: async (startDate?: string, endDate?: string) => {
		try {
			const params: any = {};
			if (startDate) params.from = startDate;
			if (endDate) params.to = endDate;

			const response = await axiosServer.get('/admin/v2/stats/withdrawals', { params });
			return response.data.data;
		} catch (error) {
			throw error;
		}
	},

	getChurnRate: async () => {
		try {
			const response = await axiosServer.get('/admin/v2/stats/withdrawals');
			return response.data.data;
		} catch (error) {
			throw error;
		}
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
