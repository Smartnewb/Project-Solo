'use client';

import { Suspense } from 'react';
import { MobileLayout } from '@/features/layouts';

export default function PurchaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MobileLayout>
      <Suspense fallback={<div>로딩중...</div>}>
        {children}
      </Suspense>
    </MobileLayout>
  );
}