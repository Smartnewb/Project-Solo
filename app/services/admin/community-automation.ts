import { adminGet, adminPost, adminPut, adminPatch, adminDelete } from '@/shared/lib/http/admin-fetch';
import type { GhostCommentBody, GhostCommentResult, GhostLikeBody, GhostLikeResult } from '@/app/services/community';

const BASE = '/admin/v2/community-automation';

// ==================== Types ====================

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'archived';
export type DagTemplateId = 'post' | 'auto_comment' | 'target_comment' | 'reply';

interface CommunityCategoryResponse {
	id?: string;
	code: string;
	displayName: string;
}

export enum CommunityAutomationCategory {
	NOTICE = 'notice',
	GENERAL = 'general',
	REVIEW = 'review',
	LOVE_CONCERNS = 'love-concerns',
}

export interface CommunityAutomationCategoryOption {
	id?: string;
	value: CommunityAutomationCategory;
	label: string;
}

export const COMMUNITY_AUTOMATION_CATEGORY_OPTIONS: CommunityAutomationCategoryOption[] = [
	{ value: CommunityAutomationCategory.NOTICE, label: '공지' },
	{ value: CommunityAutomationCategory.GENERAL, label: '실시간' },
	{ value: CommunityAutomationCategory.REVIEW, label: '리뷰' },
	{ value: CommunityAutomationCategory.LOVE_CONCERNS, label: '연애상담' },
] as const satisfies CommunityAutomationCategoryOption[];

export function isCommunityAutomationCategory(value: string): value is CommunityAutomationCategory {
	return (Object.values(CommunityAutomationCategory) as string[]).includes(value);
}

export function getCommunityAutomationCategoryLabel(
	category: string,
	options: CommunityAutomationCategoryOption[] = COMMUNITY_AUTOMATION_CATEGORY_OPTIONS,
): string {
	return options.find((option) => option.value === category)?.label
		?? COMMUNITY_AUTOMATION_CATEGORY_OPTIONS.find((option) => option.value === category)?.label
		?? category;
}

function normalizeCommunityCategoryOptions(categories: CommunityCategoryResponse[]): CommunityAutomationCategoryOption[] {
	const order = new Map(COMMUNITY_AUTOMATION_CATEGORY_OPTIONS.map((option, index) => [option.value, index]));
	const options: CommunityAutomationCategoryOption[] = categories
		.filter((category) => isCommunityAutomationCategory(category.code))
		.map((category) => ({
			id: category.id,
			value: category.code as CommunityAutomationCategory,
			label: category.displayName,
		}));

	if (options.length === 0) return COMMUNITY_AUTOMATION_CATEGORY_OPTIONS;

	return options.sort((a, b) => (order.get(a.value) ?? 99) - (order.get(b.value) ?? 99));
}

export interface Campaign {
	id: string;
	name: string;
	category: CommunityAutomationCategory;
	status: CampaignStatus;
	startAt: string | null;
	endAt: string | null;
	dagTemplateId: string | null;
	timingParams: Record<string, unknown> | null;
	createdAt: string;
	updatedAt: string | null;
	createdBy: string | null;
}

export interface CreateCampaignBody {
	name: string;
	category: CommunityAutomationCategory;
	dagTemplateId?: DagTemplateId;
	startAt?: string;
	endAt?: string;
}

export interface ListCampaignsQuery {
	status?: CampaignStatus;
	from?: string;
	to?: string;
}

export interface TriggerDagRunBody {
	dagTemplateId?: DagTemplateId;
	count?: number;
}

export type ContentStatus =
	| 'draft'
	| 'pending_review'
	| 'approved'
	| 'scheduled'
	| 'published'
	| 'rejected'
	| 'quality_failed'
	| 'withdrawn';

export interface QualityScores {
	pii?: number;
	profanity?: number;
	[key: string]: number | undefined;
}

export interface Content {
	id: string;
	campaignId: string | null;
	dagRunId: string | null;
	ghostAccountId: string | null;
	articleId: string | null;
	commentId: string | null;
	targetType: 'POST' | 'COMMENT' | 'REPLY' | null;
	targetParentId: string | null;
	targetArticleId: string | null;
	targetCommentId: string | null;
	status: ContentStatus;
	generatedText: string | null;
	finalText: string | null;
	qualityScores: QualityScores | null;
	noiseSeed: number | null;
	scheduledAt: string | null;
	publishedAt: string | null;
	reviewActorId: string | null;
	reviewedAt: string | null;
	rejectionReason: string | null;
	createdAt: string;
	updatedAt: string | null;
}

