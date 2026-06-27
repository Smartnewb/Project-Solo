import { adminGet, adminPatch } from '@/shared/lib/http/admin-fetch';

export type EtaSubmissionStatus = 'pending' | 'approved' | 'rejected';
export type EtaSubmissionStatusFilter = EtaSubmissionStatus | 'all';

export interface EtaSubmission {
	id: string;
	status: EtaSubmissionStatus;
	userId?: string;
	createdAt?: string;
	updatedAt?: string;
	[key: string]: unknown;
}

export interface EtaSubmissionList {
	data: EtaSubmission[];
	meta?: {
		total?: number;
		page?: number;
		limit?: number;
		totalPages?: number;
	};
}

export const etaMission = {
	list: (params?: { status?: EtaSubmissionStatusFilter; page?: number; limit?: number }) =>
		adminGet<EtaSubmissionList>('/admin/v2/eta-mission/submissions', params),
	updateStatus: (id: string, status: EtaSubmissionStatus) =>
		adminPatch<EtaSubmission>(`/admin/v2/eta-mission/submissions/${id}`, { status }),
};
