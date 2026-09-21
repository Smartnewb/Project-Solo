import { adminGet, adminPost } from '@/shared/lib/http/admin-fetch';

export type EtaSubmissionStatus = 'pending' | 'approved' | 'rejected';
export type EtaSubmissionStatusFilter = EtaSubmissionStatus | 'all';

export interface EtaSubmission {
	id: string;
	userId: string;
	name: string | null;
	schoolName: string;
	screenshotUrl: string;
	postUrl: string | null;
	status: EtaSubmissionStatus;
	rejectionReason: string | null;
	submittedAt: string;
	reviewedAt: string | null;
}

export interface EtaSubmissionList {
	items: EtaSubmission[];
	total: number;
	page: number;
	limit: number;
}

const BASE = '/admin/missions/everytime-promo';

export const etaMission = {
	getSubmissions: (
		status: EtaSubmissionStatusFilter = 'pending',
		page = 1,
		limit = 20,
	): Promise<EtaSubmissionList> =>
		adminGet<EtaSubmissionList>(`${BASE}/submissions`, { status, page, limit }),
	approve: (id: string): Promise<{ success: boolean; gemsAwarded: number }> =>
		adminPost<{ success: boolean; gemsAwarded: number }>(`${BASE}/${id}/approve`),
	reject: (id: string, reason: string): Promise<{ success: boolean }> =>
		adminPost<{ success: boolean }>(`${BASE}/${id}/reject`, { reason }),
};
