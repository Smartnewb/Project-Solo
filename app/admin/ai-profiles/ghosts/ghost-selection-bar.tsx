'use client';

import { Trash2, X } from 'lucide-react';
import { Button } from '@/shared/ui/button';

interface GhostSelectionBarProps {
	count: number;
	onClear: () => void;
	onBulkDelete: () => void;
}

export function GhostSelectionBar({ count, onClear, onBulkDelete }: GhostSelectionBarProps) {
	if (count === 0) return null;

	return (
		<div className="sticky top-0 z-20 flex items-center justify-between rounded-md border border-slate-300 bg-slate-900 px-4 py-2 text-white shadow-md">
			<div className="flex items-center gap-3">
				<span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold tabular-nums">
					{count}
				</span>
				<span className="text-sm">개 선택됨</span>
				<button
					type="button"
					onClick={onClear}
					className="flex items-center gap-1 text-xs text-slate-300 underline hover:text-white"
				>
					<X className="h-3 w-3" />
					선택 해제
				</button>
			</div>
			<div className="flex items-center gap-2">
				<Button variant="destructive" size="sm" onClick={onBulkDelete}>
					<Trash2 className="mr-1 h-3.5 w-3.5" />
					선택 항목 삭제
				</Button>
			</div>
		</div>
	);
}
