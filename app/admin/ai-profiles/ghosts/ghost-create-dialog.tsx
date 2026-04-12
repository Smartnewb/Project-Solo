'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Sparkles, X } from 'lucide-react';
import { universities } from '@/app/services/admin';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import type { CreateGhostResult } from '@/app/types/ghost-injection';
import { useDebounce } from '@/shared/hooks';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { useToast } from '@/shared/ui/admin/toast';
import { Badge } from '@/shared/ui/badge';
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

interface GhostCreateDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

interface SelectableOption {
	id: string;
	name: string;
}

export function GhostCreateDialog({ open, onOpenChange }: GhostCreateDialogProps) {
	const toast = useToast();
	const queryClient = useQueryClient();

	const [archetypeId, setArchetypeId] = useState('');
	const [university, setUniversity] = useState<SelectableOption | null>(null);
	const [department, setDepartment] = useState<SelectableOption | null>(null);
	const [phaseSchoolIds, setPhaseSchoolIds] = useState<string[]>([]);
	const [reason, setReason] = useState('');
	const [universitySearch, setUniversitySearch] = useState('');
	const debouncedUniversitySearch = useDebounce(universitySearch, 300);
	const [universityPopoverOpen, setUniversityPopoverOpen] = useState(false);
	const [departmentPopoverOpen, setDepartmentPopoverOpen] = useState(false);
	const [createdResult, setCreatedResult] = useState<CreateGhostResult | null>(null);

	useEffect(() => {
		if (open) {
			setArchetypeId('');
			setUniversity(null);
			setDepartment(null);
			setPhaseSchoolIds([]);
			setReason('');
			setUniversitySearch('');
			setCreatedResult(null);
		}
	}, [open]);

	const archetypesQuery = useQuery({
		queryKey: ghostInjectionKeys.archetypes(),
		queryFn: () => ghostInjection.listArchetypes(),
		enabled: open,
	});

	const phaseSchoolsQuery = useQuery({
		queryKey: ghostInjectionKeys.phaseSchoolList({ bucket: 'TREATMENT' }),
		queryFn: () => ghostInjection.listPhaseSchools({ bucket: 'TREATMENT' }),
		enabled: open,
	});

	const universitiesQuery = useQuery({
		queryKey: ['admin', 'universities', 'list', debouncedUniversitySearch],
		queryFn: async () => {
			const result = await universities.getList({
				page: 1,
				limit: 30,
				name: debouncedUniversitySearch || undefined,
				isActive: true,
			});
			return result as { items: Array<{ id: string; name: string }> };
		},
		enabled: open && universityPopoverOpen,
		staleTime: 5 * 60 * 1000,
	});

	const departmentsQuery = useQuery({
		queryKey: ['admin', 'universities', university?.id ?? 'none', 'departments'],
		queryFn: async () => {
			if (!university) return { items: [] as Array<{ id: string; name: string }> };
			const result = await universities.departments.getList(university.id, {
				page: 1,
				limit: 200,
				isActive: true,
			});
			return result as { items: Array<{ id: string; name: string }> };
		},
		enabled: open && Boolean(university?.id),
	});

	const archetypeItems = archetypesQuery.data?.items ?? [];
	const phaseSchoolItems = phaseSchoolsQuery.data?.items ?? [];
	const universityItems = universitiesQuery.data?.items ?? [];
	const departmentItems = departmentsQuery.data?.items ?? [];

	const togglePhaseSchool = (schoolId: string) => {
		setPhaseSchoolIds((prev) =>
			prev.includes(schoolId) ? prev.filter((id) => id !== schoolId) : [...prev, schoolId],
		);
	};

	const mutation = useMutation({
		mutationFn: () =>
			ghostInjection.createGhost({
				personaArchetypeId: archetypeId,
				phaseSchoolIds,
				universityId: university!.id,
				departmentId: department!.id,
				reason: reason.trim(),
			}),
		onSuccess: (data) => {
			toast.success('가상 프로필이 생성되었습니다.');
			queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.ghosts() });
			queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.status() });
			setCreatedResult(data ?? null);
		},
		onError: (error) => toast.error(getAdminErrorMessage(error)),
	});

	const canSubmit = useMemo(
		() =>
			Boolean(archetypeId) &&
			Boolean(university?.id) &&
			Boolean(department?.id) &&
			phaseSchoolIds.length > 0 &&
			isReasonValid(reason) &&
			!mutation.isPending,
		[archetypeId, university?.id, department?.id, phaseSchoolIds.length, reason, mutation.isPending],
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-xl">
				{createdResult ? (
					<>
						<DialogHeader>
							<DialogTitle>가상 프로필이 생성되었습니다</DialogTitle>
							<DialogDescription>
								프로필 유형 특성에 맞춰 아래 프로필이 자동 생성되었습니다. 비활성 상태이며, 활성화 후 매칭에 투입됩니다.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 py-2">
							<div className="rounded-lg border bg-slate-50 p-4 space-y-3">
								<div className="grid grid-cols-3 gap-3 text-sm">
									<div>
										<div className="text-xs text-slate-500">이름</div>
										<div className="font-semibold text-slate-800">{createdResult.name}</div>
									</div>
									<div>
										<div className="text-xs text-slate-500">나이</div>
										<div className="font-semibold text-slate-800">만 {createdResult.age}세</div>
									</div>
									<div>
										<div className="text-xs text-slate-500">MBTI</div>
										<div className="font-semibold text-slate-800">{createdResult.mbti ?? '—'}</div>
									</div>
								</div>

								{createdResult.introduction && (
									<div>
										<div className="flex items-center gap-2 mb-1">
											<span className="text-xs text-slate-500">자기소개</span>
											{createdResult.introductionSource === 'ai' && (
												<Badge variant="outline" className="border-violet-200 bg-violet-50 text-[10px] text-violet-700">
													<Sparkles className="mr-0.5 h-2.5 w-2.5" /> AI 생성
												</Badge>
											)}
										</div>
										<p className="text-sm text-slate-700 whitespace-pre-line rounded-md bg-white border px-3 py-2">
											{createdResult.introduction}
										</p>
									</div>
								)}

								{createdResult.keywords && createdResult.keywords.length > 0 && (
									<div>
										<div className="text-xs text-slate-500 mb-1">키워드</div>
										<div className="flex flex-wrap gap-1.5">
											{createdResult.keywords.map((kw) => (
												<Badge key={kw} variant="outline" className="text-xs">
													{kw}
												</Badge>
											))}
										</div>
									</div>
								)}
							</div>

							<p className="text-xs text-slate-500">
								ID: {createdResult.ghostAccountId}
							</p>
						</div>

						<DialogFooter>
							<Button variant="outline" onClick={() => { setCreatedResult(null); }}>
								추가 생성
							</Button>
							<Button onClick={() => onOpenChange(false)}>
								닫기
							</Button>
						</DialogFooter>
					</>
				) : (
					<>
				<DialogHeader>
					<DialogTitle>가상 프로필 생성</DialogTitle>
					<DialogDescription>
						프로필 유형을 선택하면 해당 특성(나이·MBTI·키워드)에 맞춰 가상 프로필이 자동 생성됩니다. 생성 직후 비활성 상태로 시작됩니다.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div className="space-y-1">
						<Label>프로필 유형 *</Label>
						<Select value={archetypeId} onValueChange={setArchetypeId}>
							<SelectTrigger>
								<SelectValue placeholder="프로필 유형을 선택하세요" />
							</SelectTrigger>
							<SelectContent>
								{archetypeItems.length === 0 ? (
									<div className="px-3 py-2 text-xs text-slate-500">
										{archetypesQuery.isLoading ? '불러오는 중…' : '등록된 프로필 유형이 없습니다. 프로필 유형 메뉴에서 먼저 추가하세요.'}
									</div>
								) : (
									archetypeItems.map((item) => (
										<SelectItem key={item.archetypeId} value={item.archetypeId}>
											{item.name}
										</SelectItem>
									))
								)}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1">
						<Label>소속 대학 *</Label>
						<Popover open={universityPopoverOpen} onOpenChange={setUniversityPopoverOpen}>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									role="combobox"
									className="w-full justify-between font-normal"
								>
									<span className={cn(!university && 'text-slate-400')}>
										{university?.name ?? '대학을 선택하세요'}
									</span>
									<ChevronsUpDown className="h-4 w-4 opacity-50" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
								<div className="border-b p-2">
									<Input
										placeholder="대학명 검색"
										value={universitySearch}
										onChange={(event) => setUniversitySearch(event.target.value)}
										className="h-8"
									/>
								</div>
								<div className="max-h-60 overflow-y-auto py-1">
									{universitiesQuery.isLoading ? (
										<div className="px-3 py-2 text-xs text-slate-500">불러오는 중…</div>
									) : universityItems.length === 0 ? (
										<div className="px-3 py-2 text-xs text-slate-500">결과가 없습니다.</div>
									) : (
										universityItems.map((item) => (
											<button
												key={item.id}
												type="button"
												className="flex w-full items-center justify-between px-3 py-1.5 text-sm hover:bg-slate-100"
												onClick={() => {
													setUniversity({ id: item.id, name: item.name });
													setDepartment(null);
													setUniversityPopoverOpen(false);
												}}
											>
												<span>{item.name}</span>
												{university?.id === item.id ? <Check className="h-4 w-4" /> : null}
											</button>
										))
									)}
								</div>
							</PopoverContent>
						</Popover>
					</div>

					<div className="space-y-1">
						<Label>학과 *</Label>
						<Popover
							open={departmentPopoverOpen}
							onOpenChange={(value) => {
								if (!university) return;
								setDepartmentPopoverOpen(value);
							}}
						>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									role="combobox"
									disabled={!university}
									className="w-full justify-between font-normal"
								>
									<span className={cn(!department && 'text-slate-400')}>
										{department?.name ?? (university ? '학과를 선택하세요' : '대학을 먼저 선택하세요')}
									</span>
									<ChevronsUpDown className="h-4 w-4 opacity-50" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
								<div className="max-h-60 overflow-y-auto py-1">
									{departmentsQuery.isLoading ? (
										<div className="px-3 py-2 text-xs text-slate-500">불러오는 중…</div>
									) : departmentItems.length === 0 ? (
										<div className="px-3 py-2 text-xs text-slate-500">등록된 학과가 없습니다.</div>
									) : (
										departmentItems.map((item) => (
											<button
												key={item.id}
												type="button"
												className="flex w-full items-center justify-between px-3 py-1.5 text-sm hover:bg-slate-100"
												onClick={() => {
													setDepartment({ id: item.id, name: item.name });
													setDepartmentPopoverOpen(false);
												}}
											>
												<span>{item.name}</span>
												{department?.id === item.id ? <Check className="h-4 w-4" /> : null}
											</button>
										))
									)}
								</div>
							</PopoverContent>
						</Popover>
					</div>

					<div className="space-y-1">
						<Label>노출 대상 학교 * ({phaseSchoolIds.length}개 선택)</Label>
						<div className="max-h-40 overflow-y-auto rounded-md border bg-slate-50 p-2">
							{phaseSchoolsQuery.isLoading ? (
								<p className="px-2 py-1 text-xs text-slate-500">불러오는 중…</p>
							) : phaseSchoolItems.length === 0 ? (
								<p className="px-2 py-1 text-xs text-slate-500">
									실험군 학교가 없습니다. 학교 설정에서 먼저 등록하세요.
								</p>
							) : (
								<div className="flex flex-wrap gap-1.5">
									{phaseSchoolItems.map((item) => {
										const active = phaseSchoolIds.includes(item.schoolId);
										return (
											<button
												key={item.schoolId}
												type="button"
												onClick={() => togglePhaseSchool(item.schoolId)}
												className={cn(
													'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
													active
														? 'border-primary bg-primary text-white'
														: 'border-slate-200 bg-white text-slate-600 hover:border-primary',
												)}
											>
												{item.schoolName}
												{active ? <X className="ml-1 inline h-3 w-3" /> : null}
											</button>
										);
									})}
								</div>
							)}
						</div>
						<p className="text-xs text-slate-500">
							이 가상 프로필이 노출될 학교를 하나 이상 선택하세요.
						</p>
					</div>

					<ReasonInput value={reason} onChange={setReason} minLength={10} />
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
						취소
					</Button>
					<Button onClick={() => mutation.mutate()} disabled={!canSubmit}>
						{mutation.isPending ? '생성 중…' : '생성'}
					</Button>
				</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
