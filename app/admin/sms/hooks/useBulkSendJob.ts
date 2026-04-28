'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { smsService, type BulkSendRequest, type JobStatus } from '@/app/services/sms';

export function useBulkSendMutation() {
	return useMutation({
		mutationFn: ({ req, idempotencyKey }: { req: BulkSendRequest; idempotencyKey: string }) =>
			smsService.sendByFilter(req, idempotencyKey),
	});
}

export function useJobStatus(jobId: string | null) {
	return useQuery<JobStatus>({
		queryKey: ['sms-job-status', jobId],
		queryFn: () => smsService.getJobStatus(jobId!),
		enabled: !!jobId,
		refetchInterval: (query) => {
			const status = query.state.data?.status;
			return status === 'COMPLETED' || status === 'FAILED' ? false : 2000;
		},
		refetchIntervalInBackground: false,
	});
}
