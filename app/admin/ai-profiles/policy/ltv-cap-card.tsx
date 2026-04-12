'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import type { GhostInjectionStatus } from '@/app/types/ghost-injection';
import { AdminApiError } from '@/shared/lib/http/admin-fetch';
import { useToast } from '@/shared/ui/admin/toast';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Slider } from '@/shared/ui/slider';
import { cn } from '@/shared/utils';
import { ReasonInput, isReasonValid } from '../_shared/reason-input';
import { ghostInjectionKeys } from '../_shared/query-keys';

interface LtvCapCardProps {
	status?: GhostInjectionStatus;
}

const MIN_CAP = 5;
const MAX_CAP = 50;
const STEP = 5;

function formatPercent(value: number): string {
	return `${(value * 100).toFixed(1)}%`;
}

export function LtvCapCard({ status }: LtvCapCardProps) {
	const toast = useToast();
	const queryClient = useQueryClient();
	const currentCap = status?.ltvCap.value ?? 0;
	const currentRate = status?.currentMetrics.currentInjectionRate ?? 0;

	const [percent, setPercent] = useState<number>(() => Math.round(currentCap * 100));
	const [reason, setReason] = useState('');

	useEffect(() => {
		if (status?.ltvCap.value !== undefined) {
			setPercent(Math.round(status.ltvCap.value * 100));
		}
	}, [status?.ltvCap.value]);

	const mutation = useMutation({
		mutationFn: () =>
			ghostInjection.setLtvCap({
				newCap: percent / 100,
				reason: reason.trim(),
			}),
		onSuccess: () => {
			toast.success(`LTV Cap을 ${percent}%로 설정했습니다.`);
			queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.status() });
			setReason('');
		},
		onError: (error) => {
			const msg =
				error instanceof AdminApiError
					? ((error.body as { message?: string } | null)?.message ?? error.message)
					: error instanceof Error
					  ? error.message
					  : '요청 실패';
			toast.error(msg);
		},
	});

	const newCapDecimal = percent / 100;
	const rateRatio = newCapDecimal > 0 ? currentRate / newCapDecimal : 0;
	const toneClass = cn(
		rateRatio >= 1
			? 'text-red-600'
			: rateRatio >= 0.8
			  ? 'text-amber-600'
			  : 'text-slate-700',
		'font-semibold',
	);
	const changed = percent !== Math.round(currentCap * 100);

	return (
		<Card>
			<CardHeader>
				<CardTitle>LTV Cap</CardTitle>
				<CardDescription>
					전체 매칭 중 Ghost 매칭 비율 상한. 현재 침투율이 Cap의 80% 이상이면 경고 색상 표시.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
					<div>
						<div className="text-xs text-slate-500">현재 Cap</div>
						<div className="font-semibold text-slate-800">{formatPercent(currentCap)}</div>
					</div>
					<div>
						<div className="text-xs text-slate-500">현재 침투율</div>
						<div className={toneClass}>{formatPercent(currentRate)}</div>
					</div>
					<div>
						<div className="text-xs text-slate-500">신규 Cap (미리보기)</div>
						<div className="font-semibold text-primary">{percent}%</div>
					</div>
				</div>

				<div className="space-y-2">
					<div className="flex items-center justify-between text-xs text-slate-500">
						<span>{MIN_CAP}%</span>
						<span>{MAX_CAP}%</span>
					</div>
					<Slider
						min={MIN_CAP}
						max={MAX_CAP}
						step={STEP}
						value={[percent]}
						onValueChange={(value) => setPercent(value[0] ?? MIN_CAP)}
					/>
				</div>

				<ReasonInput value={reason} onChange={setReason} minLength={10} />

				<div className="flex justify-end">
					<Button
						onClick={() => mutation.mutate()}
						disabled={!changed || !isReasonValid(reason) || mutation.isPending}
					>
						{mutation.isPending ? '저장 중…' : '적용'}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
