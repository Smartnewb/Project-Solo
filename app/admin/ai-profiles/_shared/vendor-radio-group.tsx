'use client';

import { Check, Sparkles } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Label } from '@/shared/ui/label';
import { cn } from '@/shared/utils';
import { GHOST_VENDOR_OPTIONS } from './ghost-vendor-options';

interface VendorRadioGroupProps {
	selectedId: string;
	onChange: (id: string) => void;
	label?: string;
	columns?: 1 | 2;
}

export function VendorRadioGroup({
	selectedId,
	onChange,
	label = '이미지 생성 모델 *',
	columns = 2,
}: VendorRadioGroupProps) {
	return (
		<div className="space-y-2">
			<Label className="text-sm font-semibold text-slate-800">{label}</Label>
			<div className={cn('grid gap-2', columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1')}>
				{GHOST_VENDOR_OPTIONS.map((option) => {
					const selected = option.id === selectedId;
					const disabled = option.disabled;
					return (
						<button
							key={option.id}
							type="button"
							disabled={disabled}
							onClick={() => !disabled && onChange(option.id)}
							className={cn(
								'flex items-start gap-3 rounded-lg border p-3 text-left transition-all',
								selected && !disabled
									? 'border-slate-800 bg-slate-50 ring-1 ring-slate-800'
									: 'border-slate-200 bg-white hover:border-slate-400',
								disabled && 'cursor-not-allowed opacity-50',
							)}
						>
							<div
								className={cn(
									'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
									selected && !disabled ? 'border-slate-800 bg-slate-800' : 'border-slate-300',
								)}
							>
								{selected && !disabled && <Check className="h-3 w-3 text-white" />}
							</div>
							<div className="min-w-0 flex-1">
								<div className="flex flex-wrap items-center gap-1.5">
									<span className="text-sm font-semibold text-slate-900">{option.label}</span>
									{option.recommended && (
										<Badge variant="outline" className="border-amber-300 bg-amber-50 text-[10px] text-amber-700">
											<Sparkles className="mr-0.5 h-2.5 w-2.5" /> 권장
										</Badge>
									)}
								</div>
								<p className="mt-0.5 text-xs text-slate-500">{option.subtitle}</p>
								<div className="mt-1.5 flex flex-wrap items-center gap-1">
									<span className="text-[11px] font-medium text-slate-600">{option.pricePerImage}</span>
									{option.badges.map((badge) => (
										<Badge key={badge} variant="secondary" className="text-[10px]">
											{badge}
										</Badge>
									))}
								</div>
							</div>
						</button>
					);
				})}
			</div>
		</div>
	);
}
