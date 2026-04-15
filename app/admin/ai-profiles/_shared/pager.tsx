'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/ui/button';

interface PagerProps {
	page: number;
	totalPages: number;
	total: number;
	totalUnit?: string;
	disabled?: boolean;
	onPrev: () => void;
	onNext: () => void;
}

export function Pager({
	page,
	totalPages,
	total,
	totalUnit = '건',
	disabled,
	onPrev,
	onNext,
}: PagerProps) {
	return (
		<div className="flex items-center justify-between text-xs text-slate-500">
			<div>
				전체 <span className="font-semibold text-slate-800">{total}</span>
				{totalUnit} · Page {page} / {totalPages}
			</div>
			<div className="flex items-center gap-1">
				<Button
					variant="outline"
					size="sm"
					disabled={page <= 1 || disabled}
					onClick={onPrev}
				>
					<ChevronLeft className="h-4 w-4" /> 이전
				</Button>
				<Button
					variant="outline"
					size="sm"
					disabled={page >= totalPages || disabled}
					onClick={onNext}
				>
					다음 <ChevronRight className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}
