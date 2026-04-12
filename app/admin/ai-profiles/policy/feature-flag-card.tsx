'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import type { GhostInjectionStatus } from '@/app/types/ghost-injection';
import { AdminApiError } from '@/shared/lib/http/admin-fetch';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog';
import { useToast } from '@/shared/ui/admin/toast';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Switch } from '@/shared/ui/switch';
import { ReasonInput, isReasonValid } from '../_shared/reason-input';
import { ghostInjectionKeys } from '../_shared/query-keys';

interface FeatureFlagCardProps {
	status?: GhostInjectionStatus;
}

function formatDateTime(value: string | null): string {
	if (!value) return '—';
	try {
		return new Date(value).toLocaleString('ko-KR');
	} catch {
		return value;
	}
}

export function FeatureFlagCard({ status }: FeatureFlagCardProps) {
	const toast = useToast();
	const confirm = useConfirm();
	const queryClient = useQueryClient();
	const [reason, setReason] = useState('');

	const current = status?.featureFlag.value ?? false;

	const mutation = useMutation({
		mutationFn: ({ value, reason }: { value: boolean; reason: string }) =>
			ghostInjection.setFeatureFlag({ value, reason }),
		onSuccess: (_, variables) => {
			toast.success(
				variables.value ? 'Feature Flag 활성화되었습니다.' : 'Feature Flag 비활성화되었습니다.',
			);
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

	const handleToggle = async () => {
		if (!isReasonValid(reason)) {
			toast.error('변경 사유를 10자 이상 입력해주세요.');
			return;
		}
		const nextValue = !current;

		if (nextValue) {
			const ok = await confirm({
				title: 'Feature Flag 활성화',
				message:
					'Ghost Injection 전체 주입이 활성화됩니다. 정말 진행하시겠어요? (비상 시 /비상 롤백 페이지에서 즉시 차단 가능)',
				confirmText: '활성화',
				severity: 'warning',
			});
			if (!ok) return;
		}

		mutation.mutate({ value: nextValue, reason: reason.trim() });
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Feature Flag</CardTitle>
						<CardDescription>Ghost Injection 전체 ON/OFF</CardDescription>
					</div>
					{current ? (
						<Badge className="bg-emerald-500 hover:bg-emerald-500">ON</Badge>
					) : (
						<Badge variant="secondary">OFF</Badge>
					)}
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="text-xs text-slate-500">
					마지막 변경: {formatDateTime(status?.featureFlag.updatedAt ?? null)}
					{status?.featureFlag.updatedBy ? ` · ${status.featureFlag.updatedBy}` : ''}
				</div>

				<ReasonInput value={reason} onChange={setReason} minLength={10} />

				<div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
					<div className="flex items-center gap-3">
						<Switch checked={current} disabled />
						<span className="text-sm text-slate-600">
							현재 상태: <strong>{current ? '활성 (ON)' : '비활성 (OFF)'}</strong>
						</span>
					</div>
					<Button onClick={handleToggle} disabled={mutation.isPending || !isReasonValid(reason)}>
						{mutation.isPending ? '처리 중…' : current ? '비활성화' : '활성화'}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
