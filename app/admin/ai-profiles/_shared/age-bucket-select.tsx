'use client';

import type { AgeBucket } from '@/app/types/ghost-injection';
import { Label } from '@/shared/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/shared/ui/select';

export const ALL_FACET_VALUE = '__all__';
const ALL = ALL_FACET_VALUE;

export const AGE_BUCKETS: AgeBucket[] = ['20-22', '23-25', '26-28'];

export function ageBucketToHint(
	bucket: AgeBucket | null | undefined,
): { min: number; max: number } | undefined {
	if (!bucket) return undefined;
	const [min, max] = bucket.split('-').map(Number);
	if (!Number.isFinite(min) || !Number.isFinite(max)) return undefined;
	return { min, max };
}

interface AgeBucketSelectProps {
	value: AgeBucket | undefined;
	onChange: (value: AgeBucket | undefined) => void;
	allowAll?: boolean;
	label?: string;
	className?: string;
	disabled?: boolean;
}

export function AgeBucketSelect({
	value,
	onChange,
	allowAll = true,
	label = '연령대',
	className,
	disabled,
}: AgeBucketSelectProps) {
	return (
		<div className={className}>
			{label ? <Label className="text-xs">{label}</Label> : null}
			<Select
				value={value ?? (allowAll ? ALL : AGE_BUCKETS[0])}
				onValueChange={(v) => onChange(v === ALL ? undefined : (v as AgeBucket))}
				disabled={disabled}
			>
				<SelectTrigger className="h-9">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{allowAll ? <SelectItem value={ALL}>전체</SelectItem> : null}
					{AGE_BUCKETS.map((bucket) => (
						<SelectItem key={bucket} value={bucket}>
							{bucket}세
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
