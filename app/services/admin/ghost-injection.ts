import {
	adminDelete,
	adminGet,
	adminPatch,
	adminPost,
	adminPut,
} from '@/shared/lib/http/admin-fetch';
import type {
	AddBlacklistBody,
	BlacklistEntryItem,
	BulkInactivateBody,
	CandidateActionBody,
	CandidateListItem,
	CandidateListQuery,
	BatchCreateResult,
	CreateBatchGhostBody,
	CreateGhostBody,
	GenerateWeeklyBody,
	GenerateWeeklyResult,
	GhostDetail,
	GhostInjectionPaginated,
	GhostInjectionStatus,
	GhostListItem,
	GhostListQuery,
	PhaseSchoolItem,
	PhaseSchoolListQuery,
	RemoveBlacklistBody,
	ReplaceGhostPhotoBody,
	RollbackBody,
	SetCooldownBody,
	SetFeatureFlagBody,
	SetLtvCapBody,
	SetPhaseSchoolBody,
	ToggleGhostStatusBody,
	UpdateGhostBody,
	BackfillProfilesBody,
	BackfillProfilesResult,
	RegeneratePhotosBody,
	RegeneratePhotosResult,
} from '@/app/types/ghost-injection';

const BASE = '/admin/ghost-injection';

export const ghostInjection = {
	listGhosts: (query: GhostListQuery = {}) =>
		adminGet<GhostInjectionPaginated<GhostListItem>>(`${BASE}/ghosts`, { ...query }),

	getGhost: (ghostAccountId: string) =>
		adminGet<GhostDetail>(`${BASE}/ghosts/${ghostAccountId}`),

	listCandidates: (query: CandidateListQuery = {}) =>
		adminGet<GhostInjectionPaginated<CandidateListItem>>(
			`${BASE}/candidates`,
			{ ...query },
		),

	listPhaseSchools: (query: PhaseSchoolListQuery = {}) =>
		adminGet<{ items: PhaseSchoolItem[] }>(`${BASE}/phase-schools`, { ...query }),

	listBlacklist: () =>
		adminGet<{ items: BlacklistEntryItem[] }>(`${BASE}/blacklist`),

	getStatus: () => adminGet<GhostInjectionStatus>(`${BASE}/status`),

	// ─── Ghost 관리 (A1–A5) ────────────────────────────────
	createGhost: (body: CreateGhostBody) =>
		adminPost(`${BASE}/create`, body),

	createBatch: (body: CreateBatchGhostBody) =>
		adminPost<BatchCreateResult>(`${BASE}/create-batch`, body),

	updateGhost: (ghostAccountId: string, body: UpdateGhostBody) =>
		adminPatch(`${BASE}/${ghostAccountId}`, body),

	replaceGhostPhoto: (
		ghostAccountId: string,
		slotIndex: number,
		body: ReplaceGhostPhotoBody,
	) => adminPut(`${BASE}/${ghostAccountId}/photo/${slotIndex}`, body),

	regeneratePhotos: (ghostAccountId: string, body: RegeneratePhotosBody) =>
		adminPost<RegeneratePhotosResult>(`${BASE}/${ghostAccountId}/regenerate-photos`, body),

	toggleGhostStatus: (ghostAccountId: string, body: ToggleGhostStatusBody) =>
		adminPatch(`${BASE}/${ghostAccountId}/status`, body),

	deleteGhost: (ghostAccountId: string, body: { reason: string }) =>
		adminDelete(`${BASE}/ghosts/${ghostAccountId}`, body),

	bulkInactivateSchool: (schoolId: string, body: BulkInactivateBody) =>
		adminPost(`${BASE}/bulk-inactivate/school/${schoolId}`, body),

	// ─── 정책 (B1, B2, C2) ─────────────────────────────────
	setLtvCap: (body: SetLtvCapBody) => adminPut(`${BASE}/ltv-cap`, body),

	setCooldown: (body: SetCooldownBody) => adminPut(`${BASE}/cooldown-policy`, body),

	setFeatureFlag: (body: SetFeatureFlagBody) => adminPut(`${BASE}/feature-flag`, body),

	// ─── 비상 롤백 (C1) ────────────────────────────────────
	rollback: (body: RollbackBody) => adminPost(`${BASE}/rollback`, body),

	// ─── 후보 (D1–D3) ──────────────────────────────────────
	generateWeekly: (body: GenerateWeeklyBody) =>
		adminPost<GenerateWeeklyResult>(`${BASE}/candidates/generate-weekly`, body),

	approveCandidates: (body: CandidateActionBody) =>
		adminPost(`${BASE}/candidates/approve`, body),

	cancelCandidates: (body: CandidateActionBody) =>
		adminPost(`${BASE}/candidates/cancel`, body),

	// ─── 학교 (E1, E2, E4) ─────────────────────────────────
	addBlacklist: (body: AddBlacklistBody) => adminPost(`${BASE}/blacklist`, body),

	removeBlacklist: (schoolId: string, body: RemoveBlacklistBody) =>
		adminDelete(`${BASE}/blacklist/${schoolId}`, body),

	setPhaseSchool: (schoolId: string, body: SetPhaseSchoolBody) =>
		adminPut(`${BASE}/phase-schools/${schoolId}`, body),

	// ─── 백필 ──────────────────────────────────────────────
	backfillProfiles: (body: BackfillProfilesBody) =>
		adminPost<BackfillProfilesResult>(`${BASE}/backfill-profiles`, body),
};

export type GhostInjectionService = typeof ghostInjection;
