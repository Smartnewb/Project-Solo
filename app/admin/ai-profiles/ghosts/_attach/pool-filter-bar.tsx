'use client';

import { Button } from '@/shared/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/shared/ui/select';
import { ALL_FACET_VALUE } from '../../_shared/age-bucket-select';
import type { ReferencePoolFacets } from '@/app/types/ghost-injection';
import type { PoolFilterState } from './use-ghost-batch-setup';

interface PoolFilterBarProps {
	value: PoolFilterState;
	facets: ReferencePoolFacets | undefined;
	onChange: (next: PoolFilterState) => void;
}

const SORT_OPTIONS: Array<{ value: PoolFilterState['sortBy']; label: string }> = [
	{ value: 'usage_asc', label: '적게 사용' },
	{ value: 'curated_desc', label: '최근 등록' },
];

export function PoolFilterBar({ value, facets, onChange }: PoolFilterBarProps) {
	const moodOpts = facets?.moods ?? [];
	const styleOpts = facets?.styles ?? [];
	const settingOpts = facets?.settings ?? [];

	const update = (patch: Partial<PoolFilterState>) => onChange({ ...value, ...patch });

	return (
		<div className="flex flex-wrap items-center gap-2 border-b bg-slate-50 px-3 py-2">
			<FacetSelect
				placeholder="mood"
				value={value.tagMood}
				options={moodOpts}
				onChange={(v) => update({ tagMood: v })}
			/>
			<FacetSelect
				placeholder="style"
				value={value.tagStyle}
				options={styleOpts}
				onChange={(v) => update({ tagStyle: v })}
			/>
			<FacetSelect
				placeholder="setting"
				value={value.tagSetting}
				options={settingOpts}
				onChange={(v) => update({ tagSetting: v })}
			/>
			<div className="ml-auto flex items-center gap-2">
				<Select
					value={value.sortBy}
					onValueChange={(v) => update({ sortBy: v as PoolFilterState['sortBy'] })}
				>
					<SelectTrigger className="h-8 w-32 text-xs">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{SORT_OPTIONS.map((opt) => (
							<SelectItem key={opt.value} value={opt.value!}>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{value.tagMood || value.tagStyle || value.tagSetting ? (
					<Button
						variant="ghost"
						size="sm"
						className="h-8 text-xs"
						onClick={() => onChange({ sortBy: value.sortBy })}
					>
						초기화
					</Button>
				) : null}
			</div>
		</div>
	);
}

interface FacetSelectProps {
	placeholder: string;
	value: string | undefined;
	options: Array<{ value: string; count: number }>;
	onChange: (next: string | undefined) => void;
}

function FacetSelect({ placeholder, value, options, onChange }: FacetSelectProps) {
	return (
		<Select
			value={value ?? ALL_FACET_VALUE}
			onValueChange={(v) => onChange(v === ALL_FACET_VALUE ? undefined : v)}
		>
			<SelectTrigger className="h-8 w-32 text-xs">
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value={ALL_FACET_VALUE}>전체</SelectItem>
				{options.map((opt) => (
					<SelectItem key={opt.value} value={opt.value}>
						{opt.value} ({opt.count})
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
