import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AdminService from '@/app/services/admin';
import type {
	DeleteLoveCourtSubmissionBody,
	LoveCourtSubmissionListParams,
	UpdateLoveCourtOptionsBody,
} from '@/app/services/admin/love-court';
import { useAdminSession } from '@/shared/contexts/admin-session-context';

export const loveCourtKeys = {
	all: ['admin', 'love-court'] as const,
	submissions: (params: LoveCourtSubmissionListParams, country: string) =>
		[...loveCourtKeys.all, 'submissions', { ...params, country }] as const,
	submission: (submissionId: string | null, country: string) =>
		[...loveCourtKeys.all, 'submission', { submissionId, country }] as const,
};

export function useLoveCourtSubmissions(params: LoveCourtSubmissionListParams = {}) {
	const { session } = useAdminSession();
	const selectedCountry = session?.selectedCountry ?? 'kr';

	return useQuery({
		queryKey: loveCourtKeys.submissions(params, selectedCountry),
		queryFn: () => AdminService.loveCourt.listSubmissions(params),
	});
}

export function useLoveCourtSubmission(submissionId: string | null) {
	const { session } = useAdminSession();
	const selectedCountry = session?.selectedCountry ?? 'kr';

	return useQuery({
		queryKey: loveCourtKeys.submission(submissionId, selectedCountry),
		queryFn: () => AdminService.loveCourt.getSubmission(submissionId as string),
		enabled: !!submissionId,
	});
}

export function useLoveCourtMutations() {
	const queryClient = useQueryClient();

	const invalidate = () => queryClient.invalidateQueries({ queryKey: loveCourtKeys.all });

	return {
		regenerateOptions: useMutation({
			mutationFn: (submissionId: string) => AdminService.loveCourt.regenerateOptions(submissionId),
			onSuccess: invalidate,
		}),
		updateOptions: useMutation({
			mutationFn: ({
				submissionId,
				body,
			}: {
				submissionId: string;
				body: UpdateLoveCourtOptionsBody;
			}) => AdminService.loveCourt.updateOptions(submissionId, body),
			onSuccess: invalidate,
		}),
		approveOptions: useMutation({
			mutationFn: (submissionId: string) => AdminService.loveCourt.approveOptions(submissionId),
			onSuccess: invalidate,
		}),
		deleteSubmission: useMutation({
			mutationFn: ({
				submissionId,
				body,
			}: {
				submissionId: string;
				body: DeleteLoveCourtSubmissionBody;
			}) => AdminService.loveCourt.deleteSubmission(submissionId, body),
			onSuccess: invalidate,
		}),
		generateVerdict: useMutation({
			mutationFn: (caseId: string) => AdminService.loveCourt.generateVerdict(caseId),
			onSuccess: invalidate,
		}),
	};
}
