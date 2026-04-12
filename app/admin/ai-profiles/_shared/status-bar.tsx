'use client';

import { useQuery } from '@tanstack/react-query';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/utils';

const STATUS_QUERY_KEY = ['admin', 'ghost-injection', 'status'] as const;

function formatPercent(value: number) {
	return `${(value * 100).toFixed(1)}%`;
}

function injectionToneClass(rate: number, cap: number) {
	if (cap <= 0) return 'text-slate-700';
	const ratio = rate / cap;
	if (ratio >= 1) return 'text-red-600 font-semibold';
	if (ratio >= 0.8) return 'text-amber-600 font-semibold';
	return 'text-slate-700';
}

export function AiProfilesStatusBar() {
	const { data, isLoading, isError } = useQuery({
		queryKey: STATUS_QUERY_KEY,
		queryFn: () => ghostInjection.getStatus(),
		refetchInterval: 5000,
		staleTime: 0,
	});

	const flagValue = data?.featureFlag.value ?? false;
	const ltvCap = data?.ltvCap.value ?? 0;
	const injectionRate = data?.currentMetrics.currentInjectionRate ?? 0;
	const activeGhosts = data?.currentMetrics.activeGhostCount ?? 0;
	const thisWeekSent = data?.currentMetrics.thisWeekCandidatesSent ?? 0;

	return (
		<div className="sticky top-0 z-10 flex flex-wrap items-center gap-6 border-b bg-slate-50 px-6 py-3 text-sm">
			<div className="flex items-center gap-2">
				<span className="text-xs uppercase tracking-wider text-slate-500">Feature Flag</span>
				{isLoading ? (
					<Badge variant="outline">로딩…</Badge>
				) : isError ? (
					<Badge variant="outline" className="text-red-600 border-red-300">
						조회 실패
					</Badge>
				) : flagValue ? (
					<Badge className="bg-emerald-500 hover:bg-emerald-500">ON</Badge>
				) : (
					<Badge variant="secondary">OFF</Badge>
				)}
			</div>

			<div className="flex items-center gap-2">
				<span className="text-xs uppercase tracking-wider text-slate-500">침투율</span>
				<span className={cn(injectionToneClass(injectionRate, ltvCap))}>
					{formatPercent(injectionRate)} / {formatPercent(ltvCap)}
				</span>
			</div>

			<div className="flex items-center gap-2">
				<span className="text-xs uppercase tracking-wider text-slate-500">활성 Ghost</span>
				<span className="font-medium text-slate-800">{activeGhosts.toLocaleString()}</span>
			</div>

			<div className="flex items-center gap-2">
				<span className="text-xs uppercase tracking-wider text-slate-500">이번 주 발송</span>
				<span className="font-medium text-slate-800">{thisWeekSent.toLocaleString()}</span>
			</div>
		</div>
	);
}
