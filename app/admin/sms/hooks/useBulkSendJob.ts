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
			const data = query.state.data;
			if (!data) return 2000;
			if (data.status === 'COMPLETED' || data.status === 'FAILED') return false;
			return 2000;
		},
	});
}
