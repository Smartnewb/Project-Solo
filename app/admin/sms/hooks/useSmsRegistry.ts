'use client';

import { useQuery } from '@tanstack/react-query';
import { smsService } from '@/app/services/sms';

export function useSmsRegistry() {
	return useQuery({
		queryKey: ['sms-registry'],
		queryFn: () => smsService.getRegistry(),
		staleTime: 5 * 60 * 1000,
	});
}
