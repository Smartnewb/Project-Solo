import type { CandidateListItem } from '@/app/types/ghost-injection';

export function isCheckable(item: CandidateListItem): boolean {
	return item.status === 'PENDING' || item.status === 'QUEUED';
}
