'use client';

import { useQuery } from '@tanstack/react-query';
import { smsService, type RecipientFilter } from '@/app/services/sms';

export function useRecipientCount(filter: RecipientFilter, enabled = true) {
	return useQuery({
		queryKey: ['sms-recipients-count', filter],
		queryFn: () => smsService.countRecipients(filter),
		staleTime: 30_000,
		enabled,
	});
}
