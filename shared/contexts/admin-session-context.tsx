'use client';

import { createContext, useContext } from 'react';

export interface AdminSession {
  user: {
    id: string;
    email: string;
    roles: string[];
  };
  selectedCountry: string;
  issuedAt: number;
}

interface AdminSessionContextValue {
  session: AdminSession | null;
  isLoading: boolean;
  error: string | null;
  changeCountry: (country: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminSessionContext = createContext<AdminSessionContextValue | null>(null);

export function useAdminSession() {
  const ctx = useContext(AdminSessionContext);
  if (!ctx) throw new Error('useAdminSession must be used within AdminSessionProvider');
  return ctx;
}

export { AdminSessionContext };
