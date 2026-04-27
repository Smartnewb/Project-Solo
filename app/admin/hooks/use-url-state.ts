'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

export function useUrlState() {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();

  const get = useCallback(
    (key: string, fallback = ''): string => params.get(key) ?? fallback,
    [params],
  );

  const getNumber = useCallback(
    (key: string, fallback: number): number => {
      const v = params.get(key);
      const n = v ? Number(v) : NaN;
      return Number.isFinite(n) ? n : fallback;
    },
    [params],
  );

  const setMany = useCallback(
    (next: Record<string, string | number | null | undefined>) => {
      const sp = new URLSearchParams(params.toString());
      Object.entries(next).forEach(([k, v]) => {
        if (v === null || v === undefined || v === '') sp.delete(k);
        else sp.set(k, String(v));
      });
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [params, pathname, router],
  );

  return { get, getNumber, setMany };
}
