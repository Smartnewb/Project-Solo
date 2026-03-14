import axiosServer from '@/utils/axios';
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
		const headerCountry = getCountryHeader();
		const response = await axiosServer.get('/admin/matching/dashboard', {
			params: { period, country },
			headers: { 'X-Country': headerCountry },
		});
		return response.data;
	},

	getUserDiagnosis: async (userId: string): Promise<UserDiagnosisResponse> => {
		const headerCountry = getCountryHeader();
		const response = await axiosServer.get(`/admin/matching/users/${userId}/diagnosis`, {
			headers: { 'X-Country': headerCountry },
		});
		return response.data;
	},
};
