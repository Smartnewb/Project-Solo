'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/ui/button';

interface Props {
  total: number;
  page: number;
  totalPages: number;
  disabled?: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function PaginationFooter({
  total,
  page,
  totalPages,
  disabled,
  onPrev,
  onNext,
}: Props) {
  return (
    <div className="flex items-center justify-between text-xs text-slate-500">
      <div>
        전체 <span className="font-semibold text-slate-800">{total}</span>개 · Page {page} / {totalPages}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" disabled={disabled || page <= 1} onClick={onPrev}>
          <ChevronLeft className="h-4 w-4" /> 이전
        </Button>
        <Button variant="outline" size="sm" disabled={disabled || page >= totalPages} onClick={onNext}>
          다음 <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
