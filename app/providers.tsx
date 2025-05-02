'use client';

import { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthProvider>
        {children}
      </AdminAuthProvider>
    </QueryClientProvider>
  );
}