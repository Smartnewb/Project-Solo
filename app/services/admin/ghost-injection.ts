import {
	adminDelete,
	adminGet,
	adminPatch,
	adminPost,
	adminPut,
} from '@/shared/lib/http/admin-fetch';
import type {
	AddBlacklistBody,
	ArchetypeListItem,
	BlacklistEntryItem,
	BulkInactivateBody,
	CandidateActionBody,
	CandidateListItem,
	CandidateListQuery,
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
	UpsertArchetypeBody,
} from '@/app/types/ghost-injection';

const BASE = '/admin/ghost-injection';

function toQueryString(
	params: Record<string, string | number | boolean | undefined | null>,
): Record<string, string> {
	const result: Record<string, string> = {};
	for (const [key, value] of Object.entries(params)) {
		if (value === undefined || value === null || value === '') continue;
		result[key] = String(value);
	}
	return result;
}

export const ghostInjection = {
	// ─── Queries (G1–G7) ───────────────────────────────────
	listGhosts: (query: GhostListQuery = {}) =>
		adminGet<GhostInjectionPaginated<GhostListItem>>(
			`${BASE}/ghosts`,
			toQueryString({ ...query }),
		),

	getGhost: (ghostAccountId: string) =>
		adminGet<GhostDetail>(`${BASE}/ghosts/${ghostAccountId}`),

	listCandidates: (query: CandidateListQuery = {}) =>
		adminGet<GhostInjectionPaginated<CandidateListItem>>(
			`${BASE}/candidates`,
			toQueryString({ ...query }),
		),

	listPhaseSchools: (query: PhaseSchoolListQuery = {}) =>
		adminGet<{ items: PhaseSchoolItem[] }>(
			`${BASE}/phase-schools`,
			toQueryString({ ...query }),
		),

	listBlacklist: () =>
		adminGet<{ items: BlacklistEntryItem[] }>(`${BASE}/blacklist`),

	listArchetypes: () =>
		adminGet<{ items: ArchetypeListItem[] }>(`${BASE}/archetypes`),

	getStatus: () => adminGet<GhostInjectionStatus>(`${BASE}/status`),

	// ─── Ghost 관리 (A1–A5) ────────────────────────────────
	createGhost: (body: CreateGhostBody) => adminPost(`${BASE}/create`, body),

	updateGhost: (ghostAccountId: string, body: UpdateGhostBody) =>
		adminPatch(`${BASE}/${ghostAccountId}`, body),

	replaceGhostPhoto: (
		ghostAccountId: string,
		slotIndex: number,
		body: ReplaceGhostPhotoBody,
	) => adminPut(`${BASE}/${ghostAccountId}/photo/${slotIndex}`, body),

	toggleGhostStatus: (ghostAccountId: string, body: ToggleGhostStatusBody) =>
		adminPatch(`${BASE}/${ghostAccountId}/status`, body),

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

	// ─── 아키타입 (E3) ─────────────────────────────────────
	createArchetype: (body: UpsertArchetypeBody) =>
		adminPost(`${BASE}/archetypes`, body),

	updateArchetype: (archetypeId: string, body: UpsertArchetypeBody) =>
		adminPut(`${BASE}/archetypes/${archetypeId}`, body),
};

export type GhostInjectionService = typeof ghostInjection;
