'use client';

import { ModalProvider } from '@/shared/ui/modal/context';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ModalProvider>
      {children}
    </ModalProvider>
  );
}
