import { adminGet, adminPost } from '@/shared/lib/http/admin-fetch';

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
		const stringParams: Record<string, string> = {};
		if (params.page != null) stringParams.page = String(params.page);
		if (params.limit != null) stringParams.limit = String(params.limit);
		if (params.search != null) stringParams.search = params.search;
		return adminGet<CareTargetsResponse>('/admin/care/targets', stringParams);
	},

	getPartners: async (userId: string, limit: number = 10) => {
		return adminGet<CarePartner[]>(`/admin/care/targets/${userId}/partners`, { limit: String(limit) });
	},

	execute: async (body: CareExecuteRequest) => {
		return adminPost<CareExecuteResponse>('/admin/care/execute', body);
	},

	dismiss: async (targetId: string) => {
		return adminPost<{ success: boolean }>(`/admin/care/targets/${targetId}/dismiss`);
	},

	getLogs: async (params: {
		page?: number;
		limit?: number;
		targetUserId?: string;
		action?: string;
	}) => {
		const stringParams: Record<string, string> = {};
		if (params.page != null) stringParams.page = String(params.page);
		if (params.limit != null) stringParams.limit = String(params.limit);
		if (params.targetUserId != null) stringParams.targetUserId = params.targetUserId;
		if (params.action != null) stringParams.action = params.action;
		return adminGet<CareLogsResponse>('/admin/care/logs', stringParams);
	},
};
