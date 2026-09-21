'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/ui/collapsible';

interface Props {
  label: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function DomainGroup({ label, children, defaultOpen = true }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="space-y-2">
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-left text-sm font-semibold text-slate-800 hover:bg-slate-100">
        {open ? (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-500" />
        )}
        <span>{label}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3">{children}</CollapsibleContent>
    </Collapsible>
  );
}
