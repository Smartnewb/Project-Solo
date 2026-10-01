"use client";
import { Button } from "@heroui/react";

import { ChevronLeft, ChevronRight } from "lucide-react";

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
        전체 <span className="font-semibold text-slate-800">{total}</span>개 ·
        Page {page} / {totalPages}
      </div>
      <div className="flex items-center gap-1">
        <Button
          onClick={onPrev}
          isDisabled={disabled || page <= 1}
          variant={"outline"}
          size={"sm"}
        >
          <ChevronLeft className="h-4 w-4" />
          이전
        </Button>
        <Button
          onClick={onNext}
          isDisabled={disabled || page >= totalPages}
          variant={"outline"}
          size={"sm"}
        >
          다음 <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
