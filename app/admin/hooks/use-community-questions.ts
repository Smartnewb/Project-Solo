import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AdminService from '@/app/services/admin';
import type {
	AssignCandidateBody,
	CandidateBatchListParams,
	CommunityQuestionCalendarParams,
	CommunityQuestionCreateBody,
	GenerateCandidateBatchBody,
	RejectCandidateBody,
	UpdateCandidateBody,
	UpdateQuestionScheduleBody,
} from '@/app/services/admin/community-questions';

export const communityQuestionKeys = {
	all: ['admin', 'community-questions'] as const,
	batches: (params: CandidateBatchListParams) =>
		[...communityQuestionKeys.all, 'candidate-batches', params] as const,
	batch: (batchId: string | null) => [...communityQuestionKeys.all, 'candidate-batch', batchId] as const,
	calendar: (params: CommunityQuestionCalendarParams) =>
		[...communityQuestionKeys.all, 'calendar', params] as const,
};

export function useCommunityQuestionBatches(params: CandidateBatchListParams) {
	return useQuery({
		queryKey: communityQuestionKeys.batches(params),
		queryFn: () => AdminService.communityQuestions.listCandidateBatches(params),
	});
}

export function useCommunityQuestionBatch(batchId: string | null) {
	return useQuery({
		queryKey: communityQuestionKeys.batch(batchId),
		queryFn: () => AdminService.communityQuestions.getCandidateBatch(batchId as string),
		enabled: !!batchId,
	});
}

export function useCommunityQuestionCalendar(params: CommunityQuestionCalendarParams) {
	return useQuery({
		queryKey: communityQuestionKeys.calendar(params),
		queryFn: () => AdminService.communityQuestions.getCalendar(params),
		enabled: !!params.country && !!params.from && !!params.to,
	});
}

export function useCommunityQuestionMutations() {
	const queryClient = useQueryClient();

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: communityQuestionKeys.all });

	return {
		createQuestion: useMutation({
			mutationFn: (body: CommunityQuestionCreateBody) =>
				AdminService.communityQuestions.createQuestion(body),
			onSuccess: invalidate,
		}),
		generateBatch: useMutation({
			mutationFn: (body: GenerateCandidateBatchBody) =>
				AdminService.communityQuestions.generateCandidateBatch(body),
			onSuccess: invalidate,
		}),
		updateCandidate: useMutation({
			mutationFn: ({ candidateId, body }: { candidateId: string; body: UpdateCandidateBody }) =>
				AdminService.communityQuestions.updateCandidate(candidateId, body),
			onSuccess: invalidate,
		}),
		approveCandidate: useMutation({
			mutationFn: (candidateId: string) =>
				AdminService.communityQuestions.approveCandidate(candidateId),
			onSuccess: invalidate,
		}),
		rejectCandidate: useMutation({
			mutationFn: ({ candidateId, body }: { candidateId: string; body: RejectCandidateBody }) =>
				AdminService.communityQuestions.rejectCandidate(candidateId, body),
			onSuccess: invalidate,
		}),
		assignCandidate: useMutation({
			mutationFn: ({ candidateId, body }: { candidateId: string; body: AssignCandidateBody }) =>
				AdminService.communityQuestions.assignCandidate(candidateId, body),
			onSuccess: invalidate,
		}),
		unassignCandidate: useMutation({
			mutationFn: (candidateId: string) =>
				AdminService.communityQuestions.unassignCandidate(candidateId),
			onSuccess: invalidate,
		}),
		updateSchedule: useMutation({
			mutationFn: ({ questionId, body }: { questionId: string; body: UpdateQuestionScheduleBody }) =>
				AdminService.communityQuestions.updateQuestionSchedule(questionId, body),
			onSuccess: invalidate,
		}),
	};
}
