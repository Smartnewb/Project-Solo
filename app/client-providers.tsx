'use client';

import { ModalProvider } from '@/shared/ui/modal/context';

// HeroUI styling and brand tokens are loaded once by app/globals.css.
export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <ModalProvider>{children}</ModalProvider>;
}
