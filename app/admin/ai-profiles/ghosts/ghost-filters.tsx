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

	const hasFilter = Boolean(
		query.status || query.schoolId || query.q,
	);

	return (
		<div className="rounded-md border bg-white p-4">
			<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
