'use client';

import { Loader2 } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/utils';
import type { AiProfileDomainStatus } from '@/app/types/ai-profile-generator';

interface Props {
  status: AiProfileDomainStatus;
  className?: string;
}

const STATUS_LABEL: Record<AiProfileDomainStatus, string> = {
  empty: '비어있음',
  generating: '생성 중',
  ready: '완료',
  stale: '오래됨',
  blocked: '차단됨',
  failed: '실패',
};

const STATUS_CLASS: Record<AiProfileDomainStatus, string> = {
  empty: 'bg-slate-100 text-slate-600 border-slate-200',
  generating: 'bg-sky-100 text-sky-700 border-sky-200',
  ready: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  stale: 'bg-amber-100 text-amber-700 border-amber-200',
  blocked: 'bg-red-100 text-red-700 border-red-200',
  failed: 'bg-rose-100 text-rose-700 border-rose-200',
};

export function DomainStatusBadge({ status, className }: Props) {
  return (
    <Badge
      variant="outline"
      className={cn('gap-1', STATUS_CLASS[status], className)}
    >
      {status === 'generating' ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : null}
      {STATUS_LABEL[status]}
    </Badge>
  );
}