export interface ActivityReferenceMeta {
	id: string;
	title: string;
	createdAt: string;
}

export interface CreateActivityBody {
	type: 'POST';
	instruction: string;
	category: string;
	regionCluster?: string;
	ghostAccountId?: string;
	referenceMode: 'auto' | 'manual';
	referenceArticleIds?: string[];
	referenceLimit?: number;
}

export interface CreateActivityResult {
	content: Content;
	references: ActivityReferenceMeta[];
	meta: {
		referenceMode: 'auto' | 'manual';
		referenceCount: number;
	};
}

export interface BulkApplyBody {
	contentIds: string[];
	action: 'approve' | 'reject' | 'withdraw';
	reason?: string;
}

export interface BulkApplyResult {
	succeeded: string[];
	failed: Array<{ id: string; error: string }>;
}

export interface ReviewScheduleResult {
	message: string;
	contentId: string;
	status: 'scheduled';
	scheduledAt: string;
	jobId: string;
}

export interface ContentStatusCount {
	status: ContentStatus;
	count: number;
}

export interface DailyStat {
	date: string;
	published: number;
	rejected: number;
	withdrawn: number;
}

export interface MetricsSummary {
	period: { from: string; to: string };
	schema: string;
	contentByStatus: ContentStatusCount[];
	totalPublished: number;
	totalRejected: number;
	totalWithdrawn: number;
	totalPendingReview: number;
	auditActionCounts: Record<string, number>;
	dailyStats: DailyStat[];
}

export interface QueueDepth {
	pending_review: number;
	scheduled: number;
	draft: number;
	quality_failed: number;
}

export type ReviewSourceType = 'APP_STORE' | 'PLAY_STORE' | 'YEONPICK';
export type ReviewSourceSafetyStatus = 'pending' | 'approved' | 'rejected';
export type ReviewSourceEmbeddingStatus = 'pending' | 'embedded' | 'failed';
export type ReviewPostJobStatus = 'draft' | 'scheduled' | 'published' | 'failed' | 'cancelled';

export interface ReviewSourceDocument {
	id: string;
	sourceType: ReviewSourceType;
	sourceId: string;
	country: 'KR' | 'JP';
	rating: number | null;
	title: string | null;
	body: string;
	authorMeta: Record<string, unknown>;
	sourceCreatedAt: string | null;
	qualityScore: number;
	safetyStatus: ReviewSourceSafetyStatus;
	embeddingStatus: ReviewSourceEmbeddingStatus;
	qdrantPointId: string | null;
	embeddingError: string | null;
	createdAt: string;
	updatedAt: string | null;
}

export interface ReviewSourceStat {
	sourceType: ReviewSourceType;
	safetyStatus: ReviewSourceSafetyStatus;
	embeddingStatus: ReviewSourceEmbeddingStatus;
	count: number;
}

export interface CommunityReviewPostJob {
	id: string;
	status: ReviewPostJobStatus;
	title: string;
	content: string;
	sourceDocumentIds: string[];
	ragContext: Array<Record<string, unknown>>;
	scheduledAt: string | null;
	publishedAt: string | null;
	publishedArticleId: string | null;
	createdBy: string;
	errorMessage: string | null;
	createdAt: string;
	updatedAt: string | null;
}

export interface CreateReviewPostJobBody {
	seedText: string;
	sourceTypes?: ReviewSourceType[];
	minRating?: number;
	scheduledAt: string;
}

export interface UpdateReviewPostJobBody {
	title: string;
	content: string;
}

export type ReactionSpeed = 'high' | 'mid' | 'low';
export type ActivityCurve = 'morning' | 'night' | 'random';

export interface CommunityTraits {
	reactionSpeed?: ReactionSpeed;
	noiseStrength?: number;
	activityCurve?: ActivityCurve;
}

export interface GhostPersonaInfo {
	id: string;
	ghostUserId: string;
	status: string;
	archetypeCode: string;
	archetypeName: string;
	communityTraits: CommunityTraits;
}

export interface ArchetypeDistribution {
	archetypeCode: string;
	count: number;
	percentage: number;
}

