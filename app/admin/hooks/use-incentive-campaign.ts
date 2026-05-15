import { useQuery } from '@tanstack/react-query';
import AdminService from '@/app/services/admin';

export const incentiveCampaignKeys = {
	all: ['admin', 'incentive-campaign'] as const,
	calendar: (startDate: string, endDate: string) =>
		[...incentiveCampaignKeys.all, 'calendar', { startDate, endDate }] as const,
};

export function useIncentiveCampaignCalendar(startDate: string, endDate: string) {
	return useQuery({
		queryKey: incentiveCampaignKeys.calendar(startDate, endDate),
		queryFn: () => AdminService.incentiveCampaign.getCalendar({ startDate, endDate }),
		enabled: !!startDate && !!endDate,
	});
}
