import { useQuery } from '@tanstack/react-query';
import AdminService from '@/app/services/admin';
import type {
	EngagementFlowDailyQuery,
	EngagementFlowQuery,
} from '@/app/services/admin/incentive-campaign';

export const incentiveCampaignKeys = {
	all: ['admin', 'incentive-campaign'] as const,
	calendar: (startDate: string, endDate: string) =>
		[...incentiveCampaignKeys.all, 'calendar', { startDate, endDate }] as const,
	engagementFlow: (params: EngagementFlowQuery) =>
		[...incentiveCampaignKeys.all, 'engagement-flow', params] as const,
	engagementFlowDaily: (params: EngagementFlowDailyQuery) =>
		[...incentiveCampaignKeys.all, 'engagement-flow-daily', params] as const,
};

export function useIncentiveCampaignCalendar(startDate: string, endDate: string) {
	return useQuery({
		queryKey: incentiveCampaignKeys.calendar(startDate, endDate),
		queryFn: () => AdminService.incentiveCampaign.getCalendar({ startDate, endDate }),
		enabled: !!startDate && !!endDate,
	});
}

export function useIncentiveCampaignEngagementFlow(params: EngagementFlowQuery) {
	return useQuery({
		queryKey: incentiveCampaignKeys.engagementFlow(params),
		queryFn: () => AdminService.incentiveCampaign.getEngagementFlow(params),
		enabled: !!params.startDate && !!params.endDate,
	});
}

export function useIncentiveCampaignEngagementFlowDaily(params: EngagementFlowDailyQuery) {
	return useQuery({
		queryKey: incentiveCampaignKeys.engagementFlowDaily(params),
		queryFn: () => AdminService.incentiveCampaign.getEngagementFlowDaily(params),
		enabled: !!params.date,
	});
}
