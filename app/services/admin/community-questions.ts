import { adminGet, adminPatch, adminPost } from '@/shared/lib/http/admin-fetch';
import { toStringParams } from './_shared';

type AdminDataResponse<T> = T | { data: T };

function unwrapAdminData<T>(response: AdminDataResponse<T>): T {
	if (response && typeof response === 'object' && 'data' in response) {
		return response.data;
	}
	return response;
}

const BASE = '/admin/community/questions';

export type CommunityQuestionCountry = 'kr' | 'jp';
export type CommunityQuestionScope = 'all' | 'cluster' | 'region' | 'university';
export type CommunityQuestionStatus = 'draft' | 'scheduled' | 'published' | 'closed' | 'archived';
export type CommunityQuestionBatchStatus =
	| 'generating'
	| 'generated'
	| 'failed'
	| 'partially_assigned'
	| 'assigned'
	| 'archived';
export type CommunityQuestionCandidateStatus =
	| 'pending'
	| 'approved'
	| 'rejected'
	| 'assigned'
	| 'published';

export interface CommunityQuestionTargetScope {
	scope: CommunityQuestionScope;
	regionCodes?: string[];
	universityId?: string | null;
	universityCode?: string | null;
}

export interface CommunityQuestionCreateBody {
	title: string;
	description?: string;
	options: string[];
	status?: CommunityQuestionStatus;
	categoryCode?: string;
	sourceTheme?: string;
	publishAt?: string;
	closeAt?: string;
}

export interface CommunityQuestion {
	id: string;
	articleId: string;
	title: string;
	description?: string | null;
	questionType?: string;
	status: CommunityQuestionStatus;
	targetScope?: CommunityQuestionTargetScope;
	sourceType?: string;
	sourceTheme?: string | null;
	publishAt?: string | null;
	closeAt?: string | null;
	createdBy?: string | null;
	createdAt?: string;
	updatedAt?: string;
	deletedAt?: string | null;
}

export interface GenerateCandidateBatchBody {
	country: CommunityQuestionCountry;
	startDate: string;
	endDate: string;
	targetScope: CommunityQuestionTargetScope;
	candidatesPerDay?: number;
	operatorMemo?: string;
	externalTrends?: string[];
	includeKeywords?: string[];
	excludeKeywords?: string[];
	seasonHints?: string[];
}

export interface GenerateCandidateBatchResult {
	batchId: string;
	status: CommunityQuestionBatchStatus;
	dateRange: {
		startDate: string;
		endDate: string;
	};
	candidateCount: number;
	weeklyTheme?: string | null;
}

export interface CandidateBatchListParams {
	country?: CommunityQuestionCountry;
	from?: string;
	to?: string;
	status?: CommunityQuestionBatchStatus;
}

export interface CandidateBatchSummary {
	id: string;
	country: CommunityQuestionCountry;
	startDate: string;
	endDate: string;
	targetScope: CommunityQuestionTargetScope;
	status: CommunityQuestionBatchStatus;
	generatedCount: number;
	assignedCount: number;
	createdBy?: string | null;
	createdAt?: string;
}

export interface CandidateBatchListResponse {
	items: CandidateBatchSummary[];
}

export interface CommunityQuestionCandidateScores {
	totalScore?: number;
	[key: string]: unknown;
}

export interface CommunityQuestionCandidate {
	id: string;
	title: string;
	finalTitle?: string | null;
	description?: string | null;
	finalDescription?: string | null;
	options: string[];
	finalOptions?: string[] | null;
	targetDate?: string | null;
	sourceTheme?: string | null;
	scores?: CommunityQuestionCandidateScores | null;
	riskFlags?: string[];
	status: CommunityQuestionCandidateStatus;
	publishedQuestionId?: string | null;
	rejectionReason?: string | null;
	reviewedAt?: string | null;
}

export interface CandidateBatchDay {
	date: string;
	dayTheme?: string | null;
	candidates: CommunityQuestionCandidate[];
}

export interface CandidateBatchDetail {
	id: string;
	country?: CommunityQuestionCountry;
	startDate?: string;
	endDate?: string;
	status?: CommunityQuestionBatchStatus;
	weeklyTheme?: string | null;
	trendContext?: Record<string, unknown>;
	days: CandidateBatchDay[];
}

export interface UpdateCandidateBody {
	title?: string;
	description?: string;
	options?: string[];
	targetDate?: string;
	sourceTheme?: string;
}

export interface RejectCandidateBody {
	reason: string;
}

export interface AssignCandidateBody {
	publishAt: string;
	closeAt: string;
	targetScope: CommunityQuestionTargetScope;
	categoryCode?: string;
}

