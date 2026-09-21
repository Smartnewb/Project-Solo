'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Database, Sparkles, TrendingUp, Zap, type LucideIcon } from 'lucide-react';
import { ghostReferencePool } from '@/app/services/admin/ghost-reference-pool';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/utils';
import { referencePoolKeys } from '../_shared/query-keys';

interface ReferencePoolStatsProps {
	onCreateBatch: () => void;
	onImportFromGhost: () => void;
	onImportFromUser: () => void;
}

export function ReferencePoolStats({ onCreateBatch, onImportFromGhost, onImportFromUser }: ReferencePoolStatsProps) {
	const { data, isLoading } = useQuery({
		queryKey: referencePoolKeys.stats(),
		queryFn: () => ghostReferencePool.getStats(),
		refetchInterval: 30_000,
	});

	const total = data?.total ?? 0;
	const active = data?.active ?? 0;
	const avgUsage = data?.avgUsage ?? 0;
	const last24hUsage = data?.last24hUsage ?? 0;
	const breach = data?.minThresholdBreach ?? false;

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
				<StatCard icon={Database} label="전체 풀" value={total} loading={isLoading} />
				<StatCard
					icon={Sparkles}
					label="활성 풀"
					value={active}
					loading={isLoading}
					tone={breach ? 'danger' : 'success'}
				/>
				<StatCard
					icon={TrendingUp}
					label="평균 사용 횟수"
					value={avgUsage.toFixed(1)}
					loading={isLoading}
				/>
				<StatCard
					icon={Zap}
					label="24시간 사용"
					value={last24hUsage}
					loading={isLoading}
				/>
			</div>

			{breach ? (
				<div className="flex items-center justify-between rounded-lg border border-red-300 bg-red-50 px-4 py-3">
					<div className="flex items-center gap-2">
						<AlertTriangle className="h-5 w-5 text-red-600" />
						<div>
							<p className="text-sm font-semibold text-red-700">활성 풀이 부족합니다</p>
							<p className="text-xs text-red-600">
								활성 레퍼런스가 30장 미만입니다. 풀을 보충해주세요.
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Button size="sm" onClick={onImportFromUser}>
							유저 사진 임포트
						</Button>
						<Button variant="outline" size="sm" onClick={onImportFromGhost}>
							Ghost 임포트
						</Button>
						<Button variant="outline" size="sm" onClick={onCreateBatch}>
							AI 생성
						</Button>
					</div>
				</div>
			) : null}
		</div>
	);
}

interface StatCardProps {
	icon: LucideIcon;
	label: string;
	value: number | string;
	loading?: boolean;
	tone?: 'default' | 'success' | 'danger';
}

function StatCard({ icon: Icon, label, value, loading, tone = 'default' }: StatCardProps) {
	return (
		<div className="rounded-lg border bg-white p-4">
			<div className="flex items-center gap-2 text-xs text-slate-500">
				<Icon className="h-3.5 w-3.5" />
				<span>{label}</span>
			</div>
			<div
				className={cn(
					'mt-2 text-2xl font-semibold tabular-nums',
					tone === 'success' && 'text-emerald-600',
					tone === 'danger' && 'text-red-600',
					tone === 'default' && 'text-slate-900',
				)}
			>
				{loading ? '—' : value.toLocaleString()}
			</div>
		</div>
	);
}
