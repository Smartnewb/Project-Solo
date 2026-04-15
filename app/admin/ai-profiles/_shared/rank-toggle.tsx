'use client';

import { Label } from '@/shared/ui/label';
import { cn } from '@/shared/utils';

interface RankToggleProps<T extends string> {
	options: readonly T[];
	selected: T[];
	onChange: (next: T[]) => void;
	label?: string;
}

export function RankToggle<T extends string>({
	options,
	selected,
	onChange,
	label = '등급',
}: RankToggleProps<T>) {
	const toggle = (rank: T) => {
		if (selected.includes(rank)) onChange(selected.filter((r) => r !== rank));
		else onChange([...selected, rank]);
	};

	return (
		<div className="space-y-1">
			<Label className="text-xs">{label}</Label>
			<div className="flex h-9 items-center gap-1">
				{options.map((rank) => {
					const active = selected.includes(rank);
					return (
						<button
							key={rank}
							type="button"
							onClick={() => toggle(rank)}
							className={cn(
								'rounded-md border px-3 py-1 text-xs font-semibold transition-all',
								active
									? 'border-slate-800 bg-slate-800 text-white'
									: 'border-slate-300 bg-white text-slate-600 hover:border-slate-400',
							)}
						>
							{rank}
						</button>
					);
				})}
			</div>
		</div>
	);
}
