'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronsUpDown } from 'lucide-react';
import { universities } from '@/app/services/admin';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import type { GhostPhaseBucket, PhaseSchoolItem } from '@/app/types/ghost-injection';
import { useDebounce } from '@/shared/hooks';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/shared/ui/select';
import { cn } from '@/shared/utils';
import { ReasonInput, isReasonValid } from '../_shared/reason-input';
import { ghostInjectionKeys } from '../_shared/query-keys';

interface PhaseSchoolEditDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** null이면 신규 등록 모드 */
	target: PhaseSchoolItem | null;
}

interface SchoolOption {
	id: string;
	name: string;
}

export function PhaseSchoolEditDialog({
	open,
	onOpenChange,
	target,
}: PhaseSchoolEditDialogProps) {
	const toast = useToast();
	const queryClient = useQueryClient();
	const isCreate = target === null;

	const [school, setSchool] = useState<SchoolOption | null>(null);
	const [bucket, setBucket] = useState<GhostPhaseBucket>('TREATMENT');
	const [phase, setPhase] = useState('1');
	const [reason, setReason] = useState('');

	const [schoolSearch, setSchoolSearch] = useState('');
	const debouncedSearch = useDebounce(schoolSearch, 300);
	const [popoverOpen, setPopoverOpen] = useState(false);

	useEffect(() => {
		if (!open) return;
		if (target) {
			setSchool({ id: target.schoolId, name: target.schoolName });
			setBucket(target.bucket);
			setPhase(String(target.phase));
		} else {
			setSchool(null);
			setBucket('TREATMENT');
			setPhase('1');
		}
		setReason('');
		setSchoolSearch('');
	}, [open, target]);

	const schoolsQuery = useQuery({
		queryKey: ['admin', 'universities', 'list', debouncedSearch],
		queryFn: async () => {
			const result = await universities.getList({
				page: 1,
				limit: 30,
				name: debouncedSearch || undefined,
				isActive: true,
			});
			return result as { items: Array<{ id: string; name: string }> };
		},
		enabled: open && isCreate && popoverOpen,
		staleTime: 5 * 60 * 1000,
	});

	const schoolItems = schoolsQuery.data?.items ?? [];

	const mutation = useMutation({
		mutationFn: () => {
			if (!school) throw new Error('학교를 선택해주세요.');
			const phaseNum = Number(phase);
			return ghostInjection.setPhaseSchool(school.id, {
				schoolName: school.name,
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
		Boolean(school) &&
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
						<Label>학교 *</Label>
						{isCreate ? (
							<Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										role="combobox"
										className="w-full justify-between font-normal"
									>
										<span className={cn(!school && 'text-slate-400')}>
											{school?.name ?? '학교를 선택하세요'}
										</span>
										<ChevronsUpDown className="h-4 w-4 opacity-50" />
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
									<div className="border-b p-2">
										<Input
											placeholder="학교명 검색"
											value={schoolSearch}
											onChange={(event) => setSchoolSearch(event.target.value)}
											className="h-8"
										/>
									</div>
									<div className="max-h-60 overflow-y-auto py-1">
										{schoolsQuery.isLoading ? (
											<div className="px-3 py-2 text-xs text-slate-500">불러오는 중…</div>
										) : schoolItems.length === 0 ? (
											<div className="px-3 py-2 text-xs text-slate-500">결과가 없습니다.</div>
										) : (
											schoolItems.map((item) => (
												<button
													key={item.id}
													type="button"
													className="flex w-full items-center justify-between px-3 py-1.5 text-sm hover:bg-slate-100"
													onClick={() => {
														setSchool({ id: item.id, name: item.name });
														setPopoverOpen(false);
													}}
												>
													<span>{item.name}</span>
													{school?.id === item.id ? <Check className="h-4 w-4" /> : null}
												</button>
											))
										)}
									</div>
								</PopoverContent>
							</Popover>
						) : (
							<Input value={school?.name ?? ''} disabled />
						)}
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1">
							<Label>그룹 *</Label>
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
