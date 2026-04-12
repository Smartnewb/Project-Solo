import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/utils';
import type { GhostAccountStatus } from '@/app/types/ghost-injection';

interface GhostStatusBadgeProps {
	status: GhostAccountStatus;
	isExhausted: boolean;
	className?: string;
}

export function GhostStatusBadge({ status, isExhausted, className }: GhostStatusBadgeProps) {
	if (isExhausted) {
		return (
			<Badge className={cn('bg-amber-500 hover:bg-amber-500', className)}>소진됨</Badge>
		);
	}
	if (status === 'ACTIVE') {
		return <Badge className={cn('bg-emerald-500 hover:bg-emerald-500', className)}>ACTIVE</Badge>;
	}
	return (
		<Badge className={cn('bg-slate-300 text-slate-700 hover:bg-slate-300', className)}>
			INACTIVE
		</Badge>
	);
}
