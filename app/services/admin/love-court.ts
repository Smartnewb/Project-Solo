import { adminGet, adminPatch, adminPost } from '@/shared/lib/http/admin-fetch';
import { toStringParams } from './_shared';

type AdminDataResponse<T> = T | { data: T };

function unwrapAdminData<T>(response: AdminDataResponse<T>): T {
	if (response && typeof response === 'object' && 'data' in response) {
		return response.data;
	}
	return response;
}

const BASE = '/admin/love-court';

export type LoveCourtSubmissionStatus =
	| 'submitted'
	| 'queued'
	| 'published'
	| 'closed'
	| 'archived'
	| 'deleted_by_operator';

export type LoveCourtOptionStatus =
	| 'pending'
	| 'generating'
	| 'generated'
	| 'review_required'
	| 'approved'
	| 'failed';

export type LoveCourtOptionCandidateStatus = 'generated' | 'edited' | 'approved' | 'rejected';
export type LoveCourtOptionCandidateSource = 'llm' | 'admin';

export interface LoveCourtSubmissionListParams {
	status?: LoveCourtSubmissionStatus;
	optionStatus?: LoveCourtOptionStatus;
	limit?: number;
}

export interface LoveCourtOptionCandidate {
	id: string;
	submissionId: string;
	label: string;
	displayOrder: number;
	source: LoveCourtOptionCandidateSource;
	status: LoveCourtOptionCandidateStatus;
	rationale?: string | null;
	scores?: Record<string, unknown> | null;
	riskFlags?: string[];
	createdBy?: string | null;
	reviewedBy?: string | null;
	reviewedAt?: string | null;
	createdAt?: string | null;
	updatedAt?: string | null;
	deletedAt?: string | null;
}

export interface LoveCourtSubmission {
	id: string;
	status: LoveCourtSubmissionStatus;
	title: string | null;
	body: string | null;
	desiredOptions: string[];
	optionStatus: LoveCourtOptionStatus;
	optionStatusMessage: string;
	optionGenerationError?: string | null;
	queuePosition: number | null;
	remainingQueueCount: number | null;
	isPublicInQueue: boolean;
	canBecomeActiveImmediately: boolean;
	caseId: string | null;
	questionId: string | null;
	category: string | null;
	createdAt: string | null;
	queueEnteredAt: string | null;
	publishedAt: string | null;
	closedAt: string | null;
	deletionReasonCode?: string | null;
	deletionReasonMessage?: string | null;
	options?: LoveCourtOptionCandidate[];
}

export interface LoveCourtSubmissionListResponse {
	items: LoveCourtSubmission[];
}

export interface UpdateLoveCourtOptionCandidateBody {
	id?: string;
	label: string;
	displayOrder: number;
}

export interface UpdateLoveCourtOptionsBody {
	options: UpdateLoveCourtOptionCandidateBody[];
}

export interface DeleteLoveCourtSubmissionBody {
	reasonCode: string;
	reasonMessage: string;
}

export interface GenerateLoveCourtVerdictResponse {
	status: 'generated' | 'failed';
	verdict?: Record<string, unknown>;
	errorMessage?: string;
}

export const loveCourt = {
	listSubmissions: async (
		params: LoveCourtSubmissionListParams = {},
	): Promise<LoveCourtSubmissionListResponse> => {
		const res = await adminGet<AdminDataResponse<LoveCourtSubmissionListResponse>>(
			`${BASE}/submissions`,
			toStringParams({ limit: 100, ...params }),
		);
		return unwrapAdminData(res);
	},

	getSubmission: async (submissionId: string): Promise<{ submission: LoveCourtSubmission }> => {
		const res = await adminGet<AdminDataResponse<{ submission: LoveCourtSubmission }>>(
			`${BASE}/submissions/${submissionId}`,
		);
		return unwrapAdminData(res);
	},

	regenerateOptions: async (
		submissionId: string,
	): Promise<{ submission: LoveCourtSubmission }> => {
		const res = await adminPost<AdminDataResponse<{ submission: LoveCourtSubmission }>>(
			`${BASE}/submissions/${submissionId}/options/generate`,
		);
		return unwrapAdminData(res);
	},

	updateOptions: async (
		submissionId: string,
		body: UpdateLoveCourtOptionsBody,
	): Promise<{ submission: LoveCourtSubmission; options: LoveCourtOptionCandidate[] }> => {
		const res = await adminPatch<
			AdminDataResponse<{ submission: LoveCourtSubmission; options: LoveCourtOptionCandidate[] }>
		>(`${BASE}/submissions/${submissionId}/options`, body);
		return unwrapAdminData(res);
	},

	approveOptions: async (submissionId: string): Promise<{ submission: LoveCourtSubmission }> => {
		const res = await adminPost<AdminDataResponse<{ submission: LoveCourtSubmission }>>(
			`${BASE}/submissions/${submissionId}/options/approve`,
		);
		return unwrapAdminData(res);
	},

	deleteSubmission: async (
		submissionId: string,
		body: DeleteLoveCourtSubmissionBody,
	): Promise<{ submission: LoveCourtSubmission; notificationQueued: boolean }> => {
		const res = await adminPatch<
			AdminDataResponse<{ submission: LoveCourtSubmission; notificationQueued: boolean }>
		>(`${BASE}/submissions/${submissionId}/delete`, body);
		return unwrapAdminData(res);
	},

	generateVerdict: async (caseId: string): Promise<GenerateLoveCourtVerdictResponse> => {
		const res = await adminPost<AdminDataResponse<GenerateLoveCourtVerdictResponse>>(
			`${BASE}/${caseId}/verdict/generate`,
		);
		return unwrapAdminData(res);
	},
};
