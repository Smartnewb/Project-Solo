import axiosServer from '@/utils/axios';
import { adminGet } from '@/shared/lib/http/admin-fetch';
import { getCountryHeader } from './_shared';
import type {
	MatchingDashboardResponse,
	UserDiagnosisResponse,
	DashboardPeriod,
	DashboardCountry,
} from '@/app/admin/matching-monitor/types';

export const matchingMonitor = {
	getDashboard: async (
		period: DashboardPeriod = 'today',
		country: DashboardCountry = 'ALL',
	): Promise<MatchingDashboardResponse> => {
		const result = await adminGet<{ data: MatchingDashboardResponse }>('/admin/v2/matching/dashboard', { period, country });
		return result.data;
	},

	getUserDiagnosis: async (userId: string): Promise<UserDiagnosisResponse> => {
		const headerCountry = getCountryHeader();
		const response = await axiosServer.get(`/admin/matching/users/${userId}/diagnosis`, {
			headers: { 'X-Country': headerCountry },
		});
		return response.data;
	},
};
