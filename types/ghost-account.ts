export type GhostAccountStatus = 'ACTIVE' | 'INACTIVE' | 'EXHAUSTED';
export type GhostCandidateStatus = 'PENDING' | 'QUEUED' | 'SENT' | 'CANCELLED';

export interface GhostProfileSnapshot {
	name: string;
	age: number;
	gender: string;
	mbti: string | null;
	introduction: string | null;
	keywords: string[];
	rank: string | null;
	introductionData: unknown | null;
}

export interface GhostAccount {
	id: string;
	ghostUserId: string;
	originalUserId: string;
	originalPhoneHash: string | null;
	profileSnapshot: GhostProfileSnapshot;
	status: GhostAccountStatus;
	deactivationReason: string | null;
	activatedAt: string;
	deactivatedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface GhostAccountPaginatedMeta {
	currentPage: number;
	itemsPerPage: number;
	totalItems: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

export interface EligibleSource {
	userId: string;
	name: string;
	age: number;
	rank: string;
	mbti: string | null;
	introduction: string | null;
	deletedAt: string;
	imageCount: number;
	imageUrls: string[];
	daysSinceDeleted: number;
}

export interface GhostLikeCandidate {
	id: string;
	ghostAccountId: string;
	targetUserId: string;
	status: GhostCandidateStatus;
	weekYear: string;
	scheduledAt: string | null;
	sentAt: string | null;
	matchLikeId: string | null;
	adminApprovedBy: string | null;
	adminApprovedAt: string | null;
	createdAt: string;
}

export interface CandidateListItem {
	candidate: GhostLikeCandidate;
	ghostAccountStatus: GhostAccountStatus;
	targetUserName: string;
}

export interface GhostAccountStats {
	pool: Record<GhostAccountStatus, number>;
}

export interface ApproveResult {
	total: number;
	scheduled: number;
	failed: number;
	details: { candidateId: string; scheduled: boolean; reason?: string }[];
}

export interface PaginatedResponse<T> {
	items: T[];
	meta: GhostAccountPaginatedMeta;
}
