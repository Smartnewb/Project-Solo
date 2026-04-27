'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from '@/shared/hooks/use-debounce';

export const CONTENT_URL_KEYS = {
  category: 'cat',
  status: 'status',
  search: 'q',
  page: 'p',
  rowsPerPage: 'rpp',
} as const;

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

type SetManyFn = (next: Record<string, string | number | null | undefined>) => void;

export function useDebouncedUrlSearch(
  urlValue: string,
  setMany: SetManyFn,
  key: string = CONTENT_URL_KEYS.search,
  delay: number = 300,
) {
  const [input, setInput] = useState(urlValue);
  const debounced = useDebounce(input, delay);

  useEffect(() => {
    if (urlValue !== input && urlValue !== debounced) {
      setInput(urlValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlValue]);

  useEffect(() => {
    if (debounced !== urlValue) {
      setMany({ [key]: debounced || null, [CONTENT_URL_KEYS.page]: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return [input, setInput] as const;
}