export interface AssignCandidateResult {
	candidateId: string;
	questionId: string;
	articleId: string;
	status: CommunityQuestionStatus;
	publishAt: string;
	closeAt: string;
}

export interface CommunityQuestionCalendarParams {
	country: CommunityQuestionCountry;
	from: string;
	to: string;
	scope?: CommunityQuestionScope;
}

export interface CommunityQuestionCalendarDay {
	date: string;
	question?: {
		id: string;
		title: string;
		status: CommunityQuestionStatus;
		publishAt?: string | null;
		closeAt?: string | null;
		targetScope?: CommunityQuestionTargetScope;
		sourceType?: string;
		candidateId?: string | null;
	} | null;
	candidateSummary?: {
		pending: number;
		approved: number;
		rejected: number;
		assigned: number;
	};
}

export interface CommunityQuestionCalendarResponse {
	from: string;
	to: string;
	days: CommunityQuestionCalendarDay[];
}

export interface UpdateQuestionScheduleBody {
	publishAt?: string;
	closeAt: string;
}

export const communityQuestions = {
	createQuestion: async (body: CommunityQuestionCreateBody): Promise<CommunityQuestion> => {
		const res = await adminPost<AdminDataResponse<CommunityQuestion>>(BASE, body);
		return unwrapAdminData(res);
	},

	generateCandidateBatch: async (
		body: GenerateCandidateBatchBody,
	): Promise<GenerateCandidateBatchResult> => {
		const res = await adminPost<AdminDataResponse<GenerateCandidateBatchResult>>(
			`${BASE}/candidate-batches/generate`,
			body,
		);
		return unwrapAdminData(res);
	},

	listCandidateBatches: async (
		params: CandidateBatchListParams = {},
	): Promise<CandidateBatchListResponse> => {
		const res = await adminGet<AdminDataResponse<CandidateBatchListResponse>>(
			`${BASE}/candidate-batches`,
			toStringParams({ ...params }),
		);
		return unwrapAdminData(res);
	},

	getCandidateBatch: async (batchId: string): Promise<CandidateBatchDetail> => {
		const res = await adminGet<AdminDataResponse<CandidateBatchDetail>>(
			`${BASE}/candidate-batches/${batchId}`,
		);
		return unwrapAdminData(res);
	},

	updateCandidate: async (
		candidateId: string,
		body: UpdateCandidateBody,
	): Promise<CommunityQuestionCandidate> => {
		const res = await adminPatch<AdminDataResponse<CommunityQuestionCandidate>>(
			`${BASE}/candidates/${candidateId}`,
			body,
		);
		return unwrapAdminData(res);
	},

	approveCandidate: async (
		candidateId: string,
	): Promise<Pick<CommunityQuestionCandidate, 'id' | 'status' | 'reviewedAt'>> => {
		const res = await adminPatch<
			AdminDataResponse<Pick<CommunityQuestionCandidate, 'id' | 'status' | 'reviewedAt'>>
		>(`${BASE}/candidates/${candidateId}/approve`);
		return unwrapAdminData(res);
	},

	rejectCandidate: async (
		candidateId: string,
		body: RejectCandidateBody,
	): Promise<CommunityQuestionCandidate> => {
		const res = await adminPatch<AdminDataResponse<CommunityQuestionCandidate>>(
			`${BASE}/candidates/${candidateId}/reject`,
			body,
		);
		return unwrapAdminData(res);
	},

	assignCandidate: async (
		candidateId: string,
		body: AssignCandidateBody,
	): Promise<AssignCandidateResult> => {
		const res = await adminPost<AdminDataResponse<AssignCandidateResult>>(
			`${BASE}/candidates/${candidateId}/assign`,
			body,
		);
		return unwrapAdminData(res);
	},

	unassignCandidate: async (candidateId: string): Promise<CommunityQuestionCandidate> => {
		const res = await adminPatch<AdminDataResponse<CommunityQuestionCandidate>>(
			`${BASE}/candidates/${candidateId}/unassign`,
		);
		return unwrapAdminData(res);
	},

	getCalendar: async (
		params: CommunityQuestionCalendarParams,
	): Promise<CommunityQuestionCalendarResponse> => {
		const res = await adminGet<AdminDataResponse<CommunityQuestionCalendarResponse>>(
			`${BASE}/calendar`,
			toStringParams({ ...params }),
		);
		return unwrapAdminData(res);
	},

	updateQuestionSchedule: async (
		questionId: string,
		body: UpdateQuestionScheduleBody,
	): Promise<CommunityQuestion> => {
		const res = await adminPatch<AdminDataResponse<CommunityQuestion>>(
			`${BASE}/${questionId}/schedule`,
			body,
		);
		return unwrapAdminData(res);
	},
};
