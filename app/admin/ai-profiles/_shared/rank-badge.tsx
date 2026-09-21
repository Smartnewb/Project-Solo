import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/utils';

const RANK_STYLES: Record<string, string> = {
	A: 'border-amber-300 bg-amber-50 text-amber-700',
	B: 'border-sky-300 bg-sky-50 text-sky-700',
	C: 'border-slate-300 bg-slate-50 text-slate-600',
};

export function RankBadge({ rank, className }: { rank: string; className?: string }) {
	return (
		<Badge variant="outline" className={cn('text-[10px] font-semibold', RANK_STYLES[rank] ?? RANK_STYLES.C, className)}>
			{rank}
		</Badge>
	);
}
