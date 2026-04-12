'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import type { BackfillProfilesResult } from '@/app/types/ghost-injection';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog';
import { useToast } from '@/shared/ui/admin/toast';
import { Button } from '@/shared/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/shared/ui/dialog';
import { ReasonInput, isReasonValid } from '../_shared/reason-input';
import { ghostInjectionKeys } from '../_shared/query-keys';

interface BackfillDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** 특정 archetype만 백필할 때 */
	archetypeId?: string;
	archetypeName?: string;
}

export function BackfillDialog({
	open,
	onOpenChange,
	archetypeId,
	archetypeName,
}: BackfillDialogProps) {
	const toast = useToast();
	const confirm = useConfirm();
	const queryClient = useQueryClient();
	const [reason, setReason] = useState('');
	const [result, setResult] = useState<BackfillProfilesResult | null>(null);

	const mutation = useMutation({
		mutationFn: () =>
			ghostInjection.backfillProfiles({
				reason: reason.trim(),
				archetypeId,
			}),
		onSuccess: (data) => {
			if (data) {
				setResult(data);
				toast.success(`${data.updated}개 프로필이 재생성되었습니다.`);
			}
			queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.ghosts() });
		},
		onError: (error) => toast.error(getAdminErrorMessage(error)),
	});

	const handleSubmit = async () => {
		if (!isReasonValid(reason)) return;
		const ok = await confirm({
			title: '프로필 일괄 재생성',
			message: archetypeName
				? `"${archetypeName}" 유형의 모든 활성 가상 프로필이 랜덤으로 재생성됩니다. 이 작업은 되돌릴 수 없습니다.`
				: '모든 활성 가상 프로필이 랜덤으로 재생성됩니다. 이 작업은 되돌릴 수 없습니다.',
			confirmText: '재생성',
			severity: 'warning',
		});
		if (!ok) return;
		mutation.mutate();
	};

	const handleClose = () => {
		setReason('');
		setResult(null);
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={(v) => { if (!mutation.isPending) { if (!v) handleClose(); else onOpenChange(v); } }}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>프로필 일괄 재생성</DialogTitle>
					<DialogDescription>
						{archetypeName
							? `"${archetypeName}" 유형의 활성 가상 프로필을 새 랜덤 프로필로 재생성합니다.`
							: '모든 활성 가상 프로필을 새 랜덤 프로필로 재생성합니다.'}
						{' '}이름, 소개글, 키워드가 새로 생성됩니다.
					</DialogDescription>
				</DialogHeader>

				{result ? (
					<div className="space-y-3 py-2">
						<div className="grid grid-cols-3 gap-3 rounded-lg border bg-slate-50 p-4 text-center">
							<div>
								<div className="text-xs text-slate-500">대상</div>
								<div className="text-lg font-semibold tabular-nums text-slate-800">{result.totalFound}</div>
							</div>
							<div>
								<div className="text-xs text-slate-500">성공</div>
								<div className="text-lg font-semibold tabular-nums text-emerald-600">{result.updated}</div>
							</div>
							<div>
								<div className="text-xs text-slate-500">실패</div>
								<div className="text-lg font-semibold tabular-nums text-red-600">{result.failed}</div>
							</div>
						</div>

						{result.failed > 0 && (
							<div className="max-h-40 space-y-1 overflow-y-auto rounded-md border bg-red-50 p-3">
								{result.details
									.filter((d) => d.status === 'failed')
									.map((d) => (
										<div key={d.ghostAccountId} className="flex items-start gap-2 text-xs">
											<XCircle className="mt-0.5 h-3 w-3 shrink-0 text-red-500" />
											<div className="text-red-700">
												<span className="font-mono">{d.ghostAccountId.slice(0, 8)}…</span>
												{d.error && <span className="ml-1 text-red-500">{d.error}</span>}
											</div>
										</div>
									))}
							</div>
						)}
					</div>
				) : (
					<div className="py-2">
						<ReasonInput value={reason} onChange={setReason} minLength={10} />
					</div>
				)}

				<DialogFooter>
					{result ? (
						<Button onClick={handleClose}>닫기</Button>
					) : (
						<>
							<Button variant="outline" onClick={handleClose} disabled={mutation.isPending}>
								취소
							</Button>
							<Button
								onClick={handleSubmit}
								disabled={!isReasonValid(reason) || mutation.isPending}
							>
								{mutation.isPending ? (
									<><Loader2 className="mr-1 h-4 w-4 animate-spin" /> 재생성 중…</>
								) : (
									'재생성 실행'
								)}
							</Button>
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
