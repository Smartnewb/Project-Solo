'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type {
	CandidateListQuery,
	GhostCandidateStatus,
} from '@/app/types/ghost-injection';
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

interface CandidateFiltersProps {
	query: CandidateListQuery;
	onChange: (next: CandidateListQuery) => void;
	disabled?: boolean;
}

const ALL = '__all__';
const LIMIT_OPTIONS = [20, 50, 100] as const;

export function CandidateFilters({ query, onChange, disabled }: CandidateFiltersProps) {
	const [weekInput, setWeekInput] = useState(query.weekYear ?? '');

	useEffect(() => {
		setWeekInput(query.weekYear ?? '');
	}, [query.weekYear]);

	const commitWeek = () => {
		const trimmed = weekInput.trim();
		const next = trimmed.length > 0 ? trimmed : undefined;
		if (next === query.weekYear) return;
		onChange({ ...query, weekYear: next, page: 1 });
	};

	const handleReset = () => {
		setWeekInput('');
		onChange({ page: 1, limit: query.limit });
	};

	const hasFilter = Boolean(query.status || query.weekYear);

	return (
		<div className="rounded-md border bg-white p-4">
			<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
				<div className="space-y-1">
					<Label className="text-xs">상태</Label>
					<Select
						value={query.status ?? ALL}
						disabled={disabled}
						onValueChange={(value) =>
							onChange({
								...query,
								status: value === ALL ? undefined : (value as GhostCandidateStatus),
								page: 1,
							})
						}
					>
						<SelectTrigger className="h-9">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL}>전체</SelectItem>
							<SelectItem value="PENDING">대기</SelectItem>
							<SelectItem value="QUEUED">발송 예정</SelectItem>
							<SelectItem value="SENT">발송 완료</SelectItem>
							<SelectItem value="CANCELED">취소됨</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-1">
					<Label className="text-xs">주차 (예: 2026-W17)</Label>
					<Input
						value={weekInput}
						onChange={(event) => setWeekInput(event.target.value)}
						onBlur={commitWeek}
						onKeyDown={(event) => {
							if (event.key === 'Enter') {
								event.preventDefault();
								commitWeek();
							}
						}}
						placeholder="2026-W17"
						className="h-9"
						disabled={disabled}
					/>
				</div>

				<div className="space-y-1">
					<Label className="text-xs">페이지 크기</Label>
					<Select
						value={String(query.limit ?? 20)}
						disabled={disabled}
						onValueChange={(value) =>
							onChange({ ...query, limit: Number(value), page: 1 })
						}
					>
						<SelectTrigger className="h-9">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{LIMIT_OPTIONS.map((opt) => (
								<SelectItem key={opt} value={String(opt)}>
									{opt}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{hasFilter ? (
				<div className="mt-3 flex items-center justify-end">
					<Button variant="ghost" size="sm" onClick={handleReset} disabled={disabled}>
						<X className="mr-1 h-3 w-3" /> 필터 초기화
					</Button>
				</div>
			) : null}
		</div>
	);
}
