// Ghost Injection 어드민 API 타입
// BE 원본: solo-nestjs-api/src/ghost-injection/dto/admin-query.dto.ts
// 변경 시 BE DTO와 동기화 필요.

export type GhostAccountStatus = 'ACTIVE' | 'INACTIVE';
export type GhostCandidateStatus = 'PENDING' | 'QUEUED' | 'CANCELED' | 'SENT';
export type GhostPhaseBucket = 'TREATMENT' | 'CONTROL';
export type GhostTargetStatus = 'ACTIVE' | 'INACTIVE';

// ─── Common refs ─────────────────────────────────────────

export interface GhostArchetypeRef {
	id: string;
	name: string;
}

export interface GhostUniversityRef {
	id: string;
	name: string;
}

export interface GhostDepartmentRef {
	id: string;
	name: string;
}

// ─── Ghost list/detail ────────────────────────────────────

export interface GhostListItem {
	ghostAccountId: string;
	ghostUserId: string;
	name: string;
	age: number;
	mbti: string | null;
	gender: 'FEMALE';
	status: GhostAccountStatus;
	isExhausted: boolean;
	archetype: GhostArchetypeRef | null;
	university: GhostUniversityRef | null;
	department: GhostDepartmentRef | null;
	primaryPhotoUrl: string | null;
	photoCount: number;
	createdAt: string;
	updatedAt: string;
}

export interface GhostAuditEventItem {
	id: string;
	actionName: string;
	actor: string | null;
	reason: string | null;
	createdAt: string;
	payload?: Record<string, unknown>;
}

export interface GhostExposureStats {
	totalShown: number;
	totalAccepted: number;
	totalReported: number;
	lastShownAt: string | null;
}

export interface GhostPhotoItem {
	slotIndex: number;
	imageId: string;
	url: string;
}

export interface GhostDetail extends GhostListItem {
	introduction: string | null;
	photos: GhostPhotoItem[];
	exposureStats: GhostExposureStats;
	recentAuditEvents: GhostAuditEventItem[];
}

// ─── Candidate ────────────────────────────────────────────

export interface CandidateTargetUser {
	id: string;
	name: string;
	schoolName: string | null;
}

export interface CandidateGhostRef {
	id: string;
	name: string | null;
	primaryPhotoUrl: string | null;
}

export interface CandidateListItem {
	candidateId: string;
	status: GhostCandidateStatus;
	weekYear: string;
	targetUser: CandidateTargetUser;
	ghost: CandidateGhostRef;
	createdAt: string;
	scheduledAt: string | null;
	sentAt: string | null;
}

// ─── Phase-School / Blacklist / Archetype ────────────────

export interface PhaseSchoolItem {
	schoolId: string;
	schoolName: string;
	bucket: GhostPhaseBucket;
	phase: number;
	assignedGhostCount: number;
	updatedAt: string;
}

export interface BlacklistEntryItem {
	schoolId: string;
	schoolName: string;
	reason: string;
	addedBy: string | null;
	addedAt: string;
}

export interface ArchetypeTraits {
	ageRange: { min: number; max: number };
	mbtiPool: string[];
	keywordPool: string[];
}

export interface ArchetypeListItem {
	archetypeId: string;
	name: string;
	description: string | null;
	traits: ArchetypeTraits;
	activeGhostCount: number;
	createdAt: string;
	updatedAt: string;
}

export interface ArchetypeFields {
	name: string;
	description?: string;
	traits: ArchetypeTraits;
}

// ─── Status summary ──────────────────────────────────────

export interface GhostInjectionStatus {
	featureFlag: {
		value: boolean;
		updatedAt: string | null;
		updatedBy: string | null;
	};
	ltvCap: {
		value: number;
		effectiveAt: string | null;
	};
	cooldown: {
		cooldownCount: number;
	};
	currentMetrics: {
		activeGhostCount: number;
		currentInjectionRate: number;
		thisWeekCandidatesGenerated: number;
		thisWeekCandidatesApproved: number;
		thisWeekCandidatesSent: number;
	};
}

// ─── Query params ────────────────────────────────────────

export interface GhostListQuery {
	status?: GhostAccountStatus;
	schoolId?: string;
	archetypeId?: string;
	q?: string;
	page?: number;
	limit?: number;
	sort?: 'createdAt' | 'updatedAt';
	order?: 'asc' | 'desc';
}

export interface CandidateListQuery {
	status?: GhostCandidateStatus;
	weekYear?: string;
	page?: number;
	limit?: number;
	sort?: 'createdAt' | 'updatedAt';
	order?: 'asc' | 'desc';
}

export interface PhaseSchoolListQuery {
	bucket?: GhostPhaseBucket;
	phase?: number;
	q?: string;
}

// ─── Generic paginated response ──────────────────────────

export interface GhostInjectionPaginated<T> {
	items: T[];
	total: number;
	page: number;
	limit: number;
}

// ─── Mutation bodies ─────────────────────────────────────

export interface CreateGhostBody {
	personaArchetypeId: string;
	phaseSchoolIds: string[];
	universityId: string;
	departmentId: string;
	reason: string;
}

export interface UpdateGhostFields {
	name?: string;
	age?: number;
	mbti?: string;
	introduction?: string;
}

export interface UpdateGhostBody {
	fieldsToUpdate: UpdateGhostFields;
	reason: string;
}

export interface ReplaceGhostPhotoBody {
	newImageId: string;
	reason: string;
}

export interface ToggleGhostStatusBody {
	targetStatus: GhostTargetStatus;
	reason: string;
}

export interface BulkInactivateBody {
	reason: string;
}

export interface SetLtvCapBody {
	newCap: number;
	reason: string;
	effectiveAt?: string;
}

export interface SetCooldownBody {
	cooldownCount: number;
	reason: string;
}

export interface SetFeatureFlagBody {
	value: boolean;
	reason: string;
}

export interface RollbackBody {
	reason: string;
}

export interface GenerateWeeklyBody {
	weekYear: string;
	dryRun?: boolean;
	reason: string;
}

export interface GenerateWeeklyResult {
	count: number;
	dryRun: boolean;
}

export interface CandidateActionBody {
	candidateIds: string[];
	reason: string;
}

export interface AddBlacklistBody {
	schoolId: string;
	schoolName: string;
	reason: string;
}

export interface RemoveBlacklistBody {
	reason: string;
}

export interface SetPhaseSchoolBody {
	schoolName: string;
	bucket: GhostPhaseBucket;
	phase: number;
	reason: string;
}

export interface UpsertArchetypeBody {
	archetypeFields: ArchetypeFields;
	reason: string;
}