export interface PersonaDiversityReport {
	totalActiveGhosts: number;
	archetypeDistribution: ArchetypeDistribution[];
	activityCurveDistribution: Record<string, number>;
	diversityScore: number;
}

export interface CommunitySettings {
	dagRunEnabled: boolean;
	publishEnabled: boolean;
	activitySimulatorEnabled: boolean;
	maxDailyPublish: number;
	reviewRequiredBeforePublish: boolean;
}

export interface KillSwitchStatus {
	killed: boolean;
}

export type TargetPostAutomationStatus = 'none' | 'pending_review' | 'scheduled' | 'published' | 'withdrawn';
export type TargetPostOpsQueue = 'needs_comment' | 'warming_up' | 'risk' | 'neglected' | 'ghost_touched';

export interface TargetPostListQuery {
	page?: number;
	limit?: number;
	categoryId?: string;
	regionCluster?: string;
	automationStatus?: TargetPostAutomationStatus;
	opsQueue?: TargetPostOpsQueue;
	search?: string;
	sort?: 'createdAt' | 'commentCount' | 'likeCount' | 'readCount' | 'automationUpdatedAt' | 'urgencyScore';
	order?: 'asc' | 'desc';
}

export interface TargetPostSummary {
	id: string;
	title: string;
	content: string;
	categoryId: string;
	categoryName: string | null;
	authorId: string;
	authorName: string | null;
	authorRegion: string | null;
	authorRegionCluster: string | null;
	commentCount: number;
	likeCount: number;
	readCount: number;
	reportCount: number;
	isBlinded?: boolean;
	blindedAt?: string | null;
	latestComment: string | null;
	latestCommentAt: string | null;
	automationStatus: ContentStatus | null;
	automationCount: number;
	automationUpdatedAt: string | null;
	automationSummary?: {
		pendingReview: number;
		scheduled: number;
		published: number;
		failed: number;
		withdrawn: number;
	};
	opsQueues?: TargetPostOpsQueue[];
	primaryOpsQueue?: TargetPostOpsQueue | null;
	opsReason?: string | null;
	recommendedAction?: string | null;
	urgencyScore?: number;
	createdAt: string;
	updatedAt: string | null;
}

export interface TargetPostComment {
	id: string;
	articleId: string;
	parentId: string | null;
	authorId: string;
	authorName: string | null;
	content: string;
	createdAt: string;
}

export interface TargetPostGhostCandidate {
	id: string;
	ghostAccountId?: string;
	ghostUserId: string;
	name: string | null;
	region: string | null;
	regionCluster: string | null;
	recentCommentCount?: number;
	hasArticleComment?: boolean;
}

export type ScheduledCommentStatus = 'scheduled' | 'published' | 'quality_failed' | 'withdrawn';
export type ScheduledCommentHealthFlag = 'due_soon' | 'delayed' | 'revalidation_failed';

export interface ScheduledCommentTimelineItem {
	contentId: string;
	articleId: string;
	ghostAccountId: string | null;
	ghostName: string | null;
	ghostUserId: string | null;
	content: string;
	targetType?: 'COMMENT' | 'ARTICLE_LIKE' | 'COMMENT_LIKE';
	status: ScheduledCommentStatus;
	scheduledAt: string | null;
	publishedAt: string | null;
	commentId: string | null;
	rejectionReason: string | null;
	createdAt: string;
	updatedAt: string | null;
	healthFlags: ScheduledCommentHealthFlag[];
}

export interface ScheduledCommentTimelineResponse {
	items: ScheduledCommentTimelineItem[];
}

export type LiveCommentSuggestionTone = 'empathetic' | 'question' | 'mood_shift';

export interface LiveCommentSuggestion {
	tone: LiveCommentSuggestionTone;
	content: string;
	reason: string;
	quality: {
		verdict: 'pass' | 'weak' | 'fail';
		scores: {
			naturalness: number;
			relevance: number;
			operatorLikeRisk: number;
			safetyRisk: number;
		};
	};
}

export interface LiveCommentSuggestionResponse {
	suggestions: LiveCommentSuggestion[];
	meta?: {
		model: string;
		judgeModel: string;
		fewShotCount: number;
		regenerated: boolean;
		safetyNotes: string[];
	};
}

