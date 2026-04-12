'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import type { GhostPhaseBucket, PhaseSchoolItem } from '@/app/types/ghost-injection';
import { AdminApiError } from '@/shared/lib/http/admin-fetch';
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
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/shared/ui/select';
import { ReasonInput, isReasonValid } from '../_shared/reason-input';
import { ghostInjectionKeys } from '../_shared/query-keys';

interface PhaseSchoolEditDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** null이면 신규 등록 모드(schoolId 입력 필요) */
	target: PhaseSchoolItem | null;
}

export function PhaseSchoolEditDialog({
	open,
	onOpenChange,
	target,
}: PhaseSchoolEditDialogProps) {
	const toast = useToast();
	const queryClient = useQueryClient();
	const isCreate = target === null;
	const [schoolId, setSchoolId] = useState('');
	const [schoolName, setSchoolName] = useState('');
	const [bucket, setBucket] = useState<GhostPhaseBucket>('TREATMENT');
	const [phase, setPhase] = useState('1');
	const [reason, setReason] = useState('');

	useEffect(() => {
		if (!open) return;
		if (target) {
			setSchoolId(target.schoolId);
			setSchoolName(target.schoolName);
			setBucket(target.bucket);
			setPhase(String(target.phase));
		} else {
			setSchoolId('');
			setSchoolName('');
			setBucket('TREATMENT');
			setPhase('1');
		}
		setReason('');
	}, [open, target]);

	const mutation = useMutation({
		mutationFn: () => {
			const phaseNum = Number(phase);
			return ghostInjection.setPhaseSchool(schoolId.trim(), {
				schoolName: schoolName.trim(),
				bucket,
				phase: phaseNum,
				reason: reason.trim(),
			});
		},
		onSuccess: () => {
			toast.success(isCreate ? '실험 그룹이 등록되었습니다.' : '실험 그룹이 수정되었습니다.');
			queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.phaseSchools() });
			onOpenChange(false);
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

	const phaseNum = Number(phase);
	const canSubmit =
		schoolId.trim().length > 0 &&
		schoolName.trim().length >= 2 &&
		Number.isFinite(phaseNum) &&
		phaseNum >= 1 &&
		isReasonValid(reason) &&
		!mutation.isPending;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{isCreate ? '실험 그룹 등록' : `실험 그룹 수정 — ${target?.schoolName}`}
					</DialogTitle>
					<DialogDescription>
						학교를 실험군 또는 대조군에 배정합니다. 실험군 학교의 유저에게만 가상 프로필이 노출됩니다.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div className="space-y-1">
						<Label htmlFor="phase-school-id">학교 ID *</Label>
						<Input
							id="phase-school-id"
							value={schoolId}
							onChange={(event) => setSchoolId(event.target.value)}
							disabled={!isCreate}
							placeholder="UUID 형식"
						/>
					</div>

					<div className="space-y-1">
						<Label htmlFor="phase-school-name">학교명 *</Label>
						<Input
							id="phase-school-name"
							value={schoolName}
							onChange={(event) => setSchoolName(event.target.value)}
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1">
							<Label>버킷 *</Label>
							<Select value={bucket} onValueChange={(value) => setBucket(value as GhostPhaseBucket)}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="TREATMENT">실험군 (TREATMENT)</SelectItem>
									<SelectItem value="CONTROL">대조군 (CONTROL)</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1">
							<Label htmlFor="phase-school-phase">Phase *</Label>
							<Input
								id="phase-school-phase"
								type="number"
								min={1}
								value={phase}
								onChange={(event) => setPhase(event.target.value)}
							/>
						</div>
					</div>

					<ReasonInput value={reason} onChange={setReason} minLength={10} />
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
						취소
					</Button>
					<Button onClick={() => mutation.mutate()} disabled={!canSubmit}>
						{mutation.isPending ? '저장 중…' : isCreate ? '등록' : '수정'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
