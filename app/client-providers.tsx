'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ModalProvider } from '@/shared/ui/modal/context';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ModalProvider>
        {children}
      </ModalProvider>
    </AuthProvider>
  );
}
