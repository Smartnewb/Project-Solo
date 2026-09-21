'use client';

import { Textarea } from '@/shared/ui/textarea';
import { cn } from '@/shared/utils';

interface ReasonInputProps {
	value: string;
	onChange: (next: string) => void;
	minLength?: number;
	placeholder?: string;
	error?: string;
	label?: string;
	disabled?: boolean;
	rows?: number;
}

export function ReasonInput({
	value,
	onChange,
	minLength = 10,
	placeholder = '변경 사유를 입력해주세요 (감사 로그에 기록됩니다)',
	error,
	label = '변경 사유',
	disabled,
	rows = 3,
}: ReasonInputProps) {
	const tooShort = value.length < minLength;

	return (
		<div className="flex flex-col gap-1">
			<label className="text-xs font-medium text-slate-600">
				{label}
				<span className="ml-1 text-red-500">*</span>
			</label>
			<Textarea
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				disabled={disabled}
				rows={rows}
				className={cn(error ? 'border-red-500 focus-visible:ring-red-500' : undefined)}
			/>
			<div className="flex items-center justify-between text-xs">
				<span
					className={cn(
						tooShort ? 'text-red-500' : 'text-slate-500',
						'tabular-nums',
					)}
				>
					{value.length}/{minLength}+
				</span>
				{error ? <span className="text-red-500">{error}</span> : null}
			</div>
		</div>
	);
}

export function isReasonValid(value: string, minLength = 10): boolean {
	return value.trim().length >= minLength;
}