export interface TargetPostDetail {
	post: TargetPostSummary;
	comments: TargetPostComment[];
	automationHistory: Content[];
	ghostCandidates: TargetPostGhostCandidate[];
	ghostCandidateCount: number;
	defaults: {
		defaultRegionCluster: string | null;
		defaultPublishMode: 'review_queue';
	};
}

export interface TargetPostListResponse {
	items: TargetPostSummary[];
	total: number;
	page: number;
	limit: number;
	opsQueueCounts?: Record<TargetPostOpsQueue, number>;
}

export interface CreateLlmDraftBody {
	count?: number;
	tone?: string;
	instruction?: string;
	regionCluster?: string;
	ghostAccountId?: string;
	parentCommentId?: string;
}

export interface CreateManualCommentBody {
	text: string;
	regionCluster?: string;
	ghostAccountId?: string;
	parentCommentId?: string;
}

export interface TargetPostDraftResult {
	items?: Content[];
	item?: Content;
	ghostCandidateCount: number;
}

export interface PromoteTargetPostToHotBody {
	curatorComment?: string;
}

export interface PromoteTargetPostToHotResult {
	success: boolean;
	hotId: string;
	articleId: string;
	isPublic: boolean;
	publicAt: string | Date;
}

// ==================== Campaigns ====================

export const campaigns = {
	categoryOptions: async (): Promise<CommunityAutomationCategoryOption[]> => {
		const result = await adminGet<{ data: CommunityCategoryResponse[] | { categories: CommunityCategoryResponse[] } }>(
			'/admin/v2/community/categories',
		);
		const categories = Array.isArray(result.data) ? result.data : (result.data?.categories ?? []);
		return normalizeCommunityCategoryOptions(categories);
	},

	list: async (query?: ListCampaignsQuery): Promise<Campaign[]> => {
		const params: Record<string, string> = {};
		if (query?.status) params.status = query.status;
		if (query?.from) params.from = query.from;
		if (query?.to) params.to = query.to;
		const result = await adminGet<{ data: Campaign[] }>(`${BASE}/campaigns`, params);
		return result.data;
	},

	create: async (body: CreateCampaignBody): Promise<Campaign> => {
		const result = await adminPost<{ data: Campaign }>(`${BASE}/campaigns`, body);
		return result.data;
	},

	get: async (id: string): Promise<Campaign> => {
		const result = await adminGet<{ data: Campaign }>(`${BASE}/campaigns/${id}`);
		return result.data;
	},

	activate: async (id: string): Promise<void> => {
		await adminPatch(`${BASE}/campaigns/${id}/activate`);
	},

	pause: async (id: string): Promise<void> => {
		await adminPatch(`${BASE}/campaigns/${id}/pause`);
	},

	archive: async (id: string): Promise<void> => {
		await adminPatch(`${BASE}/campaigns/${id}/archive`);
	},

	triggerDagRun: async (id: string, body?: TriggerDagRunBody): Promise<{ jobsEnqueued: number }> => {
		const result = await adminPost<{ data: { jobsEnqueued: number } }>(`${BASE}/campaigns/${id}/dag-run`, body ?? {});
		return result.data;
	},
};

// ==================== Review Queue ====================

export const reviewQueue = {
	list: async (): Promise<Content[]> => {
		const result = await adminGet<{ data: Content[] }>(`${BASE}/review-queue`);
		return result.data;
	},

	approve: async (id: string): Promise<ReviewScheduleResult> => {
		const result = await adminPatch<{ data: ReviewScheduleResult }>(`${BASE}/review-queue/${id}/approve`);
		return result.data;
	},

	reject: async (id: string, reason: string): Promise<void> => {
		await adminPatch(`${BASE}/review-queue/${id}/reject`, { reason });
	},

	inject: async (id: string, newText: string): Promise<ReviewScheduleResult> => {
		const result = await adminPatch<{ data: ReviewScheduleResult }>(`${BASE}/review-queue/${id}/inject`, { newText });
		return result.data;
	},

	regenerate: async (id: string, body?: { campaignId?: string; dagTemplateId?: string }): Promise<void> => {
		await adminPost(`${BASE}/review-queue/${id}/regenerate`, body ?? {});
	},

	withdraw: async (id: string, reason: string): Promise<void> => {
		await adminPatch(`${BASE}/review-queue/${id}/withdraw`, { reason });
	},

	bulk: async (body: BulkApplyBody): Promise<BulkApplyResult> => {
		const result = await adminPost<{ data: BulkApplyResult }>(`${BASE}/review-queue/bulk`, body);
		return result.data;
	},
};

