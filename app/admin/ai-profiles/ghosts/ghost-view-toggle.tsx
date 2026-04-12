'use client';

import { LayoutGrid, Table as TableIcon } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/utils';

export type GhostView = 'table' | 'card';

interface GhostViewToggleProps {
	value: GhostView;
	onChange: (next: GhostView) => void;
}

export function GhostViewToggle({ value, onChange }: GhostViewToggleProps) {
	return (
		<div className="inline-flex items-center rounded-md border bg-white p-0.5">
			<Button
				variant="ghost"
				size="sm"
				className={cn(
					'h-7 px-2 text-xs',
					value === 'table' ? 'bg-slate-900 text-white hover:bg-slate-900 hover:text-white' : 'text-slate-600',
				)}
				onClick={() => onChange('table')}
			>
				<TableIcon className="mr-1 h-3.5 w-3.5" /> 테이블
			</Button>
			<Button
				variant="ghost"
				size="sm"
				className={cn(
					'h-7 px-2 text-xs',
					value === 'card' ? 'bg-slate-900 text-white hover:bg-slate-900 hover:text-white' : 'text-slate-600',
				)}
				onClick={() => onChange('card')}
			>
				<LayoutGrid className="mr-1 h-3.5 w-3.5" /> 카드
			</Button>
		</div>
	);
}
