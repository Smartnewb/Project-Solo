'use client';

import { ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/ui/collapsible';

interface Props {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function Section({ title, description, defaultOpen = false, children }: Props) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className="rounded-md border border-slate-200"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium hover:bg-slate-50">
        <span>{title}</span>
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 border-t border-slate-200 p-3">
        {description ? (
          <p className="text-xs text-slate-500">{description}</p>
        ) : null}
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
