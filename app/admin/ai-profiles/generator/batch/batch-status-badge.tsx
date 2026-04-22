'use client';

import { Loader2 } from 'lucide-react';
import type { BatchJobState } from '@/app/types/ai-profile-generator';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/utils/index';
import { BATCH_STATE_LABEL } from '../_shared/status';

const STATUS_CLASS: Record<BatchJobState, string> = {
  waiting:
    'border-transparent bg-slate-100 text-slate-700 hover:bg-slate-100',
  active: 'border-transparent bg-sky-100 text-sky-700 hover:bg-sky-100',
  completed:
    'border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  delayed:
    'border-transparent bg-amber-100 text-amber-700 hover:bg-amber-100',
  paused:
    'border-slate-300 bg-transparent text-slate-600 hover:bg-slate-50',
  failed: 'border-transparent bg-rose-100 text-rose-700 hover:bg-rose-100',
  unknown:
    'border-slate-300 bg-transparent text-slate-500 hover:bg-slate-50',
};

interface Props {
  status: BatchJobState;
  className?: string;
}

export function BatchStatusBadge({ status, className }: Props) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1',
        STATUS_CLASS[status],
        className,
      )}
    >
      {status === 'active' ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : null}
      <span>{BATCH_STATE_LABEL[status]}</span>
    </Badge>
  );
}
