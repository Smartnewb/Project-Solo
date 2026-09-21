import { adminGet, adminPost } from '@/shared/lib/http/admin-fetch';
import type {
	CurationCandidate,
	DeactivateReferenceBody,
	GenerateCurationBatchBody,
	GhostReferenceImage,
	GhostReferencePoolStats,
	ListReferencePoolQuery,
	ListReferencePoolResponse,
	PromoteCurationBody,
	PromoteFromGhostBody,
	PromoteFromGhostResult,
	PromoteFromUserBody,
	PromoteFromUserResult,
	RealUserListQuery,
	RealUserListResponse,
} from '@/app/types/ghost-injection';

const BASE = '/admin/ghost-injection/reference-pool';

export const ghostReferencePool = {
	generateCurationBatch: (body: GenerateCurationBatchBody) =>
		adminPost<CurationCandidate[]>(`${BASE}/curation-batch`, body),

	promote: (body: PromoteCurationBody) =>
		adminPost<GhostReferenceImage[]>(`${BASE}/promote`, body),

	promoteFromGhost: (body: PromoteFromGhostBody) =>
		adminPost<PromoteFromGhostResult>(`${BASE}/promote-from-ghost`, body),

	promoteFromUser: (body: PromoteFromUserBody) =>
		adminPost<PromoteFromUserResult>(`${BASE}/promote-from-user`, body),

	listRealUsers: (query: RealUserListQuery = {}) =>
		adminGet<RealUserListResponse>(`${BASE}/real-users`, { ...query }),

	deactivate: (id: string, body: DeactivateReferenceBody) =>
		adminPost<void>(`${BASE}/${id}/deactivate`, body),

	list: (query: ListReferencePoolQuery = {}) =>
		adminGet<ListReferencePoolResponse>(BASE, { ...query }),

	getStats: () => adminGet<GhostReferencePoolStats>(`${BASE}/stats`),
};

export type GhostReferencePoolService = typeof ghostReferencePool;
