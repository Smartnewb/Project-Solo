'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog';
import { useToast } from '@/shared/ui/admin/toast';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { ReasonInput, isReasonValid } from '../_shared/reason-input';
import { ghostInjectionKeys } from '../_shared/query-keys';

function currentWeekYear(): string {
	const d = new Date();
	const year = d.getUTCFullYear();
	const start = new Date(Date.UTC(year, 0, 1));
	const diff = (d.getTime() - start.getTime()) / 86400000;
	const week = Math.floor((diff + start.getUTCDay() + 1) / 7) + 1;
	return `${year}-W${String(week).padStart(2, '0')}`;
}

export function CandidateGenerateDialog() {
	const toast = useToast();
	const confirm = useConfirm();
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);
	const [weekYear, setWeekYear] = useState(() => currentWeekYear());
	const [dryRun, setDryRun] = useState(true);
	const [reason, setReason] = useState('');
	const [dryRunCount, setDryRunCount] = useState<number | null>(null);

	const resetState = () => {
		setWeekYear(currentWeekYear());
		setDryRun(true);
		setReason('');
		setDryRunCount(null);
	};

	const mutation = useMutation({
		mutationFn: (vars: { weekYear: string; dryRun: boolean; reason: string }) =>
			ghostInjection.generateWeekly({
				weekYear: vars.weekYear,
				dryRun: vars.dryRun,
				reason: vars.reason,
			}),
		onSuccess: (result, vars) => {
			if (vars.dryRun) {
				setDryRunCount(result.count);
				toast.success('예상 후보 수를 계산했습니다.');
				return;
			}
			toast.success(`${result.count}건의 주간 후보가 생성되었습니다.`);
			queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.candidates() });
			queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.status() });
			setOpen(false);
			resetState();
		},
		onError: (error) => toast.error(getAdminErrorMessage(error)),
	});

	const handleSubmit = async () => {
		const trimmedWeek = weekYear.trim();
		if (!trimmedWeek) {
			toast.error('주차를 입력해주세요. (예: 2026-W17)');
			return;
		}
		if (!isReasonValid(reason)) {
			toast.error('사유를 10자 이상 입력해주세요.');
			return;
		}
		if (!dryRun) {
			const ok = await confirm({
				title: '주간 후보를 생성하시겠어요?',
				message: `${trimmedWeek} 주차의 후보가 실제 DB에 기록됩니다.`,
				severity: 'warning',
				confirmText: '실제 생성',
			});
			if (!ok) return;
		}
		mutation.mutate({ weekYear: trimmedWeek, dryRun, reason: reason.trim() });
	};

	return (
		<>
			<Button
				onClick={() => {
					resetState();
					setOpen(true);
				}}
			>
				<Plus className="mr-1 h-4 w-4" /> 주간 후보 생성
			</Button>

			<Dialog
				open={open}
				onOpenChange={(next) => {
					setOpen(next);
					if (!next) resetState();
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>주간 후보 생성</DialogTitle>
						<DialogDescription>
							지정한 주차에 대해 가상 매칭 후보를 생성합니다. dryRun으로 먼저 예상 개수를 확인하세요.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3">
						<div className="space-y-1">
							<Label className="text-xs">주차 (예: 2026-W17)</Label>
							<Input
								value={weekYear}
								onChange={(event) => setWeekYear(event.target.value)}
								placeholder="2026-W17"
								disabled={mutation.isPending}
							/>
						</div>

						<label className="flex items-center gap-2 text-sm text-slate-700">
							<input
								type="checkbox"
								checked={dryRun}
								onChange={(event) => {
									setDryRun(event.target.checked);
									setDryRunCount(null);
								}}
								disabled={mutation.isPending}
								className="h-4 w-4 cursor-pointer"
							/>
							dryRun (실제 저장 없이 예상 개수만 확인)
						</label>

						<ReasonInput
							value={reason}
							onChange={setReason}
							minLength={10}
							disabled={mutation.isPending}
						/>

						{dryRunCount !== null ? (
							<Alert>
								<AlertDescription>
									{dryRunCount}건이 생성될 예정입니다.
								</AlertDescription>
							</Alert>
						) : null}
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setOpen(false)}
							disabled={mutation.isPending}
						>
							취소
						</Button>
						<Button onClick={handleSubmit} disabled={mutation.isPending}>
							{mutation.isPending
								? '처리 중…'
								: dryRun
									? '예상 개수 확인'
									: '실제 생성'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
