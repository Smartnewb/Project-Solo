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

export type IncentiveCampaignCountry = 'kr' | 'jp' | 'all';
export type EngagementSegment =
	| 'all'
	| 'campaign_assigned_female'
	| 'campaign_participated_female'
	| 'non_campaign_female'
	| 'male_received_campaign_like'
	| 'male_not_received_campaign_like';
export type EngagementCacheMode = 'auto' | 'refresh' | 'bypass';
export type EngagementBucketKey = '00_09' | '09_12' | '12_18' | '18_21' | '21_24';

export interface CacheMeta {
	hit: boolean;
	key: string;
	generatedAt: string;
	ttlSeconds: number;
}

export interface EngagementFlowQuery {
	startDate: string;
	endDate: string;
	country?: IncentiveCampaignCountry;
	timezone?: 'Asia/Seoul';
	segment?: EngagementSegment;
	cache?: EngagementCacheMode;
}

export interface EngagementFlowDailyQuery {
	date: string;
	country?: IncentiveCampaignCountry;
	timezone?: 'Asia/Seoul';
	segment?: EngagementSegment;
	cache?: EngagementCacheMode;
}

export interface EngagementBucket {
	key: EngagementBucketKey;
	label: string;
	likes: {
		total: number;
		femaleToMale: number;
		maleToFemale: number;
		campaign: number;
	};
	mutualLikes: {
		total: number;
		fromCampaignLike: number;
	};
	profileViews: {
		total: number;
		femaleToMale: number;
		maleToFemale: number;
	};
	matches: {
		total: number;
		scheduledBatch: number;
		rematching: number;
		other: number;
	};
}

export interface EngagementFlowResponse {
	range: {
		startDate: string;
		endDate: string;
		timezone: string;
		country: IncentiveCampaignCountry;
		segment: string;
	};
	summary: {
		campaign: {
			assignments: number;
			participatingFemales: number;
			campaignLikes: number;
			assignmentToCampaignLikeRate: number | null;
		};
		likes: {
			total: number;
			femaleToMale: number;
			maleToFemale: number;
			campaign: number;
			nonCampaign: number;
			uniqueSenders: number;
			uniqueReceivers: number;
		};
		mutualLikes: {
			total: number;
			fromCampaignLike: number;
			femaleInitiated: number;
			maleInitiated: number;
		};
		profileViews: {
			total: number;
			femaleToMale: number;
			maleToFemale: number;
			uniqueViewers: number;
			uniqueViewedUsers: number;
		};
		matches: {
			total: number;
			scheduledBatch: number;
			rematching: number;
			admin: number;
			profileViewer: number;
			withCampaignFemale: number;
			withCampaignMale: number;
		};
		conversion: {
			campaignLikeToMutualRate: number | null;
			profileViewToLikeRate: number | null;
			profileViewToMatchRate: number | null;
			likeToMatchRate: number | null;
		};
	};
	buckets: EngagementBucket[];
	cache: CacheMeta;
}

export interface DailyEngagementBucket {
	key: EngagementBucketKey;
	label: string;
	campaignLikes: number;
	likes: {
		femaleToMale: number;
		maleToFemale: number;
	};
	mutualLikes: {
		total: number;
		fromCampaignLike: number;
	};
	profileViews: {
		femaleToMale: number;
		maleToFemale: number;
	};
	matches: {
		scheduledBatch: number;
		rematching: number;
	};
}

export interface EngagementFlowDailyResponse {
	date: string;
	country: IncentiveCampaignCountry;
	timezone: string;
	segment: string;
	summary: {
		assignments: number;
		campaignLikes: number;
		participatingFemales: number;
		likes: number;
		mutualLikes: number;
		profileViews: number;
		matches: number;
		scheduledBatchMatches: number;
		rematchingMatches: number;
	};
	buckets: DailyEngagementBucket[];
	cache: CacheMeta;
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
	getEngagementFlow: async (params: EngagementFlowQuery): Promise<EngagementFlowResponse> => {
		const res = await adminGet<AdminDataResponse<EngagementFlowResponse>>(
			'/admin/v2/incentive-campaign/engagement-flow',
			{ ...params },
		);
		return unwrapAdminData(res);
	},
	getEngagementFlowDaily: async (
		params: EngagementFlowDailyQuery,
	): Promise<EngagementFlowDailyResponse> => {
		const res = await adminGet<AdminDataResponse<EngagementFlowDailyResponse>>(
			'/admin/v2/incentive-campaign/engagement-flow/daily',
			{ ...params },
		);
		return unwrapAdminData(res);
	},
};
