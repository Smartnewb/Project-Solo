import { adminGet, adminPatch, adminPost } from '@/shared/lib/http/admin-fetch';

export type XMarketingDashboard = {
	collectedCount?: number;
	collected_count?: number;
	candidateCount?: number;
	candidate_count?: number;
	approvedCount?: number;
	approved_count?: number;
	ownPostCount?: number;
	own_post_count?: number;
	replyCount?: number;
	reply_count?: number;
	likeCount?: number;
	like_count?: number;
	linkClicks?: number;
	link_clicks?: number;
	signups?: number;
};

export type XMarketingListResponse<T> = {
	data?: {
		items: T[];
		total: number;
		page: number;
		limit: number;
	};
	items?: T[];
	total?: number;
	page?: number;
	limit?: number;
};

export type XMarketingCollectedPost = {
	id: string;
	tweet_id?: string;
	tweetId?: string;
	url?: string;
	username?: string;
	language?: string;
	text_original?: string;
	textOriginal?: string;
	text_ko?: string;
	textKo?: string;
	topic_tags?: string[];
	status?: string;
	skip_reason?: string;
	collected_at?: string;
};

export type XMarketingReplyCandidate = {
	id: string;
	collected_post_id?: string;
	target_tweet_id?: string;
	target_username?: string;
	target_text_original?: string;
	target_text_ko?: string;
	target_url?: string;
	ja_text?: string;
	ko_meaning?: string;
	edited_ja_text?: string;
	edited_ko_meaning?: string;
	tone?: string;
	risk?: string;
	reason?: string;
	cta_level?: string;
	status?: string;
	created_at?: string;
};

export type XMarketingRateLimit = {
	id: string;
	endpoint: string;
	limit_count?: number;
	remaining_count?: number;
	reset_at?: string;
	seconds_to_reset?: number;
	last_request_at?: string;
	last_failure_reason?: string;
};

export type XMarketingAction = {
	id: string;
	action_type?: string;
	status?: string;
	target_type?: string;
	tweet_id?: string;
	url?: string;
	ja_text?: string;
	ko_meaning?: string;
	actor_id?: string;
	created_at?: string;
	posted_at?: string;
};

const BASE = '/admin/v2/x-marketing';

function unwrap<T>(response: { data?: T } | T): T {
	if (response && typeof response === 'object' && 'data' in response) {
		return (response as { data: T }).data;
	}
	return response as T;
}

export const XMarketingAdminService = {
	async getDashboard() {
		return unwrap<XMarketingDashboard>(await adminGet(`${BASE}/dashboard`));
	},
	async collect(
		body: { query?: string; priority?: number; limit?: number } = {},
	) {
		return unwrap(await adminPost(`${BASE}/collect`, body));
	},
	async getCollectedPosts(
		params?: Record<string, string | number | undefined>,
	) {
		return unwrap<XMarketingListResponse<XMarketingCollectedPost>>(
			await adminGet(`${BASE}/collected-posts`, params),
		);
	},
	async getReplyCandidates(
		params?: Record<string, string | number | undefined>,
	) {
		return unwrap<XMarketingListResponse<XMarketingReplyCandidate>>(
			await adminGet(`${BASE}/reply-candidates`, params),
		);
	},
	async getPosts(params?: Record<string, string | number | undefined>) {
		return unwrap<XMarketingListResponse<XMarketingCollectedPost>>(
			await adminGet(`${BASE}/posts`, params),
		);
	},
	async getReplies(params?: Record<string, string | number | undefined>) {
		return unwrap<XMarketingListResponse<XMarketingCollectedPost>>(
			await adminGet(`${BASE}/replies`, params),
		);
	},
	async getActions(params?: Record<string, string | number | undefined>) {
		return unwrap<XMarketingListResponse<XMarketingAction>>(
			await adminGet(`${BASE}/actions`, params),
		);
	},
	async getRateLimits() {
		return unwrap<XMarketingRateLimit[]>(await adminGet(`${BASE}/rate-limits`));
	},
	async generateReplyCandidate(collectedPostId: string) {
		return unwrap(
			await adminPost(
				`${BASE}/collected-posts/${collectedPostId}/reply-candidates`,
				{},
			),
		);
	},
	async approveReplyCandidate(candidateId: string) {
		return unwrap(
			await adminPatch(`${BASE}/reply-candidates/${candidateId}/approve`, {}),
		);
	},
	async rejectReplyCandidate(candidateId: string, reason?: string) {
		return unwrap(
			await adminPatch(`${BASE}/reply-candidates/${candidateId}/reject`, {
				reason,
			}),
		);
	},
	async injectReplyCandidate(
		candidateId: string,
		body: { jaText?: string; koMeaning?: string },
	) {
		return unwrap(
			await adminPatch(`${BASE}/reply-candidates/${candidateId}/inject`, body),
		);
	},
	async markActionPosted(
		actionId: string,
		body: { tweetId?: string; url?: string },
	) {
		return unwrap(
			await adminPost(`${BASE}/actions/${actionId}/mark-posted`, body),
		);
	},
	async getSettings() {
		return unwrap<Record<string, unknown>>(await adminGet(`${BASE}/settings`));
	},
	async updateSettings(settings: Record<string, unknown>) {
		return unwrap<Record<string, unknown>>(
			await adminPatch(`${BASE}/settings`, settings),
		);
	},
};
