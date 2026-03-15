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
			const raw = response.data.data;
			const trendItems = Array.isArray(raw?.data) ? raw.data : [];
			return {
				...raw,
				data: trendItems.map((item: { date: string; count: number }) => {
					if (!item?.date) return { weekStart: '', weekEnd: '', count: item?.count ?? 0, label: '' };
					const parts = item.date.split('-');
					const year = parseInt(parts[0], 10);
					const week = parseInt(parts[1], 10);
					const jan4 = new Date(year, 0, 4);
					const dayOfWeek = jan4.getDay() || 7;
					const weekStart = new Date(jan4);
					weekStart.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
					const weekEnd = new Date(weekStart);
					weekEnd.setDate(weekStart.getDate() + 6);
					return {
						weekStart: weekStart.toISOString().split('T')[0],
						weekEnd: weekEnd.toISOString().split('T')[0],
						count: item.count,
						label: `${weekStart.toISOString().split('T')[0]} ~ ${weekEnd.toISOString().split('T')[0]}`,
					};
				}),
			};
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
			const raw = response.data.data;
			const trendItems = Array.isArray(raw?.data) ? raw.data : [];
			return {
				...raw,
				data: trendItems.map((item: { date: string; count: number }) => ({
					month: item?.date ?? '',
					count: item?.count ?? 0,
					label: item?.date ?? '',
				})),
			};
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
			const raw = response.data.data;
			const gender = raw.gender ?? {};
			const maleCount = gender.male ?? 0;
			const femaleCount = gender.female ?? 0;
			const totalCount = raw.totalUsers ?? 0;
			const malePercentage = gender.maleRatio ?? 0;
			const femalePercentage = gender.femaleRatio ?? 0;
			const maleRatioInt = Math.round(malePercentage);
			const femaleRatioInt = Math.round(femalePercentage);
			return {
				maleCount,
				femaleCount,
				totalCount,
				malePercentage,
				femalePercentage,
				genderRatio: `${maleRatioInt}:${femaleRatioInt}`,
			};
		} catch (error) {
			throw error;
		}
	},

	getUniversityStats: async (region?: string, includeDeleted?: boolean, useCluster?: boolean) => {
		try {
			const params: any = {};
			if (region) params.region = region;

			const response = await axiosServer.get('/admin/v2/stats/users', { params });
			const raw = response.data.data;
			const totalCount = raw.totalUsers ?? 0;
			const universities = (raw.universities ?? []).map((u: any) => ({
				universityName: u.name,
				totalCount: u.totalUsers ?? 0,
				maleCount: u.maleUsers ?? 0,
				femaleCount: u.femaleUsers ?? 0,
				percentage: u.ratio ?? 0,
				genderRatio: (u.maleUsers ?? 0) > 0 || (u.femaleUsers ?? 0) > 0
					? `${u.maleUsers ?? 0}:${u.femaleUsers ?? 0}`
					: '-',
			}));
			return { universities, totalCount };
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
			const raw = response.data.data;
			const trend = Array.isArray(raw?.trend) ? raw.trend : Array.isArray(raw?.data) ? raw.data : [];
			return {
				...raw,
				data: trend.map((item: { date: string; count: number }) => ({
					...item,
					label: item.date,
				})),
			};
		} catch (error) {
			throw error;
		}
	},

	getWeeklyWithdrawalTrend: async (region?: string, useCluster?: boolean) => {
		try {
			const params: any = { period: 'weekly' };
			if (region) params.region = region;

			const response = await axiosServer.get('/admin/v2/stats/withdrawals', { params });
			const raw = response.data.data;
			const trend = Array.isArray(raw?.trend) ? raw.trend : Array.isArray(raw?.data) ? raw.data : [];
			return {
				...raw,
				data: trend.map((item: { date: string; count: number }) => {
					if (!item?.date) return { ...item, label: '' };
					const parts = item.date.split('-');
					const year = parseInt(parts[0], 10);
					const week = parseInt(parts[1], 10);
					const jan4 = new Date(year, 0, 4);
					const dayOfWeek = jan4.getDay() || 7;
					const weekStart = new Date(jan4);
					weekStart.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
					const weekEnd = new Date(weekStart);
					weekEnd.setDate(weekStart.getDate() + 6);
					return {
						...item,
						label: `${weekStart.toISOString().split('T')[0]} ~ ${weekEnd.toISOString().split('T')[0]}`,
					};
				}),
			};
		} catch (error) {
			throw error;
		}
	},

	getMonthlyWithdrawalTrend: async (region?: string, useCluster?: boolean) => {
		try {
			const params: any = { period: 'monthly' };
			if (region) params.region = region;

			const response = await axiosServer.get('/admin/v2/stats/withdrawals', { params });
			const raw = response.data.data;
			const trend = Array.isArray(raw?.trend) ? raw.trend : Array.isArray(raw?.data) ? raw.data : [];
			return {
				...raw,
				data: trend.map((item: { date: string; count: number }) => ({
					...item,
					label: item.date,
				})),
			};
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
			const raw = response.data.data;
			const trend = Array.isArray(raw?.trend) ? raw.trend : Array.isArray(raw?.data) ? raw.data : [];
			return {
				...raw,
				data: trend.map((item: { date: string; count: number }) => ({
					...item,
					label: item.date,
				})),
			};
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
			const raw = response.data.data;
			const cr = raw.churnRate ?? {};
			return {
				...raw,
				dailyChurnRate: cr.daily ?? 0,
				weeklyChurnRate: cr.weekly ?? 0,
				monthlyChurnRate: cr.monthly ?? 0,
			};
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
