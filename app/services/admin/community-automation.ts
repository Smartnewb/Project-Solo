import { adminGet, adminPost, adminPut, adminPatch, adminDelete } from '@/shared/lib/http/admin-fetch';

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
	const options = categories
		.filter((category) => isCommunityAutomationCategory(category.code))
		.map((category) => ({
			id: category.id,
			value: category.code,
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

export interface BulkApplyBody {
	contentIds: string[];
	action: 'approve' | 'reject' | 'withdraw';
	reason?: string;
}

export interface BulkApplyResult {
	succeeded: string[];
	failed: Array<{ id: string; error: string }>;
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

	approve: async (id: string): Promise<void> => {
		await adminPatch(`${BASE}/review-queue/${id}/approve`);
	},

	reject: async (id: string, reason: string): Promise<void> => {
		await adminPatch(`${BASE}/review-queue/${id}/reject`, { reason });
	},

	inject: async (id: string, newText: string): Promise<void> => {
		await adminPatch(`${BASE}/review-queue/${id}/inject`, { newText });
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
