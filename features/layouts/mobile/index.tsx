'use client';

import { ReactNode } from 'react';
import { cn } from '@/shared/utils';

interface MobileLayoutProps {
  children: ReactNode;
  className?: string;
}

export default function MobileLayout({ children, className }: MobileLayoutProps) {
  return (
    <div className="flex min-h-screen w-full justify-center bg-white">
      <div className={cn("max-w-[480px] bg-white px-2", className)} style={{
        width: '480px',
      }}>
        {children}
      </div>
    </div>
  );
}
