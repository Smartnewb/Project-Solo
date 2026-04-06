import { adminGet, adminPost, adminPatch } from '@/shared/lib/http/admin-fetch';
import type {
	GhostAccount,
	GhostAccountStats,
	GhostAccountStatus,
	EligibleSource,
	CandidateListItem,
	ApproveResult,
	PaginatedResponse,
} from '@/types/ghost-account';

export const ghostAccount = {
	getStats: async () => {
		return adminGet<GhostAccountStats>('/admin/v1/ghost-accounts/stats');
	},

	getPool: async (params: { status?: GhostAccountStatus; page?: number; limit?: number }) => {
		const stringParams: Record<string, string> = {};
		if (params.status != null) stringParams.status = params.status;
		if (params.page != null) stringParams.page = String(params.page);
		if (params.limit != null) stringParams.limit = String(params.limit);
		return adminGet<PaginatedResponse<GhostAccount>>('/admin/v1/ghost-accounts', stringParams);
	},

	updateStatus: async (id: string, status: GhostAccountStatus) => {
		return adminPatch<{ success: boolean }>(`/admin/v1/ghost-accounts/${id}`, { status });
	},

	getEligibleSources: async (params: { page?: number; limit?: number }) => {
		const stringParams: Record<string, string> = {};
		if (params.page != null) stringParams.page = String(params.page);
		if (params.limit != null) stringParams.limit = String(params.limit);
		return adminGet<PaginatedResponse<EligibleSource>>('/admin/v1/ghost-accounts/eligible-sources', stringParams);
	},

	create: async (originalUserId: string) => {
		return adminPost<GhostAccount>('/admin/v1/ghost-accounts', { originalUserId });
	},

	getCandidates: async (params: { page?: number; limit?: number }) => {
		const stringParams: Record<string, string> = {};
		if (params.page != null) stringParams.page = String(params.page);
		if (params.limit != null) stringParams.limit = String(params.limit);
		return adminGet<PaginatedResponse<CandidateListItem>>('/admin/v1/ghost-accounts/candidates', stringParams);
	},

	approveCandidates: async (candidateIds: string[]) => {
		return adminPost<ApproveResult>('/admin/v1/ghost-accounts/candidates/approve', { candidateIds });
	},

	cancelCandidates: async (candidateIds: string[]) => {
		return adminPost<{ cancelled: number }>('/admin/v1/ghost-accounts/candidates/cancel', { candidateIds });
	},
};