// ==================== Activities ====================

export const activities = {
	create: async (body: CreateActivityBody): Promise<CreateActivityResult> => {
		const result = await adminPost<{ data: CreateActivityResult }>(`${BASE}/activities`, body);
		return result.data;
	},
};

// ==================== Target Posts ====================

export const targetPosts = {
	list: async (query?: TargetPostListQuery): Promise<TargetPostListResponse> => {
		const params: Record<string, string | number | undefined> = query ? { ...query } : {};
		const result = await adminGet<{ data: TargetPostListResponse }>(`${BASE}/target-posts`, params);
		return result.data;
	},

	get: async (articleId: string): Promise<TargetPostDetail> => {
		const result = await adminGet<{ data: TargetPostDetail }>(`${BASE}/target-posts/${articleId}`);
		return result.data;
	},

	createLlmDraft: async (articleId: string, body: CreateLlmDraftBody): Promise<TargetPostDraftResult> => {
		const result = await adminPost<{ data: TargetPostDraftResult }>(
			`${BASE}/target-posts/${articleId}/comment-drafts`,
			body,
		);
		return result.data;
	},

	createManualComment: async (articleId: string, body: CreateManualCommentBody): Promise<TargetPostDraftResult> => {
		const result = await adminPost<{ data: TargetPostDraftResult }>(
			`${BASE}/target-posts/${articleId}/manual-comments`,
			body,
		);
		return result.data;
	},

	createLiveGhostComment: async (
		articleId: string,
		body: GhostCommentBody,
	): Promise<GhostCommentResult> => {
		const result = await adminPost<{ data: GhostCommentResult }>(
			`${BASE}/target-posts/${articleId}/live-comments`,
			body,
		);
		return result.data;
	},

	createLiveGhostLike: async (
		articleId: string,
		body: GhostLikeBody,
	): Promise<GhostLikeResult> => {
		const result = await adminPost<{ data: GhostLikeResult }>(
			`/admin/v2/community/posts/${articleId}/ghost-likes`,
			body,
		);
		return result.data;
	},

	listLiveCommentSuggestions: async (articleId: string): Promise<LiveCommentSuggestionResponse> => {
		const result = await adminPost<{ data: LiveCommentSuggestionResponse }>(
			`${BASE}/target-posts/${articleId}/live-comment-suggestions`,
			{},
		);
		return result.data;
	},

	listScheduledComments: async (articleId: string): Promise<ScheduledCommentTimelineItem[]> => {
		const result = await adminGet<{ data: ScheduledCommentTimelineResponse }>(
			`${BASE}/target-posts/${articleId}/scheduled-comments`,
		);
		return result.data.items;
	},

	cancelScheduledComment: async (
		articleId: string,
		contentId: string,
	): Promise<ScheduledCommentTimelineItem[]> => {
		const result = await adminPatch<{ data: ScheduledCommentTimelineResponse }>(
			`${BASE}/target-posts/${articleId}/scheduled-comments/${contentId}/cancel`,
		);
		return result.data.items;
	},

	rescheduleScheduledComment: async (
		articleId: string,
		contentId: string,
		body: { delayMinutes: number },
	): Promise<ScheduledCommentTimelineItem[]> => {
		const result = await adminPatch<{ data: ScheduledCommentTimelineResponse }>(
			`${BASE}/target-posts/${articleId}/scheduled-comments/${contentId}/reschedule`,
			body,
		);
		return result.data.items;
	},

	promoteToHotArticle: async (
		articleId: string,
		body: PromoteTargetPostToHotBody,
	): Promise<PromoteTargetPostToHotResult> => {
		const result = await adminPost<{ data: PromoteTargetPostToHotResult }>(
			`${BASE}/target-posts/${articleId}/promote-hot`,
			body,
		);
		return result.data;
	},
};

// ==================== Review Sources / Review Posts ====================

