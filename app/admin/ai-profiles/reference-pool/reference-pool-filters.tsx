'use client';

import { X } from 'lucide-react';
import type { AgeBucket, ListReferencePoolQuery } from '@/app/types/ghost-injection';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/shared/ui/select';
import { AGE_BUCKETS } from '../_shared/age-bucket-select';

interface ReferencePoolFiltersProps {
	query: ListReferencePoolQuery;
	onChange: (query: ListReferencePoolQuery) => void;
}

const ALL = '__all__';
const ACTIVE_ALL = 'all';
const ACTIVE_TRUE = 'active';
const ACTIVE_FALSE = 'inactive';

function activeToString(value: boolean | undefined): string {
	if (value === undefined) return ACTIVE_ALL;
	return value ? ACTIVE_TRUE : ACTIVE_FALSE;
}

function activeFromString(value: string): boolean | undefined {
	if (value === ACTIVE_TRUE) return true;
	if (value === ACTIVE_FALSE) return false;
	return undefined;
}

export function ReferencePoolFilters({ query, onChange }: ReferencePoolFiltersProps) {
	const hasFilter = query.isActive !== undefined || query.ageBucket !== undefined;

	const reset = () => onChange({ limit: query.limit, offset: 0 });

	return (
		<div className="rounded-md border bg-white p-4">
			<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
				<div className="space-y-1">
					<Label className="text-xs">상태</Label>
					<Select
						value={activeToString(query.isActive)}
						onValueChange={(v) =>
							onChange({ ...query, isActive: activeFromString(v), offset: 0 })
						}
					>
						<SelectTrigger className="h-9">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ACTIVE_ALL}>전체</SelectItem>
							<SelectItem value={ACTIVE_TRUE}>활성만</SelectItem>
							<SelectItem value={ACTIVE_FALSE}>비활성만</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-1">
					<Label className="text-xs">연령대</Label>
					<Select
						value={query.ageBucket ?? ALL}
						onValueChange={(v) =>
							onChange({
								...query,
								ageBucket: v === ALL ? undefined : (v as AgeBucket),
								offset: 0,
							})
						}
					>
						<SelectTrigger className="h-9">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL}>전체</SelectItem>
							{AGE_BUCKETS.map((bucket) => (
								<SelectItem key={bucket} value={bucket}>
									{bucket}세
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{hasFilter ? (
				<div className="mt-3 flex items-center justify-end">
					<Button variant="ghost" size="sm" onClick={reset}>
						<X className="mr-1 h-3 w-3" /> 필터 초기화
					</Button>
				</div>
			) : null}
		</div>
	);
}
