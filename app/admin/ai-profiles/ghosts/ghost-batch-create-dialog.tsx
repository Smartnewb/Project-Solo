'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CheckCircle2, ChevronsUpDown, Loader2, Minus, Plus, Sparkles, XCircle } from 'lucide-react';
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

interface GhostBatchCreateDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

interface SelectableOption {
	id: string;
	name: string;
}

interface ArchetypeRow {
	id: string; // local key
	archetypeId: string;
	count: number;
}

type BatchItemStatus = 'pending' | 'creating' | 'success' | 'error';

interface BatchResultItem {
	rowId: string;
	archetypeName: string;
	index: number;
	status: BatchItemStatus;
	result?: CreateGhostResult;
	error?: string;
}

let rowIdCounter = 0;
function nextRowId() {
	return `row_${++rowIdCounter}`;
}

export function GhostBatchCreateDialog({ open, onOpenChange }: GhostBatchCreateDialogProps) {
	const toast = useToast();
	const queryClient = useQueryClient();

	// ── Shared settings ──
	const [university, setUniversity] = useState<SelectableOption | null>(null);
	const [department, setDepartment] = useState<SelectableOption | null>(null);
	const [phaseSchoolIds, setPhaseSchoolIds] = useState<string[]>([]);
	const [reason, setReason] = useState('');
	const [universitySearch, setUniversitySearch] = useState('');
	const debouncedUniversitySearch = useDebounce(universitySearch, 300);
	const [universityPopoverOpen, setUniversityPopoverOpen] = useState(false);
	const [departmentPopoverOpen, setDepartmentPopoverOpen] = useState(false);

	// ── Archetype rows ──
	const [rows, setRows] = useState<ArchetypeRow[]>([{ id: nextRowId(), archetypeId: '', count: 1 }]);

	// ── Results ──
	const [results, setResults] = useState<BatchResultItem[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [phase, setPhase] = useState<'form' | 'result'>('form');

	useEffect(() => {
		if (open) {
			setUniversity(null);
			setDepartment(null);
			setPhaseSchoolIds([]);
			setReason('');
			setUniversitySearch('');
			setRows([{ id: nextRowId(), archetypeId: '', count: 1 }]);
			setResults([]);
			setIsSubmitting(false);
			setPhase('form');
		}
	}, [open]);

	// ── Queries ──
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

	const archetypeMap = useMemo(() => {
		const map = new Map<string, string>();
		for (const item of archetypeItems) {
			map.set(item.archetypeId, item.name);
		}
		return map;
	}, [archetypeItems]);

	// ── Row management ──
	const addRow = () => {
		setRows((prev) => [...prev, { id: nextRowId(), archetypeId: '', count: 1 }]);
	};

	const removeRow = (id: string) => {
		setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
	};

	const updateRow = (id: string, patch: Partial<ArchetypeRow>) => {
		setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
	};

	const togglePhaseSchool = (schoolId: string) => {
		setPhaseSchoolIds((prev) =>
			prev.includes(schoolId) ? prev.filter((id) => id !== schoolId) : [...prev, schoolId],
		);
	};

	// ── Validation ──
	const totalCount = rows.reduce((sum, r) => sum + r.count, 0);
	const validRows = rows.filter((r) => r.archetypeId && r.count > 0);

	const canSubmit =
		validRows.length > 0 &&
		Boolean(university?.id) &&
		Boolean(department?.id) &&
		phaseSchoolIds.length > 0 &&
		isReasonValid(reason) &&
		!isSubmitting;

	// ── Submit ──
	const handleSubmit = async () => {
		if (!canSubmit) return;

		setIsSubmitting(true);

		// Build flat list of items to create
		const items: BatchResultItem[] = [];
		for (const row of validRows) {
			for (let i = 0; i < row.count; i++) {
				items.push({
					rowId: row.id,
					archetypeName: archetypeMap.get(row.archetypeId) ?? '—',
					index: i + 1,
					status: 'pending',
				});
			}
		}
		setResults(items);
		setPhase('result');

		// Process sequentially to avoid overwhelming the API
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			const row = validRows.find((r) => r.id === item.rowId);
			if (!row) continue;

			setResults((prev) =>
				prev.map((r, idx) => (idx === i ? { ...r, status: 'creating' as const } : r)),
			);

			try {
				const result = await ghostInjection.createGhost({
					personaArchetypeId: row.archetypeId,
					phaseSchoolIds,
					universityId: university!.id,
					departmentId: department!.id,
					reason: reason.trim(),
				});
				setResults((prev) =>
					prev.map((r, idx) =>
						idx === i ? { ...r, status: 'success' as const, result: result ?? undefined } : r,
					),
				);
			} catch (error) {
				setResults((prev) =>
					prev.map((r, idx) =>
						idx === i ? { ...r, status: 'error' as const, error: getAdminErrorMessage(error) } : r,
					),
				);
			}
		}

		setIsSubmitting(false);
		queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.ghosts() });
		queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.status() });
	};

	const successCount = results.filter((r) => r.status === 'success').length;
	const failCount = results.filter((r) => r.status === 'error').length;

	return (
		<Dialog open={open} onOpenChange={(v) => { if (!isSubmitting) onOpenChange(v); }}>
			<DialogContent className="flex h-[90vh] max-w-4xl flex-col p-0">
				{phase === 'result' ? (
					/* ─── Result phase ─── */
					<div className="flex flex-1 flex-col overflow-hidden">
						<div className="border-b px-6 py-4">
							<h2 className="text-lg font-semibold text-slate-900">
								생성 결과
								{!isSubmitting && (
									<span className="ml-2 text-sm font-normal text-slate-500">
										성공 {successCount} / 실패 {failCount} / 전체 {results.length}
									</span>
								)}
							</h2>
							{isSubmitting && (
								<p className="mt-1 text-sm text-slate-500">
									프로필을 생성하고 있습니다… ({results.filter((r) => r.status !== 'pending').length}/{results.length})
								</p>
							)}
						</div>

						<div className="flex-1 overflow-y-auto px-6 py-4">
							<div className="space-y-2">
								{results.map((item, idx) => (
									<div
										key={idx}
										className={cn(
											'flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors',
											item.status === 'success' && 'border-emerald-200 bg-emerald-50',
											item.status === 'error' && 'border-red-200 bg-red-50',
											item.status === 'creating' && 'border-blue-200 bg-blue-50',
											item.status === 'pending' && 'border-slate-200 bg-slate-50',
										)}
									>
										<div className="flex h-8 w-8 shrink-0 items-center justify-center">
											{item.status === 'pending' && (
												<div className="h-2 w-2 rounded-full bg-slate-300" />
											)}
											{item.status === 'creating' && (
												<Loader2 className="h-5 w-5 animate-spin text-blue-500" />
											)}
											{item.status === 'success' && (
												<CheckCircle2 className="h-5 w-5 text-emerald-500" />
											)}
											{item.status === 'error' && (
												<XCircle className="h-5 w-5 text-red-500" />
											)}
										</div>

										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium text-slate-800">
													{item.archetypeName} #{item.index}
												</span>
												{item.result?.introductionSource === 'ai' && (
													<Badge variant="outline" className="border-violet-200 bg-violet-50 text-[10px] text-violet-700">
														<Sparkles className="mr-0.5 h-2.5 w-2.5" /> AI
													</Badge>
												)}
											</div>
											{item.result && (
												<div className="mt-0.5 text-xs text-slate-600">
													{item.result.name} · 만 {item.result.age}세 · {item.result.mbti ?? '—'}
													{item.result.keywords && item.result.keywords.length > 0 && (
														<span className="ml-1 text-slate-400">
															· {item.result.keywords.slice(0, 3).join(', ')}
															{item.result.keywords.length > 3 && ` 외 ${item.result.keywords.length - 3}개`}
														</span>
													)}
												</div>
											)}
											{item.error && (
												<div className="mt-0.5 text-xs text-red-600">{item.error}</div>
											)}
										</div>
									</div>
								))}
							</div>
						</div>

						<div className="flex items-center justify-end gap-2 border-t px-6 py-4">
							<Button
								variant="outline"
								onClick={() => {
									setPhase('form');
									setResults([]);
								}}
								disabled={isSubmitting}
							>
								추가 생성
							</Button>
							<Button onClick={() => onOpenChange(false)} disabled={isSubmitting}>
								닫기
							</Button>
						</div>
					</div>
				) : (
					/* ─── Form phase ─── */
					<div className="flex flex-1 flex-col overflow-hidden">
						<div className="border-b px-6 py-4">
							<h2 className="text-lg font-semibold text-slate-900">가상 프로필 일괄 생성</h2>
							<p className="mt-1 text-sm text-slate-500">
								공통 설정을 지정하고, 프로필 유형별 생성 수량을 설정하세요. 각 프로필은 랜덤으로 생성됩니다.
							</p>
						</div>

						<div className="flex-1 overflow-y-auto px-6 py-4">
							<div className="grid grid-cols-2 gap-6">
								{/* ── Left: Shared settings ── */}
								<div className="space-y-4">
									<h3 className="text-sm font-semibold text-slate-700">공통 설정</h3>

									<div className="space-y-1">
										<Label>소속 대학 *</Label>
										<Popover open={universityPopoverOpen} onOpenChange={setUniversityPopoverOpen}>
											<PopoverTrigger asChild>
												<Button variant="outline" role="combobox" className="w-full justify-between font-normal">
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
														onChange={(e) => setUniversitySearch(e.target.value)}
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
											onOpenChange={(v) => { if (university) setDepartmentPopoverOpen(v); }}
										>
											<PopoverTrigger asChild>
												<Button variant="outline" role="combobox" disabled={!university} className="w-full justify-between font-normal">
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
										<Label>노출 대상 학교 * ({phaseSchoolIds.length}개)</Label>
										<div className="max-h-32 overflow-y-auto rounded-md border bg-slate-50 p-2">
											{phaseSchoolsQuery.isLoading ? (
												<p className="px-2 py-1 text-xs text-slate-500">불러오는 중…</p>
											) : phaseSchoolItems.length === 0 ? (
												<p className="px-2 py-1 text-xs text-slate-500">
													실험군 학교가 없습니다.
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
																	'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
																	active
																		? 'border-slate-800 bg-slate-800 text-white'
																		: 'border-slate-200 bg-white text-slate-600 hover:border-slate-400',
																)}
															>
																{item.schoolName}
															</button>
														);
													})}
												</div>
											)}
										</div>
									</div>

									<ReasonInput value={reason} onChange={setReason} minLength={10} rows={2} />
								</div>

								{/* ── Right: Archetype rows ── */}
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<h3 className="text-sm font-semibold text-slate-700">
											프로필 유형 / 수량
											<span className="ml-2 font-normal text-slate-400">총 {totalCount}개</span>
										</h3>
										<Button variant="outline" size="sm" onClick={addRow}>
											<Plus className="mr-1 h-3 w-3" /> 유형 추가
										</Button>
									</div>

									<div className="space-y-2">
										{rows.map((row) => (
											<div
												key={row.id}
												className="flex items-center gap-2 rounded-lg border bg-white p-3"
											>
												<div className="flex-1">
													<Select
														value={row.archetypeId}
														onValueChange={(v) => updateRow(row.id, { archetypeId: v })}
													>
														<SelectTrigger className="h-9">
															<SelectValue placeholder="프로필 유형 선택" />
														</SelectTrigger>
														<SelectContent>
															{archetypeItems.map((item) => (
																<SelectItem key={item.archetypeId} value={item.archetypeId}>
																	<div className="flex items-center gap-2">
																		<span>{item.name}</span>
																		<span className="text-xs text-slate-400">
																			{item.traits.ageRange.min}~{item.traits.ageRange.max}세
																		</span>
																	</div>
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</div>

												<div className="flex items-center gap-1">
													<Button
														variant="outline"
														size="icon"
														className="h-9 w-9"
														disabled={row.count <= 1}
														onClick={() => updateRow(row.id, { count: Math.max(1, row.count - 1) })}
													>
														<Minus className="h-3 w-3" />
													</Button>
													<Input
														type="number"
														min={1}
														max={20}
														value={row.count}
														onChange={(e) => {
															const v = Number(e.target.value);
															if (Number.isFinite(v) && v >= 1 && v <= 20) {
																updateRow(row.id, { count: v });
															}
														}}
														className="h-9 w-14 text-center tabular-nums"
													/>
													<Button
														variant="outline"
														size="icon"
														className="h-9 w-9"
														disabled={row.count >= 20}
														onClick={() => updateRow(row.id, { count: Math.min(20, row.count + 1) })}
													>
														<Plus className="h-3 w-3" />
													</Button>
												</div>

												<Button
													variant="ghost"
													size="icon"
													className="h-9 w-9 text-slate-400 hover:text-red-500"
													disabled={rows.length <= 1}
													onClick={() => removeRow(row.id)}
												>
													<XCircle className="h-4 w-4" />
												</Button>
											</div>
										))}
									</div>

									{archetypeItems.length > 0 && validRows.length > 0 && (
										<div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
											<p className="text-xs text-slate-500">미리보기</p>
											<div className="mt-1 space-y-1">
												{validRows.map((row) => {
													const archetype = archetypeItems.find((a) => a.archetypeId === row.archetypeId);
													if (!archetype) return null;
													return (
														<div key={row.id} className="flex items-center justify-between text-sm">
															<span className="text-slate-700">{archetype.name}</span>
															<div className="flex items-center gap-2">
																<span className="text-xs text-slate-400">
																	{archetype.traits.ageRange.min}~{archetype.traits.ageRange.max}세 · MBTI {archetype.traits.mbtiPool.length}종
																</span>
																<Badge variant="secondary" className="tabular-nums">x{row.count}</Badge>
															</div>
														</div>
													);
												})}
											</div>
										</div>
									)}
								</div>
							</div>
						</div>

						<div className="flex items-center justify-between border-t px-6 py-4">
							<p className="text-xs text-slate-500">
								{totalCount}개 프로필이 생성됩니다. AI 소개글 생성으로 프로필당 1~3초 소요될 수 있습니다.
							</p>
							<div className="flex items-center gap-2">
								<Button variant="outline" onClick={() => onOpenChange(false)}>
									취소
								</Button>
								<Button onClick={handleSubmit} disabled={!canSubmit}>
									{totalCount}개 생성
								</Button>
							</div>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