export const reviewSources = {
	list: async (query?: {
		sourceType?: ReviewSourceType;
		safetyStatus?: ReviewSourceSafetyStatus;
		embeddingStatus?: ReviewSourceEmbeddingStatus;
		limit?: number;
	}): Promise<ReviewSourceDocument[]> => {
		const result = await adminGet<{ data: ReviewSourceDocument[] }>(
			`${BASE}/review-sources`,
			query,
		);
		return result.data;
	},

	stats: async (): Promise<ReviewSourceStat[]> => {
		const result = await adminGet<{ data: ReviewSourceStat[] }>(`${BASE}/review-sources/stats`);
		return result.data;
	},

	syncQdrant: async (limit = 100): Promise<{ embedded: number; failed: number }> => {
		const result = await adminPost<{ data: { embedded: number; failed: number } }>(
			`${BASE}/review-sources/qdrant-sync`,
			{ limit },
		);
		return result.data;
	},

	listPostJobs: async (status?: ReviewPostJobStatus): Promise<CommunityReviewPostJob[]> => {
		const result = await adminGet<{ data: CommunityReviewPostJob[] }>(
			`${BASE}/review-sources/post-jobs`,
			status ? { status } : undefined,
		);
		return result.data;
	},

	createPostJob: async (body: CreateReviewPostJobBody): Promise<CommunityReviewPostJob> => {
		const result = await adminPost<{ data: CommunityReviewPostJob }>(
			`${BASE}/review-sources/post-jobs`,
			body,
		);
		return result.data;
	},

	schedulePostJob: async (id: string, scheduledAt: string): Promise<CommunityReviewPostJob> => {
		const result = await adminPatch<{ data: CommunityReviewPostJob }>(
			`${BASE}/review-sources/post-jobs/${id}/schedule`,
			{ scheduledAt },
		);
		return result.data;
	},

	updatePostJob: async (id: string, body: UpdateReviewPostJobBody): Promise<CommunityReviewPostJob> => {
		const result = await adminPatch<{ data: CommunityReviewPostJob }>(
			`${BASE}/review-sources/post-jobs/${id}`,
			body,
		);
		return result.data;
	},
};

// ==================== Metrics ====================

export const metrics = {
	summary: async (from?: string, to?: string): Promise<MetricsSummary> => {
		const params: Record<string, string> = {};
		if (from) params.from = from;
		if (to) params.to = to;
		const result = await adminGet<{ data: MetricsSummary }>(`${BASE}/metrics/summary`, params);
		return result.data;
	},

	queueDepth: async (): Promise<QueueDepth> => {
		const result = await adminGet<{ data: QueueDepth }>(`${BASE}/metrics/queue-depth`);
		return result.data;
	},
};

// ==================== Personas ====================

export const personas = {
	list: async (): Promise<GhostPersonaInfo[]> => {
		const result = await adminGet<{ data: GhostPersonaInfo[] }>(`${BASE}/personas`);
		return result.data;
	},

	diversity: async (): Promise<PersonaDiversityReport> => {
		const result = await adminGet<{ data: PersonaDiversityReport }>(`${BASE}/personas/diversity`);
		return result.data;
	},

	get: async (id: string): Promise<GhostPersonaInfo> => {
		const result = await adminGet<{ data: GhostPersonaInfo }>(`${BASE}/personas/${id}`);
		return result.data;
	},

	setTraits: async (id: string, traits: CommunityTraits): Promise<void> => {
		await adminPut(`${BASE}/personas/${id}/community-traits`, traits);
	},

	deleteTraits: async (id: string): Promise<void> => {
		await adminDelete(`${BASE}/personas/${id}/community-traits`);
	},
};

// ==================== Settings ====================

export const communitySettings = {
	getKillSwitch: async (): Promise<KillSwitchStatus> => {
		const result = await adminGet<{ data: KillSwitchStatus }>(`${BASE}/settings/kill-switch`);
		return result.data;
	},

	kill: async (): Promise<void> => {
		await adminPost(`${BASE}/settings/kill-switch/kill`);
	},

	restore: async (): Promise<void> => {
		await adminPost(`${BASE}/settings/kill-switch/restore`);
	},

	get: async (): Promise<CommunitySettings> => {
		const result = await adminGet<{ data: CommunitySettings }>(`${BASE}/settings`);
		return result.data;
	},

	update: async (body: Partial<CommunitySettings>): Promise<CommunitySettings> => {
		const result = await adminPatch<{ data: CommunitySettings }>(`${BASE}/settings`, body);
		return result.data;
	},

	reset: async (): Promise<CommunitySettings> => {
		const result = await adminDelete<{ data: CommunitySettings }>(`${BASE}/settings`);
		return result.data;
	},
};
