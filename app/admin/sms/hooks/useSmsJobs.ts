'use client';

import { useQuery } from '@tanstack/react-query';
import { smsService, type SmsJobListParams } from '@/app/services/sms';

export function useSmsJobs(params: SmsJobListParams) {
	return useQuery({
		queryKey: ['sms-jobs', params],
		queryFn: () => smsService.getJobs(params),
	});
}

export function useSmsJobFailures(jobId: string | null, page: number, limit = 20) {
	return useQuery({
		queryKey: ['sms-job-failures', jobId, page, limit],
		queryFn: () => smsService.getJobFailures(jobId!, { page, limit }),
		enabled: !!jobId,
	});
}
