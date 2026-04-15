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

const ALL = '__all__';

export const AGE_BUCKETS: AgeBucket[] = ['20-22', '23-25', '26-28'];

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
