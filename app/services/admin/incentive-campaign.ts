import { adminGet } from '@/shared/lib/http/admin-fetch';

type AdminDataResponse<T> = T | { data: T };

function unwrapAdminData<T>(response: AdminDataResponse<T>): T {
	if (response && typeof response === 'object' && 'data' in response) {
		return response.data;
	}
	return response;
}

export interface CampaignCalendarUserSummary {
	userId: string;
	name: string;
	phoneNumber: string | null;
}

export interface CampaignCalendarMaleProfile {
	userId: string;
	name: string;
	age: number;
	rank: string | null;
	universityName: string | null;
	departmentName: string | null;
	profileImageUrl: string | null;
}

export interface CampaignCalendarAssignment {
	id: string;
	assignedDate: string;
	isLiked: boolean;
	likedAt: string | null;
	matchLikeId: string | null;
	maleProfile: CampaignCalendarMaleProfile;
}

export interface CampaignCalendarFemaleGroup {
	femaleUser: CampaignCalendarUserSummary;
	assignments: CampaignCalendarAssignment[];
}

export interface CampaignCalendarDay {
	date: string;
	totalAssignments: number;
	totalLikesSent: number;
	uniqueFemalesAssigned: number;
	uniqueFemalesParticipated: number;
	femaleGroups: CampaignCalendarFemaleGroup[];
}

export interface CampaignCalendarResponse {
	startDate: string;
	endDate: string;
	days: CampaignCalendarDay[];
}

export const incentiveCampaign = {
	getCalendar: async (params: {
		startDate: string;
		endDate: string;
	}): Promise<CampaignCalendarResponse> => {
		const res = await adminGet<AdminDataResponse<CampaignCalendarResponse>>(
			'/admin/v2/incentive-campaign/calendar',
			params,
		);
		return unwrapAdminData(res);
	},
};
