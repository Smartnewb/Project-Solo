'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import type { GhostInjectionStatus } from '@/app/types/ghost-injection';
import { AdminApiError } from '@/shared/lib/http/admin-fetch';
import { useToast } from '@/shared/ui/admin/toast';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { ReasonInput, isReasonValid } from '../_shared/reason-input';
import { ghostInjectionKeys } from '../_shared/query-keys';

interface CooldownCardProps {
	status?: GhostInjectionStatus;
}

export function CooldownCard({ status }: CooldownCardProps) {
	const toast = useToast();
	const queryClient = useQueryClient();
	const current = status?.cooldown.cooldownCount ?? 0;
	const [cooldown, setCooldown] = useState<string>(String(current));
	const [reason, setReason] = useState('');

	useEffect(() => {
		setCooldown(String(current));
	}, [current]);

	const mutation = useMutation({
		mutationFn: () => {
			const num = Number(cooldown);
			return ghostInjection.setCooldown({ cooldownCount: num, reason: reason.trim() });
		},
		onSuccess: () => {
			toast.success('Cooldown 정책이 업데이트되었습니다.');
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

	const num = Number(cooldown);
	const valid = Number.isFinite(num) && num >= 0 && num <= 50;
	const changed = num !== current;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Cooldown</CardTitle>
				<CardDescription>
					Ghost 노출 후 다음 노출까지 일반 매칭 최소 횟수. 너무 낮으면 연속 Ghost 노출 위험.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
					<div>
						<div className="text-xs text-slate-500">현재 Cooldown</div>
						<div className="font-semibold text-slate-800">{current}회</div>
					</div>
					<div>
						<div className="text-xs text-slate-500">신규 (미리보기)</div>
						<div className="font-semibold text-primary">{valid ? `${num}회` : '—'}</div>
					</div>
				</div>

				<div className="space-y-1">
					<Label htmlFor="cooldown-count">Cooldown 횟수</Label>
					<Input
						id="cooldown-count"
						type="number"
						min={0}
						max={50}
						value={cooldown}
						onChange={(event) => setCooldown(event.target.value)}
					/>
					<p className="text-xs text-slate-500">0~50 범위. 권장 값 3~5.</p>
				</div>

				<ReasonInput value={reason} onChange={setReason} minLength={10} />

				<div className="flex justify-end">
					<Button
						onClick={() => mutation.mutate()}
						disabled={!changed || !valid || !isReasonValid(reason) || mutation.isPending}
					>
						{mutation.isPending ? '저장 중…' : '적용'}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
