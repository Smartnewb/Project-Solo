// Ghost Injection 어드민 API 타입
// BE 원본: solo-nestjs-api/src/ghost-injection/dto/admin-query.dto.ts
// 변경 시 BE DTO와 동기화 필요.

export type GhostAccountStatus = 'ACTIVE' | 'INACTIVE';
export type GhostCandidateStatus = 'PENDING' | 'QUEUED' | 'CANCELED' | 'SENT';
export type GhostPhaseBucket = 'TREATMENT' | 'CONTROL';
export type GhostTargetStatus = 'ACTIVE' | 'INACTIVE';
export type ImageVendor = 'grok' | 'seedream' | 'openai';
export type AgeBucket = '20-22' | '23-25' | '26-28';

// ─── Common refs ─────────────────────────────────────────

export interface GhostUniversityRef {
	id: string;
	name: string;
}

export interface GhostDepartmentRef {
	id: string;
	name: string;
}

// ─── Ghost list/detail ────────────────────────────────────

export type GhostRank = 'A' | 'B' | 'C';

export interface GhostListItem {
	ghostAccountId: string;
	ghostUserId: string;
	name: string;
	age: number;
	mbti: string | null;
	gender: 'FEMALE';
	rank: GhostRank;
	status: GhostAccountStatus;
	isExhausted: boolean;
	university: GhostUniversityRef | null;
	department: GhostDepartmentRef | null;
	primaryPhotoUrl: string | null;
	photoCount: number;
	/** 임포트 모달용 — BE가 ?include=photos 시 채움 */
	photoUrls?: string[];
	/** 임포트 모달용 — 이미 풀에 임포트된 사진 URL 집합 */
	importedPhotoUrls?: string[];
	lastExposedAt: string | null;
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
	/** BE profileSnapshot.introductionData.metadata.source — 'ai' | 'template' | null */
	introductionSource?: 'ai' | 'template' | null;
	/** 프로필 생성 시 선택된 키워드 */
	keywords?: string[] | null;
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

// ─── Phase-School / Blacklist ────────────────────────────

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
	q?: string;
	page?: number;
	limit?: number;
	sort?: 'createdAt' | 'updatedAt' | 'rank';
	order?: 'asc' | 'desc';
	rank?: GhostRank[];
	ageBucket?: AgeBucket;
	minPhotoCount?: number;
	maxPhotoCount?: number;
	excludeAlreadyImported?: boolean;
	/** photoUrls/importedPhotoUrls 응답 포함 여부 */
	includePhotos?: boolean;
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

export interface GhostInjectionPaginationMeta {
	currentPage: number;
	itemsPerPage: number;
	totalItems: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

export interface GhostInjectionPaginated<T> {
	items: T[];
	meta: GhostInjectionPaginationMeta;
}

// ─── Mutation bodies ─────────────────────────────────────

export interface CreateGhostBody {
	reason: string;
	vendor?: ImageVendor;
}

export interface CreateBatchGhostBody {
	count: number;
	reason: string;
	vendor?: ImageVendor;
}

export interface BatchCreateResultItem {
	ghostAccountId: string | null;
	name: string;
	age: number;
	mbti: string;
	rank: UserRank;
	introduction: string | null;
	university: { id: string; name: string } | null;
	department: { id: string; name: string } | null;
	photoUrls: string[];
	status: 'success' | 'failed';
	error?: string;
}

export interface BatchCreateResult {
	total: number;
	success: number;
	failed: number;
	vendor: ImageVendor;
	results: BatchCreateResultItem[];
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

export interface RemoveGhostPhotoBody {
	reason: string;
}

export interface RegeneratePhotosBody {
	prompt?: string;
	referencePhotoUrls?: string[];
	reason: string;
	vendor?: ImageVendor;
}

export interface RegeneratePhotosResult {
	ghostAccountId: string;
	photos: GhostPhotoItem[];
}

export interface RegenerateSingleSlotBody {
	prompt?: string;
	referencePhotoUrls?: string[];
	vendor?: ImageVendor;
	reason: string;
}

export interface RegenerateSingleSlotResponse {
	ghostAccountId: string;
	slotIndex: number;
	imageId: string;
	url: string;
}

export interface PromptPreviewQuery {
	age?: number;
	vendor?: ImageVendor;
	count?: number;
	mode?: 'random' | 'pool';
}

export interface PromptPreviewResponse {
	vendor: ImageVendor;
	negativePrompt: string;
	variants: string[];
	note: string;
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

// ─── Reference Pool ──────────────────────────────────────

export interface GhostReferenceImageTags {
	mood?: string;
	setting?: string;
	style?: string;
}

export interface GhostReferenceImageSourceMeta {
	vendor: string;
	model: string;
	prompt: string;
	jobId?: string;
}

export interface GhostReferenceImage {
	id: string;
	s3Key: string;
	s3Url: string;
	ageBucket: AgeBucket;
	isActive: boolean;
	usageCount: number;
	lastUsedAt: string | null;
	curatedBy: string;
	curatedAt: string;
	tags: GhostReferenceImageTags | null;
	sourceMeta: GhostReferenceImageSourceMeta | null;
	sourceGhostAccountId: string | null;
	sourceUserId: string | null;
	sourcePhotoUrl: string | null;
	createdAt: string;
	updatedAt: string | null;
	deletedAt: string | null;
}

export interface CurationCandidate {
	s3Key: string;
	s3Url: string;
	prompt: string;
	vendor: string;
	model: string;
	ageBucket: AgeBucket;
}

export interface GenerateCurationBatchBody {
	count?: number;
	ageBucket?: AgeBucket;
	vendor?: ImageVendor;
	reason: string;
}

export interface PromoteCurationSelection {
	s3Key: string;
	s3Url: string;
	ageBucket: AgeBucket;
	tags?: GhostReferenceImageTags;
	sourceMeta: GhostReferenceImageSourceMeta;
}

export interface PromoteCurationBody {
	selections: PromoteCurationSelection[];
	reason: string;
}

export interface DeactivateReferenceBody {
	reason: string;
}

export interface ListReferencePoolQuery {
	isActive?: boolean;
	ageBucket?: AgeBucket;
	limit?: number;
	offset?: number;
}

export interface ListReferencePoolResponse {
	items: GhostReferenceImage[];
	total: number;
}

export interface GhostReferencePoolStats {
	total: number;
	active: number;
	avgUsage: number;
	last24hUsage: number;
	minThresholdBreach: boolean;
}

export interface PromoteFromGhostSelection {
	ghostAccountId: string;
	photoUrl: string;
	tags?: GhostReferenceImageTags;
}

export interface PromoteFromGhostBody {
	selections: PromoteFromGhostSelection[];
	reason: string;
}

export interface PromoteFromGhostSkipped {
	ghostAccountId: string;
	photoUrl: string;
	reason: 'duplicate' | 'age-out-of-range' | 'photo-not-found' | 'ghost-not-found' | string;
}

export interface PromoteFromGhostResult {
	imported: GhostReferenceImage[];
	skipped: PromoteFromGhostSkipped[];
}

// ─── Real User Import (F5) ──────────────────────────────

export type UserRank = 'S' | 'A' | 'B' | 'C' | 'UNKNOWN';

export interface RealUserPhotoItem {
	imageId: string;
	s3Url: string;
	slotIndex: number;
	isMain: boolean;
}

export interface RealUserListItem {
	userId: string;
	name: string;
	age: number;
	rank: UserRank;
	photoCount: number;
	photos: RealUserPhotoItem[];
	importedPhotoUrls: string[];
}

export interface PaginationMeta {
	currentPage: number;
	itemsPerPage: number;
	totalItems: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

export interface RealUserListResponse {
	items: RealUserListItem[];
	meta: PaginationMeta;
}

export interface RealUserListQuery {
	rank?: UserRank[];
	ageBucket?: AgeBucket;
	page?: number;
	limit?: number;
	excludeAlreadyImported?: boolean;
}

export interface PromoteFromUserSelection {
	userId: string;
	photoUrl: string;
	tags?: GhostReferenceImageTags;
}

export interface PromoteFromUserBody {
	selections: PromoteFromUserSelection[];
	reason: string;
}

export interface PromoteFromUserSkipped {
	userId: string;
	photoUrl: string;
	reason: 'duplicate' | 'age-out-of-range' | 'photo-not-found' | 'user-not-found' | 'copy-failed' | string;
}

export interface PromoteFromUserResult {
	imported: GhostReferenceImage[];
	skipped: PromoteFromUserSkipped[];
}

// ─── Backfill ───────────────────────────────────────────

export interface BackfillProfilesBody {
	reason: string;
}

export interface BackfillProfilesResult {
	totalFound: number;
	updated: number;
	failed: number;
	details: Array<{
		ghostAccountId: string;
		ghostUserId: string;
		status: 'updated' | 'failed';
		error?: string;
	}>;
}

// ─── Batch preview (sequential prompt flow) ──────────────

export interface BatchPreviewSlotPrompt {
	slotIndex: 0 | 1 | 2;
	prompt: string;
	negativePrompt?: string;
	referenceUrls?: string[];
	generationContext: {
		personaDescriptor: string;
		sceneDescriptor: string;
		priorSlotSummaries: string[];
	};
}

export interface BatchPreviewItem {
	itemId: string;
	profile: {
		name: string;
		age: number;
		mbti: string;
		rank: UserRank;
		introduction: string;
		keywords: string[];
	};
	university: { id: string; name: string };
	department: { id: string; name: string };
	archetype: { id: string | null; name: string | null; traits: string[] };
	slotPrompts: BatchPreviewSlotPrompt[];
}

export interface BatchPreviewRoot {
	previewId: string;
	actorUserId: string;
	schemaContext: 'kr' | 'jp';
	vendor: ImageVendor;
	count: number;
	createdAt: string;
	expiresAt: string;
	items: Record<string, BatchPreviewItem>;
	uploadedPhotos?: UploadedPhotoMatch[];
}

export interface CreateBatchPreviewBody {
	count: number;
	ageHint?: { min: number; max: number };
	dryRun?: boolean;
	imageSource?: ImageSource;
	vendor?: ImageVendor;
	referenceMatches?: ReferenceMatch[];
	uploadedPhotos?: UploadedPhotoMatch[];
}

export type PatchBatchPreviewItemBody =
	| {
			action: 'edit';
			slotPrompts: Array<{
				slotIndex: 0 | 1 | 2;
				prompt: string;
				negativePrompt?: string;
			}>;
	  }
	| { action: 'regenerate'; preserveProfile?: boolean }
	| {
			action: 'replace-photo';
			slotIndex: 0 | 1 | 2;
			newPhotoId?: string;
			newS3Url?: string;
	  };

export interface ConfirmBatchPreviewBody {
	itemIds: string[];
	reason: string;
	concurrency?: number;
}

// ─── Reference-Pool Attach (Option C) ────────────────────

export type ImageSource = 'generate' | 'reference-pool' | 'manual-upload';

export interface ReferenceMatch {
	itemIndex: number;
	photoIds: [string, string, string];
}

export interface UploadedPhotoMatch {
	itemIndex: number;
	s3Urls: [string, string, string];
}

export interface UploadedPhotoResult {
	s3Url: string;
	filename: string;
	sizeBytes: number;
}

export interface UploadPhotosResponse {
	uploads: UploadedPhotoResult[];
}

export interface ReferencePoolFacetEntry {
	value: string;
	count: number;
}

export interface ReferencePoolFacets {
	ageBuckets: ReferencePoolFacetEntry[];
	moods: ReferencePoolFacetEntry[];
	settings: ReferencePoolFacetEntry[];
	styles: ReferencePoolFacetEntry[];
}

export interface ReferencePhotoListItem {
	id: string;
	s3Url: string;
	thumbnailUrl: string;
	ageBucket: AgeBucket;
	tags: GhostReferenceImageTags | null;
	usageCount: number;
	lockedBy: { adminId: string; until: string } | null;
	source: 'ghost' | 'user' | 'generated' | 'unknown';
}

export interface ListReferencePhotosQuery {
	ageBucket?: AgeBucket;
	isActive?: boolean;
	tagMood?: string;
	tagSetting?: string;
	tagStyle?: string;
	excludeIds?: string[];
	sortBy?: 'usage_asc' | 'curated_desc';
	limit?: number;
	cursor?: string;
}

export interface ListReferencePhotosResponse {
	items: ReferencePhotoListItem[];
	meta: {
		totalItems: number;
		hasNext: boolean;
		nextCursor: string | null;
	};
	facets: ReferencePoolFacets;
}

export interface AutoMatchReferenceBody {
	count: number;
	ageBucket?: AgeBucket;
	tagFilter?: { mood?: string; setting?: string; style?: string };
	excludePhotoIds?: string[];
	cohesion?: 'strict' | 'loose';
	targetSlots?: number[];
}

export interface AutoMatchReferenceResponse {
	matches: ReferenceMatch[];
	warnings: string[];
}

// ─── Ghost Profile Preview ──────────────────────────────

export interface GhostProfileImage {
	id: string;
	order: number;
	slotIndex: number;
	isMain: boolean;
	url: string;
	imageUrl?: string;
	thumbnailUrl?: string;
	reviewStatus?: string;
}

export interface GhostUniversityDetail {
	name: string | null;
	authentication: boolean;
	department: string | null;
	grade: string | null;
	studentNumber: string | null;
	code: string | null;
	region: string | null;
	isVerified?: boolean;
}

export interface GhostPreferenceOption {
	id: string;
	displayName: string;
	imageUrl?: string | null;
	key?: string;
}

export interface GhostPreferenceTypeGroup {
	typeName: string;
	typeKey?: string;
	selectedOptions: GhostPreferenceOption[];
}

export interface GhostProfilePreviewResponse {
	id: string;
	name: string;
	age: number;
	gender: 'MALE' | 'FEMALE';
	mbti: string | null;
	rank: GhostRank | null;
	profileImages: GhostProfileImage[];
	universityDetails: GhostUniversityDetail | null;
	preferences: GhostPreferenceTypeGroup[];
	characteristics: GhostPreferenceTypeGroup[];
	additionalPreferences: { goodMbti: string; badMbti: string } | null;
	introductions: string[];
	introduction: string | null;
	keywords: string[] | null;
	idealTypeResult: { name: string; tags: string[] } | null;
	updatedAt: string | null;
	deletedAt: string | null;
	// 미리보기 전용 — 항상 null/false/0
	connectionId: null;
	matchScore: null;
	v4Compatibility: null;
	matchLikeId: null;
	isLikeSended: 0;
	isFirstView: false;
	canLetter: false;
	skippedPhotoCount: 0;
	external: null;
}

// ─── User Ghost Exposure ─────────────────────────────────

export type UserGhostExposurePath =
	| 'v4_fallback'
	| 'proactive_fill'
	| 'scheduled_fill'
	| 'like_cron';

export type UserGhostExposureActionType = 'GHOST_EXPOSED' | 'GHOST_ACCEPTED';

export interface UserGhostExposureQuery {
	path?: UserGhostExposurePath;
	actionType?: UserGhostExposureActionType;
	from?: string;
	to?: string;
	page?: number;
	limit?: number;
}

export interface UserGhostExposureSummary {
	totalExposures: number;
	totalAccepted: number;
	lastExposedAt: string | null;
	byPath: Record<UserGhostExposurePath, number>;
}

export interface UserGhostExposureItem {
	id: string;
	actionType: UserGhostExposureActionType;
	ghostAccountId: string;
	ghostName: string;
	ghostPrimaryPhotoUrl: string | null;
	path: UserGhostExposurePath | null;
	schoolId: string | null;
	connectionId: string | null;
	createdAt: string;
}

export interface UserGhostExposureResponse {
	userId: string;
	summary: UserGhostExposureSummary;
	items: UserGhostExposureItem[];
	page: number;
	limit: number;
	total: number;
}

// ─── Ghost Exposure (Ghost 기준) ──────────────────────

export interface GhostExposureQuery {
	path?: UserGhostExposurePath;
	actionType?: UserGhostExposureActionType;
	from?: string;
	to?: string;
	page?: number;
	limit?: number;
}

export interface GhostExposureItem {
	id: string;
	actionType: UserGhostExposureActionType;
	userId: string;
	userName: string | null;
	userPhotoUrl: string | null;
	path: UserGhostExposurePath | null;
	schoolId: string | null;
	connectionId: string | null;
	createdAt: string;
}

export interface GhostExposureResponse {
	ghostAccountId: string;
	summary: UserGhostExposureSummary;
	items: GhostExposureItem[];
	page: number;
	limit: number;
	total: number;
}
