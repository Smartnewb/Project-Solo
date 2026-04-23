'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { universities } from '@/app/services/admin';
import type {
	GhostAccountStatus,
	GhostListQuery,
} from '@/app/types/ghost-injection';
import { useDebounce } from '@/shared/hooks';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/shared/ui/select';

interface GhostFiltersProps {
	query: GhostListQuery;
	onChange: (query: GhostListQuery) => void;
}

const ALL = '__all__';

export function GhostFilters({ query, onChange }: GhostFiltersProps) {
	const [qInput, setQInput] = useState(query.q ?? '');
	const [schoolSearch, setSchoolSearch] = useState('');
	const debouncedSchoolSearch = useDebounce(schoolSearch, 300);

	useEffect(() => {
		setQInput(query.q ?? '');
	}, [query.q]);

	const schoolsQuery = useQuery({
		queryKey: ['admin', 'universities', 'list', debouncedSchoolSearch],
		queryFn: async () => {
			const result = await universities.getList({
				page: 1,
				limit: 50,
				name: debouncedSchoolSearch || undefined,
				isActive: true,
			});
			return result as { items: Array<{ id: string; name: string }> };
		},
		staleTime: 5 * 60 * 1000,
	});

	const schoolItems = schoolsQuery.data?.items ?? [];

	const selectedSchoolName = schoolItems.find((item) => item.id === query.schoolId)?.name;

	const handleSearchSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		onChange({ ...query, q: qInput.trim() || undefined, page: 1 });
	};

	const handleReset = () => {
		setQInput('');
		setSchoolSearch('');
		onChange({ page: 1, limit: query.limit });
	};

	const photoQuickFilter: string =
		query.maxPhotoCount === 0
			? 'none'
			: query.minPhotoCount === 1 && query.maxPhotoCount === 2
				? 'partial'
				: query.minPhotoCount === 3
					? 'full'
					: 'all';

	const photoFilterValue =
		query.maxPhotoCount === 0
			? 'none'
			: query.minPhotoCount !== undefined
				? `min-${query.minPhotoCount}`
				: ALL;

	const hasFilter = Boolean(
		query.status ||
			query.schoolId ||
			query.q ||
			query.minPhotoCount !== undefined ||
			query.maxPhotoCount !== undefined,
	);

	const QUICK_CHIPS = [
		{ id: 'none', label: '사진 없음', color: 'red' as const },
		{ id: 'partial', label: '부분 실패 (1~2장)', color: 'amber' as const },
		{ id: 'full', label: '정상 (3장)', color: 'green' as const },
	] as const;

	const applyQuickChip = (chipId: typeof QUICK_CHIPS[number]['id'] | 'all') => {
		if (chipId === 'none') {
			onChange({ ...query, minPhotoCount: undefined, maxPhotoCount: 0, page: 1 });
		} else if (chipId === 'partial') {
			onChange({ ...query, minPhotoCount: 1, maxPhotoCount: 2, page: 1 });
		} else if (chipId === 'full') {
			onChange({ ...query, minPhotoCount: 3, maxPhotoCount: undefined, page: 1 });
		} else {
			onChange({ ...query, minPhotoCount: undefined, maxPhotoCount: undefined, page: 1 });
		}
	};

	const chipColorClass: Record<'red' | 'amber' | 'green', { active: string; inactive: string }> = {
		red: {
			active: 'bg-red-100 border-red-400 text-red-700',
			inactive: 'border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-600',
		},
		amber: {
			active: 'bg-amber-100 border-amber-400 text-amber-700',
			inactive: 'border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-600',
		},
		green: {
			active: 'bg-green-100 border-green-400 text-green-700',
			inactive: 'border-slate-200 text-slate-600 hover:border-green-300 hover:text-green-600',
		},
	};

	return (
		<div className="rounded-md border bg-white p-4">
			<div className="mb-3 flex flex-wrap items-center gap-1.5">
				<span className="text-xs font-medium text-slate-500">빠른 필터:</span>
				{QUICK_CHIPS.map((chip) => {
					const isActive = photoQuickFilter === chip.id;
					const colors = chipColorClass[chip.color];
					return (
						<button
							key={chip.id}
							type="button"
							onClick={() => applyQuickChip(isActive ? 'all' : chip.id)}
							className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${isActive ? colors.active : colors.inactive}`}
						>
							{chip.label}
						</button>
					);
				})}
				{photoQuickFilter !== 'all' && (
					<button
						type="button"
						onClick={() => applyQuickChip('all')}
						className="text-xs text-slate-400 underline hover:text-slate-600"
					>
						해제
					</button>
				)}
			</div>

			<div className="grid grid-cols-1 gap-3 md:grid-cols-4">
				<div className="space-y-1">
					<Label className="text-xs">상태</Label>
					<Select
						value={query.status ?? ALL}
						onValueChange={(value) =>
							onChange({
								...query,
								status: value === ALL ? undefined : (value as GhostAccountStatus),
								page: 1,
							})
						}
					>
						<SelectTrigger className="h-9">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL}>전체</SelectItem>
							<SelectItem value="ACTIVE">활성</SelectItem>
							<SelectItem value="INACTIVE">비활성</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-1">
					<Label className="text-xs">학교</Label>
					<Select
						value={query.schoolId ?? ALL}
						onValueChange={(value) =>
							onChange({
								...query,
								schoolId: value === ALL ? undefined : value,
								page: 1,
							})
						}
					>
						<SelectTrigger className="h-9">
							<SelectValue placeholder={selectedSchoolName ?? '전체'} />
						</SelectTrigger>
						<SelectContent>
							<div className="border-b p-1">
								<Input
									placeholder="학교명 검색"
									value={schoolSearch}
									onChange={(event) => setSchoolSearch(event.target.value)}
									className="h-8"
									onKeyDown={(event) => event.stopPropagation()}
								/>
							</div>
							<SelectItem value={ALL}>전체</SelectItem>
							{schoolItems.map((item) => (
								<SelectItem key={item.id} value={item.id}>
									{item.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-1">
					<Label className="text-xs">사진</Label>
					<Select
						value={photoFilterValue}
						onValueChange={(value) => {
							if (value === ALL) {
								onChange({
									...query,
									minPhotoCount: undefined,
									maxPhotoCount: undefined,
									page: 1,
								});
							} else if (value === 'none') {
								onChange({
									...query,
									minPhotoCount: undefined,
									maxPhotoCount: 0,
									page: 1,
								});
							} else {
								const min = Number(value.replace('min-', ''));
								onChange({
									...query,
									minPhotoCount: min,
									maxPhotoCount: undefined,
									page: 1,
								});
							}
						}}
					>
						<SelectTrigger className="h-9">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL}>전체</SelectItem>
							<SelectItem value="none">사진 없음 (0장)</SelectItem>
							<SelectItem value="min-1">1장 이상</SelectItem>
							<SelectItem value="min-3">3장 (완성)</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-1">
					<Label className="text-xs">검색 (이름/소개)</Label>
					<form onSubmit={handleSearchSubmit} className="flex gap-1">
						<Input
							value={qInput}
							onChange={(event) => setQInput(event.target.value)}
							placeholder="이름 또는 자기소개"
							className="h-9"
						/>
					</form>
				</div>
			</div>

			{hasFilter ? (
				<div className="mt-3 flex items-center justify-end">
					<Button variant="ghost" size="sm" onClick={handleReset}>
						<X className="mr-1 h-3 w-3" /> 필터 초기화
					</Button>
				</div>
			) : null}
		</div>
	);
}
