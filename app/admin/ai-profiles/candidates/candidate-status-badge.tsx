import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/utils';
import type { GhostCandidateStatus } from '@/app/types/ghost-injection';

const LABEL: Record<GhostCandidateStatus, string> = {
	PENDING: '대기',
	QUEUED: '발송 예정',
	SENT: '발송 완료',
	CANCELED: '취소됨',
};

const COLOR: Record<GhostCandidateStatus, string> = {
	PENDING: 'bg-slate-200 text-slate-700 hover:bg-slate-200',
	QUEUED: 'bg-blue-500 hover:bg-blue-500',
	SENT: 'bg-emerald-500 hover:bg-emerald-500',
	CANCELED: 'bg-rose-500 hover:bg-rose-500',
};

interface CandidateStatusBadgeProps {
	status: GhostCandidateStatus;
	className?: string;
}

export function CandidateStatusBadge({ status, className }: CandidateStatusBadgeProps) {
	return <Badge className={cn(COLOR[status], className)}>{LABEL[status]}</Badge>;
}
