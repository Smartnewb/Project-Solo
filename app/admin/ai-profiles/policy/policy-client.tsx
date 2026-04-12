'use client';

import { useQuery } from '@tanstack/react-query';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { ghostInjectionKeys } from '../_shared/query-keys';
import { CooldownCard } from './cooldown-card';
import { FeatureFlagCard } from './feature-flag-card';
import { LtvCapCard } from './ltv-cap-card';

export function PolicyClient() {
	const { data: status, isLoading, isError } = useQuery({
		queryKey: ghostInjectionKeys.status(),
		queryFn: () => ghostInjection.getStatus(),
	});

	return (
		<section className="px-6 py-8">
			<header className="mb-6">
				<h1 className="text-2xl font-semibold text-slate-900">노출 정책</h1>
				<p className="mt-1 text-sm text-slate-500">
					가상 매칭 시스템의 노출 정책을 관리합니다. 모든 변경은 감사 로그에 기록됩니다.
				</p>
			</header>

			{isError ? (
				<Alert variant="destructive" className="mb-4">
					<AlertDescription>현재 정책 상태를 불러오지 못했습니다.</AlertDescription>
				</Alert>
			) : null}

			{isLoading ? (
				<div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
					정책 상태 불러오는 중…
				</div>
			) : (
				<div className="grid gap-4">
					<FeatureFlagCard status={status} />
					<LtvCapCard status={status} />
					<CooldownCard status={status} />
				</div>
			)}
		</section>
	);
}
