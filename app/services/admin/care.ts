import axiosServer from '@/utils/axios';
import { getCountryHeader } from './_shared';

export interface CareTarget {
	id: string;
	user_id: string;
	consecutive_failure_days: number;
	last_failure_reason: string | null;
	last_failure_at: string | null;
	engagement_score: number | null;
	gender: string;
	status: 'pending' | 'cared' | 'dismissed';
	created_at: string;
	name: string;
	birthday: string;
	introduction: string | null;
	user_status: string;
	university_name: string;
	profile_image_url: string | null;
}

export interface CareTargetsResponse {
	items: CareTarget[];
	total: number;
	page: number;
	limit: number;
}

export interface CarePartner {
	userId: string;
	name: string;
	age: number;
	gender: string;
	universityName: string;
	profileImageUrl: string | null;
}

export interface CareExecuteRequest {
	targetUserId: string;
	partnerUserId: string;
	action: 'like' | 'mutual_like' | 'open_chat';
	letterContent: string;
	careTargetId?: string;
}

export interface CareExecuteResponse {
	success: boolean;
	connectionId: string;
	matchId: string;
	chatRoomId?: string;
}

export interface CareLog {
	id: string;
	target_user_id: string;
	partner_user_id: string;
	admin_user_id: string;
	action: 'like' | 'mutual_like' | 'open_chat';
	letter_content: string;
	connection_id: string;
	chat_room_id: string | null;
	care_target_id: string | null;
	created_at: string;
	target_name: string;
	partner_name: string;
	admin_name: string;
}

export interface CareLogsResponse {
	items: CareLog[];
	total: number;
	page: number;
	limit: number;
}

export const care = {
	getTargets: async (params: { page?: number; limit?: number; search?: string }) => {
		const country = getCountryHeader();
		const response = await axiosServer.get<CareTargetsResponse>('/admin/care/targets', {
			params,
			headers: { 'X-Country': country },
		});
		return response.data;
	},

	getPartners: async (userId: string, limit: number = 10) => {
		const country = getCountryHeader();
		const response = await axiosServer.get<CarePartner[]>(
			`/admin/care/targets/${userId}/partners`,
			{
				params: { limit },
				headers: { 'X-Country': country },
			},
		);
		return response.data;
	},

	execute: async (body: CareExecuteRequest) => {
		const country = getCountryHeader();
		const response = await axiosServer.post<CareExecuteResponse>(
			'/admin/care/execute',
			body,
			{ headers: { 'X-Country': country } },
		);
		return response.data;
	},

	dismiss: async (targetId: string) => {
		const country = getCountryHeader();
		const response = await axiosServer.post<{ success: boolean }>(
			`/admin/care/targets/${targetId}/dismiss`,
			{},
			{ headers: { 'X-Country': country } },
		);
		return response.data;
	},

	getLogs: async (params: {
		page?: number;
		limit?: number;
		targetUserId?: string;
		action?: string;
	}) => {
		const country = getCountryHeader();
		const response = await axiosServer.get<CareLogsResponse>('/admin/care/logs', {
			params,
			headers: { 'X-Country': country },
		});
		return response.data;
	},
};
